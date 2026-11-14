import { useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Linking from 'expo-linking';
import { formatMoney, sumExpenses, sumIncome } from '@ibudget/finance-core';
import { listRecentTransactions, registerWithPassword, resendConfirmation, requestPasswordReset, signInWithPassword } from '@ibudget/data-access';
import { supabase, supabaseConfigured } from '../../src/backend';

type AuthMode = 'sign-in' | 'sign-up' | 'reset';
const colors = { ink: '#173D32', green: '#26745A', canvas: '#F5F5EF', card: '#FFFFFF', muted: '#68756E', line: '#E4E8DF', mint: '#DDEDE3', gold: '#D6AE66' };
const redirectUrl = () => Platform.OS === 'web' && typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : Linking.createURL('/auth/callback');

export default function Dashboard() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<AuthMode>('sign-in');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [session, setSession] = useState<boolean | null>(null);

  useEffect(() => {
    if (!supabase) { setSession(false); return; }
    let alive = true;
    supabase.auth.getSession().then(({ data }) => { if (alive) setSession(!!data.session); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, value) => setSession(!!value));
    return () => { alive = false; subscription.unsubscribe(); };
  }, []);

  const query = useQuery({ queryKey: ['transactions'], enabled: !!supabase && session === true, queryFn: () => listRecentTransactions(supabase!, 100) });
  const rows = (query.data ?? []).map((transaction) => ({ kind: transaction.transaction_type as 'income' | 'expense' | 'transfer' | 'refund', amountMinor: transaction.amount_minor }));
  const income = sumIncome(rows);
  const expenses = sumExpenses(rows);

  async function submitAuth() {
    if (!supabase) return;
    setBusy(true); setMessage('');
    try {
      if (mode === 'sign-in') { await signInWithPassword(supabase, email, password); }
      else if (mode === 'sign-up') {
        const result = await registerWithPassword(supabase, email, password, redirectUrl());
        setMessage(result.session ? 'Your account is ready.' : 'Account created. Open the confirmation email to verify your address, then return here to sign in.');
      } else {
        await requestPasswordReset(supabase, email, redirectUrl());
        setMessage('If an account exists for that email, Supabase has sent a reset link. Check your inbox.');
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Something went wrong. Please try again.'); }
    finally { setBusy(false); }
  }

  async function resend() {
    if (!supabase) return;
    setBusy(true); setMessage('');
    try { await resendConfirmation(supabase, email, redirectUrl()); setMessage('Confirmation email requested. Check your inbox and spam folder.'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Could not resend the email.'); }
    finally { setBusy(false); }
  }

  if (supabaseConfigured && session === null) return <View style={s.loading}><ActivityIndicator color={colors.green}/></View>;
  if (supabaseConfigured && !session) return <ScrollView style={s.authPage} contentContainerStyle={s.authContent} keyboardShouldPersistTaps="handled">
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.brandRow}><View style={s.logo}><Text style={s.logoText}>i</Text></View><Text style={s.brand}>ibudget</Text></View>
      <View style={s.authHero}><Text style={s.kicker}>A CALMER WAY TO MANAGE MONEY</Text><Text style={s.authTitle}>{mode === 'sign-up' ? 'Start with a clear picture.' : mode === 'reset' ? 'Let’s get you back in.' : 'Make room for what matters.'}</Text><Text style={s.authCopy}>A private space to understand your spending, build better habits and move toward your goals.</Text></View>
      <View style={s.authCard}>
        {mode !== 'reset' && <View style={s.modeSwitch}><Pressable onPress={() => { setMode('sign-in'); setMessage(''); }} style={[s.modeButton, mode === 'sign-in' && s.modeSelected]}><Text style={[s.modeText, mode === 'sign-in' && s.modeTextSelected]}>Sign in</Text></Pressable><Pressable onPress={() => { setMode('sign-up'); setMessage(''); }} style={[s.modeButton, mode === 'sign-up' && s.modeSelected]}><Text style={[s.modeText, mode === 'sign-up' && s.modeTextSelected]}>Create account</Text></Pressable></View>}
        <Text style={s.fieldLabel}>Email address</Text>
        <TextInput autoComplete="email" autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" value={email} onChangeText={setEmail} style={s.input} accessibilityLabel="Email address" />
        {mode !== 'reset' && <><View style={s.passwordLabelRow}><Text style={s.fieldLabel}>Password</Text>{mode === 'sign-in' && <Pressable onPress={() => { setMode('reset'); setMessage(''); }}><Text style={s.smallLink}>Forgot password?</Text></Pressable>}</View><TextInput autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'} autoCapitalize="none" placeholder={mode === 'sign-up' ? 'At least 12 characters' : 'Your password'} secureTextEntry value={password} onChangeText={setPassword} style={s.input} accessibilityLabel="Password" />{mode === 'sign-up' && <Text style={s.helper}>Use 12 or more characters. Your password is never shared with us.</Text>}</>}
        <Pressable accessibilityRole="button" disabled={busy} onPress={submitAuth} style={[s.primaryButton, busy && s.busy]}><Text style={s.primaryText}>{busy ? 'Please wait…' : mode === 'sign-in' ? 'Sign in securely' : mode === 'sign-up' ? 'Create my account' : 'Send reset link'}</Text></Pressable>
        {mode === 'reset' && <Pressable onPress={() => { setMode('sign-in'); setMessage(''); }}><Text style={s.secondaryLink}>Back to sign in</Text></Pressable>}
        {!!message && <View style={s.messageBox}><Text accessibilityRole="alert" style={s.message}>{message}</Text>{message.toLowerCase().includes('not confirmed') && <Pressable disabled={busy} onPress={resend}><Text style={s.smallLink}>Resend confirmation email</Text></Pressable>}</View>}
      </View>
      <Text style={s.securityNote}>Your financial data belongs to you. Sign in to see your private workspace.</Text>
    </KeyboardAvoidingView>
  </ScrollView>;

  return <ScrollView style={s.page} contentContainerStyle={s.content}>
    <View style={s.dashHeader}><View style={s.brandRow}><View style={s.logo}><Text style={s.logoText}>i</Text></View><Text style={s.brand}>ibudget</Text></View><Pressable accessibilityRole="button" onPress={() => { void supabase?.auth.signOut(); }} style={s.signOut}><Text style={s.signOutText}>Sign out</Text></Pressable></View>
    <Text style={s.greeting}>Your money, with clarity.</Text><Text style={s.subtitle}>A simple view of where things stand.</Text>
    {!supabaseConfigured ? <View style={s.panel}><Text style={s.panelTitle}>Connect your workspace</Text><Text style={s.body}>Add your Supabase project URL and publishable key to enable secure cloud sync.</Text></View> : query.isLoading ? <View style={s.loadingCard}><ActivityIndicator color={colors.green}/></View> : query.isError ? <View style={s.panel}><Text style={s.panelTitle}>We couldn’t load your ledger</Text><Text style={s.body}>Check your connection and try again.</Text></View> : <>
      <View style={s.balanceCard}><View style={s.balanceTop}><Text style={s.balanceEyebrow}>LATEST {query.data?.length ?? 0} TRANSACTIONS</Text><Text style={s.balanceIcon}>✦</Text></View><Text style={s.balanceAmount}>{formatMoney(income - expenses)}</Text><Text style={s.balanceCaption}>Net across the transactions shown below</Text><View style={s.balanceDivider}/><View style={s.balanceStats}><View><Text style={s.statLabel}>Income</Text><Text style={s.statValue}>{formatMoney(income)}</Text></View><View style={s.statSep}/><View><Text style={s.statLabel}>Expenses</Text><Text style={s.statValue}>{formatMoney(expenses)}</Text></View></View></View>
      <View style={s.quickRow}><Link href="/(tabs)/transactions" asChild><Pressable style={s.quickAction}><Text style={s.quickIcon}>＋</Text><Text style={s.quickText}>Add transaction</Text></Pressable></Link><Link href="/(tabs)/budgets" asChild><Pressable style={s.quickAction}><Text style={s.quickIcon}>◷</Text><Text style={s.quickText}>Plan a budget</Text></Pressable></Link></View>
      <View style={s.sectionHeader}><Text style={s.sectionTitle}>Recent activity</Text><Link href="/(tabs)/transactions" style={s.smallLink}>See all</Link></View>
      {(query.data ?? []).length === 0 ? <View style={s.empty}><View style={s.emptyIcon}><Text style={s.emptyIconText}>✦</Text></View><Text style={s.panelTitle}>A fresh start</Text><Text style={s.body}>Your activity will appear here as you record income and spending.</Text><Link href="/(tabs)/transactions" style={s.smallLink}>Add your first transaction →</Link></View> : (query.data ?? []).slice(0, 5).map((item) => <View style={s.activityRow} key={item.id}><View style={s.activityIcon}><Text style={s.activityGlyph}>{item.transaction_type === 'income' ? '↓' : '↑'}</Text></View><View style={s.activityInfo}><Text style={s.activityTitle} numberOfLines={1}>{item.description}</Text><Text style={s.activityMeta}>{new Date(item.occurred_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}</Text></View><Text style={[s.activityAmount, item.transaction_type === 'income' ? s.income : null]}>{item.transaction_type === 'income' ? '+' : '−'}{formatMoney(item.amount_minor, item.currency.trim())}</Text></View>)}
      <View style={s.insightCard}><Text style={s.insightMark}>✦</Text><View style={{ flex: 1 }}><Text style={s.insightTitle}>Build your money picture</Text><Text style={s.insightCopy}>Add a few transactions to start seeing useful patterns.</Text></View></View>
    </>}
  </ScrollView>;
}

const s = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.canvas },
  authPage: { flex: 1, backgroundColor: colors.canvas }, authContent: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingTop: 48, paddingBottom: 36 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 }, logo: { width: 38, height: 38, borderRadius: 14, backgroundColor: colors.ink, justifyContent: 'center', alignItems: 'center' }, logoText: { color: '#F7F5ED', fontSize: 21, fontWeight: '700' }, brand: { color: colors.ink, fontSize: 19, fontWeight: '700', letterSpacing: -0.5 },
  authHero: { marginTop: 42, marginBottom: 26 }, kicker: { color: colors.green, fontSize: 10, fontWeight: '700', letterSpacing: 1.5 }, authTitle: { color: colors.ink, fontSize: 34, lineHeight: 39, fontWeight: '700', letterSpacing: -1, marginTop: 10 }, authCopy: { color: colors.muted, fontSize: 15, lineHeight: 23, marginTop: 12, maxWidth: 440 },
  authCard: { backgroundColor: colors.card, borderRadius: 22, padding: 20, borderWidth: 1, borderColor: colors.line, shadowColor: '#183A2E', shadowOpacity: 0.05, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 2 }, modeSwitch: { flexDirection: 'row', padding: 4, borderRadius: 13, backgroundColor: '#F2F3ED', marginBottom: 22 }, modeButton: { flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: 10 }, modeSelected: { backgroundColor: '#FFFFFF' }, modeText: { color: colors.muted, fontWeight: '600', fontSize: 13 }, modeTextSelected: { color: colors.ink },
  fieldLabel: { color: colors.ink, fontSize: 13, fontWeight: '600', marginBottom: 8 }, passwordLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 17 }, input: { minHeight: 52, borderRadius: 12, paddingHorizontal: 14, backgroundColor: '#FBFCF9', borderWidth: 1, borderColor: colors.line, color: colors.ink, fontSize: 15 }, smallLink: { color: colors.green, fontSize: 12, fontWeight: '700' }, helper: { color: colors.muted, fontSize: 11, marginTop: 8 },
  primaryButton: { minHeight: 52, backgroundColor: colors.ink, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginTop: 20 }, primaryText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 }, busy: { opacity: 0.65 }, secondaryLink: { color: colors.green, textAlign: 'center', fontWeight: '600', marginTop: 16 }, messageBox: { marginTop: 14, padding: 12, borderRadius: 12, backgroundColor: '#F4F5EF' }, message: { color: colors.ink, fontSize: 13, lineHeight: 19 }, securityNote: { color: colors.muted, fontSize: 11, textAlign: 'center', lineHeight: 17, marginTop: 20, paddingHorizontal: 10 },
  page: { flex: 1, backgroundColor: colors.canvas }, content: { padding: 22, paddingTop: 54, paddingBottom: 38 }, dashHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, signOut: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12, backgroundColor: colors.mint }, signOutText: { color: colors.ink, fontSize: 12, fontWeight: '700' }, greeting: { color: colors.ink, fontSize: 29, fontWeight: '700', letterSpacing: -0.8, marginTop: 30 }, subtitle: { color: colors.muted, fontSize: 14, marginTop: 6, marginBottom: 22 },
  balanceCard: { padding: 21, borderRadius: 22, backgroundColor: colors.ink }, balanceTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, balanceEyebrow: { color: '#B7C9BD', fontSize: 10, letterSpacing: 1.3, fontWeight: '700' }, balanceIcon: { color: '#D8E9DC', fontSize: 20 }, balanceAmount: { color: '#FFFFFF', fontSize: 35, letterSpacing: -1, fontWeight: '700', marginTop: 16 }, balanceCaption: { color: '#B7C9BD', fontSize: 12, marginTop: 3 }, balanceDivider: { height: 1, backgroundColor: '#456458', marginVertical: 19 }, balanceStats: { flexDirection: 'row', alignItems: 'center' }, statLabel: { color: '#B7C9BD', fontSize: 11 }, statValue: { color: '#FFFFFF', fontSize: 14, fontWeight: '600', marginTop: 5 }, statSep: { width: 1, height: 28, backgroundColor: '#456458', marginHorizontal: 23 },
  quickRow: { flexDirection: 'row', gap: 11, marginTop: 13 }, quickAction: { flex: 1, minHeight: 74, paddingHorizontal: 14, borderRadius: 16, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, flexDirection: 'row', alignItems: 'center', gap: 10 }, quickIcon: { width: 31, height: 31, borderRadius: 11, overflow: 'hidden', textAlign: 'center', textAlignVertical: 'center', color: colors.green, backgroundColor: colors.mint, fontWeight: '700', fontSize: 20 }, quickText: { color: colors.ink, fontSize: 12, fontWeight: '600', flexShrink: 1 }, sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 29, marginBottom: 7 }, sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: '700' },
  activityRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.line, gap: 11 }, activityIcon: { width: 38, height: 38, borderRadius: 14, backgroundColor: '#EAEEE7', alignItems: 'center', justifyContent: 'center' }, activityGlyph: { color: colors.ink, fontSize: 18 }, activityInfo: { flex: 1 }, activityTitle: { color: colors.ink, fontSize: 13, fontWeight: '600' }, activityMeta: { color: colors.muted, fontSize: 11, marginTop: 4 }, activityAmount: { color: colors.ink, fontSize: 13, fontWeight: '700' }, income: { color: colors.green },
  empty: { borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, borderRadius: 18, padding: 19 }, emptyIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.mint, marginBottom: 12 }, emptyIconText: { color: colors.green, fontSize: 17 }, panel: { backgroundColor: colors.card, borderRadius: 18, padding: 19, borderWidth: 1, borderColor: colors.line }, panelTitle: { color: colors.ink, fontSize: 16, fontWeight: '700' }, body: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 7 }, loadingCard: { padding: 32, backgroundColor: colors.card, borderRadius: 18 }, insightCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, marginTop: 22, backgroundColor: '#E8EEE5', borderRadius: 17 }, insightMark: { color: colors.green, fontSize: 20 }, insightTitle: { color: colors.ink, fontSize: 13, fontWeight: '700' }, insightCopy: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 4 },
});
