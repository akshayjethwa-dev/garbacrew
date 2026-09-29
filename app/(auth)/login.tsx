// app/(auth)/login.tsx
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const showError = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      // Alert.alert works but shows a simple browser alert on web
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleSendOtp = () => {
    if (phone.length !== 10) {
      showError('Invalid number', 'Enter a 10-digit mobile number');
      return;
    }

    setLoading(true);

    // Navigate directly — no Alert in the way.
    // Phone auth with real SMS requires a dev build (@react-native-firebase/auth).
    // For now, we forward to OTP screen which creates an anonymous session.
    router.push({ pathname: '/(auth)/otp', params: { phone } });

    // Reset loading after navigation
    setTimeout(() => setLoading(false), 300);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>GarbaCrew</Text>
      <Text style={styles.title}>Enter your phone number</Text>

      <View style={styles.inputRow}>
        <Text style={styles.countryCode}>+91</Text>
        <TextInput
          style={styles.input}
          placeholder="10-digit mobile number"
          placeholderTextColor="#666"
          keyboardType="phone-pad"
          maxLength={10}
          value={phone}
          onChangeText={setPhone}
          onSubmitEditing={handleSendOtp}
        />
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSendOtp}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Continue</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.terms}>
        By continuing, you agree to our Terms & Privacy Policy
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    padding: 24,
    justifyContent: 'center',
  },
  logo: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FF6B35',
    textAlign: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 24,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  countryCode: {
    color: '#fff',
    fontSize: 16,
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 56,
    color: '#fff',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#FF6B35',
    borderRadius: 16,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  terms: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
  },
});