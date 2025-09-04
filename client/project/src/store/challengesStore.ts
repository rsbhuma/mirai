import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Challenge } from '../types';

interface ChallengesState {
    challenges: Challenge[];
    setChallenges: (challenges: Challenge[]) => void;
}

export const useChallengesStore = create<ChallengesState>()(
    persist(
        (set) => ({
            challenges: [],
            setChallenges: (challenges) => set({ challenges }),
        }),
        {
            name: 'meme-world-challenges',
        }
    )
); 