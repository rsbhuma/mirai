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

export const mockFeedData: FeedItem[] = [
  {
    id: '1',
    creator: {
      name: 'Alex Chen',
      avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
      wallet: '4x7B...9kN2'
    },
    content: {
      type: 'text',
      title: 'Revolutionary DeFi Protocol',
      description: 'Building the next generation of decentralized finance with automated yield farming and cross-chain compatibility. This protocol will change how we think about liquidity provision.',
      media: 'https://images.pexels.com/photos/730547/pexels-photo-730547.jpeg?auto=compress&cs=tinysrgb&w=800'
    },
    vision: 'Create a community-driven DeFi ecosystem that empowers users to maximize their yield while maintaining full control of their assets.',
    socialLinks: {
      twitter: 'https://twitter.com/alexchen_defi',
      discord: 'https://discord.gg/defiprotocol'
    },
    timestamp: '2 hours ago',
    comments: 34,
    likes: 127,
    isLiked: false
  },
  {
    id: '2',
    creator: {
      name: 'Sarah Martinez',
      avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
      wallet: '8pQ3...2mL5'
    },
    content: {
      type: 'video',
      title: 'NFT Art Marketplace Demo',
      description: 'Showcasing our new NFT marketplace with zero gas fees and instant settlements. Artists can mint and sell their work without any upfront costs.',
      media: 'https://images.pexels.com/photos/1181343/pexels-photo-1181343.jpeg?auto=compress&cs=tinysrgb&w=800'
    },
    vision: 'Democratize NFT creation and trading by eliminating barriers for artists and collectors worldwide.',
    socialLinks: {
      twitter: 'https://twitter.com/sarahm_nft',
      github: 'https://github.com/sarahm/nft-marketplace'
    },
    timestamp: '4 hours ago',
    comments: 18,
    likes: 89,
    isLiked: true
  },
  {
    id: '3',
    creator: {
      name: 'Marcus Thompson',
      avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
      wallet: '9nH6...4sK8'
    },
    content: {
      type: 'link',
      title: 'Open Source Gaming Platform',
      description: 'Launching a blockchain-based gaming platform where players truly own their in-game assets. Built on Solana for fast, cheap transactions.',
      url: 'https://github.com/marcust/solana-gaming'
    },
    vision: 'Build the future of gaming where players have true ownership and can monetize their gaming skills through blockchain technology.',
    socialLinks: {
      github: 'https://github.com/marcust/solana-gaming',
      discord: 'https://discord.gg/solanagaming'
    },
    timestamp: '6 hours ago',
    comments: 56,
    likes: 203,
    isLiked: false
  },
  {
    id: '4',
    creator: {
      name: 'Emma Wilson',
      avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
      wallet: '6kL9...7fR3'
    },
    content: {
      type: 'text',
      title: 'Carbon-Neutral Blockchain Initiative',
      description: 'Developing a revolutionary carbon-neutral blockchain protocol that automatically offsets its environmental impact through verified carbon credits and renewable energy partnerships.',
      media: 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=800'
    },
    vision: 'Create the world\'s first truly sustainable blockchain ecosystem that proves environmental responsibility and technological innovation can coexist.',
    socialLinks: {
      twitter: 'https://twitter.com/emmaw_eco',
      discord: 'https://discord.gg/ecochain'
    },
    timestamp: '1 day ago',
    comments: 42,
    likes: 156,
    isLiked: true,
    coinData: {
      symbol: 'ECO',
      price: 0.45,
      marketCap: 2500000,
      members: 1250,
      change24h: 12.5
    }
  }
];

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

export const mockFlamesData: FlameData[] = [
  {
    id: '1',
    name: 'DeFiMax Protocol',
    symbol: 'DEFM',
    description: 'Revolutionary DeFi protocol with automated yield farming',
    image: 'https://images.pexels.com/photos/730547/pexels-photo-730547.jpeg?auto=compress&cs=tinysrgb&w=400',
    price: 0.45,
    marketCap: 2340000,
    members: 1247,
    change24h: 12.5,
    category: 'DeFi'
  },
  {
    id: '2',
    name: 'ArtFlow NFT',
    symbol: 'ARTF',
    description: 'Zero-fee NFT marketplace for digital artists',
    image: 'https://images.pexels.com/photos/1181343/pexels-photo-1181343.jpeg?auto=compress&cs=tinysrgb&w=400',
    price: 0.78,
    marketCap: 1580000,
    members: 892,
    change24h: -5.2,
    category: 'NFT'
  },
  {
    id: '3',
    name: 'GameChain',
    symbol: 'GCHAIN',
    description: 'Blockchain gaming platform with true asset ownership',
    image: 'https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg?auto=compress&cs=tinysrgb&w=400',
    price: 1.23,
    marketCap: 4560000,
    members: 2134,
    change24h: 23.8,
    category: 'Gaming'
  },
  {
    id: '4',
    name: 'EcoToken',
    symbol: 'ECO',
    description: 'Carbon-neutral blockchain for environmental projects',
    image: 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=400',
    price: 0.34,
    marketCap: 890000,
    members: 567,
    change24h: 8.7,
    category: 'Sustainability'
  },
  {
    id: '5',
    name: 'SocialFi Hub',
    symbol: 'SOFI',
    description: 'Decentralized social media with token incentives',
    image: 'https://images.pexels.com/photos/267371/pexels-photo-267371.jpeg?auto=compress&cs=tinysrgb&w=400',
    price: 0.67,
    marketCap: 1890000,
    members: 1456,
    change24h: 15.3,
    category: 'Social'
  },
  {
    id: '6',
    name: 'MetaLearn',
    symbol: 'MLEARN',
    description: 'Educational platform with blockchain certificates',
    image: 'https://images.pexels.com/photos/256490/pexels-photo-256490.jpeg?auto=compress&cs=tinysrgb&w=400',
    price: 0.89,
    marketCap: 2100000,
    members: 934,
    change24h: 6.9,
    category: 'Education'
  }
];

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

export const mockReelsData: ReelData[] = [
  {
    id: '1',
    title: 'DeFi Yield Farming Tutorial',
    creator: 'Alex Chen',
    thumbnail: 'https://images.pexels.com/photos/730547/pexels-photo-730547.jpeg?auto=compress&cs=tinysrgb&w=400',
    views: '12.3K',
    likes: 284,
    comments: 45,
    community: 'DeFiMax Protocol',
    duration: '2:34'
  },
  {
    id: '2',
    title: 'NFT Minting Process',
    creator: 'Sarah Martinez',
    thumbnail: 'https://images.pexels.com/photos/1181343/pexels-photo-1181343.jpeg?auto=compress&cs=tinysrgb&w=400',
    views: '8.7K',
    likes: 156,
    comments: 23,
    community: 'ArtFlow NFT',
    duration: '1:45'
  },
  {
    id: '3',
    title: 'GameFi Alpha Demo',
    creator: 'Marcus Thompson',
    thumbnail: 'https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg?auto=compress&cs=tinysrgb&w=400',
    views: '15.2K',
    likes: 412,
    comments: 78,
    community: 'GameChain',
    duration: '3:21'
  },
  {
    id: '4',
    title: 'Carbon Credits Explained',
    creator: 'Emma Wilson',
    thumbnail: 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=400',
    views: '6.1K',
    likes: 203,
    comments: 34,
    community: 'EcoToken',
    duration: '2:18'
  },
  {
    id: '5',
    title: 'Social Token Economy',
    creator: 'David Park',
    thumbnail: 'https://images.pexels.com/photos/267371/pexels-photo-267371.jpeg?auto=compress&cs=tinysrgb&w=400',
    views: '9.8K',
    likes: 298,
    comments: 56,
    community: 'SocialFi Hub',
    duration: '2:52'
  },
  {
    id: '6',
    title: 'Blockchain Certificates',
    creator: 'Lisa Chen',
    thumbnail: 'https://images.pexels.com/photos/256490/pexels-photo-256490.jpeg?auto=compress&cs=tinysrgb&w=400',
    views: '5.4K',
    likes: 167,
    comments: 28,
    community: 'MetaLearn',
    duration: '1:33'
  }
];

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

export const mockPredictionsData: PredictionMarket[] = [
  {
    id: '1',
    title: 'Will SOL reach $500 by end of 2025?',
    description: 'Predict whether Solana will reach $500 USD by December 31, 2025',
    category: 'Crypto',
    totalVolume: 125000,
    participants: 847,
    endDate: '2025-12-31',
    options: [
      { id: '1a', text: 'Yes', probability: 68, volume: 85000 },
      { id: '1b', text: 'No', probability: 32, volume: 40000 }
    ],
    image: 'https://images.pexels.com/photos/730547/pexels-photo-730547.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    id: '2',
    title: 'Next unicorn NFT marketplace',
    description: 'Which NFT marketplace will be the next to reach $1B valuation?',
    category: 'NFT',
    totalVolume: 78000,
    participants: 523,
    endDate: '2025-06-30',
    options: [
      { id: '2a', text: 'OpenSea', probability: 45, volume: 35100 },
      { id: '2b', text: 'Magic Eden', probability: 30, volume: 23400 },
      { id: '2c', text: 'New Platform', probability: 25, volume: 19500 }
    ],
    image: 'https://images.pexels.com/photos/1181343/pexels-photo-1181343.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    id: '3',
    title: 'Web3 Gaming Adoption',
    description: 'Will Web3 games reach 100M+ daily active users by 2025?',
    category: 'Gaming',
    totalVolume: 92000,
    participants: 634,
    endDate: '2025-12-31',
    options: [
      { id: '3a', text: 'Yes', probability: 72, volume: 66240 },
      { id: '3b', text: 'No', probability: 28, volume: 25760 }
    ],
    image: 'https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    id: '4',
    title: 'Climate Tech Breakthrough',
    description: 'Will a major climate tech breakthrough be announced in 2025?',
    category: 'Climate',
    totalVolume: 56000,
    participants: 398,
    endDate: '2025-12-31',
    options: [
      { id: '4a', text: 'Yes', probability: 58, volume: 32480 },
      { id: '4b', text: 'No', probability: 42, volume: 23520 }
    ],
    image: 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=400'
  }
]; 