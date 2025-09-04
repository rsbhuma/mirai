import React, { useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { TrendingUp, Users, DollarSign, Activity, Loader2 } from 'lucide-react';
import { useCommunitiesStore } from '@/store/communitiesStore';
import { FlameData } from '@/data';

interface FlamesIgnitedProps {
  searchQuery?: string;
  isSearching?: boolean;
}

// Removed local FlameData interface and mockFlamesData - now using centralized data from @/data

export const FlamesIgnited: React.FC<FlamesIgnitedProps> = ({ searchQuery = '', isSearching = false }) => {
  // Store integration
  const { communities, loading, error, fetchCommunities } = useCommunitiesStore();

  // Fetch communities on component mount
  useEffect(() => {
    fetchCommunities();
  }, [fetchCommunities]);

  const filteredData = useMemo(() => {
    if (!isSearching || !searchQuery.trim()) {
      return communities;
    }

    const query = searchQuery.toLowerCase();
    return communities.filter(flame =>
      flame.name.toLowerCase().includes(query) ||
      flame.symbol.toLowerCase().includes(query) ||
      flame.description.toLowerCase().includes(query) ||
      flame.category.toLowerCase().includes(query)
    );
  }, [searchQuery, isSearching, communities]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(1)}K`;
    }
    return `$${num}`;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      DeFi: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      NFT: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      Gaming: 'bg-green-500/20 text-green-400 border-green-500/30',
      Sustainability: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      Social: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
      Education: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    };
    return colors[category as keyof typeof colors] || 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Active Communities</h2>
        <p className="text-slate-400">Explore thriving communities that have ignited their flames</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Loading State */}
        {loading && (
          <div className="col-span-full text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto mb-4" />
            <div className="text-slate-400 text-lg mb-2">Loading communities...</div>
            <div className="text-slate-500 text-sm">Fetching the latest communities</div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="col-span-full text-center py-12">
            <div className="text-red-400 text-lg mb-2">Failed to load communities</div>
            <div className="text-slate-500 text-sm mb-4">{error}</div>
            <button
              onClick={fetchCommunities}
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200"
            >
              Try Again
            </button>
          </div>
        )}

        {/* No Data State */}
        {!loading && !error && filteredData.length === 0 && (
          <div className="col-span-full text-center py-12">
            <div className="text-slate-400 text-lg mb-2">No communities found</div>
            <div className="text-slate-500 text-sm">
              {isSearching ? 'Try adjusting your search terms or filters' : 'No communities available yet'}
            </div>
          </div>
        )}

        {filteredData.map((flame, index) => (
          <motion.div
            key={flame.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ y: -5 }}
            className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden hover:border-orange-500/30 transition-all duration-300"
          >
            <div className="relative">
              <img
                src={flame.image}
                alt={flame.name}
                className="w-full h-48 object-cover"
              />
              <div className="absolute top-4 right-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(flame.category)}`}>
                  {flame.category}
                </span>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-white">{flame.name}</h3>
                <span className="text-slate-400 text-sm font-mono">{flame.symbol}</span>
              </div>

              <p className="text-slate-300 text-sm mb-4 line-clamp-2">{flame.description}</p>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-green-400" />
                  <div>
                    <div className="text-white font-medium">${flame.price.toFixed(2)}</div>
                    <div className={`text-xs ${flame.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {flame.change24h >= 0 ? '+' : ''}{flame.change24h.toFixed(1)}%
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-blue-400" />
                  <div>
                    <div className="text-white font-medium">{flame.members}</div>
                    <div className="text-xs text-slate-400">Members</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 mb-4">
                <Activity className="h-4 w-4 text-purple-400" />
                <div>
                  <div className="text-white font-medium">{formatNumber(flame.marketCap)}</div>
                  <div className="text-xs text-slate-400">Market Cap</div>
                </div>
              </div>

              <Link
                to={`/coin/${flame.id}`}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-2 px-4 rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <TrendingUp className="h-4 w-4" />
                <span>View Community</span>
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};