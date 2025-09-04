import { client } from './client';
import {
  ApiToken,
  ApiTokenListResponse,
  ApiTokenMarketData,
  ApiTokenHoldingsResponse,
  ApiUser,
  ApiUserProfile,
  ApiUserHoldingsResponse,
  ApiTransaction,
  ApiTransactionListResponse,
  ApiPriceHistoryResponse,
  ApiOrderBookResponse,
  ApiTrendingTokensResponse,
  ApiOrder,
  ApiPortfolioResponse,
  ApiNotificationListResponse,
  ApiUnreadCountResponse,
  ApiTokenAnalytics,
  ApiUserAnalytics,
  ApiMarketAnalytics,
  ApiDiscussion,
  ApiChallenge,
  ApiReward,
  ApiStacker,
  ApiChatMessage,
  ApiPost,
  ApiCreatePostRequest,
  ApiCreatePostResponse,
  ApiFeedResponse,
  ApiLikeResponse,
  ApiCommentsResponse,
} from './types';
import {
  transformToken,
  transformTokenListItem,
  transformDiscussion,
  transformChallenge,
  transformReward,
  transformStacker,
  transformChatMessage,
  transformPost,
  transformCreatePostResponse,
} from './transformers';

// -----------------
// Tokens
// -----------------
export const getTokens = async (params?: { page?: number; limit?: number; search?: string }) => {
  const query = new URLSearchParams(params as any).toString();
  const response = await client.get<ApiTokenListResponse>(`/api/tokens?${query}`);
  return {
    ...response,
    tokens: response.tokens.map(transformTokenListItem),
  };
};

export const getToken = async (id: string) => {
  const response = await client.get<ApiToken>(`/api/tokens/${id}`);
  return transformToken(response);
};

export const createToken = async (data: any) => {
  const response = await client.post<ApiToken>('/api/tokens', data);
  return transformToken(response);
};

export const buyToken = async (tokenId: string, amount: number, txSignature: string) => {
  return client.post(`/api/tokens/${tokenId}/buy`, { amount, tx_signature: txSignature });
};

export const sellToken = async (tokenId: string, amount: number, txSignature: string) => {
    return client.post(`/api/tokens/${tokenId}/sell`, { amount, tx_signature: txSignature });
};

export const getMarketData = async (tokenId: string) => {
    return client.get<ApiTokenMarketData>(`/api/tokens/${tokenId}/market`);
};

export const getTokenHoldings = async (tokenId: string, params?: { page?: number; limit?: number; }) => {
    const query = new URLSearchParams(params as any).toString();
    return client.get<ApiTokenHoldingsResponse>(`/api/tokens/${tokenId}/holdings?${query}`);
};


// -----------------
// 2. Users API
// -----------------

export const createUser = async (data: { wallet_address: string; username: string; email: string; display_name: string; }) => {
    return client.post<ApiUser>('/api/users', data);
};

export const getUser = async (userId: string) => {
    return client.get<ApiUser>(`/api/users/${userId}`);
};

export const updateUser = async (userId: string, data: { display_name?: string; avatar_url?: string; bio?: string; }) => {
    return client.put<ApiUser>(`/api/users/${userId}`, data);
};

export const deleteUser = async (userId: string) => {
    return client.delete(`/api/users/${userId}`);
};

export const getUserProfile = async (userId: string) => {
    return client.get<ApiUserProfile>(`/api/users/${userId}/profile`);
};

export const getUserHoldings = async (userId: string, params?: { page?: number; limit?: number; }) => {
    const query = new URLSearchParams(params as any).toString();
    return client.get<ApiUserHoldingsResponse>(`/api/users/${userId}/holdings?${query}`);
};


// -----------------
// 3. Transactions API
// -----------------

export const createTransaction = async (data: { type: 'buy' | 'sell' | 'transfer'; token_id: string; amount: number; price_per_token: number; tx_signature: string; }) => {
    return client.post<ApiTransaction>('/api/transactions', data);
};

export const listTransactions = async (params?: { page?: number; limit?: number; type?: 'buy' | 'sell' | 'transfer'; status?: 'pending' | 'completed' | 'failed'; token_id?: string; user_id?: string; }) => {
    const query = new URLSearchParams(params as any).toString();
    return client.get<ApiTransactionListResponse>(`/api/transactions?${query}`);
};

export const getTransaction = async (transactionId: string) => {
    return client.get<ApiTransaction>(`/api/transactions/${transactionId}`);
};

export const updateTransactionStatus = async (transactionId: string, data: { status: 'completed' | 'failed'; block_hash?: string; confirmations?: number; failure_reason?: string | null; }) => {
    return client.put(`/api/transactions/${transactionId}/status`, data);
};

export const getUserTransactions = async (userId: string, params?: { page?: number; limit?: number; }) => {
    const query = new URLSearchParams(params as any).toString();
    return client.get<ApiTransactionListResponse>(`/api/transactions/user/${userId}?${query}`);
};


// -----------------
// 4. Market Data API
// -----------------

export const getPriceHistory = async (tokenId: string, params?: { interval?: '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w'; from?: string; to?: string; limit?: number; }) => {
    const query = new URLSearchParams(params as any).toString();
    return client.get<ApiPriceHistoryResponse>(`/api/market/tokens/${tokenId}/price-history?${query}`);
};

export const getOrderBook = async (tokenId: string, params?: { depth?: number; }) => {
    const query = new URLSearchParams(params as any).toString();
    return client.get<ApiOrderBookResponse>(`/api/market/tokens/${tokenId}/order-book?${query}`);
};

export const getTrendingTokens = async (params?: { limit?: number; timeframe?: '1h' | '24h' | '7d' | '30d'; }) => {
    const query = new URLSearchParams(params as any).toString();
    return client.get<ApiTrendingTokensResponse>(`/api/market/trending?${query}`);
};


// -----------------
// 5. Trading API
// -----------------

export const buyTokens = async (data: { token_id: string; amount: number; order_type: 'market' | 'limit'; price_per_token?: number | null; slippage_tolerance?: number; }) => {
    return client.post<ApiOrder>('/api/trading/buy', data);
};

export const sellTokens = async (data: { token_id: string; amount: number; order_type: 'market' | 'limit'; price_per_token?: number | null; slippage_tolerance?: number; }) => {
    return client.post<ApiOrder>('/api/trading/sell', data);
};

export const getUserPortfolio = async (userId: string) => {
    return client.get<ApiPortfolioResponse>(`/api/trading/portfolio/${userId}`);
};


// -----------------
// 6. Notifications API
// -----------------

export const listNotifications = async (params?: { page?: number; limit?: number; read?: boolean; type?: 'trade' | 'price_alert' | 'system'; }) => {
    const query = new URLSearchParams(params as any).toString();
    return client.get<ApiNotificationListResponse>(`/api/notifications?${query}`);
};

export const markNotificationAsRead = async (notificationId: string) => {
    return client.put(`/api/notifications/${notificationId}`, {});
};

export const getUnreadNotificationCount = async () => {
    return client.get<ApiUnreadCountResponse>('/api/notifications/unread-count');
};


// -----------------
// 7. Analytics API
// -----------------

export const getTokenAnalytics = async (tokenId: string, params?: { timeframe?: '1h' | '24h' | '7d' | '30d'; }) => {
    const query = new URLSearchParams(params as any).toString();
    return client.get<ApiTokenAnalytics>(`/api/analytics/tokens/${tokenId}?${query}`);
};

export const getUserAnalytics = async (userId: string, params?: { timeframe?: '1h' | '24h' | '7d' | '30d'; }) => {
    const query = new URLSearchParams(params as any).toString();
    return client.get<ApiUserAnalytics>(`/api/analytics/user/${userId}?${query}`);
};

export const getMarketAnalytics = async (params?: { timeframe?: '1h' | '24h' | '7d' | '30d'; }) => {
    const query = new URLSearchParams(params as any).toString();
    return client.get<ApiMarketAnalytics>(`/api/analytics/market?${query}`);
};


// -----------------
// Community Content (Discussions, Challenges etc.)
// -----------------

// As these endpoints are not in the documentation, I'm creating them based on
// the existing application structure.

export const getDiscussions = async (coinId: string) => {
  const response = await client.get<ApiDiscussion[]>(`/api/coins/${coinId}/discussions`);
  return response.map(transformDiscussion);
};

export const createDiscussion = async (coinId: string, data: any) => {
  const response = await client.post<ApiDiscussion>(`/api/coins/${coinId}/discussions`, data);
  return transformDiscussion(response);
};

export const getChallenges = async (coinId: string) => {
  const response = await client.get<ApiChallenge[]>(`/api/coins/${coinId}/challenges`);
  return response.map(transformChallenge);
};

export const createChallenge = async (coinId: string, data: any) => {
  const response = await client.post<ApiChallenge>(`/api/coins/${coinId}/challenges`, data);
  return transformChallenge(response);
};

export const getRewards = async (coinId: string) => {
    const response = await client.get<ApiReward[]>(`/api/coins/${coinId}/rewards`);
    return response.map(transformReward);
};

export const getStackers = async (coinId: string) => {
    const response = await client.get<ApiStacker[]>(`/api/coins/${coinId}/stackers`);
    return response.map(transformStacker);
};

export const getChatMessages = async (coinId: string) => {
    const response = await client.get<ApiChatMessage[]>(`/api/coins/${coinId}/chat`);
    return response.map(transformChatMessage);
};

export const sendChatMessage = async (coinId: string, data: any) => {
    const response = await client.post<ApiChatMessage>(`/api/coins/${coinId}/chat`, data);
    return transformChatMessage(response);
};

// -----------------
// Posts/Feed API
// -----------------

export const getFeed = async (params?: { page?: number; limit?: number }) => {
  const query = new URLSearchParams(params as any).toString();
  const response = await client.get<ApiFeedResponse>(`/api/social/feed?${query}`);
  console.log("GET FEED RESPONSE ",response, response);
  return {
    ...response,
    posts: response.posts.map(transformPost),
  };
};

export const createPost = async (data: ApiCreatePostRequest) => {
  const response = await client.post<ApiCreatePostResponse>('/api/social/posts', data);
  return transformCreatePostResponse(response);
};

export const getPost = async (id: string) => {
  const response = await client.get<ApiPost>(`/api/social/posts/${id}`);
  return transformPost(response);
};

export const likePost = async (id: string) => {
  const response = await client.post<ApiLikeResponse>(`/api/social/posts/${id}/like`, {});
  return response;
};

export const unlikePost = async (id: string) => {
  const response = await client.post<ApiLikeResponse>(`/api/social/posts/${id}/unlike`, {});
  return response;
};

export const getPostComments = async (id: string, params?: { page?: number; limit?: number }) => {
  const query = new URLSearchParams(params as any).toString();
  const response = await client.get<ApiCommentsResponse>(`/api/social/posts/${id}/comments?${query}`);
  return response;
};

export const createComment = async (postId: string, data: { content: string; reply_to_id?: string }) => {
  const response = await client.post(`/api/social/posts/${postId}/comments`, data);
  return response;
};

// Authentication
export interface ApiLoginRequest {
    wallet_address: string;
    signature: string;
    message: string;
}

export const login = async (data: ApiLoginRequest) => {
    return client.post('/api/auth/login', data);
};

export const logout = async () => {
    return client.post('/api/auth/logout', {});
};

// Export types for use in other files
export type { 
  ApiCreatePostRequest,
  ApiCreatePostResponse,
  ApiPost,
  ApiFeedResponse,
  ApiLikeResponse,
  ApiCommentsResponse 
} from './types'; 