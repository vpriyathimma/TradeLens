
import sys
import os

# Add the parent directory to sys.path to resolve imports if run from backend/
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

from routes.nse_api import get_nse_stock_quote

def test_nse():
    symbol = "TITAN.NS"
    print(f"Testing NSE fetch for {symbol}...")
    try:
        data = get_nse_stock_quote(symbol)
        print("Result:", data)
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    test_nse()
