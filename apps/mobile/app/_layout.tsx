import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Providers } from '../src/providers/Providers';
export default function RootLayout() {
  return <Providers><StatusBar style="auto" /><Stack screenOptions={{ headerShown: false }} /></Providers>;
}
