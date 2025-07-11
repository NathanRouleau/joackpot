import { Image, StyleSheet } from 'react-native';
import { Card as CardType } from '../types/Card';

type Props = {
  card: CardType;
  hidden?: boolean;
};

export default function Card({ card, hidden = false }: Props) {
  const source = hidden
    ? require('../assets/cartes/back.png')
    : card.image;

  return <Image source={source} style={styles.card} />;
}

const styles = StyleSheet.create({
  card: {
    width: 60,
    height: 90,
    resizeMode: 'contain',
    marginHorizontal: 5,
  },
});
