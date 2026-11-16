import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { View } from 'react-native';
import { AppPreferencesProvider } from './AppPreferences';
import { AppMenuLayer } from '../components/AppMenu';
const client = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } });
export function Providers({ children }: React.PropsWithChildren) {
  return <QueryClientProvider client={client}><AppPreferencesProvider><View style={{ flex: 1 }}>{children}<AppMenuLayer /></View></AppPreferencesProvider></QueryClientProvider>;
}
