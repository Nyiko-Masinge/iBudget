import { Stack } from 'expo-router';
import { Providers } from '../src/providers/Providers';

export default function RootLayout() {
  return <Providers><Stack screenOptions={{ headerShown: false }} /></Providers>;
}
