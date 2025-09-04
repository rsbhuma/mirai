// Central export for all mock data
// This prevents circular dependencies and ensures consistent imports

// Export types
export * from './types';

// Export mock data
export { mockFeedData } from './mockFeedData';
export { mockFlamesData } from './mockFlamesData';
export { mockReelsData, mockPredictionsData } from './mockDiscoveryData';
export { 
  mockDiscussions, 
  mockChallenges, 
  mockRewards, 
  mockStackers, 
  mockMessages 
} from './mockCoinData';

// Legacy exports for backward compatibility (can be removed gradually)
export { mockFeedData as posts } from './mockFeedData';
export { mockFlamesData as communities } from './mockFlamesData';
export { mockReelsData as reels } from './mockDiscoveryData';
export { mockPredictionsData as predictionMarkets } from './mockDiscoveryData';
export { mockDiscussions as discussions } from './mockCoinData';
export { mockChallenges as challenges } from './mockCoinData';
export { mockStackers as stackers } from './mockCoinData';
export { mockMessages as chatMessages } from './mockCoinData';
export { mockRewards as rewards } from './mockCoinData'; 