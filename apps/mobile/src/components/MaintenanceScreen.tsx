import { StyleSheet, Text, View } from 'react-native';

const message = process.env.EXPO_PUBLIC_MAINTENANCE_MESSAGE?.trim();

export function MaintenanceScreen() {
  return (
    <View style={styles.screen} accessibilityRole="alert">
      <View style={styles.card}>
        <View style={styles.icon} accessibilityElementsHidden>
          <Text style={styles.iconText}>i</Text>
        </View>
        <Text style={styles.eyebrow}>iBUDGET · SCHEDULED MAINTENANCE</Text>
        <Text style={styles.title}>We’ll be back shortly.</Text>
        <Text style={styles.body}>
          {message || 'We’re making a few improvements to iBudget. Please check back soon.'}
        </Text>
        <View style={styles.divider} />
        <Text style={styles.note}>Your saved information is not changed by this maintenance notice.</Text>
      </View>
      <Text style={styles.footer}>Thank you for your patience</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    elevation: 1000,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F4F0E8',
  },
  card: {
    width: '100%',
    maxWidth: 520,
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E4DCCF',
    backgroundColor: '#FFFDFA',
  },
  icon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#173D32',
  },
  iconText: { color: '#F4E9CF', fontFamily: 'Georgia', fontSize: 30 },
  eyebrow: { marginTop: 28, color: '#8A7448', fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textAlign: 'center' },
  title: { marginTop: 12, color: '#25231F', fontFamily: 'Georgia', fontSize: 32, textAlign: 'center' },
  body: { maxWidth: 390, marginTop: 12, color: '#777167', fontSize: 15, lineHeight: 23, textAlign: 'center' },
  divider: { width: '100%', height: 1, marginTop: 28, backgroundColor: '#E4DCCF' },
  note: { marginTop: 18, color: '#777167', fontSize: 12, lineHeight: 18, textAlign: 'center' },
  footer: { marginTop: 20, color: '#777167', fontSize: 12 },
});
