import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppPreferences } from '../providers/AppPreferences';
import { supabase } from '../backend';

export function AppMenuLayer() {
  const [open, setOpen] = useState(false);
  const { themeMode, setThemeMode } = useAppPreferences();
  const dark = themeMode === 'dark';
  return <>
    <Pressable accessibilityRole="button" accessibilityLabel="Open app menu" onPress={() => setOpen(true)} style={s.launcher}>
      <Ionicons name="menu-outline" size={22} color="#F1E6CE" />
    </Pressable>
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)} statusBarTranslucent>
      <View style={s.overlay}>
        <Pressable accessibilityLabel="Close menu" style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
        <View style={[s.sheet,dark&&s.darkSheet]}>
          <View style={s.sheetHead}><View><Text style={s.eyebrow}>IBUDGET</Text><Text style={[s.title,dark&&s.darkText]}>Your space</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Close menu" onPress={() => setOpen(false)} style={s.close}><Ionicons name="close" size={21} color="#342F26" /></Pressable></View>
          <Link href="/(tabs)/dashboard" asChild><Pressable onPress={() => setOpen(false)} style={[s.menuRow,dark&&s.darkDivider]}><View style={s.rowIcon}><Ionicons name="home-outline" size={18} color="#866F42" /></View><View style={s.rowCopy}><Text style={[s.rowTitle,dark&&s.darkText]}>Home</Text><Text style={[s.rowDetail,dark&&s.darkMuted]}>Return to your overview</Text></View><Ionicons name="chevron-forward" size={16} color="#A49A88" /></Pressable></Link>
          <Link href="/profile" asChild><Pressable onPress={() => setOpen(false)} style={[s.menuRow,dark&&s.darkDivider]}><View style={s.rowIcon}><Ionicons name="person-outline" size={18} color="#866F42" /></View><View style={s.rowCopy}><Text style={[s.rowTitle,dark&&s.darkText]}>Profile</Text><Text style={[s.rowDetail,dark&&s.darkMuted]}>Your name and preferences</Text></View><Ionicons name="chevron-forward" size={16} color="#A49A88" /></Pressable></Link>
          <Link href="/settings" asChild><Pressable onPress={() => setOpen(false)} style={[s.menuRow,dark&&s.darkDivider]}><View style={s.rowIcon}><Ionicons name="options-outline" size={18} color="#866F42" /></View><View style={s.rowCopy}><Text style={[s.rowTitle,dark&&s.darkText]}>Settings</Text><Text style={[s.rowDetail,dark&&s.darkMuted]}>Appearance and app details</Text></View><Ionicons name="chevron-forward" size={16} color="#A49A88" /></Pressable></Link>
          <View style={[s.themeBlock,dark&&s.darkDivider]}><View><Text style={[s.rowTitle,dark&&s.darkText]}>Appearance</Text><Text style={[s.rowDetail,dark&&s.darkMuted]}>Choose your preferred look</Text></View><View style={[s.segment,dark&&s.darkSegment]}>
            {(['light', 'dark'] as const).map(mode => <Pressable key={mode} accessibilityRole="button" accessibilityState={{ selected: themeMode === mode }} onPress={() => setThemeMode(mode)} style={[s.segmentItem, themeMode === mode && s.segmentSelected]}><Ionicons name={mode === 'light' ? 'sunny-outline' : 'moon-outline'} size={15} color={themeMode === mode ? '#F8F3E9' : '#655D4F'} /><Text style={[s.segmentText, themeMode === mode && s.segmentTextSelected]}>{mode === 'light' ? 'Light' : 'Dark'}</Text></Pressable>)}
          </View></View>
          <View style={s.footer}><Text style={s.footerText}>A thoughtful view of your finances.</Text>{supabase&&<Pressable onPress={() => { setOpen(false); void supabase.auth.signOut(); }} style={s.signOut}><Ionicons name="log-out-outline" size={17} color="#8C4C40" /><Text style={s.signOutText}>Sign out</Text></Pressable>}</View>
        </View>
      </View>
    </Modal>
  </>;
}

const s = StyleSheet.create({
  launcher:{position:'absolute',top:48,right:22,zIndex:50,width:42,height:42,borderRadius:15,backgroundColor:'#25231F',borderWidth:1,borderColor:'#4B4436',alignItems:'center',justifyContent:'center',shadowColor:'#25231F',shadowOpacity:0.16,shadowRadius:9,shadowOffset:{width:0,height:4},elevation:5},
  overlay:{flex:1,backgroundColor:'rgba(22,20,16,0.45)',justifyContent:'flex-start',alignItems:'flex-end',paddingTop:48,paddingRight:16},sheet:{width:340,maxWidth:'92%',backgroundColor:'#FFFDFA',borderRadius:22,padding:20,borderWidth:1,borderColor:'#E4DCCF',shadowColor:'#100F0C',shadowOpacity:0.22,shadowRadius:28,shadowOffset:{width:0,height:12},elevation:10},darkSheet:{backgroundColor:'#22231F',borderColor:'#3D3A32'},darkText:{color:'#F2EEE5'},darkMuted:{color:'#B8B1A4'},darkDivider:{borderTopColor:'#3D3A32'},darkSegment:{backgroundColor:'#171815'},sheetHead:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:14},eyebrow:{color:'#8A7448',fontSize:9,fontWeight:'700',letterSpacing:1.8},title:{color:'#25231F',fontFamily:'Georgia',fontSize:25,marginTop:3},close:{width:34,height:34,borderRadius:12,backgroundColor:'#F0EBE1',alignItems:'center',justifyContent:'center'},
  menuRow:{flexDirection:'row',alignItems:'center',gap:12,paddingVertical:13,borderTopWidth:1,borderTopColor:'#EEE8DE'},rowIcon:{width:38,height:38,borderRadius:13,backgroundColor:'#F0EADF',alignItems:'center',justifyContent:'center'},rowCopy:{flex:1},rowTitle:{color:'#302C25',fontSize:14,fontWeight:'700'},rowDetail:{color:'#827B6E',fontSize:11,marginTop:3},themeBlock:{borderTopWidth:1,borderTopColor:'#EEE8DE',paddingTop:14,marginTop:2},segment:{flexDirection:'row',backgroundColor:'#F0EBE1',borderRadius:13,padding:4,marginTop:11},segmentItem:{flex:1,flexDirection:'row',justifyContent:'center',alignItems:'center',gap:7,paddingVertical:10,borderRadius:10},segmentSelected:{backgroundColor:'#25231F'},segmentText:{fontSize:12,fontWeight:'600',color:'#655D4F'},segmentTextSelected:{color:'#F8F3E9'},footer:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',borderTopWidth:1,borderTopColor:'#EEE8DE',paddingTop:15,marginTop:15},footerText:{color:'#898275',fontSize:10},signOut:{flexDirection:'row',alignItems:'center',gap:6,padding:7},signOutText:{fontSize:12,fontWeight:'700',color:'#8C4C40'},
});
