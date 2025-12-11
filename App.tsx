import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AppNavigator from './navigation/AppNavigator';
import { useFonts } from 'expo-font';
import { AuthProvider } from './supabase/AuthContext';
import * as Linking from 'expo-linking';
import { supabase } from './supabase/supabaseClient'; 

export default function App() {
  const [fontsLoaded] = useFonts({
    Cinzel: require('./assets/fonts/Cinzel-Regular.ttf'),
    'Cinzel-Bold': require('./assets/fonts/Cinzel-Bold.ttf'),
  });

  // Gestion du Deep Linking (Redirection après clic mail)
  useEffect(() => {
    const handleDeepLink = async ({ url }: { url: string }) => {
      console.log('🔗 URL reçue dans App:', url);

      // Si l'URL contient des tokens (access_token, refresh_token)
      // C'est souvent sous la forme : exp://...#access_token=xyz&...
      if (url && (url.includes('access_token') || url.includes('refresh_token'))) {
        
        // Petite fonction pour extraire les paramètres proprement
        const extractParams = (href: string) => {
          const params: { [key: string]: string } = {};
          // On regarde après le '#' ou le '?'
          const queryString = href.split('#')[1] || href.split('?')[1];
          if (queryString) {
            queryString.split('&').forEach(param => {
              const [key, value] = param.split('=');
              params[key] = decodeURIComponent(value);
            });
          }
          return params;
        };

        const params = extractParams(url);
        
        // Si on a trouvé les tokens, on force la session Supabase
        if (params.access_token && params.refresh_token) {
          console.log('✅ Tokens trouvés, connexion manuelle...');
          const { error } = await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
          });
          if (error) console.error('Erreur setSession:', error);
        }
      }
    };

    // 1. Écouter si l'app s'ouvre depuis un état "tué" (Cold start)
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    // 2. Écouter si l'app était en arrière-plan (Warm start)
    const subscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      subscription.remove();
    };
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#000' }}>
        <ActivityIndicator size="large" color="#FFD700" />
      </View>
    );
  }

  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}