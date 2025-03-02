import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { DefaultTheme, DarkTheme } from '@react-navigation/native';

// Light theme configuration
export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#1976D2',
    secondary: '#03DAC6',
    background: '#F5F5F5',
    surface: '#FFFFFF',
    text: '#000000',
    error: '#B00020',
  },
  fonts: {
    ...MD3LightTheme.fonts,
    regular: {
      fontFamily: 'System',
      fontWeight: 'normal',
    },
    medium: {
      fontFamily: 'System',
      fontWeight: 'medium',
    },
    light: {
      fontFamily: 'System',
      fontWeight: 'light',
    },
    thin: {
      fontFamily: 'System',
      fontWeight: 'thin',
    },
  },
};

// Dark theme configuration
export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#90CAF9',
    secondary: '#03DAC6',
    background: '#121212',
    surface: '#1E1E1E',
    text: '#FFFFFF',
    error: '#CF6679',
  },
  fonts: {
    ...MD3DarkTheme.fonts,
    regular: {
      fontFamily: 'System',
      fontWeight: 'normal',
    },
    medium: {
      fontFamily: 'System',
      fontWeight: 'medium',
    },
    light: {
      fontFamily: 'System',
      fontWeight: 'light',
    },
    thin: {
      fontFamily: 'System',
      fontWeight: 'thin',
    },
  },
};

// Navigation theme that matches our paper theme
export const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: lightTheme.colors.primary,
    background: lightTheme.colors.background,
    card: lightTheme.colors.surface,
    text: lightTheme.colors.text,
    border: lightTheme.colors.outline,
  },
};

export default lightTheme;