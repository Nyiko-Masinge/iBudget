import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Providers } from '../src/providers/Providers';
import { MaintenanceScreen } from '../src/components/MaintenanceScreen';

export default function RootLayout() {
  const maintenanceMode = process.env.EXPO_PUBLIC_MAINTENANCE_MODE === 'true';

  return (
    <Providers>
      <View style={styles.root}>
        <Stack screenOptions={{ headerShown: false }} />
        {maintenanceMode ? <MaintenanceScreen /> : null}
      </View>
    </Providers>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
