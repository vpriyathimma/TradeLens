import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, TrendingUp, ArrowUp, ArrowDown, Sparkles, BarChart3, Activity, Newspaper, Zap } from "lucide-react";
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../ThemeContext';
import { AreaChart, Area, ResponsiveContainer } from "recharts";

const Home = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);

  // Sample news for demo
  const sampleNews = [
    { headline: "RBI keeps repo rate unchanged, markets respond positively", sentiment: "positive", source: "CNBC TV18" },
    { headline: "IT sector shows strong quarterly earnings growth", sentiment: "positive", source: "ET Now" },
    { headline: "Global markets mixed amid Fed policy uncertainty", sentiment: "neutral", source: "Bloomberg" },
    { headline: "FIIs continue buying streak in Indian equities", sentiment: "positive", source: "Moneycontrol" },
  ];

  const [marketData] = useState({
    nifty50: {
      historical: [
        { Date: 'Nov 01', Close: 21800 }, { Date: 'Nov 08', Close: 22100 },
        { Date: 'Nov 15', Close: 21600 }, { Date: 'Nov 22', Close: 22400 },
        { Date: 'Nov 29', Close: 22800 }, { Date: 'Dec 06', Close: 22500 },
        { Date: 'Dec 13', Close: 23100 }, { Date: 'Dec 20', Close: 22900 },
        { Date: 'Dec 27', Close: 23400 }, { Date: 'Jan 03', Close: 23680 }
      ],
      current: { price: 23680, changePercent: 1.2 }
    },
    niftyBees: {
      price: 237.45,
      changePercent: 1.15,
      prediction: { direction: "Bullish", confidence: 72, target: 242.50 }
    },
    sentiment: { score: 68, label: "Bullish" },
    top5ToInvest: [
      { symbol: "BHARTIARTL", name: "Bharti Airtel", price: 2105.30, change: 1.09, confidence: 78, reason: "Strong 5G rollout momentum" },
      { symbol: "SUNPHARMA", name: "Sun Pharma", price: 1779.90, change: 15.38, confidence: 76, reason: "Robust export growth" },
      { symbol: "HCLTECH", name: "HCL Technologies", price: 1685.20, change: 1.96, confidence: 75, reason: "AI services demand surge" },
      { symbol: "INFY", name: "Infosys", price: 1627.80, change: 0.36, confidence: 74, reason: "Strong deal pipeline" },
      { symbol: "TITAN", name: "Titan Company", price: 4294.00, change: 4.43, confidence: 73, reason: "Wedding season boost" }
    ]
  });

  useEffect(() => {
    setTimeout(() => setShowContent(true), 600);
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) {
      toast.error("Please enter a stock name");
      return;
    }
    setLoading(true);
    setSearchPerformed(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/stocks/search?name=${encodeURIComponent(query)}`);
      const data = await response.json();
      setSearchResults(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error("Search failed");
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = (s) => s === 'positive' ? 'var(--accent-success)' : s === 'negative' ? 'var(--accent-danger)' : 'var(--accent-warning)';

  return (
    <div className="min-h-screen transition-colors" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <AnimatePresence>
        {!showContent ? (
          <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'var(--bg-primary)' }}>
            <Sparkles size={48} style={{ color: 'var(--accent-primary)' }} className="animate-pulse" />
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 md:p-6 max-w-6xl mx-auto">

            {/* Hero */}
            <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-8 pt-6">
              <h1 className="text-4xl md:text-5xl font-light mb-6" style={{ color: 'var(--text-primary)' }}>
                Trade<span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Lens</span>
              </h1>

              {/* Search */}
              <form onSubmit={handleSearch} className="max-w-md mx-auto mb-8">
                <div className="relative">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search Nifty 50 stocks..."
                    className="w-full py-3 px-5 pr-12 rounded-xl transition-all focus:outline-none"
                    style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                  />
                  <button type="submit" disabled={loading} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg" style={{ backgroundColor: 'var(--accent-primary)', color: 'white' }}>
                    {loading ? <Activity size={18} className="animate-spin" /> : <Search size={18} />}
                  </button>
                </div>
              </form>
            </motion.div>

            {/* Search Results */}
            {searchPerformed && searchResults.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                {searchResults.slice(0, 4).map((stock, i) => (
                  <motion.div key={stock.symbol} initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ delay: i * 0.05 }}
                    onClick={() => navigate(`/stocks/${stock.symbol}`)}
                    className="p-3 rounded-xl cursor-pointer transition-all hover:scale-102"
                    style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                    <div className="font-semibold text-sm" style={{ color: 'var(--accent-primary)' }}>{stock.symbol}</div>
                    <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{stock.name}</div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Main Grid - Prediction + Nifty 50 */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">

              {/* Nifty BeES Prediction Card */}
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                className="rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <Zap size={20} style={{ color: 'var(--accent-primary)' }} />
                  <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Nifty BeES Prediction</h3>
                </div>
                <div className="flex items-end justify-between mb-4">
                  <div>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Current Price</p>
                    <p className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>₹{marketData.niftyBees.price}</p>
                  </div>
                  <div className={`flex items-center gap-1 ${marketData.niftyBees.changePercent >= 0 ? 'text-green-500' : 'text-red-400'}`}>
                    {marketData.niftyBees.changePercent >= 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                    <span>{marketData.niftyBees.changePercent.toFixed(2)}%</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl mb-3" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Tomorrow's Prediction</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold" style={{ color: 'var(--accent-success)' }}>
                      {marketData.niftyBees.prediction.direction} → ₹{marketData.niftyBees.prediction.target}
                    </span>
                    <span className="text-sm px-2 py-1 rounded-lg" style={{ backgroundColor: 'var(--accent-success)', color: 'white', opacity: 0.9 }}>
                      {marketData.niftyBees.prediction.confidence}%
                    </span>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${marketData.niftyBees.prediction.confidence}%` }} transition={{ duration: 1 }}
                    className="h-full rounded-full" style={{ backgroundColor: 'var(--accent-success)' }} />
                </div>
              </motion.div>

              {/* Nifty 50 Chart */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
                className="rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 size={20} style={{ color: 'var(--accent-success)' }} />
                    <div>
                      <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Nifty 50</h3>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>₹{marketData.nifty50.current.price}</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 text-sm ${marketData.nifty50.current.changePercent >= 0 ? 'text-green-500' : 'text-red-400'}`}>
                    {marketData.nifty50.current.changePercent >= 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                    {marketData.nifty50.current.changePercent.toFixed(2)}%
                  </div>
                </div>
                <div className="h-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={marketData.nifty50.historical}>
                      <defs>
                        <linearGradient id="niftyGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#8ECDA8" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="#8ECDA8" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="Close" stroke="#8ECDA8" fill="url(#niftyGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>

            {/* Top 5 Stocks - Horizontal Cards */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="mb-6">
              <h3 className="font-semibold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>Top Performing Stocks</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {marketData.top5ToInvest.map((stock, i) => (
                  <motion.div key={stock.symbol} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.08 }}
                    onClick={() => navigate(`/stocks/${stock.symbol}.NS`)}
                    className="p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.03] text-center"
                    style={{
                      background: isDark
                        ? 'linear-gradient(135deg, #3a3a4a 0%, #2d2d3a 100%)'
                        : 'linear-gradient(135deg, #f0f0f5 0%, #e8e8f0 100%)',
                      border: '1px solid var(--border-color)',
                      boxShadow: '0 2px 8px var(--shadow-color)'
                    }}>
                    <div className="font-bold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{stock.symbol}</div>
                    <div className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>₹{stock.price.toLocaleString()}</div>
                    <div className={`flex items-center justify-center gap-1 text-sm ${stock.change >= 0 ? 'text-green-500' : 'text-red-400'}`}>
                      {stock.change >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                      <span>{stock.change}%</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* News Sentiment Section */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
              className="rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Newspaper size={20} style={{ color: 'var(--accent-primary)' }} />
                  <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>News Sentiment</h3>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full" style={{ backgroundColor: 'rgba(142, 205, 168, 0.15)' }}>
                  <TrendingUp size={14} style={{ color: 'var(--accent-success)' }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--accent-success)' }}>
                    {marketData.sentiment.label} ({marketData.sentiment.score}/100)
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                {sampleNews.map((news, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 + i * 0.1 }}
                    className="flex items-start gap-3 p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <div className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: getSentimentColor(news.sentiment) }} />
                    <div className="flex-1">
                      <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{news.headline}</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{news.source}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Home;