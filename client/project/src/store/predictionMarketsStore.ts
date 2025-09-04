import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as api from '@/api';
import { PredictionMarket, mockPredictionsData } from '@/data';

interface PredictionMarketsState {
  predictionMarkets: PredictionMarket[];
  loading: boolean;
  error: string | null;
  fetchPredictionMarkets: () => Promise<void>;
}

export const usePredictionMarketsStore = create<PredictionMarketsState>()(
  persist(
    (set) => ({
      predictionMarkets: [],
      loading: false,
      error: null,
      fetchPredictionMarkets: async () => {
        set({ loading: true, error: null });
        try {
          // Since there's no direct prediction markets endpoint, we'll use mock data for now
          // In a real implementation, you might have a dedicated prediction markets API endpoint
          set({ predictionMarkets: mockPredictionsData, loading: false });
        } catch (error) {
          console.error('Failed to fetch prediction markets:', error);
          set({ 
            error: 'Failed to fetch prediction markets. Using mock data as fallback.', 
            loading: false,
            predictionMarkets: mockPredictionsData 
          });
        }
      },
    }),
    {
      name: 'meme-world-prediction-markets',
    }
  )
); 