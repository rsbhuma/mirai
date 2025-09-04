import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatMessage } from '../types';

interface ChatState {
    chatMessages: ChatMessage[];
    setChatMessages: (messages: ChatMessage[]) => void;
}

export const useChatStore = create<ChatState>()(
    persist(
        (set) => ({
            chatMessages: [],
            setChatMessages: (chatMessages) => set({ chatMessages }),
        }),
        {
            name: 'meme-world-chat',
        }
    )
); 