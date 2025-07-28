import React from 'react';
import { Image, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { chipImages } from '../utils/chipImages';

type Props = {
  value: number;
  bet: number;
  setBet: (n: number) => void;
  credits: number;
};

export default function Chip({ value, bet, setBet, credits }: Props) {
  const disabled = credits < value;
  const source = chipImages[value];

  return (
    <TouchableOpacity
      onPress={() => !disabled && setBet(bet + value)}
      style={[styles.wrapper, disabled && { opacity: 0.3 }]}
      disabled={disabled}
    >
      <Image source={source} style={styles.img} />
      <Text style={styles.label}>+{value}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', marginHorizontal: 4 },
  img: { width: 45, height: 45 },
  label: { color: 'white', fontSize: 12, marginTop: -6 },
});
