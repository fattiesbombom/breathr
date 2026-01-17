import React, { useState } from 'react';
import { View, StyleSheet, Text, TextInput, TouchableOpacity, ScrollView, Image } from 'react-native';
import { AnimatedBackground } from '@/components/layout/AnimatedBackground';
import { KawaiiColors, KawaiiShadows } from '@/constants/kawaii-theme';
import { useResponsive } from '@/utils/responsive';

interface SetupScreenProps {
  onSetup: (username: string) => void;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({ onSetup }) => {
  const [inputText, setInputText] = useState('');
  const responsive = useResponsive();

  return (
    <AnimatedBackground variant="gradient">
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={[styles.setupContainer, { padding: responsive.spacing }]}>
          <Image 
            source={require('@/assets/images/angel.png')}
            style={{ width: responsive.emojiSize * 1.5, height: responsive.emojiSize * 1.5 }}
            resizeMode="contain"
          />
          <Text style={[styles.setupTitle, { fontSize: responsive.titleSize }]}>Enter Guardian Username</Text>
          <Text style={styles.setupSubtitle}>Connect with your guardian to stay safe</Text>
          
          <View style={[styles.setupCard, { maxWidth: responsive.isSmall ? 300 : 340 }]}>
            <Text style={styles.cardTitle}>Enter a Telegram username</Text>
            <TextInput
              style={[styles.input, { fontSize: responsive.isSmall ? 16 : 18 }]}
              placeholder="e.g. mom_telegram"
              placeholderTextColor={KawaiiColors.textLight}
              value={inputText}
              onChangeText={setInputText}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity style={styles.setupButton} onPress={() => onSetup(inputText)}>
              <Text style={styles.setupButtonText}>Connect</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </AnimatedBackground>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  setupContainer: {
    flex: 1,
    paddingTop: 80,
    alignItems: 'center',
  },
  setupTitle: {
    fontWeight: '700',
    color: KawaiiColors.hotPink,
    marginBottom: 8,
    textAlign: 'center',
  },
  setupSubtitle: {
    fontSize: 16,
    color: KawaiiColors.text,
    opacity: 0.8,
    marginBottom: 40,
    textAlign: 'center',
  },
  setupCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 32,
    padding: 24,
    borderWidth: 4,
    borderColor: KawaiiColors.softPink,
    ...KawaiiShadows.card,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: KawaiiColors.hotPink,
    marginBottom: 16,
  },
  input: {
    backgroundColor: KawaiiColors.white,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: KawaiiColors.kawaiiPink,
    padding: 16,
    color: KawaiiColors.text,
    marginBottom: 20,
  },
  setupButton: {
    backgroundColor: KawaiiColors.hotPink,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    ...KawaiiShadows.button,
  },
  setupButtonText: {
    color: KawaiiColors.white,
    fontSize: 18,
    fontWeight: '700',
  },
});
