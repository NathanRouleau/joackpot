// components/Hand.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import FlipCard from './FlipCard';
import { Card as CardType } from '../types/Card';

type Props = {
  cards: CardType[];
  flipped: boolean[];
  stacked?: boolean;
  scale?: number;
};

const BASE_W = 60;
const BASE_H = 90;

export default function Hand({ cards, flipped, stacked = false, scale = 1 }: Props) {
  const isFaceUp = (i: number) => !flipped?.[i];

  if (!stacked) {
    // ======= MODE À PLAT =======
    return (
      <View style={[styles.rowContainer]}>
        {cards.map((card, idx) => (
          <View key={idx} style={{ marginHorizontal: 5 }}>
            <FlipCard card={card} hidden={!isFaceUp(idx)} />
          </View>
        ))}
      </View>
    );
  }

  // ======= MODE STACKED =======
  const OFFSET_X = 28 * scale;  // décale moins si scale < 1
  const OFFSET_Y = 12 * scale;

  const width  = BASE_W * scale + Math.max(0, cards.length - 1) * OFFSET_X;
  const height = BASE_H * scale + Math.max(0, cards.length - 1) * OFFSET_Y;

  return (
    <View style={[styles.stackContainer, { width, height }]}>
      {cards.map((card, idx) => (
        <View
          key={idx}
          style={{
            position: 'absolute',
            left: idx * OFFSET_X,
            bottom: idx * OFFSET_Y,
            zIndex: idx,
          }}
        >
          <FlipCard card={card} hidden={!isFaceUp(idx)} scale={scale} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: BASE_H, // réserve la place des cartes
  },
  stackContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
});
