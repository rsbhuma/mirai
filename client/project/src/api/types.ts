// This file will contain all the TypeScript interfaces for the API responses,
// as defined in the API_DOCUMENTATION.md.

// -----------------
// 1. Tokens API
// -----------------

export interface ApiToken {
  id: string;
  name: string;
  symbol: string;
  description: string;
  icon_url: string;
  mint_address: string;
  creator_id: string;
  creator_pubkey: string;
  total_supply: number;
  circulating_supply: number;
  price: number;
  market_cap: number;
  volume_24h: number;
  change_24h: number;
  is_active: boolean;
  tx_signature: string;
  created_at: string;
  updated_at: string;
}

export interface ApiTokenListItem {
  id: string;
  mint_address: string;
  name: string;
  symbol: string;
  icon_url: string;
  price: number;
  market_cap: number;
  volume_24h: number;
  change_24h: number;
  created_at: string;
}

export interface ApiTokenListResponse {
  tokens: ApiTokenListItem[];
  pagination: ApiPagination;
}

export interface ApiTokenMarketData {
  token_id: string;
  mint_address: string;
  current_price: number;
  market_cap: number;
  volume_24h: number;
  change_24h: number;
  change_7d: number;
  circulating_supply: number;
  max_supply: number;
  holders_count: number;
  ath: number;
  atl: number;
  last_updated: string;
}

export interface ApiTokenHolding {
  user_id: string;
  user_pubkey: string;
  username: string;
  balance: number;
  value_usd: number;
  percentage: number;
  last_updated: string;
}

export interface ApiTokenHoldingsResponse {
  holdings: ApiTokenHolding[];
  pagination: ApiPagination;
}

export interface ApiPagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}


// -----------------
// 2. Users API
// -----------------

export interface ApiUser {
  id: string;
  wallet_address: string;
  username: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  is_verified: boolean;
  total_portfolio_value: number;
  created_at: string;
}

export interface ApiUserProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string;
  is_verified: boolean;
  stats: {
    total_portfolio_value: number;
    tokens_owned: number;
    tokens_created: number;
    total_trades: number;
    join_date: string;
  };
  badges: string[];
}

export interface ApiUserHolding {
  token_id: string;
  token_name: string;
  token_symbol: string;
  balance: number;
  value_usd: number;
  current_price: number;
  change_24h: number;
  last_updated: string;
}

export interface ApiUserHoldingsResponse {
  user_id: string;
  total_value: number;
  holdings: ApiUserHolding[];
  pagination: ApiPagination;
}


// -----------------
// 3. Transactions API
// -----------------

export interface ApiTransaction {
  id: string;
  type: 'buy' | 'sell' | 'transfer';
  token_id: string;
  user_id: string;
  amount: number;
  price_per_token: number;
  total_value: number;
  tx_signature: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

export interface ApiTransactionListResponse {
  transactions: ApiTransaction[];
  pagination: ApiPagination;
}

// -----------------
// 4. Market Data API
// -----------------

export interface ApiPriceHistoryDataPoint {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ApiPriceHistoryResponse {
  token_id: string;
  interval: string;
  data: ApiPriceHistoryDataPoint[];
}

export interface ApiOrderBookLevel {
  price: number;
  amount: number;
  total: number;
}

export interface ApiOrderBookResponse {
  token_id: string;
  bids: ApiOrderBookLevel[];
  asks: ApiOrderBookLevel[];
  spread: number;
  last_updated: string;
}

export interface ApiTrendingToken {
  token_id: string;
  name: string;
  symbol: string;
  price: number;
  change_24h: number;
  volume_24h: number;
  market_cap: number;
  rank: number;
}

export interface ApiTrendingTokensResponse {
  timeframe: string;
  tokens: ApiTrendingToken[];
}


// -----------------
// 5. Trading API
// -----------------

export interface ApiOrder {
  order_id: string;
  status: 'filled' | 'pending' | 'cancelled';
  token_id: string;
  amount: number;
  filled_amount: number;
  average_price: number;
  total_cost: number;
  fees: number;
  tx_signature: string;
  created_at: string;
}

export interface ApiPortfolioHolding {
  token_id: string;
  token_name: string;
  token_symbol: string;
  balance: number;
  average_cost: number;
  current_price: number;
  value_usd: number;
  unrealized_pnl: number;
  pnl_percentage: number;
}

export interface ApiPortfolioResponse {
  user_id: string;
  total_value: number;
  total_cost_basis: number;
  unrealized_pnl: number;
  realized_pnl: number;
  holdings: ApiPortfolioHolding[];
  last_updated: string;
}


// -----------------
// 6. Notifications API
// -----------------

export interface ApiNotification {
  id: string;
  type: 'trade' | 'price_alert' | 'system';
  title: string;
  message: string;
  data: any;
  is_read: boolean;
  created_at: string;
}

export interface ApiNotificationListResponse {
  notifications: ApiNotification[];
  pagination: ApiPagination;
}

export interface ApiUnreadCountResponse {
  unread_count: number;
}

// -----------------
// 7. Analytics API
// -----------------

export interface ApiTokenAnalytics {
    token_id: string;
    timeframe: string;
    metrics: {
        price_change: number;
        volume_change: number;
        holder_change: number;
        trade_count: number;
        unique_traders: number;
        avg_trade_size: number;
        volatility: number;
    };
    top_holders: {
        user_id: string;
        balance: number;
        percentage: number;
    }[];
}

export interface ApiUserAnalytics {
    user_id: string;
    timeframe: string;
    metrics: {
        total_trades: number;
        total_volume: number;
        realized_pnl: number;
        win_rate: number;
        avg_holding_time: string;
        favorite_tokens: string[];
    };
    portfolio_performance: {
        start_value: number;
        end_value: number;
        total_return: number;
        best_trade: number;
        worst_trade: number;
    };
}

export interface ApiMarketAnalytics {
    timeframe: string;
    metrics: {
        total_volume: number;
        total_trades: number;
        active_tokens: number;
        new_tokens: number;
        top_gainers: {
            token_id: string;
            symbol: string;
            change_24h: number;
        }[];
        top_losers: {
            token_id: string;
            symbol: string;
            change_24h: number;
        }[];
    };
}

// -----------------
// 9. Health & Monitoring API
// -----------------

export interface ApiHealthResponse {
  status: string;
  timestamp: string;
  version: string;
  uptime: string;
  environment: string;
}

export interface ApiDbHealthResponse {
  status: string;
  connection_pool: {
    active: number;
    idle: number;
    max: number;
  };
  query_time_ms: number;
  last_migration: string;
}

export interface ApiRedisHealthResponse {
  status: string;
  connection_count: number;
  memory_usage: string;
  hit_rate: number;
}

export interface ApiSolanaHealthResponse {
  status: string;
  rpc_url: string;
  block_height: number;
  response_time_ms: number;
}

// -----------------
// Assumed Community Types (Discussions, Challenges etc.)
// These are not in the documentation, so I'm creating a structure
// that aligns with the existing application state.
// -----------------

export interface ApiAuthor {
    name: string;
    avatar: string;
    isStacker: boolean;
}

export interface ApiDiscussion {
    id: string;
    title: string;
    content: string;
    author: ApiAuthor;
    timestamp: string;
    replies: number;
    likes: number;
    isPinned: boolean;
    media?: string;
}

export interface ApiChallenge {
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

export interface ApiReward {
    id: string;
    type: 'referral' | 'challenge';
    title: string;
    amount: number;
    date: string;
    status: 'pending' | 'ready' | 'claimed';
    description: string;
}

export interface ApiStacker {
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

export interface ApiChatMessage {
    id: string;
    author: ApiAuthor;
    content: string;
    timestamp: string;
    type: 'text' | 'image' | 'system';
}

// -----------------
// 8. Posts/Feed API
// -----------------

export interface ApiContentType {
    type: 'text' | 'image' | 'video' | 'link';
}

export interface ApiPost {
    id: string;
    creator_id: string;
    content_type: 'text' | 'image' | 'video' | 'link';
    title: string;
    description: string;
    media_url?: string;
    external_url?: string;
    vision: string;
    twitter_url?: string;
    discord_url?: string;
    github_url?: string;
    likes_count: number;
    comments_count: number;
    token_id?: string;
    is_published: boolean;
    created_at: string;
    updated_at: string;
}

export interface ApiCreatePostRequest {
    title: string;
    description: string;
    vision: string;
    content_type?: string;
    media_url?: string;
    twitter?: string;
    discord?: string;
    github?: string;
    token_id?: string;
}

export interface ApiCreatePostResponse {
    id: string;
    creator_id: string;
    content_type: 'text' | 'image' | 'video' | 'link';
    title: string;
    description: string;
    media_url?: string;
    external_url?: string;
    vision: string;
    twitter_url?: string;
    discord_url?: string;
    github_url?: string;
    likes_count: number;
    comments_count: number;
    token_id?: string;
    is_published: boolean;
    created_at: string;
    updated_at: string;
}

export interface ApiFeedResponse {
    posts: ApiPost[];
    pagination?: ApiPagination;
}

export interface ApiLikeResponse {
    message: string;
    post_id: string;
    liked?: boolean;
    unliked?: boolean;
}

export interface ApiComment {
    id: string;
    parent_type: 'discussion' | 'feeditem';
    parent_id: string;
    author_id: string;
    content: string;
    reply_to_id?: string;
    likes_count: number;
    created_at: string;
    updated_at: string;
}

export interface ApiCommentsResponse {
    comments: ApiComment[];
    pagination?: ApiPagination;
} 