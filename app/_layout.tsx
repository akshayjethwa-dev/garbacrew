// app/_layout.tsx
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { AuthProvider, useAuth } from '../src/context/AuthContext';

function RootNavigator() {
  const { firebaseUser, appUser, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments() as string[];

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';
    const inProfileSetup =
      segments[0] === '(auth)' && segments[1] === 'profile-setup';

    if (!firebaseUser && !inAuthGroup) {
      router.replace('/(auth)/login');
      return;
    }

    if (firebaseUser && !appUser?.profileComplete) {
      if (!inProfileSetup) {
        router.replace('/(auth)/profile-setup');
      }
      return;
    }

    if (firebaseUser && appUser?.profileComplete && !inTabsGroup) {
      router.replace('/(tabs)/crews');
      return;
    }
  }, [firebaseUser, appUser, loading, segments]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  // No explicit Stack.Screen declarations — Expo Router auto-discovers
  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    alignItems: 'center',
    justifyContent: 'center',
  },
});