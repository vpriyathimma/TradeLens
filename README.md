# TradeLens

TradeLens is an AI-powered stock market analytics platform built to optimize trading strategies for Indian financial markets by combining machine learning, sentiment intelligence, technical analysis, and conversational AI.

Designed specifically for NSE and BSE traders, TradeLens helps users make informed intraday and swing trading decisions through real-time news sentiment analysis, price forecasting, risk assessment, buy/sell signal generation, and transparent AI-driven recommendation explanations.

By integrating predictive analytics with a Retrieval-Augmented Generation (RAG) chatbot, TradeLens transforms complex stock data into actionable trading intelligence for smarter decision-making.

---

## Features

### Market Sentiment Intelligence
- Real-time news sentiment analysis for NSE and BSE-listed stocks  
- Global and Indian market trend sentiment analysis  
- Market behavior interpretation using NLP  

### AI-Powered Price Prediction
- LSTM-based stock price forecasting  
- Predictive modeling for short-term and swing trading  

### Trend & Risk Assessment
- Random Forest Algorithm (RFA) for market trend prediction  
- Risk-level evaluation for strategic entry/exit decisions  

### Buy/Sell Signal Generation
- Technical indicators including:
  - RSI (Relative Strength Index)  
  - MACD (Moving Average Convergence Divergence)  
  - Bollinger Bands  
  - EMA (Exponential Moving Average)  
- Intraday and swing trade recommendations  

### Explainable AI
- RAG-based chatbot for:
  - Recommendation justification  
  - Trading summaries  
  - Strategic explanations  
  - Confidence-building decision transparency  

---

## Tech Stack

### Machine Learning
- LSTM  
- Random Forest Algorithm  

### Natural Language Processing
- News Sentiment Analysis  
- Market Trend Analysis  

### Technical Analysis
- RSI  
- MACD  
- Bollinger Bands  
- EMA  

### Chatbot Framework
- Retrieval-Augmented Generation (RAG)  

### Frontend
- React.js  

### Backend
- Flask (Python)  

### Visualization & Deployment
- Streamlit (Chatbot Interface)  

---

## How It Works

1. Collects stock data from NSE/BSE and external market sources  
2. Performs sentiment analysis on financial news and trends  
3. Uses LSTM for price prediction  
4. Applies Random Forest for trend/risk evaluation  
5. Generates technical indicator-based buy/sell recommendations  
6. RAG chatbot explains recommendations in natural language  
7. Dashboard displays actionable stock insights  

---

## Installation & Setup

### Clone the Repository
```bash
git clone https://github.com/vpriyathimma/TradeLens.git
cd TradeLens
```

### Development Requirements
- Python 3.9+  
- Node.js  
- npm  
- Streamlit  
- API Keys for stock/news services  

### Install Backend Dependencies
```bash
pip install -r requirements.txt
```

### Install Frontend Dependencies
```bash
cd frontend
npm install
```

### Configure Environment Variables
Create a `.env` file in the project root:

```env
API_KEY=your_api_key_here
NEWS_API_KEY=your_news_api_key_here
```

---

## Running the Application

### Run Backend
```bash
cd backend
python app.py
```

### Run Frontend
```bash
cd frontend
npm start
```

### Run RAG Chatbot
```bash
cd "rag chatbot"
streamlit run app.py
```

---

## Project Structure

```bash
TradeLens/
│── backend/
│   ┣ app.py
│   ┣ models/
│   ┣ sentiment/
│   ┗ indicators/
│── frontend/
│   ┣ src/
│   ┗ public/
│── rag chatbot/
│   ┗ app.py
│── requirements.txt
│── .env
└── README.md
```

---

## Current Scope

### Core Focus:
- Indian stock market analytics (NSE/BSE)  
- AI-based price prediction  
- Sentiment intelligence  
- Technical buy/sell signals  
- Explainable trading recommendations  

### Planned Enhancements:
- Automated brokerage integration  
- Portfolio optimization  
- Global market expansion  
- Social media sentiment analysis  
- Advanced dashboard analytics  

---

## Security & Privacy

- API key protection through `.env`  
- Modular architecture for secure deployment  
- No unauthorized trade execution  
- User-controlled decision support  
- Expandable for enterprise-grade fintech security  

---

## Future Improvements

- Broker API integration for automated trading  
- Real-time options and derivatives analytics  
- Multi-market expansion (US, Forex, Crypto)  
- AI portfolio rebalancing  
- Voice-enabled trading assistant  
- Social sentiment from Twitter/Reddit  

---

## Why This Project Matters

TradeLens demonstrates the practical intersection of AI, fintech, machine learning, and NLP in one comprehensive trading intelligence ecosystem.

This project highlights expertise in:
- Financial Data Science  
- Stock Market Analytics  
- LSTM Forecasting  
- Random Forest Modeling  
- NLP Sentiment Analysis  
- RAG Chatbot Systems  
- React + Flask Full-Stack Development  

---

## Key Innovation

Unlike traditional trading dashboards that provide isolated metrics, TradeLens combines:
- Sentiment intelligence  
- Predictive analytics  
- Technical analysis  
- Explainable AI  

This creates a more transparent and data-backed ecosystem for retail and strategic traders.

---

## Author

**Vishnupriya T**

- GitHub: https://github.com/vpriyathimma  
- Email: vpriyathimma@gmail.com  
- LinkedIn: https://www.linkedin.com/in/vishnupriya-t-7a0b8925b/  

---

## License

This project is intended for educational, portfolio, fintech innovation, and AI-powered trading research purposes. It should not be considered financial advice, and users should validate strategies independently before live trading.
