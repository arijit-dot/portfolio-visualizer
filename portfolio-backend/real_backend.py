import http.server
import os
import socketserver
import json
import yfinance as yf
from datetime import datetime
import time

# Cache for prices (5 minutes)
price_cache = {}
CACHE_DURATION = 300  # 5 minutes in seconds


class RealStockAPIHandler(http.server.SimpleHTTPRequestHandler):

    def _set_headers(self, status_code=200):
        self.send_response(status_code)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def do_OPTIONS(self):
        self._set_headers(200)
        self.end_headers()

    def do_GET(self):
        # Handle CORS preflight
        if self.path == '/':
            self._set_headers()
            self.end_headers()
            response = {
                "message": "Portfolio Visualizer API - Optimized",
                "status": "healthy",
                "version": "2.0.0",
                "cache_enabled": True
            }
            self.wfile.write(json.dumps(response).encode())

        elif self.path.startswith('/stocks/price/'):
            symbol = self.path.split('/')[-1]
            try:
                # Check cache first
                if not symbol.endswith(('.NS', '.BO')):
                    symbol = f"{symbol}.NS"

                cache_key = f"price_{symbol}"
                current_time = time.time()

                if cache_key in price_cache:
                    cache_data = price_cache[cache_key]
                    if current_time - cache_data["timestamp"] < CACHE_DURATION:
                        # Return cached data
                        self._set_headers()
                        self.end_headers()
                        response = {
                            "success": True,
                            "data": cache_data["data"],
                            "cached": True,
                            "cache_age": int(current_time - cache_data["timestamp"])
                        }
                        self.wfile.write(json.dumps(response).encode())
                        return

                # Get fresh data
                price_data = self.get_real_stock_price(symbol)

                # Cache it
                price_cache[cache_key] = {
                    "data": price_data,
                    "timestamp": current_time
                }

                self._set_headers()
                self.end_headers()
                response = {
                    "success": True,
                    "data": price_data,
                    "cached": False
                }

            except Exception as e:
                self._set_headers(500)
                self.end_headers()
                response = {
                    "success": False,
                    "error": str(e)
                }

            self.wfile.write(json.dumps(response).encode())

        elif self.path.startswith('/stocks/fundamentals/'):
            symbol = self.path.split('/')[-1]
            self._set_headers()
            self.end_headers()
            response = {
                "success": True,
                "data": self.get_cached_fundamentals(symbol),
                "note": "Using optimized fundamentals with real prices"
            }
            self.wfile.write(json.dumps(response).encode())

        elif self.path == '/stocks/':
            self._set_headers()
            self.end_headers()
            response = {
                "success": True,
                "data": {
                    "available_stocks": ["RELIANCE", "TCS", "HDFCBANK", "INFY", "ITC", "SBIN", "HINDUNILVR"]
                }
            }
            self.wfile.write(json.dumps(response).encode())

        else:
            self._set_headers(404)
            self.end_headers()
            response = {"success": False, "error": "Endpoint not found"}
            self.wfile.write(json.dumps(response).encode())

    def get_real_stock_price(self, symbol):
        """Get REAL stock price from yfinance - OPTIMIZED"""
        try:
            # Format symbol for Indian stocks
            if not symbol.endswith(('.NS', '.BO')):
                symbol = f"{symbol}.NS"

            # Use minimal data fetch
            stock = yf.Ticker(symbol)
            history = stock.history(period="1d")  # Only 1 day needed

            if history.empty:
                # Try 5-day as fallback
                history = stock.history(period="5d")
                if history.empty:
                    raise ValueError(f"No data for {symbol}")

            current_price = history['Close'].iloc[-1]
            previous_close = history['Close'].iloc[-2] if len(
                history) > 1 else current_price

            change = current_price - previous_close
            change_percent = (change / previous_close) * \
                100 if previous_close != 0 else 0

            return {
                "symbol": symbol,
                "current_price": round(current_price, 2),
                "change": round(change, 2),
                "change_percent": round(change_percent, 2),
                "previous_close": round(previous_close, 2),
                "last_updated": datetime.now().isoformat(),
                "data_source": "yfinance (optimized)"
            }

        except Exception as e:
            raise Exception(f"Error fetching price for {symbol}: {str(e)}")

    def get_cached_fundamentals(self, symbol):
        """Get fundamental data with cache - OPTIMIZED"""
        try:
            if not symbol.endswith(('.NS', '.BO')):
                symbol = f"{symbol}.NS"

            # Get current price from cache or fresh
            cache_key = f"price_{symbol}"
            if cache_key in price_cache:
                current_price = price_cache[cache_key]["data"]["current_price"]
            else:
                price_data = self.get_real_stock_price(symbol)
                current_price = price_data["current_price"]

            # Static fundamentals database
            fundamentals_db = {
                "RELIANCE.NS": {
                    "name": "Reliance Industries",
                    "currentPrice": current_price,
                    "eps": 89.2,
                    "freeCashFlow": 65000,
                    "sharesOutstanding": 676,
                    "sector": "Oil & Gas",
                    "fcfPerShare": round(65000 / 676, 2)
                },
                "TCS.NS": {
                    "name": "Tata Consultancy Services",
                    "currentPrice": current_price,
                    "eps": 115.6,
                    "freeCashFlow": 45000,
                    "sharesOutstanding": 365,
                    "sector": "IT",
                    "fcfPerShare": round(45000 / 365, 2)
                },
                "HDFCBANK.NS": {
                    "name": "HDFC Bank",
                    "currentPrice": current_price,
                    "eps": 78.9,
                    "freeCashFlow": 38000,
                    "sharesOutstanding": 695,
                    "sector": "Banking",
                    "fcfPerShare": round(38000 / 695, 2)
                },
                "INFY.NS": {
                    "name": "Infosys",
                    "currentPrice": current_price,
                    "eps": 62.3,
                    "freeCashFlow": 25000,
                    "sharesOutstanding": 413,
                    "sector": "IT",
                    "fcfPerShare": round(25000 / 413, 2)
                },
                "ITC.NS": {
                    "name": "ITC Limited",
                    "currentPrice": current_price,
                    "eps": 14.2,
                    "freeCashFlow": 18000,
                    "sharesOutstanding": 1228,
                    "sector": "FMCG",
                    "fcfPerShare": round(18000 / 1228, 2)
                }
            }

            data = fundamentals_db.get(symbol, fundamentals_db["RELIANCE.NS"])
            data["currentPrice"] = current_price  # Ensure real price

            # Calculate FCF per share if not present
            if "fcfPerShare" not in data:
                data["fcfPerShare"] = round(
                    data["freeCashFlow"] / data["sharesOutstanding"], 2)

            return data

        except Exception as e:
            # Fallback minimal data
            return {
                "name": "Unknown",
                "currentPrice": current_price if 'current_price' in locals() else 0,
                "eps": 0,
                "freeCashFlow": 0,
                "sharesOutstanding": 1,
                "sector": "N/A",
                "fcfPerShare": 0
            }


def start_server():
    PORT = int(os.environ.get("PORT", 8000))
    with socketserver.TCPServer(("", PORT), RealStockAPIHandler) as httpd:
        print(f"🚀 OPTIMIZED Portfolio Backend Started!")
        print(f"📍 Port: {PORT}")
        print(f"📊 Endpoints:")
        print(f"   • /stocks/price/SYMBOL - Real prices (5-min cache)")
        print(f"   • /stocks/fundamentals/SYMBOL - Fundamentals + real prices")
        print(f"   • /stocks/ - Available stocks")
        print(f"⚡ Features: CORS enabled, 5-min caching, optimized yfinance calls")
        print(f"\nPress Ctrl+C to stop")
        httpd.serve_forever()


if __name__ == "__main__":
    start_server()
