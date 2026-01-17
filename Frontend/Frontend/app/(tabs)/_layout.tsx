import { Tabs } from 'expo-router';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { HapticTab } from '@/components/haptic-tab';
import { KawaiiColors } from '@/constants/kawaii-theme';

// Custom kawaii tab icon
const TabIcon: React.FC<{
  emoji: string;
  label: string;
  focused: boolean;
}> = ({ emoji, label, focused }) => (
  <View style={[styles.tabIconContainer, focused && styles.tabIconFocused]}>
    <Text style={[styles.tabEmoji, focused && styles.tabEmojiFocused]}>{emoji}</Text>
    <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{label}</Text>
  </View>
);

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' }, // Hide the tab bar completely
        tabBarButton: () => null, // Disable tab bar buttons
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: 'Friends',
          href: null, // Hidden from default tab bar
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          href: null, // Hidden from default tab bar
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 0,
    elevation: 0,
    height: 85,
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    position: 'absolute',
    shadowColor: KawaiiColors.primaryPink,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  tabIconFocused: {
    backgroundColor: `${KawaiiColors.hotPink}15`,
  },
  tabEmoji: {
    fontSize: 24,
    opacity: 0.5,
  },
  tabEmojiFocused: {
    fontSize: 28,
    opacity: 1,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: KawaiiColors.kawaiiPink,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  tabLabelFocused: {
    color: KawaiiColors.hotPink,
    fontWeight: '700',
  },
});
