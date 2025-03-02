import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6750A4',
    secondary: '#625B71',
    tertiary: '#7D5260',
    background: '#FFFBFE',
    surface: '#FFFBFE',
    error: '#B3261E',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onTertiary: '#FFFFFF',
    onBackground: '#1C1B1F',
    onSurface: '#1C1B1F',
    onError: '#FFFFFF',
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#D0BCFF',
    secondary: '#CCC2DC',
    tertiary: '#EFB8C8',
    background: '#1C1B1F',
    surface: '#1C1B1F',
    error: '#F2B8B5',
    onPrimary: '#381E72',
    onSecondary: '#332D41',
    onTertiary: '#492532',
    onBackground: '#E6E1E5',
    onSurface: '#E6E1E5',
    onError: '#601410',
  },
};

const theme = {
  light: lightTheme,
  dark: darkTheme,
};

export default theme; 