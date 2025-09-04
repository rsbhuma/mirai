import React, { useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { WalletContextProvider } from '@/contexts/WalletContext';
import { Navigation } from '@/components/common/Navigation';
import { DiscoveryHub } from '@/components/pages/discovery/DiscoveryHub';
import { CoinHub } from '@/components/pages/coin/CoinHub';
import { Profile } from '@/components/pages/profile/Profile';
import { CreateContent } from '@/components/pages/content/CreateContent';
import { Settings } from '@/components/pages/settings/Settings';
// Import stores for data fetching
import { usePostsStore } from '@/store/postsStore';
import { useCommunitiesStore } from '@/store/communitiesStore';
import { useReelsStore } from '@/store/reelsStore';
import { usePredictionMarketsStore } from '@/store/predictionMarketsStore';
import { Plus } from 'lucide-react';
import AuthManager from '@/components/AuthManager';

function App() {
  // Get fetch functions from stores
  const fetchPosts = usePostsStore(state => state.fetchPosts);
  const fetchCommunities = useCommunitiesStore(state => state.fetchCommunities);
  const fetchReels = useReelsStore(state => state.fetchReels);
  const fetchPredictionMarkets = usePredictionMarketsStore(state => state.fetchPredictionMarkets);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize stores by fetching data
    fetchPosts();
    fetchCommunities();
    fetchReels();
    fetchPredictionMarkets();
  }, [fetchPosts, fetchCommunities, fetchReels, fetchPredictionMarkets]);

  // Auto-redirect to discovery if on root
  useEffect(() => {
    if (location.pathname === '/') {
      navigate('/discovery');
    }
  }, [location.pathname, navigate]);

  return (
    <WalletContextProvider>
      <AuthManager />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Navigation />
        <main className="pt-16">
          <Routes>
            <Route path="/discovery" element={<DiscoveryHub />} />
            <Route path="/coin/:coinId" element={<CoinHub />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/create" element={<CreateContent />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>

        {/* Floating Action Button */}
        <button
          onClick={() => navigate('/create')}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 rounded-full shadow-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200 transform hover:scale-105 z-50"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>
    </WalletContextProvider>
  );
}

export default App;