import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '../../src/backend';

export default function AuthCallback() {
  const [complete, setComplete] = useState(false);
  const [recovery, setRecovery] = useState(false);
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const params = useLocalSearchParams<{ type?: string }>();
  useEffect(() => {
    if (!supabase) return;
    if (params.type === 'recovery') setRecovery(true);
    supabase.auth.getSession().then(({ data }) => setComplete(!!data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setComplete(!!session);
      if (event === 'PASSWORD_RECOVERY') setRecovery(true);
    });
    return () => subscription.unsubscribe();
  }, [params.type]);
  async function savePassword() {
    if (!supabase) return;
    if (password.length < 12) { setMessage('Choose a password with at least 12 characters.'); return; }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { setMessage('We couldn’t update the password. Request a fresh reset email and try again.'); return; }
    setMessage('Password updated. Return to iBudget and sign in.');
    setPassword('');
  }
  return <View style={s.page}><View style={s.mark}><Text style={s.markText}>i</Text></View><Text style={s.title}>{recovery ? 'Choose a new password' : complete ? 'Email confirmed' : 'Finishing confirmation'}</Text><Text style={s.copy}>{recovery ? 'Use at least 12 characters, then return to iBudget to sign in.' : complete ? 'Your account is ready. Return to iBudget to continue.' : 'We’re securely checking your confirmation link. You can return to the app in a moment.'}</Text>{recovery && <View style={s.form}><TextInput autoCapitalize="none" secureTextEntry value={password} onChangeText={setPassword} placeholder="New password (12+ characters)" style={s.input}/><Pressable accessibilityRole="button" onPress={savePassword} style={s.button}><Text style={s.buttonText}>Update password</Text></Pressable></View>}{!!message && <Text accessibilityRole="alert" style={s.message}>{message}</Text>}{!complete && !recovery && <ActivityIndicator color="#26745A" style={{ marginTop: 22 }} />}</View>;
}

const s = StyleSheet.create({ page: { flex: 1, backgroundColor: '#F5F5EF', justifyContent: 'center', alignItems: 'center', padding: 32 }, mark: { width: 56, height: 56, borderRadius: 20, backgroundColor: '#173D32', alignItems: 'center', justifyContent: 'center' }, markText: { color: '#F5F5EF', fontSize: 28, fontWeight: '700' }, title: { color: '#173D32', fontSize: 25, fontWeight: '700', marginTop: 24, textAlign: 'center' }, copy: { color: '#68756E', fontSize: 15, lineHeight: 23, textAlign: 'center', maxWidth: 340, marginTop: 10 }, form: { width: '100%', maxWidth: 380, marginTop: 22 }, input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E4E8DF', padding: 14, borderRadius: 12, color: '#173D32' }, button: { marginTop: 12, padding: 15, alignItems: 'center', backgroundColor: '#173D32', borderRadius: 12 }, buttonText: { color: '#FFFFFF', fontWeight: '700' }, message: { color: '#26745A', textAlign: 'center', marginTop: 16 } });
