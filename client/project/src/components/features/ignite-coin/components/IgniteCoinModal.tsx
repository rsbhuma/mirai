import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Flame, DollarSign, Users, Zap, AlertCircle } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useCoinCreation } from '@/hooks/useCoinCreation';
import { useIgniteCoin } from '@/hooks/useIgniteCoin';

interface IgniteCoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  postData: {
    id: string;
    title: string;
    description: string;
    creator: string;
  };
}

export const IgniteCoinModal: React.FC<IgniteCoinModalProps> = ({
  isOpen,
  onClose,
  postData
}) => {
  const { connected, publicKey } = useWallet();
  const { createCoin } = useCoinCreation();
  const { igniteCoin } = useIgniteCoin();

  const [formData, setFormData] = useState({
    symbol: '',
    iconUrl: '',
    liquidityAmount: 1,
  });

  const [step, setStep] = useState<'setup' | 'confirm' | 'creating' | 'success' | 'error'>('setup');
  const [result, setResult] = useState<{ signature?: string; coinAddress?: string; error?: string }>({});
  const [toast, setToast] = useState<{ message: string; link?: string } | null>(null);

  // Toast auto-dismiss (must be at top level, not inside render/conditional)
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'symbol' ? value.toUpperCase() :
        name === 'liquidityAmount' ? parseFloat(value) || 0 : value
    }));
  };

  const handleIgniteCoin = async () => {
    if (!connected || !publicKey) {
      alert('Please ensure your wallet is connected and ready');
      return;
    }
    setStep('creating');
    try {
      const result = await igniteCoin({
        amountSol: formData.liquidityAmount,
        postId: postData.id,
        title: postData.title,
        description: postData.description,
        symbol: formData.symbol,
        iconUrl: formData.iconUrl,
      });
      setResult({ signature: result.txSignature, coinAddress: result.mintAddress });
      setStep('success');
      // Print transaction and show toast
      if (result.txSignature) {
        console.log('Transaction Signature:', result.txSignature);
        setToast({
          message: 'Coin ignited! View on Solana Explorer',
          link: `https://explorer.solana.com/tx/${result.txSignature}?cluster=devnet`,
        });
      }
    } catch (e: any) {
      setResult({ error: e.message || 'Unknown error' });
      setStep('error');
    }
  };

  const resetModal = () => {
    setStep('setup');
    setResult({});
    setFormData({
      symbol: '',
      iconUrl: '',
      liquidityAmount: 1,
    });
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  console.log("COIN MOD ", connected, publicKey);
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative bg-slate-800 rounded-xl border border-slate-700 p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 p-2 rounded-lg">
                <Flame className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">Ignite Coin</h2>
            </div>
            <button
              onClick={handleClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content based on step */}
          {step === 'setup' && (
            <div className="space-y-6">
              {/* Post Info */}
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
                <h3 className="text-white font-medium mb-2">Creating coin for:</h3>
                <p className="text-slate-300 text-sm font-medium">{postData.title}</p>
                <p className="text-slate-400 text-xs mt-1">by {postData.creator}</p>
              </div>

              {/* Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Token Symbol *
                  </label>
                  <input
                    type="text"
                    name="symbol"
                    value={formData.symbol}
                    onChange={handleInputChange}
                    placeholder="e.g., FLAME"
                    maxLength={10}
                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Token Icon URL (Optional)
                  </label>
                  <input
                    type="url"
                    name="iconUrl"
                    value={formData.iconUrl}
                    onChange={handleInputChange}
                    placeholder="https://example.com/icon.png"
                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  <p className="text-slate-500 text-xs mt-1">
                    Provide a URL to an image for your token icon
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Initial Liquidity (SOL)
                  </label>
                  <input
                    type="number"
                    name="liquidityAmount"
                    value={formData.liquidityAmount}
                    onChange={handleInputChange}
                    min="0.1"
                    step="0.1"
                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
                <h4 className="text-white font-medium mb-3">Cost Breakdown</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Token Creation</span>
                    <span className="text-white">0.01 SOL</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Metadata Storage</span>
                    <span className="text-white">0.005 SOL</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Initial Liquidity</span>
                    <span className="text-white">{formData.liquidityAmount} SOL</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-700/30 pt-2 font-medium">
                    <span className="text-white">Total</span>
                    <span className="text-orange-400">{(0.015 + formData.liquidityAmount).toFixed(3)} SOL</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={handleClose}
                  className="flex-1 bg-slate-700 text-white py-3 px-4 rounded-lg font-medium hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleIgniteCoin}
                  disabled={!formData.symbol.trim() || !connected}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-4 rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Ignite Coin
                </motion.button>
              </div>
            </div>
          )}

          {step === 'creating' && (
            <div className="text-center py-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="bg-gradient-to-r from-orange-500 to-red-500 p-4 rounded-full w-16 h-16 mx-auto mb-4"
              >
                <Zap className="h-8 w-8 text-white" />
              </motion.div>
              <h3 className="text-xl font-bold text-white mb-2">Creating Your Coin</h3>
              <p className="text-slate-400">Please confirm the transaction in your wallet...</p>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-8">
              <div className="bg-green-500/20 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Flame className="h-8 w-8 text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Coin Ignited Successfully!</h3>
              <p className="text-slate-400 mb-4">Your coin has been created and is now live</p>

              {result.coinAddress && (
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30 mb-4">
                  <p className="text-slate-300 text-sm mb-2">Coin Address:</p>
                  <p className="text-white font-mono text-xs break-all">{result.coinAddress}</p>
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleClose}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 px-4 rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 transition-all duration-200"
              >
                View Community
              </motion.button>
            </div>
          )}

          {step === 'error' && (
            <div className="text-center py-8">
              <div className="bg-red-500/20 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Creation Failed</h3>
              <p className="text-slate-400 mb-4">{result.error}</p>

              <div className="flex space-x-3">
                <button
                  onClick={handleClose}
                  className="flex-1 bg-slate-700 text-white py-3 px-4 rounded-lg font-medium hover:bg-slate-600 transition-colors"
                >
                  Close
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStep('setup')}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-4 rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-all duration-200"
                >
                  Try Again
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
      {/* Toast UI */}
      {toast && (
        <div className="fixed bottom-6 left-6 z-[100] px-6 py-3 rounded-lg shadow-lg flex items-center space-x-4 bg-green-600 text-white animate-fade-in">
          <span>
            {toast.link ? (
              <a href={toast.link} target="_blank" rel="noopener noreferrer" className="underline font-medium">{toast.message}</a>
            ) : toast.message}
          </span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 text-white/80 hover:text-white text-lg font-bold focus:outline-none"
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      )}
    </AnimatePresence>
  );
};