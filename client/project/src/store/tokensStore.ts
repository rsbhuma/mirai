import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CoinData } from '../types';

interface TokensState {
    tokens: CoinData[];
    setTokens: (tokens: CoinData[]) => void;
}

export const useTokensStore = create<TokensState>()(
    persist(
        (set) => ({
            tokens: [],
            setTokens: (tokens) => set({ tokens }),
        }),
        {
            name: 'meme-world-tokens',
        }
    )
); 