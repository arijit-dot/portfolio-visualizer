import http.server
import socketserver
import json
import yfinance as yf
from datetime import datetime


class RealStockAPIHandler(http.server.SimpleHTTPRequestHandler):

    def _set_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def do_OPTIONS(self):
        self.send_response(200)
        self._set_cors_headers()
        self.end_headers()

    def do_GET(self):
        self._set_cors_headers()

        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {
                "message": "Portfolio Visualizer API with REAL DATA",
                "status": "healthy",
                "version": "1.0.0"
            }
            self.wfile.write(json.dumps(response).encode())

        elif self.path.startswith('/stocks/price/'):
            symbol = self.path.split('/')[-1]
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()

            try:
                # Get REAL stock data
                price_data = self.get_real_stock_price(symbol)
                response = {
                    "success": True,
                    "data": price_data
                }
            except Exception as e:
                response = {
                    "success": False,
                    "error": str(e)
                }

            self.wfile.write(json.dumps(response).encode())

        elif self.path.startswith('/stocks/fundamentals/'):
            symbol = self.path.split('/')[-1]
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()

            try:
                # Get fundamental data
                fundamental_data = self.get_stock_fundamentals(symbol)
                response = {
                    "success": True,
                    "data": fundamental_data
                }
            except Exception as e:
                response = {
                    "success": False,
                    "error": str(e)
                }

            self.wfile.write(json.dumps(response).encode())

        elif self.path == '/stocks/':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {
                "success": True,
                "data": {
                    "available_stocks": ["RELIANCE", "TCS", "HDFCBANK", "INFY", "ITC", "SBIN", "HINDUNILVR"]
                }
            }
            self.wfile.write(json.dumps(response).encode())

        else:
            self.send_response(404)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {"success": False, "error": "Endpoint not found"}
            self.wfile.write(json.dumps(response).encode())

    def get_real_stock_price(self, symbol):
        """Get REAL stock price from yfinance"""
        try:
            # Format symbol for Indian stocks
            if not symbol.endswith(('.NS', '.BO')):
                symbol = f"{symbol}.NS"

            print(f"📈 Fetching REAL data for: {symbol}")

            stock = yf.Ticker(symbol)
            # Get 2 days to calculate change
            history = stock.history(period="2d")

            if history.empty:
                raise ValueError(f"No data found for {symbol}")

            current_price = history['Close'].iloc[-1]
            previous_close = history['Close'].iloc[-2] if len(
                history) > 1 else current_price

            change = current_price - previous_close
            change_percent = (change / previous_close) * 100

            return {
                "symbol": symbol,
                "current_price": round(current_price, 2),
                "change": round(change, 2),
                "change_percent": round(change_percent, 2),
                "previous_close": round(previous_close, 2),
                "open_price": round(history['Open'].iloc[-1], 2),
                "day_high": round(history['High'].iloc[-1], 2),
                "day_low": round(history['Low'].iloc[-1], 2),
                "volume": int(history['Volume'].iloc[-1]),
                "last_updated": datetime.now().isoformat(),
                "data_source": "yfinance (real market data)"
            }

        except Exception as e:
            raise Exception(f"Error fetching real data for {symbol}: {str(e)}")

    def get_stock_fundamentals(self, symbol):
        """Get fundamental data for DCF valuation"""
        try:
            # Format symbol for Indian stocks
            if not symbol.endswith(('.NS', '.BO')):
                symbol = f"{symbol}.NS"

            print(f"📊 Fetching fundamental data for: {symbol}")

            # Mock fundamental data for now - you can enhance this with real data later
            fundamental_data = {
                "RELIANCE.NS": {
                    "name": "Reliance Industries Limited",
                    # Real price
                    "currentPrice": self.get_real_stock_price(symbol)["current_price"],
                    "eps": 89.2,
                    "freeCashFlow": 65000,  # in crores
                    "sharesOutstanding": 676,  # in crores
                    "sector": "Oil & Gas",
                    "marketCap": "₹16.5L Cr",
                    "revenue": 792000,
                    "operatingCashFlow": 115000,
                    "capitalExpenditure": 50000
                },
                "TCS.NS": {
                    "name": "Tata Consultancy Services",
                    "currentPrice": self.get_real_stock_price("TCS.NS")["current_price"],
                    "eps": 115.6,
                    "freeCashFlow": 45000,
                    "sharesOutstanding": 365,
                    "sector": "IT",
                    "marketCap": "₹12.5L Cr",
                    "revenue": 195000,
                    "operatingCashFlow": 52000,
                    "capitalExpenditure": 7000
                },
                "HDFCBANK.NS": {
                    "name": "HDFC Bank",
                    "currentPrice": self.get_real_stock_price("HDFCBANK.NS")["current_price"],
                    "eps": 78.9,
                    "freeCashFlow": 38000,
                    "sharesOutstanding": 695,
                    "sector": "Banking",
                    "marketCap": "₹11.5L Cr",
                    "revenue": 185000,
                    "operatingCashFlow": 45000,
                    "capitalExpenditure": 1500
                },
                "INFY.NS": {
                    "name": "Infosys",
                    "currentPrice": self.get_real_stock_price("INFY.NS")["current_price"],
                    "eps": 62.3,
                    "freeCashFlow": 25000,
                    "sharesOutstanding": 413,
                    "sector": "IT",
                    "marketCap": "₹6.25L Cr",
                    "revenue": 145000,
                    "operatingCashFlow": 32000,
                    "capitalExpenditure": 7000
                },
                "ITC.NS": {
                    "name": "ITC Limited",
                    "currentPrice": self.get_real_stock_price("ITC.NS")["current_price"],
                    "eps": 14.2,
                    "freeCashFlow": 18000,
                    "sharesOutstanding": 1228,
                    "sector": "FMCG",
                    "marketCap": "₹4.25L Cr",
                    "revenue": 65000,
                    "operatingCashFlow": 22000,
                    "capitalExpenditure": 4000
                }
            }

            # Return data for the requested symbol, or default to RELIANCE.NS
            data = fundamental_data.get(
                symbol, fundamental_data["RELIANCE.NS"])

            # Update current price with real-time data
            try:
                real_price = self.get_real_stock_price(symbol)["current_price"]
                data["currentPrice"] = real_price
            except:
                pass  # Keep mock price if real price fetch fails

            return data

        except Exception as e:
            raise Exception(
                f"Error fetching fundamentals for {symbol}: {str(e)}")


def start_server():
    PORT = 8000
    with socketserver.TCPServer(("", PORT), RealStockAPIHandler) as httpd:
        print("🚀 Portfolio Backend Server with REAL DATA Started!")
        print(f"📍 Running at: http://localhost:{PORT}")
        print("📊 Available endpoints:")
        print("   http://localhost:8000/ - Health check")
        print("   http://localhost:8000/stocks/price/RELIANCE - REAL Stock price")
        print("   http://localhost:8000/stocks/fundamentals/RELIANCE - Fundamental data")
        print("   http://localhost:8000/stocks/ - Available stocks")
        print("\n📈 Testing real data...")

        # Test real data on startup
        try:
            test_symbols = ["RELIANCE.NS", "TCS.NS", "HDFCBANK.NS"]
            for symbol in test_symbols:
                stock = yf.Ticker(symbol)
                history = stock.history(period="1d")
                if not history.empty:
                    price = history['Close'].iloc[-1]
                    print(f"   ✅ {symbol}: ₹{price:.2f}")
                else:
                    print(f"   ❌ {symbol}: No data")
        except Exception as e:
            print(f"   ⚠️ Test failed: {e}")

        # COMMENTED OUT PROBLEMATIC TEST CODE
        # print("\n📊 Testing fundamental data endpoint...")
        # try:
        #     # Create a test handler instance
        #     handler = RealStockAPIHandler(None, None, None)
        #     fundamentals = handler.get_stock_fundamentals("RELIANCE.NS")
        #     print(f"   ✅ Fundamentals for RELIANCE.NS: Loaded successfully")
        #     print(f"   📈 Current Price: ₹{fundamentals['currentPrice']}")
        #     print(
        #         f"   💰 FCF/Share: ₹{fundamentals['freeCashFlow'] / fundamentals['sharesOutstanding']:.1f}")
        # except Exception as e:
        #     print(f"   ❌ Fundamentals test failed: {e}")

        print("\nPress Ctrl+C to stop the server")
        httpd.serve_forever()


if __name__ == "__main__":
    start_server()
