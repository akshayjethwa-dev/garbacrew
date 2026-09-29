import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function ErrorState({ message, onRetry }: { message?: string; onRetry: () => void }) {
  return (
    <View style={styles.container}>
      <Ionicons name="alert-circle-outline" size={48} color="#F44336" />
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.subtitle}>{message ?? 'Check your connection and try again.'}</Text>
      <TouchableOpacity style={styles.button} onPress={onRetry}>
        <Text style={styles.buttonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  title: { fontSize: 18, fontWeight: '700', color: '#fff', marginTop: 16 },
  subtitle: { fontSize: 14, color: '#B0B0B0', textAlign: 'center', marginTop: 8 },
  button: { marginTop: 24, borderWidth: 1, borderColor: '#FF6B35', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  buttonText: { color: '#FF6B35', fontWeight: '600' },
});