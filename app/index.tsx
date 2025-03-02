import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl } from 'react-native';
import { Button, Card, Text, FAB, ActivityIndicator, IconButton, useTheme } from 'react-native-paper';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase/config';

interface Goal {
  id: string;
  title: string;
  description: string;
  deadline: string;
  completion_percentage: number;
  status: string;
}

interface User {
  full_name: string | null;
  email: string;
}

export default function Dashboard() {
  const theme = useTheme();
  const [currentGoal, setCurrentGoal] = useState<Goal | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('full_name, email')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setUser(profile);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('Failed to load user profile');
    }
  };

  const fetchCurrentGoal = async () => {
    try {
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/');
        return;
      }

      await fetchUserProfile(user.id);

      const { data: goals, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      setCurrentGoal(goals);
    } catch (error) {
      console.error('Error fetching goal:', error);
      setError('Failed to load current goal');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCurrentGoal();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchCurrentGoal();
  }, []);

  const handleSignOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace('/');
    } catch (error) {
      console.error('Error signing out:', error);
      setError('Failed to sign out');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Card style={styles.welcomeCard}>
          <Card.Content>
            <Text variant="titleLarge">Welcome{user?.full_name ? `, ${user.full_name}` : ''}</Text>
            <Text variant="bodyMedium">Your journey to success starts here</Text>
          </Card.Content>
        </Card>

        {error ? (
          <Card style={[styles.errorCard, { backgroundColor: theme.colors.errorContainer }]}>
            <Card.Content>
              <Text variant="bodyMedium" style={{ color: theme.colors.error }}>
                {error}
              </Text>
            </Card.Content>
          </Card>
        ) : null}

        {currentGoal ? (
          <Card style={styles.goalCard}>
            <Card.Content>
              <View style={styles.goalHeader}>
                <Text variant="titleMedium">Current Goal</Text>
                <IconButton
                  icon="pencil"
                  size={20}
                  onPress={() => router.push(`/goals/${currentGoal.id}`)}
                />
              </View>
              <Text variant="headlineSmall">{currentGoal.title}</Text>
              <Text variant="bodyMedium">{currentGoal.description}</Text>
              <Text variant="bodySmall" style={styles.deadline}>
                Due: {new Date(currentGoal.deadline).toLocaleDateString()}
              </Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { 
                      width: `${currentGoal.completion_percentage}%`,
                      backgroundColor: theme.colors.primary,
                    }
                  ]} 
                />
              </View>
              <Text variant="bodySmall" style={styles.progressText}>
                Progress: {currentGoal.completion_percentage}%
              </Text>
            </Card.Content>
            <Card.Actions>
              <Button onPress={() => router.push(`/goals/${currentGoal.id}`)}>
                View Details
              </Button>
              <Button
                mode="contained"
                onPress={() => router.push(`/goals/${currentGoal.id}/update`)}
              >
                Update Progress
              </Button>
            </Card.Actions>
          </Card>
        ) : (
          <Card style={styles.goalCard}>
            <Card.Content>
              <Text variant="titleMedium">No Active Goal</Text>
              <Text variant="bodyMedium">
                Start by creating your first goal!
              </Text>
            </Card.Content>
            <Card.Actions>
              <Button
                mode="contained"
                onPress={() => router.push('/goals/create')}
              >
                Create Goal
              </Button>
            </Card.Actions>
          </Card>
        )}

        <View style={styles.quickActions}>
          <Button
            mode="contained-tonal"
            icon="image"
            onPress={() => router.push('/vision-board')}
            style={styles.actionButton}
          >
            Vision Board
          </Button>
          <Button
            mode="contained-tonal"
            icon="robot"
            onPress={() => router.push('/chat')}
            style={styles.actionButton}
          >
            AI Assistant
          </Button>
        </View>

        <Button
          mode="outlined"
          icon="logout"
          onPress={handleSignOut}
          style={styles.signOutButton}
          loading={loading}
        >
          Sign Out
        </Button>
      </ScrollView>

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => router.push('/goals/create')}
        label="New Goal"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 80, // Account for FAB
  },
  welcomeCard: {
    marginBottom: 16,
  },
  errorCard: {
    marginBottom: 16,
  },
  goalCard: {
    marginBottom: 16,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  deadline: {
    marginTop: 8,
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    textAlign: 'right',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  signOutButton: {
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
}); 