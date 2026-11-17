import { useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Linking from 'expo-linking';
import { formatMoney, sumExpenses, sumIncome } from '@ibudget/finance-core';
import { listRecentTransactions, registerWithPassword, resendConfirmation, requestPasswordReset, signInWithPassword } from '@ibudget/data-access';
import { supabase, supabaseConfigured } from '../../src/backend';
import { useAppPreferences } from '../../src/providers/AppPreferences';

type AuthMode = 'sign-in' | 'sign-up' | 'reset';
const lightColors = { ink: '#25231F', hero: '#25231F', green: '#8A7448', canvas: '#F4F0E8', card: '#FFFDFA', muted: '#777167', line: '#E4DCCF', mint: '#EFE6D5', gold: '#C9AC73', input: '#FBFCF9' };
const darkColors = { ink: '#F2EEE5', hero: '#22231F', green: '#D2B878', canvas: '#171815', card: '#22231F', muted: '#B8B1A4', line: '#3D3A32', mint: '#343127', gold: '#D2B878', input: '#191A17' };
const redirectUrl = () => Platform.OS === 'web' && typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : Linking.createURL('/auth/callback');

export default function Dashboard() {
  const dark = useAppPreferences().themeMode === 'dark';
  const colors = dark ? darkColors : lightColors;
  const s = useMemo(() => makeStyles(colors), [dark]);
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

  const query = useQuery({ queryKey: ['transactions', 'recent'], enabled: !!supabase && session === true, queryFn: () => listRecentTransactions(supabase!, 100) });
  const summaryCurrency = query.data?.[0]?.currency.trim() ?? 'ZAR';
  const rows = (query.data ?? []).filter(transaction => transaction.currency.trim() === summaryCurrency).map((transaction) => ({ kind: transaction.transaction_type as 'income' | 'expense' | 'transfer' | 'refund', amountMinor: transaction.amount_minor }));
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
    <View style={s.dashHeader}><View style={s.brandRow}><View style={s.logo}><Text style={s.logoText}>i</Text></View><Text style={s.brand}>ibudget</Text></View></View>
    <Text style={s.greeting}>Our money, Our Vission, Our Future.</Text><Text style={s.subtitle}>I really hope you love it my Babaa, i made it with love and you in mind.May god continue to show up for you, me, us.
<br />- Love rirhandzoRawe, munu wawe</Text>
    {!supabaseConfigured ? <View style={s.panel}><Text style={s.panelTitle}>Connect your workspace</Text><Text style={s.body}>Add your Supabase project URL and publishable key to enable secure cloud sync.</Text></View> : query.isLoading ? <View style={s.loadingCard}><ActivityIndicator color={colors.green}/></View> : query.isError ? <View style={s.panel}><Text style={s.panelTitle}>We couldn’t load your ledger</Text><Text style={s.body}>{query.error instanceof Error ? query.error.message : 'The request failed. Try again.'}</Text><Pressable accessibilityRole="button" onPress={() => void query.refetch()}><Text style={s.smallLink}>Try again</Text></Pressable></View> : <>
      <View style={s.balanceCard}><View style={s.balanceTop}><Text style={s.balanceEyebrow}>RECENT ACTIVITY · {summaryCurrency}</Text><Text style={s.balanceIcon}>✦</Text></View><Text style={s.balanceAmount}>{formatMoney(income - expenses, summaryCurrency)}</Text><Text style={s.balanceCaption}>Net across recent transactions in {summaryCurrency}</Text><View style={s.balanceDivider}/><View style={s.balanceStats}><View><Text style={s.statLabel}>Income</Text><Text style={s.statValue}>{formatMoney(income, summaryCurrency)}</Text></View><View style={s.statSep}/><View><Text style={s.statLabel}>Expenses</Text><Text style={s.statValue}>{formatMoney(expenses, summaryCurrency)}</Text></View></View></View>
      <View style={s.quickRow}><Link href="/(tabs)/transactions" asChild><Pressable style={s.quickAction}><Text style={s.quickIcon}>＋</Text><Text style={s.quickText}>Add transaction</Text></Pressable></Link><Link href="/(tabs)/budgets" asChild><Pressable style={s.quickAction}><Text style={s.quickIcon}>◷</Text><Text style={s.quickText}>Plan spending</Text></Pressable></Link></View>
      <View style={s.sectionHeader}><Text style={s.sectionTitle}>Recent activity</Text><Link href="/(tabs)/transactions" style={s.smallLink}>See all</Link></View>
      {(query.data ?? []).length === 0 ? <View style={s.empty}><View style={s.emptyIcon}><Text style={s.emptyIconText}>✦</Text></View><Text style={s.panelTitle}>A fresh start</Text><Text style={s.body}>Your activity will appear here as you record income and spending.</Text><Link href="/(tabs)/transactions" style={s.smallLink}>Add your first transaction →</Link></View> : (query.data ?? []).slice(0, 5).map((item) => <View style={s.activityRow} key={item.id}><View style={s.activityIcon}><Text style={s.activityGlyph}>{item.transaction_type === 'income' ? '↓' : '↑'}</Text></View><View style={s.activityInfo}><Text style={s.activityTitle} numberOfLines={1}>{item.description}</Text><Text style={s.activityMeta}>{new Date(item.occurred_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}</Text></View><Text style={[s.activityAmount, item.transaction_type === 'income' ? s.income : null]}>{item.transaction_type === 'income' ? '+' : '−'}{formatMoney(item.amount_minor, item.currency.trim())}</Text></View>)}
    </>}
  </ScrollView>;
}

function makeStyles(colors: typeof lightColors) { return StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.canvas },
  authPage: { flex: 1, backgroundColor: colors.canvas }, authContent: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingTop: 48, paddingBottom: 36 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 }, logo: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.hero, justifyContent: 'center', alignItems: 'center' }, logoText: { color: colors.gold, fontSize: 21, fontWeight: '700' }, brand: { color: colors.ink, fontSize: 19, fontWeight: '700', letterSpacing: -0.5 },
  authHero: { marginTop: 42, marginBottom: 26 }, kicker: { color: colors.green, fontSize: 10, fontWeight: '700', letterSpacing: 1.8 }, authTitle: { color: colors.ink, fontFamily: 'Georgia', fontSize: 35, lineHeight: 41, fontWeight: '400', letterSpacing: -0.7, marginTop: 12 }, authCopy: { color: colors.muted, fontSize: 15, lineHeight: 23, marginTop: 12, maxWidth: 440 },
  authCard: { backgroundColor: colors.card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.line, shadowColor: '#31291B', shadowOpacity: 0.06, shadowRadius: 22, shadowOffset: { width: 0, height: 9 }, elevation: 2 }, modeSwitch: { flexDirection: 'row', padding: 4, borderRadius: 12, backgroundColor: '#F0EBE1', marginBottom: 22 }, modeButton: { flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: 9 }, modeSelected: { backgroundColor: colors.card }, modeText: { color: colors.muted, fontWeight: '600', fontSize: 13 }, modeTextSelected: { color: colors.ink },
  fieldLabel: { color: colors.ink, fontSize: 13, fontWeight: '600', marginBottom: 8 }, passwordLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 17 }, input: { minHeight: 52, borderRadius: 12, paddingHorizontal: 14, backgroundColor: colors.input, borderWidth: 1, borderColor: colors.line, color: colors.ink, fontSize: 15 }, smallLink: { color: colors.green, fontSize: 12, fontWeight: '700' }, helper: { color: colors.muted, fontSize: 11, marginTop: 8 },
  primaryButton: { minHeight: 52, backgroundColor: colors.hero, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginTop: 20 }, primaryText: { color: '#F4E9CF', fontWeight: '700', fontSize: 14 }, busy: { opacity: 0.65 }, secondaryLink: { color: colors.green, textAlign: 'center', fontWeight: '600', marginTop: 16 }, messageBox: { marginTop: 14, padding: 12, borderRadius: 12, backgroundColor: colors.mint }, message: { color: colors.ink, fontSize: 13, lineHeight: 19 }, securityNote: { color: colors.muted, fontSize: 11, textAlign: 'center', lineHeight: 17, marginTop: 20, paddingHorizontal: 10 },
  page: { flex: 1, backgroundColor: colors.canvas }, content: { padding: 24, paddingTop: 54, paddingBottom: 38 }, dashHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, signOut: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line }, signOutText: { color: colors.ink, fontSize: 12, fontWeight: '700' }, greeting: { color: colors.ink, fontFamily: 'Georgia', fontSize: 31, fontWeight: '400', letterSpacing: -0.5, marginTop: 32 }, subtitle: { color: colors.muted, fontSize: 14, marginTop: 7, marginBottom: 23 },
  balanceCard: { padding: 23, borderRadius: 22, backgroundColor: colors.hero, borderWidth: 1, borderColor: '#39362E', shadowColor: '#302819', shadowOpacity: 0.12, shadowRadius: 17, shadowOffset: { width: 0, height: 9 }, elevation: 4 }, balanceTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, balanceEyebrow: { color: '#D4C7A9', fontSize: 10, letterSpacing: 1.7, fontWeight: '700' }, balanceIcon: { color: colors.gold, fontSize: 20 }, balanceAmount: { color: '#FAF7F0', fontFamily: 'Georgia', fontSize: 38, letterSpacing: -0.5, fontWeight: '400', marginTop: 18 }, balanceCaption: { color: '#C2BBAE', fontSize: 12, marginTop: 4 }, balanceDivider: { height: 1, backgroundColor: '#4A463C', marginVertical: 20 }, balanceStats: { flexDirection: 'row', alignItems: 'center' }, statLabel: { color: '#C2BBAE', fontSize: 11 }, statValue: { color: '#FAF7F0', fontSize: 14, fontWeight: '600', marginTop: 5 }, statSep: { width: 1, height: 28, backgroundColor: '#4A463C', marginHorizontal: 23 },
  quickRow: { flexDirection: 'row', gap: 11, marginTop: 13 }, quickAction: { flex: 1, minHeight: 74, paddingHorizontal: 14, borderRadius: 16, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, flexDirection: 'row', alignItems: 'center', gap: 10 }, quickIcon: { width: 31, height: 31, borderRadius: 11, overflow: 'hidden', textAlign: 'center', textAlignVertical: 'center', color: colors.green, backgroundColor: colors.mint, fontWeight: '700', fontSize: 20 }, quickText: { color: colors.ink, fontSize: 12, fontWeight: '600', flexShrink: 1 }, sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 29, marginBottom: 7 }, sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: '700' },
  activityRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.line, gap: 11 }, activityIcon: { width: 38, height: 38, borderRadius: 14, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' }, activityGlyph: { color: colors.ink, fontSize: 18 }, activityInfo: { flex: 1 }, activityTitle: { color: colors.ink, fontSize: 13, fontWeight: '600' }, activityMeta: { color: colors.muted, fontSize: 11, marginTop: 4 }, activityAmount: { color: colors.ink, fontSize: 13, fontWeight: '700' }, income: { color: colors.green },
  empty: { borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, borderRadius: 18, padding: 19 }, emptyIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.mint, marginBottom: 12 }, emptyIconText: { color: colors.green, fontSize: 17 }, panel: { backgroundColor: colors.card, borderRadius: 18, padding: 19, borderWidth: 1, borderColor: colors.line }, panelTitle: { color: colors.ink, fontSize: 16, fontWeight: '700' }, body: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 7 }, loadingCard: { padding: 32, backgroundColor: colors.card, borderRadius: 18 }, insightCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, marginTop: 22, backgroundColor: '#E8EEE5', borderRadius: 17 }, insightMark: { color: colors.green, fontSize: 20 }, insightTitle: { color: colors.ink, fontSize: 13, fontWeight: '700' }, insightCopy: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 4 },
}); }
