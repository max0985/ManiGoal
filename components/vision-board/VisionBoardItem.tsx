import React from 'react';
import { StyleSheet, View, Image, Animated, PanResponder } from 'react-native';
import { Text, Card, IconButton } from 'react-native-paper';

interface VisionBoardItemProps {
  id: string;
  imageUrl: string;
  caption: string | null;
  position: { x: number; y: number };
  onMove: (id: string, x: number, y: number) => void;
  onDelete: (id: string) => void;
}

export default function VisionBoardItem({
  id,
  imageUrl,
  caption,
  position,
  onMove,
  onDelete,
}: VisionBoardItemProps) {
  const pan = React.useRef(new Animated.ValueXY({ x: position.x, y: position.y })).current;

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: (_, gesture) => {
        onMove(id, gesture.moveX, gesture.moveY);
      },
    })
  ).current;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateX: pan.x }, { translateY: pan.y }],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <Card style={styles.card}>
        <IconButton
          icon="close"
          size={20}
          style={styles.deleteButton}
          onPress={() => onDelete(id)}
        />
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} />
        ) : (
          <View style={styles.placeholder}>
            <Text>No Image</Text>
          </View>
        )}
        {caption && (
          <Card.Content style={styles.captionContainer}>
            <Text style={styles.caption}>{caption}</Text>
          </Card.Content>
        )}
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 200,
    height: 200,
    zIndex: 1,
  },
  card: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  placeholder: {
    width: '100%',
    height: 150,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captionContainer: {
    padding: 8,
  },
  caption: {
    fontSize: 12,
    textAlign: 'center',
  },
  deleteButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    margin: 0,
    zIndex: 2,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
});