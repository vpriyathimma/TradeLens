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

# Generate for key stocks
stocks = {
    'TITAN.NS': 4294.00,
    'TCS.NS': 3255.80,
    'RELIANCE.NS': 1506.90,
    'INFY.NS': 1627.80,
    'HDFCBANK.NS': 948.90,
    'ICICIBANK.NS': 1413.60,
    'SBIN.NS': 1006.00,
    'TATASTEEL.NS': 184.00,
    'BHARTIARTL.NS': 2105.30,
    'HINDUNILVR.NS': 2403.90,
}

print("# Generated Historical Prices (30 days)\n")
for symbol, price in stocks.items():
    hist = generate_realistic_prices(price, days=30, volatility=0.025)
    print(f"'{symbol}': {hist},\n")
