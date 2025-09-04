// Centralized types for mock data to avoid circular dependencies

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
  coinData?: {
    symbol: string;
    price: number;
    marketCap: number;
    members: number;
    change24h: number;
  };
}

export interface FlameData {
  id: string;
  name: string;
  symbol: string;
  description: string;
  image: string;
  price: number;
  marketCap: number;
  members: number;
  change24h: number;
  category: string;
}

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

export interface Discussion {
  id: string;
  title: string;
  content: string;
  author: {
    name: string;
    avatar: string;
    isStacker: boolean; // Changed from isVerified to isStacker
  };
  timestamp: string;
  replies: number;
  likes: number;
  isPinned: boolean; // Made required to match coinStore
  media?: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  creator: string;
  targetPrize: number;
  currentPrize: number;
  participants: number;
  deadline: string;
  status: 'proposal' | 'active' | 'completed'; // Removed 'cancelled' to match coinStore
  winner?: string;
}

export interface Reward {
  id: string;
  type: 'referral' | 'challenge';
  title: string;
  description: string;
  amount: number;
  token: string;
  status: 'pending' | 'ready' | 'claimed'; // Changed 'expired' to 'ready' to match coinStore
  date: string; // Added date field to match coinStore (renamed from expiresAt)
}

export interface Stacker {
  id: string;
  name: string;
  avatar: string;
  wallet: string; // Added wallet field
  stackedAmount: number;
  stakedAmount: number; // Added stakedAmount field (duplicate for compatibility)
  stakingRewards: number;
  joinDate: string;
  badges: string[];
  rank: number;
  reputation: number; // Added reputation field
  isOnline: boolean;
}

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