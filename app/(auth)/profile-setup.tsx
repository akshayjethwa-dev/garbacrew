// app/(auth)/profile-setup.tsx
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../src/config/firebase';

const CITIES = ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar'];

export default function ProfileSetupScreen() {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [city, setCity] = useState(CITIES[0]);
  const [area, setArea] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);

  const showMessage = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !age || !area.trim()) {
      showMessage('Missing fields', 'Please fill name, age, and area');
      return;
    }

    const uid = auth.currentUser?.uid;
    if (!uid) {
      showMessage('Error', 'Not signed in. Please log in again.');
      return;
    }

    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', uid), {
        name: name.trim(),
        age: parseInt(age, 10),
        gender,
        city,
        area: area.trim(),
        bio: bio.trim(),
        profileComplete: true,
        updatedAt: serverTimestamp(),
      });
      // RootNavigator will auto-redirect to (tabs)/crews
    } catch (e: any) {
      showMessage('Error', e.message ?? 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Set up your profile</Text>
      <Text style={styles.subtitle}>Tell us about yourself so we can match you with the right crews.</Text>

      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Your name"
        placeholderTextColor="#666"
      />

      <Text style={styles.label}>Age</Text>
      <TextInput
        style={styles.input}
        value={age}
        onChangeText={setAge}
        placeholder="18"
        placeholderTextColor="#666"
        keyboardType="number-pad"
        maxLength={2}
      />

      <Text style={styles.label}>Gender</Text>
      <View style={styles.chipRow}>
        {(['male', 'female', 'other'] as const).map((g) => (
          <TouchableOpacity
            key={g}
            style={[styles.chip, gender === g && styles.chipActive]}
            onPress={() => setGender(g)}
          >
            <Text style={[styles.chipText, gender === g && styles.chipTextActive]}>
              {g.charAt(0).toUpperCase() + g.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>City</Text>
      <View style={styles.chipRow}>
        {CITIES.map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.chip, city === c && styles.chipActive]}
            onPress={() => setCity(c)}
          >
            <Text style={[styles.chipText, city === c && styles.chipTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Area</Text>
      <TextInput
        style={styles.input}
        value={area}
        onChangeText={setArea}
        placeholder="e.g., Satellite"
        placeholderTextColor="#666"
      />

      <Text style={styles.label}>Bio (optional)</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={bio}
        onChangeText={setBio}
        placeholder="Tell people about you..."
        placeholderTextColor="#666"
        multiline
        maxLength={150}
      />

      <TouchableOpacity
        style={[styles.button, saving && styles.buttonDisabled]}
        onPress={handleSave}
        disabled={saving}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>{saving ? 'Saving...' : 'Finish'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  content: { padding: 24, paddingTop: 60, paddingBottom: 60 },
  title: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 8 },
  subtitle: { color: '#B0B0B0', fontSize: 14, marginBottom: 24 },
  label: { color: '#B0B0B0', fontSize: 14, marginBottom: 8, marginTop: 16 },
  input: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    height: 56,
    paddingHorizontal: 16,
    color: '#fff',
    fontSize: 16,
  },
  textArea: { height: 100, textAlignVertical: 'top', paddingTop: 16 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#1A1A1A',
  },
  chipActive: { backgroundColor: '#FF6B35' },
  chipText: { color: '#B0B0B0', fontSize: 14 },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  button: {
    backgroundColor: '#FF6B35',
    borderRadius: 16,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});