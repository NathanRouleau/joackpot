import React, { useRef, useEffect } from 'react';
import { Animated, StyleSheet, TouchableWithoutFeedback, View, ImageSourcePropType } from 'react-native';
import { Card as CardType } from '../types/Card';

// import backCardImage from '../assets/cartes/back.png';
const backCardImage = require('../assets/cartes/back.png');

type Props = {
  card: CardType;
  hidden?: boolean;
  onFlip?: () => void;
  backImage?: ImageSourcePropType;
  scale?: number;
};

export default function FlipCard({ card, hidden = false, onFlip, backImage = backCardImage, scale = 1 }: Props) {
  const flipAnim = useRef(new Animated.Value(hidden ? 180 : 0)).current;

  useEffect(() => {
    Animated.timing(flipAnim, {
      toValue: hidden ? 180 : 0,
      duration: 400,
      useNativeDriver: true,
    }).start(() => onFlip && onFlip());
  }, [hidden]);

  const frontRotate = flipAnim.interpolate({ inputRange: [0, 180], outputRange: ['0deg', '180deg'] });
  const backRotate = flipAnim.interpolate({ inputRange: [0, 180], outputRange: ['180deg', '360deg'] });

  return (
    <TouchableWithoutFeedback>
      <View style={[styles.cardContainer, { width: 60 * scale, height: 90 * scale, marginHorizontal: 5 * scale }]}>
        {/* Dos de la carte */}
        <Animated.Image
          source={ backCardImage }
          style={[styles.card, styles.hiddenFace, { width: 60 * scale, height: 90 * scale, transform: [{ rotateY: frontRotate }] }]}
        />
        {/* Carte de face */}
        <Animated.Image
          source={card.image}
          style={[styles.card, styles.visibleFace, { width: 60 * scale, height: 90 * scale, transform: [{ rotateY: backRotate }] }]}
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
    borderRadius: 4,
    resizeMode: 'contain',
  },
  visibleFace: {
    resizeMode: 'contain',
    borderRadius: 4,
  },
});
