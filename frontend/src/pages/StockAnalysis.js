import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { ArrowUp, ArrowDown, ArrowLeft, TrendingUp, TrendingDown, Globe, Building2, Activity, Target } from 'lucide-react';
import { useTheme } from '../ThemeContext';

const StockAnalysis = () => {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [stockDetails, setStockDetails] = useState({
    current_quote: { price: 0, change: 0, change_percent: 0 },
    profile: { name: '', symbol: '', industry: '', sector: '', country: '', website: '' },
    historical_prices: [],
    sentiment: null,
    risk_analysis: null,
    price_prediction: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStockData = async () => {
      if (!symbol) {
        setError("No stock symbol provided");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        const response = await fetch(`${API_URL}/stocks/details/${symbol}`);
        if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        setStockDetails(prev => ({ ...prev, ...data }));
        setError("");
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStockData();
  }, [symbol]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <Activity className="animate-spin" size={32} style={{ color: 'var(--accent-primary)' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="max-w-lg mx-auto p-6 rounded-2xl text-center" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--accent-danger)' }}>
          <p style={{ color: 'var(--accent-danger)' }}>{error}</p>
          <button onClick={() => navigate('/')} className="mt-4 px-4 py-2 rounded-lg" style={{ backgroundColor: 'var(--accent-primary)', color: 'white' }}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const isPositive = stockDetails.current_quote.change >= 0;
  const sentiment = stockDetails.sentiment?.overall_prediction || 50;
  const prediction = stockDetails.price_prediction;
  const risk = stockDetails.risk_analysis;

  const getSentimentLabel = (s) => s <= 40 ? 'Bearish' : s >= 60 ? 'Bullish' : 'Neutral';
  const getSentimentColor = (s) => s <= 40 ? 'var(--accent-danger)' : s >= 60 ? 'var(--accent-success)' : 'var(--accent-warning)';

  return (
    <div className="min-h-screen transition-colors" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-5xl mx-auto p-6">

        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/')}
          className="flex items-center gap-2 mb-6 px-3 py-2 rounded-lg transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          <ArrowLeft size={18} />
          <span>Back</span>
        </motion.button>

        {/* Header Card */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-6 mb-6"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                {stockDetails.profile.name || symbol}
              </h1>
              <p style={{ color: 'var(--text-muted)' }}>{symbol}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                ₹{stockDetails.current_quote.price.toFixed(2)}
              </div>
              <div className={`flex items-center justify-end gap-1 ${isPositive ? 'text-green-500' : 'text-red-400'}`}>
                {isPositive ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                <span>{Math.abs(stockDetails.current_quote.change_percent).toFixed(2)}%</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid - 3 columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Sentiment */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl p-5"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
          >
            <div className="flex items-center gap-2 mb-3">
              {sentiment >= 60 ? <TrendingUp size={18} /> : sentiment <= 40 ? <TrendingDown size={18} /> : <Activity size={18} />}
              <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Sentiment</span>
            </div>
            <div className="text-2xl font-semibold mb-2" style={{ color: getSentimentColor(sentiment) }}>
              {getSentimentLabel(sentiment)}
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${sentiment}%` }}
                transition={{ duration: 0.8 }}
                className="h-full rounded-full"
                style={{ backgroundColor: getSentimentColor(sentiment) }}
              />
            </div>
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Score: {sentiment.toFixed(0)}/100</p>
          </motion.div>

          {/* Prediction */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl p-5"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Target size={18} />
              <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Price Target</span>
            </div>
            {prediction ? (
              <>
                <div className="text-2xl font-semibold" style={{ color: prediction.prediction_direction === 'Bullish' ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                  ₹{prediction.predicted_price?.toFixed(2)}
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  {prediction.prediction_direction} • {prediction.prediction_confidence}% confidence
                </p>
              </>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>N/A</p>
            )}
          </motion.div>

          {/* Risk */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl p-5"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Activity size={18} />
              <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Risk Level</span>
            </div>
            <div className="text-2xl font-semibold" style={{ color: 'var(--accent-primary)' }}>
              {risk?.risk_level || 'N/A'}
            </div>
            {risk?.volatility && (
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Volatility: {risk.volatility}
              </p>
            )}
          </motion.div>
        </div>

        {/* Price Chart - Full Width */}
        {stockDetails.historical_prices.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl p-6 mb-6"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
          >
            <h3 className="font-medium mb-4" style={{ color: 'var(--text-primary)' }}>Price History</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stockDetails.historical_prices}>
                  <defs>
                    <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={isPositive ? '#8ECDA8' : '#E8A0A0'} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={isPositive ? '#8ECDA8' : '#E8A0A0'} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} tickFormatter={(v) => new Date(v).toLocaleDateString('en', { month: 'short', day: 'numeric' })} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                    labelFormatter={(v) => new Date(v).toLocaleDateString()}
                  />
                  <Area type="monotone" dataKey="close" stroke={isPositive ? '#8ECDA8' : '#E8A0A0'} fill="url(#priceGradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* Company Info - Compact */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl p-5"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
        >
          <h3 className="font-medium mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Building2 size={18} />
            Company Info
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p style={{ color: 'var(--text-muted)' }}>Industry</p>
              <p style={{ color: 'var(--text-primary)' }}>{stockDetails.profile.industry || 'N/A'}</p>
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)' }}>Sector</p>
              <p style={{ color: 'var(--text-primary)' }}>{stockDetails.profile.sector || 'N/A'}</p>
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)' }}>Country</p>
              <p style={{ color: 'var(--text-primary)' }}>{stockDetails.profile.country || 'N/A'}</p>
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)' }}>Website</p>
              {stockDetails.profile.website ? (
                <a href={stockDetails.profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1" style={{ color: 'var(--accent-primary)' }}>
                  <Globe size={14} /> Visit
                </a>
              ) : <p style={{ color: 'var(--text-primary)' }}>N/A</p>}
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default StockAnalysis;