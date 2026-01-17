import React from 'react';
import { View, StyleSheet, Text, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { AnimatedBackground } from '@/components/layout/AnimatedBackground';
import { BottomNavbar } from '@/components/layout/BottomNavbar';
import { AddGuardianModal } from '@/components/modals/AddGuardianModal';
import { BreatheButton } from '@/components/buttons/BreatheButton';
import { KawaiiColors } from '@/constants/kawaii-theme';
import { useResponsive } from '@/utils/responsive';
import { getUserIconSource } from '@/utils/userIcons';
import { BREATHE_TIMER } from '@/utils/constants';
import { AppStatus } from '@/utils/constants';

interface MonitoringScreenProps {
  timer: number;
  displayUsername: string | null;
  userIcon: string | null;
  supportMessage: string;
  loading: boolean;
  onBreathe: () => void;
  onAddGuardian: (username: string) => void;
  onSettings: () => void;
  showAddModal: boolean;
  onShowAddModal: (show: boolean) => void;
}

export const MonitoringScreen: React.FC<MonitoringScreenProps> = ({
  timer,
  displayUsername,
  userIcon,
  supportMessage,
  loading,
  onBreathe,
  onAddGuardian,
  onSettings,
  showAddModal,
  onShowAddModal,
}) => {
  const router = useRouter();
  const responsive = useResponsive();

  return (
    <AnimatedBackground variant="dots">
      <View style={styles.monitoringContainer}>
        <View style={[styles.header, { paddingTop: responsive.headerPadding }]}>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={[styles.statusText, { fontSize: responsive.isSmall ? 8 : 10 }]}>SAFE & HAPPY</Text>
          </View>
          {displayUsername && (
            <View style={styles.guardianCount}>
              <Image
                source={getUserIconSource(userIcon)}
                style={styles.guardianCountIcon}
              />
              <Text style={styles.guardianCountText}>@{displayUsername}</Text>
            </View>
          )}
        </View>

        <View style={styles.mainContent}>
          <BreatheButton
            onPress={onBreathe}
            supportMessage={supportMessage}
            isLoading={loading}
            size={responsive.buttonSize}
          />

          <View style={[styles.timerCard, { padding: responsive.isSmall ? 16 : 20 }]}>
            <View style={styles.timerHeader}>
              <Text style={[styles.timerLabel, { fontSize: responsive.isSmall ? 9 : 10 }]}>Safe Circle Alert</Text>
            </View>
            <View style={styles.timerCenter}>
              <Text style={[styles.timerValue, { fontSize: responsive.isSmall ? 32 : 40 }]}>{timer}s</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${(timer / BREATHE_TIMER) * 100}%` }]} />
            </View>
          </View>
        </View>

        <BottomNavbar 
          onAddGuardian={() => onShowAddModal(true)} 
          onSettings={onSettings}
          onFriends={() => router.push('/friends')}
          onLeaderboard={() => router.push('/leaderboard')}
          isShort={responsive.isShort}
        />
      </View>
      <AddGuardianModal 
        visible={showAddModal} 
        onClose={() => onShowAddModal(false)} 
        onAdd={onAddGuardian} 
      />
    </AnimatedBackground>
  );
};

const styles = StyleSheet.create({
  monitoringContainer: {
    flex: 1,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: KawaiiColors.primaryPink,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: KawaiiColors.primaryPink,
    marginRight: 8,
  },
  statusText: {
    fontWeight: '700',
    color: KawaiiColors.primaryPink,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  guardianCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  guardianCountText: {
    fontSize: 14,
    fontWeight: '700',
    color: KawaiiColors.hotPink,
  },
  guardianCountIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: KawaiiColors.hotPink,
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  timerCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 32,
    borderWidth: 4,
    borderColor: KawaiiColors.softPink,
  },
  timerHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  timerLabel: {
    fontWeight: '700',
    color: KawaiiColors.dangerPink,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  timerCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  timerValue: {
    fontWeight: '700',
    color: KawaiiColors.dangerPink,
    fontVariant: ['tabular-nums'],
  },
  progressBar: {
    height: 16,
    backgroundColor: `${KawaiiColors.softPink}50`,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: KawaiiColors.softPink,
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: KawaiiColors.dangerPink,
    borderRadius: 8,
  },
});
