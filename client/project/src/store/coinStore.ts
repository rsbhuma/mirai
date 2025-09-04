import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as api from '@/api';
import { 
  mockDiscussions, 
  mockChallenges, 
  mockRewards, 
  mockStackers, 
  mockMessages 
} from '@/data';

// Coin data interface
export interface CoinData {
  id: string;
  name: string;
  symbol: string;
  image: string;
  description: string;
  creator: string;
  price: number;
  marketCap: number;
  members: number;
  change24h: number;
  category: string;
  totalSupply: number;
  circulatingSupply: number;
  volume24h: number;
  allTimeHigh: number;
  allTimeLow: number;
  launchDate: string;
  socialLinks: {
    twitter?: string;
    discord?: string;
    website?: string;
    telegram?: string;
  };
  mint: string; // Added mint field
}

// Discussion interface
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

// Challenge interface
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

// Reward interface
export interface Reward {
  id: string;
  type: 'referral' | 'challenge';
  title: string;
  amount: number;
  date: string;
  status: 'pending' | 'ready' | 'claimed';
  description: string;
}

// Stacker interface
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

// Chat message interface
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

// Complete coin data with all related information
export interface CompleteCoinData {
  coin: CoinData;
  discussions: Discussion[];
  challenges: Challenge[];
  rewards: Reward[];
  stackers: Stacker[];
  chatMessages: ChatMessage[];
}

interface CoinState {
  // Cache for individual coins
  coinsCache: { [coinId: string]: CompleteCoinData };
  
  // Loading states
  loading: { [coinId: string]: boolean };
  error: { [coinId: string]: string | null };
  
  // Actions
  setCoinData: (coinId: string, data: CompleteCoinData) => void;
  setLoading: (coinId: string, loading: boolean) => void;
  setError: (coinId: string, error: string | null) => void;
  
  // API methods
  fetchCoinData: (coinId: string) => Promise<void>;
  fetchDiscussions: (coinId: string) => Promise<void>;
  fetchChallenges: (coinId: string) => Promise<void>;
  fetchRewards: (coinId: string) => Promise<void>;
  fetchStackers: (coinId: string) => Promise<void>;
  fetchChatMessages: (coinId: string) => Promise<void>;
  
  // Discussion methods
  createDiscussion: (coinId: string, discussion: Omit<Discussion, 'id' | 'timestamp' | 'replies' | 'likes' | 'isPinned'>) => Promise<void>;
  
  // Challenge methods
  createChallenge: (coinId: string, challenge: Omit<Challenge, 'id' | 'currentPrize' | 'participants' | 'status'>) => Promise<void>;
  
  // Chat methods
  addChatMessage: (coinId: string, message: ChatMessage) => void;
  sendChatMessage: (coinId: string, content: string, author: any) => Promise<void>;
  
  // Helper methods
  loadMockData: (coinId: string) => Promise<void>;
  getDefaultCoinData: (coinId: string) => CompleteCoinData;
}

export const useCoinStore = create<CoinState>()(
  persist(
    (set, get) => ({
      coinsCache: {},
      loading: {},
      error: {},
      
      setCoinData: (coinId, data) => set((state) => ({
        coinsCache: { ...state.coinsCache, [coinId]: data }
      })),
      
      setLoading: (coinId, loading) => set((state) => ({
        loading: { ...state.loading, [coinId]: loading }
      })),
      
      setError: (coinId, error) => set((state) => ({
        error: { ...state.error, [coinId]: error }
      })),
      
      fetchCoinData: async (coinId) => {
        const { setLoading, setError, setCoinData, coinsCache } = get();
        
        // Check if we already have the data
        if (coinsCache[coinId]) {
          return;
        }
        
        setLoading(coinId, true);
        setError(coinId, null);
        
        try {
          // Try to fetch complete coin data from API
          // This assumes a new endpoint that gets all data.
          // If that doesn't exist, we would call the individual functions.
          const coin = await api.getToken(coinId);

          if (coin) {
            // If we get the main coin, fetch the rest.
            // This could be combined into a single API call if the backend supports it.
            const [discussions, challenges, rewards, stackers, chatMessages] = await Promise.all([
              api.getDiscussions(coinId).catch(() => []),
              api.getChallenges(coinId).catch(() => []),
              api.getRewards(coinId).catch(() => []), // Assuming getRewards exists
              api.getStackers(coinId).catch(() => []), // Assuming getStackers exists
              api.getChatMessages(coinId).catch(() => []), // Assuming getChatMessages exists
            ]);

            setCoinData(coinId, { coin, discussions, challenges, rewards, stackers, chatMessages });
          } else {
            // Fallback to mock data
            await get().loadMockData(coinId);
          }
        } catch (error) {
          console.warn(`Failed to fetch coin data for ${coinId}, using mock data:`, error);
          // Fallback to mock data
          await get().loadMockData(coinId);
        } finally {
          setLoading(coinId, false);
        }
      },
      
      fetchDiscussions: async (coinId) => {
        const { setLoading, setError, coinsCache, setCoinData } = get();
        
        setLoading(coinId, true);
        setError(coinId, null);
        
        try {
          const response = await api.getDiscussions(coinId);
          
          if (response) {
            const currentData = coinsCache[coinId] || get().getDefaultCoinData(coinId);
            setCoinData(coinId, { ...currentData, discussions: response });
          } else {
            // Load mock discussions
            const currentData = coinsCache[coinId] || get().getDefaultCoinData(coinId);
            setCoinData(coinId, { ...currentData, discussions: mockDiscussions });
          }
        } catch (error) {
          console.warn(`Failed to fetch discussions for ${coinId}, using mock data:`, error);
          const currentData = coinsCache[coinId] || get().getDefaultCoinData(coinId);
          setCoinData(coinId, { ...currentData, discussions: mockDiscussions });
        } finally {
          setLoading(coinId, false);
        }
      },
      
      fetchChallenges: async (coinId) => {
        const { setLoading, setError, coinsCache, setCoinData } = get();
        
        setLoading(coinId, true);
        setError(coinId, null);
        
        try {
          const response = await api.getChallenges(coinId);
          
          if (response) {
            const currentData = coinsCache[coinId] || get().getDefaultCoinData(coinId);
            setCoinData(coinId, { ...currentData, challenges: response });
          } else {
            // Load mock challenges
            const currentData = coinsCache[coinId] || get().getDefaultCoinData(coinId);
            setCoinData(coinId, { ...currentData, challenges: mockChallenges });
          }
        } catch (error) {
          console.warn(`Failed to fetch challenges for ${coinId}, using mock data:`, error);
          const currentData = coinsCache[coinId] || get().getDefaultCoinData(coinId);
          setCoinData(coinId, { ...currentData, challenges: mockChallenges });
        } finally {
          setLoading(coinId, false);
        }
      },
      
      fetchRewards: async (coinId) => {
        const { setLoading, setError, coinsCache, setCoinData } = get();
        
        setLoading(coinId, true);
        setError(coinId, null);
        
        try {
          const response = await api.getRewards(coinId); // Assumes getRewards exists
          
          if (response) {
            const currentData = coinsCache[coinId] || get().getDefaultCoinData(coinId);
            setCoinData(coinId, { ...currentData, rewards: response });
          } else {
            // Load mock rewards
            const currentData = coinsCache[coinId] || get().getDefaultCoinData(coinId);
            setCoinData(coinId, { ...currentData, rewards: mockRewards });
          }
        } catch (error) {
          console.warn(`Failed to fetch rewards for ${coinId}, using mock data:`, error);
          const currentData = coinsCache[coinId] || get().getDefaultCoinData(coinId);
          setCoinData(coinId, { ...currentData, rewards: mockRewards });
        } finally {
          setLoading(coinId, false);
        }
      },
      
      fetchStackers: async (coinId) => {
        const { setLoading, setError, coinsCache, setCoinData } = get();
        
        setLoading(coinId, true);
        setError(coinId, null);
        
        try {
          const response = await api.getStackers(coinId); // Assumes getStackers exists
          
          if (response) {
            const currentData = coinsCache[coinId] || get().getDefaultCoinData(coinId);
            setCoinData(coinId, { ...currentData, stackers: response });
          } else {
            // Load mock stackers
            const currentData = coinsCache[coinId] || get().getDefaultCoinData(coinId);
            setCoinData(coinId, { ...currentData, stackers: mockStackers });
          }
        } catch (error) {
          console.warn(`Failed to fetch stackers for ${coinId}, using mock data:`, error);
          const currentData = coinsCache[coinId] || get().getDefaultCoinData(coinId);
          setCoinData(coinId, { ...currentData, stackers: mockStackers });
        } finally {
          setLoading(coinId, false);
        }
      },
      
      fetchChatMessages: async (coinId) => {
        const { setLoading, setError, coinsCache, setCoinData } = get();
        
        setLoading(coinId, true);
        setError(coinId, null);
        
        try {
          const response = await api.getChatMessages(coinId); // Assumes getChatMessages exists
          
          if (response) {
            const currentData = coinsCache[coinId] || get().getDefaultCoinData(coinId);
            setCoinData(coinId, { ...currentData, chatMessages: response });
          } else {
            // Load mock chat messages
            const currentData = coinsCache[coinId] || get().getDefaultCoinData(coinId);
            setCoinData(coinId, { ...currentData, chatMessages: mockMessages });
          }
        } catch (error) {
          console.warn(`Failed to fetch chat messages for ${coinId}, using mock data:`, error);
          const currentData = coinsCache[coinId] || get().getDefaultCoinData(coinId);
          setCoinData(coinId, { ...currentData, chatMessages: mockMessages });
        } finally {
          setLoading(coinId, false);
        }
      },
      
      addChatMessage: (coinId, message) => {
        const { coinsCache, setCoinData } = get();
        const currentData = coinsCache[coinId];
        
        if (currentData) {
          setCoinData(coinId, {
            ...currentData,
            chatMessages: [...currentData.chatMessages, message]
          });
        }
      },
      
      createDiscussion: async (coinId, discussionData) => {
        const { coinsCache, setCoinData } = get();
        
        // Create the discussion object with generated fields
        const newDiscussion: Discussion = {
          id: `${coinId}-discussion-${Date.now()}`,
          title: discussionData.title,
          content: discussionData.content,
          author: discussionData.author,
          timestamp: new Date().toISOString(),
          replies: 0,
          likes: 0,
          isPinned: false,
          media: discussionData.media
        };
        
        // Add to local state immediately (optimistic update)
        const currentData = coinsCache[coinId];
        if (currentData) {
          setCoinData(coinId, {
            ...currentData,
            discussions: [newDiscussion, ...currentData.discussions]
          });
        }
        
        try {
          // Send to API
          const response = await api.createDiscussion(coinId, {
            title: discussionData.title,
            content: discussionData.content,
            author: discussionData.author,
            media: discussionData.media
          });
          
          // Update with server response if different
          if (response && response.id) {
            const updatedDiscussion = { ...newDiscussion, id: response.id };
            const updatedData = coinsCache[coinId];
            if (updatedData) {
              setCoinData(coinId, {
                ...updatedData,
                discussions: updatedData.discussions.map(d => 
                  d.id === newDiscussion.id ? updatedDiscussion : d
                )
              });
            }
          }
        } catch (error) {
          console.warn('Failed to create discussion via API:', error);
          // Discussion is already in local state, so user sees it
          // In a real app, you might want to show an error message or retry
        }
      },
      
      createChallenge: async (coinId, challengeData) => {
        const { coinsCache, setCoinData } = get();
        
        // Create the challenge object with generated fields
        const newChallenge: Challenge = {
          id: `${coinId}-challenge-${Date.now()}`,
          title: challengeData.title,
          description: challengeData.description,
          creator: challengeData.creator,
          targetPrize: challengeData.targetPrize,
          currentPrize: 0, // Start with 0, will be funded by backers
          participants: 0, // Start with 0 participants
          deadline: challengeData.deadline,
          status: 'proposal' // Start as proposal
        };
        
        // Add to local state immediately (optimistic update)
        const currentData = coinsCache[coinId];
        if (currentData) {
          setCoinData(coinId, {
            ...currentData,
            challenges: [newChallenge, ...currentData.challenges]
          });
        }
        
        try {
          // Send to API
          const response = await api.createChallenge(coinId, {
            title: challengeData.title,
            description: challengeData.description,
            creator: challengeData.creator,
            targetPrize: challengeData.targetPrize,
            deadline: challengeData.deadline
          });
          
          // Update with server response if different
          if (response && response.id) {
            const updatedChallenge = { ...newChallenge, id: response.id };
            const updatedData = coinsCache[coinId];
            if (updatedData) {
              setCoinData(coinId, {
                ...updatedData,
                challenges: updatedData.challenges.map(c => 
                  c.id === newChallenge.id ? updatedChallenge : c
                )
              });
            }
          }
        } catch (error) {
          console.warn('Failed to create challenge via API:', error);
          // Challenge is already in local state, so user sees it
          // In a real app, you might want to show an error message or retry
        }
      },
      
      sendChatMessage: async (coinId, content, author) => {
        const { addChatMessage } = get();
        
        const message: ChatMessage = {
          id: `${coinId}-${Date.now()}`,
          author: {
            name: author.name || 'You',
            avatar: author.avatar || 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
            isStacker: author.isStacker || false
          },
          content,
          timestamp: new Date().toISOString(),
          type: 'text'
        };
        
        // Add to local state immediately
        addChatMessage(coinId, message);
        
        try {
          // Send to API
          await api.sendChatMessage(coinId, message); // Assumes sendChatMessage exists
        } catch (error) {
          console.warn('Failed to send chat message to API:', error);
          // Message is already in local state, so user sees it
        }
      },
      
      // Helper methods
      loadMockData: async (coinId) => {
        const { setCoinData } = get();
        
        try {
          // Create mock coin data using centralized mock data
          const mockCoinData: CompleteCoinData = {
            coin: get().getDefaultCoinData(coinId).coin,
            discussions: mockDiscussions,
            challenges: mockChallenges,
            rewards: mockRewards,
            stackers: mockStackers,
            chatMessages: mockMessages
          };
          
          setCoinData(coinId, mockCoinData);
        } catch (error) {
          console.error('Failed to load mock data:', error);
          setCoinData(coinId, get().getDefaultCoinData(coinId));
        }
      },
      
      getDefaultCoinData: (coinId): CompleteCoinData => ({
        coin: {
          id: coinId,
          name: 'Unknown Coin',
          symbol: 'UNKNOWN',
          image: 'https://images.pexels.com/photos/730547/pexels-photo-730547.jpeg?auto=compress&cs=tinysrgb&w=400',
          description: 'Coin data not available',
          creator: 'Unknown',
          price: 0,
          marketCap: 0,
          members: 0,
          change24h: 0,
          category: 'Unknown',
          totalSupply: 0,
          circulatingSupply: 0,
          volume24h: 0,
          allTimeHigh: 0,
          allTimeLow: 0,
          launchDate: new Date().toISOString(),
          socialLinks: {},
          mint: '11111111111111111111111111111111', // placeholder mint address
        },
        discussions: [],
        challenges: [],
        rewards: [],
        stackers: [],
        chatMessages: []
      })
    }),
    {
      name: 'meme-world-coin-cache',
      partialize: (state) => ({ coinsCache: state.coinsCache }), // Only persist cache, not loading/error states
    }
  )
); 