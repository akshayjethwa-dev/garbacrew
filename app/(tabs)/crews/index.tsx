import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../src/context/AuthContext';
import { useMyCrews } from '../../../src/hooks/useCrews';
import { EmptyState } from '../../../src/components/EmptyState';
import { ErrorState } from '../../../src/components/ErrorState';
import { Ionicons } from '@expo/vector-icons';
import { Crew } from '../../../src/types';

export default function MyCrewsScreen() {
  const router = useRouter();
  const { appUser } = useAuth();
  const { crews, loading, error } = useMyCrews(appUser?.uid);

  if (loading) return <View style={styles.center}><ActivityIndicator color="#FF6B35" /></View>;
  if (error) return <ErrorState onRetry={() => router.replace('/(tabs)/crews')} />;
  if (crews.length === 0) {
    return (
      <EmptyState
        icon="people-outline"
        title="No crews yet"
        subtitle="Join a crew for your next Navratri night and dance with new friends."
      />
    );
  }

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.listContent}
      data={crews}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <CrewCard crew={item} onPress={() => router.push(`/(tabs)/crews/${item.id}`)} />}
    />
  );
}

function CrewCard({ crew, onPress }: { crew: Crew; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{crew.adminName[0]?.toUpperCase() ?? '?'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{crew.name}</Text>
          <Text style={styles.cardSubtitle}>By {crew.adminName}</Text>
        </View>
      </View>
      <View style={styles.cardMeta}>
        <View style={styles.pill}><Ionicons name="people" size={14} color="#B0B0B0" /><Text style={styles.pillText}>{crew.memberCount}/{crew.maxMembers}</Text></View>
        <View style={styles.pill}><Ionicons name="sparkles" size={14} color="#B0B0B0" /><Text style={styles.pillText}>{crew.vibeTag}</Text></View>
        {crew.genderPreference === 'women_only' && (
          <View style={styles.pill}><Ionicons name="female" size={14} color="#B0B0B0" /><Text style={styles.pillText}>Women only</Text></View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: '#0D0D0D', alignItems: 'center', justifyContent: 'center' },
  list: { flex: 1, backgroundColor: '#0D0D0D' },
  listContent: { padding: 16, paddingTop: 60 },
  card: { backgroundColor: '#1A1A1A', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2A2A2A' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FF6B35', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 18 },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cardSubtitle: { color: '#B0B0B0', fontSize: 13, marginTop: 2 },
  cardMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#252525', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  pillText: { color: '#B0B0B0', fontSize: 12, fontWeight: '500' },
});