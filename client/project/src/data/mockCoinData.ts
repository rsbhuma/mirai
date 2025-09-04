import { Discussion, Challenge, Reward, Stacker, ChatMessage } from './types';

export const mockDiscussions: Discussion[] = [
  {
    id: '1',
    title: 'What\'s the roadmap for Q2 2024?',
    content: 'Really excited about this project! Could someone share what major milestones we\'re targeting for the next quarter?',
    author: {
      name: 'CryptoEnthusiast',
      avatar: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
      isStacker: false
    },
    timestamp: '2024-01-15T10:30:00Z',
    replies: 23,
    likes: 45,
    isPinned: true
  },
  {
    id: '2',
    title: 'Staking rewards calculation',
    content: 'Can anyone explain how the staking rewards are calculated? I want to understand the APY structure better.',
    author: {
      name: 'StakeHolder',
      avatar: 'https://images.pexels.com/photos/1181343/pexels-photo-1181343.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
      isStacker: true
    },
    timestamp: '2024-01-15T09:15:00Z',
    replies: 12,
    likes: 28,
    isPinned: false
  },
  {
    id: '3',
    title: 'Partnership announcement coming soon?',
    content: 'Heard rumors about a major partnership. Any official word on this?',
    author: {
      name: 'NewsHunter',
      avatar: 'https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
      isStacker: false
    },
    timestamp: '2024-01-15T08:45:00Z',
    replies: 8,
    likes: 19,
    isPinned: false
  }
];

export const mockChallenges: Challenge[] = [
  {
    id: '1',
    title: 'Community Growth Challenge',
    description: 'Help us reach 10,000 community members! Share on social media and invite friends.',
    creator: 'CommunityManager',
    targetPrize: 50000,
    currentPrize: 12500,
    participants: 234,
    deadline: '2024-02-15T23:59:59Z',
    status: 'active'
  },
  {
    id: '2',
    title: 'DApp Integration Contest',
    description: 'Build the most innovative DApp using our protocol. Winners get exclusive NFTs and token rewards!',
    creator: 'DevTeam',
    targetPrize: 100000,
    currentPrize: 75000,
    participants: 45,
    deadline: '2024-03-01T23:59:59Z',
    status: 'active'
  },
  {
    id: '3',
    title: 'Meme Competition',
    description: 'Create the best meme featuring our token. Community votes for the winner!',
    creator: 'MarketingTeam',
    targetPrize: 25000,
    currentPrize: 25000,
    participants: 189,
    deadline: '2024-01-31T23:59:59Z',
    status: 'completed',
    winner: 'MemeKing2024'
  }
];

export const mockRewards: Reward[] = [
  {
    id: '1',
    type: 'referral',
    title: 'Friend Referral Bonus',
    description: 'Earned for referring a new community member',
    amount: 100,
    token: 'COMM',
    status: 'claimed',
    date: '2024-02-15T23:59:59Z'
  },
  {
    id: '2',
    type: 'challenge',
    title: 'Community Growth Participation',
    description: 'Reward for participating in the community growth challenge',
    amount: 250,
    token: 'COMM',
    status: 'ready',
    date: '2024-02-20T23:59:59Z'
  },
  {
    id: '3',
    type: 'referral',
    title: 'Social Media Share Bonus',
    description: 'Bonus for sharing community content on social media',
    amount: 50,
    token: 'COMM',
    status: 'claimed',
    date: '2024-01-30T23:59:59Z'
  }
];

export const mockStackers: Stacker[] = [
  {
    id: '1',
    name: 'CryptoWhale',
    avatar: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
    wallet: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
    stackedAmount: 50000,
    stakedAmount: 50000,
    stakingRewards: 2500,
    joinDate: '2024-01-01T00:00:00Z',
    badges: ['Early Adopter', 'High Staker'],
    rank: 1,
    reputation: 95,
    isOnline: true
  },
  {
    id: '2',
    name: 'TokenMaster',
    avatar: 'https://images.pexels.com/photos/1181343/pexels-photo-1181343.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
    wallet: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    stackedAmount: 35000,
    stakedAmount: 35000,
    stakingRewards: 1750,
    joinDate: '2024-01-03T00:00:00Z',
    badges: ['Loyal Staker'],
    rank: 2,
    reputation: 87,
    isOnline: false
  },
  {
    id: '3',
    name: 'DiamondHands',
    avatar: 'https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
    wallet: '5uNrM8jDDd8NcJqjgZjKcXwPQqjqZqJuJqjqZqJqjqZ',
    stackedAmount: 28000,
    stakedAmount: 28000,
    stakingRewards: 1400,
    joinDate: '2024-01-05T00:00:00Z',
    badges: ['Diamond Hands', 'Community Builder'],
    rank: 3,
    reputation: 92,
    isOnline: true
  },
  {
    id: '4',
    name: 'HODLer2024',
    avatar: 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
    wallet: '8vKYs9NDFGJKDFGJKDFGJKDFGJKDFGJKDFGJKDFGJKs',
    stackedAmount: 22000,
    stakedAmount: 22000,
    stakingRewards: 1100,
    joinDate: '2024-01-07T00:00:00Z',
    badges: ['Steady Staker'],
    rank: 4,
    reputation: 78,
    isOnline: true
  },
  {
    id: '5',
    name: 'YieldFarmer',
    avatar: 'https://images.pexels.com/photos/267371/pexels-photo-267371.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
    wallet: '3hFGHJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstu',
    stackedAmount: 18000,
    stakedAmount: 18000,
    stakingRewards: 900,
    joinDate: '2024-01-10T00:00:00Z',
    badges: ['Yield Optimizer'],
    rank: 5,
    reputation: 82,
    isOnline: false
  }
];

export const mockMessages: ChatMessage[] = [
  {
    id: '1',
    author: {
      name: 'CommunityMod',
      avatar: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
      isStacker: true
    },
    content: 'Welcome to the community chat! Feel free to ask questions and engage with fellow community members.',
    timestamp: '2024-01-15T10:30:00Z',
    type: 'text'
  },
  {
    id: '2',
    author: {
      name: 'TokenTrader',
      avatar: 'https://images.pexels.com/photos/1181343/pexels-photo-1181343.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
      isStacker: false
    },
    content: 'Great community! Love the project vision 🚀',
    timestamp: '2024-01-15T10:32:00Z',
    type: 'text'
  },
  {
    id: '3',
    author: {
      name: 'CryptoAnalyst',
      avatar: 'https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
      isStacker: true
    },
    content: 'The tokenomics look solid. When is the next milestone update?',
    timestamp: '2024-01-15T10:35:00Z',
    type: 'text'
  },
  {
    id: '4',
    author: {
      name: 'DeFiExplorer',
      avatar: 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
      isStacker: false
    },
    content: 'Just staked my tokens! Excited to be part of this journey',
    timestamp: '2024-01-15T10:38:00Z',
    type: 'text'
  },
  {
    id: '5',
    author: {
      name: 'system',
      avatar: '',
      isStacker: false
    },
    content: 'New staking reward distribution completed. Check your wallets!',
    timestamp: '2024-01-15T10:40:00Z',
    type: 'system'
  }
]; 