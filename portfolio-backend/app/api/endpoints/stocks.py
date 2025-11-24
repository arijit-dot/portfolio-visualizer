from fastapi import APIRouter, Query
from typing import List
from app.services.stock_service import StockService
from app.models.stock import StockResponse

router = APIRouter(prefix="/stocks", tags=["stocks"])


@router.get("/price/{symbol}", response_model=StockResponse)
async def get_stock_price(symbol: str):
    """Get current price for a stock"""
    try:
        price_data = StockService.get_stock_price(symbol)
        return StockResponse(success=True, data=price_data.dict())
    except Exception as e:
        return StockResponse(success=False, error=str(e))


@router.get("/batch/prices")
async def get_batch_prices(symbols: List[str] = Query(...)):
    """Get prices for multiple stocks"""
    try:
        prices = StockService.get_multiple_prices(symbols)
        return StockResponse(success=True, data=prices)
    except Exception as e:
        return StockResponse(success=False, error=str(e))


@router.get("/")
async def get_available_stocks():
    """Get list of available Indian stocks"""
    return {
        "success": True,
        "data": {
            "available_stocks": list(StockService.INDIAN_STOCKS.keys())
        }
    }
