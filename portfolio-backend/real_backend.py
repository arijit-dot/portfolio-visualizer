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

                # Get fresh fundamentals with EPS-based FCF estimation
                fundamentals_data = self.get_accurate_fundamentals_with_estimated_fcf(
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
                    "note": "Using EPS-based FCF estimation for accuracy"
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

    def get_estimated_fcf_from_eps(self, eps, sector):
        """Estimate FCF from EPS based on sector ratios"""
        sector_ratios = {
            "Energy": 1.05,
            "Oil & Gas": 1.03,
            "Technology": 0.80,
            "IT": 0.75,
            "Banking": 0.65,
            "Financial Services": 0.68,
            "FMCG": 0.85,
            "Consumer Defensive": 0.82,
            "Healthcare": 0.75,
            "Pharmaceuticals": 0.78,
            "Automobile": 0.70,
            "Industrial": 0.72,
            "Telecommunication": 0.90,
            "Utilities": 0.95,
            "default": 0.80
        }

        ratio = sector_ratios.get(sector, sector_ratios["default"])
        return round(eps * ratio, 2)

    def get_accurate_fundamentals_with_estimated_fcf(self, symbol):
        """Get accurate fundamentals with EPS-based FCF estimation"""
        try:
            # Ensure .NS suffix
            if not symbol.endswith(('.NS', '.BO')):
                symbol = f"{symbol}.NS"

            stock = yf.Ticker(symbol)
            info = stock.info

            # Get current price
            current_price = info.get('currentPrice')
            if not current_price:
                price_data = self.get_real_stock_price(symbol)
                current_price = price_data["current_price"]

            # Extract EPS and sector
            eps = info.get('trailingEps') or info.get('forwardEps') or 0
            sector = info.get('sector', 'N/A')
            shares = info.get('sharesOutstanding', 1)

            # Get Yahoo's FCF
            yahoo_free_cash_flow = info.get('freeCashflow', 0)
            yahoo_fcf_per_share = round(
                yahoo_free_cash_flow / shares, 2) if shares else 0

            # Estimate FCF from EPS
            estimated_fcf_per_share = self.get_estimated_fcf_from_eps(
                eps, sector)

            # Determine which FCF to use
            # If Yahoo FCF is too low (< 30% of EPS), use estimated FCF
            if yahoo_fcf_per_share < eps * 0.3:
                final_fcf_per_share = estimated_fcf_per_share
                fcf_source = "estimated"
                fcf_note = f"Estimated from EPS (Yahoo FCF unreliable)"
            else:
                final_fcf_per_share = yahoo_fcf_per_share
                fcf_source = "yahoo"
                fcf_note = "From Yahoo Finance"

            # Calculate market cap
            market_cap = info.get('marketCap')
            if not market_cap and current_price and shares:
                market_cap = current_price * shares

            return {
                "symbol": symbol,
                "name": info.get('longName', info.get('shortName', symbol)),
                "currentPrice": round(current_price, 2),
                "eps": round(eps, 2),
                "sector": sector,
                "sharesOutstanding": shares,
                "marketCap": market_cap,
                # FCF data
                "fcfPerShare": final_fcf_per_share,
                "fcfSource": fcf_source,
                "fcfNote": fcf_note,
                "yahooFcfPerShare": yahoo_fcf_per_share,
                "estimatedFcfPerShare": estimated_fcf_per_share,
                # Additional metrics
                "revenue": info.get('totalRevenue', 0),
                "operatingCashFlow": info.get('operatingCashflow', 0),
                "capitalExpenditure": info.get('capitalExpenditures', 0),
                "data_source": "Yahoo Finance + EPS-based FCF estimation",
                "last_updated": datetime.now().isoformat()
            }
        except Exception as e:
            print(f"Error fetching accurate fundamentals for {symbol}: {e}")
            raise Exception(f"Failed to fetch accurate fundamentals: {str(e)}")

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

            # Get sector for estimation
            stock = yf.Ticker(symbol)
            info = stock.info
            sector = info.get('sector', 'N/A')
            eps = info.get('trailingEps') or info.get('forwardEps') or 101.5

            # Estimate FCF from EPS
            estimated_fcf = self.get_estimated_fcf_from_eps(eps, sector)

            # Static fundamentals database with EPS-based FCF
            fundamentals_db = {
                "RELIANCE.NS": {
                    "name": "Reliance Industries",
                    "currentPrice": current_price,
                    "eps": round(eps, 2),
                    "sector": sector,
                    "fcfPerShare": estimated_fcf,
                    "fcfSource": "estimated",
                    "data_source": "EPS-based estimation (Fallback)"
                },
                "TCS.NS": {
                    "name": "Tata Consultancy Services",
                    "currentPrice": current_price,
                    "eps": round(eps, 2),
                    "sector": sector,
                    "fcfPerShare": estimated_fcf,
                    "fcfSource": "estimated",
                    "data_source": "EPS-based estimation (Fallback)"
                },
                "HDFCBANK.NS": {
                    "name": "HDFC Bank",
                    "currentPrice": current_price,
                    "eps": round(eps, 2),
                    "sector": sector,
                    "fcfPerShare": estimated_fcf,
                    "fcfSource": "estimated",
                    "data_source": "EPS-based estimation (Fallback)"
                },
                "INFY.NS": {
                    "name": "Infosys",
                    "currentPrice": current_price,
                    "eps": round(eps, 2),
                    "sector": sector,
                    "fcfPerShare": estimated_fcf,
                    "fcfSource": "estimated",
                    "data_source": "EPS-based estimation (Fallback)"
                },
                "ITC.NS": {
                    "name": "ITC Limited",
                    "currentPrice": current_price,
                    "eps": round(eps, 2),
                    "sector": sector,
                    "fcfPerShare": estimated_fcf,
                    "fcfSource": "estimated",
                    "data_source": "EPS-based estimation (Fallback)"
                }
            }

            data = fundamentals_db.get(symbol, fundamentals_db["RELIANCE.NS"])
            data["currentPrice"] = round(current_price, 2)
            data["eps"] = round(eps, 2)
            data["sector"] = sector
            data["fcfPerShare"] = estimated_fcf
            data["last_updated"] = datetime.now().isoformat()

            return data

        except Exception as e:
            # Minimal fallback data
            return {
                "symbol": symbol,
                "name": "Unknown",
                "currentPrice": current_price if 'current_price' in locals() else 0,
                "eps": 0,
                "sector": "N/A",
                "fcfPerShare": 0,
                "fcfSource": "error",
                "data_source": "Error Fallback",
                "last_updated": datetime.now().isoformat()
            }


def start_server():
    PORT = int(os.environ.get("PORT", 8000))
    with socketserver.TCPServer(("", PORT), RealStockAPIHandler) as httpd:
        print(f"🚀 OPTIMIZED Portfolio Backend Started!")
        print(f"📍 Port: {PORT}")
        print(f"📊 Endpoints:")
        print(f"   • /stocks/price/SYMBOL - Real prices (5-min cache)")
        print(f"   • /stocks/fundamentals/SYMBOL - EPS-based FCF estimation")
        print(f"   • /stocks/ - Available stocks")
        print(f"⚡ Features: CORS enabled, 5-min caching, Accurate FCF estimation")
        print(f"\nPress Ctrl+C to stop")
        httpd.serve_forever()


if __name__ == "__main__":
    start_server()
