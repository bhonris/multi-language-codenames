export type CardColor = 'red' | 'blue' | 'neutral' | 'traitor';
export type CardLang = 'en' | 'th';

export interface Card {
  index: number;
  word: string;
  lang: CardLang;
  color: CardColor;
  revealed: boolean;
}

export interface CardPublic {
  index: number;
  word: string;
  lang: CardLang;
  color: CardColor | null;
  revealed: boolean;
}
