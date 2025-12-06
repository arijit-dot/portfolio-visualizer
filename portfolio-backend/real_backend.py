import http.server
import os
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
            response = {
                "success": False,
                "error": "Fundamentals endpoint disabled - using frontend fallback"
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
            if not symbol.endswith(('.NS', '.BO')):
                symbol = f"{symbol}.NS"

            stock = yf.Ticker(symbol)
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
                "data_source": "yfinance"
            }

        except Exception as e:
            raise Exception(f"Error fetching real data: {str(e)}")


def start_server():
    PORT = int(os.environ.get("PORT", 8000))
    with socketserver.TCPServer(("", PORT), RealStockAPIHandler) as httpd:
        print(f"🚀 Server started on port {PORT}")
        print("✅ /stocks/price/ - Working")
        print("⚠️  /stocks/fundamentals/ - Disabled (use frontend fallback)")
        httpd.serve_forever()


if __name__ == "__main__":
    start_server()
