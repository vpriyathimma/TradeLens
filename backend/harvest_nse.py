
import requests
import json
import time

portfolio = [
    'TCS', 'ITC', 'ZOMATO', 'TATASTEEL', 'INFY', 
    'RELIANCE', 'HDFCBANK', 'ICICIBANK', 'SBIN', 
    'TITAN', 'BHARTIARTL', 'HINDUNILVR', 'LT', 
    'KOTAKBANK', 'AXISBANK', 'MARUTI', 'SUNPHARMA', 
    'NTPC', 'ONGC', 'POWERGRID', 'ASIANPAINT', 'BAJFINANCE'
]

prices = {}

headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Referer': 'https://www.nseindia.com/',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
}

session = requests.Session()
session.headers.update(headers)

print("Initializing session...")
try:
    session.get("https://www.nseindia.com", timeout=10)
except:
    pass

print("Fetching NSE prices...")
for symbol in portfolio:
    try:
        url = f"https://www.nseindia.com/api/quote-equity?symbol={symbol}"
        response = session.get(url, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            price = data.get('priceInfo', {}).get('lastPrice')
            change = data.get('priceInfo', {}).get('change')
            pChange = data.get('priceInfo', {}).get('pChange')
            
            if price:
                prices[f"{symbol}.NS"] = {
                    'price': price,
                    'change': change,
                    'change_percent': pChange
                }
                print(f"✅ {symbol}: {price}")
            else:
                print(f"❌ {symbol}: No price in data")
        else:
            print(f"❌ {symbol}: Status {response.status_code}")
            
    except Exception as e:
        print(f"❌ {symbol}: Error {e}")
    
    time.sleep(1) # Polite delay

print("\n--- JSON for DEMO_DATA UPDATE ---")
print(json.dumps(prices, indent=4))
