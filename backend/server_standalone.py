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

# Get the directory where the executable or script is located
if getattr(sys, 'frozen', False):
    # Running as compiled executable
    BASE_DIR = Path(sys.executable).parent
else:
    # Running as script
    BASE_DIR = Path(__file__).parent

# Database path
DB_PATH = BASE_DIR / "gst_data.db"

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
    user_state: str = "Karnataka"
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

# Database setup
async def init_database():
    """Initialize SQLite database with required tables"""
    async with aiosqlite.connect(str(DB_PATH)) as db:
        # Create expenses table
        await db.execute('''
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
                is_gst_applicable BOOLEAN,
                created_at TEXT NOT NULL
            )
        ''')
        
        # Create income table
        await db.execute('''
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
                is_gst_applicable BOOLEAN,
                created_at TEXT NOT NULL
            )
        ''')
        
        # Create tax consultations table
        await db.execute('''
            CREATE TABLE IF NOT EXISTS tax_consultations (
                session_id TEXT PRIMARY KEY,
                query TEXT NOT NULL,
                response TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                user_context TEXT
            )
        ''')
        
        await db.commit()

# GST Calculation Logic
def get_gst_rate_for_category(category: ExpenseCategory) -> float:
    """Get GST rate based on expense category"""
    gst_rates = {
        ExpenseCategory.OFFICE_RENT: 0.0,
        ExpenseCategory.EQUIPMENT: 18.0,
        ExpenseCategory.TRAVEL: 5.0,
        ExpenseCategory.MEALS: 5.0,
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
        gst_rate = 18.0
    
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
        return GSTCalculation(
            base_amount=base_amount,
            gst_rate=gst_rate,
            igst=total_gst,
            total_gst=total_gst,
            total_amount=base_amount + total_gst,
            is_interstate=True
        )
    else:
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
        
        async with aiosqlite.connect(str(DB_PATH)) as db:
            await db.execute('''
                INSERT INTO expenses 
                (id, date, description, category, base_amount, vendor_name, vendor_state, user_state, 
                 gst_calculation, invoice_number, is_gst_applicable, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                expense.id, expense.date.isoformat(), expense.description, expense.category.value,
                expense.base_amount, expense.vendor_name, expense.vendor_state, expense.user_state,
                json.dumps(expense.gst_calculation.dict()), expense.invoice_number,
                expense.is_gst_applicable, expense.created_at.isoformat()
            ))
            await db.commit()
        
        return expense
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/expenses", response_model=List[Expense])
async def get_expenses():
    try:
        async with aiosqlite.connect(str(DB_PATH)) as db:
            async with db.execute('SELECT * FROM expenses ORDER BY date DESC') as cursor:
                rows = await cursor.fetchall()
        
        expenses = []
        for row in rows:
            gst_calc_dict = json.loads(row[8])  # gst_calculation column
            gst_calc = GSTCalculation(**gst_calc_dict)
            
            expense = Expense(
                id=row[0],
                date=datetime.fromisoformat(row[1]).date(),
                description=row[2],
                category=ExpenseCategory(row[3]),
                base_amount=row[4],
                vendor_name=row[5] or "",
                vendor_state=row[6] or "",
                user_state=row[7] or "Karnataka",
                gst_calculation=gst_calc,
                invoice_number=row[9],
                is_gst_applicable=row[10],
                created_at=datetime.fromisoformat(row[11])
            )
            expenses.append(expense)
        
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
        
        async with aiosqlite.connect(str(DB_PATH)) as db:
            await db.execute('''
                INSERT INTO income 
                (id, date, description, base_amount, client_name, client_state, user_state, 
                 gst_calculation, invoice_number, is_gst_applicable, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                income.id, income.date.isoformat(), income.description, income.base_amount,
                income.client_name, income.client_state, income.user_state,
                json.dumps(income.gst_calculation.dict()), income.invoice_number,
                income.is_gst_applicable, income.created_at.isoformat()
            ))
            await db.commit()
        
        return income
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/income", response_model=List[Income])
async def get_income():
    try:
        async with aiosqlite.connect(str(DB_PATH)) as db:
            async with db.execute('SELECT * FROM income ORDER BY date DESC') as cursor:
                rows = await cursor.fetchall()
        
        income_records = []
        for row in rows:
            gst_calc_dict = json.loads(row[7])  # gst_calculation column
            gst_calc = GSTCalculation(**gst_calc_dict)
            
            income = Income(
                id=row[0],
                date=datetime.fromisoformat(row[1]).date(),
                description=row[2],
                base_amount=row[3],
                client_name=row[4] or "",
                client_state=row[5] or "",
                user_state=row[6] or "Karnataka",
                gst_calculation=gst_calc,
                invoice_number=row[8],
                is_gst_applicable=row[9],
                created_at=datetime.fromisoformat(row[10])
            )
            income_records.append(income)
        
        return income_records
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/gst-summary", response_model=GSTSummary)
async def get_gst_summary():
    try:
        summary = GSTSummary()
        
        # Get all income records
        async with aiosqlite.connect(str(DB_PATH)) as db:
            async with db.execute('SELECT gst_calculation FROM income') as cursor:
                income_rows = await cursor.fetchall()
            
            for row in income_rows:
                gst_calc_dict = json.loads(row[0])
                gst_calc = GSTCalculation(**gst_calc_dict)
                summary.total_sales += gst_calc.total_amount
                summary.output_gst += gst_calc.total_gst
                summary.cgst_liability += gst_calc.cgst
                summary.sgst_liability += gst_calc.sgst
                summary.igst_liability += gst_calc.igst
            
            # Get all expense records
            async with db.execute('SELECT gst_calculation FROM expenses') as cursor:
                expense_rows = await cursor.fetchall()
            
            for row in expense_rows:
                gst_calc_dict = json.loads(row[0])
                gst_calc = GSTCalculation(**gst_calc_dict)
                summary.total_purchases += gst_calc.total_amount
                summary.input_tax_credit += gst_calc.total_gst
                
                # Subtract input GST from liability
                summary.cgst_liability -= gst_calc.cgst
                summary.sgst_liability -= gst_calc.sgst
                summary.igst_liability -= gst_calc.igst
        
        summary.net_gst_liability = summary.output_gst - summary.input_tax_credit
        
        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/tax-advice", response_model=TaxAdviceResponse)
async def get_tax_advice(request: TaxAdviceRequest):
    try:
        # For standalone version, provide static tax advice
        # In a full version, this would integrate with AI services
        session_id = str(uuid.uuid4())
        
        # Get GST summary for context
        gst_summary = await get_gst_summary()
        
        # Generate contextual advice based on query
        advice = generate_tax_advice(request.query, gst_summary)
        
        # Store consultation
        async with aiosqlite.connect(str(DB_PATH)) as db:
            await db.execute('''
                INSERT INTO tax_consultations (session_id, query, response, timestamp, user_context)
                VALUES (?, ?, ?, ?, ?)
            ''', (
                session_id, request.query, advice, datetime.utcnow().isoformat(),
                json.dumps(request.user_context or {})
            ))
            await db.commit()
        
        return TaxAdviceResponse(advice=advice, session_id=session_id)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Tax advice service error: {str(e)}")

def generate_tax_advice(query: str, gst_summary: GSTSummary) -> str:
    """Generate contextual tax advice based on query and financial data"""
    query_lower = query.lower()
    
    base_context = f"""
Based on your current financial position:
• Total Sales: ₹{gst_summary.total_sales:,.2f}
• Total Purchases: ₹{gst_summary.total_purchases:,.2f}
• Net GST Liability: ₹{gst_summary.net_gst_liability:,.2f}
• Input Tax Credit Available: ₹{gst_summary.input_tax_credit:,.2f}

"""
    
    if "optimize" in query_lower or "save" in query_lower:
        advice = base_context + """
TAX OPTIMIZATION STRATEGIES:

1. **Maximize Input Tax Credit**:
   - Ensure all business purchases have proper GST invoices
   - Claim ITC on office rent, equipment, and professional services
   - Keep detailed records of all business expenses

2. **Timing Your Expenses**:
   - Make major equipment purchases before quarter-end
   - Prepay annual software subscriptions for higher ITC
   - Schedule business travel and conferences strategically

3. **GST Registration Benefits**:
   - If turnover > ₹20 lakhs, GST registration is mandatory
   - Voluntary registration below threshold gives ITC benefits
   - Composition scheme for smaller businesses (turnover < ₹1.5 cr)

4. **Documentation**:
   - Maintain proper invoice format with GST details
   - Use e-invoicing for B2B transactions > ₹500
   - Keep backup of all digital records
"""
    
    elif "filing" in query_lower or "return" in query_lower:
        advice = base_context + """
GST FILING GUIDANCE:

1. **Monthly/Quarterly Returns**:
   - GSTR-1: Details of outward supplies (quarterly if turnover < ₹1.5 cr)
   - GSTR-3B: Summary return with tax payment (monthly)
   - File returns by 20th of following month

2. **Annual Return**:
   - GSTR-9: Annual return (due by 31st December)
   - GSTR-9C: Audit report if turnover > ₹2 cr

3. **ITR Filing for Freelancers**:
   - Use ITR-4 if opting for presumptive taxation
   - ITR-3 for regular business income computation
   - File by 31st July for the previous financial year

4. **Key Deadlines**:
   - GST Payment: 20th of next month
   - TDS Return: 7th of next month
   - Advance Tax: 15th June, Sept, Dec, March
"""
    
    elif "deduction" in query_lower or "expense" in query_lower:
        advice = base_context + """
FREELANCER TAX DEDUCTIONS:

1. **Business Expenses (100% deductible)**:
   - Home office expenses (rent, electricity proportionate)
   - Internet and phone bills
   - Computer, software, and equipment
   - Professional development courses

2. **Section 80C Deductions (₹1.5 lakh limit)**:
   - EPF contributions
   - PPF investments
   - ELSS mutual funds
   - Life insurance premiums

3. **Other Key Deductions**:
   - Section 80D: Health insurance premiums
   - Section 24: Home loan interest
   - Section 80E: Education loan interest

4. **Business Setup Costs**:
   - Office setup and furniture
   - Professional consultation fees
   - Business registration costs
"""
    
    elif "compliance" in query_lower or "penalty" in query_lower:
        advice = base_context + """
GST COMPLIANCE CHECKLIST:

1. **Monthly Obligations**:
   - File GSTR-3B by 20th
   - Pay GST liability
   - Reconcile purchase and sales data

2. **Avoiding Penalties**:
   - Late filing fee: ₹50 per day per return
   - Interest on delayed payment: 18% per annum
   - Penalty for non-filing: ₹10,000 or 10% of tax due

3. **Record Keeping**:
   - Maintain books for 72 months
   - Digital invoices and receipts
   - Bank statement reconciliation

4. **Input Tax Credit Rules**:
   - ITC can be claimed within 2 years of invoice date
   - Reverse charge mechanism for certain services
   - Blocked credits: personal use, motor vehicles (except for business)
"""
    
    else:
        advice = base_context + """
GENERAL GST & TAX GUIDANCE:

1. **Current Status Analysis**:
   Your net GST liability suggests you're effectively managing input tax credits. Keep maintaining proper documentation for all business expenses.

2. **Key Recommendations**:
   - Set aside 30% of income for taxes
   - Quarterly tax planning reviews
   - Professional CA consultation for complex matters
   - Use accounting software for better tracking

3. **Immediate Action Items**:
   - Ensure all invoices are GST compliant
   - Review and claim pending input tax credits
   - Plan advance tax payments to avoid interest
   - Keep physical and digital backup of all records

4. **Long-term Strategy**:
   - Consider business structure optimization
   - Plan for tax-efficient investments
   - Regular compliance health checks
   - Stay updated with GST rate changes

For personalized advice on complex matters, consult a Chartered Accountant familiar with your business domain.
"""
    
    return advice.strip()

@api_router.delete("/expenses/{expense_id}")
async def delete_expense(expense_id: str):
    try:
        async with aiosqlite.connect(str(DB_PATH)) as db:
            cursor = await db.execute('DELETE FROM expenses WHERE id = ?', (expense_id,))
            await db.commit()
            
            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="Expense not found")
        
        return {"message": "Expense deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/income/{income_id}")
async def delete_income(income_id: str):
    try:
        async with aiosqlite.connect(str(DB_PATH)) as db:
            cursor = await db.execute('DELETE FROM income WHERE id = ?', (income_id,))
            await db.commit()
            
            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="Income record not found")
        
        return {"message": "Income record deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Include the router in the main app
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "file://"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event
@app.on_event("startup")
async def startup_event():
    await init_database()
    print(f"GST Pro Desktop App started. Database: {DB_PATH}")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8001, log_level="info")