import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import HomeScreen from '../screens/HomeScreen';
import BlackjackScreen from '../screens/BlackjackScreen';
import RouletteScreen from '../screens/RouletteScreen';
import SlotMachineScreen from '../screens/SlotMachineScreen';
import { useAuth } from '../supabase/AuthContext';
import LoginScreen from '../screens/LoginScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { user, loading } = useAuth();
  
  if (loading) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Blackjack" component={BlackjackScreen} />
            <Stack.Screen name="Roulette" component={RouletteScreen} />
            <Stack.Screen name="SlotMachine" component={SlotMachineScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
