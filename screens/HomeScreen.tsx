import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;
export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎰 Bienvenue sur JOAckpot !</Text>

      {/* BLACKJACK */}
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Blackjack')}>
        <Text style={styles.buttonText}>🃏 Jouer au Blackjack</Text>
      </TouchableOpacity>

      {/* ROULETTE */}
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Roulette')}>
        <Text style={styles.buttonText}>🎯 Jouer à la Roulette</Text>
      </TouchableOpacity>

      {/* MACHINE À SOUS */}
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('SlotMachine')}>
        <Text style={styles.buttonText}>🎰 Jouer à la machine à sous</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111',
  },
  title: {
    fontSize: 24, color: '#FFD700', marginBottom: 40, fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#FFD700', padding: 15, borderRadius: 10, marginVertical: 10,
  },
  buttonText: {
    fontSize: 18, color: '#111', fontWeight: '600',
  },
});
