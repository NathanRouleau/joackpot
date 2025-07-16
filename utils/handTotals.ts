import { Card } from '../types/Card';
import { points } from './valueMap';

export const getHandTotals = (hand: Card[]) => {
  let totalMin = 0;
  let aces = 0;

  hand.forEach(c => {
    if (c.value === 'As') aces += 1;
    totalMin += points[c.value];       // As = 1 ici
  });

  const possibleTotals: number[] = [totalMin];

  // S’il y a au moins un As et qu’on peut ajouter 10 sans bust
  if (aces > 0 && totalMin + 10 <= 21) {
    possibleTotals.push(totalMin + 10);
  }

  return possibleTotals;
};
