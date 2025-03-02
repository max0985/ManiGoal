import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text, TextInput, HelperText } from 'react-native-paper';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase/config';

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateForm = () => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');

    if (!email) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!EMAIL_REGEX.test(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    }

    return isValid;
  };

  const handleLogin = async () => {
    try {
      if (!validateForm()) return;

      setLoading(true);
      setError('');
      
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;
      
      router.replace('/');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during login';
      setError(errorMessage);
      
      // Handle specific error cases
      if (errorMessage.toLowerCase().includes('invalid login credentials')) {
        setError('Invalid email or password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Welcome Back
      </Text>

      <View style={styles.form}>
        <TextInput
          label="Email"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setEmailError('');
            setError('');
          }}
          error={!!emailError}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          style={styles.input}
          disabled={loading}
        />
        <HelperText type="error" visible={!!emailError}>
          {emailError}
        </HelperText>

        <TextInput
          label="Password"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setPasswordError('');
            setError('');
          }}
          error={!!passwordError}
          secureTextEntry
          autoCapitalize="none"
          style={styles.input}
          disabled={loading}
        />
        <HelperText type="error" visible={!!passwordError}>
          {passwordError}
        </HelperText>

        {error ? (
          <HelperText type="error" visible={!!error}>
            {error}
          </HelperText>
        ) : null}

        <Button
          mode="contained"
          onPress={handleLogin}
          loading={loading}
          disabled={loading}
          style={styles.button}
        >
          Log In
        </Button>

        <Button
          mode="text"
          onPress={() => router.back()}
          style={styles.button}
          disabled={loading}
        >
          Go Back
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginBottom: 30,
    textAlign: 'center',
  },
  form: {
    width: '100%',
    maxWidth: 400,
  },
  input: {
    marginBottom: 8,
  },
  button: {
    marginTop: 16,
  },
}); 