import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text, TextInput, HelperText } from 'react-native-paper';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase/config';

// Validation regex patterns
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_REGEX = /^[a-zA-Z]+(([',. -][a-zA-Z ])?[a-zA-Z]*)*$/;

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [nameError, setNameError] = useState('');

  const validateForm = () => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');
    setNameError('');
    setError('');

    // Validate full name
    if (!fullName.trim()) {
      setNameError('Full name is required');
      isValid = false;
    } else if (!NAME_REGEX.test(fullName.trim())) {
      setNameError('Please enter a valid name');
      isValid = false;
    } else if (fullName.trim().length < 2) {
      setNameError('Name must be at least 2 characters long');
      isValid = false;
    }

    // Validate email
    if (!email) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!EMAIL_REGEX.test(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }

    // Validate password
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    }

    return isValid;
  };

  const handleSignUp = async () => {
    try {
      if (!validateForm()) return;

      setLoading(true);
      setError('');

      // Sign up with Supabase Auth
      const { error: signUpError, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (signUpError) throw signUpError;

      if (!data.user?.id) {
        throw new Error('User creation failed');
      }

      // Create user profile in the database
      const { error: profileError } = await supabase
        .from('users')
        .insert([
          {
            id: data.user.id,
            email,
            full_name: fullName.trim(),
          },
        ]);

      if (profileError) throw profileError;

      router.replace('/');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during sign up';
      setError(errorMessage);
      
      // Handle specific error cases
      if (errorMessage.toLowerCase().includes('email already registered')) {
        setEmailError('This email is already registered. Please use a different email or try logging in.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Create Account
      </Text>

      <View style={styles.form}>
        <TextInput
          label="Full Name"
          value={fullName}
          onChangeText={(text) => {
            setFullName(text);
            setNameError('');
            setError('');
          }}
          error={!!nameError}
          style={styles.input}
          disabled={loading}
        />
        <HelperText type="error" visible={!!nameError}>
          {nameError}
        </HelperText>

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
          onPress={handleSignUp}
          loading={loading}
          disabled={loading}
          style={styles.button}
        >
          Sign Up
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