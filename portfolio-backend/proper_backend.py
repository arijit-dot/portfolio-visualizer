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
                # Try multiple symbol formats
                symbols_to_try = self.get_symbol_variants(symbol)
                stock_data = None
                working_symbol = symbol

                for sym in symbols_to_try:
                    try:
                        print(f"🔍 Trying symbol: {sym}")
                        stock = yf.Ticker(sym)
                        history = stock.history(period="2d")

                        if not history.empty and len(history) >= 2:
                            print(f"✅ Found data for: {sym}")
                            stock_data = stock
                            working_symbol = sym
                            break
                        else:
                            print(f"❌ No data for: {sym}")
                    except Exception as e:
                        print(f"⚠️ Error with {sym}: {e}")
                        continue

                if not stock_data:
                    raise ValueError(
                        f"No data found for {symbol} after trying: {', '.join(symbols_to_try)}")

                # Get stock info
                history = stock_data.history(period="2d")
                current = history['Close'].iloc[-1]
                previous = history['Close'].iloc[-2]
                change = current - previous
                change_percent = (change / previous) * 100

                # Get additional info
                try:
                    info = stock_data.info
                    company_name = info.get('longName', working_symbol)
                    sector = info.get('sector', 'Unknown')
                except:
                    company_name = working_symbol
                    sector = 'Unknown'

                price_data = {
                    "symbol": working_symbol,
                    "name": company_name,
                    "current_price": round(current, 2),
                    "change": round(change, 2),
                    "change_percent": round(change_percent, 2),
                    "previous_close": round(previous, 2),
                    "volume": int(history['Volume'].iloc[-1]),
                    "sector": sector,
                    "last_updated": datetime.now().isoformat()
                }

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

    def get_symbol_variants(self, symbol):
        """Generate multiple symbol format variants to try"""
        base_symbol = symbol.upper()
        variants = [base_symbol]

        # Indian stock exchanges
        variants.extend([
            f"{base_symbol}.NS",  # NSE
            f"{base_symbol}.BO",  # BSE
        ])

        # If it already has suffix, try without
        if '.' in base_symbol:
            base_without_suffix = base_symbol.split('.')[0]
            variants.extend([
                base_without_suffix,
                f"{base_without_suffix}.NS",
                f"{base_without_suffix}.BO",
            ])

        # Common international suffixes
        international_suffixes = ['.AX', '.L', '.TO', '.PA', '.DE', '.F']
        variants.extend(
            [f"{base_symbol}{suffix}" for suffix in international_suffixes])

        # Remove duplicates and return
        return list(dict.fromkeys(variants))


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
            print("   4. http://localhost:8000/stocks/price/AAPL")
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
