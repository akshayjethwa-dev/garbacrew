import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { usePhotographer, usePhotographerPackages } from '../../../src/hooks/usePhotographers';
import { ErrorState } from '../../../src/components/ErrorState';
import { Ionicons } from '@expo/vector-icons';

export default function PhotographerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { photographer, loading, error } = usePhotographer(id);
  const { packages } = usePhotographerPackages(id);

  if (loading) return <View style={styles.center}><ActivityIndicator color="#FF6B35" /></View>;
  if (error || !photographer) return <ErrorState onRetry={() => router.back()} />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        {photographer.photoUrl ? (
          <Image source={{ uri: photographer.photoUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}><Ionicons name="person" size={40} color="#666" /></View>
        )}
        <View style={styles.nameRow}>
          <Text style={styles.name}>{photographer.name}</Text>
          {photographer.isVerified && <Ionicons name="checkmark-circle" size={20} color="#FFD700" />}
        </View>
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={styles.ratingText}>{photographer.rating.toFixed(1)} · {photographer.totalBookings} bookings</Text>
        </View>
        <Text style={styles.city}>{photographer.city}</Text>
      </View>

      {photographer.bio ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.body}>{photographer.bio}</Text>
        </View>
      ) : null}

      {packages.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Packages</Text>
          {packages.map((pkg) => (
            <View key={pkg.id} style={styles.packageCard}>
              <Text style={styles.packageName}>{pkg.name}</Text>
              <Text style={styles.packageMeta}>{pkg.durationHours}h · {Object.entries(pkg.deliverables).map(([k, v]) => `${v} ${k}`).join(', ')}</Text>
              <Text style={styles.packagePrice}>₹{pkg.price.toLocaleString()}</Text>
            </View>
          ))}
        </View>
      )}

      {packages.length === 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Packages</Text>
          <Text style={styles.body}>No packages available yet.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: '#0D0D0D', alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  content: { padding: 24, paddingTop: 60, paddingBottom: 60 },
  header: { alignItems: 'center', marginBottom: 24 },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 12 },
  avatarPlaceholder: { backgroundColor: '#252525', alignItems: 'center', justifyContent: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { color: '#fff', fontSize: 22, fontWeight: '700' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  ratingText: { color: '#B0B0B0', fontSize: 14 },
  city: { color: '#B0B0B0', fontSize: 14, marginTop: 4 },
  section: { marginBottom: 24 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 12 },
  body: { color: '#B0B0B0', fontSize: 14, lineHeight: 20 },
  packageCard: { backgroundColor: '#1A1A1A', borderRadius: 12, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: '#2A2A2A' },
  packageName: { color: '#fff', fontSize: 16, fontWeight: '600' },
  packageMeta: { color: '#B0B0B0', fontSize: 13, marginTop: 4 },
  packagePrice: { color: '#FF6B35', fontSize: 18, fontWeight: '700', marginTop: 8 },
});