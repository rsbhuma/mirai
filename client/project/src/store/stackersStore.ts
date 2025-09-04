import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Stacker } from '../types';

interface StackersState {
    stackers: Stacker[];
    setStackers: (stackers: Stacker[]) => void;
}

export const useStackersStore = create<StackersState>()(
    persist(
        (set) => ({
            stackers: [],
            setStackers: (stackers) => set({ stackers }),
        }),
        {
            name: 'meme-world-stackers',
        }
    )
); 