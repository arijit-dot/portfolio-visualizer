import http.server
import socketserver
import json
import requests
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
            print(f"📈 Fetching real data for: {symbol}")

            try:
                # Get real stock data from Yahoo Finance API
                price_data = self.get_real_stock_data(symbol)

                response = {"success": True, "data": price_data}
                self.send_response(200)

            except Exception as e:
                print(f"❌ Error: {e}")
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

    def get_real_stock_data(self, symbol):
        """Get real stock data from Yahoo Finance API"""
        try:
            # For Indian stocks, we need to use Yahoo Finance format
            if symbol.endswith('.NS'):
                yahoo_symbol = symbol  # RELIANCE.NS
            else:
                yahoo_symbol = symbol  # AAPL, TSLA, etc.

            # Yahoo Finance API endpoint
            url = f"https://query1.finance.yahoo.com/v8/finance/chart/{yahoo_symbol}"

            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }

            response = requests.get(url, headers=headers, timeout=10)
            print(f"🔍 Yahoo API Response Status: {response.status_code}")

            if response.status_code == 200:
                data = response.json()
                print(f"📊 Yahoo API Data: {json.dumps(data)[:200]}...")

                if 'chart' in data and 'result' in data['chart'] and data['chart']['result']:
                    result = data['chart']['result'][0]
                    meta = result['meta']

                    current_price = meta.get('regularMarketPrice', 0)
                    previous_close = meta.get('previousClose', 0)

                    if current_price == 0 or previous_close == 0:
                        raise ValueError("Invalid price data from API")

                    change = current_price - previous_close
                    change_percent = (change / previous_close) * 100

                    return {
                        "symbol": symbol,
                        "name": meta.get('longName', symbol),
                        "current_price": round(current_price, 2),
                        "change": round(change, 2),
                        "change_percent": round(change_percent, 2),
                        "previous_close": round(previous_close, 2),
                        "volume": meta.get('regularMarketVolume', 0),
                        "sector": meta.get('sector', 'N/A'),
                        "last_updated": datetime.now().isoformat()
                    }
                else:
                    raise ValueError("No chart data in API response")
            else:
                raise ValueError(
                    f"API returned status code: {response.status_code}")

        except Exception as e:
            print(f"❌ Detailed error: {str(e)}")
            raise ValueError(f"Failed to fetch real-time data: {str(e)}")


def start_server():
    PORT = 8000
    try:
        with socketserver.TCPServer(("", PORT), StockAPIHandler) as httpd:
            print("🚀 BACKEND SERVER STARTED!")
            print(f"📍 URL: http://localhost:{PORT}")
            print("📊 Test these in your browser:")
            print("   1. http://localhost:8000/")
            print("   2. http://localhost:8000/stocks/price/AAPL")
            print("   3. http://localhost:8000/stocks/price/TSLA")
            print("   4. http://localhost:8000/stocks/price/RELIANCE.NS")
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
            print(f"📊 Test: http://localhost:{port}/stocks/price/AAPL")
            httpd.serve_forever()
    except OSError:
        print(f"❌ Port {port} busy. Trying {port+1}...")
        start_server_with_port(port+1)


if __name__ == "__main__":
    start_server()
