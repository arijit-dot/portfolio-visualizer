import http.server
import socketserver
import json
import yfinance as yf
from datetime import datetime


class StockAPIHandler(http.server.BaseHTTPRequestHandler):

    def do_GET(self):
        print(f"📡 Request: {self.path}")

        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

            response = {"message": "API is running", "status": "healthy"}
            self.wfile.write(json.dumps(response).encode('utf-8'))

        elif self.path.startswith('/stocks/price/'):
            symbol = self.path.split('/')[-1]
            print(f"📈 Fetching: {symbol}")

            try:
                # Get real stock data
                if not symbol.endswith('.NS'):
                    symbol = f"{symbol}.NS"

                stock = yf.Ticker(symbol)
                history = stock.history(period="2d")

                if history.empty:
                    raise ValueError("No data found")

                current = history['Close'].iloc[-1]
                previous = history['Close'].iloc[-2] if len(
                    history) > 1 else current
                change = current - previous
                change_percent = (change / previous) * 100

                price_data = {
                    "symbol": symbol,
                    "current_price": round(current, 2),
                    "change": round(change, 2),
                    "change_percent": round(change_percent, 2),
                    "previous_close": round(previous, 2),
                    "volume": int(history['Volume'].iloc[-1]),
                    "last_updated": datetime.now().isoformat()
                }

                response = {"success": True, "data": price_data}
                self.send_response(200)

            except Exception as e:
                response = {"success": False, "error": str(e)}
                self.send_response(400)

            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode('utf-8'))

        else:
            self.send_response(404)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            response = {"success": False, "error": "Endpoint not found"}
            self.wfile.write(json.dumps(response).encode('utf-8'))


def start_server():
    PORT = 8000
    try:
        with socketserver.TCPServer(("", PORT), StockAPIHandler) as httpd:
            print("🚀 BACKEND SERVER STARTED!")
            print(f"📍 URL: http://localhost:{PORT}")
            print("📊 Test these in your browser:")
            print("   1. http://localhost:8000/")
            print("   2. http://localhost:8000/stocks/price/RELIANCE")
            print("   3. http://localhost:8000/stocks/price/TCS")
            print("\n⏳ Waiting for requests...")
            httpd.serve_forever()
    except OSError:
        print("❌ Port 8000 busy. Trying 8001...")
        start_server_with_port(8001)


def start_server_with_port(port):
    try:
        with socketserver.TCPServer(("", port), StockAPIHandler) as httpd:
            print(f"🚀 BACKEND SERVER STARTED on port {port}!")
            print(f"📍 URL: http://localhost:{port}")
            print(f"📊 Test: http://localhost:{port}/stocks/price/RELIANCE")
            httpd.serve_forever()
    except OSError:
        print(f"❌ Port {port} busy. Trying {port+1}...")
        start_server_with_port(port+1)


if __name__ == "__main__":
    start_server()
