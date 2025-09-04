import { useWallet } from '@solana/wallet-adapter-react';
import { useMemo } from 'react';
import { Connection, Keypair, PublicKey, clusterApiUrl } from '@solana/web3.js';

export const useWalletInfo = () => {
  const { wallet, publicKey, connected, connecting, disconnecting } = useWallet();

  const walletInfo = useMemo(() => {
    if (!connected || !publicKey) {
      return {
        connected: false,
        address: null,
        shortAddress: null,
        walletName: null,
        walletIcon: null,
      };
    }

    const address = publicKey.toString();
    const shortAddress = `${address.slice(0, 4)}...${address.slice(-4)}`;

    return {
      connected: true,
      address,
      shortAddress,
      walletName: wallet?.adapter.name || 'Unknown',
      walletIcon: wallet?.adapter.icon || null,
      connecting,
      disconnecting,
    };
  }, [wallet, publicKey, connected, connecting, disconnecting]);

  return walletInfo;
};

// Utility: Load a local wallet from custom_keys/wallets/user.json and connect to a given Solana URL
export async function loginLocalWallet(localUrl: string = 'http://localhost:8899') {
  // Dynamically import the user keypair
  const keyArray: number[] = (await import('@/custom_keys/wallets/user.json')).default;
  const secret = Uint8Array.from(keyArray);
  const keypair = Keypair.fromSecretKey(secret);
  const connection = new Connection(localUrl, 'confirmed');
  return { connection, keypair };
}