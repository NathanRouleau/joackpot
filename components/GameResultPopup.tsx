// components/GameResultPopup.tsx
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

type Props = {
  visible: boolean;
  message: string;
  color?: string;
  onHide?: () => void;
};

export default function GameResultPopup({ visible, message, color = '#fff', onHide }: Props) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0);
      rotateAnim.setValue(0);
      opacityAnim.setValue(0);

      Animated.sequence([
        Animated.parallel([
          Animated.timing(opacityAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
          Animated.spring(scaleAnim, { toValue: 1.2, friction: 3, useNativeDriver: true }),
          Animated.timing(rotateAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]),
        Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 60, useNativeDriver: true }),
        Animated.delay(1500),
        Animated.parallel([
          Animated.timing(opacityAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 0.8, duration: 400, useNativeDriver: true }),
        ])
      ]).start(() => onHide && onHide());
    }
  }, [visible]);

  if (!visible) return null;

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-5deg', '5deg'],
  });

  return (
    <View style={styles.overlay} pointerEvents="none">
      <Animated.Text
        style={[
          styles.text,
          { color },
          {
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }, { rotate }],
          }
        ]}
      >
        {message}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)', // semi-transparent
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  text: {
    fontSize: 80, // XXL
    fontWeight: '900',
    textAlign: 'center',
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 4, height: 4 },
    textShadowRadius: 8,
    fontFamily: 'Cinzel'
  }
});
