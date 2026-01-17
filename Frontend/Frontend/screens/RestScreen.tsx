import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { AnimatedBackground } from '@/components/layout/AnimatedBackground';
import { AnimatedPepeDie } from '@/components/animations/AnimatedPepeDie';
import { KawaiiColors } from '@/constants/kawaii-theme';
import { useResponsive } from '@/utils/responsive';

interface RestScreenProps {
  messagesSent: number;
  onRestart: () => void;
}

export const RestScreen: React.FC<RestScreenProps> = ({
  messagesSent,
  onRestart,
}) => {
  const responsive = useResponsive();

  return (
    <AnimatedBackground variant="gradient">
      <View style={[styles.restContainer, { padding: responsive.spacing }]}>
        <Text style={[styles.restTitle, { fontSize: responsive.isSmall ? 32 : 42 }]}>YOU DIED!</Text>
        
        <AnimatedPepeDie />
        
        <Text style={styles.restSubtext}>You took too long to breathe. You are now dead.</Text>

        {messagesSent > 0 && (
          <View style={styles.messagesSentBadge}>
            <Text style={styles.messagesSentText}>{messagesSent} messages sent</Text>
          </View>
        )}
        
        <TouchableOpacity style={styles.restartButton} onPress={onRestart}>
          <Text style={styles.restartButtonText}>Start New Session</Text>
        </TouchableOpacity>

        <View style={styles.restFooter}>
          <View style={styles.restProgressBar}><View style={styles.restProgressFill} /></View>
          <Text style={styles.restFooterText}>Game Over</Text>
        </View>
      </View>
    </AnimatedBackground>
  );
};

const styles = StyleSheet.create({
  restContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restTitle: {
    fontWeight: '700',
    color: KawaiiColors.hotPink,
    marginBottom: 30,
  },
  restSubtext: {
    fontSize: 16,
    color: `${KawaiiColors.hotPink}99`,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 16,
    maxWidth: 280,
  },
  messagesSentBadge: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: KawaiiColors.kawaiiPink,
  },
  messagesSentText: {
    fontSize: 14,
    fontWeight: '600',
    color: KawaiiColors.hotPink,
  },
  restartButton: {
    backgroundColor: KawaiiColors.hotPink,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 24,
    shadowColor: '#FF85A2',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 0,
    elevation: 8,
  },
  restartButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: KawaiiColors.white,
  },
  restFooter: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  restProgressBar: {
    height: 4,
    width: '100%',
    backgroundColor: `${KawaiiColors.kawaiiPink}30`,
    borderRadius: 2,
    marginBottom: 20,
  },
  restProgressFill: {
    height: '100%',
    width: '100%',
    backgroundColor: `${KawaiiColors.kawaiiPink}60`,
    borderRadius: 2,
  },
  restFooterText: {
    fontSize: 10,
    fontWeight: '700',
    color: `${KawaiiColors.kawaiiPink}99`,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
});
