import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as api from '@/api';
import { CoinData } from './coinStore';
import { mockFlamesData } from '@/data';
import { transformFlameToCoin } from '@/api/transformers/flameTransformer';

const transformedMockData: CoinData[] = mockFlamesData.map(transformFlameToCoin);

interface CommunitiesState {
  communities: CoinData[];
  loading: boolean;
  error: string | null;
  fetchCommunities: () => Promise<void>;
}

export const useCommunitiesStore = create<CommunitiesState>()(
  persist(
    (set) => ({
      communities: [],
      loading: false,
      error: null,
      fetchCommunities: async () => {
        set({ loading: true, error: null });
        try {
          const response = await api.getTokens({ limit: 10 });
          if (response && response.tokens) {
            set({ communities: response.tokens, loading: false });
          } else {
            set({ communities: transformedMockData, loading: false });
          }
        } catch (error) {
          console.error('Failed to fetch communities:', error);
          set({ 
            error: 'Failed to fetch communities. Using mock data as fallback.', 
            loading: false,
            communities: transformedMockData
          });
        }
      },
    }),
    {
      name: 'meme-world-communities',
    }
  )
); 