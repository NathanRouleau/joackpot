import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uyzckwieajypffygfpvo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5emNrd2llYWp5cGZmeWdmcHZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0Njk0ODMsImV4cCI6MjA4MTA0NTQ4M30.XWY6hoHSSZvxd91SpYtnOLVPPgdx8WLAvYJmYPg6Wlg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage, // Utilise le stockage du téléphone
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});