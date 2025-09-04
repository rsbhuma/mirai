import { ReelData, PredictionMarket } from './types';

export const mockReelsData: ReelData[] = [
  {
    id: '1',
    title: 'DeFi Explained in 60 Seconds',
    creator: 'CryptoPro',
    thumbnail: 'https://images.pexels.com/photos/730547/pexels-photo-730547.jpeg?auto=compress&cs=tinysrgb&w=400',
    views: '12.5K',
    likes: 847,
    comments: 23,
    community: 'DeFi Education',
    duration: '0:58'
  },
  {
    id: '2',
    title: 'NFT Art Creation Process',
    creator: 'DigitalArtist',
    thumbnail: 'https://images.pexels.com/photos/1181343/pexels-photo-1181343.jpeg?auto=compress&cs=tinysrgb&w=400',
    views: '8.3K',
    likes: 562,
    comments: 45,
    community: 'NFT Creators',
    duration: '2:34'
  },
  {
    id: '3',
    title: 'Gaming NFTs: The Future',
    creator: 'GameChainDev',
    thumbnail: 'https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg?auto=compress&cs=tinysrgb&w=400',
    views: '15.7K',
    likes: 1203,
    comments: 89,
    community: 'Blockchain Gaming',
    duration: '3:42'
  },
  {
    id: '4',
    title: 'Sustainable Crypto Mining',
    creator: 'EcoMiner',
    thumbnail: 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=400',
    views: '6.9K',
    likes: 421,
    comments: 67,
    community: 'Green Crypto',
    duration: '4:17'
  },
  {
    id: '5',
    title: 'Social Token Economics',
    creator: 'TokenEconomist',
    thumbnail: 'https://images.pexels.com/photos/267371/pexels-photo-267371.jpeg?auto=compress&cs=tinysrgb&w=400',
    views: '9.2K',
    likes: 678,
    comments: 34,
    community: 'SocialFi',
    duration: '1:45'
  }
];

export const mockPredictionsData: PredictionMarket[] = [
  {
    id: '1',
    title: 'Will Bitcoin reach $100K by end of 2024?',
    description: 'Market prediction on Bitcoin price target',
    category: 'Cryptocurrency',
    totalVolume: 45000,
    participants: 234,
    endDate: '2024-12-31T23:59:59Z',
    options: [
      { id: 'yes', text: 'Yes, $100K+', probability: 68, volume: 30600 },
      { id: 'no', text: 'No, below $100K', probability: 32, volume: 14400 }
    ],
    image: 'https://images.pexels.com/photos/730547/pexels-photo-730547.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    id: '2',
    title: 'Next major NFT trend',
    description: 'What will be the dominant NFT category in 2024?',
    category: 'NFTs',
    totalVolume: 28000,
    participants: 156,
    endDate: '2024-06-30T23:59:59Z',
    options: [
      { id: 'gaming', text: 'Gaming NFTs', probability: 45, volume: 12600 },
      { id: 'art', text: 'Digital Art', probability: 35, volume: 9800 },
      { id: 'utility', text: 'Utility NFTs', probability: 20, volume: 5600 }
    ],
    image: 'https://images.pexels.com/photos/1181343/pexels-photo-1181343.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    id: '3',
    title: 'DeFi TVL growth prediction',
    description: 'Will DeFi Total Value Locked exceed $200B in 2024?',
    category: 'DeFi',
    totalVolume: 32000,
    participants: 189,
    endDate: '2024-12-31T23:59:59Z',
    options: [
      { id: 'yes', text: 'Yes, over $200B', probability: 72, volume: 23040 },
      { id: 'no', text: 'No, under $200B', probability: 28, volume: 8960 }
    ],
    image: 'https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    id: '4',
    title: 'Ethereum 2.0 impact on gas fees',
    description: 'Will average gas fees drop below $5 by mid-2024?',
    category: 'Ethereum',
    totalVolume: 38000,
    participants: 267,
    endDate: '2024-07-15T23:59:59Z',
    options: [
      { id: 'yes', text: 'Yes, under $5', probability: 58, volume: 22040 },
      { id: 'no', text: 'No, $5 or above', probability: 42, volume: 15960 }
    ],
    image: 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=400'
  }
]; 