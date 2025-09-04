// Legacy exports - redirect to centralized data
// Consider migrating imports to use @/data directly
export { 
  mockFeedData as posts,
  mockFlamesData as communities,
  mockReelsData as reels,
  mockPredictionsData as predictionMarkets,
  mockDiscussions as discussions,
  mockChallenges as challenges,
  mockStackers as stackers,
  mockMessages as chatMessages,
  mockRewards as rewards
} from '@/data'; 