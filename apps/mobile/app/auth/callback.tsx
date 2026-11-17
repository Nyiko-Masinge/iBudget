import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Linking from 'expo-linking';
import { supabase } from '../../src/backend';

function isTrustedAuthCallback(rawUrl: string) {
  try {
    const url = new URL(rawUrl);
    if (Platform.OS === 'web') {
      return typeof window !== 'undefined'
        && url.origin === window.location.origin
        && /^\/auth\/callback\/?$/.test(url.pathname);
    }
    if (url.protocol === 'ibudget:' && url.hostname === 'auth') return url.pathname === '/callback';
    return url.protocol === 'exp:' && /^\/--\/auth\/callback\/?$/.test(url.pathname);
  } catch {
    return false;
  }
}

export default function AuthCallback() {
  const [complete, setComplete] = useState(false);
  const [recovery, setRecovery] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  useEffect(() => {
    const client = supabase;
    if (!client) { setChecking(false); setMessage('Supabase is not configured.'); return; }
    let alive = true;
    let settled = false;
    const fail = (reason?: unknown) => {
      if (!alive) return;
      settled = true;
      setChecking(false);
      setMessage(reason instanceof Error && reason.message.toLowerCase().includes('expired')
        ? 'This link has expired or was already used. Request a fresh email and open its newest link.'
        : 'We couldn’t verify this link. Request a fresh email and open it while Expo is running.');
    };
    const finishFromSession = async () => {
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      if (!alive) return;
      if (data.session) { settled = true; setComplete(true); setChecking(false); }
    };
    const processLink = async (url: string) => {
      if (!isTrustedAuthCallback(url)) return;
      try {
        const parsed = Linking.parse(url);
        const query = parsed.queryParams ?? {};
        const fragment = url.includes('#') ? new URLSearchParams(url.split('#')[1]) : null;
        const value = (key: string) => {
          const fromQuery = query[key];
          return typeof fromQuery === 'string' ? fromQuery : fragment?.get(key) ?? null;
        };
        const linkError = value('error_description') ?? value('error');
        if (linkError) throw new Error(linkError);
        const type = value('type');
        const code = value('code');
        if (code) {
          const { error } = await client.auth.exchangeCodeForSession(code);
          if (error) throw error;
          if (type === 'recovery' || type === 'invite') setRecovery(true);
        }
        await finishFromSession();
      } catch (error) { fail(error); }
    };
    const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setRecovery(true);
      if (session && !settled) { settled = true; setComplete(true); setChecking(false); }
    });
    void Linking.getInitialURL().then(async (url) => {
      if (url) await processLink(url);
      if (!url) await finishFromSession();
      if (alive && !settled) {
        settled = true;
        setChecking(false);
        setMessage('No active verification session was found. Request a new email and open its newest link.');
      }
    }).catch(fail);
    const linkSubscription = Linking.addEventListener('url', ({ url }) => { void processLink(url); });
    const timeout = setTimeout(() => {
      if (alive && !settled) fail();
    }, 15000);
    return () => { alive = false; clearTimeout(timeout); subscription.unsubscribe(); linkSubscription.remove(); };
  }, []);
  async function savePassword() {
    if (!supabase) return;
    if (password.length < 12) { setMessage('Choose a password with at least 12 characters.'); return; }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { setMessage('We couldn’t update the password. Request a fresh reset email and try again.'); return; }
    setMessage('Password updated. Return to iBudget and sign in.');
    setPassword('');
  }
  return <View style={s.page}><View style={s.mark}><Text style={s.markText}>i</Text></View><Text style={s.title}>{recovery ? 'Choose a new password' : complete ? 'Email confirmed' : checking ? 'Finishing confirmation' : 'Confirmation didn’t finish'}</Text><Text style={s.copy}>{recovery ? 'Use at least 12 characters, then return to iBudget to sign in.' : complete ? 'Your account is ready. Return to iBudget to continue.' : checking ? 'We’re securely checking your confirmation link.' : 'Request a fresh email and open its newest link while Expo is running.'}</Text>{recovery && <View style={s.form}><TextInput autoCapitalize="none" secureTextEntry value={password} onChangeText={setPassword} placeholder="New password (12+ characters)" style={s.input}/><Pressable accessibilityRole="button" onPress={savePassword} style={s.button}><Text style={s.buttonText}>Update password</Text></Pressable></View>}{!!message && <Text accessibilityRole="alert" style={s.message}>{message}</Text>}{checking && !complete && !recovery && <ActivityIndicator color="#26745A" style={{ marginTop: 22 }} />}</View>;
}

const s = StyleSheet.create({ page: { flex: 1, backgroundColor: '#F5F5EF', justifyContent: 'center', alignItems: 'center', padding: 32 }, mark: { width: 56, height: 56, borderRadius: 20, backgroundColor: '#173D32', alignItems: 'center', justifyContent: 'center' }, markText: { color: '#F5F5EF', fontSize: 28, fontWeight: '700' }, title: { color: '#173D32', fontSize: 25, fontWeight: '700', marginTop: 24, textAlign: 'center' }, copy: { color: '#68756E', fontSize: 15, lineHeight: 23, textAlign: 'center', maxWidth: 340, marginTop: 10 }, form: { width: '100%', maxWidth: 380, marginTop: 22 }, input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E4E8DF', padding: 14, borderRadius: 12, color: '#173D32' }, button: { marginTop: 12, padding: 15, alignItems: 'center', backgroundColor: '#173D32', borderRadius: 12 }, buttonText: { color: '#FFFFFF', fontWeight: '700' }, message: { color: '#26745A', textAlign: 'center', marginTop: 16 } });
