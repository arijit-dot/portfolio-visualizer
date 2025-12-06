import http.server
import os
import socketserver
import json
import yfinance as yf
from datetime import datetime

class RealStockAPIHandler(http.server.SimpleHTTPRequestHandler):
    # ... [COPY THE ORIGINAL WORKING CODE HERE - from your earlier working version]
