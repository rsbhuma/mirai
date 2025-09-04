// Post / Feed Item
export interface FeedItem {
    id: string;
    creator: {
        name: string;
        avatar: string;
        wallet: string;
    };
    content: {
        type: 'text' | 'image' | 'video' | 'link';
        title: string;
        description: string;
        media?: string;
        url?: string;
    };
    vision: string;
    socialLinks: {
        twitter?: string;
        discord?: string;
        github?: string;
    };
    timestamp: string;
    comments: number;
    likes: number;
    isLiked?: boolean;
    coinData?: CoinData;
}

// Comment
export interface Comment {
    id: string;
    author: {
        name: string;
        avatar: string;
        wallet: string;
    };
    content: string;
    timestamp: string;
    likes: number;
    isLiked?: boolean;
    replies?: Comment[];
}

// Content Creation Form Data
export interface CreateContentFormData {
    title: string;
    description: string;
    vision: string;
    twitter: string;
    discord: string;
    github: string;
    mediaUrl: string;
}

export type ContentType = 'text' | 'image' | 'video' | 'link';

// Coin / Community / Token
export interface CoinData {
    name: string;
    symbol: string;
    image: string;
    description: string;
    creator: string;
    price: number;
    marketCap: number;
    members: number;
    change24h: number;
}

export interface Community extends CoinData {
    id: string;
    category: string;
}

// Reel
export interface ReelData {
    id: string;
    title: string;
    creator: string;
    thumbnail: string;
    views: string;
    likes: number;
    comments: number;
    community: string;
    duration: string;
}

// Token Creation
export interface CoinCreationParams {
    postId: string;
    title: string;
    description: string;
    symbol: string;
    iconUrl?: string;
}
export interface CoinCreationResult {
    success: boolean;
    coinAddress?: string;
    transactionSignature?: string;
    error?: string;
}

// Discussion
export interface Discussion {
    id: string;
    title: string;
    content: string;
    author: {
        name: string;
        avatar: string;
        isStacker: boolean;
    };
    timestamp: string;
    replies: number;
    likes: number;
    isPinned: boolean;
    media?: string;
}

// Challenge
export interface Challenge {
    id: string;
    title: string;
    description: string;
    creator: string;
    targetPrize: number;
    currentPrize: number;
    participants: number;
    deadline: string;
    status: 'proposal' | 'active' | 'completed';
    submissions?: number;
    winner?: string;
}

// Stacker
export interface Stacker {
    id: string;
    name: string;
    avatar: string;
    wallet: string;
    stakedAmount: number;
    joinDate: string;
    reputation: number;
    badges: string[];
    isOnline: boolean;
}

// Chat Message
export interface ChatMessage {
    id: string;
    author: {
        name: string;
        avatar: string;
        isStacker: boolean;
    };
    content: string;
    timestamp: string;
    type: 'text' | 'image' | 'system';
}

// Reward
export interface Reward {
    id: string;
    type: 'referral' | 'challenge';
    title: string;
    amount: number;
    date: string;
    status: 'pending' | 'ready' | 'claimed';
    description: string;
}

// Prediction Market
export interface PredictionMarket {
    id: string;
    title: string;
    description: string;
    category: string;
    totalVolume: number;
    participants: number;
    endDate: string;
    options: {
        id: string;
        text: string;
        probability: number;
        volume: number;
    }[];
    image: string;
} 