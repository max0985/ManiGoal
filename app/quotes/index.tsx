import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl, Image, TouchableOpacity } from 'react-native';
import { Text, Card, Button, ActivityIndicator, FAB, Divider, IconButton, useTheme } from 'react-native-paper';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase/config';

interface Quote {
  id: string;
  quote_text: string;
  author: string | null;
  generated_at: string;
  shared_count: number;
  is_favorite: boolean;
  category: string;
}

export default function Quotes() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [notificationTime, setNotificationTime] = useState<Date>(new Date());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { width } = Dimensions.get('window');
  const quoteRef = useRef<any>(null);

  const categories = [
    'Personal Growth',
    'Success',
    'Motivation',
    'Leadership',
    'Mindfulness',
    'Relationships',
    'Health',
    'Creativity',
    'Wisdom',
    'Other'
  ];

  useEffect(() => {
    fetchQuotes();
    setupNotifications();
  }, []);

  const setupNotifications = async () => {
    const success = await registerForPushNotificationsAsync();
    setNotificationsEnabled(success);
  };

  const handleNotificationTimeChange = async (hours: number, minutes: number) => {
    const newTime = new Date();
    newTime.setHours(hours);
    newTime.setMinutes(minutes);
    setNotificationTime(newTime);
    setShowTimePicker(false);

    if (notificationsEnabled) {
      await scheduleDailyQuoteNotification(hours, minutes);
    }
  };

  const toggleNotifications = async (enabled: boolean) => {
    if (enabled) {
      const success = await registerForPushNotificationsAsync();
      if (success) {
        await scheduleDailyQuoteNotification(
          notificationTime.getHours(),
          notificationTime.getMinutes()
        );
      }
      setNotificationsEnabled(success);
    } else {
      await Notifications.cancelAllScheduledNotificationsAsync();
      setNotificationsEnabled(false);
    }
  };

  const fetchQuotes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const query = supabase
        .from('daily_quotes')
        .select('*')
        .eq('user_id', user.id);

      if (showFavoritesOnly) {
        query.eq('is_favorite', true);
      }

      if (selectedCategory) {
        query.eq('category', selectedCategory);
      }

      const { data, error } = await query.order('generated_at', { ascending: false });

      if (error) throw error;
      setQuotes(data || []);
    } catch (error) {
      console.error('Error fetching quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFavoriteToggle = async (quote: Quote) => {
    try {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      const { error } = await supabase
        .from('daily_quotes')
        .update({ is_favorite: !quote.is_favorite })
        .eq('id', quote.id);

      if (error) throw error;
      fetchQuotes();
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleGenerateQuote = async () => {
    try {
      setGenerating(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { quote_text, author, category } = await getAIQuote();

      const { error } = await supabase
        .from('daily_quotes')
        .insert([
          {
            user_id: user.id,
            quote_text,
            author,
            category,
            shared_count: 0,
            is_favorite: false,
          },
        ]);

      if (error) throw error;
      fetchQuotes();
    } catch (error) {
      console.error('Error generating quote:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleShare = async (quote: Quote) => {
    try {
      setSelectedQuote(quote);
      setShowShareOptions(true);
    } catch (error) {
      console.error('Error preparing share:', error);
    }
  };

  const handleTextShare = async (quote: Quote) => {
    try {
      const message = `"${quote.quote_text}"${quote.author ? `\n- ${quote.author}` : ''}\n\nShared from ManiGoal`;
      
      const success = await shareToSocialMedia({
        message,
        title: 'Share Quote',
      });

      if (success) {
        const { error } = await supabase
          .from('daily_quotes')
          .update({ shared_count: quote.shared_count + 1 })
          .eq('id', quote.id);

        if (error) throw error;
        fetchQuotes();
      }
    } catch (error) {
      console.error('Error sharing quote:', error);
    } finally {
      setShowShareOptions(false);
    }
  };

  const handleImageShare = async (quote: Quote) => {
    try {
      const success = await captureAndShareQuote(quoteRef, `Quote from ManiGoal`);

      if (success) {
        const { error } = await supabase
          .from('daily_quotes')
          .update({ shared_count: quote.shared_count + 1 })
          .eq('id', quote.id);

        if (error) throw error;
        fetchQuotes();
      }
    } catch (error) {
      console.error('Error sharing quote image:', error);
    } finally {
      setShowShareOptions(false);
    }
  };

  const handleCategorySelect = (category: string | null) => {
    setSelectedCategory(category);
    setShowCategoryDialog(false);
    fetchQuotes();
  };

  const handleUpdateCategory = async (quote: Quote, newCategory: string) => {
    try {
      const { error } = await supabase
        .from('daily_quotes')
        .update({ category: newCategory })
        .eq('id', quote.id);

      if (error) throw error;
      fetchQuotes();
    } catch (error) {
      console.error('Error updating category:', error);
    }
  };

  const renderQuoteCard = (quote: Quote, index: number) => {
    const slideAnim = useRef(new Animated.Value(width)).current;

    useEffect(() => {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        delay: index * 100,
        useNativeDriver: true,
      }).start();
    }, []);

    return (
      <Animated.View
        key={quote.id}
        style={[
          styles.quoteCardContainer,
          {
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        <Card style={styles.quoteCard}>
          <Card.Content>
            <View style={styles.quoteHeader}>
              <View style={styles.categoryContainer}>
                <Button
                  mode="text"
                  onPress={() => {
                    setSelectedQuote(quote);
                    setShowCategoryDialog(true);
                  }}
                  style={styles.categoryButton}
                >
                  {quote.category || 'Categorize'}
                </Button>
              </View>
              <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <IconButton
                  icon={quote.is_favorite ? 'heart' : 'heart-outline'}
                  size={24}
                  onPress={() => handleFavoriteToggle(quote)}
                  style={styles.favoriteButton}
                  iconColor={quote.is_favorite ? '#e91e63' : undefined}
                />
              </Animated.View>
            </View>
            <Text variant="bodyLarge" style={styles.quoteText}>
              "{quote.quote_text}"
            </Text>
            {quote.author && (
              <Text variant="bodyMedium" style={styles.author}>
                - {quote.author}
              </Text>
            )}
            <Text variant="bodySmall" style={styles.metadata}>
              Generated on {new Date(quote.generated_at).toLocaleDateString()}
              {quote.shared_count > 0 && ` • Shared ${quote.shared_count} times`}
            </Text>
          </Card.Content>
          <Card.Actions>
            <Button onPress={() => handleShare(quote)}>Share</Button>
          </Card.Actions>
        </Card>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="titleLarge">Daily Quotes</Text>
        <View style={styles.headerActions}>
          <Button
            mode={selectedCategory ? 'contained-tonal' : 'outlined'}
            onPress={() => setShowCategoryDialog(true)}
            style={styles.filterButton}
          >
            {selectedCategory || 'Category'}
          </Button>
          <Button
            mode={showFavoritesOnly ? 'contained-tonal' : 'outlined'}
            onPress={() => {
              setShowFavoritesOnly(!showFavoritesOnly);
              fetchQuotes();
            }}
            style={styles.filterButton}
          >
            Favorites
          </Button>
          <IconButton
            icon="cog"
            onPress={() => setShowSettings(true)}
          />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        {quotes.length === 0 ? (
          <Animated.View style={{ opacity: fadeAnim }}>
            <Card style={styles.emptyCard}>
              <Card.Content>
                <Text variant="titleMedium">
                  {showFavoritesOnly ? 'No Favorite Quotes Yet' : 'No Quotes Yet'}
                </Text>
                <Text variant="bodyMedium">
                  {showFavoritesOnly
                    ? 'Add quotes to your favorites!'
                    : 'Generate your first inspirational quote!'}
                </Text>
              </Card.Content>
            </Card>
          </Animated.View>
        ) : (
          quotes.map((quote, index) => renderQuoteCard(quote, index))
        )}
      </ScrollView>

      <FAB
        icon="plus"
        label="Generate Quote"
        style={styles.fab}
        onPress={handleGenerateQuote}
        loading={generating}
      />

      <Portal>
        <Dialog visible={showSettings} onDismiss={() => setShowSettings(false)}>
          <Dialog.Title>Notification Settings</Dialog.Title>
          <Dialog.Content>
            <View style={styles.settingRow}>
              <Text>Daily Notifications</Text>
              <Switch
                value={notificationsEnabled}
                onValueChange={toggleNotifications}
              />
            </View>
            <Button
              mode="outlined"
              onPress={() => setShowTimePicker(true)}
              disabled={!notificationsEnabled}
              style={styles.timeButton}
            >
              Notification Time: {notificationTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Button>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowSettings(false)}>Done</Button>
          </Dialog.Actions>
        </Dialog>

        <TimePickerModal
          visible={showTimePicker}
          onDismiss={() => setShowTimePicker(false)}
          onConfirm={({ hours, minutes }) => handleNotificationTimeChange(hours, minutes)}
          hours={notificationTime.getHours()}
          minutes={notificationTime.getMinutes()}
        />

        <Dialog visible={showCategoryDialog} onDismiss={() => setShowCategoryDialog(false)}>
          <Dialog.Title>
            {selectedQuote ? 'Update Category' : 'Filter by Category'}
          </Dialog.Title>
          <Dialog.Content>
            <ScrollView style={styles.categoryList}>
              {!selectedQuote && (
                <Button
                  mode={selectedCategory === null ? 'contained' : 'outlined'}
                  onPress={() => handleCategorySelect(null)}
                  style={styles.categoryOption}
                >
                  All Categories
                </Button>
              )}
              {categories.map(category => (
                <Button
                  key={category}
                  mode={selectedCategory === category ? 'contained' : 'outlined'}
                  onPress={() => {
                    if (selectedQuote) {
                      handleUpdateCategory(selectedQuote, category);
                      setShowCategoryDialog(false);
                      setSelectedQuote(null);
                    } else {
                      handleCategorySelect(category);
                    }
                  }}
                  style={styles.categoryOption}
                >
                  {category}
                </Button>
              ))}
            </ScrollView>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => {
              setShowCategoryDialog(false);
              setSelectedQuote(null);
            }}>
              Cancel
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={showShareOptions} onDismiss={() => setShowShareOptions(false)}>
          <Dialog.Title>Share Quote</Dialog.Title>
          <Dialog.Content>
            {selectedQuote && (
              <ViewShot ref={quoteRef} options={{ format: 'png', quality: 0.9 }}>
                <ShareableQuote
                  quote={selectedQuote.quote_text}
                  author={selectedQuote.author}
                  category={selectedQuote.category}
                />
              </ViewShot>
            )}
            <View style={styles.shareButtons}>
              <Button
                mode="contained"
                onPress={() => selectedQuote && handleTextShare(selectedQuote)}
                style={styles.shareButton}
              >
                Share as Text
              </Button>
              <Button
                mode="contained-tonal"
                onPress={() => selectedQuote && handleImageShare(selectedQuote)}
                style={styles.shareButton}
              >
                Share as Image
              </Button>
            </View>
          </Dialog.Content>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
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
  quoteCard: {
    marginBottom: 16,
  },
  quoteText: {
    fontSize: 18,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  author: {
    textAlign: 'right',
    marginBottom: 8,
  },
  metadata: {
    color: '#666',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  timeButton: {
    marginTop: 8,
  },
  quoteHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: -8,
  },
  favoriteButton: {
    margin: 0,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButton: {
    marginRight: 8,
  },
  quoteCardContainer: {
    marginBottom: 16,
  },
  categoryContainer: {
    flex: 1,
  },
  categoryButton: {
    alignSelf: 'flex-start',
    marginLeft: -8,
  },
  categoryList: {
    maxHeight: 300,
  },
  categoryOption: {
    marginBottom: 8,
  },
  shareButtons: {
    marginTop: 16,
    gap: 8,
  },
  shareButton: {
    width: '100%',
  },
}); 