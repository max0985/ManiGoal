import React from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { Text } from 'react-native-paper';

interface ImagePreviewProps {
  uri: string | null;
}

export default function ImagePreview({ uri }: ImagePreviewProps) {
  if (!uri) {
    return (
      <View style={[styles.container, styles.placeholder]}>
        <Text variant="bodyMedium">No image selected</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image
        source={{ uri }}
        style={styles.image}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 200,
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  placeholder: {
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
}); 