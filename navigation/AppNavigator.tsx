import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import HomeScreen from '../screens/HomeScreen';
import BlackjackScreen from '../screens/BlackjackScreen';
import RouletteScreen from '../screens/RouletteScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Blackjack" component={BlackjackScreen} />
        <Stack.Screen name="Roulette" component={RouletteScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
