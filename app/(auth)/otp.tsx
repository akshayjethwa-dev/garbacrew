import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../src/config/firebase';
import { signInAnonymously } from 'firebase/auth';

export default function OtpScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const router = useRouter();
  const [code, setCode] = useState('');

  const handleVerify = async () => {
    // In production, verify the SMS code with Firebase.
    // For now, create an anonymous session + user doc (dev/demo mode).
    try {
      const cred = await signInAnonymously(auth);
      const userRef = doc(db, 'users', cred.user.uid);
      const existing = await getDoc(userRef);
      if (!existing.exists()) {
        await setDoc(userRef, {
          phone: `+91${phone}`,
          name: '',
          age: null,
          gender: '',
          city: '',
          area: '',
          bio: '',
          photoUrl: null,
          isVerified: false,
          profileComplete: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      // Router will auto-redirect via RootNavigator
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify your number</Text>
      <Text style={styles.subtitle}>Code sent to +91 {phone}</Text>

      <TextInput
        style={styles.otpInput}
        placeholder="6-digit code"
        placeholderTextColor="#666"
        keyboardType="number-pad"
        maxLength={6}
        value={code}
        onChangeText={setCode}
      />

      <TouchableOpacity style={styles.button} onPress={handleVerify}>
        <Text style={styles.buttonText}>Verify</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D', padding: 24, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 8 },
  subtitle: { color: '#B0B0B0', marginBottom: 32 },
  otpInput: { backgroundColor: '#1A1A1A', borderRadius: 16, height: 56, color: '#fff', fontSize: 24, textAlign: 'center', letterSpacing: 8, marginBottom: 24 },
  button: { backgroundColor: '#FF6B35', borderRadius: 16, height: 56, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});