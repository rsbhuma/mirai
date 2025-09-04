import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Crown, DollarSign, TrendingUp, Calendar, Award, Gift, Loader2 } from 'lucide-react';
import { useCoinStore } from '@/store/coinStore';
import { Stacker } from '@/data';

interface CoinStackersProps {
  coinId: string;
}

// Removed local Stacker interface and mockStackers - now using centralized data from @/data

export const CoinStackers: React.FC<CoinStackersProps> = ({ coinId }) => {
  // Store integration
  const { coinsCache, loading, error, fetchStackers } = useCoinStore();
  const stackers = coinsCache[coinId]?.stackers || [];
  const isLoading = loading[coinId];
  const hasError = error[coinId];
  const getBadgeColor = (badge: string) => {
    const colors = {
      'Founder': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'Top Contributor': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      'Designer': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
      'Challenge Winner': 'bg-green-500/20 text-green-400 border-green-500/30',
      'Developer': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'Security Expert': 'bg-red-500/20 text-red-400 border-red-500/30',
      'Marketer': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'Community Builder': 'bg-teal-500/20 text-teal-400 border-teal-500/30',
      'Analyst': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
      'Educator': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      'Content Creator': 'bg-lime-500/20 text-lime-400 border-lime-500/30'
    };
    return colors[badge as keyof typeof colors] || 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  };

  const formatStakedAmount = (amount: number) => {
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`;
    }
    return amount.toString();
  };

  const getReputationColor = (reputation: number) => {
    if (reputation >= 90) return 'text-green-400';
    if (reputation >= 80) return 'text-yellow-400';
    if (reputation >= 70) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Community Stackers</h2>
        <div className="flex items-center space-x-4">
          <span className="text-slate-400">
            {stackers.filter(s => s.isOnline).length} online
          </span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-400">
            {stackers.length} total members
          </span>
        </div>
      </div>

      {/* Stackers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stackers.map((stacker, index) => (
          <motion.div
            key={stacker.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 hover:border-orange-500/30 transition-all duration-300"
          >
            <div className="flex items-start space-x-3 mb-4">
              <div className="relative">
                <img
                  src={stacker.avatar}
                  alt={stacker.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-800 ${stacker.isOnline ? 'bg-green-400' : 'bg-slate-500'
                  }`} />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-medium">{stacker.name}</h3>
                <div className="text-slate-400 text-sm">{stacker.wallet}</div>
                <div className="flex items-center space-x-1 mt-1">
                  <Award className={`h-3 w-3 ${getReputationColor(stacker.reputation)}`} />
                  <span className={`text-xs ${getReputationColor(stacker.reputation)}`}>
                    {stacker.reputation}
                  </span>
                </div>
              </div>
            </div>

            {/* Staked Amount */}
            <div className="bg-slate-900/50 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">Staked</span>
                <div className="text-white font-medium">
                  {formatStakedAmount(stacker.stakedAmount)} DEFM
                </div>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              {stacker.badges.map((badge) => (
                <span
                  key={badge}
                  className={`px-2 py-1 rounded-full text-xs font-medium border ${getBadgeColor(badge)}`}
                >
                  {badge}
                </span>
              ))}
            </div>

            {/* Join Date */}
            <div className="text-xs text-slate-400 mb-4">
              Joined {new Date(stacker.joinDate).toLocaleDateString()}
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-orange-500 to-red-500 text-white py-2 px-3 rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-all duration-200"
              >
                <Users className="h-4 w-4" />
                <span>Chat</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-slate-700 text-white p-2 rounded-lg hover:bg-slate-600 transition-colors"
              >
                <Crown className="h-4 w-4" />
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Leaderboard */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Top Stackers</h3>
        <div className="space-y-3">
          {stackers
            .sort((a, b) => b.stakedAmount - a.stakedAmount)
            .slice(0, 5)
            .map((stacker, index) => (
              <div
                key={stacker.id}
                className="flex items-center space-x-3 py-2 px-3 rounded-lg bg-slate-900/30"
              >
                <div className="text-slate-400 font-medium">#{index + 1}</div>
                <img
                  src={stacker.avatar}
                  alt={stacker.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="text-white font-medium">{stacker.name}</div>
                  <div className="text-slate-400 text-sm">{stacker.wallet}</div>
                </div>
                <div className="text-right">
                  <div className="text-white font-medium">
                    {formatStakedAmount(stacker.stakedAmount)} DEFM
                  </div>
                  <div className="text-slate-400 text-xs">
                    {((stacker.stakedAmount / 50000) * 100).toFixed(1)}% of supply
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};