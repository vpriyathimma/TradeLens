
import requests
import yfinance as yf
import sys
import os

# Configuration
SYMBOL = "TITAN.NS"
FMP_API_KEY = "Td1BfQwEyhj6sQnmgWzw7HIjgCNkZutK"

def test_nse():
    print("\n--- Testing NSE API ---")
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': 'https://www.nseindia.com/',
    }
    
    session = requests.Session()
    session.headers.update(headers)
    
    try:
        # Visit home first
        session.get("https://www.nseindia.com", timeout=10)
        
        # Now fetch quote
        clean_symbol = SYMBOL.replace('.NS', '')
        url = f"https://www.nseindia.com/api/quote-equity?symbol={clean_symbol}"
        response = session.get(url, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            price = data.get('priceInfo', {}).get('lastPrice')
            print(f"✅ NSE Success! Price: {price}")
        else:
            print(f"❌ NSE Failed. Status: {response.status_code}")
    except Exception as e:
        print(f"❌ NSE Error: {e}")

def test_fmp():
    print("\n--- Testing FMP API ---")
    url = f"https://financialmodelingprep.com/api/v3/quote/{SYMBOL}?apikey={FMP_API_KEY}"
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data and len(data) > 0:
                print(f"✅ FMP Success! Price: {data[0].get('price')}")
            else:
                print(f"❌ FMP Failed. Empty Data: {data}")
        else:
            print(f"❌ FMP Failed. Status: {response.status_code}")
            print("Response:", response.text)
    except Exception as e:
        print(f"❌ FMP Error: {e}")

def test_yfinance():
    print("\n--- Testing yfinance ---")
    try:
        t = yf.Ticker(SYMBOL)
        price = t.history(period="1d")['Close'].iloc[-1]
        print(f"✅ yfinance Success! Price: {price}")
    except Exception as e:
        print(f"❌ yfinance Error: {e}")

if __name__ == "__main__":
    print(f"Testing APIs for {SYMBOL}...")
    test_nse()
    test_fmp()
    test_yfinance()
