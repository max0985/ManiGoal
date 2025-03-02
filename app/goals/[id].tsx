import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, Card, Button, TextInput, ProgressBar, Portal, Dialog } from 'react-native-paper';
import { useLocalSearchParams, router } from 'expo-router';
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

interface Milestone {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: string;
}

export default function GoalDetail() {
  const { id } = useLocalSearchParams();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [newMilestone, setNewMilestone] = useState({
    title: '',
    description: '',
    due_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchGoalAndMilestones();
  }, [id]);

  const fetchGoalAndMilestones = async () => {
    try {
      // Fetch goal details
      const { data: goalData, error: goalError } = await supabase
        .from('goals')
        .select('*')
        .eq('id', id)
        .single();

      if (goalError) throw goalError;
      setGoal(goalData);

      // Fetch milestones
      const { data: milestonesData, error: milestonesError } = await supabase
        .from('milestones')
        .select('*')
        .eq('goal_id', id)
        .order('due_date', { ascending: true });

      if (milestonesError) throw milestonesError;
      setMilestones(milestonesData || []);
    } catch (error) {
      console.error('Error fetching goal details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMilestone = async () => {
    try {
      const { error } = await supabase
        .from('milestones')
        .insert([
          {
            goal_id: id,
            title: newMilestone.title,
            description: newMilestone.description || null,
            due_date: newMilestone.due_date,
            status: 'pending',
          },
        ]);

      if (error) throw error;

      setShowAddMilestone(false);
      setNewMilestone({ title: '', description: '', due_date: new Date().toISOString().split('T')[0] });
      fetchGoalAndMilestones();
    } catch (error) {
      console.error('Error adding milestone:', error);
    }
  };

  const toggleMilestoneStatus = async (milestoneId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
      
      const { error } = await supabase
        .from('milestones')
        .update({ status: newStatus })
        .eq('id', milestoneId);

      if (error) throw error;

      // Update completion percentage
      const completedMilestones = milestones.filter(m => 
        m.id === milestoneId ? newStatus === 'completed' : m.status === 'completed'
      ).length;
      const percentage = Math.round((completedMilestones / milestones.length) * 100);

      await supabase
        .from('goals')
        .update({ completion_percentage: percentage })
        .eq('id', id);

      fetchGoalAndMilestones();
    } catch (error) {
      console.error('Error updating milestone:', error);
    }
  };

  if (!goal) {
    return (
      <View style={styles.container}>
        <Text>Goal not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Card style={styles.goalCard}>
          <Card.Content>
            <Text variant="headlineSmall">{goal.title}</Text>
            <Text variant="bodyMedium" style={styles.description}>
              {goal.description}
            </Text>
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
          </Card.Content>
        </Card>

        <View style={styles.milestonesHeader}>
          <Text variant="titleLarge">Milestones</Text>
          <Button
            mode="contained-tonal"
            onPress={() => setShowAddMilestone(true)}
          >
            Add Milestone
          </Button>
        </View>

        {milestones.map(milestone => (
          <Card key={milestone.id} style={styles.milestoneCard}>
            <Card.Content>
              <View style={styles.milestoneHeader}>
                <Text variant="titleMedium">{milestone.title}</Text>
                <Button
                  mode={milestone.status === 'completed' ? 'contained' : 'outlined'}
                  onPress={() => toggleMilestoneStatus(milestone.id, milestone.status)}
                >
                  {milestone.status === 'completed' ? 'Completed' : 'Mark Complete'}
                </Button>
              </View>
              {milestone.description && (
                <Text variant="bodyMedium" style={styles.milestoneDescription}>
                  {milestone.description}
                </Text>
              )}
              {milestone.due_date && (
                <Text variant="bodySmall">
                  Due: {new Date(milestone.due_date).toLocaleDateString()}
                </Text>
              )}
            </Card.Content>
          </Card>
        ))}
      </ScrollView>

      <Portal>
        <Dialog visible={showAddMilestone} onDismiss={() => setShowAddMilestone(false)}>
          <Dialog.Title>Add New Milestone</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Title"
              value={newMilestone.title}
              onChangeText={title => setNewMilestone({ ...newMilestone, title })}
              style={styles.input}
            />
            <TextInput
              label="Description"
              value={newMilestone.description}
              onChangeText={description => setNewMilestone({ ...newMilestone, description })}
              multiline
              numberOfLines={3}
              style={styles.input}
            />
            <TextInput
              label="Due Date"
              value={newMilestone.due_date}
              onChangeText={due_date => setNewMilestone({ ...newMilestone, due_date })}
              placeholder="YYYY-MM-DD"
              style={styles.input}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowAddMilestone(false)}>Cancel</Button>
            <Button
              mode="contained"
              onPress={handleAddMilestone}
              disabled={!newMilestone.title}
            >
              Add
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  goalCard: {
    marginBottom: 24,
  },
  description: {
    marginTop: 8,
  },
  category: {
    marginTop: 8,
    fontStyle: 'italic',
  },
  progressContainer: {
    marginTop: 16,
  },
  progressBar: {
    marginTop: 4,
    height: 8,
    borderRadius: 4,
  },
  milestonesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  milestoneCard: {
    marginBottom: 12,
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  milestoneDescription: {
    marginTop: 8,
    marginBottom: 8,
  },
  input: {
    marginBottom: 16,
  },
}); 