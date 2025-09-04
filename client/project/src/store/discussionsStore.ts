import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Discussion } from '../types';

interface DiscussionsState {
    discussions: Discussion[];
    setDiscussions: (discussions: Discussion[]) => void;
}

export const useDiscussionsStore = create<DiscussionsState>()(
    persist(
        (set) => ({
            discussions: [],
            setDiscussions: (discussions) => set({ discussions }),
        }),
        {
            name: 'meme-world-discussions',
        }
    )
); 