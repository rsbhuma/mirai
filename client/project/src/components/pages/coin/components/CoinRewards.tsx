import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gift, Users, DollarSign, Clock, Trophy, ExternalLink, Download, Loader2 } from 'lucide-react';
import { useCoinStore } from '@/store/coinStore';
import { Reward } from '@/data';

interface CoinRewardsProps {
  coinId: string;
}

// Removed local Reward interface and mockRewards - now using centralized data from @/data

export const CoinRewards: React.FC<CoinRewardsProps> = ({ coinId }) => {
  // Store integration
  const { coinsCache, loading, error, fetchRewards } = useCoinStore();
  const rewards = coinsCache[coinId]?.rewards || [];
  const isLoading = loading[coinId];
  const hasError = error[coinId];
  const totalRewards = rewards.reduce((sum, reward) => sum + reward.amount, 0);
  const claimableRewards = rewards
    .filter(reward => reward.status === 'ready')
    .reduce((sum, reward) => sum + reward.amount, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'claimed':
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getRewardIcon = (type: string) => {
    switch (type) {
      case 'referral':
        return <Users className="h-4 w-4 text-blue-400" />;
      case 'challenge':
        return <Trophy className="h-4 w-4 text-orange-400" />;
      default:
        return <Gift className="h-4 w-4 text-purple-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">My Rewards</h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={claimableRewards === 0}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${claimableRewards > 0
            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
            : 'bg-slate-700 text-slate-400 cursor-not-allowed'
            }`}
        >
          <Download className="h-4 w-4" />
          <span>Claim All ({claimableRewards} DEFM)</span>
        </motion.button>
      </div>

      {/* Rewards Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
          <div className="flex items-center space-x-3 mb-2">
            <Gift className="h-5 w-5 text-purple-400" />
            <span className="text-slate-300">Total Rewards</span>
          </div>
          <div className="text-2xl font-bold text-white">{totalRewards} DEFM</div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
          <div className="flex items-center space-x-3 mb-2">
            <Download className="h-5 w-5 text-green-400" />
            <span className="text-slate-300">Claimable</span>
          </div>
          <div className="text-2xl font-bold text-green-400">{claimableRewards} DEFM</div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
          <div className="flex items-center space-x-3 mb-2">
            <Users className="h-5 w-5 text-blue-400" />
            <span className="text-slate-300">Referrals</span>
          </div>
          <div className="text-2xl font-bold text-blue-400">
            {rewards.filter(r => r.type === 'referral').length}
          </div>
        </div>
      </div>

      {/* Rewards List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Reward History</h3>
        {rewards.map((reward, index) => (
          <motion.div
            key={reward.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-slate-700/50 rounded-lg">
                  {getRewardIcon(reward.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="text-white font-medium">{reward.title}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(reward.status)}`}>
                      {reward.status.charAt(0).toUpperCase() + reward.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-slate-300 text-sm mb-2">{reward.description}</p>
                  <div className="text-sm text-slate-400">{reward.date}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-white">{reward.amount} DEFM</div>
                {reward.status === 'ready' && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="mt-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-lg text-sm font-medium hover:from-green-600 hover:to-emerald-600 transition-all duration-200"
                  >
                    Claim
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Referral Link */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Your Referral Link</h3>
        <p className="text-slate-300 text-sm mb-4">
          Share this link to earn rewards when new users stake in this community
        </p>
        <div className="flex items-center space-x-3">
          <input
            type="text"
            value={`https://theflame.app/coin/${coinId}?ref=your-wallet-address`}
            readOnly
            className="flex-1 bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-all duration-200"
          >
            Copy
          </motion.button>
        </div>
      </div>
    </div>
  );
};