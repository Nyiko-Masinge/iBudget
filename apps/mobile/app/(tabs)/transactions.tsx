import { View, Text, StyleSheet } from 'react-native';
export default function Transactions(){return <View style={s.wrap}><Text style={s.title}>Transactions</Text><Text style={s.text}>Your saved ledger is shown on Home. Transaction entry and editing are the next feature slice.</Text></View>}
const s=StyleSheet.create({wrap:{flex:1,backgroundColor:'#F5F8F6',padding:24,paddingTop:60},title:{fontSize:28,fontWeight:'700',color:'#16231D'},text:{marginTop:12,color:'#627169',lineHeight:22}});
