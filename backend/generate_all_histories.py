import random
from datetime import datetime, timedelta

def generate_realistic_prices(current_price, days=30, volatility=0.02):
    """Generate realistic stock prices with daily volatility"""
    prices = []
    price = current_price * 0.95  # Start 5% lower than current
    
    end_date = datetime(2026, 1, 7)
    
    for i in range(days):
        date = end_date - timedelta(days=days - i - 1)
        
        # Random daily change with volatility
        daily_change = random.uniform(-volatility, volatility)
        price = price * (1 + daily_change)
        
        # Add some trend towards current price
        trend = (current_price - price) * 0.03
        price += trend
        
        prices.append({
            'date': date.strftime('%Y-%m-%d'),
            'close': round(price, 2)
        })
    
    # Ensure last price is close to current
    prices[-1]['close'] = current_price
    
    return prices

# All stocks from DEMO_DATA
stocks = {
    'HDFCBANK.NS': 948.90,
    'ICICIBANK.NS': 1413.60,
    'SBIN.NS': 1006.00,
    'TATASTEEL.NS': 184.00,
    'BHARTIARTL.NS': 2105.30,
    'HINDUNILVR.NS': 2403.90,
    'ITC.NS': 342.45,
    'LT.NS': 3520.75,
    'KOTAKBANK.NS': 2125.30,
    'AXISBANK.NS': 1289.50,
    'MARUTI.NS': 16719.00,
    'SUNPHARMA.NS': 1779.90,
    'NTPC.NS': 347.90,
    'ONGC.NS': 241.16,
    'POWERGRID.NS': 266.45,
    'ASIANPAINT.NS': 2841.00,
    'BAJFINANCE.NS': 967.95,
    'HCLTECH.NS': 1685.20,
    'TECHM.NS': 1542.75,
    'ULTRACEMCO.NS': 12117.00,
    'M&M.NS': 3785.00,
    'ADANIPORTS.NS': 1464.00,
    'GRASIM.NS': 2865.00,
    'WIPRO.NS': 456.80,
    'META': 48868.38,
}

print("# Generated Historical Prices (30 days) - ALL STOCKS\n")
for symbol, price in stocks.items():
    hist = generate_realistic_prices(price, days=30, volatility=0.025)
    # Format as compact Python list
    hist_str = str(hist).replace("'date'", "'date'").replace("'close'", "'close'")
    print(f"# {symbol}")
    print(f"{hist_str},\n")
