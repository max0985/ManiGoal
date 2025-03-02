import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, Portal, Dialog, List, Chip, ActivityIndicator, Snackbar, useTheme } from 'react-native-paper';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase/config';
import { getAIResponse } from '../../lib/ai/chat';
import ChatMessage from './ChatMessage';

interface Message {
  id: string;
  message: string;
  role: 'user' | 'assistant';
  created_at: string;
  goal_id: string | null;
  suggested_actions?: string[];
  isTyping?: boolean;
  typingProgress?: number;
  typingStartTime?: number;
}

const MESSAGE_LIMIT = 50;
const SCROLL_DELAY = 100;

export default function ChatScreen() {
  const theme = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showGoalSelect, setShowGoalSelect] = useState(false);
  const [goals, setGoals] = useState<Array<{ id: string; title: string }>>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [selectedGoalTitle, setSelectedGoalTitle] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const [suggestedActionsMap, setSuggestedActionsMap] = useState<Record<string, string[]>>({});
  const messageQueue = useRef<Message[]>([]);
  const scrollTimeout = useRef<NodeJS.Timeout>();

  const scrollToBottom = () => {
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }
    scrollTimeout.current = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, SCROLL_DELAY);
  };

  useEffect(() => {
    return () => {
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  useEffect(() => {
    initializeChat();
  }, []);

  const initializeChat = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/auth/login');
        return;
      }

      await Promise.all([fetchMessages(), fetchGoals()]);

      const { data: profile } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile) {
        await supabase.auth.updateUser({
          data: {
            full_name: user.user_metadata?.full_name || '',
          }
        });
      }
    } catch (error) {
      console.error('Error initializing chat:', error);
      setError('Failed to initialize chat');
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('chat_history')
        .select('id, message, role, created_at, goal_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(MESSAGE_LIMIT);

      if (error) throw error;
      
      const parsedMessages = (data || []).reverse();
      setMessages(parsedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to load messages');
    }
  };

  const fetchGoals = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('goals')
        .select('id, title')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error('Error fetching goals:', error);
      setError('Failed to load goals');
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const trimmedInput = input.trim();
    setInput('');
    setLoading(true);
    setError(null);

    // Clear message queue and any stale thinking messages
    messageQueue.current = [];
    setMessages(prev => prev.filter(m => !m.id.startsWith('thinking-')));

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/auth/login');
        return;
      }

      // Step 1: Add user message to database
      const { data: userMessage, error: userMessageError } = await supabase
        .from('chat_history')
        .insert([{
          user_id: user.id,
          message: trimmedInput,
          role: 'user',
          goal_id: selectedGoalId,
        }])
        .select('id, message, role, created_at, goal_id')
        .single();

      if (userMessageError) throw userMessageError;

      // Step 2: Add user message to state
      setMessages(prev => [...prev.filter(m => m.id !== userMessage.id), userMessage]);

      // Step 3: Add thinking message with unique ID
      const thinkingId = `thinking-${Date.now()}`;
      const thinkingMessage: Message = {
        id: thinkingId,
        message: 'AI is thinking...',
        role: 'assistant',
        created_at: new Date().toISOString(),
        goal_id: selectedGoalId,
        isTyping: false,
      };

      setMessages(prev => [...prev.filter(m => !m.id.startsWith('thinking-')), thinkingMessage]);

      // Step 4: Get AI response
      const aiResponse = await getAIResponse(
        trimmedInput,
        selectedGoalId,
        messages.slice(-3).map(msg => ({
          role: msg.role,
          content: msg.message,
        }))
      );

      // Step 5: Save AI response to database
      const { data: aiMessage, error: aiMessageError } = await supabase
        .from('chat_history')
        .insert([{
          user_id: user.id,
          message: aiResponse.message,
          role: 'assistant',
          goal_id: selectedGoalId,
        }])
        .select('id, message, role, created_at, goal_id')
        .single();

      if (aiMessageError) throw aiMessageError;

      // Store suggested actions
      if (aiResponse.suggestedActions?.length) {
        setSuggestedActionsMap(prev => ({
          ...prev,
          [aiMessage.id]: aiResponse.suggestedActions || [],
        }));
      }

      // Step 6: Replace thinking message with AI response
      setMessages(prev => {
        const filtered = prev.filter(m => !m.id.startsWith('thinking-'));
        return [...filtered, { 
          ...aiMessage, 
          isTyping: true,
          typingStartTime: Date.now(),
          created_at: new Date().toISOString()
        }];
      });

      // Calculate typing duration
      const baseTypingSpeed = 15; // Increased from 20 to 15 ms per character
      const minTypingDuration = 600; // Reduced from 800 to 600 ms
      const maxTypingDuration = 2500; // Reduced from 3000 to 2500 ms
      const typingDuration = Math.min(
        Math.max(
          aiMessage.message.length * baseTypingSpeed,
          minTypingDuration
        ),
        maxTypingDuration
      );

      // Update typing progress
      const startTime = Date.now();
      const updateTypingProgress = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / typingDuration, 1);
        
        setMessages(prev => prev.map(m => 
          m.id === aiMessage.id ? { ...m, typingProgress: progress } : m
        ));

        if (progress < 1) {
          requestAnimationFrame(updateTypingProgress);
        } else {
          // Add a small delay before marking as complete
          setTimeout(() => {
            setMessages(prev => prev.map(m => 
              m.id === aiMessage.id ? { ...m, isTyping: false } : m
            ));
          }, 50); // Reduced from 100 to 50 ms
        }
      };

      updateTypingProgress();

      if (aiResponse.message.includes("I've added this goal to your dashboard")) {
        fetchGoals();
      }

    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
      setInput(trimmedInput);
      
      // Clean up message queue and thinking messages on error
      setMessages(prev => prev.filter(m => !m.id.startsWith('thinking-')));
    } finally {
      setLoading(false);
    }
  };

  const handleGoalSelect = (goalId: string | null, goalTitle: string = '') => {
    setSelectedGoalId(goalId);
    setSelectedGoalTitle(goalTitle);
    setShowGoalSelect(false);
  };

  const renderMessage = (message: Message) => {
    const suggestedActions = message.role === 'assistant' ? suggestedActionsMap[message.id] : undefined;
    return (
      <View key={message.id} style={styles.messageContainer}>
        <ChatMessage
          message={message.message}
          role={message.role}
          timestamp={message.created_at}
          isTyping={message.isTyping}
        />
        {suggestedActions?.length > 0 && !message.isTyping && (
          <View style={styles.suggestedActions}>
            {suggestedActions.map((action, index) => (
              <Chip
                key={index}
                mode="outlined"
                style={styles.actionChip}
                onPress={() => setInput(action)}
              >
                {action}
              </Chip>
            ))}
          </View>
        )}
      </View>
    );
  };

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Text variant="titleMedium">AI Assistant</Text>
        <Button
          mode="outlined"
          onPress={() => setShowGoalSelect(true)}
          icon={selectedGoalId ? 'check-circle' : 'target'}
        >
          {selectedGoalId ? `Goal: ${selectedGoalTitle}` : 'Select Goal'}
        </Button>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
      >
        {messages.map(renderMessage)}
      </ScrollView>

      <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface }]}>
        <TextInput
          mode="outlined"
          value={input}
          onChangeText={setInput}
          placeholder="Type your message..."
          multiline
          style={styles.input}
          disabled={loading}
          right={
            <TextInput.Icon
              icon="send"
              disabled={loading || !input.trim()}
              onPress={handleSend}
            />
          }
        />
      </View>

      <Portal>
        <Dialog visible={showGoalSelect} onDismiss={() => setShowGoalSelect(false)}>
          <Dialog.Title>Select a Goal</Dialog.Title>
          <Dialog.Content>
            <List.Item
              title="No Goal Selected"
              description="General conversation"
              onPress={() => handleGoalSelect(null)}
              right={props => 
                !selectedGoalId ? <List.Icon {...props} icon="check" /> : null
              }
            />
            {goals.map(goal => (
              <List.Item
                key={goal.id}
                title={goal.title}
                onPress={() => handleGoalSelect(goal.id, goal.title)}
                right={props => 
                  selectedGoalId === goal.id ? <List.Icon {...props} icon="check" /> : null
                }
              />
            ))}
          </Dialog.Content>
        </Dialog>
      </Portal>

      <Snackbar
        visible={!!error}
        onDismiss={() => setError(null)}
        action={{
          label: 'Dismiss',
          onPress: () => setError(null),
        }}
      >
        {error}
      </Snackbar>
    </KeyboardAvoidingView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  messageContainer: {
    marginBottom: 16,
  },
  suggestedActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    marginLeft: 48,
  },
  actionChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  inputContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  input: {
    maxHeight: 100,
  },
}); 