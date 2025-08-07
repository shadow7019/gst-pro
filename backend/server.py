from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import logging
import sqlite3
import aiosqlite
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, date
import uuid
from enum import Enum
import json
import sys
import asyncio

# Get the directory where the executable or script is located
if getattr(sys, 'frozen', False):
    # Running as compiled executable
    BASE_DIR = Path(sys.executable).parent
else:
    # Running as script
    BASE_DIR = Path(__file__).parent

# Database path
DB_PATH = BASE_DIR / "gst_data.db"

# Database connection - Using SQLite with aiosqlite
class Database:
    def __init__(self, db_path: str):
        self.db_path = db_path
        self.connection = None
    
    async def connect(self):
        """Initialize database connection and create tables"""
        self.connection = await aiosqlite.connect(self.db_path)
        await self.create_tables()
    
    async def create_tables(self):
        """Create necessary tables"""
        await self.connection.execute('''
            CREATE TABLE IF NOT EXISTS expenses (
                id TEXT PRIMARY KEY,
                date TEXT NOT NULL,
                description TEXT NOT NULL,
                category TEXT NOT NULL,
                base_amount REAL NOT NULL,
                vendor_name TEXT,
                vendor_state TEXT,
                user_state TEXT,
                gst_calculation TEXT NOT NULL,
                invoice_number TEXT,
                is_gst_applicable BOOLEAN DEFAULT TRUE,
                created_at TEXT NOT NULL
            )
        ''')
        
        await self.connection.execute('''
            CREATE TABLE IF NOT EXISTS income (
                id TEXT PRIMARY KEY,
                date TEXT NOT NULL,
                description TEXT NOT NULL,
                base_amount REAL NOT NULL,
                client_name TEXT,
                client_state TEXT,
                user_state TEXT,
                gst_calculation TEXT NOT NULL,
                invoice_number TEXT,
                is_gst_applicable BOOLEAN DEFAULT TRUE,
                created_at TEXT NOT NULL
            )
        ''')
        
        await self.connection.execute('''
            CREATE TABLE IF NOT EXISTS tax_consultations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                query TEXT NOT NULL,
                response TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                user_context TEXT
            )
        ''')
        
        await self.connection.commit()
    
    async def close(self):
        """Close database connection"""
        if self.connection:
            await self.connection.close()

# Initialize database
db = Database(str(DB_PATH))

# Create the main app
app = FastAPI(title="GST Automation Platform", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Enums
class ExpenseCategory(str, Enum):
    OFFICE_RENT = "office_rent"
    EQUIPMENT = "equipment"
    TRAVEL = "travel"
    MEALS = "meals"
    SOFTWARE = "software"
    MARKETING = "marketing"
    PROFESSIONAL_SERVICES = "professional_services"
    UTILITIES = "utilities"
    OFFICE_SUPPLIES = "office_supplies"
    OTHER = "other"

class TransactionType(str, Enum):
    INCOME = "income"
    EXPENSE = "expense"

class GSTRate(str, Enum):
    ZERO = "0"
    FIVE = "5"
    TWELVE = "12"
    EIGHTEEN = "18"
    TWENTY_EIGHT = "28"

# Models
class GSTCalculation(BaseModel):
    base_amount: float
    gst_rate: float
    cgst: float = 0.0
    sgst: float = 0.0
    igst: float = 0.0
    total_gst: float = 0.0
    total_amount: float = 0.0
    is_interstate: bool = False

class Expense(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    date: date
    description: str
    category: ExpenseCategory
    base_amount: float
    vendor_name: str = ""
    vendor_state: str = ""
    user_state: str = "Karnataka"  # Default state
    gst_calculation: GSTCalculation
    invoice_number: Optional[str] = None
    is_gst_applicable: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ExpenseCreate(BaseModel):
    date: date
    description: str
    category: ExpenseCategory
    base_amount: float
    vendor_name: str = ""
    vendor_state: str = ""
    user_state: str = "Karnataka"
    invoice_number: Optional[str] = None
    is_gst_applicable: bool = True

class Income(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    date: date
    description: str
    base_amount: float
    client_name: str = ""
    client_state: str = ""
    user_state: str = "Karnataka"
    gst_calculation: GSTCalculation
    invoice_number: Optional[str] = None
    is_gst_applicable: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class IncomeCreate(BaseModel):
    date: date
    description: str
    base_amount: float
    client_name: str = ""
    client_state: str = ""
    user_state: str = "Karnataka"
    invoice_number: Optional[str] = None
    is_gst_applicable: bool = True

class GSTSummary(BaseModel):
    total_sales: float = 0.0
    total_purchases: float = 0.0
    output_gst: float = 0.0
    input_tax_credit: float = 0.0
    net_gst_liability: float = 0.0
    cgst_liability: float = 0.0
    sgst_liability: float = 0.0
    igst_liability: float = 0.0

class TaxAdviceRequest(BaseModel):
    query: str
    user_context: Optional[Dict[str, Any]] = None

class TaxAdviceResponse(BaseModel):
    advice: str
    session_id: str

# GST Calculation Logic
def get_gst_rate_for_category(category: ExpenseCategory) -> float:
    """Get GST rate based on expense category"""
    gst_rates = {
        ExpenseCategory.OFFICE_RENT: 0.0,  # Rent is typically GST exempt
        ExpenseCategory.EQUIPMENT: 18.0,
        ExpenseCategory.TRAVEL: 5.0,  # Transportation
        ExpenseCategory.MEALS: 5.0,  # Food items
        ExpenseCategory.SOFTWARE: 18.0,
        ExpenseCategory.MARKETING: 18.0,
        ExpenseCategory.PROFESSIONAL_SERVICES: 18.0,
        ExpenseCategory.UTILITIES: 18.0,
        ExpenseCategory.OFFICE_SUPPLIES: 18.0,
        ExpenseCategory.OTHER: 18.0
    }
    return gst_rates.get(category, 18.0)

def calculate_gst(base_amount: float, user_state: str, vendor_state: str, category: ExpenseCategory = None, is_income: bool = False) -> GSTCalculation:
    """Calculate GST based on interstate/intrastate transaction"""
    if category:
        gst_rate = get_gst_rate_for_category(category)
    else:
        gst_rate = 18.0  # Default for services
    
    is_interstate = user_state.lower() != vendor_state.lower()
    
    if gst_rate == 0.0:
        return GSTCalculation(
            base_amount=base_amount,
            gst_rate=gst_rate,
            total_amount=base_amount,
            is_interstate=is_interstate
        )
    
    total_gst = (base_amount * gst_rate) / 100
    
    if is_interstate:
        # Interstate - IGST
        return GSTCalculation(
            base_amount=base_amount,
            gst_rate=gst_rate,
            igst=total_gst,
            total_gst=total_gst,
            total_amount=base_amount + total_gst,
            is_interstate=True
        )
    else:
        # Intrastate - CGST + SGST
        cgst = total_gst / 2
        sgst = total_gst / 2
        return GSTCalculation(
            base_amount=base_amount,
            gst_rate=gst_rate,
            cgst=cgst,
            sgst=sgst,
            total_gst=total_gst,
            total_amount=base_amount + total_gst,
            is_interstate=False
        )

# API Routes
@api_router.get("/")
async def root():
    return {"message": "GST Automation Platform API"}

@api_router.post("/expenses", response_model=Expense)
async def create_expense(expense_data: ExpenseCreate):
    try:
        gst_calc = calculate_gst(
            expense_data.base_amount,
            expense_data.user_state,
            expense_data.vendor_state,
            expense_data.category
        )
        
        expense = Expense(
            **expense_data.dict(),
            gst_calculation=gst_calc
        )
        
        # Convert to dict and handle date serialization
        expense_dict = expense.dict()
        expense_dict['date'] = expense_dict['date'].isoformat() if hasattr(expense_dict['date'], 'isoformat') else expense_dict['date']
        expense_dict['created_at'] = expense_dict['created_at'].isoformat() if hasattr(expense_dict['created_at'], 'isoformat') else expense_dict['created_at']
        expense_dict['gst_calculation'] = json.dumps(expense_dict['gst_calculation'])
        
        # Insert into SQLite database
        await db.connection.execute('''
            INSERT INTO expenses (id, date, description, category, base_amount, vendor_name, vendor_state, 
                                user_state, gst_calculation, invoice_number, is_gst_applicable, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            expense_dict['id'], expense_dict['date'], expense_dict['description'], 
            expense_dict['category'], expense_dict['base_amount'], expense_dict['vendor_name'],
            expense_dict['vendor_state'], expense_dict['user_state'], expense_dict['gst_calculation'],
            expense_dict['invoice_number'], expense_dict['is_gst_applicable'], expense_dict['created_at']
        ))
        await db.connection.commit()
        
        return expense
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/expenses", response_model=List[Expense])
async def get_expenses():
    try:
        cursor = await db.connection.execute('SELECT * FROM expenses ORDER BY date DESC LIMIT 1000')
        rows = await cursor.fetchall()
        
        expenses = []
        for row in rows:
            expense_dict = {
                'id': row[0], 'date': row[1], 'description': row[2], 'category': row[3],
                'base_amount': row[4], 'vendor_name': row[5], 'vendor_state': row[6],
                'user_state': row[7], 'gst_calculation': json.loads(row[8]), 
                'invoice_number': row[9], 'is_gst_applicable': row[10], 'created_at': row[11]
            }
            expenses.append(Expense(**expense_dict))
        
        return expenses
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/income", response_model=Income)
async def create_income(income_data: IncomeCreate):
    try:
        gst_calc = calculate_gst(
            income_data.base_amount,
            income_data.user_state,
            income_data.client_state,
            is_income=True
        )
        
        income = Income(
            **income_data.dict(),
            gst_calculation=gst_calc
        )
        
        # Convert to dict and handle date serialization
        income_dict = income.dict()
        income_dict['date'] = income_dict['date'].isoformat() if hasattr(income_dict['date'], 'isoformat') else income_dict['date']
        income_dict['created_at'] = income_dict['created_at'].isoformat() if hasattr(income_dict['created_at'], 'isoformat') else income_dict['created_at']
        income_dict['gst_calculation'] = json.dumps(income_dict['gst_calculation'])
        
        # Insert into SQLite database
        await db.connection.execute('''
            INSERT INTO income (id, date, description, base_amount, client_name, client_state, 
                              user_state, gst_calculation, invoice_number, is_gst_applicable, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            income_dict['id'], income_dict['date'], income_dict['description'], 
            income_dict['base_amount'], income_dict['client_name'], income_dict['client_state'],
            income_dict['user_state'], income_dict['gst_calculation'], income_dict['invoice_number'],
            income_dict['is_gst_applicable'], income_dict['created_at']
        ))
        await db.connection.commit()
        
        return income
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/income", response_model=List[Income])
async def get_income():
    try:
        cursor = await db.connection.execute('SELECT * FROM income ORDER BY date DESC LIMIT 1000')
        rows = await cursor.fetchall()
        
        income_records = []
        for row in rows:
            income_dict = {
                'id': row[0], 'date': row[1], 'description': row[2], 'base_amount': row[3],
                'client_name': row[4], 'client_state': row[5], 'user_state': row[6],
                'gst_calculation': json.loads(row[7]), 'invoice_number': row[8],
                'is_gst_applicable': row[9], 'created_at': row[10]
            }
            income_records.append(Income(**income_dict))
        
        return income_records
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/gst-summary", response_model=GSTSummary)
async def get_gst_summary():
    try:
        # Get all income records
        cursor = await db.connection.execute('SELECT * FROM income')
        income_rows = await cursor.fetchall()
        
        # Get all expense records
        cursor = await db.connection.execute('SELECT * FROM expenses')
        expense_rows = await cursor.fetchall()
        
        summary = GSTSummary()
        
        # Calculate output GST from income
        for row in income_rows:
            gst_calc = json.loads(row[7])  # gst_calculation column
            summary.total_sales += gst_calc['total_amount']
            summary.output_gst += gst_calc['total_gst']
            summary.cgst_liability += gst_calc['cgst']
            summary.sgst_liability += gst_calc['sgst']
            summary.igst_liability += gst_calc['igst']
        
        # Calculate input tax credit from expenses
        for row in expense_rows:
            gst_calc = json.loads(row[8])  # gst_calculation column
            summary.total_purchases += gst_calc['total_amount']
            summary.input_tax_credit += gst_calc['total_gst']
            
            # Subtract input GST from liability
            summary.cgst_liability -= gst_calc['cgst']
            summary.sgst_liability -= gst_calc['sgst']
            summary.igst_liability -= gst_calc['igst']
        
        summary.net_gst_liability = summary.output_gst - summary.input_tax_credit
        
        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/tax-advice", response_model=TaxAdviceResponse)
async def get_tax_advice(request: TaxAdviceRequest):
    try:
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage
        except ImportError:
            # Fallback response if AI integration is not available
            return TaxAdviceResponse(
                advice="AI tax advice service is currently unavailable. Please ensure emergentintegrations package is installed for advanced AI features. For basic GST advice: Keep all invoices, maintain books regularly, file returns on time, and consult a CA for complex matters.",
                session_id=str(uuid.uuid4())
            )
        
        # Create session ID
        session_id = str(uuid.uuid4())
        
        # Get user context (recent transactions, GST summary, etc.)
        gst_summary = await get_gst_summary()
        
        # Get recent expenses
        cursor = await db.connection.execute('SELECT * FROM expenses ORDER BY date DESC LIMIT 5')
        recent_expense_rows = await cursor.fetchall()
        
        # Get recent income
        cursor = await db.connection.execute('SELECT * FROM income ORDER BY date DESC LIMIT 5')
        recent_income_rows = await cursor.fetchall()
        
        context = f"""
        You are a GST and tax expert advisor for Indian freelancers and gig workers. 
        
        Current user's financial context:
        - Total Sales: ₹{gst_summary.total_sales:,.2f}
        - Total Purchases: ₹{gst_summary.total_purchases:,.2f}
        - Net GST Liability: ₹{gst_summary.net_gst_liability:,.2f}
        - Recent expenses: {len(recent_expense_rows)} transactions
        - Recent income: {len(recent_income_rows)} transactions
        
        Provide practical, actionable tax advice specifically for Indian GST and ITR-4 filing.
        Focus on tax savings, compliance, and optimization strategies.
        """
        
        # Check if API key is available
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            return TaxAdviceResponse(
                advice=f"Based on your financial data: Total Sales ₹{gst_summary.total_sales:,.2f}, Net GST Liability ₹{gst_summary.net_gst_liability:,.2f}. General GST advice: Keep detailed records, file returns on time, claim input tax credits properly, and consult a CA for optimization. AI features require GEMINI_API_KEY environment variable.",
                session_id=session_id
            )
        
        chat = LlmChat(
            api_key=api_key,
            session_id=session_id,
            system_message=context
        ).with_model("gemini", "gemini-2.0-flash")
        
        user_message = UserMessage(text=request.query)
        response = await chat.send_message(user_message)
        
        # Store chat history in database
        await db.connection.execute('''
            INSERT INTO tax_consultations (session_id, query, response, timestamp, user_context)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            session_id, request.query, response, datetime.utcnow().isoformat(),
            json.dumps(request.user_context or {})
        ))
        await db.connection.commit()
        
        return TaxAdviceResponse(advice=response, session_id=session_id)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Tax advice service error: {str(e)}")

@api_router.delete("/expenses/{expense_id}")
async def delete_expense(expense_id: str):
    try:
        cursor = await db.connection.execute('DELETE FROM expenses WHERE id = ?', (expense_id,))
        await db.connection.commit()
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Expense not found")
        return {"message": "Expense deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/income/{income_id}")
async def delete_income(income_id: str):
    try:
        cursor = await db.connection.execute('DELETE FROM income WHERE id = ?', (income_id,))
        await db.connection.commit()
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Income record not found")
        return {"message": "Income record deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_db():
    """Initialize database connection on startup"""
    try:
        await db.connect()
        logger.info("Database connected successfully")
    except Exception as e:
        logger.error(f"Failed to connect to database: {e}")
        raise

@app.on_event("shutdown")
async def shutdown_db():
    """Close database connection on shutdown"""
    try:
        await db.close()
        logger.info("Database connection closed")
    except Exception as e:
        logger.error(f"Error closing database: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)