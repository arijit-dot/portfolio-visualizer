import yfinance as yf
import pandas as pd
from datetime import datetime
from typing import List, Optional, Dict, Any
from app.models.stock import StockPrice


class StockService:

    # Indian stock symbols mapping
    INDIAN_STOCKS = {
        "RELIANCE": "RELIANCE.NS",
        "TCS": "TCS.NS",
        "HDFCBANK": "HDFCBANK.NS",
        "INFY": "INFY.NS",
        "ITC": "ITC.NS",
        "SBIN": "SBIN.NS",
        "HINDUNILVR": "HINDUNILVR.NS",
        "BHARTIARTL": "BHARTIARTL.NS",
        "KOTAKBANK": "KOTAKBANK.NS",
        "LT": "LT.NS",
        "BAJFINANCE": "BAJFINANCE.NS",
        "ASIANPAINT": "ASIANPAINT.NS",
        "TATAMOTORS": "TATAMOTORS.NS",
        "SUNPHARMA": "SUNPHARMA.NS"
    }

    @staticmethod
    def format_indian_symbol(symbol: str) -> str:
        """Convert plain symbol to yfinance format for Indian stocks"""
        symbol_upper = symbol.upper()

        # If already formatted with .NS or .BO, return as is
        if symbol_upper.endswith('.NS') or symbol_upper.endswith('.BO'):
            return symbol_upper

        # Map common symbols to yfinance format
        if symbol_upper in StockService.INDIAN_STOCKS:
            return StockService.INDIAN_STOCKS[symbol_upper]

        # Default to NSE format
        return f"{symbol_upper}.NS"

    @staticmethod
    def get_stock_price(symbol: str) -> StockPrice:
        """Get current stock price and details for Indian stocks"""
        try:
            formatted_symbol = StockService.format_indian_symbol(symbol)
            print(f"📈 Fetching data for: {formatted_symbol}")

            stock = yf.Ticker(formatted_symbol)
            # Get 2 days to calculate change
            history = stock.history(period="2d")

            if history.empty:
                raise ValueError(f"No data found for symbol: {symbol}")

            current_price = history['Close'].iloc[-1]
            previous_close = history['Close'].iloc[-2] if len(
                history) > 1 else current_price

            change = current_price - previous_close
            change_percent = (change / previous_close) * 100

            return StockPrice(
                symbol=symbol,
                current_price=round(current_price, 2),
                change=round(change, 2),
                change_percent=round(change_percent, 2),
                previous_close=round(previous_close, 2),
                open_price=round(history['Open'].iloc[-1], 2),
                day_high=round(history['High'].iloc[-1], 2),
                day_low=round(history['Low'].iloc[-1], 2),
                volume=int(history['Volume'].iloc[-1]),
                last_updated=datetime.now()
            )
        except Exception as e:
            raise ValueError(
                f"Error fetching stock price for {symbol}: {str(e)}")

    @staticmethod
    def get_multiple_prices(symbols: List[str]) -> Dict[str, Any]:
        """Get prices for multiple stocks at once"""
        results = {}
        for symbol in symbols:
            try:
                results[symbol] = StockService.get_stock_price(symbol).dict()
            except Exception as e:
                results[symbol] = {"error": str(e)}
        return results
