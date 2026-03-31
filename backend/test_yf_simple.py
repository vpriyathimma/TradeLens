
import yfinance as yf

symbol = "TITAN.NS"
print(f"Testing yfinance for {symbol}...")
try:
    ticker = yf.Ticker(symbol)
    # fast_info is better in newer versions, but info is standard
    price = ticker.fast_info.last_price if hasattr(ticker, 'fast_info') else None
    
    if price is None:
        hist = ticker.history(period="1d")
        if not hist.empty:
            price = hist['Close'].iloc[-1]
            
    print(f"Price: {price}")
except Exception as e:
    print(f"Error: {e}")
