import { config } from '@/config/config';

// Generic API Layer (singleton)
// Usage: import { client } from './client';
// client.get('/path'), client.post('/path', data), etc.

export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

class Api {
    baseUrl: string;
    constructor(baseUrl = '') {
        this.baseUrl = baseUrl;
    }

    async request<T>(path: string, method: ApiMethod = 'GET', body?: any, options: RequestInit = {}): Promise<T> {
        const url = this.baseUrl + path;
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        };
        const fetchOptions: RequestInit = {
            method,
            headers,
            credentials: 'include', // Include cookies with requests
            ...options,
        };
        if (body) {
            fetchOptions.body = JSON.stringify(body);
        }
        const res = await fetch(url, fetchOptions);
        if (!res.ok) {
            let errorMsg = `API error: ${res.status}`;
            try {
                const err = await res.json();
                errorMsg = err.message || errorMsg;
            } catch { }
            throw new Error(errorMsg);
        }
        return res.json();
    }

    get<T>(path: string, options?: RequestInit) {
        return this.request<T>(path, 'GET', undefined, options);
    }
    post<T>(path: string, body: any, options?: RequestInit) {
        return this.request<T>(path, 'POST', body, options);
    }
    put<T>(path: string, body: any, options?: RequestInit) {
        return this.request<T>(path, 'PUT', body, options);
    }
    delete<T>(path: string, options?: RequestInit) {
        return this.request<T>(path, 'DELETE', undefined, options);
    }
}

// Export a singleton API instance
export const client = new Api(config.apiBaseUrl); 