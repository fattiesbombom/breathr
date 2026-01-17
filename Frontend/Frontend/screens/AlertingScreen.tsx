import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { AnimatedBackground } from '@/components/layout/AnimatedBackground';
import { CloudChar } from '@/components/kawaii/Characters';
import { KawaiiColors } from '@/constants/kawaii-theme';
import { formatTimer } from '@/utils/formatTimer';

interface AlertingScreenProps {
  alertTimer: number;
  messagesSent: number;
  onFalseAlarm: () => void;
}

export const AlertingScreen: React.FC<AlertingScreenProps> = ({
  alertTimer,
  messagesSent,
  onFalseAlarm,
}) => {
  return (
    <AnimatedBackground variant="gradient">
      <View style={styles.alertingContainer}>
        <View style={styles.alertContent}>
          <CloudChar />
          <Text style={styles.alertTitle}>GUARDIANS CONTACTED!</Text>
          
          <Text style={styles.alertSubtext}>Let them know if you are okay</Text>
          
          <View style={styles.alertTimerDisplay}>
            <Text style={styles.alertTimerBig}>{formatTimer(alertTimer)}</Text>
            <Text style={styles.alertTimerLabel}>until death</Text>
          </View>
        </View>

        <View style={styles.alertBottom}>
          <Text style={styles.messagesSentAlert}>{messagesSent} messages sent</Text>
          <TouchableOpacity style={styles.falseAlarmButton} onPress={onFalseAlarm}>
            <Text style={styles.falseAlarmText}>I AM OKAY!</Text>
          </TouchableOpacity>
        </View>
      </View>
    </AnimatedBackground>
  );
};

const styles = StyleSheet.create({
  alertingContainer: {
    flex: 1,
    alignItems: 'center',
  },
  alertContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 200,
  },
  alertTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: KawaiiColors.hotPink,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginTop: 10,
  },
  alertSubtext: {
    fontSize: 16,
    color: KawaiiColors.text,
    opacity: 0.8,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 280,
  },
  alertTimerDisplay: {
    marginTop: 12,
    alignItems: 'center',
  },
  alertTimerBig: {
    fontSize: 48,
    fontWeight: '900',
    color: KawaiiColors.hotPink,
  },
  alertTimerLabel: {
    fontSize: 12,
    color: KawaiiColors.textLight,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  alertBottom: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 24,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  messagesSentAlert: {
    fontSize: 16,
    fontWeight: '600',
    color: KawaiiColors.hotPink,
    marginBottom: 40,
  },
  falseAlarmButton: {
    width: '100%',
    aspectRatio: 1,
    maxHeight: 160,
    backgroundColor: KawaiiColors.white,
    borderRadius: 80,
    borderWidth: 4,
    borderColor: KawaiiColors.kawaiiPink,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  falseAlarmText: {
    fontSize: 18,
    fontWeight: '900',
    color: KawaiiColors.text,
    textAlign: 'center',
  },
});
