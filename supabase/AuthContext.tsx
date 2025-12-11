import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../supabase/supabaseClient'; // Vérifie le chemin

// Définition du "contrat" (Type) de notre contexte
type AuthContextType = {
  user: User | null;
  loading: boolean;
};

// Création du contexte avec une valeur par défaut typée
const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Fonction utilitaire pour créer/vérifier le profil joueur
  const ensurePlayerProfile = async (currentUser: User) => {
    if (!currentUser) return;

    console.log("🔍 Vérification du profil pour :", currentUser.email);

    try {
      // 1. On regarde si le joueur existe
      const { data: existingPlayer, error: fetchError } = await supabase
        .from('players')
        .select('id')
        .eq('id', currentUser.id)
        .maybeSingle(); // 'maybeSingle' est plus propre que 'single' pour gérer le cas vide

      if (fetchError) {
        console.error("❌ Erreur lors de la vérification du joueur :", fetchError.message);
      }

      // 2. S'il n'existe pas, on le crée
      if (!existingPlayer) {
        console.log("✨ Création du nouveau profil joueur...");
        const { error: insertError } = await supabase.from('players').insert({
          id: currentUser.id,
          email: currentUser.email,
          credits: 1000,
          last_login: new Date().toISOString(),
        });

        if (insertError) console.error("❌ Erreur création profil :", insertError.message);
        else console.log("✅ Profil joueur créé avec succès !");
      } else {
        // 3. Sinon on met juste à jour la date de login
        await supabase
          .from('players')
          .update({ last_login: new Date().toISOString() })
          .eq('id', currentUser.id);
        console.log("👤 Profil joueur existant mis à jour.");
      }
    } catch (e) {
      console.error("💀 Exception critique dans ensurePlayerProfile :", e);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initSession = async () => {
      try {
        // Récupérer la session stockée
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user ?? null;
        
        if (mounted) {
          setUser(currentUser);
          if (currentUser) {
            await ensurePlayerProfile(currentUser);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error("Erreur init session:", error);
        if (mounted) setLoading(false);
      }
    };

    initSession();

    // Écouter les changements (Login, Logout)
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log("🔔 Auth State Change :", _event);
      const currentUser = session?.user ?? null;
      
      if (mounted) setUser(currentUser);
      
      if (currentUser && (_event === 'SIGNED_IN' || _event === 'TOKEN_REFRESHED')) {
         await ensurePlayerProfile(currentUser);
      }
    });

    return () => {
      mounted = false;
      listener?.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);