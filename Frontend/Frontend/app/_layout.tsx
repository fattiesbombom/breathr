import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { KawaiiColors } from '@/constants/kawaii-theme';

// Custom Kawaii Theme
const KawaiiLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: KawaiiColors.hotPink,
    background: KawaiiColors.cream,
    card: 'rgba(255, 255, 255, 0.9)',
    text: KawaiiColors.text,
    border: KawaiiColors.kawaiiPink,
    notification: KawaiiColors.hotPink,
  },
};

const KawaiiDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: KawaiiColors.kawaiiPink,
    background: '#2D1B25',
    card: 'rgba(255, 255, 255, 0.1)',
    text: '#FFDEE9',
    border: '#B08090',
    notification: KawaiiColors.kawaiiPink,
  },
};

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? KawaiiDarkTheme : KawaiiLightTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="leaderboard" 
          options={{ 
            headerShown: false,
          }} 
        />
      </Stack>
      <StatusBar style="dark" />
    </ThemeProvider>
  );
}
