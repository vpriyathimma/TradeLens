def get_finnhub_quote(symbol):
    """Fetch live stock quote from Finnhub API"""
    try:
        # Convert symbol format for Finnhub
        # Indian stocks: TITAN.NS -> TITAN (Finnhub uses base symbol)
        # US stocks: META -> META
        if '.NS' in symbol:
            finnhub_symbol = symbol.replace('.NS', '')
        else:
            finnhub_symbol = symbol
        
        logging.info(f"Fetching Finnhub quote for {finnhub_symbol}")
        
        # Get real-time quote
        quote = finnhub_client.quote(finnhub_symbol)
        
        if quote and quote.get('c', 0) > 0:  # 'c' is current price
            current_price = quote['c']
            prev_close = quote.get('pc', current_price)  # previous close
            change = current_price - prev_close
            change_percent = (change / prev_close * 100) if prev_close > 0 else 0
            
            logging.info(f"✅ Finnhub success for {finnhub_symbol}: ${current_price}")
            
            return {
                'success': True,
                'price': round(current_price, 2),
                'change': round(change, 2),
                'change_percent': round(change_percent, 2),
                'symbol': symbol,
                'name': finnhub_symbol
            }
        else:
            logging.warning(f"Finnhub returned no data for {finnhub_symbol}")
            return {'success': False, 'error': 'No data'}
            
    except Exception as e:
        logging.error(f"Finnhub API error for {symbol}: {e}")
        return {'success': False, 'error': str(e)}
