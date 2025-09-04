import { FeedItem } from './types';

export const mockFeedData: FeedItem[] = [
  {
    id: '1',
    creator: {
      name: 'CryptoBuilder',
      avatar: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
      wallet: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM'
    },
    content: {
      type: 'text',
      title: 'Launching DeFiMax - Revolutionary Yield Protocol! 🚀',
      description: 'After months of development, we\'re ready to launch DeFiMax, an automated yield farming protocol that maximizes returns while minimizing risk. Our unique algorithm dynamically allocates funds across multiple DeFi protocols to achieve optimal yields. Join our community and be part of the DeFi revolution!',
      media: 'https://images.pexels.com/photos/730547/pexels-photo-730547.jpeg?auto=compress&cs=tinysrgb&w=800'
    },
    vision: 'To democratize access to high-yield DeFi strategies for everyone',
    socialLinks: {
      twitter: 'https://twitter.com/defimax',
      discord: 'https://discord.gg/defimax',
      github: 'https://github.com/defimax-protocol'
    },
    timestamp: '2024-01-15T10:30:00Z',
    comments: 42,
    likes: 128,
    isLiked: false,
    coinData: {
      symbol: 'DEFM',
      price: 0.45,
      marketCap: 2340000,
      members: 1247,
      change24h: 12.5
    }
  },
  {
    id: '2',
    creator: {
      name: 'NFTArtist',
      avatar: 'https://images.pexels.com/photos/1181343/pexels-photo-1181343.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
      wallet: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU'
    },
    content: {
      type: 'image',
      title: 'ArtFlow: Zero-Fee NFT Marketplace Goes Live! 🎨',
      description: 'We\'re excited to announce the launch of ArtFlow, the first truly zero-fee NFT marketplace for digital artists. No gas fees, no platform fees - just pure creativity flowing freely. Artists keep 100% of their earnings while collectors enjoy seamless transactions.',
      media: 'https://images.pexels.com/photos/1181343/pexels-photo-1181343.jpeg?auto=compress&cs=tinysrgb&w=800'
    },
    vision: 'Empowering artists with a fee-free creative economy',
    socialLinks: {
      twitter: 'https://twitter.com/artflow',
      discord: 'https://discord.gg/artflow'
    },
    timestamp: '2024-01-15T09:15:00Z',
    comments: 67,
    likes: 203,
    isLiked: true,
    coinData: {
      symbol: 'ARTF',
      price: 0.78,
      marketCap: 1580000,
      members: 892,
      change24h: -5.2
    }
  },
  {
    id: '3',
    creator: {
      name: 'GameDev',
      avatar: 'https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
      wallet: '5uNrM8jDDd8NcJqjgZjKcXwPQqjqZqJuJqjqZqJqjqZ'
    },
    content: {
      type: 'video',
      title: 'GameChain Alpha Demo - Play to Earn is Here! 🎮',
      description: 'Check out our first gameplay footage from GameChain Alpha! Players can truly own their in-game assets as NFTs and earn tokens through skilled gameplay. The future of gaming is here, and it\'s decentralized!',
      media: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'
    },
    vision: 'True ownership and earning potential in gaming',
    socialLinks: {
      twitter: 'https://twitter.com/gamechain',
      discord: 'https://discord.gg/gamechain',
      github: 'https://github.com/gamechain'
    },
    timestamp: '2024-01-15T08:00:00Z',
    comments: 89,
    likes: 345,
    isLiked: false,
    coinData: {
      symbol: 'GCHAIN',
      price: 1.23,
      marketCap: 4560000,
      members: 2134,
      change24h: 23.8
    }
  },
  {
    id: '4',
    creator: {
      name: 'EcoWarrior',
      avatar: 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
      wallet: '8vKYs9NDFGJKDFGJKDFGJKDFGJKDFGJKDFGJKDFGJKs'
    },
    content: {
      type: 'link',
      title: 'EcoToken: First Carbon-Neutral Blockchain Network 🌱',
      description: 'Proud to introduce EcoToken, built on the world\'s first carbon-neutral blockchain. Every transaction plants a tree and supports environmental projects. Join us in building a sustainable future while earning rewards!',
      url: 'https://ecotoken.green'
    },
    vision: 'Sustainable blockchain technology for environmental impact',
    socialLinks: {
      twitter: 'https://twitter.com/ecotoken'
    },
    timestamp: '2024-01-15T07:30:00Z',
    comments: 34,
    likes: 156,
    isLiked: true,
    coinData: {
      symbol: 'ECO',
      price: 0.34,
      marketCap: 890000,
      members: 567,
      change24h: 8.7
    }
  },
  {
    id: '5',
    creator: {
      name: 'SocialBuilder',
      avatar: 'https://images.pexels.com/photos/267371/pexels-photo-267371.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
      wallet: '3hFGHJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstu'
    },
    content: {
      type: 'text',
      title: 'SocialFi Hub: Decentralized Social Media with Rewards 💬',
      description: 'Introducing SocialFi Hub - where your social interactions earn you tokens! Post, comment, share, and build communities while earning rewards. No ads, no data harvesting, just pure social value creation.',
      media: 'https://images.pexels.com/photos/267371/pexels-photo-267371.jpeg?auto=compress&cs=tinysrgb&w=800'
    },
    vision: 'Rewarding genuine social connections and content creation',
    socialLinks: {
      twitter: 'https://twitter.com/socialfihub',
      discord: 'https://discord.gg/socialfihub'
    },
    timestamp: '2024-01-15T06:45:00Z',
    comments: 78,
    likes: 267,
    isLiked: false,
    coinData: {
      symbol: 'SOFI',
      price: 0.67,
      marketCap: 1890000,
      members: 1456,
      change24h: 15.3
    }
  }
]; 