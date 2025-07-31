import React, { useRef, useEffect } from 'react';
import {
  Animated,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Card as CardType } from '../types/Card';

type Props = {
  card: CardType;
  hidden?: boolean;
  onFlip?: () => void;
};

export default function FlipCard({ card, hidden = false, onFlip }: Props) {
  // Toujours synchroniser avec la prop !
  const flipAnim = useRef(new Animated.Value(hidden ? 180 : 0)).current;

  useEffect(() => {
    Animated.timing(flipAnim, {
      toValue: hidden ? 180 : 0,
      duration: 400,
      useNativeDriver: true,
    }).start(() => onFlip && onFlip());
    // eslint-disable-next-line
  }, [hidden]);

  const frontRotate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });
  const backRotate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  return (
    <TouchableWithoutFeedback>
      <View style={styles.cardContainer}>
        {/* Dos de la carte */}
        <Animated.View
          style={[
            styles.card,
            styles.hiddenFace,
            { transform: [{ rotateY: frontRotate }] },
          ]}
        />
        {/* Face valeur */}
        <Animated.Image
          source={card.image}
          style={[
            styles.card,
            styles.visibleFace,
            { transform: [{ rotateY: backRotate }] },
          ]}
        />
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: 60,
    height: 90,
    marginHorizontal: 5,
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
  },
  hiddenFace: {
    backgroundColor: '#222',
    borderRadius: 4,
  },
  visibleFace: {
    resizeMode: 'contain',
    borderRadius: 4,
  },
});
