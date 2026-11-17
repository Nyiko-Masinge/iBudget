import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AppPreferencesProvider } from './AppPreferences';
import { useAppPreferences } from './AppPreferences';
import { AppMenuLayer } from '../components/AppMenu';
const client = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } });
export function Providers({ children }: React.PropsWithChildren) {
  return <QueryClientProvider client={client}><AppPreferencesProvider><ThemeStatusBar /><View style={{ flex: 1 }}>{children}<AppMenuLayer /></View></AppPreferencesProvider></QueryClientProvider>;
}

function ThemeStatusBar() {
  const { themeMode } = useAppPreferences();
  return <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />;
}
