// Generic WebSocket Layer (singleton)
// Usage:
// import { ws } from './ws';
// ws.subscribe('topic', callback); ws.unsubscribe('topic', callback);

export type WSMessage = { topic: string; payload: any };

type Callback = (payload: any) => void;

class WebSocketManager {
    private static instance: WebSocketManager;
    private ws: WebSocket | null = null;
    private url: string;
    private subscribers: Map<string, Set<Callback>> = new Map();
    private isConnected = false;
    private queue: WSMessage[] = [];

    private constructor(url: string) {
        this.url = url;
        this.connect();
    }

    static getInstance(url = 'ws://localhost:8080/ws') {
        if (!WebSocketManager.instance) {
            WebSocketManager.instance = new WebSocketManager(url);
        }
        return WebSocketManager.instance;
    }

    private connect() {
        this.ws = new WebSocket(this.url);
        this.ws.onopen = () => {
            this.isConnected = true;
            // Flush queue
            while (this.queue.length > 0) {
                const msg = this.queue.shift();
                if (msg) this.send(msg.topic, msg.payload);
            }
        };
        this.ws.onmessage = (event) => {
            try {
                const data: WSMessage = JSON.parse(event.data);
                const subs = this.subscribers.get(data.topic);
                if (subs) {
                    subs.forEach(cb => cb(data.payload));
                }
            } catch (e) {
                // Ignore malformed messages
            }
        };
        this.ws.onclose = () => {
            this.isConnected = false;
            // Try to reconnect after a delay
            setTimeout(() => this.connect(), 2000);
        };
        this.ws.onerror = () => {
            this.ws?.close();
        };
    }

    subscribe(topic: string, callback: Callback) {
        if (!this.subscribers.has(topic)) {
            this.subscribers.set(topic, new Set());
        }
        this.subscribers.get(topic)!.add(callback);
    }

    unsubscribe(topic: string, callback: Callback) {
        const subs = this.subscribers.get(topic);
        if (subs) {
            subs.delete(callback);
            if (subs.size === 0) {
                this.subscribers.delete(topic);
            }
        }
    }

    send(topic: string, payload: any) {
        const msg = JSON.stringify({ topic, payload });
        if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(msg);
        } else {
            // Queue if not connected
            this.queue.push({ topic, payload });
        }
    }
}

// Export a singleton WebSocket manager
export const ws = WebSocketManager.getInstance(/* optionally set ws url here */); 