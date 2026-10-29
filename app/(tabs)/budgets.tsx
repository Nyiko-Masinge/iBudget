import { View, Text, StyleSheet } from 'react-native';
export default function Budgets(){return <Section title="Budgets"/>}
export function Section({title}:{title:string}){return <View style={s.wrap}><Text style={s.title}>{title}</Text><Text style={s.text}>This section is ready for your saved financial data. No demonstration figures are presented as your own.</Text></View>}
const s=StyleSheet.create({wrap:{flex:1,backgroundColor:'#F5F8F6',padding:24,paddingTop:60},title:{fontSize:28,fontWeight:'700',color:'#16231D'},text:{marginTop:12,color:'#627169',lineHeight:22}});
