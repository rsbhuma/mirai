import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/common/ui/Tabs';
import { MainFeed } from './components/MainFeed';
import { FlamesIgnited } from './components/FlamesIgnited';
import { Reels } from './components/Reels';
import { PredictivePlays } from './components/PredictivePlays';
import { Flame, Grid3X3, Play, TrendingUp } from 'lucide-react';

export const DiscoveryHub = () => {
  const [activeTab, setActiveTab] = useState('main');

  const tabs = [
    { id: 'main', label: 'Main Feed', icon: Flame },
    { id: 'flames', label: 'Flames Ignited', icon: TrendingUp },
    { id: 'reels', label: 'Reels', icon: Grid3X3 },
    { id: 'predictive', label: 'Predictive Plays', icon: Play },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Discovery Hub</h1>
        <p className="text-slate-400">Explore, create, and ignite the next big community</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl mx-auto mb-8">
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

        <TabsContent value="main" className="mt-0">
          <MainFeed />
        </TabsContent>

        <TabsContent value="flames" className="mt-0">
          <FlamesIgnited />
        </TabsContent>

        <TabsContent value="reels" className="mt-0">
          <Reels />
        </TabsContent>

        <TabsContent value="predictive" className="mt-0">
          <PredictivePlays />
        </TabsContent>
      </Tabs>
    </div>
  );
};