import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../supabase/supabaseClient';
import * as Linking from 'expo-linking'; // Import important pour la redirection

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  // Création automatique de l'URL de redirection correcte
  // Sur Expo Go, ça ressemblera à exp://192.168.x.x:8081
  // En prod, ça sera joackpot://
  const redirectUrl = Linking.createURL('/');

  useEffect(() => {
    console.log("🔗 URL de redirection à ajouter dans Supabase :", redirectUrl);
  }, [redirectUrl]);

  // Gestion de la création du joueur après connexion
  useEffect(() => {
    const checkUserAndCreateProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Vérifie si le profil joueur existe déjà
        const { data: player, error } = await supabase
          .from('players')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!player && !error) {
          // Création du profil initial
          const { error: insertError } = await supabase.from('players').insert({
            id: user.id,
            email: user.email,
            credits: 1000,
            last_login: new Date().toISOString(),
          });
          
          if (insertError) console.error("Erreur création profil:", insertError);
        } else if (player) {
          await supabase
            .from('players')
            .update({ last_login: new Date().toISOString() })
            .eq('id', user.id);
        }
      }
    };

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        checkUserAndCreateProfile();
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert('Oups', 'Entre ton email pour jouer !');
      return;
    }

    setLoading(true);
    
    // On passe l'URL de redirection à Supabase
    const { error } = await supabase.auth.signInWithOtp({ 
      email,
      options: {
        emailRedirectTo: redirectUrl, 
        shouldCreateUser: true,
      }
    });

    setLoading(false);

    if (error) {
      Alert.alert('Erreur', error.message);
    } else {
      Alert.alert(
        'Vérifie tes mails 📧', 
        "Un lien magique t'a été envoyé. Clique dessus pour revenir automatiquement ici !"
      );
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient
        colors={['#1a1a1a', '#000000']}
        style={styles.background}
      >
        <View style={styles.logoContainer}>
          <Text style={styles.emoji}>🎰</Text>
          <Text style={styles.title}>JOAckpot</Text>
          <Text style={styles.subtitle}>Le casino dans ta poche</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.label}>Connecte-toi pour jouer</Text>
          
          <TextInput
            placeholder="ton.email@exemple.com"
            placeholderTextColor="#666"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />

          <TouchableOpacity 
            style={styles.button} 
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.buttonText}>Recevoir mon lien magique</Text>
            )}
          </TouchableOpacity>
          
          <Text style={styles.disclaimer}>
            Pas besoin de mot de passe. On t'envoie un lien sécurisé par email.
          </Text>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1, justifyContent: 'center', padding: 24 },
  logoContainer: { alignItems: 'center', marginBottom: 60 },
  emoji: { fontSize: 64, marginBottom: 10 },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFD700',
    textShadowColor: 'rgba(255, 215, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  subtitle: { fontSize: 16, color: '#aaa', marginTop: 8, fontStyle: 'italic' },
  formContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  label: { color: '#fff', fontSize: 18, marginBottom: 16, fontWeight: '600', textAlign: 'center' },
  input: {
    backgroundColor: '#222',
    borderWidth: 1,
    borderColor: '#444',
    color: '#fff',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
  disclaimer: { marginTop: 20, color: '#666', fontSize: 12, textAlign: 'center', lineHeight: 18 },
});