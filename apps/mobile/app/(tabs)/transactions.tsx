import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFinancialAccount, createFinancialTransaction, deleteFinancialTransaction, getProfile, listFinancialAccounts, listRecentTransactions, listTransactionCategories, updateFinancialTransaction } from '@ibudget/data-access';
import { formatMoney } from '@ibudget/finance-core';
import { supabase, supabaseConfigured } from '../../src/backend';
import { useAppPreferences } from '../../src/providers/AppPreferences';

type TransactionType = 'income' | 'expense';
const green = '#26745A';
function confirmDelete(title:string,message:string,onConfirm:()=>void){if(Platform.OS==='web'){if(typeof window!=='undefined'&&window.confirm(`${title}\n\n${message}`))onConfirm();return;}Alert.alert(title,message,[{text:'Cancel',style:'cancel'},{text:'Delete',style:'destructive',onPress:onConfirm}]);}

function amountToMinorUnits(value: string) {
  const normalized = value.trim().replace(',', '.');
  if (!/^\d{1,13}(?:\.\d{1,2})?$/.test(normalized)) throw new Error('Enter an amount with up to two decimal places.');
  const [whole, fraction = ''] = normalized.split('.');
  const minor = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(minor) || minor <= 0) throw new Error('Enter an amount greater than zero.');
  return minor;
}

export default function Transactions() {
  const queryClient = useQueryClient();
  const dark = useAppPreferences().themeMode === 'dark';
  const [session, setSession] = useState<boolean | null>(null);
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [creatingAccount, setCreatingAccount] = useState(false);

  useEffect(() => {
    if (!supabase) { setSession(false); return; }
    let alive = true;
    supabase.auth.getSession().then(({ data }) => { if (alive) setSession(!!data.session); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => setSession(!!next));
    return () => { alive = false; subscription.unsubscribe(); };
  }, []);

  const accountsQuery = useQuery({ queryKey: ['accounts'], enabled: !!supabase && session === true, queryFn: () => listFinancialAccounts(supabase!) });
  const profileQuery = useQuery({ queryKey: ['profile'], enabled: !!supabase && session === true, queryFn: () => getProfile(supabase!) });
  const transactionsQuery = useQuery({ queryKey: ['transactions', 'recent'], enabled: !!supabase && session === true, queryFn: () => listRecentTransactions(supabase!, 100) });
  const categoriesQuery = useQuery({ queryKey: ['transaction-categories', type], enabled: !!supabase && session === true, queryFn: () => listTransactionCategories(supabase!, type) });
  const accounts = accountsQuery.data ?? [];
  const selectedAccount = accounts.find((account) => account.id === accountId) ?? accounts[0];
  const categories = categoriesQuery.data ?? [];

  useEffect(() => {
    if (!accountId && accounts.length > 0) setAccountId(accounts[0].id);
  }, [accountId, accounts]);

  useEffect(() => { setCategoryId(''); }, [type]);

  const saveTransaction = useMutation({
    mutationFn: async () => {
      if (!supabase || !selectedAccount) throw new Error('Create an account before adding a transaction.');
      await createFinancialTransaction(supabase, {
        accountId: selectedAccount.id,
        categoryId: categoryId || null,
        type,
        amountMinor: amountToMinorUnits(amount),
        currency: selectedAccount.currency.trim(),
        description,
        occurredAt: new Date().toISOString(),
      });
    },
    onSuccess: async () => {
      setAmount(''); setDescription(''); setCategoryId(''); setMessage('Transaction saved.');
      await Promise.all([queryClient.invalidateQueries({ queryKey: ['transactions'] }), queryClient.invalidateQueries({ queryKey: ['dashboard-transactions'] })]);
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : 'Could not save the transaction.'),
  });
  const editTransaction = useMutation({
    mutationFn: async () => { if (!supabase || !editingId) throw new Error('Select a transaction to edit.'); await updateFinancialTransaction(supabase,{id:editingId,amountMinor:amountToMinorUnits(amount),description}); },
    onSuccess: async () => { setEditingId(null);setAmount('');setDescription('');setMessage('Transaction updated.');await Promise.all([queryClient.invalidateQueries({queryKey:['transactions']}),queryClient.invalidateQueries({queryKey:['dashboard-transactions']})]); },
    onError: error => setMessage(error instanceof Error?error.message:'Could not update transaction.'),
  });
  const removeTransaction = useMutation({mutationFn:(id:string)=>{if(!supabase)throw new Error('Connect your account first.');return deleteFinancialTransaction(supabase,id)},onSuccess:async()=>{setMessage('Transaction deleted.');await Promise.all([queryClient.invalidateQueries({queryKey:['transactions']}),queryClient.invalidateQueries({queryKey:['dashboard-transactions']})])},onError:error=>setMessage(error instanceof Error?error.message:'Could not delete transaction.')});

  async function addFirstAccount() {
    if (!supabase) return;
    setCreatingAccount(true); setMessage('');
    try {
      const account = await createFinancialAccount(supabase, { name: 'Everyday account', accountType: 'cash', currency: profileQuery.data?.preferred_currency ?? 'ZAR' });
      setAccountId(account.id);
      await queryClient.invalidateQueries({ queryKey: ['accounts'] });
      setMessage('Cash account created.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not create the account.');
    } finally { setCreatingAccount(false); }
  }

  if (!supabaseConfigured) return <View style={[s.center,dark&&s.darkPage]}><Text style={[s.title,dark&&s.darkText]}>Transactions</Text><Text style={[s.body,dark&&s.darkMuted]}>Connect your Supabase project to securely save transactions.</Text></View>;
  if (session === null) return <View style={[s.center,dark&&s.darkPage]}><ActivityIndicator color="#B79A5F"/></View>;
  if (!session) return <View style={[s.center,dark&&s.darkPage]}><Text style={[s.title,dark&&s.darkText]}>Sign in to continue</Text><Text style={[s.body,dark&&s.darkMuted]}>Your financial records stay private to your account. Sign in from the Home tab to manage transactions.</Text></View>;

  return <ScrollView style={[s.page,dark&&s.darkPage]} contentContainerStyle={s.content}>
    <Text style={[s.eyebrow,dark&&s.darkAccent]}>YOUR LEDGER</Text>
    <Text style={[s.title,dark&&s.darkText]}>Transactions</Text>
    <Text style={[s.body,dark&&s.darkMuted]}>A considered record of money moving through your life.</Text>

    {accountsQuery.isLoading ? <ActivityIndicator color={green}/> : accounts.length === 0 ? <View style={s.panel}>
      <Text style={s.panelTitle}>Start with an account</Text>
      <Text style={s.body}>Transactions need an account to belong to. We’ll create a cash account in ZAR.</Text>
      <Pressable accessibilityRole="button" disabled={creatingAccount||profileQuery.isLoading} onPress={addFirstAccount} style={s.primaryButton}>
        <Text style={s.primaryButtonText}>{creatingAccount ? 'Creating…' : profileQuery.isLoading?'Preparing…':'Create my cash account'}</Text>
      </Pressable>
    </View> : <View style={[s.panel,dark&&s.darkPanel]}>
      <Text style={[s.panelTitle,dark&&s.darkText]}>Add transaction</Text>
      {!editingId&&<View style={[s.segmentRow,dark&&s.darkSegment]}>
        {(['expense', 'income'] as const).map((option) => <Pressable key={option} accessibilityRole="button" accessibilityState={{ selected: type === option }} onPress={() => setType(option)} style={[s.segment, type === option && s.segmentActive]}>
          <Text style={[s.segmentText, type === option && s.segmentTextActive,dark&&s.darkMuted]}>{option === 'expense' ? 'Expense' : 'Income'}</Text>
        </Pressable>)}
      </View>}
      <Text style={[s.fieldLabel,dark&&s.darkText]}>Amount ({selectedAccount?.currency.trim() ?? 'ZAR'})</Text>
      <TextInput accessibilityLabel="Amount" keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={dark?'#AAA397':'#777167'} value={amount} onChangeText={setAmount} style={[s.input,dark&&s.darkInput]}/>
      <Text style={[s.fieldLabel,dark&&s.darkText]}>What was it for?</Text>
      <TextInput accessibilityLabel="Description" placeholder="e.g. Groceries" placeholderTextColor={dark?'#AAA397':'#777167'} maxLength={240} value={description} onChangeText={setDescription} style={[s.input,dark&&s.darkInput]}/>
      {accounts.length > 1 && <><Text style={[s.fieldLabel,dark&&s.darkText]}>Account</Text><View style={s.chipRow}>{accounts.map((account) => <Pressable key={account.id} onPress={() => setAccountId(account.id)} style={[s.chip,dark&&s.darkChip, selectedAccount?.id === account.id && s.chipActive]}><Text style={[s.chipText,dark&&s.darkMuted, selectedAccount?.id === account.id && s.chipTextActive]}>{account.name}</Text></Pressable>)}</View></>}
      {categories.length > 0 && <><Text style={[s.fieldLabel,dark&&s.darkText]}>Category (optional)</Text><View style={s.chipRow}><Pressable onPress={() => setCategoryId('')} style={[s.chip,dark&&s.darkChip, !categoryId && s.chipActive]}><Text style={[s.chipText,dark&&s.darkMuted, !categoryId && s.chipTextActive]}>None</Text></Pressable>{categories.map((category) => <Pressable key={category.id} onPress={() => setCategoryId(category.id)} style={[s.chip,dark&&s.darkChip, categoryId === category.id && s.chipActive]}><Text style={[s.chipText,dark&&s.darkMuted, categoryId === category.id && s.chipTextActive]}>{category.name}</Text></Pressable>)}</View></>}
      <Pressable accessibilityRole="button" disabled={saveTransaction.isPending||editTransaction.isPending} onPress={() => { setMessage(''); editingId?editTransaction.mutate():saveTransaction.mutate(); }} style={[s.primaryButton, (saveTransaction.isPending||editTransaction.isPending) && s.disabled]}>
        <Text style={s.primaryButtonText}>{saveTransaction.isPending||editTransaction.isPending ? 'Saving…' : editingId?'Update transaction':'Save transaction'}</Text>
      </Pressable>
      {editingId&&<Pressable onPress={()=>{setEditingId(null);setAmount('');setDescription('')}}><Text style={s.feedback}>Cancel editing</Text></Pressable>}
      {!!message && <Text accessibilityRole="alert" style={s.feedback}>{message}</Text>}
    </View>}

    {!!message && accounts.length === 0 && <Text accessibilityRole="alert" style={s.feedback}>{message}</Text>}
    <Text style={[s.sectionTitle,dark&&s.darkText]}>Recent activity</Text>
    {transactionsQuery.isLoading ? <ActivityIndicator color="#B79A5F"/> : transactionsQuery.isError ? <View style={[s.empty,dark&&s.darkPanel]}><Text style={[s.emptyTitle,dark&&s.darkText]}>Couldn’t load transactions</Text><Text style={[s.body,dark&&s.darkMuted]}>{transactionsQuery.error instanceof Error ? transactionsQuery.error.message : 'The request failed. Try again.'}</Text><Pressable accessibilityRole="button" onPress={() => void transactionsQuery.refetch()}><Text style={s.feedback}>Tap to try again</Text></Pressable></View> : (transactionsQuery.data ?? []).length === 0 ? <View style={[s.empty,dark&&s.darkPanel]}><Text style={[s.emptyTitle,dark&&s.darkText]}>No transactions yet</Text><Text style={[s.body,dark&&s.darkMuted]}>Your saved income and expenses will appear here.</Text></View> : (transactionsQuery.data ?? []).map((transaction) => <View key={transaction.id} style={[s.transactionRow,dark&&s.darkRow]}>
      <View style={s.transactionDetails}><Text style={[s.transactionTitle,dark&&s.darkText]} numberOfLines={1}>{transaction.description}</Text><Text style={[s.transactionMeta,dark&&s.darkMuted]}>{transaction.transaction_type} · {new Date(transaction.occurred_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}</Text><View style={s.rowActions}><Pressable onPress={()=>{setEditingId(transaction.id);setDescription(transaction.description);setAmount((transaction.amount_minor/100).toFixed(2));setType(transaction.transaction_type==='income'?'income':'expense');setMessage('')}}><Text style={[s.actionText,dark&&s.darkAccent]}>Edit</Text></Pressable><Pressable onPress={()=>confirmDelete('Delete transaction?',`Delete “${transaction.description}”?`,()=>removeTransaction.mutate(transaction.id))}><Text style={s.deleteText}>Delete</Text></Pressable></View></View>
      <Text style={[s.transactionAmount, transaction.transaction_type === 'income' ? s.income : s.expense]}>{transaction.transaction_type === 'income' ? '+' : '−'}{formatMoney(transaction.amount_minor, transaction.currency.trim())}</Text>
    </View>)}
  </ScrollView>;
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F4F0E8' }, darkPage:{backgroundColor:'#171815'},darkText:{color:'#F2EEE5'},darkMuted:{color:'#B8B1A4'},darkAccent:{color:'#D2B878'},content: { padding: 24, paddingTop: 54, paddingBottom: 38 }, center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F4F0E8', padding: 28 },
  eyebrow: { color: green, fontSize: 10, fontWeight: '700', letterSpacing: 1.8 }, title: { fontFamily:'Georgia',fontSize: 32, fontWeight: '400', color: '#25231F', marginTop: 9, letterSpacing: -0.4 }, body: { color: '#777167', lineHeight: 22, marginTop: 8 },
  panel: { backgroundColor: '#FFFDFA', borderRadius: 19, padding: 19, marginTop: 20, borderWidth: 1, borderColor: '#E4DCCF', shadowColor:'#352B1A',shadowOpacity:0.035,shadowRadius:12,shadowOffset:{width:0,height:5},elevation:1 },darkPanel:{backgroundColor:'#22231F',borderColor:'#3D3A32'}, panelTitle: { color: '#25231F', fontWeight: '700', fontSize: 18, marginBottom: 4 },
  segmentRow: { flexDirection: 'row', backgroundColor: '#F0EBE1', padding: 4, borderRadius: 12, marginTop: 16 },darkSegment:{backgroundColor:'#191A17'}, segment: { flex: 1, alignItems: 'center', padding: 11, borderRadius: 9 }, segmentActive: { backgroundColor: '#FFFDFA' }, segmentText: { color: '#777167', fontWeight: '600' }, segmentTextActive: { color: green },
  fieldLabel: { color: '#4C473E', fontSize: 13, fontWeight: '600', marginTop: 15, marginBottom: 6 }, input: { backgroundColor: '#F8F5EF', color: '#25231F', borderWidth: 1, borderColor: '#E4DCCF', borderRadius: 11, paddingHorizontal: 14, paddingVertical: 13 },darkInput:{backgroundColor:'#191A17',color:'#F2EEE5',borderColor:'#4B473C'},
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, chip: { borderWidth: 1, borderColor: '#DDD4C5', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 12 },darkChip:{borderColor:'#4B473C',backgroundColor:'#22231F'}, chipActive: { backgroundColor: '#EFE6D5', borderColor: green }, chipText: { color: '#777167', fontSize: 13 }, chipTextActive: { color: green, fontWeight: '600' },
  primaryButton: { backgroundColor: '#25231F', borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 18 }, primaryButtonText: { color: '#F4E9CF', fontWeight: '700' }, disabled: { opacity: 0.65 }, feedback: { color: '#554E42', marginTop: 12, lineHeight: 20 },
  sectionTitle: { fontFamily:'Georgia',color: '#25231F', fontSize: 21, fontWeight: '400', marginTop: 28, marginBottom: 10 }, empty: { backgroundColor: '#FFFDFA', borderRadius: 16, borderWidth: 1, borderColor: '#E4DCCF', padding: 18 }, emptyTitle: { color: '#25231F', fontWeight: '600' },
  transactionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#E4DCCF', gap: 14 },darkRow:{borderBottomColor:'#3D3A32'}, transactionDetails: { flex: 1 }, transactionTitle: { color: '#25231F', fontWeight: '600' }, transactionMeta: { color: '#777167', fontSize: 12, marginTop: 4, textTransform: 'capitalize' }, transactionAmount: { fontWeight: '700' }, income: { color: green }, expense: { color: '#554E42' }, rowActions:{flexDirection:'row',gap:16,marginTop:6},actionText:{color:green,fontSize:12,fontWeight:'700'},deleteText:{color:'#A34D43',fontSize:12,fontWeight:'700'},
});
