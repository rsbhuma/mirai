import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, X, Filter } from 'lucide-react';

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSearching: boolean;
  setIsSearching: (searching: boolean) => void;
  activeTab: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  setSearchQuery,
  isSearching,
  setIsSearching,
  activeTab
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    contentType: 'all',
    category: 'all',
    sortBy: 'recent'
  });

  useEffect(() => {
    setIsSearching(searchQuery.length > 0);
  }, [searchQuery, setIsSearching]);

  const handleClearSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
  };

  const getPlaceholderText = () => {
    switch (activeTab) {
      case 'main':
        return 'Search posts, creators, or content...';
      case 'flames':
        return 'Search communities, tokens, or categories...';
      case 'reels':
        return 'Search reels, creators, or topics...';
      case 'predictive':
        return 'Search prediction markets or categories...';
      default:
        return 'Search...';
    }
  };

  const getFilterOptions = () => {
    switch (activeTab) {
      case 'main':
        return {
          contentTypes: ['all', 'text', 'image', 'video', 'link'],
          categories: ['all', 'defi', 'nft', 'gaming', 'social', 'education'],
          sortOptions: ['recent', 'popular', 'trending']
        };
      case 'flames':
        return {
          contentTypes: ['all'],
          categories: ['all', 'defi', 'nft', 'gaming', 'sustainability', 'social', 'education'],
          sortOptions: ['market_cap', 'members', 'recent', 'price_change']
        };
      case 'reels':
        return {
          contentTypes: ['all'],
          categories: ['all', 'tutorial', 'demo', 'entertainment', 'educational'],
          sortOptions: ['recent', 'views', 'likes', 'trending']
        };
      case 'predictive':
        return {
          contentTypes: ['all'],
          categories: ['all', 'crypto', 'nft', 'gaming', 'climate', 'tech'],
          sortOptions: ['volume', 'participants', 'ending_soon', 'recent']
        };
      default:
        return {
          contentTypes: ['all'],
          categories: ['all'],
          sortOptions: ['recent']
        };
    }
  };

  const filterOptions = getFilterOptions();

  return (
    <div className="space-y-4">
      {/* Main Search Bar */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={getPlaceholderText()}
            className="w-full bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl pl-12 pr-20 py-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
          />
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
            {searchQuery && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={handleClearSearch}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-all duration-200 ${
                showFilters
                  ? 'bg-orange-500 text-white'
                  : 'bg-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              <Filter className="h-4 w-4" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Search Results Summary */}
      {isSearching && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between bg-slate-800/30 backdrop-blur-sm rounded-lg px-4 py-2 border border-slate-700/30"
        >
          <span className="text-slate-300 text-sm">
            Searching for "{searchQuery}" in {activeTab === 'main' ? 'Main Feed' : 
            activeTab === 'flames' ? 'Flames Ignited' : 
            activeTab === 'reels' ? 'Reels' : 'Predictive Plays'}
          </span>
          <button
            onClick={handleClearSearch}
            className="text-slate-400 hover:text-white text-sm transition-colors"
          >
            Clear
          </button>
        </motion.div>
      )}

      {/* Advanced Filters */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6"
        >
          <h3 className="text-white font-medium mb-4">Search Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Content Type Filter */}
            {filterOptions.contentTypes.length > 1 && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Content Type
                </label>
                <select
                  value={filters.contentType}
                  onChange={(e) => setFilters({ ...filters, contentType: e.target.value })}
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  {filterOptions.contentTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                {filterOptions.categories.map((category) => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Sort By
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                {filterOptions.sortOptions.map((option) => (
                  <option key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1).replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700/30">
            <button
              onClick={() => setFilters({ contentType: 'all', category: 'all', sortBy: 'recent' })}
              className="text-slate-400 hover:text-white text-sm transition-colors"
            >
              Reset Filters
            </button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFilters(false)}
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-all duration-200"
            >
              Apply Filters
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
};