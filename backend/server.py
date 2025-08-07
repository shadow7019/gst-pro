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
        
        await db.expenses.insert_one(expense_dict)
        return expense
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/expenses", response_model=List[Expense])
async def get_expenses():
    try:
        expenses = await db.expenses.find().sort("date", -1).to_list(1000)
        return [Expense(**expense) for expense in expenses]
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
        
        await db.income.insert_one(income_dict)
        return income
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/income", response_model=List[Income])
async def get_income():
    try:
        income_records = await db.income.find().sort("date", -1).to_list(1000)
        return [Income(**record) for record in income_records]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/gst-summary", response_model=GSTSummary)
async def get_gst_summary():
    try:
        # Get all income and expenses
        income_records = await db.income.find().to_list(1000)
        expense_records = await db.expenses.find().to_list(1000)
        
        summary = GSTSummary()
        
        # Calculate output GST from income
        for record in income_records:
            income = Income(**record)
            summary.total_sales += income.gst_calculation.total_amount
            summary.output_gst += income.gst_calculation.total_gst
            summary.cgst_liability += income.gst_calculation.cgst
            summary.sgst_liability += income.gst_calculation.sgst
            summary.igst_liability += income.gst_calculation.igst
        
        # Calculate input tax credit from expenses
        for record in expense_records:
            expense = Expense(**record)
            summary.total_purchases += expense.gst_calculation.total_amount
            summary.input_tax_credit += expense.gst_calculation.total_gst
            
            # Subtract input GST from liability
            summary.cgst_liability -= expense.gst_calculation.cgst
            summary.sgst_liability -= expense.gst_calculation.sgst
            summary.igst_liability -= expense.gst_calculation.igst
        
        summary.net_gst_liability = summary.output_gst - summary.input_tax_credit
        
        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/tax-advice", response_model=TaxAdviceResponse)
async def get_tax_advice(request: TaxAdviceRequest):
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        # Create session ID
        session_id = str(uuid.uuid4())
        
        # Get user context (recent transactions, GST summary, etc.)
        gst_summary = await get_gst_summary()
        recent_expenses = await db.expenses.find().sort("date", -1).limit(5).to_list(5)
        recent_income = await db.income.find().sort("date", -1).limit(5).to_list(5)
        
        context = f"""
        You are a GST and tax expert advisor for Indian freelancers and gig workers. 
        
        Current user's financial context:
        - Total Sales: ₹{gst_summary.total_sales:,.2f}
        - Total Purchases: ₹{gst_summary.total_purchases:,.2f}
        - Net GST Liability: ₹{gst_summary.net_gst_liability:,.2f}
        - Recent expenses: {len(recent_expenses)} transactions
        - Recent income: {len(recent_income)} transactions
        
        Provide practical, actionable tax advice specifically for Indian GST and ITR-4 filing.
        Focus on tax savings, compliance, and optimization strategies.
        """
        
        chat = LlmChat(
            api_key=os.environ.get("GEMINI_API_KEY"),
            session_id=session_id,
            system_message=context
        ).with_model("gemini", "gemini-2.0-flash")
        
        user_message = UserMessage(text=request.query)
        response = await chat.send_message(user_message)
        
        # Store chat history in database
        chat_record = {
            "session_id": session_id,
            "query": request.query,
            "response": response,
            "timestamp": datetime.utcnow(),
            "user_context": request.user_context or {}
        }
        await db.tax_consultations.insert_one(chat_record)
        
        return TaxAdviceResponse(advice=response, session_id=session_id)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Tax advice service error: {str(e)}")

@api_router.delete("/expenses/{expense_id}")
async def delete_expense(expense_id: str):
    try:
        result = await db.expenses.delete_one({"id": expense_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Expense not found")
        return {"message": "Expense deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/income/{income_id}")
async def delete_income(income_id: str):
    try:
        result = await db.income.delete_one({"id": income_id})
        if result.deleted_count == 0:
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

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()