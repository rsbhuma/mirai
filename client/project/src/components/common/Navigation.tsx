import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Flame, User, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { WalletButton } from '@/components/common/WalletButton';
import { useWallet } from '@solana/wallet-adapter-react';
import { SearchBar } from '@/components/common/SearchBar';

export const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { connected, disconnect } = useWallet();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Only show SearchBar on main pages (not /profile or /create)
  const showSearchBar = !['/profile', '/create'].includes(location.pathname);

  const handleProfileClick = () => {
    if (connected) {
      setDropdownOpen((open) => !open);
    } else {
      document.querySelector('.wallet-adapter-button-trigger')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }
  };

  const handleLogout = () => {
    disconnect();
    setDropdownOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="bg-gradient-to-r from-orange-500 to-red-500 p-2 rounded-lg"
            >
              <Flame className="h-6 w-6 text-white" />
            </motion.div>
            <span className="text-xl font-bold text-white">The Flame</span>
          </Link>

          {/* Centered SearchBar */}
          <div className="flex-1 flex justify-center">
            {showSearchBar && (
              <div className="w-full max-w-xl">
                <SearchBar
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  isSearching={isSearching}
                  setIsSearching={setIsSearching}
                  activeTab={"main"} // Always main for global search
                />
              </div>
            )}
          </div>

          {/* Profile/Wallet Icon on Right */}
          <div className="relative flex items-center">
            {!connected && <WalletButton />}
            {connected && (
              <>
                <button
                  onClick={handleProfileClick}
                  className="ml-2 flex items-center justify-center w-10 h-10 bg-slate-800 border border-slate-700 rounded-full text-white hover:bg-slate-700 hover:border-slate-600 transition-all duration-200 focus:outline-none"
                  title="Profile"
                >
                  <User className="h-5 w-5" />
                </button>
                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 top-12 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-[60]"
                    >
                      <div className="p-2">
                        <button
                          onClick={() => { setDropdownOpen(false); navigate('/profile'); }}
                          className="w-full flex items-center space-x-2 px-4 py-2 rounded-lg text-white hover:bg-slate-700 transition-colors"
                        >
                          <User className="h-4 w-4" />
                          <span>Profile</span>
                        </button>
                        <button
                          onClick={() => { setDropdownOpen(false); navigate('/settings'); }}
                          className="w-full flex items-center space-x-2 px-4 py-2 rounded-lg text-white hover:bg-slate-700 transition-colors"
                        >
                          <span className="h-4 w-4 inline-block">⚙️</span>
                          <span>Settings</span>
                        </button>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center space-x-2 px-4 py-2 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors mt-1"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                {dropdownOpen && (
                  <div
                    className="fixed inset-0 z-[50]"
                    onClick={() => setDropdownOpen(false)}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};