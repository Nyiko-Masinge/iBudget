import { useEffect, useState } from 'react';
import { Link } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { listRecentTransactions } from '@ibudget/data-access';
import { formatMoney } from '@ibudget/finance-core';
import { supabase, supabaseConfigured } from '../../src/backend';
import { useAppPreferences } from '../../src/providers/AppPreferences';

type ChartView = 'bars' | 'trend' | 'infographic';

export default function Reports() {
  const [session, setSession] = useState<boolean | null>(null);
  const [chartView, setChartView] = useState<ChartView>('bars');
  const dark = useAppPreferences().themeMode === 'dark';
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
  if (query.isError) return <Empty title="Couldn’t load insights" detail="Your report couldn’t be loaded. Please try again." />;

  const now = new Date();
  const rows = (query.data ?? []).filter(row => { const date = new Date(row.occurred_at); return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth(); });
  const currencies = [...new Set(rows.map(row => row.currency.trim()))];

  return <ScrollView style={[s.page,dark&&s.darkPage]} contentContainerStyle={s.content}>
    <Text style={[s.eyebrow,dark&&s.darkAccent]}>YOUR MONEY, IN PERSPECTIVE</Text>
    <Text style={[s.title,dark&&s.darkText]}>Insights</Text>
    <Text style={[s.body,dark&&s.darkMuted]}>A clear monthly picture, drawn from your recent activity.</Text>
    <Link href="/(tabs)/achievements" style={s.awardsLink}>Milestones &amp; achievements  ↗</Link>
    <View style={[s.chartPicker,dark&&s.darkChartPicker]}>{([['bars','Bars'],['trend','Trend'],['infographic','Infographic']] as const).map(([value,label])=><Pressable key={value} accessibilityRole="button" accessibilityState={{selected:chartView===value}} onPress={()=>setChartView(value)} style={[s.chartOption,chartView===value&&s.chartSelected]}><Text style={[s.chartOptionText,chartView===value&&s.chartSelectedText]}>{label}</Text></Pressable>)}</View>
    {currencies.length === 0 ? <View style={[s.card,dark&&s.darkCard]}><Text style={[s.heading,dark&&s.darkText]}>A fresh month</Text><Text style={[s.body,dark&&s.darkMuted]}>Your monthly summary will appear here when you record activity.</Text></View> : currencies.map(currency => {
      const items = rows.filter(row => row.currency.trim() === currency);
      const income = items.filter(row => row.transaction_type === 'income').reduce((sum, row) => sum + row.amount_minor, 0);
      const gross = items.filter(row => row.transaction_type === 'expense').reduce((sum, row) => sum + row.amount_minor, 0);
      const refunds = items.filter(row => row.transaction_type === 'refund').reduce((sum, row) => sum + row.amount_minor, 0);
      const net = gross - refunds;
      const weeks = [0,1,2,3,4].map(index => {
        const weekRows = items.filter(row => Math.min(4, Math.floor((new Date(row.occurred_at).getDate()-1)/7)) === index);
        return { label: `W${index+1}`, income: weekRows.filter(row=>row.transaction_type==='income').reduce((sum,row)=>sum+row.amount_minor,0), spending: weekRows.filter(row=>row.transaction_type==='expense').reduce((sum,row)=>sum+row.amount_minor,0) };
      });
      return <View key={currency} style={[s.card,dark&&s.darkCard]}>
        <Text style={s.cardKicker}>MONTHLY SUMMARY</Text>
        <Text style={[s.heading,dark&&s.darkText]}>{currency}</Text>
        <Chart view={chartView} weeks={weeks} currency={currency} dark={dark}/>
        <Metric label="Income" value={income} currency={currency} dark={dark}/>
        <Metric label="Spending" value={gross} currency={currency} dark={dark}/>
        <Metric label="Refunds" value={refunds} currency={currency} dark={dark}/>
        <View style={s.divider} />
        <Metric label="Net expenses" value={net} currency={currency} dark={dark}/>
        <View style={[s.netCard,dark&&s.darkNetCard]}><Text style={[s.netLabel,dark&&s.darkMuted]}>Income after net expenses</Text><Text style={[s.netValue,dark&&s.darkText]}>{formatMoney(income - net, currency)}</Text></View>
      </View>;
    })}
    <Text style={[s.note,dark&&s.darkMuted]}>Transfers are excluded. Refunds reduce expenses. Summary is based on the 100 most recent saved transactions.</Text>
  </ScrollView>;
}

function Metric({ label, value, currency, dark }: { label: string; value: number; currency: string; dark: boolean }) {
  return <View style={[s.metric,dark&&s.darkMetric]}><Text style={[s.metricLabel,dark&&s.darkMuted]}>{label}</Text><Text style={[s.metricValue,dark&&s.darkText]}>{formatMoney(value, currency)}</Text></View>;
}
function Chart({view,weeks,currency,dark}:{view:ChartView;weeks:{label:string;income:number;spending:number}[];currency:string;dark:boolean}) {
  const max=Math.max(1,...weeks.flatMap(week=>[week.income,week.spending]));
  if(view==='infographic')return <View style={[s.chartArea,dark&&s.darkChartArea]}><Text style={[s.chartTitle,dark&&s.darkText]}>At a glance</Text>{([{name:'Income',value:weeks.reduce((sum,w)=>sum+w.income,0),color:'#8A7448'},{name:'Spending',value:weeks.reduce((sum,w)=>sum+w.spending,0),color:'#6C7770'}]).map(item=><View key={item.name} style={s.infoMetric}><View style={s.infoHead}><Text style={[s.chartLabel,dark&&s.darkMuted]}>{item.name}</Text><Text style={[s.chartValue,dark&&s.darkText]}>{formatMoney(item.value,currency)}</Text></View><View style={[s.progressTrack,dark&&s.darkProgressTrack]}><View style={[s.progressFill,{width:`${Math.max(2,item.value/max*100)}%` as `${number}%`,backgroundColor:item.color}]}/></View></View>)}</View>;
  if(view==='bars')return <View style={[s.chartArea,dark&&s.darkChartArea]}><Text style={[s.chartTitle,dark&&s.darkText]}>Income &amp; spending by week</Text><View style={s.barChart}>{weeks.map(week=><View key={week.label} style={s.barGroup}><View style={s.bars}><View style={[s.bar,{height:`${Math.max(3,week.income/max*100)}%` as `${number}%`,backgroundColor:'#B49A64'}]}/><View style={[s.bar,{height:`${Math.max(3,week.spending/max*100)}%` as `${number}%`,backgroundColor:'#737C72'}]}/></View><Text style={[s.weekLabel,dark&&s.darkMuted]}>{week.label}</Text></View>)}</View><View style={s.legend}><Legend color="#B49A64" text="Income" dark={dark}/><Legend color="#737C72" text="Spending" dark={dark}/></View></View>;
  const series=[{key:'income',color:'#B49A64'},{key:'spending',color:'#737C72'}] as const;
  const points=series.map(line=>weeks.map((week,index)=>({x:10+index*51,y:110-(week[line.key]/max*92)})));
  return <View style={[s.chartArea,dark&&s.darkChartArea]}><Text style={[s.chartTitle,dark&&s.darkText]}>Weekly trend</Text><View style={s.trendChart}>{points.map((line,lineIndex)=><View key={series[lineIndex].key}>{line.slice(0,-1).map((point,index)=>{const next=line[index+1],dx=next.x-point.x,dy=next.y-point.y,length=Math.sqrt(dx*dx+dy*dy),angle=Math.atan2(dy,dx);return <View key={`line-${index}`} style={[s.connector,{left:(point.x+next.x)/2-length/2,top:(point.y+next.y)/2,width:length,backgroundColor:series[lineIndex].color,transform:[{rotate:`${angle}rad`}]}]}/>})}{line.map((point,index)=><View key={`point-${index}`} style={[s.dot,{left:point.x-4.5,top:point.y-4.5,backgroundColor:series[lineIndex].color}]}/>)}</View>)}</View><View style={s.trendLabels}>{weeks.map(week=><Text key={week.label} style={[s.weekLabel,dark&&s.darkMuted]}>{week.label}</Text>)}</View><View style={s.legend}><Legend color="#B49A64" text="Income" dark={dark}/><Legend color="#737C72" text="Spending" dark={dark}/></View></View>;
}
function Legend({color,text,dark}:{color:string;text:string;dark:boolean}){return <View style={s.legendItem}><View style={[s.legendDot,{backgroundColor:color}]}/><Text style={[s.legendText,dark&&s.darkMuted]}>{text}</Text></View>}
function Empty({ title, detail }: { title: string; detail: string }) { const dark=useAppPreferences().themeMode==='dark';return <View style={[s.center,dark&&s.darkPage]}><Text style={[s.title,dark&&s.darkText]}>{title}</Text><Text style={[s.body,dark&&s.darkMuted]}>{detail}</Text></View>; }

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F4F0E8' },darkPage:{backgroundColor:'#171815'},darkText:{color:'#F2EEE5'},darkMuted:{color:'#B8B1A4'},darkAccent:{color:'#D2B878'},content: { padding: 24, paddingTop: 54, paddingBottom: 40 }, center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F4F0E8', padding: 28 },
  eyebrow: { color: '#8A7448', fontSize: 10, fontWeight: '700', letterSpacing: 1.8 }, title: { color: '#25231F', fontFamily: 'Georgia', fontSize: 32, fontWeight: '400', marginTop: 9 }, body: { color: '#777167', lineHeight: 22, marginTop: 8 }, awardsLink: { alignSelf: 'flex-start', color: '#8A7448', fontSize: 13, fontWeight: '700', marginTop: 15 },
  card: { backgroundColor: '#FFFDFA', borderRadius: 20, padding: 20, marginTop: 19, borderWidth: 1, borderColor: '#E4DCCF', shadowColor: '#352B1A', shadowOpacity: 0.04, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 1 },darkCard:{backgroundColor:'#22231F',borderColor:'#3D3A32'},cardKicker: { color: '#8A7448', fontSize: 10, fontWeight: '700', letterSpacing: 1.5 }, heading: { color: '#25231F', fontFamily: 'Georgia', fontSize: 25, marginTop: 6 }, metric: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#EEE8DE' },darkMetric:{borderBottomColor:'#3D3A32'}, metricLabel: { color: '#777167', fontSize: 13 }, metricValue: { color: '#25231F', fontSize: 14, fontWeight: '600' }, divider: { height: 1, backgroundColor: '#D9CFBE', marginVertical: 4 }, netCard: { backgroundColor: '#F0EADF', borderRadius: 14, padding: 15, marginTop: 14 },darkNetCard:{backgroundColor:'#303027'}, netLabel: { color: '#777167', fontSize: 12 }, netValue: { color: '#25231F', fontFamily: 'Georgia', fontSize: 24, marginTop: 7 }, note: { color: '#827C71', fontSize: 11, lineHeight: 17, marginTop: 15 },
  chartPicker:{flexDirection:'row',backgroundColor:'#EDE5D7',padding:4,borderRadius:13,marginTop:20},darkChartPicker:{backgroundColor:'#262720'},chartOption:{flex:1,alignItems:'center',paddingVertical:10,borderRadius:10},chartSelected:{backgroundColor:'#25231F'},chartOptionText:{color:'#746C5D',fontSize:11,fontWeight:'600'},chartSelectedText:{color:'#F4E9CF'},chartArea:{marginTop:18,backgroundColor:'#F8F5EF',borderRadius:16,padding:14},darkChartArea:{backgroundColor:'#191A17'},chartTitle:{fontSize:12,fontWeight:'700',color:'#37332B',marginBottom:12},barChart:{height:132,flexDirection:'row',alignItems:'stretch',justifyContent:'space-around'},barGroup:{flex:1,alignItems:'center',justifyContent:'flex-end'},bars:{height:110,width:26,flexDirection:'row',alignItems:'flex-end',justifyContent:'center',gap:4,borderBottomWidth:1,borderBottomColor:'#D9CFBE'},bar:{width:9,borderTopLeftRadius:4,borderTopRightRadius:4,minHeight:3},weekLabel:{fontSize:10,color:'#827B6E',marginTop:7},legend:{flexDirection:'row',gap:18,justifyContent:'center',marginTop:11},legendItem:{flexDirection:'row',alignItems:'center',gap:6},legendDot:{width:7,height:7,borderRadius:5},legendText:{fontSize:10,color:'#777167'},infoMetric:{marginTop:12},infoHead:{flexDirection:'row',justifyContent:'space-between',marginBottom:7},chartLabel:{fontSize:11,color:'#777167'},chartValue:{fontSize:12,color:'#25231F',fontWeight:'700'},progressTrack:{height:8,backgroundColor:'#E7E0D4',borderRadius:8,overflow:'hidden'},darkProgressTrack:{backgroundColor:'#39372F'},progressFill:{height:8,borderRadius:8},trendChart:{height:124,position:'relative'},connector:{position:'absolute',height:2},dot:{position:'absolute',width:9,height:9,borderRadius:5,borderWidth:2,borderColor:'#FFFDFA'},trendLabels:{flexDirection:'row',justifyContent:'space-between',marginHorizontal:2},
});
