import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useAppPreferences } from '../../src/providers/AppPreferences';
const tabs = [ ['dashboard','Home','home-outline'], ['transactions','Activity','swap-horizontal-outline'], ['budgets','Plans','pie-chart-outline'], ['reports','Insights','bar-chart-outline'] ] as const;
export default function TabLayout() {
  const dark = useAppPreferences().themeMode === 'dark';
  return <Tabs screenOptions={{
    headerShown: false,
    tabBarActiveTintColor: dark ? '#D2B878' : '#8A7448',
    tabBarInactiveTintColor: dark ? '#AAA397' : '#8A857A',
    tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: 3, letterSpacing: 0.3 },
    tabBarItemStyle: { paddingTop: 8 },
    tabBarStyle: { height: 76, paddingTop: 5, paddingBottom: 10, backgroundColor: dark ? '#22231F' : '#FFFDFA', borderTopColor: dark ? '#3D3A32' : '#E4DCCF', borderTopWidth: 1, elevation: 0 },
  }}>{tabs.map(([name,title,icon])=><Tabs.Screen key={name} name={name} options={{title,tabBarIcon:({color,size,focused})=><Ionicons name={icon} size={focused ? size + 1 : size} color={typeof color === 'number' || color == null ? dark ? '#AAA397' : '#8A857A' : color}/>}} />)}<Tabs.Screen name="goals" options={{href:null}}/><Tabs.Screen name="achievements" options={{href:null}}/></Tabs>;
}
