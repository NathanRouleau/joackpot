// components/Hand.tsx
import { View, StyleSheet } from 'react-native';
import FlipCard from './FlipCard';
import { Card as CardType } from '../types/Card';

type Props = {
  cards: CardType[];
  flipped: boolean[];
};

export default function Hand({ cards, flipped }: Props) {
  return (
    <View style={styles.container}>
      {cards.map((card, idx) => (
        <FlipCard
          key={idx}
          card={card}
          hidden={flipped[idx]}   // dos si false, face si true
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10,
  },
});
