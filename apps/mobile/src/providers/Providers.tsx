import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AppPreferencesProvider } from './AppPreferences';
import { useAppPreferences } from './AppPreferences';
import { AppMenuLayer } from '../components/AppMenu';
import { supabase } from '../backend';
const client = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } });
export function Providers({ children }: React.PropsWithChildren) {
  return <QueryClientProvider client={client}><AppPreferencesProvider><AuthCacheBoundary /><ThemeStatusBar /><View style={{ flex: 1 }}>{children}<AppMenuLayer /></View></AppPreferencesProvider></QueryClientProvider>;
}

function AuthCacheBoundary() {
  useEffect(() => {
    if (!supabase) return;
    let currentUserId: string | null | undefined;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUserId = session?.user.id ?? null;
      if (currentUserId !== undefined && currentUserId !== nextUserId) client.clear();
      currentUserId = nextUserId;
    });
    return () => subscription.unsubscribe();
  }, []);
  return null;
}

function ThemeStatusBar() {
  const { themeMode } = useAppPreferences();
  return <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />;
}
