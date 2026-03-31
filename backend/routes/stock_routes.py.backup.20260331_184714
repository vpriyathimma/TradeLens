from flask import Blueprint, jsonify, request
import logging
import numpy as np
import requests
import yfinance as yf
import finnhub
from datetime import datetime, timedelta
from .sentiment_analysis import fetch_and_analyze_stock_sentiment
from .risk_analysis import fetch_risk_results, risk_analysis_model
from .prediction_analysis import stock_price_predictor, train_or_load_model
from .nse_api import get_nse_stock_quote

# Initialize Finnhub client for live stock data
FINNHUB_API_KEY = "d5f7q31r01qtf8in0s4gd5f7q31r01qtf8in0s50"
finnhub_client = finnhub.Client(api_key=FINNHUB_API_KEY)

stock_bp = Blueprint('stock', __name__)
risk_bp = Blueprint('risk', __name__)
portfolio = ['TCS.NS', 'ITC.NS', 'ZOMATO.NS', 'TATASTEEL.NS', 'INFY.NS', 
                'RELIANCE.NS', 'HDFCBANK.NS', 'ICICIBANK.NS', 'SBIN.NS']
@risk_bp.route('/analyze/<symbol>', methods=['GET'])
def analyze_stock_risk(symbol):
    try:
        if not symbol:
            return jsonify({"error": "Symbol is required"}), 400
        
        # Attempt to get risk analysis results
        results = fetch_risk_results(symbol, portfolio)
        
        # Check for error in results
        if 'error' in results:
            return jsonify({
                "risk_analysis": {
                    "error": results['error'],
                    "risk_level": 'N/A',
                    "volatility": 'N/A',
                    "daily_return": 'N/A',
                    "current_price": 'N/A',
                    "trend": 'N/A',
                    "latest_close": None
                }
            }), 400
        
        # Return successful risk analysis
        return jsonify({
            "risk_analysis": {
                "risk_level": results.get('risk_level', 'N/A'),
                "volatility": results.get('volatility', 'N/A'),
                "daily_return": results.get('daily_return', 'N/A'),
                "current_price": results.get('current_price', 'N/A'),
                "trend": results.get('trend', 'N/A'),
                "latest_close": results.get('latest_close', None)
            }
        })
        
    except Exception as e:
        logging.error(f"Comprehensive error analyzing risk for {symbol}: {str(e)}")
        return jsonify({
            "risk_analysis": {
                "error": "Failed to analyze stock risk",
                "risk_level": 'N/A',
                "volatility": 'N/A',
                "daily_return": 'N/A',
                "current_price": 'N/A',
                "trend": 'N/A',
                "latest_close": None
            }
        }), 500
def prepare_data(df):
    """Prepare data with technical indicators"""
    df['sma_20'] = df['Close'].rolling(window=20).mean()
    df['sma_50'] = df['Close'].rolling(window=50).mean()
    df['ema_20'] = df['Close'].ewm(span=20, adjust=False).mean()
    df['ema_50'] = df['Close'].ewm(span=50, adjust=False).mean()
    
    # MACD
    df['macd'] = df['Close'].ewm(span=12, adjust=False).mean() - df['Close'].ewm(span=26, adjust=False).mean()
    df['macd_signal'] = df['macd'].ewm(span=9, adjust=False).mean()
    df['macd_value'] = df['macd'] - df['macd_signal']
    
    # RSI
    delta = df['Close'].diff(1)
    gain = delta.where(delta > 0, 0)
    loss = -delta.where(delta < 0, 0)
    avg_gain = gain.rolling(window=14, min_periods=1).mean()
    avg_loss = loss.rolling(window=14, min_periods=1).mean()
    rs = avg_gain / avg_loss
    df['rsi_14'] = 100 - (100 / (1 + rs))
    
    return df

def stock_price_predictor(symbol, start_date, end_date):
    try:
        # Get current price data
        stock = yf.Ticker(symbol)
        current_data = stock.history(period='1d')
        
        if current_data.empty:
            logging.error(f"No current data found for {symbol}")
            return {'error': 'Could not fetch current stock data'}
        
        last_close_price = float(current_data['Close'].iloc[-1])
        
        # Train/load model and make prediction
        try:
            model, scaler = train_or_load_model(symbol, start_date, end_date)
        except Exception as e:
            logging.error(f"Model training error for {symbol}: {str(e)}")
            return {'error': f"Failed to train model: {str(e)}"}
        
        # Prepare latest data for prediction
        try:
            df = yf.download(symbol, start=start_date - timedelta(days=100), end=end_date)
            if df.empty:
                return {'error': 'Insufficient historical data for prediction'}
            
            df = prepare_data(df)
            df.dropna(inplace=True)
            
            if len(df) < 60:  # Check if we have enough data points
                return {'error': 'Insufficient data points for prediction'}
            
            features = ['Open', 'High', 'Low', 'Volume', 'sma_20', 'sma_50', 
                       'ema_20', 'ema_50', 'macd_value', 'rsi_14']
            
            # Verify all features exist
            missing_features = [f for f in features if f not in df.columns]
            if missing_features:
                return {'error': f'Missing features: {missing_features}'}
            
            # Scale and reshape latest data
            latest_data = scaler.transform(df[features].tail(60))
            latest_data = latest_data.reshape(1, 60, len(features))
            
            # Make prediction
            predicted_price = float(model.predict(latest_data)[0][0])
            
            # Calculate metrics
            price_change = predicted_price - last_close_price
            price_change_percent = (price_change / last_close_price) * 100
            
            # Calculate confidence based on recent prediction accuracy
            recent_predictions = model.predict(latest_data[-10:])
            recent_actuals = df['Close'].tail(10).values
            prediction_errors = np.abs((recent_predictions - recent_actuals) / recent_actuals)
            confidence = max(min(100 * (1 - np.mean(prediction_errors)), 95), 50)
            
            return {
                'predicted_price': round(predicted_price, 2),
                'last_close_price': round(last_close_price, 2),
                'price_change': round(price_change, 2),
                'price_change_percent': round(price_change_percent, 2),
                'prediction_confidence': round(confidence, 1),
                'prediction_direction': 'Bullish' if price_change > 0 else 'Bearish'
            }
            
        except Exception as e:
            logging.error(f"Data preparation error for {symbol}: {str(e)}")
            return {'error': f"Failed to prepare prediction data: {str(e)}"}
        
    except Exception as e:
        logging.error(f"Price prediction error for {symbol}: {str(e)}")
        return {'error': f"Failed to predict price: {str(e)}"}
# Financial Modeling Prep API Configuration
FMP_API_KEY = 'Td1BfQwEyhj6sQnmgWzw7HIjgCNkZutK'
BASE_URL = 'https://financialmodelingprep.com/api'

def search_stocks(query):
    """Search stocks using yfinance - no API key needed"""
    try:
        # COMPLETE NIFTY 50 STOCKS - All 50 companies
        indian_stocks = {
            # Already added stocks
            'TCS': {'symbol': 'TCS.NS', 'name': 'Tata Consultancy Services', 'exchange': 'NSE'},
            'RELIANCE': {'symbol': 'RELIANCE.NS', 'name': 'Reliance Industries', 'exchange': 'NSE'},
            'HDFC': {'symbol': 'HDFCBANK.NS', 'name': 'HDFC Bank', 'exchange': 'NSE'},
            'HDFCBANK': {'symbol': 'HDFCBANK.NS', 'name': 'HDFC Bank', 'exchange': 'NSE'},
            'INFY': {'symbol': 'INFY.NS', 'name': 'Infosys', 'exchange': 'NSE'},
            'ITC': {'symbol': 'ITC.NS', 'name': 'ITC Limited', 'exchange': 'NSE'},
            'ICICI': {'symbol': 'ICICIBANK.NS', 'name': 'ICICI Bank', 'exchange': 'NSE'},
            'ICICIBANK': {'symbol': 'ICICIBANK.NS', 'name': 'ICICI Bank', 'exchange': 'NSE'},
            'SBIN': {'symbol': 'SBIN.NS', 'name': 'State Bank of India', 'exchange': 'NSE'},
            'TATASTEEL': {'symbol': 'TATASTEEL.NS', 'name': 'Tata Steel', 'exchange': 'NSE'},
            'WIPRO': {'symbol': 'WIPRO.NS', 'name': 'Wipro', 'exchange': 'NSE'},
            'TITAN': {'symbol': 'TITAN.NS', 'name': 'Titan Company', 'exchange': 'NSE'},
            'BHARTIARTL': {'symbol': 'BHARTIARTL.NS', 'name': 'Bharti Airtel', 'exchange': 'NSE'},
            'HINDUNILVR': {'symbol': 'HINDUNILVR.NS', 'name': 'Hindustan Unilever', 'exchange': 'NSE'},
            'LT': {'symbol': 'LT.NS', 'name': 'Larsen & Toubro', 'exchange': 'NSE'},
            'KOTAKBANK': {'symbol': 'KOTAKBANK.NS', 'name': 'Kotak Mahindra Bank', 'exchange': 'NSE'},
            'AXISBANK': {'symbol': 'AXISBANK.NS', 'name': 'Axis Bank', 'exchange': 'NSE'},
            'MARUTI': {'symbol': 'MARUTI.NS', 'name': 'Maruti Suzuki', 'exchange': 'NSE'},
            'SUNPHARMA': {'symbol': 'SUNPHARMA.NS', 'name': 'Sun Pharmaceutical', 'exchange': 'NSE'},
            'NTPC': {'symbol': 'NTPC.NS', 'name': 'NTPC Limited', 'exchange': 'NSE'},
            'ONGC': {'symbol': 'ONGC.NS', 'name': 'Oil & Natural Gas Corp', 'exchange': 'NSE'},
            'POWERGRID': {'symbol': 'POWERGRID.NS', 'name': 'Power Grid Corporation', 'exchange': 'NSE'},
            'ASIANPAINT': {'symbol': 'ASIANPAINT.NS', 'name': 'Asian Paints', 'exchange': 'NSE'},
            'BAJFINANCE': {'symbol': 'BAJFINANCE.NS', 'name': 'Bajaj Finance', 'exchange': 'NSE'},
            'HCLTECH': {'symbol': 'HCLTECH.NS', 'name': 'HCL Technologies', 'exchange': 'NSE'},
            'TECHM': {'symbol': 'TECHM.NS', 'name': 'Tech Mahindra', 'exchange': 'NSE'},
            'ULTRACEMCO': {'symbol': 'ULTRACEMCO.NS', 'name': 'UltraTech Cement', 'exchange': 'NSE'},
            'M&M': {'symbol': 'M&M.NS', 'name': 'Mahindra & Mahindra', 'exchange': 'NSE'},
            'ADANIPORTS': {'symbol': 'ADANIPORTS.NS', 'name': 'Adani Ports', 'exchange': 'NSE'},
            'GRASIM': {'symbol': 'GRASIM.NS', 'name': 'Grasim Industries', 'exchange': 'NSE'},
            
            # Additional Nifty 50 stocks
            'ADANIENT': {'symbol': 'ADANIENT.NS', 'name': 'Adani Enterprises', 'exchange': 'NSE'},
            'APOLLOHOSP': {'symbol': 'APOLLOHOSP.NS', 'name': 'Apollo Hospitals', 'exchange': 'NSE'},
            'BAJAJ-AUTO': {'symbol': 'BAJAJ-AUTO.NS', 'name': 'Bajaj Auto', 'exchange': 'NSE'},
            'BAJAJFINSV': {'symbol': 'BAJAJFINSV.NS', 'name': 'Bajaj Finserv', 'exchange': 'NSE'},
            'BEL': {'symbol': 'BEL.NS', 'name': 'Bharat Electronics', 'exchange': 'NSE'},
            'BPCL': {'symbol': 'BPCL.NS', 'name': 'Bharat Petroleum', 'exchange': 'NSE'},
            'BRITANNIA': {'symbol': 'BRITANNIA.NS', 'name': 'Britannia Industries', 'exchange': 'NSE'},
            'CIPLA': {'symbol': 'CIPLA.NS', 'name': 'Cipla', 'exchange': 'NSE'},
            'COALINDIA': {'symbol': 'COALINDIA.NS', 'name': 'Coal India', 'exchange': 'NSE'},
            'DIVISLAB': {'symbol': 'DIVISLAB.NS', 'name': 'Divi\'s Laboratories', 'exchange': 'NSE'},
            'DRREDDY': {'symbol': 'DRREDDY.NS', 'name': 'Dr Reddy\'s Laboratories', 'exchange': 'NSE'},
            'EICHERMOT': {'symbol': 'EICHERMOT.NS', 'name': 'Eicher Motors', 'exchange': 'NSE'},
            'GAIL': {'symbol': 'GAIL.NS', 'name': 'GAIL India', 'exchange': 'NSE'},
            'HEROMOTOCO': {'symbol': 'HEROMOTOCO.NS', 'name': 'Hero MotoCorp', 'exchange': 'NSE'},
            'HINDALCO': {'symbol': 'HINDALCO.NS', 'name': 'Hindalco Industries', 'exchange': 'NSE'},
            'INDUSINDBK': {'symbol': 'INDUSINDBK.NS', 'name': 'IndusInd Bank', 'exchange': 'NSE'},
            'JSWSTEEL': {'symbol': 'JSWSTEEL.NS', 'name': 'JSW Steel', 'exchange': 'NSE'},
            'NESTLEIND': {'symbol': 'NESTLEIND.NS', 'name': 'Nestle India', 'exchange': 'NSE'},
            'SBILIFE': {'symbol': 'SBILIFE.NS', 'name': 'SBI Life Insurance', 'exchange': 'NSE'},
            'SHRIRAMFIN': {'symbol': 'SHRIRAMFIN.NS', 'name': 'Shriram Finance', 'exchange': 'NSE'},
            'TATAMOTORS': {'symbol': 'TATAMOTORS.NS', 'name': 'Tata Motors', 'exchange': 'NSE'},
            'TATACONSUM': {'symbol': 'TATACONSUM.NS', 'name': 'Tata Consumer Products', 'exchange': 'NSE'},
            'UPL': {'symbol': 'UPL.NS', 'name': 'UPL Limited', 'exchange': 'NSE'},
            
            # US Stocks
            'META': {'symbol': 'META', 'name': 'Meta Platforms Inc', 'exchange': 'NASDAQ'},
            'AAPL': {'symbol': 'AAPL', 'name': 'Apple Inc', 'exchange': 'NASDAQ'},
            'GOOGL': {'symbol': 'GOOGL', 'name': 'Alphabet Inc', 'exchange': 'NASDAQ'},
            'MSFT': {'symbol': 'MSFT', 'name': 'Microsoft Corporation', 'exchange': 'NASDAQ'},
            'TSLA': {'symbol': 'TSLA', 'name': 'Tesla Inc', 'exchange': 'NASDAQ'},
        }
        
        results = []
        query_upper = query.upper()
        
        # Search in predefined stocks
        for key, stock in indian_stocks.items():
            if query_upper in key or query_upper in stock['name'].upper():
                results.append({
                    'symbol': stock['symbol'],
                    'name': stock['name'],
                    'exchangeShortName': stock['exchange']
                })
        
        # If no match found, try direct yfinance lookup
        if not results:
            try:
                ticker = yf.Ticker(query_upper if '.' in query else f"{query_upper}.NS")
                info = ticker.info
                if info and info.get('regularMarketPrice'):
                    results.append({
                        'symbol': query_upper if '.' in query else f"{query_upper}.NS",
                        'name': info.get('longName', query_upper),
                        'exchangeShortName': info.get('exchange', 'NSE')
                    })
            except:
                pass
        
        return results[:10]
    
    except Exception as e:
        logging.error(f"Error in stock search: {e}")
        raise

@stock_bp.route('/search', methods=['GET'])
def search_stocks_route():
    query = request.args.get('name', '').strip()
    
    if not query:
        return jsonify({"error": "Please provide a valid stock name or symbol"}), 400
    
    try:
        search_results = search_stocks(query)
        return jsonify(search_results)
    
    except requests.RequestException as e:
        logging.error(f"Network error: {e}")
        return jsonify({"error": "Network error occurred"}), 500
    except Exception as e:
        logging.error(f"Unexpected error: {e}")
        return jsonify({"error": "An unexpected error occurred"}), 500

def get_finnhub_quote(symbol):
    """Fetch live stock quote from Finnhub API"""
    try:
        if '.NS' in symbol:
            finnhub_symbol = symbol.replace('.NS', '')
        else:
            finnhub_symbol = symbol
        logging.info(f"Fetching Finnhub quote for {finnhub_symbol}")
        quote = finnhub_client.quote(finnhub_symbol)
        if quote and quote.get('c', 0) > 0:
            current_price = quote['c']
            prev_close = quote.get('pc', current_price)
            change = current_price - prev_close
            change_percent = (change / prev_close * 100) if prev_close > 0 else 0
            return {'success': True, 'price': round(current_price, 2), 'change': round(change, 2), 'change_percent': round(change_percent, 2), 'symbol': symbol, 'name': finnhub_symbol}
        else:
            return {'success': False, 'error': 'No data'}
    except Exception as e:
        logging.error(f"Finnhub API error for {symbol}: {e}")
        return {'success': False, 'error': str(e)}

def get_stock_details(symbol):
    # NEW: Try Finnhub API first for live data, fall back to DEMO_DATA if it fails
    try:
        # Step 1: Try Finnhub API for live real-time data
        logging.info(f"Attempting Finnhub API for {symbol}")
        finnhub_data = get_finnhub_quote(symbol)
        
        if finnhub_data['success']:
            # Finnhub succeeded! Use live data
            logging.info(f"✅ Using LIVE Finnhub data for {symbol}")
            # We'll build stock_details with Finnhub data below
            use_finnhub = True
        else:
            # Finnhub failed, try DEMO_DATA
            logging.warning(f"Finnhub failed for {symbol}, checking DEMO_DATA")
            use_finnhub = False
            
            if 'DEMO_DATA' in globals():
                check_sym_ns = symbol if '.NS' in symbol else f"{symbol}.NS"
                if check_sym_ns in DEMO_DATA:
                    logging.info(f"Using DEMO_DATA fallback for {check_sym_ns}")
                    return DEMO_DATA[check_sym_ns]
                if symbol in DEMO_DATA:
                    logging.info(f"Using DEMO_DATA fallback for {symbol}")
                    return DEMO_DATA[symbol]
    except Exception as e:
        logging.warning(f"Finnhub/DEMO_DATA check failed: {e}")
        use_finnhub = False

    try:
        # Initialize default response structure with safe defaults
        stock_details = {
            'current_quote': {
                'price': 0.0,
                'change': 0.0,
                'change_percent': 0.0,
            },
            'profile': {
                'name': 'Unknown',
                'symbol': symbol,
                'industry': 'Unknown',
                'sector': 'Unknown',
                'country': 'Unknown',
                'website': '#',
            },
            'historical_prices': [],
            'news': [],
            'sentiment': None,
            'risk_analysis': None,
            'price_prediction': None  # New field for price prediction
        }

        # Try fetching from NSE API first for Indian stocks
        nse_success = False
        if '.NS' in symbol or symbol in ['TCS', 'INFY', 'RELIANCE', 'SBIN', 'HDFCBANK', 'ICICIBANK', 'ITC']:
            logging.info(f"Attempting to fetch NSE data for {symbol}")
            nse_data = get_nse_stock_quote(symbol)
            
            if nse_data['success']:
                logging.info(f"Successfully fetched NSE data for {symbol}")
                stock_details['current_quote'] = {
                    'price': nse_data['price'],
                    'change': nse_data['change'],
                    'change_percent': nse_data['change_percent']
                }
                stock_details['profile'].update({
                    'name': nse_data['name'],
                    'symbol': nse_data['symbol'] + '.NS',
                    'industry': nse_data['industry']
                })
                nse_success = True
            else:
                logging.warning(f"NSE API failed for {symbol}: {nse_data.get('error')}")

        # If NSE failed, try Financial Modeling Prep (FMP)
        if not nse_success:
            try:
                logging.info(f"Attempting to fetch FMP data for {symbol}")
                fmp_symbol = symbol
                # FMP requires just the symbol without .NS often, but for NSE it might need it. 
                # Usually FMP uses 'TITAN.NS' format for India.
                
                fmp_url = f"{BASE_URL}/v3/quote/{fmp_symbol}?apikey={FMP_API_KEY}"
                response = requests.get(fmp_url, timeout=5)
                
                if response.status_code == 200:
                    data = response.json()
                    if data and isinstance(data, list) and len(data) > 0:
                        quote = data[0]
                        stock_details['current_quote'] = {
                            'price': float(quote.get('price', 0)),
                            'change': float(quote.get('change', 0)),
                            'change_percent': float(quote.get('changesPercentage', 0))
                        }
                        # FMP profile data is good too, update if missing
                        if stock_details['profile']['name'] == 'Unknown':
                            stock_details['profile'].update({
                                'name': quote.get('name', symbol),
                                'symbol': quote.get('symbol', symbol),
                                'industry': 'N/A', # Quote doesn't have industry, profile endpoint needed
                            })
                        
                        logging.info(f"Successfully fetched FMP data for {symbol}: {stock_details['current_quote']['price']}")
                        nse_success = True  # Treat FMP success as "nse_success" to skip yfinance
                    else:
                        logging.warning(f"FMP returned empty data for {symbol}")
            except Exception as e:
                logging.error(f"FMP API failed for {symbol}: {e}")

        
        # If NSE and FMP failed, try custom Yahoo Finance Scraper
        if not nse_success:
            try:
                logging.info(f"Attempting custom Yahoo scraping for {symbol}")
                headers = {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
                url = f"https://finance.yahoo.com/quote/{symbol}"
                response = requests.get(url, headers=headers, timeout=5)
                
                if response.status_code == 200:
                    from bs4 import BeautifulSoup
                    soup = BeautifulSoup(response.text, 'html.parser')
                    
                    # Try to find price based on common Yahoo classes (may change, but worth a shot)
                    price_element = soup.find('fin-streamer', {'data-field': 'regularMarketPrice'})
                    change_element = soup.find('fin-streamer', {'data-field': 'regularMarketChange'})
                    pct_element = soup.find('fin-streamer', {'data-field': 'regularMarketChangePercent'})
                    
                    if price_element:
                        price = float(price_element.get('data-value', 0) or price_element.text.replace(',', ''))
                        change = float(change_element.get('data-value', 0) if change_element else 0)
                        pct = float(pct_element.get('data-value', 0) if pct_element else 0)
                        
                        stock_details['current_quote'] = {
                            'price': price,
                            'change': change,
                            'change_percent': pct
                        }
                        
                        # Try to get name
                        name_element = soup.find('h1')
                        if name_element:
                             stock_details['profile']['name'] = name_element.text.strip()
                        
                        logging.info(f"Custom Scraper success for {symbol}: {price}")
                        nse_success = True
            except Exception as e:
                logging.error(f"Custom Scraper failed for {symbol}: {e}")

        # If all else failed, fallback to yfinance regular fetch
        if not nse_success:
            # Fetch stock information using yfinance
            stock = yf.Ticker(symbol)
            logging.info(f"Fetching yfinance data for {symbol}")

            # Company Profile from yfinance
            try:
                info = stock.info
                if info:
                    stock_details['profile'].update({
                        'name': info.get('longName', info.get('shortName', 'Unknown')),
                        'industry': info.get('industry', 'Unknown'),
                        'sector': info.get('sector', 'Unknown'),
                        'country': info.get('country', 'Unknown'),
                        'website': info.get('website', '#'),
                    })
                    # Get current price from info if available
                    current_price_info = info.get('currentPrice') or info.get('regularMarketPrice')
                    if current_price_info:
                        prev_close = info.get('previousClose', current_price_info)
                        change = current_price_info - prev_close
                        change_percent = (change / prev_close * 100) if prev_close else 0
                        stock_details['current_quote'] = {
                            'price': float(current_price_info),
                            'change': float(change),
                            'change_percent': float(change_percent)
                        }
                        logging.info(f"Got price from info: {current_price_info}")
            except Exception as e:
                logging.error(f"Error getting stock info: {e}")

            # If we still don't have price, try history
            if stock_details['current_quote']['price'] == 0:
                try:
                    current_price = stock.history(period='5d')
                    if not current_price.empty:
                        close_price = current_price['Close'].iloc[-1]
                        previous_close = current_price['Close'].iloc[-2] if len(current_price) > 1 else close_price
                        change = close_price - previous_close
                        change_percent = (change / previous_close) * 100 if previous_close else 0

                        stock_details['current_quote'] = {
                            'price': float(close_price),
                            'change': float(change),
                            'change_percent': float(change_percent)
                        }
                        logging.info(f"Got price from history: {close_price}")
                except Exception as e:
                    logging.error(f"Error getting stock history: {e}")

        # Historical Prices (Last 365 days) from yfinance
        try:
            historical_data = stock.history(period='1y')
            if not historical_data.empty:
                stock_details['historical_prices'] = [
                    {
                        'date': idx.strftime('%Y-%m-%d'),
                        'close': float(row['Close'])
                    }
                    for idx, row in historical_data.iterrows()
                ]
        except Exception as e:
            logging.error(f"Error getting historical data: {e}")

        # News from Financial Modeling Prep (unchanged from original)
        news_url = f"{BASE_URL}/v3/stock_news"
        news_response = requests.get(news_url, params={
            'tickers': symbol,
            'limit': 5,
            'apikey': FMP_API_KEY
        })
        news_data = news_response.json()

        if news_data and isinstance(news_data, list):
            stock_details['news'] = [
                {
                    'title': article.get('title', ''),
                    'publisher': article.get('site', ''),
                    'link': article.get('url', ''),
                    'published_at': article.get('publishedDate', '')
                }
                for article in news_data[:5]
            ]

        # Fetch sentiment analysis 
        try:
            sentiment_data = fetch_and_analyze_stock_sentiment(symbol)
            
            # Combine existing news with sentiment news if needed
            existing_news = stock_details.get('news', [])
            sentiment_news = sentiment_data.get('news', [])
            
            # Merge news, prioritizing sentiment news but keeping existing if sentiment news is empty
            stock_details['news'] = sentiment_news if sentiment_news else existing_news
            
            stock_details['sentiment'] = {
                'overall_prediction': sentiment_data.get('overall_prediction', None)
            }
        except Exception as e:
            logging.error(f"Error fetching sentiment: {e}")
            stock_details['sentiment'] = None
        # Fetch Risk Analysis
        try:
            # Use requests to make an internal API call
            risk_response = requests.get(f"{request.host_url}risk/analyze/{symbol}")
            if risk_response.ok:
                stock_details['risk_analysis'] = risk_response.json().get('risk_analysis')
            else:
                stock_details['risk_analysis'] = {
                    'risk_level': 'N/A',
                    'volatility': 'N/A',
                    'daily_return': 'N/A',
                    'current_price': 'N/A',
                    'latest_close': None,
                    'trend': 'N/A'
                }
        except Exception as e:
            logging.error(f"Error fetching risk analysis: {e}")
            stock_details['risk_analysis'] = {
                'risk_level': 'N/A',
                'volatility': 'N/A',
                'daily_return': 'N/A',
                'current_price': 'N/A',
                'latest_close': None,
                'trend': 'N/A'
            }
        try:
            # Use the stock_price_predictor function
            end_date = datetime.now()
            start_date = end_date - timedelta(days=365)
            prediction_result = stock_price_predictor(symbol, start_date, end_date)
            
            if 'error' not in prediction_result:
                stock_details['price_prediction'] = {
                    'predicted_price': prediction_result.get('predicted_price'),
                    'last_close_price': prediction_result.get('last_close_price'),
                    'price_change': prediction_result.get('price_change'),
                    'prediction_confidence': prediction_result.get('prediction_confidence'),
                    'prediction_direction': prediction_result.get('prediction_direction')
                }
            else:
                logging.error(f"Price prediction error: {prediction_result['error']}")
                stock_details['price_prediction'] = None

        except Exception as e:
            logging.error(f"Error in price prediction: {e}")
            stock_details['price_prediction'] = None

        return stock_details

    except Exception as e:
        logging.error(f"Comprehensive error fetching stock details: {e}")
        return None
    
import time
_stock_cache = {}
_stock_cache_timeout = 60  # 1 minute cache for fresher data

@stock_bp.route('/clear-cache', methods=['GET'])
def clear_cache():
    global _stock_cache
    _stock_cache = {}
    return jsonify({"message": "Cache cleared", "status": "success"})

# Fallback demo data for when Yahoo Finance rate limits
DEMO_DATA = {
    'TITAN.NS': {
        'current_quote': {'price': 4294.00, 'change': 182.20, 'change_percent': 4.43},
        'profile': {'name': 'Titan Company Limited', 'symbol': 'TITAN.NS', 'industry': 'Luxury Goods', 'sector': 'Consumer Cyclical', 'country': 'India', 'website': 'https://www.titan.co.in'},
        'historical_prices': [
            {'date': '2025-12-09', 'close': 4061.73}, {'date': '2025-12-10', 'close': 4063.09}, {'date': '2025-12-11', 'close': 4091.36}, 
            {'date': '2025-12-12', 'close': 4115.82}, {'date': '2025-12-13', 'close': 4138.45}, {'date': '2025-12-14', 'close': 4162.91}, 
            {'date': '2025-12-15', 'close': 4145.23}, {'date': '2025-12-16', 'close': 4168.77}, {'date': '2025-12-17', 'close': 4192.45}, 
            {'date': '2025-12-18', 'close': 4215.89}, {'date': '2025-12-19', 'close': 4189.34}, {'date': '2025-12-20', 'close': 4212.67}, 
            {'date': '2025-12-21', 'close': 4235.12}, {'date': '2025-12-22', 'close': 4258.91}, {'date': '2025-12-23', 'close': 4282.34}, 
            {'date': '2025-12-24', 'close': 4255.67}, {'date': '2025-12-25', 'close': 4278.23}, {'date': '2025-12-26', 'close': 4301.45}, 
            {'date': '2025-12-27', 'close': 4324.78}, {'date': '2025-12-28', 'close': 4298.12}, {'date': '2025-12-29', 'close': 4271.56}, 
            {'date': '2025-12-30', 'close': 4244.89}, {'date': '2025-12-31', 'close': 4218.34}, {'date': '2026-01-01', 'close': 4241.67}, 
            {'date': '2026-01-02', 'close': 4265.12}, {'date': '2026-01-03', 'close': 4238.45}, {'date': '2026-01-04', 'close': 4261.78}, 
            {'date': '2026-01-05', 'close': 4285.23}, {'date': '2026-01-06', 'close': 4308.67}, {'date': '2026-01-07', 'close': 4294.00}
        ],
        'news': [], 'sentiment': {'overall_prediction': 78}, 
        'risk_analysis': {'risk_level': 'Medium', 'volatility': '14.8%', 'daily_return': '4.43%', 'current_price': '4294.00', 'trend': 'Bullish'}, 
        'price_prediction': {'predicted_price': 4450, 'last_close_price': 4294.00, 'price_change': 156.00, 'prediction_confidence': 80, 'prediction_direction': 'Bullish'}
    },
    'TCS.NS': {
        'current_quote': {'price': 3255.80, 'change': 39.70, 'change_percent': 1.23},
        'profile': {'name': 'Tata Consultancy Services', 'symbol': 'TCS.NS', 'industry': 'IT Services', 'sector': 'Technology', 'country': 'India', 'website': 'https://www.tcs.com'},
        'historical_prices': [
            {'date': '2025-12-09', 'close': 3088.21}, {'date': '2025-12-10', 'close': 3102.45}, {'date': '2025-12-11', 'close': 3116.78}, 
            {'date': '2025-12-12', 'close': 3131.23}, {'date': '2025-12-13', 'close': 3145.67}, {'date': '2025-12-14', 'close': 3160.12}, 
            {'date': '2025-12-15', 'close': 3174.56}, {'date': '2025-12-16', 'close': 3189.01}, {'date': '2025-12-17', 'close': 3203.45}, 
            {'date': '2025-12-18', 'close': 3217.89}, {'date': '2025-12-19', 'close': 3232.34}, {'date': '2025-12-20', 'close': 3246.78}, 
            {'date': '2025-12-21', 'close': 3261.23}, {'date': '2025-12-22', 'close': 3247.56}, {'date': '2025-12-23', 'close': 3233.89}, 
            {'date': '2025-12-24', 'close': 3220.23}, {'date': '2025-12-25', 'close': 3206.56}, {'date': '2025-12-26', 'close': 3192.89}, 
            {'date': '2025-12-27', 'close': 3179.23}, {'date': '2025-12-28', 'close': 3193.67}, {'date': '2025-12-29', 'close': 3208.12}, 
            {'date': '2025-12-30', 'close': 3222.56}, {'date': '2025-12-31', 'close': 3237.01}, {'date': '2026-01-01', 'close': 3251.45}, 
            {'date': '2026-01-02', 'close': 3265.89}, {'date': '2026-01-03', 'close': 3252.23}, {'date': '2026-01-04', 'close': 3238.56}, 
            {'date': '2026-01-05', 'close': 3224.89}, {'date': '2026-01-06', 'close': 3239.34}, {'date': '2026-01-07', 'close': 3255.80}
        ],
        'news': [], 'sentiment': {'overall_prediction': 65}, 
        'risk_analysis': {'risk_level': 'Low', 'volatility': '12.5%', 'daily_return': '1.23%', 'current_price': '3255.80', 'trend': 'Bullish'}, 
        'price_prediction': {'predicted_price': 3350, 'last_close_price': 3255.80, 'price_change': 94.20, 'prediction_confidence': 75, 'prediction_direction': 'Bullish'}
    },
    'META': {
        'current_quote': {'price': 48868.38, 'change': 1043.75, 'change_percent': 2.18},
        'profile': {'name': 'Meta Platforms Inc', 'symbol': 'META', 'industry': 'Internet Content', 'sector': 'Technology', 'country': 'USA', 'website': 'https://www.meta.com'},
        'historical_prices': [
            {'date': '2025-12-09', 'close': 46424.96}, {'date': '2025-12-10', 'close': 46758.23}, {'date': '2025-12-11', 'close': 47091.5}, 
            {'date': '2025-12-12', 'close': 47424.77}, {'date': '2025-12-13', 'close': 47758.04}, {'date': '2025-12-14', 'close': 48091.31}, 
            {'date': '2025-12-15', 'close': 48424.58}, {'date': '2025-12-16', 'close': 48757.85}, {'date': '2025-12-17', 'close': 49091.12}, 
            {'date': '2025-12-18', 'close': 49424.39}, {'date': '2025-12-19', 'close': 49091.56}, {'date': '2025-12-20', 'close': 48758.73}, 
            {'date': '2025-12-21', 'close': 48425.9}, {'date': '2025-12-22', 'close': 48093.07}, {'date': '2025-12-23', 'close': 47760.24}, 
            {'date': '2025-12-24', 'close': 47427.41}, {'date': '2025-12-25', 'close': 47760.89}, {'date': '2025-12-26', 'close': 48094.37}, 
            {'date': '2025-12-27', 'close': 48427.85}, {'date': '2025-12-28', 'close': 48761.33}, {'date': '2025-12-29', 'close': 49094.81}, 
            {'date': '2025-12-30', 'close': 48761.64}, {'date': '2025-12-31', 'close': 48428.47}, {'date': '2026-01-01', 'close': 48762.15}, 
            {'date': '2026-01-02', 'close': 49095.83}, {'date': '2026-01-03', 'close': 48762.26}, {'date': '2026-01-04', 'close': 48428.69}, 
            {'date': '2026-01-05', 'close': 48648.53}, {'date': '2026-01-06', 'close': 48758.45}, {'date': '2026-01-07', 'close': 48868.38}
        ],
        'news': [], 'sentiment': {'overall_prediction': 72}, 
        'risk_analysis': {'risk_level': 'Medium', 'volatility': '18.2%', 'daily_return': '2.18%', 'current_price': '48868.38', 'trend': 'Bullish'}, 
        'price_prediction': {'predicted_price': 50935, 'last_close_price': 48868.38, 'price_change': 2066.62, 'prediction_confidence': 68, 'prediction_direction': 'Bullish'}
    },
    'RELIANCE.NS': {
        'current_quote': {'price': 1506.90, 'change': 6.10, 'change_percent': 0.41},
        'profile': {'name': 'Reliance Industries', 'symbol': 'RELIANCE.NS', 'industry': 'Oil & Gas', 'sector': 'Energy', 'country': 'India', 'website': 'https://www.ril.com'},
        'historical_prices': [
            {'date': '2025-12-09', 'close': 1431.55}, {'date': '2025-12-10', 'close': 1438.23}, {'date': '2025-12-11', 'close': 1444.91}, 
            {'date': '2025-12-12', 'close': 1451.59}, {'date': '2025-12-13', 'close': 1458.27}, {'date': '2025-12-14', 'close': 1464.95}, 
            {'date': '2025-12-15', 'close': 1471.63}, {'date': '2025-12-16', 'close': 1478.31}, {'date': '2025-12-17', 'close': 1484.99}, 
            {'date': '2025-12-18', 'close': 1491.67}, {'date': '2025-12-19', 'close': 1498.35}, {'date': '2025-12-20', 'close': 1505.03}, 
            {'date': '2025-12-21', 'close': 1498.56}, {'date': '2025-12-22', 'close': 1492.09}, {'date': '2025-12-23', 'close': 1485.62}, 
            {'date': '2025-12-24', 'close': 1479.15}, {'date': '2025-12-25', 'close': 1472.68}, {'date': '2025-12-26', 'close': 1466.21}, 
            {'date': '2025-12-27', 'close': 1472.89}, {'date': '2025-12-28', 'close': 1479.57}, {'date': '2025-12-29', 'close': 1486.25}, 
            {'date': '2025-12-30', 'close': 1492.93}, {'date': '2025-12-31', 'close': 1499.61}, {'date': '2026-01-01', 'close': 1506.29}, 
            {'date': '2026-01-02', 'close': 1512.97}, {'date': '2026-01-03', 'close': 1506.45}, {'date': '2026-01-04', 'close': 1499.93}, 
            {'date': '2026-01-05', 'close': 1493.41}, {'date': '2026-01-06', 'close': 1500.15}, {'date': '2026-01-07', 'close': 1506.90}
        ],
        'news': [], 'sentiment': {'overall_prediction': 55}, 
        'risk_analysis': {'risk_level': 'Medium', 'volatility': '15.8%', 'daily_return': '0.41%', 'current_price': '1506.90', 'trend': 'Neutral'}, 
        'price_prediction': {'predicted_price': 1550, 'last_close_price': 1506.90, 'price_change': 43.10, 'prediction_confidence': 62, 'prediction_direction': 'Bullish'}
    },
    'WIPRO.NS': {
        'current_quote': {'price': 456.80, 'change': 7.65, 'change_percent': 1.70},
        'profile': {'name': 'Wipro Limited', 'symbol': 'WIPRO.NS', 'industry': 'IT Services', 'sector': 'Technology', 'country': 'India', 'website': 'https://www.wipro.com'},
        'historical_prices': [
            {'date': '2025-12-09', 'close': 433.96}, {'date': '2025-12-10', 'close': 437.12}, {'date': '2025-12-11', 'close': 440.28}, 
            {'date': '2025-12-12', 'close': 443.44}, {'date': '2025-12-13', 'close': 446.6}, {'date': '2025-12-14', 'close': 449.76}, 
            {'date': '2025-12-15', 'close': 452.92}, {'date': '2025-12-16', 'close': 456.08}, {'date': '2025-12-17', 'close': 459.24}, 
            {'date': '2025-12-18', 'close': 462.4}, {'date': '2025-12-19', 'close': 459.56}, {'date': '2025-12-20', 'close': 456.72}, 
            {'date': '2025-12-21', 'close': 453.88}, {'date': '2025-12-22', 'close': 451.04}, {'date': '2025-12-23', 'close': 448.2}, 
            {'date': '2025-12-24', 'close': 445.36}, {'date': '2025-12-25', 'close': 448.64}, {'date': '2025-12-26', 'close': 451.92}, 
            {'date': '2025-12-27', 'close': 455.2}, {'date': '2025-12-28', 'close': 458.48}, {'date': '2025-12-29', 'close': 461.76}, 
            {'date': '2025-12-30', 'close': 458.92}, {'date': '2025-12-31', 'close': 456.08}, {'date': '2026-01-01', 'close': 459.44}, 
            {'date': '2026-01-02', 'close': 462.8}, {'date': '2026-01-03', 'close': 459.96}, {'date': '2026-01-04', 'close': 457.12}, 
            {'date': '2026-01-05', 'close': 454.46}, {'date': '2026-01-06', 'close': 455.63}, {'date': '2026-01-07', 'close': 456.8}
        ],
        'news': [], 'sentiment': {'overall_prediction': 62}, 
        'risk_analysis': {'risk_level': 'Low', 'volatility': '14.2%', 'daily_return': '1.70%', 'current_price': '456.80', 'trend': 'Bullish'}, 
        'price_prediction': {'predicted_price': 475, 'last_close_price': 456.80, 'price_change': 18.20, 'prediction_confidence': 70, 'prediction_direction': 'Bullish'}
    },
    'INFY.NS': {
        'current_quote': {'price': 1627.80, 'change': 5.80, 'change_percent': 0.36},
        'profile': {'name': 'Infosys Limited', 'symbol': 'INFY.NS', 'industry': 'IT Services', 'sector': 'Technology', 'country': 'India', 'website': 'https://www.infosys.com'},
        'historical_prices': [
            {'date': '2025-12-09', 'close': 1546.41}, {'date': '2025-12-10', 'close': 1552.78}, {'date': '2025-12-11', 'close': 1559.15}, 
            {'date': '2025-12-12', 'close': 1565.52}, {'date': '2025-12-13', 'close': 1571.89}, {'date': '2025-12-14', 'close': 1578.26}, 
            {'date': '2025-12-15', 'close': 1584.63}, {'date': '2025-12-16', 'close': 1591.00}, {'date': '2025-12-17', 'close': 1597.37}, 
            {'date': '2025-12-18', 'close': 1603.74}, {'date': '2025-12-19', 'close': 1610.11}, {'date': '2025-12-20', 'close': 1616.48}, 
            {'date': '2025-12-21', 'close': 1610.23}, {'date': '2025-12-22', 'close': 1603.98}, {'date': '2025-12-23', 'close': 1597.73}, 
            {'date': '2025-12-24', 'close': 1591.48}, {'date': '2025-12-25', 'close': 1585.23}, {'date': '2025-12-26', 'close': 1591.67}, 
            {'date': '2025-12-27', 'close': 1598.11}, {'date': '2025-12-28', 'close': 1604.55}, {'date': '2025-12-29', 'close': 1610.99}, 
            {'date': '2025-12-30', 'close': 1617.43}, {'date': '2025-12-31', 'close': 1623.87}, {'date': '2026-01-01', 'close': 1630.31}, 
            {'date': '2026-01-02', 'close': 1624.12}, {'date': '2026-01-03', 'close': 1617.93}, {'date': '2026-01-04', 'close': 1611.74}, 
            {'date': '2026-01-05', 'close': 1618.23}, {'date': '2026-01-06', 'close': 1624.72}, {'date': '2026-01-07', 'close': 1627.80}
        ],
        'news': [], 'sentiment': {'overall_prediction': 70}, 
        'risk_analysis': {'risk_level': 'Low', 'volatility': '12.8%', 'daily_return': '0.36%', 'current_price': '1627.80', 'trend': 'Bullish'}, 
        'price_prediction': {'predicted_price': 1680, 'last_close_price': 1627.80, 'price_change': 52.20, 'prediction_confidence': 74, 'prediction_direction': 'Bullish'}
    },
    'HDFCBANK.NS': {
        'current_quote': {'price': 948.90, 'change': -11.10, 'change_percent': -1.15},
        'profile': {'name': 'HDFC Bank Limited', 'symbol': 'HDFCBANK.NS', 'industry': 'Banking', 'sector': 'Financial Services', 'country': 'India', 'website': 'https://www.hdfcbank.com'},
        'historical_prices': [
            {'date': '2025-12-09', 'close': 898.41}, {'date': '2025-12-10', 'close': 879.63}, {'date': '2025-12-11', 'close': 887.53}, 
            {'date': '2025-12-12', 'close': 887.17}, {'date': '2025-12-13', 'close': 896.12}, {'date': '2025-12-14', 'close': 885.04}, 
            {'date': '2025-12-15', 'close': 886.69}, {'date': '2025-12-16', 'close': 867.51}, {'date': '2025-12-17', 'close': 872.04}, 
            {'date': '2025-12-18', 'close': 869.5}, {'date': '2025-12-19', 'close': 878.55}, {'date': '2025-12-20', 'close': 871.05}, 
            {'date': '2025-12-21', 'close': 859.93}, {'date': '2025-12-22', 'close': 874.85}, {'date': '2025-12-23', 'close': 857.09}, 
            {'date': '2025-12-24', 'close': 858.17}, {'date': '2025-12-25', 'close': 858.45}, {'date': '2025-12-26', 'close': 871.65}, 
            {'date': '2025-12-27', 'close': 891.76}, {'date': '2025-12-28', 'close': 900.98}, {'date': '2025-12-29', 'close': 904.0}, 
            {'date': '2025-12-30', 'close': 923.71}, {'date': '2025-12-31', 'close': 943.56}, {'date': '2026-01-01', 'close': 955.7}, 
            {'date': '2026-01-02', 'close': 942.14}, {'date': '2026-01-03', 'close': 925.94}, {'date': '2026-01-04', 'close': 933.59}, 
            {'date': '2026-01-05', 'close': 936.08}, {'date': '2026-01-06', 'close': 941.23}, {'date': '2026-01-07', 'close': 948.9}
        ],
        'news': [], 'sentiment': {'overall_prediction': 52}, 
        'risk_analysis': {'risk_level': 'Medium', 'volatility': '16.5%', 'daily_return': '-1.15%', 'current_price': '948.90', 'trend': 'Neutral'}, 
        'price_prediction': {'predicted_price': 980, 'last_close_price': 948.90, 'price_change': 31.10, 'prediction_confidence': 58, 'prediction_direction': 'Bullish'}
    },
    'ICICIBANK.NS': {
        'current_quote': {'price': 1413.60, 'change': 39.40, 'change_percent': 2.87},
        'profile': {'name': 'ICICI Bank Limited', 'symbol': 'ICICIBANK.NS', 'industry': 'Banking', 'sector': 'Financial Services', 'country': 'India', 'website': 'https://www.icicibank.com'},
        'historical_prices': [
            {'date': '2025-12-09', 'close': 1337.38}, {'date': '2025-12-10', 'close': 1346.82}, {'date': '2025-12-11', 'close': 1351.86}, 
            {'date': '2025-12-12', 'close': 1343.7}, {'date': '2025-12-13', 'close': 1320.61}, {'date': '2025-12-14', 'close': 1316.34}, 
            {'date': '2025-12-15', 'close': 1291.45}, {'date': '2025-12-16', 'close': 1293.49}, {'date': '2025-12-17', 'close': 1317.76}, 
            {'date': '2025-12-18', 'close': 1302.5}, {'date': '2025-12-19', 'close': 1296.95}, {'date': '2025-12-20', 'close': 1315.74}, 
            {'date': '2025-12-21', 'close': 1326.43}, {'date': '2025-12-22', 'close': 1320.76}, {'date': '2025-12-23', 'close': 1302.27}, 
            {'date': '2025-12-24', 'close': 1281.74}, {'date': '2025-12-25', 'close': 1314.83}, {'date': '2025-12-26', 'close': 1342.96}, 
            {'date': '2025-12-27', 'close': 1361.51}, {'date': '2025-12-28', 'close': 1348.11}, {'date': '2025-12-29', 'close': 1356.17}, 
            {'date': '2025-12-30', 'close': 1345.75}, {'date': '2025-12-31', 'close': 1355.72}, {'date': '2026-01-01', 'close': 1369.74}, 
            {'date': '2026-01-02', 'close': 1397.47}, {'date': '2026-01-03', 'close': 1407.7}, {'date': '2026-01-04', 'close': 1422.43}, 
            {'date': '2026-01-05', 'close': 1420.16}, {'date': '2026-01-06', 'close': 1422.86}, {'date': '2026-01-07', 'close': 1413.6}
        ],
        'news': [], 'sentiment': {'overall_prediction': 66}, 
        'risk_analysis': {'risk_level': 'Low', 'volatility': '13.8%', 'daily_return': '2.87%', 'current_price': '1413.60', 'trend': 'Bullish'}, 
        'price_prediction': {'predicted_price': 1480, 'last_close_price': 1413.60, 'price_change': 66.40, 'prediction_confidence': 72, 'prediction_direction': 'Bullish'}
    },
    'SBIN.NS': {
        'current_quote': {'price': 1006.00, 'change': -12.80, 'change_percent': -1.26},
        'profile': {'name': 'State Bank of India', 'symbol': 'SBIN.NS', 'industry': 'Banking', 'sector': 'Financial Services', 'country': 'India', 'website': 'https://www.sbi.co.in'},
        'historical_prices': [
            {'date': '2025-12-09', 'close': 971.3}, {'date': '2025-12-10', 'close': 949.42}, {'date': '2025-12-11', 'close': 973.93}, 
            {'date': '2025-12-12', 'close': 991.24}, {'date': '2025-12-13', 'close': 978.22}, {'date': '2025-12-14', 'close': 961.49}, 
            {'date': '2025-12-15', 'close': 981.12}, {'date': '2025-12-16', 'close': 985.86}, {'date': '2025-12-17', 'close': 994.43}, 
            {'date': '2025-12-18', 'close': 1006.2}, {'date': '2025-12-19', 'close': 996.42}, {'date': '2025-12-20', 'close': 1005.81}, 
            {'date': '2025-12-21', 'close': 1001.24}, {'date': '2025-12-22', 'close': 1005.85}, {'date': '2025-12-23', 'close': 989.78}, 
            {'date': '2025-12-24', 'close': 972.75}, {'date': '2025-12-25', 'close': 952.52}, {'date': '2025-12-26', 'close': 945.14}, 
            {'date': '2025-12-27', 'close': 937.76}, {'date': '2025-12-28', 'close': 933.4}, {'date': '2025-12-29', 'close': 922.1}, 
            {'date': '2025-12-30', 'close': 903.89}, {'date': '2025-12-31', 'close': 892.42}, {'date': '2026-01-01', 'close': 881.39}, 
            {'date': '2026-01-02', 'close': 867.01}, {'date': '2026-01-03', 'close': 867.81}, {'date': '2026-01-04', 'close': 872.22}, 
            {'date': '2026-01-05', 'close': 892.97}, {'date': '2026-01-06', 'close': 911.17}, {'date': '2026-01-07', 'close': 1006.0}
        ],
        'news': [], 'sentiment': {'overall_prediction': 58}, 
        'risk_analysis': {'risk_level': 'Medium', 'volatility': '15.2%', 'daily_return': '-1.26%', 'current_price': '1006.00', 'trend': 'Neutral'}, 
        'price_prediction': {'predicted_price': 1050, 'last_close_price': 1006.00, 'price_change': 44.00, 'prediction_confidence': 65, 'prediction_direction': 'Bullish'}
    },
    'TATASTEEL.NS': {
        'current_quote': {'price': 184.00, 'change': 1.12, 'change_percent': 0.61},
        'profile': {'name': 'Tata Steel Limited', 'symbol': 'TATASTEEL.NS', 'industry': 'Steel', 'sector': 'Materials', 'country': 'India', 'website': 'https://www.tatasteel.com'},
        'historical_prices': [
            {'date': '2025-12-09', 'close': 171.25}, {'date': '2025-12-10', 'close': 173.7}, {'date': '2025-12-11', 'close': 176.26}, 
            {'date': '2025-12-12', 'close': 175.97}, {'date': '2025-12-13', 'close': 173.65}, {'date': '2025-12-14', 'close': 175.53}, 
            {'date': '2025-12-15', 'close': 174.11}, {'date': '2025-12-16', 'close': 172.17}, {'date': '2025-12-17', 'close': 173.19}, 
            {'date': '2025-12-18', 'close': 172.18}, {'date': '2025-12-19', 'close': 173.47}, {'date': '2025-12-20', 'close': 173.24}, 
            {'date': '2025-12-21', 'close': 176.06}, {'date': '2025-12-22', 'close': 172.9}, {'date': '2025-12-23', 'close': 174.47}, 
            {'date': '2025-12-24', 'close': 175.15}, {'date': '2025-12-25', 'close': 178.36}, {'date': '2025-12-26', 'close': 179.77}, 
            {'date': '2025-12-27', 'close': 177.99}, {'date': '2025-12-28', 'close': 175.69}, {'date': '2025-12-29', 'close': 173.18}, 
            {'date': '2025-12-30', 'close': 176.02}, {'date': '2025-12-31', 'close': 178.68}, {'date': '2026-01-01', 'close': 176.43}, 
            {'date': '2026-01-02', 'close': 174.99}, {'date': '2026-01-03', 'close': 172.98}, {'date': '2026-01-04', 'close': 177.39}, 
            {'date': '2026-01-05', 'close': 179.1}, {'date': '2026-01-06', 'close': 181.38}, {'date': '2026-01-07', 'close': 184.0}
        ],
        'news': [], 'sentiment': {'overall_prediction': 42}, 
        'risk_analysis': {'risk_level': 'High', 'volatility': '22.5%', 'daily_return': '0.61%', 'current_price': '184.00', 'trend': 'Bullish'}, 
        'price_prediction': {'predicted_price': 195, 'last_close_price': 184.00, 'price_change': 11.00, 'prediction_confidence': 55, 'prediction_direction': 'Bullish'}
    },
    'BHARTIARTL.NS': {
        'current_quote': {'price': 2105.30, 'change': 23.00, 'change_percent': 1.09},
        'profile': {'name': 'Bharti Airtel Limited', 'symbol': 'BHARTIARTL.NS', 'industry': 'Telecommunications', 'sector': 'Communication Services', 'country': 'India', 'website': 'https://www.airtel.in'},
        'historical_prices': [
            {'date': '2025-12-09', 'close': 2028.01}, {'date': '2025-12-10', 'close': 2068.69}, {'date': '2025-12-11', 'close': 2036.94}, 
            {'date': '2025-12-12', 'close': 2017.15}, {'date': '2025-12-13', 'close': 2040.52}, {'date': '2025-12-14', 'close': 2068.34}, 
            {'date': '2025-12-15', 'close': 2102.46}, {'date': '2025-12-16', 'close': 2089.57}, {'date': '2025-12-17', 'close': 2131.76}, 
            {'date': '2025-12-18', 'close': 2143.19}, {'date': '2025-12-19', 'close': 2125.47}, {'date': '2025-12-20', 'close': 2153.72}, 
            {'date': '2025-12-21', 'close': 2128.53}, {'date': '2025-12-22', 'close': 2177.91}, {'date': '2025-12-23', 'close': 2225.32}, 
            {'date': '2025-12-24', 'close': 2249.83}, {'date': '2025-12-25', 'close': 2221.9}, {'date': '2025-12-26', 'close': 2227.09}, 
            {'date': '2025-12-27', 'close': 2220.0}, {'date': '2025-12-28', 'close': 2196.68}, {'date': '2025-12-29', 'close': 2155.65}, 
            {'date': '2025-12-30', 'close': 2151.72}, {'date': '2025-12-31', 'close': 2152.88}, {'date': '2026-01-01', 'close': 2180.69}, 
            {'date': '2026-01-02', 'close': 2185.77}, {'date': '2026-01-03', 'close': 2162.05}, {'date': '2026-01-04', 'close': 2184.61}, 
            {'date': '2026-01-05', 'close': 2152.47}, {'date': '2026-01-06', 'close': 2135.5}, {'date': '2026-01-07', 'close': 2105.3}
        ],
        'news': [], 'sentiment': {'overall_prediction': 75}, 
        'risk_analysis': {'risk_level': 'Low', 'volatility': '11.5%', 'daily_return': '1.09%', 'current_price': '2105.30', 'trend': 'Bullish'}, 
        'price_prediction': {'predicted_price': 2150, 'last_close_price': 2105.30, 'price_change': 44.70, 'prediction_confidence': 78, 'prediction_direction': 'Bullish'}
    },
    'HINDUNILVR.NS': {
        'current_quote': {'price': 2403.90, 'change': -81.70, 'change_percent': -3.29},
        'profile': {'name': 'Hindustan Unilever', 'symbol': 'HINDUNILVR.NS', 'industry': 'FMCG', 'sector': 'Consumer Goods', 'country': 'India', 'website': 'https://www.hul.co.in'},
        'historical_prices': [
            {'date': '2025-12-09', 'close': 2275.71}, {'date': '2025-12-10', 'close': 2280.13}, {'date': '2025-12-11', 'close': 2268.87}, 
            {'date': '2025-12-12', 'close': 2246.21}, {'date': '2025-12-13', 'close': 2237.18}, {'date': '2025-12-14', 'close': 2262.01}, 
            {'date': '2025-12-15', 'close': 2239.62}, {'date': '2025-12-16', 'close': 2262.04}, {'date': '2025-12-17', 'close': 2320.22}, 
            {'date': '2025-12-18', 'close': 2325.2}, {'date': '2025-12-19', 'close': 2292.43}, {'date': '2025-12-20', 'close': 2256.41}, 
            {'date': '2025-12-21', 'close': 2279.69}, {'date': '2025-12-22', 'close': 2243.42}, {'date': '2025-12-23', 'close': 2195.64}, 
            {'date': '2025-12-24', 'close': 2158.3}, {'date': '2025-12-25', 'close': 2183.8}, {'date': '2025-12-26', 'close': 2201.57}, 
            {'date': '2025-12-27', 'close': 2212.75}, {'date': '2025-12-28', 'close': 2223.56}, {'date': '2025-12-29', 'close': 2257.39}, 
            {'date': '2025-12-30', 'close': 2216.38}, {'date': '2025-12-31', 'close': 2187.02}, {'date': '2026-01-01', 'close': 2210.34}, 
            {'date': '2026-01-02', 'close': 2248.16}, {'date': '2026-01-03', 'close': 2231.9}, {'date': '2026-01-04', 'close': 2223.62}, 
            {'date': '2026-01-05', 'close': 2237.89}, {'date': '2026-01-06', 'close': 2219.63}, {'date': '2026-01-07', 'close': 2403.9}
        ],
        'news': [], 'sentiment': {'overall_prediction': 60}, 'risk_analysis': {'risk_level': 'Low', 'volatility': '10.5%', 'daily_return': '-3.29%', 'current_price': '2403.90', 'trend': 'Bearish'}, 
        'price_prediction': {'predicted_price': 2450, 'last_close_price': 2403.90, 'price_change': 46.10, 'prediction_confidence': 68, 'prediction_direction': 'Bullish'}
    },
    'ITC.NS': {
        'current_quote': {'price': 342.45, 'change': -122.85, 'change_percent': -26.40},
        'profile': {'name': 'ITC Limited', 'symbol': 'ITC.NS', 'industry': 'FMCG', 'sector': 'Consumer Goods', 'country': 'India', 'website': 'https://www.itcportal.com'},
        'historical_prices': [
            {'date': '2025-12-09', 'close': 325.33}, {'date': '2025-12-10', 'close': 328.45}, {'date': '2025-12-11', 'close': 331.57}, 
            {'date': '2025-12-12', 'close': 334.69}, {'date': '2025-12-13', 'close': 337.81}, {'date': '2025-12-14', 'close': 340.93}, 
            {'date': '2025-12-15', 'close': 344.05}, {'date': '2025-12-16', 'close': 347.17}, {'date': '2025-12-17', 'close': 350.29}, 
            {'date': '2025-12-18', 'close': 353.41}, {'date': '2025-12-19', 'close': 356.53}, {'date': '2025-12-20', 'close': 359.65}, 
            {'date': '2025-12-21', 'close': 356.78}, {'date': '2025-12-22', 'close': 353.91}, {'date': '2025-12-23', 'close': 351.04}, 
            {'date': '2025-12-24', 'close': 348.17}, {'date': '2025-12-25', 'close': 345.3}, {'date': '2025-12-26', 'close': 342.43}, 
            {'date': '2025-12-27', 'close': 339.56}, {'date': '2025-12-28', 'close': 336.69}, {'date': '2025-12-29', 'close': 333.82}, 
            {'date': '2025-12-30', 'close': 330.95}, {'date': '2025-12-31', 'close': 328.08}, {'date': '2026-01-01', 'close': 331.45}, 
            {'date': '2026-01-02', 'close': 334.82}, {'date': '2026-01-03', 'close': 338.19}, {'date': '2026-01-04', 'close': 341.56}, 
            {'date': '2026-01-05', 'close': 344.93}, {'date': '2026-01-06', 'close': 341.19}, {'date': '2026-01-07', 'close': 342.45}
        ],
        'news': [], 'sentiment': {'overall_prediction': 68}, 'risk_analysis': {'risk_level': 'Low', 'volatility': '12.2%', 'daily_return': '-26.40%', 'current_price': '342.45', 'trend': 'Bearish'}, 
        'price_prediction': {'predicted_price': 360, 'last_close_price': 342.45, 'price_change': 17.55, 'prediction_confidence': 72, 'prediction_direction': 'Bullish'}
    },
    'LT.NS': {
        'current_quote': {'price': 3520.75, 'change': 45.20, 'change_percent': 1.30},
        'profile': {'name': 'Larsen & Toubro', 'symbol': 'LT.NS', 'industry': 'Construction', 'sector': 'Industrials', 'country': 'India', 'website': 'https://www.larsentoubro.com'},
        'historical_prices': [
            {'date': '2025-12-09', 'close': 3341.71}, {'date': '2025-12-10', 'close': 3362.85}, {'date': '2025-12-11', 'close': 3383.99}, 
            {'date': '2025-12-12', 'close': 3405.13}, {'date': '2025-12-13', 'close': 3426.27}, {'date': '2025-12-14', 'close': 3447.41}, 
            {'date': '2025-12-15', 'close': 3468.55}, {'date': '2025-12-16', 'close': 3489.69}, {'date': '2025-12-17', 'close': 3510.83}, 
            {'date': '2025-12-18', 'close': 3531.97}, {'date': '2025-12-19', 'close': 3515.45}, {'date': '2025-12-20', 'close': 3498.93}, 
            {'date': '2025-12-21', 'close': 3482.41}, {'date': '2025-12-22', 'close': 3465.89}, {'date': '2025-12-23', 'close': 3449.37}, 
            {'date': '2025-12-24', 'close': 3432.85}, {'date': '2025-12-25', 'close': 3416.33}, {'date': '2025-12-26', 'close': 3433.12}, 
            {'date': '2025-12-27', 'close': 3449.91}, {'date': '2025-12-28', 'close': 3466.7}, {'date': '2025-12-29', 'close': 3483.49}, 
            {'date': '2025-12-30', 'close': 3500.28}, {'date': '2025-12-31', 'close': 3517.07}, {'date': '2026-01-01', 'close': 3533.86}, 
            {'date': '2026-01-02', 'close': 3517.23}, {'date': '2026-01-03', 'close': 3500.6}, {'date': '2026-01-04', 'close': 3508.45}, 
            {'date': '2026-01-05', 'close': 3516.3}, {'date': '2026-01-06', 'close': 3524.15}, {'date': '2026-01-07', 'close': 3520.75}
        ],
        'news': [], 'sentiment': {'overall_prediction': 72}, 'risk_analysis': {'risk_level': 'Medium', 'volatility': '14.8%', 'daily_return': '1.30%', 'current_price': '3520.75', 'trend': 'Bullish'}, 
        'price_prediction': {'predicted_price': 3650, 'last_close_price': 3520.75, 'price_change': 129.25, 'prediction_confidence': 70, 'prediction_direction': 'Bullish'}
    },
    'KOTAKBANK.NS': {
        'current_quote': {'price': 2125.30, 'change': 339.90, 'change_percent': 19.04},
        'profile': {'name': 'Kotak Mahindra Bank', 'symbol': 'KOTAKBANK.NS', 'industry': 'Banking', 'sector': 'Financial Services', 'country': 'India', 'website': 'https://www.kotak.com'},
        'historical_prices': [
            {'date': '2025-12-09', 'close': 2017.04}, {'date': '2025-12-10', 'close': 2029.18}, {'date': '2025-12-11', 'close': 2041.32}, 
            {'date': '2025-12-12', 'close': 2053.46}, {'date': '2025-12-13', 'close': 2065.6}, {'date': '2025-12-14', 'close': 2077.74}, 
            {'date': '2025-12-15', 'close': 2089.88}, {'date': '2025-12-16', 'close': 2102.02}, {'date': '2025-12-17', 'close': 2114.16}, 
            {'date': '2025-12-18', 'close': 2126.3}, {'date': '2025-12-19', 'close': 2111.45}, {'date': '2025-12-20', 'close': 2096.6}, 
            {'date': '2025-12-21', 'close': 2081.75}, {'date': '2025-12-22', 'close': 2066.9}, {'date': '2025-12-23', 'close': 2052.05}, 
            {'date': '2025-12-24', 'close': 2037.2}, {'date': '2025-12-25', 'close': 2053.67}, {'date': '2025-12-26', 'close': 2070.14}, 
            {'date': '2025-12-27', 'close': 2086.61}, {'date': '2025-12-28', 'close': 2103.08}, {'date': '2025-12-29', 'close': 2119.55}, 
            {'date': '2025-12-30', 'close': 2136.02}, {'date': '2025-12-31', 'close': 2152.49}, {'date': '2026-01-01', 'close': 2137.12}, 
            {'date': '2026-01-02', 'close': 2121.75}, {'date': '2026-01-03', 'close': 2106.38}, {'date': '2026-01-04', 'close': 2113.45}, 
            {'date': '2026-01-05', 'close': 2120.52}, {'date': '2026-01-06', 'close': 2127.59}, {'date': '2026-01-07', 'close': 2125.3}
        ],
        'news': [], 'sentiment': {'overall_prediction': 64}, 'risk_analysis': {'risk_level': 'Low', 'volatility': '13.2%', 'daily_return': '19.04%', 'current_price': '2125.30', 'trend': 'Bullish'}, 
        'price_prediction': {'predicted_price': 2200, 'last_close_price': 2125.30, 'price_change': 74.70, 'prediction_confidence': 68, 'prediction_direction': 'Bullish'}
    },
    'AXISBANK.NS': {
        'current_quote': {'price': 1289.50, 'change': 163.70, 'change_percent': 14.54},
        'profile': {'name': 'Axis Bank', 'symbol': 'AXISBANK.NS', 'industry': 'Banking', 'sector': 'Financial Services', 'country': 'India', 'website': 'https://www.axisbank.com'},
        'historical_prices': [
            {'date': '2025-12-09', 'close': 1223.03}, {'date': '2025-12-10', 'close': 1231.56}, {'date': '2025-12-11', 'close': 1240.09}, 
            {'date': '2025-12-12', 'close': 1248.62}, {'date': '2025-12-13', 'close': 1257.15}, {'date': '2025-12-14', 'close': 1265.68}, 
            {'date': '2025-12-15', 'close': 1274.21}, {'date': '2025-12-16', 'close': 1282.74}, {'date': '2025-12-17', 'close': 1291.27}, 
            {'date': '2025-12-18', 'close': 1299.8}, {'date': '2025-12-19', 'close': 1291.45}, {'date': '2025-12-20', 'close': 1283.1}, 
            {'date': '2025-12-21', 'close': 1274.75}, {'date': '2025-12-22', 'close': 1266.4}, {'date': '2025-12-23', 'close': 1258.05}, 
            {'date': '2025-12-24', 'close': 1249.7}, {'date': '2025-12-25', 'close': 1257.89}, {'date': '2025-12-26', 'close': 1266.08}, 
            {'date': '2025-12-27', 'close': 1274.27}, {'date': '2025-12-28', 'close': 1282.46}, {'date': '2025-12-29', 'close': 1290.65}, 
            {'date': '2025-12-30', 'close': 1298.84}, {'date': '2025-12-31', 'close': 1307.03}, {'date': '2026-01-01', 'close': 1298.56}, 
            {'date': '2026-01-02', 'close': 1290.09}, {'date': '2026-01-03', 'close': 1281.62}, {'date': '2026-01-04', 'close': 1287.45}, 
            {'date': '2026-01-05', 'close': 1293.28}, {'date': '2026-01-06', 'close': 1291.39}, {'date': '2026-01-07', 'close': 1289.5}
        ],
        'news': [], 'sentiment': {'overall_prediction': 66}, 'risk_analysis': {'risk_level': 'Medium', 'volatility': '15.5%', 'daily_return': '14.54%', 'current_price': '1289.50', 'trend': 'Bullish'}, 
        'price_prediction': {'predicted_price': 1350, 'last_close_price': 1289.50, 'price_change': 60.50, 'prediction_confidence': 70, 'prediction_direction': 'Bullish'}
    },
    'MARUTI.NS': {
        'current_quote': {'price': 16719.00, 'change': 5468.55, 'change_percent': 48.61},
        'profile': {'name': 'Maruti Suzuki India', 'symbol': 'MARUTI.NS', 'industry': 'Automobiles', 'sector': 'Consumer Discretionary', 'country': 'India', 'website': 'https://www.marutisuzuki.com'},
        'historical_prices': [
            {'date': '2025-12-09', 'close': 15882.05}, {'date': '2025-12-10', 'close': 15995.23}, {'date': '2025-12-11', 'close': 16108.41}, 
            {'date': '2025-12-12', 'close': 16221.59}, {'date': '2025-12-13', 'close': 16334.77}, {'date': '2025-12-14', 'close': 16447.95}, 
            {'date': '2025-12-15', 'close': 16561.13}, {'date': '2025-12-16', 'close': 16674.31}, {'date': '2025-12-17', 'close': 16787.49}, 
            {'date': '2025-12-18', 'close': 16900.67}, {'date': '2025-12-19', 'close': 16783.45}, {'date': '2025-12-20', 'close': 16666.23}, 
            {'date': '2025-12-21', 'close': 16549.01}, {'date': '2025-12-22', 'close': 16431.79}, {'date': '2025-12-23', 'close': 16314.57}, 
            {'date': '2025-12-24', 'close': 16197.35}, {'date': '2025-12-25', 'close': 16314.89}, {'date': '2025-12-26', 'close': 16432.43}, 
            {'date': '2025-12-27', 'close': 16549.97}, {'date': '2025-12-28', 'close': 16667.51}, {'date': '2025-12-29', 'close': 16785.05}, 
            {'date': '2025-12-30', 'close': 16667.34}, {'date': '2025-12-31', 'close': 16549.63}, {'date': '2026-01-01', 'close': 16667.45}, 
            {'date': '2026-01-02', 'close': 16785.27}, {'date': '2026-01-03', 'close': 16667.12}, {'date': '2026-01-04', 'close': 16548.97}, 
            {'date': '2026-01-05', 'close': 16634.48}, {'date': '2026-01-06', 'close': 16676.74}, {'date': '2026-01-07', 'close': 16719.0}
        ],
        'news': [], 'sentiment': {'overall_prediction': 70}, 'risk_analysis': {'risk_level': 'Medium', 'volatility': '16.2%', 'daily_return': '48.61%', 'current_price': '16719.00', 'trend': 'Bullish'}, 
        'price_prediction': {'predicted_price': 17000, 'last_close_price': 16719.00, 'price_change': 281.00, 'prediction_confidence': 72, 'prediction_direction': 'Bullish'}
    },
    'SUNPHARMA.NS': {
        'current_quote': {'price': 1779.90, 'change': 237.30, 'change_percent': 15.38},
        'profile': {'name': 'Sun Pharmaceutical', 'symbol': 'SUNPHARMA.NS', 'industry': 'Pharmaceuticals', 'sector': 'Healthcare', 'country': 'India', 'website': 'https://www.sunpharma.com'},
        'historical_prices': [
            {'date': '2025-12-09', 'close': 1690.41}, {'date': '2025-12-10', 'close': 1701.78}, {'date': '2025-12-11', 'close': 1713.15}, 
            {'date': '2025-12-12', 'close': 1724.52}, {'date': '2025-12-13', 'close': 1735.89}, {'date': '2025-12-14', 'close': 1747.26}, 
            {'date': '2025-12-15', 'close': 1758.63}, {'date': '2025-12-16', 'close': 1770.0}, {'date': '2025-12-17', 'close': 1781.37}, 
            {'date': '2025-12-18', 'close': 1792.74}, {'date': '2025-12-19', 'close': 1781.56}, {'date': '2025-12-20', 'close': 1770.38}, 
            {'date': '2025-12-21', 'close': 1759.2}, {'date': '2025-12-22', 'close': 1748.02}, {'date': '2025-12-23', 'close': 1736.84}, 
            {'date': '2025-12-24', 'close': 1725.66}, {'date': '2025-12-25', 'close': 1737.12}, {'date': '2025-12-26', 'close': 1748.58}, 
            {'date': '2025-12-27', 'close': 1760.04}, {'date': '2025-12-28', 'close': 1771.5}, {'date': '2025-12-29', 'close': 1782.96}, 
            {'date': '2025-12-30', 'close': 1771.67}, {'date': '2025-12-31', 'close': 1760.38}, {'date': '2026-01-01', 'close': 1771.89}, 
            {'date': '2026-01-02', 'close': 1783.4}, {'date': '2026-01-03', 'close': 1771.56}, {'date': '2026-01-04', 'close': 1759.72}, 
            {'date': '2026-01-05', 'close': 1769.81}, {'date': '2026-01-06', 'close': 1774.85}, {'date': '2026-01-07', 'close': 1779.9}
        ],
        'news': [], 'sentiment': {'overall_prediction': 74}, 'risk_analysis': {'risk_level': 'Low', 'volatility': '11.8%', 'daily_return': '15.38%', 'current_price': '1779.90', 'trend': 'Bullish'}, 
        'price_prediction': {'predicted_price': 1850, 'last_close_price': 1779.90, 'price_change': 70.10, 'prediction_confidence': 76, 'prediction_direction': 'Bullish'}
    },
    'NTPC.NS': {
        'current_quote': {'price': 347.90, 'change': -37.35, 'change_percent': -9.70},
        'profile': {'name': 'NTPC Limited', 'symbol': 'NTPC.NS', 'industry': 'Power', 'sector': 'Utilities', 'country': 'India', 'website': 'https://www.ntpc.co.in'},
        'historical_prices': [
            {'date': '2025-12-09', 'close': 330.51}, {'date': '2025-12-10', 'close': 333.02}, {'date': '2025-12-11', 'close': 335.53}, 
            {'date': '2025-12-12', 'close': 338.04}, {'date': '2025-12-13', 'close': 340.55}, {'date': '2025-12-14', 'close': 343.06}, 
            {'date': '2025-12-15', 'close': 345.57}, {'date': '2025-12-16', 'close': 348.08}, {'date': '2025-12-17', 'close': 350.59}, 
            {'date': '2025-12-18', 'close': 353.1}, {'date': '2025-12-19', 'close': 350.67}, {'date': '2025-12-20', 'close': 348.24}, 
            {'date': '2025-12-21', 'close': 345.81}, {'date': '2025-12-22', 'close': 343.38}, {'date': '2025-12-23', 'close': 340.95}, 
            {'date': '2025-12-24', 'close': 338.52}, {'date': '2025-12-25', 'close': 341.12}, {'date': '2025-12-26', 'close': 343.72}, 
            {'date': '2025-12-27', 'close': 346.32}, {'date': '2025-12-28', 'close': 348.92}, {'date': '2025-12-29', 'close': 351.52}, 
            {'date': '2025-12-30', 'close': 349.01}, {'date': '2025-12-31', 'close': 346.5}, {'date': '2026-01-01', 'close': 349.23}, 
            {'date': '2026-01-02', 'close': 351.96}, {'date': '2026-01-03', 'close': 349.43}, {'date': '2026-01-04', 'close': 346.9}, 
            {'date': '2026-01-05', 'close': 344.4}, {'date': '2026-01-06', 'close': 346.15}, {'date': '2026-01-07', 'close': 347.9}
        ],
        'news': [], 'sentiment': {'overall_prediction': 65}, 'risk_analysis': {'risk_level': 'Low', 'volatility': '12.5%', 'daily_return': '-9.70%', 'current_price': '347.90', 'trend': 'Bearish'}, 
        'price_prediction': {'predicted_price': 360, 'last_close_price': 347.90, 'price_change': 12.10, 'prediction_confidence': 70, 'prediction_direction': 'Bullish'}
    },
    'ONGC.NS': {
        'current_quote': {'price': 241.16, 'change': -24.24, 'change_percent': -9.13},
        'profile': {'name': 'Oil & Natural Gas Corp', 'symbol': 'ONGC.NS', 'industry': 'Oil & Gas', 'sector': 'Energy', 'country': 'India', 'website': 'https://www.ongcindia.com'},
        'historical_prices': [
            {'date': '2025-12-09', 'close': 229.1}, {'date': '2025-12-10', 'close': 230.95}, {'date': '2025-12-11', 'close': 232.8}, 
            {'date': '2025-12-12', 'close': 234.65}, {'date': '2025-12-13', 'close': 236.5}, {'date': '2025-12-14', 'close': 238.35}, 
            {'date': '2025-12-15', 'close': 240.2}, {'date': '2025-12-16', 'close': 242.05}, {'date': '2025-12-17', 'close': 243.9}, 
            {'date': '2025-12-18', 'close': 245.75}, {'date': '2025-12-19', 'close': 243.98}, {'date': '2025-12-20', 'close': 242.21}, 
            {'date': '2025-12-21', 'close': 240.44}, {'date': '2025-12-22', 'close': 238.67}, {'date': '2025-12-23', 'close': 236.9}, 
            {'date': '2025-12-24', 'close': 235.13}, {'date': '2025-12-25', 'close': 237.12}, {'date': '2025-12-26', 'close': 239.11}, 
            {'date': '2025-12-27', 'close': 241.1}, {'date': '2025-12-28', 'close': 243.09}, {'date': '2025-12-29', 'close': 245.08}, 
            {'date': '2025-12-30', 'close': 243.23}, {'date': '2025-12-31', 'close': 241.38}, {'date': '2026-01-01', 'close': 239.53}, 
            {'date': '2026-01-02', 'close': 237.68}, {'date': '2026-01-03', 'close': 235.83}, {'date': '2026-01-04', 'close': 237.99}, 
            {'date': '2026-01-05', 'close': 240.15}, {'date': '2026-01-06', 'close': 240.65}, {'date': '2026-01-07', 'close': 241.16}
        ],
        'news': [], 'sentiment': {'overall_prediction': 45}, 'risk_analysis': {'risk_level': 'High', 'volatility': '18.5%', 'daily_return': '-9.13%', 'current_price': '241.16', 'trend': 'Bearish'}, 
        'price_prediction': {'predicted_price': 235, 'last_close_price': 241.16, 'price_change': -6.16, 'prediction_confidence': 58, 'prediction_direction': 'Bearish'}
    },
    'POWERGRID.NS': {
        'current_quote': {'price': 266.45, 'change': -46.40, 'change_percent': -14.83},
        'profile': {'name': 'Power Grid Corporation', 'symbol': 'POWERGRID.NS', 'industry': 'Power', 'sector': 'Utilities', 'country': 'India', 'website': 'https://www.powergrid.in'},
        'historical_prices': [
            {'date': '2025-12-09', 'close': 253.13}, {'date': '2025-12-10', 'close': 254.81}, {'date': '2025-12-11', 'close': 256.49}, 
            {'date': '2025-12-12', 'close': 258.17}, {'date': '2025-12-13', 'close': 259.85}, {'date': '2025-12-14', 'close': 261.53}, 
            {'date': '2025-12-15', 'close': 263.21}, {'date': '2025-12-16', 'close': 264.89}, {'date': '2025-12-17', 'close': 266.57}, 
            {'date': '2025-12-18', 'close': 268.25}, {'date': '2025-12-19', 'close': 266.67}, {'date': '2025-12-20', 'close': 265.09}, 
            {'date': '2025-12-21', 'close': 263.51}, {'date': '2025-12-22', 'close': 261.93}, {'date': '2025-12-23', 'close': 260.35}, 
            {'date': '2025-12-24', 'close': 258.77}, {'date': '2025-12-25', 'close': 260.56}, {'date': '2025-12-26', 'close': 262.35}, 
            {'date': '2025-12-27', 'close': 264.14}, {'date': '2025-12-28', 'close': 265.93}, {'date': '2025-12-29', 'close': 267.72}, 
            {'date': '2025-12-30', 'close': 266.08}, {'date': '2025-12-31', 'close': 264.44}, {'date': '2026-01-01', 'close': 262.8}, 
            {'date': '2026-01-02', 'close': 261.16}, {'date': '2026-01-03', 'close': 263.31}, {'date': '2026-01-04', 'close': 265.46}, 
            {'date': '2026-01-05', 'close': 267.61}, {'date': '2026-01-06', 'close': 267.03}, {'date': '2026-01-07', 'close': 266.45}
        ],
        'news': [], 'sentiment': {'overall_prediction': 62}, 'risk_analysis': {'risk_level': 'Low', 'volatility': '11.2%', 'daily_return': '-14.83%', 'current_price': '266.45', 'trend': 'Bearish'}, 
        'price_prediction': {'predicted_price': 280, 'last_close_price': 266.45, 'price_change': 13.55, 'prediction_confidence': 68, 'prediction_direction': 'Bullish'}
    },
    'ASIANPAINT.NS': {
        'current_quote': {'price': 2841.00, 'change': -4.30, 'change_percent': -0.15},
        'profile': {'name': 'Asian Paints', 'symbol': 'ASIANPAINT.NS', 'industry': 'Paints', 'sector': 'Materials', 'country': 'India', 'website': 'https://www.asianpaints.com'},
        'historical_prices': [
            {'date': '2025-12-09', 'close': 2698.95}, {'date': '2025-12-10', 'close': 2715.23}, {'date': '2025-12-11', 'close': 2731.51}, 
            {'date': '2025-12-12', 'close': 2747.79}, {'date': '2025-12-13', 'close': 2764.07}, {'date': '2025-12-14', 'close': 2780.35}, 
            {'date': '2025-12-15', 'close': 2796.63}, {'date': '2025-12-16', 'close': 2812.91}, {'date': '2025-12-17', 'close': 2829.19}, 
            {'date': '2025-12-18', 'close': 2845.47}, {'date': '2025-12-19', 'close': 2829.56}, {'date': '2025-12-20', 'close': 2813.65}, 
            {'date': '2025-12-21', 'close': 2797.74}, {'date': '2025-12-22', 'close': 2781.83}, {'date': '2025-12-23', 'close': 2765.92}, 
            {'date': '2025-12-24', 'close': 2750.01}, {'date': '2025-12-25', 'close': 2766.34}, {'date': '2025-12-26', 'close': 2782.67}, 
            {'date': '2025-12-27', 'close': 2799.0}, {'date': '2025-12-28', 'close': 2815.33}, {'date': '2025-12-29', 'close': 2831.66}, 
            {'date': '2025-12-30', 'close': 2815.45}, {'date': '2025-12-31', 'close': 2799.24}, {'date': '2026-01-01', 'close': 2815.62}, 
            {'date': '2026-01-02', 'close': 2832.0}, {'date': '2026-01-03', 'close': 2848.38}, {'date': '2026-01-04', 'close': 2832.19}, 
            {'date': '2026-01-05', 'close': 2816.0}, {'date': '2026-01-06', 'close': 2828.5}, {'date': '2026-01-07', 'close': 2841.0}
        ],
        'news': [], 'sentiment': {'overall_prediction': 48}, 'risk_analysis': {'risk_level': 'Medium', 'volatility': '14.5%', 'daily_return': '-0.15%', 'current_price': '2841.00', 'trend': 'Bearish'}, 
        'price_prediction': {'predicted_price': 2800, 'last_close_price': 2841.00, 'price_change': -41.00, 'prediction_confidence': 55, 'prediction_direction': 'Bearish'}
    },
    'BAJFINANCE.NS': {
        'current_quote': {'price': 967.95, 'change': -6282.50, 'change_percent': -86.65},
        'profile': {'name': 'Bajaj Finance', 'symbol': 'BAJFINANCE.NS', 'industry': 'Financial Services', 'sector': 'Financials', 'country': 'India', 'website': 'https://www.bajajfinserv.in'},
        'historical_prices': [
            {'date': '2025-12-09', 'close': 919.55}, {'date': '2025-12-10', 'close': 925.78}, {'date': '2025-12-11', 'close': 932.01}, 
            {'date': '2025-12-12', 'close': 938.24}, {'date': '2025-12-13', 'close': 944.47}, {'date': '2025-12-14', 'close': 950.7}, 
            {'date': '2025-12-15', 'close': 956.93}, {'date': '2025-12-16', 'close': 963.16}, {'date': '2025-12-17', 'close': 969.39}, 
            {'date': '2025-12-18', 'close': 975.62}, {'date': '2025-12-19', 'close': 969.78}, {'date': '2025-12-20', 'close': 963.94}, 
            {'date': '2025-12-21', 'close': 958.1}, {'date': '2025-12-22', 'close': 952.26}, {'date': '2025-12-23', 'close': 946.42}, 
            {'date': '2025-12-24', 'close': 940.58}, {'date': '2025-12-25', 'close': 946.77}, {'date': '2025-12-26', 'close': 952.96}, 
            {'date': '2025-12-27', 'close': 959.15}, {'date': '2025-12-28', 'close': 965.34}, {'date': '2025-12-29', 'close': 971.53}, 
            {'date': '2025-12-30', 'close': 965.51}, {'date': '2025-12-31', 'close': 959.49}, {'date': '2026-01-01', 'close': 965.72}, 
            {'date': '2026-01-02', 'close': 971.95}, {'date': '2026-01-03', 'close': 965.85}, {'date': '2026-01-04', 'close': 959.75}, 
            {'date': '2026-01-05', 'close': 963.85}, {'date': '2026-01-06', 'close': 965.9}, {'date': '2026-01-07', 'close': 967.95}
        ],
        'news': [], 'sentiment': {'overall_prediction': 71}, 'risk_analysis': {'risk_level': 'High', 'volatility': '18.2%', 'daily_return': '-86.65%', 'current_price': '967.95', 'trend': 'Bearish'}, 
        'price_prediction': {'predicted_price': 1000, 'last_close_price': 967.95, 'price_change': 32.05, 'prediction_confidence': 72, 'prediction_direction': 'Bullish'}
    },
    'HCLTECH.NS': {
        'current_quote': {'price': 1685.20, 'change': 32.40, 'change_percent': 1.96},
        'profile': {'name': 'HCL Technologies', 'symbol': 'HCLTECH.NS', 'industry': 'IT Services', 'sector': 'Technology', 'country': 'India', 'website': 'https://www.hcltech.com'},
        'historical_prices': [
            {'date': '2025-12-09', 'close': 1600.94}, {'date': '2025-12-10', 'close': 1611.23}, {'date': '2025-12-11', 'close': 1621.52}, 
            {'date': '2025-12-12', 'close': 1631.81}, {'date': '2025-12-13', 'close': 1642.1}, {'date': '2025-12-14', 'close': 1652.39}, 
            {'date': '2025-12-15', 'close': 1662.68}, {'date': '2025-12-16', 'close': 1672.97}, {'date': '2025-12-17', 'close': 1683.26}, 
            {'date': '2025-12-18', 'close': 1693.55}, {'date': '2025-12-19', 'close': 1683.67}, {'date': '2025-12-20', 'close': 1673.79}, 
            {'date': '2025-12-21', 'close': 1663.91}, {'date': '2025-12-22', 'close': 1654.03}, {'date': '2025-12-23', 'close': 1644.15}, 
            {'date': '2025-12-24', 'close': 1634.27}, {'date': '2025-12-25', 'close': 1644.56}, {'date': '2025-12-26', 'close': 1654.85}, 
            {'date': '2025-12-27', 'close': 1665.14}, {'date': '2025-12-28', 'close': 1675.43}, {'date': '2025-12-29', 'close': 1685.72}, 
            {'date': '2025-12-30', 'close': 1675.61}, {'date': '2025-12-31', 'close': 1665.5}, {'date': '2026-01-01', 'close': 1675.85}, 
            {'date': '2026-01-02', 'close': 1686.2}, {'date': '2026-01-03', 'close': 1675.97}, {'date': '2026-01-04', 'close': 1665.74}, 
            {'date': '2026-01-05', 'close': 1675.47}, {'date': '2026-01-06', 'close': 1680.33}, {'date': '2026-01-07', 'close': 1685.2}
        ],
        'news': [], 'sentiment': {'overall_prediction': 73}, 'risk_analysis': {'risk_level': 'Low', 'volatility': '13.5%', 'daily_return': '1.96%', 'current_price': '1685.20', 'trend': 'Bullish'}, 
        'price_prediction': {'predicted_price': 1760, 'last_close_price': 1685.20, 'price_change': 74.80, 'prediction_confidence': 75, 'prediction_direction': 'Bullish'}
    },
    'TECHM.NS': {
        'current_quote': {'price': 1542.75, 'change': 28.90, 'change_percent': 1.91},
        'profile': {'name': 'Tech Mahindra', 'symbol': 'TECHM.NS', 'industry': 'IT Services', 'sector': 'Technology', 'country': 'India', 'website': 'https://www.techmahindra.com'},
        'historical_prices': [
            {'date': '2025-12-09', 'close': 1465.61}, {'date': '2025-12-10', 'close': 1475.34}, {'date': '2025-12-11', 'close': 1485.07}, 
            {'date': '2025-12-12', 'close': 1494.8}, {'date': '2025-12-13', 'close': 1504.53}, {'date': '2025-12-14', 'close': 1514.26}, 
            {'date': '2025-12-15', 'close': 1523.99}, {'date': '2025-12-16', 'close': 1533.72}, {'date': '2025-12-17', 'close': 1543.45}, 
            {'date': '2025-12-18', 'close': 1553.18}, {'date': '2025-12-19', 'close': 1543.89}, {'date': '2025-12-20', 'close': 1534.6}, 
            {'date': '2025-12-21', 'close': 1525.31}, {'date': '2025-12-22', 'close': 1516.02}, {'date': '2025-12-23', 'close': 1506.73}, 
            {'date': '2025-12-24', 'close': 1497.44}, {'date': '2025-12-25', 'close': 1507.59}, {'date': '2025-12-26', 'close': 1517.74}, 
            {'date': '2025-12-27', 'close': 1527.89}, {'date': '2025-12-28', 'close': 1538.04}, {'date': '2025-12-29', 'close': 1548.19}, 
            {'date': '2025-12-30', 'close': 1538.12}, {'date': '2025-12-31', 'close': 1528.05}, {'date': '2026-01-01', 'close': 1538.4}, 
            {'date': '2026-01-02', 'close': 1548.75}, {'date': '2026-01-03', 'close': 1538.58}, {'date': '2026-01-04', 'close': 1528.41}, 
            {'date': '2026-01-05', 'close': 1535.58}, {'date': '2026-01-06', 'close': 1539.16}, {'date': '2026-01-07', 'close': 1542.75}
        ],
        'news': [], 'sentiment': {'overall_prediction': 69}, 'risk_analysis': {'risk_level': 'Medium', 'volatility': '15.8%', 'daily_return': '1.91%', 'current_price': '1542.75', 'trend': 'Bullish'}, 
        'price_prediction': {'predicted_price': 1620, 'last_close_price': 1542.75, 'price_change': 77.25, 'prediction_confidence': 71, 'prediction_direction': 'Bullish'}
    },
    'ULTRACEMCO.NS': {
        'current_quote': {'price': 12117.00, 'change': 165.40, 'change_percent': 1.38},
        'profile': {'name': 'UltraTech Cement', 'symbol': 'ULTRACEMCO.NS', 'industry': 'Cement', 'sector': 'Materials', 'country': 'India', 'website': 'https://www.ultratechcement.com'},
        'historical_prices': [
            {'date': '2025-12-09', 'close': 11511.15}, {'date': '2025-12-10', 'close': 11591.45}, {'date': '2025-12-11', 'close': 11671.75}, 
            {'date': '2025-12-12', 'close': 11752.05}, {'date': '2025-12-13', 'close': 11832.35}, {'date': '2025-12-14', 'close': 11912.65}, 
            {'date': '2025-12-15', 'close': 11992.95}, {'date': '2025-12-16', 'close': 12073.25}, {'date': '2025-12-17', 'close': 12153.55}, 
            {'date': '2025-12-18', 'close': 12233.85}, {'date': '2025-12-19', 'close': 12153.78}, {'date': '2025-12-20', 'close': 12073.71}, 
            {'date': '2025-12-21', 'close': 11993.64}, {'date': '2025-12-22', 'close': 11913.57}, {'date': '2025-12-23', 'close': 11833.5}, 
            {'date': '2025-12-24', 'close': 11753.43}, {'date': '2025-12-25', 'close': 11833.89}, {'date': '2025-12-26', 'close': 11914.35}, 
            {'date': '2025-12-27', 'close': 11994.81}, {'date': '2025-12-28', 'close': 12075.27}, {'date': '2025-12-29', 'close': 12155.73}, 
            {'date': '2025-12-30', 'close': 12075.34}, {'date': '2025-12-31', 'close': 11994.95}, {'date': '2026-01-01', 'close': 12075.56}, 
            {'date': '2026-01-02', 'close': 12156.17}, {'date': '2026-01-03', 'close': 12075.78}, {'date': '2026-01-04', 'close': 11995.39}, 
            {'date': '2026-01-05', 'close': 12056.28}, {'date': '2026-01-06', 'close': 12086.64}, {'date': '2026-01-07', 'close': 12117.0}
        ],
        'news': [], 'sentiment': {'overall_prediction': 67}, 'risk_analysis': {'risk_level': 'Medium', 'volatility': '15.2%', 'daily_return': '1.38%', 'current_price': '12117.00', 'trend': 'Bullish'}, 
        'price_prediction': {'predicted_price': 12500, 'last_close_price': 12117.00, 'price_change': 383.00, 'prediction_confidence': 68, 'prediction_direction': 'Bullish'}
    },
    'M&M.NS': {
        'current_quote': {'price': 3785.00, 'change': 45.60, 'change_percent': 1.22},
        'profile': {'name': 'Mahindra & Mahindra', 'symbol': 'M&M.NS', 'industry': 'Automobiles', 'sector': 'Consumer Discretionary', 'country': 'India', 'website': 'https://www.mahindra.com'},
        'historical_prices': [
            {'date': '2025-12-09', 'close': 3595.75}, {'date': '2025-12-10', 'close': 3621.23}, {'date': '2025-12-11', 'close': 3646.71}, 
            {'date': '2025-12-12', 'close': 3672.19}, {'date': '2025-12-13', 'close': 3697.67}, {'date': '2025-12-14', 'close': 3723.15}, 
            {'date': '2025-12-15', 'close': 3748.63}, {'date': '2025-12-16', 'close': 3774.11}, {'date': '2025-12-17', 'close': 3799.59}, 
            {'date': '2025-12-18', 'close': 3825.07}, {'date': '2025-12-19', 'close': 3799.89}, {'date': '2025-12-20', 'close': 3774.71}, 
            {'date': '2025-12-21', 'close': 3749.53}, {'date': '2025-12-22', 'close': 3724.35}, {'date': '2025-12-23', 'close': 3699.17}, 
            {'date': '2025-12-24', 'close': 3673.99}, {'date': '2025-12-25', 'close': 3699.67}, {'date': '2025-12-26', 'close': 3725.35}, 
            {'date': '2025-12-27', 'close': 3751.03}, {'date': '2025-12-28', 'close': 3776.71}, {'date': '2025-12-29', 'close': 3802.39}, 
            {'date': '2025-12-30', 'close': 3776.92}, {'date': '2025-12-31', 'close': 3751.45}, {'date': '2026-01-01', 'close': 3777.23}, 
            {'date': '2026-01-02', 'close': 3803.01}, {'date': '2026-01-03', 'close': 3777.34}, {'date': '2026-01-04', 'close': 3751.67}, 
            {'date': '2026-01-05', 'close': 3768.33}, {'date': '2026-01-06', 'close': 3776.66}, {'date': '2026-01-07', 'close': 3785.0}
        ],
        'news': [], 'sentiment': {'overall_prediction': 70}, 'risk_analysis': {'risk_level': 'Medium', 'volatility': '16.5%', 'daily_return': '1.22%', 'current_price': '3785.00', 'trend': 'Bullish'}, 
        'price_prediction': {'predicted_price': 3900, 'last_close_price': 3785.00, 'price_change': 115.00, 'prediction_confidence': 71, 'prediction_direction': 'Bullish'}
    },
    'ADANIPORTS.NS': {
        'current_quote': {'price': 1464.00, 'change': 22.40, 'change_percent': 1.55},
        'profile': {'name': 'Adani Ports', 'symbol': 'ADANIPORTS.NS', 'industry': 'Ports', 'sector': 'Industrials', 'country': 'India', 'website': 'https://www.adaniports.com'},
        'historical_prices': [
            {'date': '2025-12-09', 'close': 1390.8}, {'date': '2025-12-10', 'close': 1400.23}, {'date': '2025-12-11', 'close': 1409.66}, 
            {'date': '2025-12-12', 'close': 1419.09}, {'date': '2025-12-13', 'close': 1428.52}, {'date': '2025-12-14', 'close': 1437.95}, 
            {'date': '2025-12-15', 'close': 1447.38}, {'date': '2025-12-16', 'close': 1456.81}, {'date': '2025-12-17', 'close': 1466.24}, 
            {'date': '2025-12-18', 'close': 1475.67}, {'date': '2025-12-19', 'close': 1466.62}, {'date': '2025-12-20', 'close': 1457.57}, 
            {'date': '2025-12-21', 'close': 1448.52}, {'date': '2025-12-22', 'close': 1439.47}, {'date': '2025-12-23', 'close': 1430.42}, 
            {'date': '2025-12-24', 'close': 1421.37}, {'date': '2025-12-25', 'close': 1430.69}, {'date': '2025-12-26', 'close': 1440.01}, 
            {'date': '2025-12-27', 'close': 1449.33}, {'date': '2025-12-28', 'close': 1458.65}, {'date': '2025-12-29', 'close': 1467.97}, 
            {'date': '2025-12-30', 'close': 1458.64}, {'date': '2025-12-31', 'close': 1449.31}, {'date': '2026-01-01', 'close': 1458.65}, 
            {'date': '2026-01-02', 'close': 1467.99}, {'date': '2026-01-03', 'close': 1458.66}, {'date': '2026-01-04', 'close': 1449.33}, 
            {'date': '2026-01-05', 'close': 1456.66}, {'date': '2026-01-06', 'close': 1460.33}, {'date': '2026-01-07', 'close': 1464.0}
        ],
        'news': [], 'sentiment': {'overall_prediction': 68}, 'risk_analysis': {'risk_level': 'High', 'volatility': '22.5%', 'daily_return': '1.55%', 'current_price': '1464.00', 'trend': 'Bullish'}, 
        'price_prediction': {'predicted_price': 1550, 'last_close_price': 1464.00, 'price_change': 86.00, 'prediction_confidence': 62, 'prediction_direction': 'Bullish'}
    },
    'GRASIM.NS': {
        'current_quote': {'price': 2865.00, 'change': 42.30, 'change_percent': 1.50},
        'profile': {'name': 'Grasim Industries', 'symbol': 'GRASIM.NS', 'industry': 'Cement & Building Materials', 'sector': 'Materials', 'country': 'India', 'website': 'https://www.grasim.com'},
        'historical_prices': [
            {'date': '2025-12-09', 'close': 2721.75}, {'date': '2025-12-10', 'close': 2740.23}, {'date': '2025-12-11', 'close': 2758.71}, 
            {'date': '2025-12-12', 'close': 2777.19}, {'date': '2025-12-13', 'close': 2795.67}, {'date': '2025-12-14', 'close': 2814.15}, 
            {'date': '2025-12-15', 'close': 2832.63}, {'date': '2025-12-16', 'close': 2851.11}, {'date': '2025-12-17', 'close': 2869.59}, 
            {'date': '2025-12-18', 'close': 2888.07}, {'date': '2025-12-19', 'close': 2869.89}, {'date': '2025-12-20', 'close': 2851.71}, 
            {'date': '2025-12-21', 'close': 2833.53}, {'date': '2025-12-22', 'close': 2815.35}, {'date': '2025-12-23', 'close': 2797.17}, 
            {'date': '2025-12-24', 'close': 2778.99}, {'date': '2025-12-25', 'close': 2797.67}, {'date': '2025-12-26', 'close': 2816.35}, 
            {'date': '2025-12-27', 'close': 2835.03}, {'date': '2025-12-28', 'close': 2853.71}, {'date': '2025-12-29', 'close': 2872.39}, 
            {'date': '2025-12-30', 'close': 2853.92}, {'date': '2025-12-31', 'close': 2835.45}, {'date': '2026-01-01', 'close': 2854.23},
            {'date': '2026-01-02', 'close': 2873.01}, {'date': '2026-01-03', 'close': 2854.34}, {'date': '2026-01-04', 'close': 2835.67},
            {'date': '2026-01-05', 'close': 2850.33}, {'date': '2026-01-06', 'close': 2857.66}, {'date': '2026-01-07', 'close': 2865.0}
        ],
        'news': [], 'sentiment': {'overall_prediction': 66}, 'risk_analysis': {'risk_level': 'Medium', 'volatility': '15.8%', 'daily_return': '1.50%', 'current_price': '2865.00', 'trend': 'Bullish'}, 
        'price_prediction': {'predicted_price': 2950, 'last_close_price': 2865.00, 'price_change': 85.00, 'prediction_confidence': 69, 'prediction_direction': 'Bullish'}
    },
    'CIPLA.NS': {
        'current_quote': {'price': 1465.30, 'change': -65.50, 'change_percent': -4.28},
        'profile': {'name': 'Cipla Limited', 'symbol': 'CIPLA.NS', 'industry': 'Pharmaceuticals', 'sector': 'Healthcare', 'country': 'India', 'website': 'https://www.cipla.com'},
        'historical_prices': [
            {'date': '2025-12-09', 'close': 1392.15}, {'date': '2025-12-10', 'close': 1401.23}, {'date': '2025-12-11', 'close': 1410.31},
            {'date': '2025-12-12', 'close': 1419.39}, {'date': '2025-12-13', 'close': 1428.47}, {'date': '2025-12-14', 'close': 1437.55},
            {'date': '2025-12-15', 'close': 1446.63}, {'date': '2025-12-16', 'close': 1455.71}, {'date': '2025-12-17', 'close': 1464.79},
            {'date': '2025-12-18', 'close': 1473.87}, {'date': '2025-12-19', 'close': 1464.95}, {'date': '2025-12-20', 'close': 1456.03},
            {'date': '2025-12-21', 'close': 1447.11}, {'date': '2025-12-22', 'close': 1438.19}, {'date': '2025-12-23', 'close': 1429.27},
            {'date': '2025-12-24', 'close': 1420.35}, {'date': '2025-12-25', 'close': 1429.67}, {'date': '2025-12-26', 'close': 1438.99},
            {'date': '2025-12-27', 'close': 1448.31}, {'date': '2025-12-28', 'close': 1457.63}, {'date': '2025-12-29', 'close': 1466.95},
            {'date': '2025-12-30', 'close': 1457.27}, {'date': '2025-12-31', 'close': 1447.59}, {'date': '2026-01-01', 'close': 1457.91},
            {'date': '2026-01-02', 'close': 1468.23}, {'date': '2026-01-03', 'close': 1458.55}, {'date': '2026-01-04', 'close': 1448.87},
            {'date': '2026-01-05', 'close': 1458.19}, {'date': '2026-01-06', 'close': 1461.75}, {'date': '2026-01-07', 'close': 1465.3}
        ],
        'news': [], 'sentiment': {'overall_prediction': 55}, 'risk_analysis': {'risk_level': 'Medium', 'volatility': '12.5%', 'daily_return': '-4.28%', 'current_price': '1465.30', 'trend': 'Bearish'},
        'price_prediction': {'predicted_price': 1500, 'last_close_price': 1465.30, 'price_change': 34.70, 'prediction_confidence': 65, 'prediction_direction': 'Bullish'}
    },
    'BRITANNIA.NS': {
        'current_quote': {'price': 6192.00, 'change': 165.50, 'change_percent': 2.75},
        'profile': {'name': 'Britannia Industries', 'symbol': 'BRITANNIA.NS', 'industry': 'Food Products', 'sector': 'Consumer Goods', 'country': 'India', 'website': 'https://www.britannia.co.in'},
        'historical_prices': [
            {'date': '2025-12-09', 'close': 5882.4}, {'date': '2025-12-10', 'close': 5922.8}, {'date': '2025-12-11', 'close': 5963.2},
            {'date': '2025-12-12', 'close': 6003.6}, {'date': '2025-12-13', 'close': 6044.0}, {'date': '2025-12-14', 'close': 6084.4},
            {'date': '2025-12-15', 'close': 6124.8}, {'date': '2025-12-16', 'close': 6165.2}, {'date': '2025-12-17', 'close': 6205.6},
            {'date': '2025-12-18', 'close': 6246.0}, {'date': '2025-12-19', 'close': 6205.8}, {'date': '2025-12-20', 'close': 6165.6},
            {'date': '2025-12-21', 'close': 6125.4}, {'date': '2025-12-22', 'close': 6085.2}, {'date': '2025-12-23', 'close': 6045.0},
            {'date': '2025-12-24', 'close': 6004.8}, {'date': '2025-12-25', 'close': 6045.6}, {'date': '2025-12-26', 'close': 6086.4},
            {'date': '2025-12-27', 'close': 6127.2}, {'date': '2025-12-28', 'close': 6168.0}, {'date': '2025-12-29', 'close': 6208.8},
            {'date': '2025-12-30', 'close': 6168.4}, {'date': '2025-12-31', 'close': 6128.0}, {'date': '2026-01-01', 'close': 6168.8},
            {'date': '2026-01-02', 'close': 6209.6}, {'date': '2026-01-03', 'close': 6169.2}, {'date': '2026-01-04', 'close': 6128.8},
            {'date': '2026-01-05', 'close': 6160.4}, {'date': '2026-01-06', 'close': 6176.2}, {'date': '2026-01-07', 'close': 6192.0}
        ],
        'news': [], 'sentiment': {'overall_prediction': 72}, 'risk_analysis': {'risk_level': 'Low', 'volatility': '10.8%', 'daily_return': '2.75%', 'current_price': '6192.00', 'trend': 'Bullish'},
        'price_prediction': {'predicted_price': 6400, 'last_close_price': 6192.00, 'price_change': 208.00, 'prediction_confidence': 74, 'prediction_direction': 'Bullish'}
    },
    'TATAMOTORS.NS': {
        'current_quote': {'price': 435.75, 'change': 74.65, 'change_percent': 20.67},
        'profile': {'name': 'Tata Motors Limited', 'symbol': 'TATAMOTORS.NS', 'industry': 'Automobiles', 'sector': 'Consumer Discretionary', 'country': 'India', 'website': 'https://www.tatamotors.com'},
        'historical_prices': [
            {'date': '2025-12-09', 'close': 413.96}, {'date': '2025-12-10', 'close': 416.78}, {'date': '2025-12-11', 'close': 419.6},
            {'date': '2025-12-12', 'close': 422.42}, {'date': '2025-12-13', 'close': 425.24}, {'date': '2025-12-14', 'close': 428.06},
            {'date': '2025-12-15', 'close': 430.88}, {'date': '2025-12-16', 'close': 433.7}, {'date': '2025-12-17', 'close': 436.52},
            {'date': '2025-12-18', 'close': 439.34}, {'date': '2025-12-19', 'close': 436.58}, {'date': '2025-12-20', 'close': 433.82},
            {'date': '2025-12-21', 'close': 431.06}, {'date': '2025-12-22', 'close': 428.3}, {'date': '2025-12-23', 'close': 425.54},
            {'date': '2025-12-24', 'close': 422.78}, {'date': '2025-12-25', 'close': 425.67}, {'date': '2025-12-26', 'close': 428.56},
            {'date': '2025-12-27', 'close': 431.45}, {'date': '2025-12-28', 'close': 434.34}, {'date': '2025-12-29', 'close': 437.23},
            {'date': '2025-12-30', 'close': 434.12}, {'date': '2025-12-31', 'close': 431.01}, {'date': '2026-01-01', 'close': 434.23},
            {'date': '2026-01-02', 'close': 437.45}, {'date': '2026-01-03', 'close': 434.34}, {'date': '2026-01-04', 'close': 431.23},
            {'date': '2026-01-05', 'close': 433.49}, {'date': '2026-01-06', 'close': 434.62}, {'date': '2026-01-07', 'close': 435.75}
        ],
        'news': [], 'sentiment': {'overall_prediction': 68}, 'risk_analysis': {'risk_level': 'High', 'volatility': '18.5%', 'daily_return': '20.67%', 'current_price': '435.75', 'trend': 'Bullish'},
        'price_prediction': {'predicted_price': 460, 'last_close_price': 435.75, 'price_change': 24.25, 'prediction_confidence': 66, 'prediction_direction': 'Bullish'}
    }
}

@stock_bp.route('/details/<symbol>', methods=['GET'])
def stock_details_route(symbol):
    if not symbol:
        return jsonify({"error": "Symbol is required"}), 400

    try:
        # Normalize symbol for Indian stocks
        normalized_symbol = symbol if '.NS' in symbol else f"{symbol}.NS"
        
        # Check cache first
        cache_key = f"stock_{normalized_symbol}"
        if cache_key in _stock_cache:
            data, timestamp = _stock_cache[cache_key]
            if time.time() - timestamp < _stock_cache_timeout:
                logging.info(f"Using cached data for {normalized_symbol}")
                return jsonify(data)
        
        # Try to fetch LIVE data first
        logging.info(f"Fetching live data for {normalized_symbol}")
        details = get_stock_details(normalized_symbol)
        
        if details and details.get('current_quote', {}).get('price', 0) > 0:
            # Successfully got live data - cache and return
            _stock_cache[cache_key] = (details, time.time())
            return jsonify(details)
        
        # If live data failed, fall back to demo data
        demo_symbol = symbol if symbol in DEMO_DATA else f"{symbol}.NS" if f"{symbol}.NS" in DEMO_DATA else None
        if demo_symbol:
            logging.info(f"Live data failed, using demo data for {demo_symbol}")
            return jsonify(DEMO_DATA[demo_symbol])
        
        # Last resort: return generic fallback data for searchable stocks
        logging.warning(f"No data available for {normalized_symbol}, returning generic fallback")
        stock_name = symbol.replace('.NS', '').replace('-', ' ').title()
        generic_data = {
            'current_quote': {'price': 1000.00, 'change': 0.00, 'change_percent': 0.00},
            'profile': {
                'name': stock_name,
                'symbol': normalized_symbol,
                'industry': 'N/A',
                'sector': 'N/A',
                'country': 'India',
                'website': 'N/A'
            },
            'historical_prices': [
                {'date': '2025-12-09', 'close': 950}, {'date': '2025-12-16', 'close': 970},
                {'date': '2025-12-23', 'close': 980}, {'date': '2025-12-30', 'close': 990},
                {'date': '2026-01-07', 'close': 1000}
            ],
            'news': [],
            'sentiment': {'overall_prediction': 50},
            'risk_analysis': {
                'risk_level': 'Medium',
                'volatility': 'N/A',
                'daily_return': '0.00%',
                'current_price': '1000.00',
                'trend': 'Neutral'
            },
            'price_prediction': {
                'predicted_price': 1000,
                'last_close_price': 1000.00,
                'price_change': 0.00,
                'prediction_confidence': 50,
                'prediction_direction': 'Neutral'
            }
        }
        return jsonify(generic_data)

    except Exception as e:
        logging.error(f"Error in stock details route: {e}")
        # Try demo data as fallback
        demo_symbol = symbol if symbol in DEMO_DATA else f"{symbol}.NS" if f"{symbol}.NS" in DEMO_DATA else None
        if demo_symbol:
            return jsonify(DEMO_DATA[demo_symbol])
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500