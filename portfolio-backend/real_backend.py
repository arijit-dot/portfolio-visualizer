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


def start_server():
    PORT = 8000
    with socketserver.TCPServer(("", PORT), RealStockAPIHandler) as httpd:
        print("🚀 Portfolio Backend Server with REAL DATA Started!")
        print(f"📍 Running at: http://localhost:{PORT}")
        print("📊 Available endpoints:")
        print("   http://localhost:8000/ - Health check")
        print("   http://localhost:8000/stocks/price/RELIANCE - REAL Stock price")
        print("   http://localhost:8000/stocks/price/TCS - REAL Stock price")
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

        print("\nPress Ctrl+C to stop the server")
        httpd.serve_forever()


if __name__ == "__main__":
    start_server()

