// src/config/config.ts

// Use import.meta.env for environment variables in Vite
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const config = {
  apiBaseUrl: API_BASE_URL,
}; 