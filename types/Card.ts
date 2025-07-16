export type Suit = 'Pique' | 'Trefle' | 'Carreau' | 'Coeur';
export type Value = 'As' | 'Deux' | 'Trois' | 'Quatre' | 'Cinq' | 'Six' | 'Sept' | 'Huit' | 'Neuf' | 'Dix' | 'Valet' | 'Dame' | 'Roi';

export interface Card {
  suit: Suit;
  value: Value;
  image: any;
}
