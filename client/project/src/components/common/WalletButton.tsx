import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { motion } from 'framer-motion';
import { Wallet, ChevronDown, Copy, LogOut } from 'lucide-react';
import { useState } from 'react';

export const WalletButton: React.FC = () => {
  const { wallet, publicKey, disconnect, connected, wallets, select, ready } = useWallet();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const handleWalletSelect = (walletName: string) => {
    if (!ready) return;
    const selectedWallet = wallets.find(w => w.adapter.name === walletName);
    if (selectedWallet) {
      select(selectedWallet.adapter.name);
    }
    setIsDropdownOpen(false);
  };

  if (!connected || !publicKey) {
    return (
      <div className="wallet-adapter-button-trigger">
        <WalletMultiButton className="!bg-gradient-to-r !from-orange-500 !to-red-500 !text-white !px-4 !py-2 !rounded-lg !font-medium hover:!from-orange-600 hover:!to-red-600 !transition-all !duration-200 !border-none !text-sm !min-h-0 flex items-center space-x-2">
          <Wallet className="h-4 w-4" />
          Select Wallet
        </WalletMultiButton>
      </div>
    );
  }

  const copyAddress = () => {
    navigator.clipboard.writeText(publicKey.toString());
  };

  return (
    <div className="flex items-center" style={{ gap: '2px' }}>
      {/* Wallet Display Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.95 }}
        onClick={copyAddress}
        className="flex items-center space-x-2 bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg text-white hover:bg-slate-700 hover:border-slate-600 transition-all duration-200"
        title="Click to copy address"
      >
        {wallet?.adapter.icon ? (
          <img
            src={wallet.adapter.icon}
            alt={wallet.adapter.name}
            className="w-5 h-5 rounded-full"
          />
        ) : (
          <Wallet className="h-5 w-5 text-slate-400" />
        )}
        <span className="text-sm font-medium">{formatAddress(publicKey.toString())}</span>
        <Copy className="h-3 w-3 text-slate-400" />
      </motion.button>

      {/* Wallet Selection Button */}
      <div className="relative">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center justify-center w-10 h-10 bg-slate-800 border border-slate-700 rounded-lg text-white hover:bg-slate-700 hover:border-slate-600 transition-all duration-200"
            title="Change wallet"
          >
            <motion.div
              animate={{ rotate: isDropdownOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </motion.div>
          </button>
        </motion.div>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 top-full mt-2 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-[60]"
          >
            <div className="p-4">
              <div className="text-white font-medium mb-3">Available Wallets</div>
              <div className="space-y-2">
                {wallets.map((availableWallet) => (
                  <motion.button
                    key={availableWallet.adapter.name}
                    disabled={!ready}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleWalletSelect(availableWallet.adapter.name)}
                    className={`w-full flex items-center space-x-3 p-3 rounded-lg border transition-all duration-200 ${!ready
                      ? 'opacity-50 cursor-not-allowed bg-slate-900/30 border-slate-700/30 text-slate-500'
                      :
                      wallet?.adapter.name === availableWallet.adapter.name
                        ? 'bg-orange-500/20 border-orange-500/50 text-orange-400'
                        : 'bg-slate-900/50 border-slate-700/50 text-white hover:bg-slate-700/50 hover:border-slate-600'
                      }`}
                  >
                    <img
                      src={availableWallet.adapter.icon}
                      alt={availableWallet.adapter.name}
                      className="w-6 h-6 rounded-full"
                    />
                    <span className="font-medium">{availableWallet.adapter.name}</span>
                    {wallet?.adapter.name === availableWallet.adapter.name && (
                      <div className="ml-auto w-2 h-2 bg-orange-400 rounded-full"></div>
                    )}
                  </motion.button>
                ))}
              </div>

              {/* Disconnect Button */}
              <div className="mt-4 pt-3 border-t border-slate-700/50">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={!ready}
                  onClick={() => {
                    if (!ready) return;
                    disconnect();
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${!ready
                    ? 'opacity-50 cursor-not-allowed bg-red-500/10 text-red-300 border border-red-500/20'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                    }`}
                >
                  <LogOut className="h-4 w-4" />
                  <span>Disconnect</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Backdrop to close dropdown */}
        {isDropdownOpen && (
          <div
            className="fixed inset-0 z-[50]"
            onClick={() => setIsDropdownOpen(false)}
          />
        )}
      </div>
    </div>
  );
};