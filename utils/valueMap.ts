// utils/valueMap.ts  (ou directement dans BlackjackScreen)
import { Value } from '../types/Card';

export const points: Record<Value, number> = {
  As   : 1,
  Deux : 2,
  Trois: 3,
  Quatre: 4,
  Cinq : 5,
  Six  : 6,
  Sept : 7,
  Huit : 8,
  Neuf : 9,
  Dix  : 10,
  Valet: 10,
  Dame : 10,
  Roi  : 10,
};
