import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
const tabs = [ ['dashboard','Home','home-outline'], ['transactions','Activity','swap-horizontal-outline'], ['budgets','Budgets','pie-chart-outline'], ['goals','Goals','flag-outline'], ['achievements','Awards','trophy-outline'], ['reports','Reports','bar-chart-outline'] ] as const;
export default function TabLayout() { return <Tabs screenOptions={{headerShown:false, tabBarActiveTintColor:'#197B58', tabBarStyle:{height:68,paddingTop:8,paddingBottom:10}}}>{tabs.map(([name,title,icon])=><Tabs.Screen key={name} name={name} options={{title,tabBarIcon:({color,size})=><Ionicons name={icon} size={size} color={typeof color === 'number' || color == null ? '#697586' : color}/>}} />)}</Tabs>; }
