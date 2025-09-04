import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as api from '@/api';
import { ReelData, mockReelsData } from '@/data';

interface ReelsState {
  reels: ReelData[];
  loading: boolean;
  error: string | null;
  fetchReels: () => Promise<void>;
}

export const useReelsStore = create<ReelsState>()(
  persist(
    (set) => ({
      reels: [],
      loading: false,
      error: null,
      fetchReels: async () => {
        set({ loading: true, error: null });
        try {
          // Since there's no direct reels endpoint, we'll use mock data for now
          // In a real implementation, you might have a dedicated reels API endpoint
          set({ reels: mockReelsData, loading: false });
        } catch (error) {
          console.error('Failed to fetch reels:', error);
          set({ 
            error: 'Failed to fetch reels. Using mock data as fallback.', 
            loading: false,
            reels: mockReelsData 
          });
        }
      },
    }),
    {
      name: 'meme-world-reels',
    }
  )
); 