export type Suit = 'Pique' | 'Trefle' | 'Carreau' | 'Coeur';
export type Value = 'As' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'Valet' | 'Dame' | 'Roi';

export interface Card {
  suit: Suit;
  value: Value;
  image: any;
}
