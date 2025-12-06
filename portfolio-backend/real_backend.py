import http.server
import os
import socketserver
import json
import yfinance as yf
from datetime import datetime
import time

# Cache for prices (5 minutes) and fundamentals
price_cache = {}
fundamentals_cache = {}
CACHE_DURATION = 300  # 5 minutes in seconds


class RealStockAPIHandler(http.server.SimpleHTTPRequestHandler):

    def _set_headers(self, status_code=200):
        self.send_response(status_code)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers(200)

    def do_GET(self):
        # Handle CORS preflight
        if self.path == '/':
            self._set_headers()
            response = {
                "message": "Portfolio Visualizer API - Optimized",
                "status": "healthy",
                "version": "2.0.0",
                "cache_enabled": True,
                "endpoints": [
                    "/stocks/price/{symbol}",
                    "/stocks/fundamentals/{symbol}",
                    "/stocks/"
                ]
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
                response = {
                    "success": True,
                    "data": price_data,
                    "cached": False
                }

            except Exception as e:
                self._set_headers(500)
                response = {
                    "success": False,
                    "error": str(e)
                }

            self.wfile.write(json.dumps(response).encode())

        elif self.path.startswith('/stocks/fundamentals/'):
            symbol = self.path.split('/')[-1]
            try:
                # Check cache first for fundamentals
                if not symbol.endswith(('.NS', '.BO')):
                    symbol = f"{symbol}.NS"

                cache_key = f"fundamentals_{symbol}"
                current_time = time.time()

                if cache_key in fundamentals_cache:
                    cache_data = fundamentals_cache[cache_key]
                    if current_time - cache_data["timestamp"] < CACHE_DURATION:
                        self._set_headers()
                        response = {
                            "success": True,
                            "data": cache_data["data"],
                            "cached": True,
                            "cache_age": int(current_time - cache_data["timestamp"])
                        }
                        self.wfile.write(json.dumps(response).encode())
                        return

                # Get fresh fundamentals from Yahoo Finance
                fundamentals_data = self.get_real_fundamentals_from_yahoo(
                    symbol)

                # Cache it
                fundamentals_cache[cache_key] = {
                    "data": fundamentals_data,
                    "timestamp": current_time
                }

                self._set_headers()
                response = {
                    "success": True,
                    "data": fundamentals_data,
                    "cached": False,
                    "note": "Using REAL fundamentals from Yahoo Finance"
                }

            except Exception as e:
                # Fallback to cached fundamentals if Yahoo fails
                self._set_headers()
                response = {
                    "success": True,
                    "data": self.get_cached_fundamentals(symbol),
                    "note": "Using cached fundamentals (Yahoo Finance failed)",
                    "error": str(e)
                }

            self.wfile.write(json.dumps(response).encode())

        elif self.path == '/stocks/':
            self._set_headers()
            response = {
                "success": True,
                "data": {
                    "available_stocks": ["RELIANCE", "TCS", "HDFCBANK", "INFY", "ITC", "SBIN", "HINDUNILVR"]
                }
            }
            self.wfile.write(json.dumps(response).encode())

        else:
            self._set_headers(404)
            response = {
                "success": False,
                "error": f"Cannot GET {self.path}",
                "available_endpoints": [
                    "/",
                    "/stocks/price/{symbol}",
                    "/stocks/fundamentals/{symbol}",
                    "/stocks/"
                ]
            }
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

    def get_real_fundamentals_from_yahoo(self, symbol):
        """Get ACTUAL fundamental data from Yahoo Finance"""
        try:
            # Ensure .NS suffix
            if not symbol.endswith(('.NS', '.BO')):
                symbol = f"{symbol}.NS"

            stock = yf.Ticker(symbol)
            info = stock.info  # This has REAL fundamental data

            # Get current price if available in info, otherwise fetch separately
            current_price = info.get('currentPrice')
            if not current_price:
                # Fallback to price endpoint
                price_data = self.get_real_stock_price(symbol)
                current_price = price_data["current_price"]

            # Extract real data with proper fallbacks
            eps = info.get('trailingEps') or info.get('forwardEps') or 0
            free_cash_flow = info.get('freeCashflow') or 0
            shares = info.get('sharesOutstanding') or 1

            # Calculate FCF per share properly
            fcf_per_share = 0
            if free_cash_flow and shares:
                fcf_per_share = round(free_cash_flow / shares, 2)

            # Get market cap
            market_cap = info.get('marketCap')
            if not market_cap and current_price and shares:
                market_cap = current_price * shares

            return {
                "symbol": symbol,
                "name": info.get('longName', info.get('shortName', symbol)),
                "currentPrice": round(current_price, 2),
                "eps": round(eps, 2),
                "freeCashFlow": free_cash_flow,
                "sharesOutstanding": shares,
                "sector": info.get('sector', 'N/A'),
                "marketCap": market_cap,
                "fcfPerShare": fcf_per_share,
                # Add more real metrics for DCF model
                "revenue": info.get('totalRevenue', 0),
                "operatingCashFlow": info.get('operatingCashflow', 0),
                "capitalExpenditure": info.get('capitalExpenditures', 0),
                "data_source": "Yahoo Finance (Real)",
                "last_updated": datetime.now().isoformat()
            }
        except Exception as e:
            print(f"Error fetching real fundamentals for {symbol}: {e}")
            raise Exception(f"Failed to fetch real fundamentals: {str(e)}")

    def get_cached_fundamentals(self, symbol):
        """Fallback fundamental data - OPTIMIZED"""
        try:
            if not symbol.endswith(('.NS', '.BO')):
                symbol = f"{symbol}.NS"

            # Get current price
            cache_key = f"price_{symbol}"
            if cache_key in price_cache:
                current_price = price_cache[cache_key]["data"]["current_price"]
            else:
                price_data = self.get_real_stock_price(symbol)
                current_price = price_data["current_price"]

            # Static fundamentals database (updated with better estimates)
            fundamentals_db = {
                "RELIANCE.NS": {
                    "name": "Reliance Industries",
                    "currentPrice": current_price,
                    "eps": 101.5,  # Updated estimate
                    "freeCashFlow": 45000,  # Updated estimate
                    "sharesOutstanding": 676,
                    "sector": "Oil & Gas",
                    "marketCap": 1045000,  # In crores
                    "fcfPerShare": 66.6,  # More realistic
                    "revenue": 800000,  # In crores
                    "data_source": "Estimated (Yahoo Finance failed)"
                },
                "TCS.NS": {
                    "name": "Tata Consultancy Services",
                    "currentPrice": current_price,
                    "eps": 124.5,
                    "freeCashFlow": 48000,
                    "sharesOutstanding": 365,
                    "sector": "IT",
                    "marketCap": 1400000,
                    "fcfPerShare": 131.5,
                    "revenue": 200000,
                    "data_source": "Estimated (Yahoo Finance failed)"
                },
                "HDFCBANK.NS": {
                    "name": "HDFC Bank",
                    "currentPrice": current_price,
                    "eps": 86.3,
                    "freeCashFlow": 42000,
                    "sharesOutstanding": 695,
                    "sector": "Banking",
                    "marketCap": 1200000,
                    "fcfPerShare": 60.4,
                    "revenue": 180000,
                    "data_source": "Estimated (Yahoo Finance failed)"
                },
                "INFY.NS": {
                    "name": "Infosys",
                    "currentPrice": current_price,
                    "eps": 68.9,
                    "freeCashFlow": 28000,
                    "sharesOutstanding": 413,
                    "sector": "IT",
                    "marketCap": 680000,
                    "fcfPerShare": 67.8,
                    "revenue": 140000,
                    "data_source": "Estimated (Yahoo Finance failed)"
                },
                "ITC.NS": {
                    "name": "ITC Limited",
                    "currentPrice": current_price,
                    "eps": 15.8,
                    "freeCashFlow": 20000,
                    "sharesOutstanding": 1228,
                    "sector": "FMCG",
                    "marketCap": 500000,
                    "fcfPerShare": 16.3,
                    "revenue": 70000,
                    "data_source": "Estimated (Yahoo Finance failed)"
                }
            }

            data = fundamentals_db.get(symbol, fundamentals_db["RELIANCE.NS"])
            data["currentPrice"] = round(current_price, 2)
            data["last_updated"] = datetime.now().isoformat()

            return data

        except Exception as e:
            # Minimal fallback data
            return {
                "symbol": symbol,
                "name": "Unknown",
                "currentPrice": current_price if 'current_price' in locals() else 0,
                "eps": 0,
                "freeCashFlow": 0,
                "sharesOutstanding": 1,
                "sector": "N/A",
                "marketCap": 0,
                "fcfPerShare": 0,
                "revenue": 0,
                "data_source": "Fallback (Error)",
                "last_updated": datetime.now().isoformat()
            }


def start_server():
    PORT = int(os.environ.get("PORT", 8000))
    with socketserver.TCPServer(("", PORT), RealStockAPIHandler) as httpd:
        print(f"🚀 OPTIMIZED Portfolio Backend Started!")
        print(f"📍 Port: {PORT}")
        print(f"📊 Endpoints:")
        print(f"   • /stocks/price/SYMBOL - Real prices (5-min cache)")
        print(f"   • /stocks/fundamentals/SYMBOL - REAL Yahoo Finance data")
        print(f"   • /stocks/ - Available stocks")
        print(f"⚡ Features: CORS enabled, 5-min caching, REAL fundamentals")
        print(f"\nPress Ctrl+C to stop")
        httpd.serve_forever()


if __name__ == "__main__":
    start_server()
