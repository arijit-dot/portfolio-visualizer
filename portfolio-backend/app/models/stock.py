from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class StockPrice(BaseModel):
    symbol: str
    current_price: float
    change: float
    change_percent: float
    previous_close: float
    open_price: float
    day_high: float
    day_low: float
    volume: int
    last_updated: datetime


class StockResponse(BaseModel):
    success: bool
    data: Optional[dict] = None
    error: Optional[str] = None
