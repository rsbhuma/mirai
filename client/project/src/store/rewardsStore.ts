import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Reward } from '../types';

interface RewardsState {
    rewards: Reward[];
    setRewards: (rewards: Reward[]) => void;
}

export const useRewardsStore = create<RewardsState>()(
    persist(
        (set) => ({
            rewards: [],
            setRewards: (rewards) => set({ rewards }),
        }),
        {
            name: 'meme-world-rewards',
        }
    )
); 