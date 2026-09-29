import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { usePhotographers } from '../../../src/hooks/usePhotographers';
import { EmptyState } from '../../../src/components/EmptyState';
import { ErrorState } from '../../../src/components/ErrorState';
import { Ionicons } from '@expo/vector-icons';
import { Photographer } from '../../../src/types';

export default function PhotographersScreen() {
  const router = useRouter();
  const { photographers, loading, error } = usePhotographers();

  if (loading) return <View style={styles.center}><ActivityIndicator color="#FF6B35" /></View>;
  if (error) return <ErrorState onRetry={() => router.replace('/(tabs)/photographers')} />;
  if (photographers.length === 0) {
    return (
      <EmptyState
        icon="camera-outline"
        title="No photographers yet"
        subtitle="We're onboarding photographers in your city. Check back soon."
      />
    );
  }

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.listContent}
      data={photographers}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <PhotographerCard p={item} onPress={() => router.push(`/(tabs)/photographers/${item.id}`)} />
      )}
    />
  );
}

function PhotographerCard({ p, onPress }: { p: Photographer; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardImage}>
        {p.photoUrl ? (
          <Image source={{ uri: p.photoUrl }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}><Ionicons name="person" size={32} color="#666" /></View>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{p.name}</Text>
          {p.isVerified && <Ionicons name="checkmark-circle" size={16} color="#FFD700" />}
        </View>
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={14} color="#FFD700" />
          <Text style={styles.ratingText}>{p.rating.toFixed(1)} · {p.totalBookings} bookings</Text>
        </View>
        <Text style={styles.city}>{p.city}</Text>
        {p.startingPrice > 0 && <Text style={styles.price}>From ₹{p.startingPrice.toLocaleString()}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#666" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: '#0D0D0D', alignItems: 'center', justifyContent: 'center' },
  list: { flex: 1, backgroundColor: '#0D0D0D' },
  listContent: { padding: 16, paddingTop: 60 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A1A', borderRadius: 16, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#2A2A2A' },
  cardImage: { width: 80, height: 80, borderRadius: 12, overflow: 'hidden', marginRight: 12 },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { width: '100%', height: '100%', backgroundColor: '#252525', alignItems: 'center', justifyContent: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  name: { color: '#fff', fontSize: 16, fontWeight: '700' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  ratingText: { color: '#B0B0B0', fontSize: 12 },
  city: { color: '#B0B0B0', fontSize: 12, marginTop: 4 },
  price: { color: '#FF6B35', fontSize: 13, fontWeight: '600', marginTop: 6 },
});