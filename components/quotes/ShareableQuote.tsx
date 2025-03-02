import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';

interface ShareableQuoteProps {
  quote: string;
  author: string | null;
  category: string;
}

export default function ShareableQuote({ quote, author, category }: ShareableQuoteProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary]}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <Text variant="headlineSmall" style={styles.quote}>
            "{quote}"
          </Text>
          {author && (
            <Text variant="titleMedium" style={styles.author}>
              - {author}
            </Text>
          )}
          <Text variant="labelSmall" style={styles.category}>
            {category}
          </Text>
          <Text variant="labelSmall" style={styles.watermark}>
            Shared via ManiGoal
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 300,
    height: 300,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quote: {
    color: 'white',
    textAlign: 'center',
    marginBottom: 16,
  },
  author: {
    color: 'white',
    opacity: 0.9,
    marginBottom: 24,
  },
  category: {
    color: 'white',
    opacity: 0.7,
    marginBottom: 8,
  },
  watermark: {
    color: 'white',
    opacity: 0.5,
    position: 'absolute',
    bottom: 16,
  },
}); 