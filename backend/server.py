from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
from pathlib import Path
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any
from datetime import datetime, date
import uuid
from enum import Enum
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

# Get the directory where the executable or script is located
if getattr(sys, 'frozen', False):
    # Running as compiled executable
    BASE_DIR = Path(sys.executable).parent
else:
    # Running as script
    BASE_DIR = Path(__file__).parent

# MongoDB connection
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "gst_automation_db")

mongo_client = AsyncIOMotorClient(MONGO_URL)
db = mongo_client[DB_NAME]

# Create the main app
app = FastAPI(title="GST Automation Platform", version="1.0.0")

# CORS middleware — allow the Netlify/Vite frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

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


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

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

    @field_validator("base_amount")
    @classmethod
    def amount_must_be_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("base_amount must be greater than zero")
        return v

    @field_validator("description")
    @classmethod
    def description_must_not_be_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("description must not be empty")
        if len(v) > 500:
            raise ValueError("description must not exceed 500 characters")
        return v


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

    @field_validator("base_amount")
    @classmethod
    def amount_must_be_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("base_amount must be greater than zero")
        return v

    @field_validator("description")
    @classmethod
    def description_must_not_be_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("description must not be empty")
        if len(v) > 500:
            raise ValueError("description must not exceed 500 characters")
        return v


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

    @field_validator("query")
    @classmethod
    def query_must_not_be_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("query must not be empty")
        if len(v) > 2000:
            raise ValueError("query must not exceed 2000 characters")
        return v


class TaxAdviceResponse(BaseModel):
    advice: str
    session_id: str


# ---------------------------------------------------------------------------
# GST Calculation Logic
# ---------------------------------------------------------------------------

def get_gst_rate_for_category(category: ExpenseCategory) -> float:
    """Get GST rate based on expense category."""
    gst_rates: Dict[ExpenseCategory, float] = {
        ExpenseCategory.OFFICE_RENT: 0.0,
        ExpenseCategory.EQUIPMENT: 18.0,
        ExpenseCategory.TRAVEL: 5.0,
        ExpenseCategory.MEALS: 5.0,
        ExpenseCategory.SOFTWARE: 18.0,
        ExpenseCategory.MARKETING: 18.0,
        ExpenseCategory.PROFESSIONAL_SERVICES: 18.0,
        ExpenseCategory.UTILITIES: 18.0,
        ExpenseCategory.OFFICE_SUPPLIES: 18.0,
        ExpenseCategory.OTHER: 18.0,
    }
    return gst_rates.get(category, 18.0)


def calculate_gst(
    base_amount: float,
    user_state: str,
    vendor_or_client_state: str,
    category: Optional[ExpenseCategory] = None,
) -> GSTCalculation:
    """Calculate GST based on interstate/intrastate transaction.

    If vendor/client state is empty or matches user state, the transaction is
    treated as intrastate (CGST + SGST).
    """
    gst_rate = get_gst_rate_for_category(category) if category else 18.0

    # Treat missing counterparty state as same-state (intrastate)
    effective_other_state = vendor_or_client_state.strip() or user_state
    is_interstate = user_state.strip().lower() != effective_other_state.lower()

    if gst_rate == 0.0:
        return GSTCalculation(
            base_amount=base_amount,
            gst_rate=gst_rate,
            total_amount=base_amount,
            is_interstate=is_interstate,
        )

    total_gst = round((base_amount * gst_rate) / 100, 2)

    if is_interstate:
        return GSTCalculation(
            base_amount=base_amount,
            gst_rate=gst_rate,
            igst=total_gst,
            total_gst=total_gst,
            total_amount=round(base_amount + total_gst, 2),
            is_interstate=True,
        )
    else:
        cgst = round(total_gst / 2, 2)
        sgst = round(total_gst / 2, 2)
        return GSTCalculation(
            base_amount=base_amount,
            gst_rate=gst_rate,
            cgst=cgst,
            sgst=sgst,
            total_gst=total_gst,
            total_amount=round(base_amount + total_gst, 2),
            is_interstate=False,
        )


def _strip_mongo_id(doc: dict) -> dict:
    """Remove MongoDB's internal _id field before passing to Pydantic."""
    doc.pop("_id", None)
    return doc


# ---------------------------------------------------------------------------
# API Routes
# ---------------------------------------------------------------------------

@api_router.get("/")
async def root():
    return {"message": "GST Automation Platform API"}


@api_router.get("/health")
async def health():
    return {"status": "ok"}


# --- Expenses ---

@api_router.post("/expenses", response_model=Expense, status_code=201)
async def create_expense(expense_data: ExpenseCreate):
    try:
        gst_calc = calculate_gst(
            expense_data.base_amount,
            expense_data.user_state,
            expense_data.vendor_state,
            expense_data.category,
        )

        expense = Expense(
            **expense_data.model_dump(),
            gst_calculation=gst_calc,
        )

        expense_dict = expense.model_dump()
        expense_dict["date"] = expense_dict["date"].isoformat()
        expense_dict["created_at"] = expense_dict["created_at"].isoformat()

        await db.expenses.insert_one(expense_dict)
        return expense
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to create expense") from e


@api_router.get("/expenses", response_model=List[Expense])
async def get_expenses():
    try:
        docs = await db.expenses.find().sort("date", -1).to_list(1000)
        return [Expense(**_strip_mongo_id(doc)) for doc in docs]
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch expenses") from e


@api_router.delete("/expenses/{expense_id}")
async def delete_expense(expense_id: str):
    try:
        result = await db.expenses.delete_one({"id": expense_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Expense not found")
        return {"message": "Expense deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to delete expense") from e


# --- Income ---

@api_router.post("/income", response_model=Income, status_code=201)
async def create_income(income_data: IncomeCreate):
    try:
        gst_calc = calculate_gst(
            income_data.base_amount,
            income_data.user_state,
            income_data.client_state,
        )

        income = Income(
            **income_data.model_dump(),
            gst_calculation=gst_calc,
        )

        income_dict = income.model_dump()
        income_dict["date"] = income_dict["date"].isoformat()
        income_dict["created_at"] = income_dict["created_at"].isoformat()

        await db.income.insert_one(income_dict)
        return income
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to create income record") from e


@api_router.get("/income", response_model=List[Income])
async def get_income():
    try:
        docs = await db.income.find().sort("date", -1).to_list(1000)
        return [Income(**_strip_mongo_id(doc)) for doc in docs]
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch income records") from e


@api_router.delete("/income/{income_id}")
async def delete_income(income_id: str):
    try:
        result = await db.income.delete_one({"id": income_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Income record not found")
        return {"message": "Income record deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to delete income record") from e


# --- GST Summary ---

@api_router.get("/gst-summary", response_model=GSTSummary)
async def get_gst_summary():
    try:
        income_docs = await db.income.find().to_list(1000)
        expense_docs = await db.expenses.find().to_list(1000)

        summary = GSTSummary()

        for doc in income_docs:
            inc = Income(**_strip_mongo_id(doc))
            summary.total_sales += inc.gst_calculation.total_amount
            summary.output_gst += inc.gst_calculation.total_gst
            summary.cgst_liability += inc.gst_calculation.cgst
            summary.sgst_liability += inc.gst_calculation.sgst
            summary.igst_liability += inc.gst_calculation.igst

        for doc in expense_docs:
            exp = Expense(**_strip_mongo_id(doc))
            summary.total_purchases += exp.gst_calculation.total_amount
            summary.input_tax_credit += exp.gst_calculation.total_gst
            summary.cgst_liability -= exp.gst_calculation.cgst
            summary.sgst_liability -= exp.gst_calculation.sgst
            summary.igst_liability -= exp.gst_calculation.igst

        summary.net_gst_liability = summary.output_gst - summary.input_tax_credit

        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to compute GST summary") from e


# --- Tax Advice ---

@api_router.post("/tax-advice", response_model=TaxAdviceResponse)
async def get_tax_advice(request: TaxAdviceRequest):
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage  # noqa: PLC0415

        session_id = str(uuid.uuid4())

        gst_summary = await get_gst_summary()
        recent_expenses = await db.expenses.find().sort("date", -1).limit(5).to_list(5)
        recent_income = await db.income.find().sort("date", -1).limit(5).to_list(5)

        context = (
            "You are a GST and tax expert advisor for Indian freelancers and gig workers.\n\n"
            f"Current user's financial context:\n"
            f"- Total Sales: ₹{gst_summary.total_sales:,.2f}\n"
            f"- Total Purchases: ₹{gst_summary.total_purchases:,.2f}\n"
            f"- Net GST Liability: ₹{gst_summary.net_gst_liability:,.2f}\n"
            f"- Recent expenses: {len(recent_expenses)} transactions\n"
            f"- Recent income: {len(recent_income)} transactions\n\n"
            "Provide practical, actionable tax advice specifically for Indian GST and ITR-4 filing. "
            "Focus on tax savings, compliance, and optimization strategies."
        )

        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise HTTPException(status_code=503, detail="AI advisor is not configured")

        chat = LlmChat(
            api_key=api_key,
            session_id=session_id,
            system_message=context,
        ).with_model("gemini", "gemini-2.0-flash")

        user_message = UserMessage(text=request.query)
        response = await chat.send_message(user_message)

        chat_record = {
            "session_id": session_id,
            "query": request.query,
            "response": response,
            "timestamp": datetime.utcnow().isoformat(),
            "user_context": request.user_context or {},
        }
        await db.tax_consultations.insert_one(chat_record)

        return TaxAdviceResponse(advice=response, session_id=session_id)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Tax advice service error") from e


# ---------------------------------------------------------------------------
# Register router
# ---------------------------------------------------------------------------

app.include_router(api_router)
