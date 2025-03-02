import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, ActivityIndicator, FAB, Chip, useTheme, Searchbar } from 'react-native-paper';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase/config';

interface Goal {
  id: string;
  title: string;
  description: string;
  deadline: string;
  category: string;
  status: string;
  completion_percentage: number;
}

export default function GoalsList() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchGoals = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchGoals();
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId);

      if (error) throw error;
      setGoals(goals.filter(goal => goal.id !== goalId));
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return '#4CAF50';
      case 'active':
        return '#2196F3';
      case 'on_hold':
        return '#FFC107';
      default:
        return '#757575';
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {goals.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text variant="titleMedium">No Goals Yet</Text>
              <Text variant="bodyMedium">
                Start by creating your first goal!
              </Text>
            </Card.Content>
            <Card.Actions>
              <Button onPress={() => router.push('/app/goals/create')}>
                Create Goal
              </Button>
            </Card.Actions>
          </Card>
        ) : (
          goals.map(goal => (
            <Card key={goal.id} style={styles.goalCard}>
              <Card.Content>
                <View style={styles.headerRow}>
                  <Text variant="titleMedium">{goal.title}</Text>
                  <IconButton
                    icon="delete"
                    size={20}
                    onPress={() => handleDeleteGoal(goal.id)}
                  />
                </View>
                <Text variant="bodyMedium">{goal.description}</Text>
                <Text variant="bodySmall" style={styles.category}>
                  {goal.category}
                </Text>
                <Text variant="bodySmall">
                  Due: {new Date(goal.deadline).toLocaleDateString()}
                </Text>
                <View style={styles.progressContainer}>
                  <Text variant="bodySmall">
                    Progress: {goal.completion_percentage}%
                  </Text>
                  <ProgressBar
                    progress={goal.completion_percentage / 100}
                    style={styles.progressBar}
                  />
                </View>
                <View style={styles.statusContainer}>
                  <Text
                    variant="bodySmall"
                    style={[
                      styles.status,
                      { backgroundColor: getStatusColor(goal.status) },
                    ]}
                  >
                    {goal.status.toUpperCase()}
                  </Text>
                </View>
              </Card.Content>
              <Card.Actions>
                <Button
                  onPress={() => router.push({
                    pathname: '/app/goals/[id]',
                    params: { id: goal.id }
                  })}
                >
                  View Details
                </Button>
              </Card.Actions>
            </Card>
          ))
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push('/app/goals/create')}
        label="New Goal"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  emptyCard: {
    marginBottom: 16,
  },
  goalCard: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  category: {
    marginTop: 8,
    fontStyle: 'italic',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    marginTop: 4,
    height: 8,
    borderRadius: 4,
  },
  statusContainer: {
    marginTop: 8,
    flexDirection: 'row',
  },
  status: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    color: 'white',
    fontSize: 12,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
}); 