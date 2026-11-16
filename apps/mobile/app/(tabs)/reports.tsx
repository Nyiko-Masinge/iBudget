import { useEffect, useState } from 'react';
import { Link } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { listRecentTransactions } from '@ibudget/data-access';
import { formatMoney } from '@ibudget/finance-core';
import { supabase, supabaseConfigured } from '../../src/backend';

export default function Reports() {
  const [session, setSession] = useState<boolean | null>(null);
  useEffect(() => {
    if (!supabase) { setSession(false); return; }
    let alive = true;
    supabase.auth.getSession().then(({ data }) => { if (alive) setSession(!!data.session); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, value) => setSession(!!value));
    return () => { alive = false; subscription.unsubscribe(); };
  }, []);
  const query = useQuery({ queryKey: ['transactions', 'report'], enabled: !!supabase && session === true, queryFn: () => listRecentTransactions(supabase!, 100) });

  if (!supabaseConfigured) return <Empty title="Connect your workspace" detail="Your private financial insights will appear here." />;
  if (session === null || query.isLoading) return <View style={s.center}><ActivityIndicator color="#8A7448" /></View>;
  if (!session) return <Empty title="Sign in to continue" detail="Sign in from Home to see your private insights." />;
  if (query.isError) return <Empty title="Couldn’t load insights" detail={query.error.message} />;

  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const rows = (query.data ?? []).filter(row => row.occurred_at.slice(0, 10) >= monthStart);
  const currencies = [...new Set(rows.map(row => row.currency.trim()))];

  return <ScrollView style={s.page} contentContainerStyle={s.content}>
    <Text style={s.eyebrow}>YOUR MONEY, IN PERSPECTIVE</Text>
    <Text style={s.title}>Insights</Text>
    <Text style={s.body}>A clear monthly picture, drawn from your recent activity.</Text>
    <Link href="/(tabs)/achievements" style={s.awardsLink}>Milestones &amp; achievements  ↗</Link>
    {currencies.length === 0 ? <View style={s.card}><Text style={s.heading}>A fresh month</Text><Text style={s.body}>Your monthly summary will appear here when you record activity.</Text></View> : currencies.map(currency => {
      const items = rows.filter(row => row.currency.trim() === currency);
      const income = items.filter(row => row.transaction_type === 'income').reduce((sum, row) => sum + row.amount_minor, 0);
      const gross = items.filter(row => row.transaction_type === 'expense').reduce((sum, row) => sum + row.amount_minor, 0);
      const refunds = items.filter(row => row.transaction_type === 'refund').reduce((sum, row) => sum + row.amount_minor, 0);
      const net = gross - refunds;
      return <View key={currency} style={s.card}>
        <Text style={s.cardKicker}>MONTHLY SUMMARY</Text>
        <Text style={s.heading}>{currency}</Text>
        <Metric label="Income" value={income} currency={currency} />
        <Metric label="Spending" value={gross} currency={currency} />
        <Metric label="Refunds" value={refunds} currency={currency} />
        <View style={s.divider} />
        <Metric label="Net expenses" value={net} currency={currency} />
        <View style={s.netCard}><Text style={s.netLabel}>Income after net expenses</Text><Text style={s.netValue}>{formatMoney(income - net, currency)}</Text></View>
      </View>;
    })}
    <Text style={s.note}>Transfers are excluded. Refunds reduce expenses. Summary is based on the 100 most recent saved transactions.</Text>
  </ScrollView>;
}

function Metric({ label, value, currency }: { label: string; value: number; currency: string }) {
  return <View style={s.metric}><Text style={s.metricLabel}>{label}</Text><Text style={s.metricValue}>{formatMoney(value, currency)}</Text></View>;
}
function Empty({ title, detail }: { title: string; detail: string }) { return <View style={s.center}><Text style={s.title}>{title}</Text><Text style={s.body}>{detail}</Text></View>; }

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F4F0E8' }, content: { padding: 24, paddingTop: 54, paddingBottom: 40 }, center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F4F0E8', padding: 28 },
  eyebrow: { color: '#8A7448', fontSize: 10, fontWeight: '700', letterSpacing: 1.8 }, title: { color: '#25231F', fontFamily: 'Georgia', fontSize: 32, fontWeight: '400', marginTop: 9 }, body: { color: '#777167', lineHeight: 22, marginTop: 8 }, awardsLink: { alignSelf: 'flex-start', color: '#8A7448', fontSize: 13, fontWeight: '700', marginTop: 15 },
  card: { backgroundColor: '#FFFDFA', borderRadius: 20, padding: 20, marginTop: 19, borderWidth: 1, borderColor: '#E4DCCF', shadowColor: '#352B1A', shadowOpacity: 0.04, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 1 }, cardKicker: { color: '#8A7448', fontSize: 10, fontWeight: '700', letterSpacing: 1.5 }, heading: { color: '#25231F', fontFamily: 'Georgia', fontSize: 25, marginTop: 6 }, metric: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#EEE8DE' }, metricLabel: { color: '#777167', fontSize: 13 }, metricValue: { color: '#25231F', fontSize: 14, fontWeight: '600' }, divider: { height: 1, backgroundColor: '#D9CFBE', marginVertical: 4 }, netCard: { backgroundColor: '#F0EADF', borderRadius: 14, padding: 15, marginTop: 14 }, netLabel: { color: '#777167', fontSize: 12 }, netValue: { color: '#25231F', fontFamily: 'Georgia', fontSize: 24, marginTop: 7 }, note: { color: '#827C71', fontSize: 11, lineHeight: 17, marginTop: 15 },
});
