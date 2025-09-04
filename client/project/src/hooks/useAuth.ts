import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import * as api from '@/api';
import { useAuthStore } from '@/store/authStore';
import bs58 from 'bs58';

interface LoginResponse {
    token: string;
    user_id: string;
}

export const useAuth = () => {
    const { connected, publicKey, signMessage } = useWallet();
    const { setAuth, clearAuth, isAuthenticated } = useAuthStore();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const authenticate = async () => {
            if (connected && publicKey && signMessage) {
                setLoading(true);
                try {
                    const message = 'Login to Community Coin';
                    const encodedMessage = new TextEncoder().encode(message);
                    const signature = await signMessage(encodedMessage);

                    const response = (await api.login({
                        wallet_address: publicKey.toBase58(),
                        signature: bs58.encode(signature),
                        message,
                    })) as LoginResponse;
                    setAuth(response.token, response.user_id);
                } catch (error) {
                    console.error('Authentication failed:', error);
                    clearAuth();
                } finally {
                    setLoading(false);
                }
            }
        };

        const deauthenticate = async () => {
            setLoading(true);
            try {
                await api.logout();
            } catch (error) {
                console.error('Logout failed:', error);
            } finally {
                clearAuth();
                setLoading(false);
            }
        };

        if (connected) {
            authenticate();
        } else {
            if(isAuthenticated) {
                deauthenticate();
            }
        }
    }, [connected, publicKey, signMessage, isAuthenticated, setAuth, clearAuth]);

    return { isAuthenticated: useAuthStore((s) => s.isAuthenticated), loading };
}; 