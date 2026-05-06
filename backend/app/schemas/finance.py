from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class CategorySchema(BaseModel):
    id: UUID
    name: str
    icon: Optional[str]
    color: Optional[str]

    class Config:
        from_attributes = True

class TransactionCreate(BaseModel):
    amount: float
    currency: str = "EUR"
    category_id: Optional[UUID] = None
    merchant: Optional[str] = None
    description: Optional[str] = None
    date: datetime = datetime.now()
    is_income: bool = False
    raw_text: Optional[str] = None

class TransactionUpdate(BaseModel):
    amount: Optional[float] = None
    category_id: Optional[UUID] = None
    merchant: Optional[str] = None
    description: Optional[str] = None
    date: Optional[datetime] = None
    is_income: Optional[bool] = None

class TransactionSchema(BaseModel):
    id: UUID
    amount: float
    currency: str
    category_id: Optional[UUID]
    merchant: Optional[str]
    description: Optional[str]
    date: datetime
    is_income: bool
    raw_text: Optional[str]
    created_at: datetime
    category: Optional[CategorySchema] = None

    class Config:
        from_attributes = True

class ParseRequest(BaseModel):
    text: str

class FinanceStats(BaseModel):
    total_spent: float
    total_income: float
    balance: float
    by_category: List[dict] # { name, amount, color, percentage }
    daily_spending: List[dict] # { date, amount }
    insights: List[str] # Puntos críticos o consejos

class BudgetSchema(BaseModel):
    id: UUID
    category: str
    limit_percentage: float

class BudgetCreate(BaseModel):
    category: str
    limit_percentage: float
