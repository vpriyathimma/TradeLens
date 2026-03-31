
import yfinance as yf
import json

portfolio = [
    'TCS.NS', 'ITC.NS', 'ZOMATO.NS', 'TATASTEEL.NS', 'INFY.NS', 
    'RELIANCE.NS', 'HDFCBANK.NS', 'ICICIBANK.NS', 'SBIN.NS', 
    'TITAN.NS', 'BHARTIARTL.NS', 'HINDUNILVR.NS', 'LT.NS', 
    'KOTAKBANK.NS', 'AXISBANK.NS', 'MARUTI.NS', 'SUNPHARMA.NS', 
    'NTPC.NS', 'ONGC.NS', 'POWERGRID.NS', 'ASIANPAINT.NS', 'BAJFINANCE.NS',
    'META', 'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA'
]

prices = {}

print("Fetching latest prices for demo data update...")
for symbol in portfolio:
    try:
        t = yf.Ticker(symbol)
        # Try fast_info first
        price = t.fast_info.last_price if hasattr(t, 'fast_info') else None
        
        # Fallback to history
        if price is None:
            hist = t.history(period="1d")
            if not hist.empty:
                price = hist['Close'].iloc[-1]
        
        if price:
            prices[symbol] = round(price, 2)
            print(f"✅ {symbol}: {prices[symbol]}")
        else:
            print(f"❌ {symbol}: Failed to fetch")
            
    except Exception as e:
        print(f"❌ {symbol}: Error {e}")

print("\n--- JSON for DEMO_DATA UPDATE ---")
print(json.dumps(prices, indent=4))
