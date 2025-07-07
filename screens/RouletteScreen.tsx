import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function RouletteScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>🎯 Roulette</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111',
  },
  text: {
    fontSize: 24, color: 'white',
  },
});
