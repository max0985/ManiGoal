import React, { useState } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { TextInput, Button, HelperText, Menu, useTheme, Text } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';

interface GoalFormProps {
  title: string;
  setTitle: (title: string) => void;
  description: string;
  setDescription: (description: string) => void;
  deadline: Date;
  setDeadline: (date: Date) => void;
  category: string;
  setCategory: (category: string) => void;
  error: string;
  loading: boolean;
  onSubmit: () => void;
  submitLabel: string;
}

const CATEGORIES = [
  'Personal',
  'Professional',
  'Health',
  'Financial',
  'Educational',
  'Relationships',
] as const;

const MAX_TITLE_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;

export default function GoalForm({
  title,
  setTitle,
  description,
  setDescription,
  deadline,
  setDeadline,
  category,
  setCategory,
  error,
  loading,
  onSubmit,
  submitLabel,
}: GoalFormProps) {
  const theme = useTheme();
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(Platform.OS === 'ios');
  const [titleError, setTitleError] = useState('');
  const [descriptionError, setDescriptionError] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [deadlineError, setDeadlineError] = useState('');

  const validateForm = () => {
    let isValid = true;
    
    // Reset errors
    setTitleError('');
    setDescriptionError('');
    setCategoryError('');
    setDeadlineError('');

    // Validate title
    if (!title.trim()) {
      setTitleError('Title is required');
      isValid = false;
    } else if (title.length > MAX_TITLE_LENGTH) {
      setTitleError(`Title must be less than ${MAX_TITLE_LENGTH} characters`);
      isValid = false;
    }

    // Validate description
    if (!description.trim()) {
      setDescriptionError('Description is required');
      isValid = false;
    } else if (description.length > MAX_DESCRIPTION_LENGTH) {
      setDescriptionError(`Description must be less than ${MAX_DESCRIPTION_LENGTH} characters`);
      isValid = false;
    }

    // Validate category
    if (!category) {
      setCategoryError('Category is required');
      isValid = false;
    }

    // Validate deadline
    if (deadline < new Date()) {
      setDeadlineError('Deadline must be in the future');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit();
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDeadline(selectedDate);
      setDeadlineError('');
    }
  };

  return (
    <View style={styles.form}>
      <TextInput
        label="Goal Title"
        value={title}
        onChangeText={(text) => {
          setTitle(text);
          setTitleError('');
        }}
        error={!!titleError}
        style={styles.input}
        disabled={loading}
        maxLength={MAX_TITLE_LENGTH}
        right={
          <TextInput.Affix 
            text={`${title.length}/${MAX_TITLE_LENGTH}`} 
          />
        }
      />
      <HelperText type="error" visible={!!titleError}>
        {titleError}
      </HelperText>

      <TextInput
        label="Description"
        value={description}
        onChangeText={(text) => {
          setDescription(text);
          setDescriptionError('');
        }}
        error={!!descriptionError}
        multiline
        numberOfLines={4}
        style={styles.input}
        disabled={loading}
        maxLength={MAX_DESCRIPTION_LENGTH}
        right={
          <TextInput.Affix 
            text={`${description.length}/${MAX_DESCRIPTION_LENGTH}`} 
          />
        }
      />
      <HelperText type="error" visible={!!descriptionError}>
        {descriptionError}
      </HelperText>

      <Menu
        visible={showCategoryMenu}
        onDismiss={() => setShowCategoryMenu(false)}
        anchor={
          <TextInput
            label="Category"
            value={category}
            error={!!categoryError}
            style={styles.input}
            disabled={loading}
            right={
              <TextInput.Icon 
                icon="menu-down" 
                onPress={() => setShowCategoryMenu(true)}
              />
            }
            showSoftInputOnFocus={false}
            onPressIn={() => setShowCategoryMenu(true)}
          />
        }
      >
        {CATEGORIES.map((cat) => (
          <Menu.Item
            key={cat}
            onPress={() => {
              setCategory(cat);
              setCategoryError('');
              setShowCategoryMenu(false);
            }}
            title={cat}
          />
        ))}
      </Menu>
      <HelperText type="error" visible={!!categoryError}>
        {categoryError}
      </HelperText>

      {Platform.OS === 'ios' ? (
        <>
          <Text variant="labelSmall" style={styles.dateLabel}>Deadline</Text>
          <DateTimePicker
            value={deadline}
            onChange={handleDateChange}
            minimumDate={new Date()}
            mode="date"
            style={styles.datePicker}
          />
        </>
      ) : (
        <>
          <Button
            mode="outlined"
            onPress={() => setShowDatePicker(true)}
            style={styles.input}
            disabled={loading}
          >
            Select Deadline: {deadline.toLocaleDateString()}
          </Button>
          {showDatePicker && (
            <DateTimePicker
              value={deadline}
              onChange={handleDateChange}
              minimumDate={new Date()}
              mode="date"
            />
          )}
        </>
      )}
      <HelperText type="error" visible={!!deadlineError}>
        {deadlineError}
      </HelperText>

      {error ? (
        <HelperText type="error" visible={!!error}>
          {error}
        </HelperText>
      ) : null}

      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={loading}
        disabled={loading}
        style={styles.button}
      >
        {submitLabel}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    width: '100%',
    maxWidth: 400,
  },
  input: {
    marginBottom: 8,
  },
  button: {
    marginTop: 16,
  },
  dateLabel: {
    marginBottom: 4,
  },
  datePicker: {
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
}); 