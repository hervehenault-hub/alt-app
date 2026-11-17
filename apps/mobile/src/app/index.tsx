import { StyleSheet, Text, View } from 'react-native';

/** Écran d'accueil provisoire. */
export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>
        Alt.
      </Text>
      <Text style={styles.subtitle}>Les alternatives écologiques près de chez vous.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F7F5EF',
  },
  title: { fontSize: 40, fontWeight: '700', color: '#1F3D2B' },
  subtitle: { marginTop: 12, fontSize: 16, textAlign: 'center', color: '#1F3D2B' },
});
