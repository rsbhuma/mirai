import React, { ReactNode, useEffect, useState, useRef } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  PhantomWalletAdapter,
  TorusWalletAdapter,
  LedgerWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import { LocalWalletAdapter } from '@/wallets/LocalWalletAdapter';

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

const ENABLE_LOCAL_WALLET = true; // Set to false to remove local wallet

interface WalletContextProviderProps {
  children: ReactNode;
}

const DEFAULT_ENDPOINT = clusterApiUrl(WalletAdapterNetwork.Devnet);

export const WalletContextProvider: React.FC<WalletContextProviderProps> = ({ children }) => {
  const [endpoint, setEndpoint] = useState<string>(() => {
    return localStorage.getItem('solana-network') || DEFAULT_ENDPOINT;
  });
  const [toast, setToast] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
  const lastEndpoint = useRef(endpoint);
  const lastError = useRef(false);

  // Show toast for 3s (error) or 2s (success)
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), toast.type === 'success' ? 2000 : 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  useEffect(() => {
    const handleStorage = () => {
      const stored = localStorage.getItem('solana-network') || DEFAULT_ENDPOINT;
      setEndpoint(stored);
    };
    window.addEventListener('storage', handleStorage);
    // Also check on mount in case user changed in another tab
    handleStorage();
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Also update endpoint if user changes it in this tab
  useEffect(() => {
    const interval = setInterval(() => {
      const stored = localStorage.getItem('solana-network') || DEFAULT_ENDPOINT;
      if (stored !== endpoint) setEndpoint(stored);
    }, 1000);
    return () => clearInterval(interval);
  }, [endpoint]);

  // Check if endpoint is valid and supported
  useEffect(() => {
    let cancelled = false;
    const checkNetwork = async () => {
      try {
        // Try to fetch the version from the endpoint
        const url = endpoint.replace(/\/$/, '');
        const res = await fetch(url + '/health', { method: 'GET' });
        if (!res.ok) {
          throw new Error('Network not healthy or not supported');
        }
        // Only show success if previously errored or endpoint changed
        if (lastError.current || lastEndpoint.current !== endpoint) {
          setToast({ type: 'success', message: 'Connected to Solana network!' });
        }
        lastError.current = false;
        lastEndpoint.current = endpoint;
      } catch (e: any) {
        if (!cancelled) {
          setToast({ type: 'error', message: `Network error: ${e.message || 'Unknown error'}` });
          lastError.current = true;
        }
      }
    };
    checkNetwork();
    return () => { cancelled = true; };
  }, [endpoint]);

  // Configure supported wallets - Local wallet first to avoid phantom as default
  const wallets = [
    ...(ENABLE_LOCAL_WALLET ? [new LocalWalletAdapter()] : []),
    new TorusWalletAdapter(),
    new LedgerWalletAdapter(),
    new PhantomWalletAdapter(),
    // new SolflareWalletAdapter(),
  ];

  return (
    <>
      {toast && (
        <div className={`fixed bottom-6 left-6 z-[100] px-6 py-3 rounded-lg shadow-lg flex items-center space-x-4 animate-fade-in ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 text-white/80 hover:text-white text-lg font-bold focus:outline-none"
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      )}
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect={false}>
          <WalletModalProvider>
            {children}
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </>
  );
};