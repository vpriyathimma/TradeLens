#!/usr/bin/env python3
"""
Auto-Update DEMO_DATA Script
Fetches latest stock prices and updates DEMO_DATA in stock_routes.py

Usage:
    python3 update_demo_data.py

This will:
1. Fetch current prices for all stocks in DEMO_DATA
2. Generate realistic 30-day historical data
3. Update stock_routes.py with new data
4. Backup the old file before updating
"""

import yfinance as yf
import json
from datetime import datetime, timedelta
import random
import shutil
import re

# List of all stocks to update
STOCKS_TO_UPDATE = [
    'TITAN.NS', 'TCS.NS', 'RELIANCE.NS', 'INFY.NS', 'HDFCBANK.NS',
    'ICICIBANK.NS', 'SBIN.NS', 'TATASTEEL.NS', 'BHARTIARTL.NS',
    'HINDUNILVR.NS', 'ITC.NS', 'LT.NS', 'KOTAKBANK.NS', 'AXISBANK.NS',
    'MARUTI.NS', 'SUNPHARMA.NS', 'NTPC.NS', 'ONGC.NS', 'POWERGRID.NS',
    'ASIANPAINT.NS', 'BAJFINANCE.NS', 'HCLTECH.NS', 'TECHM.NS',
    'ULTRACEMCO.NS', 'M&M.NS', 'ADANIPORTS.NS', 'GRASIM.NS',
    'CIPLA.NS', 'BRITANNIA.NS', 'TATAMOTORS.NS', 'WIPRO.NS',
    'META'
]

def generate_realistic_history(current_price, days=30):
    """Generate realistic 30-day price history ending at current_price"""
    history = []
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    
    # Start price (slightly lower than current for upward trend)
    start_price = current_price * random.uniform(0.92, 0.98)
    
    for i in range(days):
        date = start_date + timedelta(days=i)
        # Linear interpolation with random volatility
        progress = i / (days - 1)
        base_price = start_price + (current_price - start_price) * progress
        
        # Add daily volatility (±2%)
        volatility = random.uniform(-0.02, 0.02)
        price = base_price * (1 + volatility)
        
        history.append({
            'date': date.strftime('%Y-%m-%d'),
            'close': round(price, 2)
        })
    
    # Ensure last price matches current price
    history[-1]['close'] = current_price
    
    return history

def fetch_stock_data(symbol):
    """Fetch current stock data from yfinance"""
    try:
        print(f"Fetching {symbol}...", end=' ')
        ticker = yf.Ticker(symbol)
        
        # Get current price
        info = ticker.info
        current_price = info.get('currentPrice') or info.get('regularMarketPrice')
        
        if not current_price:
            # Try fast_info
            current_price = ticker.fast_info.last_price if hasattr(ticker, 'fast_info') else None
        
        if not current_price:
            # Try history as last resort
            hist = ticker.history(period='1d')
            if not hist.empty:
                current_price = hist['Close'].iloc[-1]
        
        if not current_price:
            print(f"❌ Failed - No price data")
            return None
        
        # Get previous close for change calculation
        hist = ticker.history(period='2d')
        if len(hist) >= 2:
            prev_close = hist['Close'].iloc[-2]
            change = current_price - prev_close
            change_percent = (change / prev_close) * 100
        else:
            change = 0
            change_percent = 0
        
        # Generate historical data
        historical_prices = generate_realistic_history(current_price)
        
        print(f"✅ ₹{current_price:.2f}")
        
        return {
            'price': round(current_price, 2),
            'change': round(change, 2),
            'change_percent': round(change_percent, 2),
            'historical_prices': historical_prices,
            'name': info.get('longName', symbol.replace('.NS', ''))
        }
    
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def update_stock_routes_file(stock_data_map):
    """Update stock_routes.py with new data"""
    file_path = 'routes/stock_routes.py'
    
    # Create backup
    backup_path = f'routes/stock_routes.py.backup.{datetime.now().strftime("%Y%m%d_%H%M%S")}'
    shutil.copy(file_path, backup_path)
    print(f"\n✅ Backup created: {backup_path}")
    
    # Read current file
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Update each stock's data
    updated_count = 0
    for symbol, data in stock_data_map.items():
        if not data:
            continue
        
        # Find and update current_quote
        pattern = rf"('{symbol}':\s*\{{\s*'current_quote':\s*\{{)'price':\s*[\d.]+,\s*'change':\s*[-\d.]+,\s*'change_percent':\s*[-\d.]+"
        replacement = rf"\1'price': {data['price']}, 'change': {data['change']}, 'change_percent': {data['change_percent']}"
        
        new_content = re.sub(pattern, replacement, content)
        
        if new_content != content:
            content = new_content
            updated_count += 1
            print(f"✅ Updated {symbol}: ₹{data['price']}")
    
    # Write updated content
    with open(file_path, 'w') as f:
        f.write(content)
    
    print(f"\n✅ Updated {updated_count} stocks in {file_path}")
    print(f"📝 Backup saved as: {backup_path}")

def main():
    print("=" * 60)
    print("DEMO_DATA Auto-Update Script")
    print("=" * 60)
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Updating {len(STOCKS_TO_UPDATE)} stocks...\n")
    
    stock_data_map = {}
    
    for symbol in STOCKS_TO_UPDATE:
        data = fetch_stock_data(symbol)
        stock_data_map[symbol] = data
    
    # Update the file
    print("\n" + "=" * 60)
    print("Updating stock_routes.py...")
    print("=" * 60)
    update_stock_routes_file(stock_data_map)
    
    print("\n" + "=" * 60)
    print("✅ Update Complete!")
    print("=" * 60)
    print(f"Finished: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("\nNext steps:")
    print("1. Restart your Flask backend")
    print("2. Refresh TradeLens frontend")
    print("3. Verify updated prices")

if __name__ == "__main__":
    main()
