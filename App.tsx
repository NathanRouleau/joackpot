import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import AppNavigator from './navigation/AppNavigator';
import { useFonts } from 'expo-font';
import { AuthProvider } from './supabase/AuthContext';

export default function App() {
  const [fontsLoaded] = useFonts({
    Cinzel: require('./assets/fonts/Cinzel-Regular.ttf'),
    'Cinzel-Bold': require('./assets/fonts/Cinzel-Bold.ttf'),
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <AuthProvider>
      <AppNavigator />;
    </AuthProvider>
  );
}

