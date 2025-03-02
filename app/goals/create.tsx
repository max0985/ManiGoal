import React, { useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, Snackbar, useTheme } from 'react-native-paper';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase/config';
import GoalForm from '../../components/goals/GoalForm';

export default function CreateGoal() {
  const theme = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState(new Date());
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const handleCreateGoal = async () => {
    try {
      setLoading(true);
      setError('');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/auth/login');
        return;
      }

      // Create the goal
      const { data: goal, error: goalError } = await supabase
        .from('goals')
        .insert([
          {
            user_id: user.id,
            title: title.trim(),
            description: description.trim(),
            deadline: deadline.toISOString(),
            category,
            status: 'active',
            completion_percentage: 0,
          },
        ])
        .select()
        .single();

      if (goalError) throw goalError;

      // Create initial milestone
      const { error: milestoneError } = await supabase
        .from('milestones')
        .insert([
          {
            goal_id: goal.id,
            title: 'Get Started',
            description: 'Begin working on your goal',
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
            status: 'pending',
          },
        ]);

      if (milestoneError) throw milestoneError;

      setShowSuccessMessage(true);
      setTimeout(() => {
        router.replace(`/goals/${goal.id}`);
      }, 1500);
    } catch (err) {
      console.error('Error creating goal:', err);
      if (err instanceof Error) {
        // Handle specific error cases
        if (err.message.includes('duplicate key')) {
          setError('You already have a goal with this title');
        } else if (err.message.includes('foreign key')) {
          setError('There was an error linking the goal to your account');
        } else {
          setError(err.message);
        }
      } else {
        setError('An error occurred while creating the goal');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text variant="headlineMedium" style={styles.title}>
          Create New Goal
        </Text>

        <GoalForm
          title={title}
          setTitle={setTitle}
          description={description}
          setDescription={setDescription}
          deadline={deadline}
          setDeadline={setDeadline}
          category={category}
          setCategory={setCategory}
          error={error}
          loading={loading}
          onSubmit={handleCreateGoal}
          submitLabel="Create Goal"
        />
      </ScrollView>

      <Snackbar
        visible={showSuccessMessage}
        onDismiss={() => setShowSuccessMessage(false)}
        duration={1500}
        style={{ backgroundColor: theme.colors.primaryContainer }}
      >
        <Text style={{ color: theme.colors.onPrimaryContainer }}>
          Goal created successfully!
        </Text>
      </Snackbar>
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
    padding: 20,
    alignItems: 'center',
  },
  title: {
    marginBottom: 30,
    textAlign: 'center',
  },
});