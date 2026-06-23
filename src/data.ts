import { SodaSpotting, SodaFlavor, UserFinder } from './types';

// Hard-to-find soda flavors
export const SPECIALTY_FLAVORS: SodaFlavor[] = [
  {
    id: 'mello-yello-zero',
    name: 'Mello Yello Zero Sugar',
    brand: 'The Coca-Cola Company',
    category: 'Soda',
    rarityScore: 9,
    description: 'Crisp, citrusy carbonation without the calories. Notoriously elusive in retail shelves, often replaced by standard diets or Coca-Cola Zero Sugar.'
  },
  {
    id: 'surge',
    name: 'Surge Original Citrus',
    brand: 'The Coca-Cola Company',
    category: 'Soda',
    rarityScore: 10,
    description: 'The legendary ultra-caffeinated 90s citrus blast. Spotting a classic can is like finding liquid gold.'
  },
  {
    id: 'dew-pitch-black',
    name: 'Mountain Dew Pitch Black',
    brand: 'PepsiCo',
    category: 'Soda',
    rarityScore: 8,
    description: 'A dark, punchy, grape-citrus twist that surfaces in limited-run canisters and random fountain streams.'
  },
  {
    id: 'tahitian-treat',
    name: 'Tahitian Treat Fruit Punch',
    brand: 'Keurig Dr Pepper',
    category: 'Soda',
    rarityScore: 7,
    description: 'Unbelievably rich fruit punch sparkling flavor. Extremely popular retro formulation that sells out within hours of delivery.'
  },
  {
    id: 'sprite-cherry-zero',
    name: 'Cherry Sprite Zero Sugar',
    brand: 'The Coca-Cola Company',
    category: 'Soda',
    rarityScore: 8,
    description: 'The sublime combination of refreshing lime-lemon sprite and clean cherry undertones, with zero sugar.'
  },
  {
    id: 'irn-bru',
    name: 'Barr Irn-Bru (Original)',
    brand: 'A.G. Barr',
    category: 'Rare Import',
    rarityScore: 9,
    description: 'Scotland’s famous secondary national drink. A proprietary blend of fruit notes, citrus, and a subtle metallic buzz.'
  },
  {
    id: 'coke-vanilla-zero',
    name: 'Vanilla Coke Zero Sugar',
    brand: 'The Coca-Cola Company',
    category: 'Soda',
    rarityScore: 6,
    description: 'Smooth, rich vanilla extract perfectly layered into Coca-Cola Zero Sugar. Surprisingly sparse across standard grocery distributions.'
  },
  {
    id: 'monster-ultra-red',
    name: 'Monster Energy Ultra Red',
    brand: 'Monster Energy',
    category: 'Energy Drink',
    rarityScore: 7,
    description: 'Refreshing crisp mixed berry flavor. Mostly phased out in typical gas stations, sparking a fervent subculture of seekers.'
  }
];

// Rich set of spottings around Atlanta, GA (centered approximately at 33.7490, -84.3880)
export const INITIAL_SPOTTINGS: SodaSpotting[] = [
  {
    id: 'spot-1',
    flavorId: 'mello-yello-zero',
    flavorName: 'Mello Yello Zero Sugar',
    brand: 'The Coca-Cola Company',
    category: 'Soda',
    storeName: 'Kroger Midtown Mall',
    storeAddress: '800 Glenwood Ave SE, Atlanta, GA 30316',
    latitude: 33.7405,
    longitude: -84.3465,
    stockLevel: 'Full Shelf',
    price: 6.99,
    size: '12-Pack (12 oz Cans)',
    reportedBy: 'CitrusEnthusiast',
    reportedByReputation: 450,
    reportedTime: '2 hours ago',
    confirmations: 12,
    denials: 1,
    comments: [
      {
        id: 'c-1',
        username: 'FizzMasterAtlanta',
        userReputation: 280,
        text: 'Can confirm! They have an entire standee at Isle 4. Grabbed three 12-packs!',
        time: '1 hour ago'
      },
      {
        id: 'c-2',
        username: 'SodaSeeker99',
        userReputation: 120,
        text: 'Still a high stack left as of 4 PM. Best day ever, the drought is over!',
        time: '30 mins ago'
      }
    ],
    storeRating: 4.8
  },
  {
    id: 'spot-2',
    flavorId: 'surge',
    flavorName: 'Surge Original Citrus',
    brand: 'The Coca-Cola Company',
    category: 'Soda',
    storeName: 'Corner Specialty Imports',
    storeAddress: '422 Moreland Ave NE, Atlanta, GA 30307',
    latitude: 33.7661,
    longitude: -84.3496,
    stockLevel: 'Low',
    price: 3.49,
    size: '16 oz Can',
    reportedBy: 'Nostalgia90s',
    reportedByReputation: 890,
    reportedTime: '5 hours ago',
    confirmations: 18,
    denials: 2,
    comments: [
      {
        id: 'c-3',
        username: 'RetroGlitch',
        userReputation: 60,
        text: 'Only about 4 loose cans left on the bottom shelf behind the energy drinks.',
        time: '3 hours ago'
      }
    ],
    storeRating: 4.2
  },
  {
    id: 'spot-3',
    flavorId: 'mello-yello-zero',
    flavorName: 'Mello Yello Zero Sugar',
    brand: 'The Coca-Cola Company',
    category: 'Soda',
    storeName: 'Target Supercenter Buckhead',
    storeAddress: '3535 Peachtree Rd NE, Atlanta, GA 30326',
    latitude: 33.8492,
    longitude: -84.3621,
    stockLevel: 'Medium',
    price: 7.29,
    size: '12-Pack (12 oz Cans)',
    reportedBy: 'MelloYelloMegaFan',
    reportedByReputation: 620,
    reportedTime: '1 day ago',
    confirmations: 8,
    denials: 0,
    comments: [
      {
        id: 'c-4',
        username: 'GeorgiaPeach',
        userReputation: 95,
        text: 'Got some! They were tucked behind the Diet Cokes in the back row.',
        time: '18 hours ago'
      }
    ],
    storeRating: 4.5
  },
  {
    id: 'spot-4',
    flavorId: 'tahitian-treat',
    flavorName: 'Tahitian Treat Fruit Punch',
    brand: 'Keurig Dr Pepper',
    category: 'Soda',
    storeName: 'Publix Decatur Crossing',
    storeAddress: '2000 N Decatur Rd, Decatur, GA 30033',
    latitude: 33.7915,
    longitude: -84.3015,
    stockLevel: 'Full Shelf',
    price: 2.29,
    size: '20 oz Bottle',
    reportedBy: 'PunchLover',
    reportedByReputation: 140,
    reportedTime: '3 hours ago',
    confirmations: 5,
    denials: 0,
    comments: [],
    storeRating: 4.0
  },
  {
    id: 'spot-5',
    flavorId: 'irn-bru',
    flavorName: 'Barr Irn-Bru (Original)',
    brand: 'A.G. Barr',
    category: 'Rare Import',
    storeName: 'Ansley Wine & Imports',
    storeAddress: '1544 Piedmont Ave NE, Atlanta, GA 30324',
    latitude: 33.7972,
    longitude: -84.3685,
    stockLevel: 'Medium',
    price: 4.99,
    size: '16.9 oz Glass Bottle',
    reportedBy: 'ScottishAbroad',
    reportedByReputation: 320,
    reportedTime: '2 days ago',
    confirmations: 14,
    denials: 1,
    comments: [
      {
        id: 'c-5',
        username: 'GlasgowGuy',
        userReputation: 210,
        text: 'Real sugar glass bottles imported directly. A bit pricey but 100% authentic!',
        time: '1 day ago'
      }
    ],
    storeRating: 5.0
  },
  {
    id: 'spot-6',
    flavorId: 'dew-pitch-black',
    flavorName: 'Mountain Dew Pitch Black',
    brand: 'PepsiCo',
    category: 'Soda',
    storeName: 'Chevron Gas & Food',
    storeAddress: '1002 North Ave NE, Atlanta, GA 30306',
    latitude: 33.7721,
    longitude: -84.3524,
    stockLevel: 'Out of Stock',
    price: 2.39,
    size: '20 oz Bottle',
    reportedBy: 'DewDisciples',
    reportedByReputation: 50,
    reportedTime: '4 hours ago',
    confirmations: 2,
    denials: 6,
    comments: [
      {
        id: 'c-6',
        username: 'ColdCanColt',
        userReputation: 40,
        text: 'Completely cleaned out. The cashier said they might get another flat next Tuesday.',
        time: '2 hours ago'
      }
    ],
    storeRating: 3.1
  },
  {
    id: 'spot-7',
    flavorId: 'sprite-cherry-zero',
    flavorName: 'Cherry Sprite Zero Sugar',
    brand: 'The Coca-Cola Company',
    category: 'Soda',
    storeName: 'Kroger Ponce De Leon',
    storeAddress: '725 Ponce De Leon Ave NE, Atlanta, GA 30308',
    latitude: 33.7745,
    longitude: -84.3629,
    stockLevel: 'High',
    price: 6.49,
    size: '12-Pack (12 oz Cans)',
    reportedBy: 'ZestyAura',
    reportedByReputation: 310,
    reportedTime: '12 hours ago',
    confirmations: 9,
    denials: 0,
    comments: [],
    storeRating: 4.4
  }
];

// Leaderboard finder ranking ("rank listers based off how well they find and rank the items")
export const TOP_FINDERS: UserFinder[] = [
  {
    username: 'Nostalgia90s',
    rank: 1,
    reputationPoints: 1250,
    contributionsCount: 42,
    accuracyRate: 98,
    badge: 'Sip Master',
    avatarColor: 'from-purple-500 to-indigo-600'
  },
  {
    username: 'CitrusEnthusiast',
    rank: 2,
    reputationPoints: 980,
    contributionsCount: 31,
    accuracyRate: 96,
    badge: 'Carbonation King',
    avatarColor: 'from-amber-400 to-orange-600'
  },
  {
    username: 'MelloYelloMegaFan',
    rank: 3,
    reputationPoints: 840,
    contributionsCount: 26,
    accuracyRate: 94,
    badge: 'Nectar Hunter',
    avatarColor: 'from-yellow-400 to-emerald-600'
  },
  {
    username: 'ScottishAbroad',
    rank: 4,
    reputationPoints: 610,
    contributionsCount: 19,
    accuracyRate: 92,
    badge: 'Flavor Scout',
    avatarColor: 'from-blue-500 to-cyan-600'
  },
  {
    username: 'FizzMasterAtlanta',
    rank: 5,
    reputationPoints: 530,
    contributionsCount: 15,
    accuracyRate: 95,
    badge: 'Fizz Cadet',
    avatarColor: 'from-teal-400 to-emerald-500'
  }
];
