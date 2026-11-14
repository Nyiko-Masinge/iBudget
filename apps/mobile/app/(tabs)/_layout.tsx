import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
const tabs = [ ['dashboard','Home','home-outline'], ['transactions','Activity','swap-horizontal-outline'], ['budgets','Budgets','pie-chart-outline'], ['goals','Goals','flag-outline'], ['achievements','Awards','trophy-outline'], ['reports','Reports','bar-chart-outline'] ] as const;
export default function TabLayout() {
  return <Tabs screenOptions={{
    headerShown: false,
    tabBarActiveTintColor: '#26745A',
    tabBarInactiveTintColor: '#89958D',
    tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: 2 },
    tabBarItemStyle: { paddingTop: 7 },
    tabBarStyle: { height: 72, paddingTop: 4, paddingBottom: 9, backgroundColor: '#FFFFFF', borderTopColor: '#E4E8DF', borderTopWidth: 1, elevation: 0 },
  }}>{tabs.map(([name,title,icon])=><Tabs.Screen key={name} name={name} options={{title,tabBarIcon:({color,size,focused})=><Ionicons name={icon} size={focused ? size + 1 : size} color={typeof color === 'number' || color == null ? '#89958D' : color}/>}} />)}</Tabs>;
}
