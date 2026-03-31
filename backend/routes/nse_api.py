"""
NSE India Stock Data Fetcher
Fetches live stock prices from NSE India
"""
import requests
import logging
from datetime import datetime

# Headers to mimic browser request
NSE_HEADERS = {
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

# Session for cookies
_session = None

def get_nse_session():
    """Get or create NSE session with cookies"""
    global _session
    if _session is None:
        _session = requests.Session()
        # Get cookies by visiting main page first
        try:
            _session.get('https://www.nseindia.com/', headers=NSE_HEADERS, timeout=10)
        except:
            pass
    return _session

def get_nse_stock_quote(symbol):
    """
    Fetch live stock quote from NSE India
    symbol: Stock symbol without .NS suffix (e.g., 'TITAN', 'RELIANCE')
    """
    try:
        # Remove .NS suffix if present
        clean_symbol = symbol.replace('.NS', '').upper()
        
        session = get_nse_session()
        url = f'https://www.nseindia.com/api/quote-equity?symbol={clean_symbol}'
        
        response = session.get(url, headers=NSE_HEADERS, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            price_info = data.get('priceInfo', {})
            info = data.get('info', {})
            
            current_price = price_info.get('lastPrice', 0)
            previous_close = price_info.get('previousClose', current_price)
            change = price_info.get('change', current_price - previous_close)
            change_percent = price_info.get('pChange', 0)
            
            return {
                'success': True,
                'price': float(current_price),
                'change': float(change),
                'change_percent': float(change_percent),
                'previous_close': float(previous_close),
                'name': info.get('companyName', clean_symbol),
                'symbol': clean_symbol,
                'industry': info.get('industry', 'Unknown'),
            }
        else:
            logging.error(f"NSE API returned status {response.status_code} for {clean_symbol}")
            return {'success': False, 'error': f'Status {response.status_code}'}
            
    except Exception as e:
        logging.error(f"Error fetching NSE data for {symbol}: {e}")
        return {'success': False, 'error': str(e)}

def get_nse_stock_history(symbol, days=365):
    """
    Fetch historical data from NSE (limited availability)
    For now, returns empty - yfinance history is more reliable when not rate limited
    """
    return []
