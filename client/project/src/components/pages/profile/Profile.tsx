import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/common/ui/Tabs';
import { Wallet, TrendingUp, Users, Share2, Copy } from 'lucide-react';

export const Profile = () => {
  const [activeTab, setActiveTab] = useState('portfolio');

  // Mock user data
  const userData = {
    name: 'John Doe',
    wallet: '4x7B...9kN2',
    avatar: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
    totalValue: 12450,
    portfolioChange: 8.5,
    communities: 7,
    referrals: 23
  };

  const portfolio = [
    {
      id: '1',
      name: 'DeFiMax Protocol',
      symbol: 'DEFM',
      amount: 5000,
      value: 2250,
      change: 12.5,
      image: 'https://images.pexels.com/photos/730547/pexels-photo-730547.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2'
    },
    {
      id: '2',
      name: 'ArtFlow NFT',
      symbol: 'ARTF',
      amount: 3200,
      value: 2496,
      change: -5.2,
      image: 'https://images.pexels.com/photos/1181343/pexels-photo-1181343.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2'
    },
    {
      id: '3',
      name: 'GameChain',
      symbol: 'GCHAIN',
      amount: 2800,
      value: 3444,
      change: 23.8,
      image: 'https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2'
    },
    {
      id: '4',
      name: 'EcoToken',
      symbol: 'ECO',
      amount: 4500,
      value: 1530,
      change: 8.7,
      image: 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2'
    },
    {
      id: '5',
      name: 'SocialFi Hub',
      symbol: 'SOFI',
      amount: 3800,
      value: 2546,
      change: 15.3,
      image: 'https://images.pexels.com/photos/267371/pexels-photo-267371.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2'
    }
  ];

  const referralLinks = [
    {
      id: '1',
      community: 'DeFiMax Protocol',
      link: 'https://theflame.app/coin/1?ref=4x7B...9kN2',
      earnings: 450,
      referrals: 8
    },
    {
      id: '2',
      community: 'ArtFlow NFT',
      link: 'https://theflame.app/coin/2?ref=4x7B...9kN2',
      earnings: 320,
      referrals: 6
    },
    {
      id: '3',
      community: 'GameChain',
      link: 'https://theflame.app/coin/3?ref=4x7B...9kN2',
      earnings: 680,
      referrals: 9
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Profile Header */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 mb-8">
        <div className="flex items-center space-x-4">
          <img
            src={userData.avatar}
            alt={userData.name}
            className="w-20 h-20 rounded-full object-cover"
          />
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-2">{userData.name}</h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Wallet className="h-4 w-4 text-slate-400" />
                <span className="text-slate-400">{userData.wallet}</span>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-slate-700 text-white px-3 py-1 rounded-lg hover:bg-slate-600 transition-colors"
              >
                <Copy className="h-4 w-4" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">${userData.totalValue.toLocaleString()}</div>
            <div className="text-sm text-slate-400">Total Value</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${userData.portfolioChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {userData.portfolioChange >= 0 ? '+' : ''}{userData.portfolioChange.toFixed(1)}%
            </div>
            <div className="text-sm text-slate-400">24h Change</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{userData.communities}</div>
            <div className="text-sm text-slate-400">Communities</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{userData.referrals}</div>
            <div className="text-sm text-slate-400">Total Referrals</div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="referrals">Referral Links</TabsTrigger>
        </TabsList>

        <TabsContent value="portfolio" className="mt-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">My Portfolio</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {portfolio.map((token, index) => (
                <motion.div
                  key={token.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6"
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <img
                      src={token.image}
                      alt={token.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="text-white font-medium">{token.name}</h3>
                      <span className="text-slate-400 text-sm">{token.symbol}</span>
                    </div>
                    <div className={`flex items-center space-x-1 ${token.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-sm">
                        {token.change >= 0 ? '+' : ''}{token.change.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-white font-medium">{token.amount.toLocaleString()}</div>
                      <div className="text-slate-400 text-sm">Amount</div>
                    </div>
                    <div>
                      <div className="text-white font-medium">${token.value.toLocaleString()}</div>
                      <div className="text-slate-400 text-sm">Value</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="referrals" className="mt-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Referral Links</h2>
            <div className="space-y-4">
              {referralLinks.map((link, index) => (
                <motion.div
                  key={link.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-medium">{link.community}</h3>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-white font-medium">{link.earnings} DEFM</div>
                        <div className="text-slate-400 text-sm">Earned</div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-medium">{link.referrals}</div>
                        <div className="text-slate-400 text-sm">Referrals</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <input
                      type="text"
                      value={link.link}
                      readOnly
                      className="flex-1 bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-all duration-200"
                    >
                      <Copy className="h-4 w-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors"
                    >
                      <Share2 className="h-4 w-4" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};