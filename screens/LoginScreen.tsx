import React, { useState } from 'react'
import { View, TextInput, Button, Text, Alert } from 'react-native'
import { supabase } from '../supabase/supabaseClient'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({ email })

    if (error) Alert.alert('Erreur', error.message)
    else Alert.alert('Check tes mails !', "Clique sur le lien pour te connecter")

    setLoading(false)
  }

  // Ajoute ce useEffect pour créer le joueur après connexion
  React.useEffect(() => {
    const createPlayerIfNeeded = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Vérifie si le joueur existe
        const { data: player, error } = await supabase
          .from('players')
          .select('*')
          .eq('id', user.id)
          .single()

        if (!player && !error) {
          // Crée le joueur
          await supabase.from('players').insert({
            id: user.id,
            credits: 1000,
            last_login: new Date().toISOString(),
            created_at: new Date().toISOString(),
          })
        } else if (player) {
          // Mets à jour last_login
          await supabase
            .from('players')
            .update({ last_login: new Date().toISOString() })
            .eq('id', user.id)
        }
      }
    }
    createPlayerIfNeeded()
  }, [])

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 16 }}>Connexion / Inscription</Text>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        style={{
          borderColor: '#ccc',
          borderWidth: 1,
          padding: 10,
          borderRadius: 8,
          marginBottom: 12,
        }}
      />
      <Button title={loading ? 'Chargement...' : 'Se connecter'} onPress={handleLogin} />
    </View>
  )
}