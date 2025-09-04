// This file will contain transformer functions to convert API data
// into the application's internal data structures.

import {
  ApiToken,
  ApiTokenListItem,
  ApiDiscussion,
  ApiChallenge,
  ApiReward,
  ApiStacker,
  ApiChatMessage,
  ApiPost,
  ApiCreatePostResponse,
} from './types';
import {
  CoinData,
  Discussion,
  Challenge,
  Reward,
  Stacker,
  ChatMessage,
} from '@/store/coinStore';
import { FeedItem } from '@/data/types';

export const transformToken = (apiToken: ApiToken): CoinData => ({
  id: apiToken.id,
  name: apiToken.name,
  symbol: apiToken.symbol,
  image: apiToken.icon_url,
  description: apiToken.description,
  creator: apiToken.creator_pubkey, // Assuming creator_pubkey is the display name or ID
  price: apiToken.price,
  marketCap: apiToken.market_cap,
  members: 0, // This information is not in the ApiToken, default to 0
  change24h: apiToken.change_24h,
  category: 'Unknown', // This information is not in the ApiToken
  totalSupply: apiToken.total_supply,
  circulatingSupply: apiToken.circulating_supply,
  volume24h: apiToken.volume_24h,
  allTimeHigh: 0, // This information is not in the ApiToken
  allTimeLow: 0, // This information is not in the ApiToken
  launchDate: apiToken.created_at,
  socialLinks: {}, // This information is not in the ApiToken
  mint: apiToken.mint_address,
});

export const transformTokenListItem = (apiToken: ApiTokenListItem): CoinData => ({
  id: apiToken.id,
  name: apiToken.name,
  symbol: apiToken.symbol,
  image: apiToken.icon_url,
  description: '', // Not available in list item view
  creator: '', // Not available in list item view
  price: apiToken.price,
  marketCap: apiToken.market_cap,
  members: 0, // Not available in list item view
  change24h: apiToken.change_24h,
  category: 'Unknown', // Not available in list item view
  totalSupply: 0, // Not available in list item view
  circulatingSupply: 0, // Not available in list item view
  volume24h: apiToken.volume_24h,
  allTimeHigh: 0, // Not available in list item view
  allTimeLow: 0, // Not available in list item view
  launchDate: apiToken.created_at,
  socialLinks: {}, // Not available in list item view
  mint: apiToken.mint_address,
});

export const transformDiscussion = (apiDiscussion: ApiDiscussion): Discussion => ({
  id: apiDiscussion.id,
  title: apiDiscussion.title,
  content: apiDiscussion.content,
  author: {
    name: apiDiscussion.author.name,
    avatar: apiDiscussion.author.avatar,
    isStacker: apiDiscussion.author.isStacker,
  },
  timestamp: apiDiscussion.timestamp,
  replies: apiDiscussion.replies,
  likes: apiDiscussion.likes,
  isPinned: apiDiscussion.isPinned,
  media: apiDiscussion.media,
});

export const transformChallenge = (apiChallenge: ApiChallenge): Challenge => ({
    id: apiChallenge.id,
    title: apiChallenge.title,
    description: apiChallenge.description,
    creator: apiChallenge.creator,
    targetPrize: apiChallenge.targetPrize,
    currentPrize: apiChallenge.currentPrize,
    participants: apiChallenge.participants,
    deadline: apiChallenge.deadline,
    status: apiChallenge.status,
    submissions: apiChallenge.submissions,
    winner: apiChallenge.winner,
});

export const transformReward = (apiReward: ApiReward): Reward => ({
    id: apiReward.id,
    type: apiReward.type,
    title: apiReward.title,
    amount: apiReward.amount,
    date: apiReward.date,
    status: apiReward.status,
    description: apiReward.description,
});

export const transformStacker = (apiStacker: ApiStacker): Stacker => ({
    id: apiStacker.id,
    name: apiStacker.name,
    avatar: apiStacker.avatar,
    wallet: apiStacker.wallet,
    stakedAmount: apiStacker.stakedAmount,
    joinDate: apiStacker.joinDate,
    reputation: apiStacker.reputation,
    badges: apiStacker.badges,
    isOnline: apiStacker.isOnline,
});

export const transformChatMessage = (apiMessage: ApiChatMessage): ChatMessage => ({
  id: apiMessage.id,
  author: apiMessage.author,
  content: apiMessage.content,
  timestamp: apiMessage.timestamp,
  type: apiMessage.type,
});

// -----------------
// Post Transformers
// -----------------

export const transformPost = (apiPost: ApiPost): FeedItem => ({
  id: apiPost.id,
  creator: {
    name: `User-${apiPost.creator_id.slice(0, 8)}`, // Temporary until we have user data
    avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
    wallet: apiPost.creator_id,
  },
  content: {
    type: apiPost.content_type,
    title: apiPost.title,
    description: apiPost.description,
    media: apiPost.media_url,
    url: apiPost.external_url,
  },
  vision: apiPost.vision,
  socialLinks: {
    twitter: apiPost.twitter_url,
    discord: apiPost.discord_url,
    github: apiPost.github_url,
  },
  timestamp: apiPost.created_at,
  comments: apiPost.comments_count,
  likes: apiPost.likes_count,
  isLiked: false, // Will need to be determined by checking user's likes
});

export const transformCreatePostResponse = (apiResponse: ApiCreatePostResponse): FeedItem => ({
  id: apiResponse.id,
  creator: {
    name: `User-${apiResponse.creator_id.slice(0, 8)}`,
    avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
    wallet: apiResponse.creator_id,
  },
  content: {
    type: apiResponse.content_type,
    title: apiResponse.title,
    description: apiResponse.description,
    media: apiResponse.media_url,
    url: apiResponse.external_url,
  },
  vision: apiResponse.vision,
  socialLinks: {
    twitter: apiResponse.twitter_url,
    discord: apiResponse.discord_url,
    github: apiResponse.github_url,
  },
  timestamp: apiResponse.created_at,
  comments: apiResponse.comments_count,
  likes: apiResponse.likes_count,
  isLiked: false,
}); 