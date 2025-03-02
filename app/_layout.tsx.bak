import React, { useEffect, useState } from 'react';
import { useColorScheme, Platform } from 'react-native';
import { Slot, Stack, useRouter, useSegments } from 'expo-router';
import { PaperProvider, ActivityIndicator } from 'react-native-paper';
import { ThemeProvider } from '@react-navigation/native';
import { lightTheme, darkTheme, navigationTheme } from '../lib/theme';
import { supabase } from '../lib/supabase/config';
import { View } from 'react-native';

// Auth state check and redirect
function useProtectedRoute(isAuthenticated: boolean | null) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated === null) return; // Still loading

    const inAuthGroup = segments[0] === 'auth';

    if (isAuthenticated && inAuthGroup) {
      // Redirect to home page if authenticated and in auth group
      router.replace('/');
    } else if (!isAuthenticated && !inAuthGroup && segments[0] !== '(public)') {
      // Redirect to login if not authenticated and trying to access app
      router.replace('/auth/login');
    }
  }, [isAuthenticated, segments]);
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const paperTheme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useProtectedRoute(isAuthenticated);

  useEffect(() => {
    // Check initial auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Show loading state while checking auth
  if (isAuthenticated === null) {
    return (
      <PaperProvider theme={paperTheme}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" />
        </View>
      </PaperProvider>
    );
  }

  return (
    <PaperProvider theme={paperTheme}>
      <ThemeProvider value={navigationTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="chat" />
          <Stack.Screen name="goals" />
          <Stack.Screen name="quotes" />
          <Stack.Screen name="vision-board" />
          <Stack.Screen name="auth" />
        </Stack>
      </ThemeProvider>
    </PaperProvider>
  );
}