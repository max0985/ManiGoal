import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, FAB, Portal, Dialog, ActivityIndicator, useTheme } from 'react-native-paper';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase/config';
import VisionBoardItem from '../../components/vision-board/VisionBoardItem';
import ImagePreview from '../../components/vision-board/ImagePreview';
import * as ImagePicker from 'expo-image-picker';

interface VisionBoardItem {
  id: string;
  image_url: string;
  caption: string | null;
  position_x: number;
  position_y: number;
}

export default function VisionBoard() {
  const [items, setItems] = useState<VisionBoardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newItem, setNewItem] = useState({
    caption: '',
    imageUri: '',
  });

  useEffect(() => {
    fetchVisionBoardItems();
  }, []);

  const fetchVisionBoardItems = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('vision_board_items')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching vision board items:', error);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets[0].uri) {
      setNewItem({ ...newItem, imageUri: result.assets[0].uri });
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const response = await fetch(uri);
      const blob = await response.blob();
      const filename = `vision-board/${user.id}/${Date.now()}.jpg`;

      const { data, error } = await supabase.storage
        .from('images')
        .upload(filename, blob);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filename);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const handleAddItem = async () => {
    try {
      if (!newItem.imageUri) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const imageUrl = await uploadImage(newItem.imageUri);
      const { width } = Dimensions.get('window');
      const randomX = Math.random() * (width - 200); // 200 is item width

      const { error } = await supabase
        .from('vision_board_items')
        .insert([
          {
            user_id: user.id,
            image_url: imageUrl,
            caption: newItem.caption || null,
            position_x: randomX,
            position_y: 100,
          },
        ]);

      if (error) throw error;

      setShowAddDialog(false);
      setNewItem({ caption: '', imageUri: '' });
      fetchVisionBoardItems();
    } catch (error) {
      console.error('Error adding vision board item:', error);
    }
  };

  const handleMoveItem = async (id: string, x: number, y: number) => {
    try {
      const { error } = await supabase
        .from('vision_board_items')
        .update({
          position_x: x,
          position_y: y,
        })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating item position:', error);
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('vision_board_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setItems(items.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error deleting vision board item:', error);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <Text variant="headlineSmall">Your Vision Board is Empty</Text>
            <Text variant="bodyMedium">
              Add images that represent your goals and aspirations
            </Text>
          </View>
        ) : (
          items.map(item => (
            <VisionBoardItem
              key={item.id}
              id={item.id}
              imageUrl={item.image_url}
              caption={item.caption}
              position={{ x: item.position_x, y: item.position_y }}
              onMove={handleMoveItem}
              onDelete={handleDeleteItem}
            />
          ))
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setShowAddDialog(true)}
        label="Add Image"
      />

      <Portal>
        <Dialog visible={showAddDialog} onDismiss={() => setShowAddDialog(false)}>
          <Dialog.Title>Add to Vision Board</Dialog.Title>
          <Dialog.Content>
            <ImagePreview uri={newItem.imageUri} />
            <Button
              mode="outlined"
              onPress={pickImage}
              style={styles.imageButton}
            >
              {newItem.imageUri ? 'Change Image' : 'Select Image'}
            </Button>
            <TextInput
              label="Caption (optional)"
              value={newItem.caption}
              onChangeText={caption => setNewItem({ ...newItem, caption })}
              style={styles.input}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowAddDialog(false)}>Cancel</Button>
            <Button
              mode="contained"
              onPress={handleAddItem}
              disabled={!newItem.imageUri}
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
    minHeight: '100%',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  imageButton: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
}); 