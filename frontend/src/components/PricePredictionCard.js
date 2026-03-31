import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, BarChart2, AlertTriangle } from 'lucide-react';

const PricePredictionCard = ({ prediction, isDark }) => {
  if (!prediction || prediction.error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl p-6"
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)'
        }}
      >
        <div className="flex items-center mb-4">
          <BarChart2 style={{ color: 'var(--accent-primary)' }} />
          <h3 className="ml-2 text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            Price Prediction
          </h3>
        </div>
        <div className="text-center p-4">
          <AlertTriangle className="mx-auto mb-2" size={24} style={{ color: 'var(--accent-warning)' }} />
          <p style={{ color: 'var(--text-muted)' }}>
            Unable to generate price prediction at this time.
          </p>
        </div>
      </motion.div>
    );
  }

  const isBullish = prediction.prediction_direction === 'Bullish';
  const trendColor = isBullish ? '#10B981' : '#EF4444';
  const TrendIcon = isBullish ? TrendingUp : TrendingDown;

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return '#10B981';
    if (confidence >= 60) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="rounded-2xl p-6 card-hover"
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)'
      }}
    >
      <div className="flex items-center mb-4">
        <BarChart2 style={{ color: 'var(--accent-primary)' }} />
        <h3 className="ml-2 text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
          Price Prediction
        </h3>
      </div>

      <div className="space-y-5">
        {/* Predicted Price */}
        <div className="text-center">
          <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Predicted Price</p>
          <div className="flex items-center justify-center text-3xl font-bold" style={{ color: trendColor }}>
            <TrendIcon className="mr-2" size={24} />
            {formatPrice(prediction.predicted_price)}
          </div>
        </div>

        {/* Price Change & Current */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Price Change</p>
            <p className="font-bold" style={{ color: trendColor }}>
              {formatPrice(prediction.price_change)}
            </p>
          </div>
          <div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Current Price</p>
            <p className="font-bold" style={{ color: 'var(--text-primary)' }}>
              {formatPrice(prediction.last_close_price)}
            </p>
          </div>
        </div>

        {/* Confidence Bar */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span style={{ color: 'var(--text-muted)' }}>Prediction Confidence</span>
            <span style={{ color: getConfidenceColor(prediction.prediction_confidence) }}>
              {prediction.prediction_confidence}%
            </span>
          </div>
          <div className="w-full rounded-full h-4 overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${prediction.prediction_confidence}%` }}
              transition={{ duration: 1, delay: 0.6 }}
              className="h-4 rounded-full"
              style={{
                backgroundColor: getConfidenceColor(prediction.prediction_confidence),
                boxShadow: `0 0 15px ${getConfidenceColor(prediction.prediction_confidence)}`
              }}
            />
          </div>
        </div>

        {/* Direction Badge */}
        <div className="flex justify-center">
          <span
            className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium"
            style={{
              backgroundColor: isBullish ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: trendColor
            }}
          >
            <TrendIcon className="mr-1" size={16} />
            {prediction.prediction_direction}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default PricePredictionCard;