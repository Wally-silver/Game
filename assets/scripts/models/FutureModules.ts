export interface EncyclopediaEntry {
  id: string;
  name: string;
  unlocked: boolean;
}

export interface SpiritProfile {
  id: string;
  name: string;
  level: number;
  skillId: string;
}

export interface ShopItem {
  id: string;
  category: 'inspiration_pack' | 'decoration' | 'spirit_skin' | 'monthly_card';
  price: number;
  title: string;
}

export interface DailyChallengeSummary {
  id: string;
  title: string;
  targetDesc: string;
  rewardGold: number;
}
