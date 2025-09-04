import React, { useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Users, DollarSign, Clock, BarChart3, Loader2 } from 'lucide-react';
import { usePredictionMarketsStore } from '@/store/predictionMarketsStore';
import { PredictionMarket } from '@/data';

interface PredictivePlaysProps {
  searchQuery?: string;
  isSearching?: boolean;
}

// Removed local PredictionMarket interface and mockPredictionsData - now using centralized data from @/data

export const PredictivePlays: React.FC<PredictivePlaysProps> = ({ searchQuery = '', isSearching = false }) => {
  // Store integration
  const { predictionMarkets, loading, error, fetchPredictionMarkets } = usePredictionMarketsStore();

  // Fetch prediction markets on component mount
  useEffect(() => {
    fetchPredictionMarkets();
  }, [fetchPredictionMarkets]);

  const filteredData = useMemo(() => {
    if (!isSearching || !searchQuery.trim()) {
      return predictionMarkets;
    }

    const query = searchQuery.toLowerCase();
    return predictionMarkets.filter(market =>
      market.title.toLowerCase().includes(query) ||
      market.description.toLowerCase().includes(query) ||
      market.category.toLowerCase().includes(query)
    );
  }, [searchQuery, isSearching, predictionMarkets]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      Crypto: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      NFT: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      Gaming: 'bg-green-500/20 text-green-400 border-green-500/30',
      Climate: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    };
    return colors[category as keyof typeof colors] || 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  };

  const getDaysRemaining = (endDate: string) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Prediction Markets</h2>
        <p className="text-slate-400">Trade on the outcomes of future events</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Loading State */}
        {loading && (
          <div className="col-span-full text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto mb-4" />
            <div className="text-slate-400 text-lg mb-2">Loading prediction markets...</div>
            <div className="text-slate-500 text-sm">Fetching the latest markets</div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="col-span-full text-center py-12">
            <div className="text-red-400 text-lg mb-2">Failed to load prediction markets</div>
            <div className="text-slate-500 text-sm mb-4">{error}</div>
            <button
              onClick={fetchPredictionMarkets}
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200"
            >
              Try Again
            </button>
          </div>
        )}

        {/* No Data State */}
        {!loading && !error && filteredData.length === 0 && (
          <div className="col-span-full text-center py-12">
            <div className="text-slate-400 text-lg mb-2">No prediction markets found</div>
            <div className="text-slate-500 text-sm">
              {isSearching ? 'Try adjusting your search terms or filters' : 'No prediction markets available yet'}
            </div>
          </div>
        )}

        {filteredData.map((market, index) => (
          <motion.div
            key={market.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden hover:border-orange-500/30 transition-all duration-300"
          >
            <div className="relative">
              <img
                src={market.image}
                alt={market.title}
                className="w-full h-32 object-cover"
              />
              <div className="absolute top-4 right-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(market.category)}`}>
                  {market.category}
                </span>
              </div>
            </div>

            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-2">{market.title}</h3>
              <p className="text-slate-300 text-sm mb-4">{market.description}</p>

              {/* Market Stats */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-white font-medium">${formatNumber(market.totalVolume)}</div>
                  <div className="text-xs text-slate-400">Volume</div>
                </div>
                <div className="text-center">
                  <div className="text-white font-medium">{market.participants}</div>
                  <div className="text-xs text-slate-400">Participants</div>
                </div>
                <div className="text-center">
                  <div className="text-white font-medium">{getDaysRemaining(market.endDate)}d</div>
                  <div className="text-xs text-slate-400">Remaining</div>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {market.options.map((option) => (
                  <motion.div
                    key={option.id}
                    whileHover={{ scale: 1.02 }}
                    className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/30 hover:border-orange-500/30 transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">{option.text}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-300 text-sm">{option.probability}%</span>
                        {option.probability > 50 ? (
                          <TrendingUp className="h-4 w-4 text-green-400" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-400" />
                        )}
                      </div>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${option.probability}%` }}
                      />
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      ${formatNumber(option.volume)} volume
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full mt-4 bg-gradient-to-r from-orange-500 to-red-500 text-white py-2 px-4 rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-all duration-200"
              >
                Trade Prediction
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};