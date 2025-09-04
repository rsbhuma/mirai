import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Users, Droplets, Lock, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import * as api from '@/api';
import { useCoinTrade } from '@/hooks/useCoinTrade';

interface CoinStatsProps {
  coinData: {
    name: string;
    symbol: string;
    price: number;
    marketCap: number;
    members: number;
    change24h: number;
    mint: PublicKey; // Added mint to coinData
  };
}

// Mock price data
const priceData = [
  { time: '00:00', price: 0.42 },
  { time: '04:00', price: 0.38 },
  { time: '08:00', price: 0.41 },
  { time: '12:00', price: 0.43 },
  { time: '16:00', price: 0.45 },
  { time: '20:00', price: 0.47 },
  { time: '24:00', price: 0.45 },
];

export const CoinStats: React.FC<CoinStatsProps> = ({ coinData }) => {
  // Wallet and trading state
  const { connected, publicKey, signTransaction } = useWallet();
  const [buyAmount, setBuyAmount] = useState('');
  const [sellAmount, setSellAmount] = useState('');
  const [stakeAmount, setStakeAmount] = useState('');
  const [isBuying, setIsBuying] = useState(false);
  const [isSelling, setIsSelling] = useState(false);
  const [isStaking, setIsStaking] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const { buyCoin, sellCoin, loading: tradeLoading, error: tradeError, result: tradeResult } = useCoinTrade();

  // Calculate token amounts based on price
  const calculateTokensToReceive = (solAmount: number) => {
    if (!solAmount || solAmount <= 0) return 0;
    return (solAmount / coinData.price);
  };

  const calculateSolToReceive = (tokenAmount: number) => {
    if (!tokenAmount || tokenAmount <= 0) return 0;
    return (tokenAmount * coinData.price);
  };

  // Reset transaction status after delay
  useEffect(() => {
    if (transactionStatus === 'success' || transactionStatus === 'error') {
      const timer = setTimeout(() => {
        setTransactionStatus('idle');
        setErrorMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [transactionStatus]);

  // Trading functions
  const handleBuy = async () => {
    if (!connected || !publicKey || !signTransaction) {
      setErrorMessage('Please connect your wallet first');
      setTransactionStatus('error');
      return;
    }
    if (!buyAmount || parseFloat(buyAmount) <= 0) {
      setErrorMessage('Please enter a valid amount');
      setTransactionStatus('error');
      return;
    }
    setIsBuying(true);
    setTransactionStatus('pending');
    try {
      await buyCoin({ mint: coinData.mint.toString(), amountSol: parseFloat(buyAmount), price: coinData.price });
      setTransactionStatus('success');
      setBuyAmount('');
    } catch (error) {
      setErrorMessage((error as Error).message || 'Transaction failed. Please try again.');
      setTransactionStatus('error');
    } finally {
      setIsBuying(false);
    }
  };

  const handleSell = async () => {
    if (!connected || !publicKey || !signTransaction) {
      setErrorMessage('Please connect your wallet first');
      setTransactionStatus('error');
      return;
    }
    if (!sellAmount || parseFloat(sellAmount) <= 0) {
      setErrorMessage('Please enter a valid amount');
      setTransactionStatus('error');
      return;
    }
    setIsSelling(true);
    setTransactionStatus('pending');
    try {
      await sellCoin({ mint: coinData.mint.toString(), amountTokens: parseFloat(sellAmount), price: coinData.price });
      setTransactionStatus('success');
      setSellAmount('');
    } catch (error) {
      setErrorMessage((error as Error).message || 'Transaction failed. Please try again.');
      setTransactionStatus('error');
    } finally {
      setIsSelling(false);
    }
  };

  const handleStake = async () => {
    if (!connected || !publicKey || !signTransaction) {
      setErrorMessage('Please connect your wallet first');
      setTransactionStatus('error');
      return;
    }

    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      setErrorMessage('Please enter a valid amount');
      setTransactionStatus('error');
      return;
    }

    setIsStaking(true);
    setTransactionStatus('pending');

    try {
      // Use the createTransaction API for staking (using 'buy' type for now since 'stake' is not available)
      await api.createTransaction({
        type: 'buy',
        token_id: coinData.mint?.toString() || coinData.symbol,
        amount: parseFloat(stakeAmount),
        price_per_token: coinData.price,
        tx_signature: 'pending' // This would be filled by the actual blockchain transaction
      });

      setTransactionStatus('success');
      setStakeAmount('');
    } catch (error) {
      console.error('Staking failed:', error);
      setErrorMessage('Staking failed. Please try again.');
      setTransactionStatus('error');
    } finally {
      setIsStaking(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(1)}K`;
    }
    return `$${num}`;
  };

  const stats = [
    {
      label: 'Price',
      value: `$${coinData.price.toFixed(2)}`,
      change: coinData.change24h,
      icon: DollarSign,
      color: 'text-green-400'
    },
    {
      label: 'Market Cap',
      value: formatNumber(coinData.marketCap),
      change: 8.3,
      icon: TrendingUp,
      color: 'text-blue-400'
    },
    {
      label: 'Liquidity',
      value: '$234K',
      change: 5.7,
      icon: Droplets,
      color: 'text-purple-400'
    },
    {
      label: 'Staked',
      value: '67%',
      change: 2.1,
      icon: Lock,
      color: 'text-orange-400'
    },
    {
      label: 'Treasury',
      value: '$89K',
      change: 12.4,
      icon: Users,
      color: 'text-pink-400'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Transaction Status */}
      {transactionStatus !== 'idle' && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`rounded-lg p-4 border ${
            transactionStatus === 'success' 
              ? 'bg-green-500/20 border-green-500/30' 
              : transactionStatus === 'error'
              ? 'bg-red-500/20 border-red-500/30'
              : 'bg-blue-500/20 border-blue-500/30'
          }`}
        >
          <div className="flex items-center space-x-2">
            {transactionStatus === 'pending' && <Loader2 className="h-4 w-4 animate-spin text-blue-400" />}
            {transactionStatus === 'success' && <CheckCircle className="h-4 w-4 text-green-400" />}
            {transactionStatus === 'error' && <AlertCircle className="h-4 w-4 text-red-400" />}
            <span className={`font-medium ${
              transactionStatus === 'success' 
                ? 'text-green-400' 
                : transactionStatus === 'error'
                ? 'text-red-400'
                : 'text-blue-400'
            }`}>
              {transactionStatus === 'pending' && 'Processing transaction...'}
              {transactionStatus === 'success' && 'Transaction successful!'}
              {transactionStatus === 'error' && errorMessage}
            </span>
          </div>
        </motion.div>
      )}

      {/* Wallet Connection Warning */}
      {!connected && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-orange-500/20 border border-orange-500/30 rounded-lg p-4"
        >
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-orange-400" />
            <span className="text-orange-400 font-medium">Please connect your wallet to trade</span>
          </div>
        </motion.div>
      )}

      {/* Price Chart */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Price Chart</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={priceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="url(#gradient)" 
                strokeWidth={3}
                dot={false}
              />
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
              </defs>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6"
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={`h-5 w-5 ${stat.color}`} />
                <div className={`flex items-center space-x-1 ${stat.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {stat.change >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span className="text-xs">
                    {stat.change >= 0 ? '+' : ''}{stat.change.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-slate-400">{stat.label}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Trading Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Buy {coinData.symbol}</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Amount (SOL)
              </label>
              <input
                type="number"
                value={buyAmount}
                onChange={(e) => setBuyAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                disabled={!connected || isBuying}
              />
            </div>
            <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/30">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">You'll receive</span>
                <span className="text-white">
                  ~{calculateTokensToReceive(parseFloat(buyAmount) || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} {coinData.symbol}
                </span>
              </div>
            </div>
            <motion.button
              onClick={handleBuy}
              disabled={!connected || isBuying || !buyAmount || parseFloat(buyAmount) <= 0}
              whileHover={{ scale: connected && !isBuying && buyAmount && parseFloat(buyAmount) > 0 ? 1.05 : 1 }}
              whileTap={{ scale: connected && !isBuying && buyAmount && parseFloat(buyAmount) > 0 ? 0.95 : 1 }}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                !connected || isBuying || !buyAmount || parseFloat(buyAmount) <= 0
                  ? 'bg-slate-600 text-slate-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
              }`}
            >
              {isBuying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Buying...</span>
                </>
              ) : !connected ? (
                <span>Connect Wallet</span>
              ) : (
                <span>Buy {coinData.symbol}</span>
              )}
            </motion.button>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Sell {coinData.symbol}</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Amount ({coinData.symbol})
              </label>
              <input
                type="number"
                value={sellAmount}
                onChange={(e) => setSellAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                disabled={!connected || isSelling}
              />
            </div>
            <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/30">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">You'll receive</span>
                <span className="text-white">
                  ~{calculateSolToReceive(parseFloat(sellAmount) || 0).toFixed(4)} SOL
                </span>
              </div>
            </div>
            <motion.button
              onClick={handleSell}
              disabled={!connected || isSelling || !sellAmount || parseFloat(sellAmount) <= 0}
              whileHover={{ scale: connected && !isSelling && sellAmount && parseFloat(sellAmount) > 0 ? 1.05 : 1 }}
              whileTap={{ scale: connected && !isSelling && sellAmount && parseFloat(sellAmount) > 0 ? 0.95 : 1 }}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                !connected || isSelling || !sellAmount || parseFloat(sellAmount) <= 0
                  ? 'bg-slate-600 text-slate-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600'
              }`}
            >
              {isSelling ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Selling...</span>
                </>
              ) : !connected ? (
                <span>Connect Wallet</span>
              ) : (
                <span>Sell {coinData.symbol}</span>
              )}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Staking Section */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Stake to Become a Stacker</h3>
        <p className="text-slate-300 mb-6">
          Stake your {coinData.symbol} tokens to gain access to exclusive community features, discussions, and challenges.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Amount to Stake ({coinData.symbol})
            </label>
            <input
              type="number"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              disabled={!connected || isStaking}
            />
          </div>
          <div className="flex items-end">
            <motion.button
              onClick={handleStake}
              disabled={!connected || isStaking || !stakeAmount || parseFloat(stakeAmount) <= 0}
              whileHover={{ scale: connected && !isStaking && stakeAmount && parseFloat(stakeAmount) > 0 ? 1.05 : 1 }}
              whileTap={{ scale: connected && !isStaking && stakeAmount && parseFloat(stakeAmount) > 0 ? 0.95 : 1 }}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                !connected || isStaking || !stakeAmount || parseFloat(stakeAmount) <= 0
                  ? 'bg-slate-600 text-slate-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600'
              }`}
            >
              {isStaking ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Staking...</span>
                </>
              ) : !connected ? (
                <span>Connect Wallet</span>
              ) : (
                <span>Stake Tokens</span>
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};