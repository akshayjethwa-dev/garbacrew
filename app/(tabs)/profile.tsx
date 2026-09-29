import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const router = useRouter();
  const { appUser, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  if (!appUser) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        {appUser.photoUrl ? (
          <Image source={{ uri: appUser.photoUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>{appUser.name[0]?.toUpperCase() ?? '?'}</Text>
          </View>
        )}
        <Text style={styles.name}>{appUser.name}</Text>
        <Text style={styles.phone}>{appUser.phone}</Text>
        <Text style={styles.location}>{appUser.area}, {appUser.city}</Text>
      </View>

      <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(auth)/profile-setup')}>
        <Ionicons name="create-outline" size={20} color="#B0B0B0" />
        <Text style={styles.menuText}>Edit Profile</Text>
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </TouchableOpacity>

      <TouchableOpacity style={[styles.menuItem, { marginTop: 24 }]} onPress={handleSignOut}>
        <Ionicons name="log-out-outline" size={20} color="#F44336" />
        <Text style={[styles.menuText, { color: '#F44336' }]}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  content: { padding: 24, paddingTop: 60, paddingBottom: 60 },
  header: { alignItems: 'center', marginBottom: 32 },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 12 },
  avatarPlaceholder: { backgroundColor: '#FF6B35', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 36, fontWeight: '700' },
  name: { color: '#fff', fontSize: 22, fontWeight: '700' },
  phone: { color: '#B0B0B0', fontSize: 14, marginTop: 4 },
  location: { color: '#B0B0B0', fontSize: 14, marginTop: 4 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#1A1A1A', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#2A2A2A' },
  menuText: { flex: 1, color: '#fff', fontSize: 15, fontWeight: '500' },
});