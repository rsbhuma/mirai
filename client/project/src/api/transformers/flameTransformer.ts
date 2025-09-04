import { CoinData } from "@/store/coinStore";

export const transformFlameToCoin = (flame: any): CoinData => ({
  id: flame.id,
  name: flame.name,
  symbol: flame.symbol,
  image: flame.image,
  description: flame.description,
  creator: '', // Not available in FlameData
  price: flame.price,
  marketCap: flame.marketCap,
  members: flame.members,
  change24h: flame.change24h,
  category: flame.category,
  totalSupply: 0, // Not available in FlameData
  circulatingSupply: 0, // Not available in FlameData
  volume24h: 0, // Not available in FlameData
  allTimeHigh: 0, // Not available in FlameData
  allTimeLow: 0, // Not available in FlameData
  launchDate: '', // Not available in FlameData
  socialLinks: {}, // Not available in FlameData
  mint: '', // Not available in FlameData
}); 