import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
    token: string | null;
    userId: string | null;
    isAuthenticated: boolean;
    setAuth: (token: string, userId: string) => void;
    clearAuth: () => void;
}

export const useAuthStore = create(
    persist<AuthState>(
        (set) => ({
            token: null,
            userId: null,
            isAuthenticated: false,
            setAuth: (token, userId) => set({ token, userId, isAuthenticated: true }),
            clearAuth: () => set({ token: null, userId: null, isAuthenticated: false }),
        }),
        {
            name: 'auth-storage',
        }
    )
); 