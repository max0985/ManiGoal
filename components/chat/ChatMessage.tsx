import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Avatar, useTheme } from 'react-native-paper';
import { format } from 'date-fns';

interface ChatMessageProps {
  message: string;
  role: 'user' | 'assistant';
  timestamp: string;
  isTyping?: boolean;
}

export default function ChatMessage({ message, role, timestamp, isTyping }: ChatMessageProps) {
  const theme = useTheme();
  const [displayedText, setDisplayedText] = useState('');
  const [isTypingComplete, setIsTypingComplete] = useState(!isTyping);
  const [isThinking, setIsThinking] = useState(message === 'AI is thinking...');
  const animationFrameRef = useRef<number>();
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setIsThinking(message === 'AI is thinking...');
  }, [message]);

  useEffect(() => {
    if (role === 'assistant' && isTyping) {
      setDisplayedText('');
      setIsTypingComplete(false);
      let currentIndex = 0;
      let isMounted = true;
      let animationFrame: number;

      const typeNextCharacter = () => {
        if (!isMounted || currentIndex >= message.length) {
          setIsTypingComplete(true);
          return;
        }

        // Add the next character
        setDisplayedText(prev => {
          const nextChar = message[currentIndex];
          currentIndex++;
          return prev + nextChar;
        });

        // Calculate delay based on character type
        let delay = 15;
        const currentChar = message[currentIndex];
        
        if (currentChar?.match(/[.,!?]/)) {
          delay = 60;
        } else if (currentChar?.match(/[\u{1F300}-\u{1F9FF}]/u)) {
          delay = 80;
        } else if (currentChar === '\n') {
          delay = 50;
        }
        
        // Add slight randomness
        delay += Math.random() * 5;

        animationFrame = requestAnimationFrame(() => {
          setTimeout(typeNextCharacter, delay);
        });
      };

      // Start typing animation
      typeNextCharacter();

      // Cleanup function
      return () => {
        isMounted = false;
        if (animationFrame) {
          cancelAnimationFrame(animationFrame);
        }
        setDisplayedText(message);
        setIsTypingComplete(true);
      };
    } else {
      setDisplayedText(message);
      setIsTypingComplete(true);
    }
  }, [message, isTyping, role]);

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      marginVertical: 4,
      paddingHorizontal: 16,
      opacity: isTypingComplete ? 1 : 0.9,
    },
    messageContainer: {
      flex: 1,
      marginLeft: role === 'assistant' ? 8 : 0,
      marginRight: role === 'user' ? 8 : 0,
    },
    bubble: {
      backgroundColor: role === 'user' ? theme.colors.primary : theme.colors.surfaceVariant,
      padding: 12,
      borderRadius: 16,
      borderTopLeftRadius: role === 'assistant' ? 4 : 16,
      borderTopRightRadius: role === 'user' ? 4 : 16,
      maxWidth: '85%',  // Added to prevent messages from being too wide
    },
    text: {
      color: role === 'user' ? theme.colors.onPrimary : theme.colors.onSurfaceVariant,
      fontSize: 16,
      lineHeight: 20,
    },
    timestamp: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      opacity: 0.7,
      marginTop: 4,
      textAlign: role === 'user' ? 'right' : 'left',
    },
    thinkingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    thinkingDot: {
      opacity: 0.6,
      marginLeft: 2,
    },
    cursor: {
      opacity: isTypingComplete ? 0 : 1,
      color: theme.colors.onSurfaceVariant,
    }
  });

  return (
    <View style={[styles.container, { alignItems: role === 'user' ? 'flex-end' : 'flex-start' }]}>
      {role === 'assistant' && (
        <Avatar.Icon 
          size={32} 
          icon="robot" 
          style={{ backgroundColor: theme.colors.primary }} 
        />
      )}
      <View style={styles.messageContainer}>
        <View style={styles.bubble}>
          {isThinking ? (
            <View style={styles.thinkingContainer}>
              <Text style={styles.text}>AI is thinking</Text>
              <Text style={[styles.text, styles.thinkingDot]}>.</Text>
              <Text style={[styles.text, styles.thinkingDot]}>.</Text>
              <Text style={[styles.text, styles.thinkingDot]}>.</Text>
            </View>
          ) : (
            <Text style={styles.text}>
              {displayedText}
              <Text style={styles.cursor}>
                {!isTypingComplete ? '▋' : ''}
              </Text>
            </Text>
          )}
        </View>
        <Text style={styles.timestamp}>
          {format(new Date(timestamp), 'h:mm a')}
        </Text>
      </View>
      {role === 'user' && (
        <Avatar.Icon 
          size={32} 
          icon="account" 
          style={{ backgroundColor: theme.colors.primary }} 
        />
      )}
    </View>
  );
} 