
try:
    import yfinance as yf
    print("yfinance imported successfully")
    print(f"Version: {yf.__version__}")
except Exception as e:
    print(f"yfinance import failed: {e}")
except TypeError as te:
    print(f"yfinance Type Error: {te}")
