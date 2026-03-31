# TradeLens

# AI-Based Stock Trading for Indian Markets

## Project Overview
TradeLens is an AI-powered stock market analytics platform designed to enhance trading strategies for Indian stocks listed on NSE and BSE. It combines sentiment analysis, price prediction, technical indicators, and a RAG-based chatbot to enable informed intraday and swing trading decisions.

## Features

### Sentiment Analysis
- **News Sentiment Analysis**: Analyzes real-time news to derive sentiment scores for stocks listed in NSE and BSE.
- **Global and Indian Market Trends**: Performs sentiment analysis on global and domestic market trends to assess market behavior.

### Price Prediction
- **LSTM Forecasting**: Utilizes LSTM models for accurate price predictions, aiding traders in making data-driven decisions.

### Trend and Risk Assessment
- **RFA (Random Forest Algorithm)**: Evaluates market trends and assesses risk levels, enabling strategic decision-making.

### Buy/Sell Recommendations
- **Technical Indicators**: Generates buy/sell signals for both intraday and swing trading strategies using advanced technical indicators (RSI, MACD, Bollinger Bands, EMA, etc.).

### Recommendation Justification
- **RAG-Based Chatbot**: Implements a Retrieval-Augmented Generation chatbot to provide recommendation justifications and trading summaries, ensuring transparency and confidence in decisions.

## Installation
1. **Clone the Repository**:
   ```bash
   git clone <your-repository-url>
   cd TradeLens
   ```
2. **Install Backend Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
3. **Install Frontend Dependencies**:
   ```bash
   cd frontend
   npm install
   ```
4. **Set Up API Keys**:
   - Obtain API keys for necessary services (e.g., news sentiment analysis, stock data).
   - Add them to the `.env` file in the project directory.

## Usage
1. **Run the Backend**:
   ```bash
   cd backend
   python app.py
   ```
2. **Run the Frontend**:
   ```bash
   cd frontend
   npm start
   ```
3. **Run the Chatbot**:
   ```bash
   cd "rag chatbot"
   streamlit run app.py
   ```
4. **Interact with the Chatbot**:
   Use the chatbot interface for real-time recommendations and justifications.
5. **View Buy/Sell Recommendations**:
   Access generated tickers and sentiment scores from the dashboard.

## Technologies Used
- **Machine Learning**: Random Forest, LSTM
- **Natural Language Processing**: Sentiment Analysis
- **Technical Indicators**: RSI, MACD, Bollinger Bands, EMA, etc.
- **Chatbot Framework**: Retrieval-Augmented Generation (RAG)
- **Frontend**: React.js
- **Backend**: Flask (Python)

## Future Enhancements
- **Integration with Trading Platforms**: Automate trades based on AI-generated recommendations.
- **Multi-Market Support**: Expand coverage to global markets.
- **Enhanced Sentiment Sources**: Incorporate social media analysis.

---

**Happy Trading!** 
