import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function SlotMachineScreen() {
  return (
    <LinearGradient
      colors={['#394a58', '#1c1c1e']}
      style={styles.container}
    >
      {/* Titre temporaire */}
      <Text style={styles.title}>🎰 JOAckpot</Text>

      {/* Rouleaux (placeholder pour l’instant) */}
      <View style={styles.reelsContainer}>
        <Text style={styles.reel}>🍒</Text>
        <Text style={styles.reel}>🍋</Text>
        <Text style={styles.reel}>🍇</Text>
      </View>

      {/* Boutons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => console.log('SPIN lancé')}
        >
          <Text style={styles.buttonText}>SPIN</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => console.log('Mise augmentée')}
        >
          <Text style={styles.buttonText}>+ Mise</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 80,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  reelsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  reel: {
    fontSize: 48,
  },
  buttonsContainer: {
    marginBottom: 60,
    flexDirection: 'row',
    gap: 20,
  },
  button: {
    backgroundColor: '#f2c94c',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  buttonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
});
