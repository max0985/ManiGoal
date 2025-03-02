import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from 'react-native-paper';

export default function AuthLayout() {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.onSurface,
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: {
          backgroundColor: theme.colors.background,
        },
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        animationTypeForReplace: 'push',
        presentation: 'card',
      }}
    >
      <Stack.Screen
        name="login"
        options={{
          title: 'Log In',
          animation: 'fade',
        }}
      />
      <Stack.Screen
        name="signup"
        options={{
          title: 'Sign Up',
          animation: 'slide_from_right',
        }}
      />
    </Stack>
  );
} 