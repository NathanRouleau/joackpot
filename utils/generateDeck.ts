import { Card, Suit, Value } from '../types/Card';
import { shuffle } from './shuffle';
import cardImages from '../assets/cartes';

export const generateDeck = (numberOfDecks: number = 6): Card[] => {
  const suits: Suit[]  = ['Pique', 'Trefle', 'Carreau', 'Coeur'];
  const values: Value[] = ['As','2','3','4','5','6','7','8','9','10','Valet','Dame','Roi'];

  const deck: Card[] = [];

  for (let n = 0; n < numberOfDecks; n++) {
    suits.forEach(suit => {
      values.forEach(value => {
        const key = `${value}De${suit}` as keyof typeof cardImages; // ex : "ValetDePique"
        deck.push({
          suit,
          value,
          image: cardImages[key],
        });
      });
    });
  }

  return shuffle(deck);
};
