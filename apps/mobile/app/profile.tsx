import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getProfile, saveProfile } from '@ibudget/data-access';
import { supabase, supabaseConfigured } from '../src/backend';
import { useAppPreferences } from '../src/providers/AppPreferences';

export default function Profile() {
  const [displayName, setDisplayName] = useState('');
  const [currency, setCurrency] = useState('ZAR');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const { themeMode } = useAppPreferences();
  const dark = themeMode === 'dark';
  const queryClient = useQueryClient();
  useEffect(() => { void supabase?.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? '')); }, []);
  const profile = useQuery({ queryKey: ['profile'], enabled: !!supabase, queryFn: () => getProfile(supabase!) });
  useEffect(() => { if (profile.data) { setDisplayName(profile.data.display_name ?? ''); setCurrency(profile.data.preferred_currency); } }, [profile.data]);
  const update = useMutation({ mutationFn: () => { if (!supabase) throw new Error('Connect your account first.'); return saveProfile(supabase, { displayName, preferredCurrency: currency }); }, onSuccess: async () => { setMessage('Profile saved.'); await queryClient.invalidateQueries({ queryKey: ['profile'] }); }, onError: error => setMessage(error instanceof Error ? error.message : 'Could not save your profile.') });

  return <ScrollView style={[s.page, dark && s.darkPage]} contentContainerStyle={s.content}>
    <Text style={[s.eyebrow, dark && s.darkAccent]}>PERSONAL DETAILS</Text><Text style={[s.title, dark && s.darkText]}>Profile</Text><Text style={[s.body, dark && s.darkMuted]}>A few details to make your iBudget feel like yours.</Text>
    {!supabaseConfigured ? <View style={[s.card, dark && s.darkCard]}><Text style={[s.cardTitle, dark && s.darkText]}>Connect your workspace</Text><Text style={[s.body, dark && s.darkMuted]}>Add your Supabase settings to manage your profile.</Text></View> : profile.isLoading ? <ActivityIndicator color="#B79A5F" /> : profile.isError ? <View style={[s.card, dark && s.darkCard]}><Text style={[s.body, dark && s.darkMuted]}>Your profile couldn’t be loaded. Please try again.</Text></View> : <>
      <View style={[s.identity, dark && s.darkCard]}><View style={s.avatar}><Text style={s.avatarLetter}>{(displayName.trim()[0] || email[0] || 'I').toUpperCase()}</Text></View><View style={s.identityText}><Text style={[s.identityName, dark && s.darkText]}>{displayName || 'Your profile'}</Text><Text style={[s.identityEmail, dark && s.darkMuted]}>{email}</Text></View></View>
      <View style={[s.card, dark && s.darkCard]}><Text style={[s.label, dark && s.darkText]}>Display name</Text><TextInput accessibilityLabel="Display name" value={displayName} onChangeText={setDisplayName} placeholder="Your name" placeholderTextColor={dark ? '#AAA397' : '#777167'} style={[s.input, dark && s.darkInput]} maxLength={100}/><Text style={[s.label, s.labelNext, dark && s.darkText]}>Preferred currency</Text><TextInput accessibilityLabel="Preferred currency" value={currency} onChangeText={value => setCurrency(value.toUpperCase().slice(0,3))} placeholder="ZAR" placeholderTextColor={dark ? '#AAA397' : '#777167'} autoCapitalize="characters" style={[s.input, dark && s.darkInput]} maxLength={3}/><Text style={[s.helper, dark && s.darkMuted]}>This preference is used for your profile. Account currencies remain attached to each saved account.</Text><Pressable disabled={update.isPending} onPress={()=>{setMessage('');update.mutate()}} style={s.button}><Text style={s.buttonText}>{update.isPending?'Saving…':'Save profile'}</Text></Pressable>{!!message&&<Text accessibilityRole="alert" style={[s.feedback,dark&&s.darkMuted]}>{message}</Text>}</View>
    </>}
  </ScrollView>;
}

const s=StyleSheet.create({page:{flex:1,backgroundColor:'#F4F0E8'},darkPage:{backgroundColor:'#171815'},content:{padding:24,paddingTop:58,paddingBottom:42},eyebrow:{color:'#8A7448',fontSize:10,fontWeight:'700',letterSpacing:1.8},darkAccent:{color:'#D2B878'},title:{color:'#25231F',fontFamily:'Georgia',fontSize:34,marginTop:9},darkText:{color:'#F2EEE5'},body:{color:'#777167',lineHeight:22,marginTop:8},darkMuted:{color:'#B8B1A4'},card:{backgroundColor:'#FFFDFA',borderWidth:1,borderColor:'#E4DCCF',borderRadius:20,padding:20,marginTop:22},darkCard:{backgroundColor:'#22231F',borderColor:'#3D3A32'},identity:{flexDirection:'row',alignItems:'center',gap:14,backgroundColor:'#FFFDFA',borderWidth:1,borderColor:'#E4DCCF',borderRadius:20,padding:18,marginTop:22},avatar:{width:52,height:52,borderRadius:18,backgroundColor:'#EDE5D7',alignItems:'center',justifyContent:'center'},avatarLetter:{color:'#806A40',fontFamily:'Georgia',fontSize:24},identityText:{flex:1},identityName:{color:'#25231F',fontSize:16,fontWeight:'700'},identityEmail:{color:'#777167',fontSize:12,marginTop:5},cardTitle:{color:'#25231F',fontWeight:'700',fontSize:16},label:{color:'#514B40',fontSize:13,fontWeight:'600'},labelNext:{marginTop:18},input:{backgroundColor:'#F8F5EF',borderWidth:1,borderColor:'#E4DCCF',borderRadius:12,padding:14,color:'#25231F',fontSize:15,marginTop:8},darkInput:{backgroundColor:'#191A17',borderColor:'#4B473C',color:'#F2EEE5'},helper:{color:'#827B6E',fontSize:11,lineHeight:17,marginTop:10},button:{backgroundColor:'#25231F',padding:15,borderRadius:13,alignItems:'center',marginTop:20},buttonText:{color:'#F4E9CF',fontWeight:'700'},feedback:{color:'#514B40',marginTop:12}});
