import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { Providers } from '../src/providers/Providers';
import { supabase } from '../src/backend';

async function consumeAuthLink(url: string) {
  if (!supabase) return;
  const parsed = Linking.parse(url);
  const query = parsed.queryParams ?? {};
  const fragment = url.includes('#') ? new URLSearchParams(url.split('#')[1]) : null;
  const code = typeof query.code === 'string' ? query.code : null;
  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
    return;
  }
  const accessToken = typeof query.access_token === 'string' ? query.access_token : fragment?.get('access_token');
  const refreshToken = typeof query.refresh_token === 'string' ? query.refresh_token : fragment?.get('refresh_token');
  if (accessToken && refreshToken) await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
}

export default function RootLayout() {
  useEffect(() => {
    let active = true;
    Linking.getInitialURL().then((url) => { if (active && url) void consumeAuthLink(url); });
    const subscription = Linking.addEventListener('url', ({ url }) => { void consumeAuthLink(url); });
    return () => { active = false; subscription.remove(); };
  }, []);
  return <Providers><StatusBar style="auto" /><Stack screenOptions={{ headerShown: false }} /></Providers>;
}
