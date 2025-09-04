import React, { useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Heart, MessageCircle, Share2, Loader2 } from 'lucide-react';
import { useReelsStore } from '@/store/reelsStore';
import { ReelData } from '@/data';

interface ReelsProps {
  searchQuery?: string;
  isSearching?: boolean;
}

// Removed local ReelData interface and mockReelsData - now using centralized data from @/data

export const Reels: React.FC<ReelsProps> = ({ searchQuery = '', isSearching = false }) => {
  // Store integration
  const { reels, loading, error, fetchReels } = useReelsStore();

  // Fetch reels on component mount
  useEffect(() => {
    fetchReels();
  }, [fetchReels]);

  const filteredData = useMemo(() => {
    if (!isSearching || !searchQuery.trim()) {
      return reels;
    }

    const query = searchQuery.toLowerCase();
    return reels.filter(reel =>
      reel.title.toLowerCase().includes(query) ||
      reel.creator.toLowerCase().includes(query) ||
      reel.community.toLowerCase().includes(query)
    );
  }, [searchQuery, isSearching, reels]);

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Community Reels</h2>
        <p className="text-slate-400">Discover short-form content from active communities</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Loading State */}
        {loading && (
          <div className="col-span-full text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto mb-4" />
            <div className="text-slate-400 text-lg mb-2">Loading reels...</div>
            <div className="text-slate-500 text-sm">Fetching the latest content</div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="col-span-full text-center py-12">
            <div className="text-red-400 text-lg mb-2">Failed to load reels</div>
            <div className="text-slate-500 text-sm mb-4">{error}</div>
            <button
              onClick={fetchReels}
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200"
            >
              Try Again
            </button>
          </div>
        )}

        {/* No Data State */}
        {!loading && !error && filteredData.length === 0 && (
          <div className="col-span-full text-center py-12">
            <div className="text-slate-400 text-lg mb-2">No reels found</div>
            <div className="text-slate-500 text-sm">
              {isSearching ? 'Try adjusting your search terms or filters' : 'No reels available yet'}
            </div>
          </div>
        )}

        {filteredData.map((reel, index) => (
          <motion.div
            key={reel.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden hover:border-orange-500/30 transition-all duration-300 cursor-pointer group"
          >
            <div className="relative aspect-[9/16] bg-slate-900">
              <img
                src={reel.thumbnail}
                alt={reel.title}
                className="w-full h-full object-cover"
              />

              {/* Play Button Overlay */}
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="bg-white/20 backdrop-blur-sm rounded-full p-3"
                >
                  <Play className="h-8 w-8 text-white" fill="white" />
                </motion.div>
              </div>

              {/* Duration Badge */}
              <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-md">
                <span className="text-white text-xs font-medium">{reel.duration}</span>
              </div>

              {/* Community Badge */}
              <div className="absolute top-3 left-3 bg-gradient-to-r from-orange-500/80 to-red-500/80 backdrop-blur-sm px-2 py-1 rounded-md">
                <span className="text-white text-xs font-medium">{reel.community}</span>
              </div>

              {/* Stats Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                <h3 className="text-white font-medium text-sm mb-1 line-clamp-2">{reel.title}</h3>
                <p className="text-slate-300 text-xs mb-2">by {reel.creator}</p>

                <div className="flex items-center justify-between">
                  <span className="text-slate-300 text-xs">{reel.views} views</span>

                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                      <Heart className="h-3 w-3 text-red-400" />
                      <span className="text-xs text-slate-300">{reel.likes}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MessageCircle className="h-3 w-3 text-blue-400" />
                      <span className="text-xs text-slate-300">{reel.comments}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};