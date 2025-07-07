import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function BlackjackScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>🃏 Blackjack</Text>
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
