import { View, StyleSheet } from 'react-native';
import Card from './Card';
import { Card as CardType } from '../types/Card';

type Props = {
  cards: CardType[];
  hideFirst?: boolean;
};

export default function Hand({ cards, hideFirst = false }: Props) {
  return (
    <View style={styles.container}>
      {cards.map((card, index) => (
        <Card key={index} card={card} hidden={hideFirst && index === 0} />
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
