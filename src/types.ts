export type StockLevel = 'Full Shelf' | 'High' | 'Medium' | 'Low' | 'Out of Stock';

export interface SodaSpotting {
  id: string;
  flavorId: string;
  flavorName: string;
  brand: string;
  category: 'Soda' | 'Energy Drink' | 'Tea/Juice' | 'Rare Import' | 'Seltzer';
  storeName: string;
  storeAddress: string;
  latitude: number;
  longitude: number;
  stockLevel: StockLevel;
  price?: number;
  size: string; // e.g., '12 oz Can', '20 oz Bottle', '12-Pack'
  reportedBy: string;
  reportedByReputation: number;
  reportedTime: string;
  confirmations: number;
  denials: number;
  userVoted?: 'confirm' | 'deny';
  comments: Comment[];
  storeRating: number; // 1-5 store specialty rating
}

export interface Comment {
  id: string;
  username: string;
  userReputation: number;
  text: string;
  time: string;
}

export interface SodaFlavor {
  id: string;
  name: string;
  brand: string;
  category: SodaSpotting['category'];
  rarityScore: number; // 1-10 (10 being impossible to find)
  description: string;
}

export interface UserFinder {
  userId?: string;
  username: string;
  rank?: number;
  reputationPoints: number;
  contributionsCount: number;
  accuracyRate: number; // percentage
  badge: 'Sip Master' | 'Carbonation King' | 'Nectar Hunter' | 'Flavor Scout' | 'Fizz Cadet';
  avatarColor: string;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
}
