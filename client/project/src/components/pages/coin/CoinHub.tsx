import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/common/ui/Tabs';
import { CoinStats } from './components/CoinStats';
import { CoinDiscussions } from './components/CoinDiscussions';
import { CoinChat } from './components/CoinChat';
import { CoinChallenges } from './components/CoinChallenges';
import { CoinRewards } from './components/CoinRewards';
import { CoinStackers } from './components/CoinStackers';
import { BarChart3, MessageSquare, MessageCircle, Trophy, Gift, Users, Loader2 } from 'lucide-react';
import { useCoinStore } from '@/store/coinStore';

export const CoinHub = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('stats');

  // Store integration
  const { 
    coinsCache, 
    loading, 
    error, 
    fetchCoinData,
    fetchDiscussions,
    fetchChallenges,
    fetchRewards,
    fetchStackers,
    fetchChatMessages
  } = useCoinStore();

  const coinId = id!;
  const coinData = coinsCache[coinId]?.coin;
  const isLoading = loading[coinId];
  const hasError = error[coinId];

  // Fetch coin data on component mount
  useEffect(() => {
    if (coinId) {
      fetchCoinData(coinId);
    }
  }, [coinId, fetchCoinData]);

  // Fetch specific data when tabs are activated
  useEffect(() => {
    if (!coinId || !coinsCache[coinId]) return;

    switch (activeTab) {
      case 'discussions':
        if (!coinsCache[coinId].discussions.length) {
          fetchDiscussions(coinId);
        }
        break;
      case 'challenges':
        if (!coinsCache[coinId].challenges.length) {
          fetchChallenges(coinId);
        }
        break;
      case 'rewards':
        if (!coinsCache[coinId].rewards.length) {
          fetchRewards(coinId);
        }
        break;
      case 'stackers':
        if (!coinsCache[coinId].stackers.length) {
          fetchStackers(coinId);
        }
        break;
      case 'chat':
        if (!coinsCache[coinId].chatMessages.length) {
          fetchChatMessages(coinId);
        }
        break;
    }
  }, [activeTab, coinId, coinsCache, fetchDiscussions, fetchChallenges, fetchRewards, fetchStackers, fetchChatMessages]);

  const tabs = [
    { id: 'stats', label: 'Stats', icon: BarChart3 },
    { id: 'discussions', label: 'Discussions', icon: MessageSquare },
    { id: 'chat', label: 'Chat', icon: MessageCircle },
    { id: 'challenges', label: 'Challenges', icon: Trophy },
    { id: 'rewards', label: 'My Rewards', icon: Gift },
    { id: 'stackers', label: 'Stackers', icon: Users },
  ];

  // Loading state
  if (isLoading && !coinData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto mb-4" />
          <div className="text-slate-400 text-lg mb-2">Loading coin data...</div>
          <div className="text-slate-500 text-sm">Fetching the latest information</div>
        </div>
      </div>
    );
  }

  // Error state
  if (hasError && !coinData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="text-red-400 text-lg mb-2">Failed to load coin data</div>
          <div className="text-slate-500 text-sm mb-4">{hasError}</div>
          <button
            onClick={() => fetchCoinData(coinId)}
            className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // No data state
  if (!coinData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="text-slate-400 text-lg mb-2">Coin not found</div>
          <div className="text-slate-500 text-sm">The requested coin could not be loaded</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <img
            src={coinData.image}
            alt={coinData.name}
            className="w-16 h-16 rounded-full object-cover"
          />
          <div>
            <h1 className="text-3xl font-bold text-white">{coinData.name}</h1>
            <div className="flex items-center space-x-2">
              <span className="text-slate-400">{coinData.symbol}</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">by {coinData.creator}</span>
            </div>
          </div>
        </div>
        <p className="text-slate-300 max-w-2xl">{coinData.description}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-6 w-full max-w-4xl mx-auto mb-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center space-x-2">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="stats" className="mt-0">
          <CoinStats coinData={coinData} />
        </TabsContent>
        
        <TabsContent value="discussions" className="mt-0">
          <CoinDiscussions coinId={coinId} />
        </TabsContent>
        
        <TabsContent value="chat" className="mt-0">
          <CoinChat coinId={coinId} />
        </TabsContent>
        
        <TabsContent value="challenges" className="mt-0">
          <CoinChallenges coinId={coinId} />
        </TabsContent>
        
        <TabsContent value="rewards" className="mt-0">
          <CoinRewards coinId={coinId} />
        </TabsContent>
        
        <TabsContent value="stackers" className="mt-0">
          <CoinStackers coinId={coinId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};