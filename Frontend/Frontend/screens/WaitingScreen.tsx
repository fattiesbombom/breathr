import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { AnimatedBackground } from '@/components/layout/AnimatedBackground';
import { BottomNavbar } from '@/components/layout/BottomNavbar';
import { AddGuardianModal } from '@/components/modals/AddGuardianModal';
import { KawaiiColors } from '@/constants/kawaii-theme';
import { useResponsive } from '@/utils/responsive';
import { AppStatus } from '@/utils/constants';

interface WaitingScreenProps {
  guardians: string[];
  connectedGuardians: string[];
  onAddGuardian: (username: string) => void;
  onResendInvite: (username: string) => void;
  onSettings: () => void;
  showAddModal: boolean;
  onShowAddModal: (show: boolean) => void;
}

export const WaitingScreen: React.FC<WaitingScreenProps> = ({
  guardians,
  connectedGuardians,
  onAddGuardian,
  onResendInvite,
  onSettings,
  showAddModal,
  onShowAddModal,
}) => {
  const router = useRouter();
  const responsive = useResponsive();

  return (
    <AnimatedBackground variant="gradient">
      <View style={[styles.waitingContainer, { padding: responsive.spacing }]}>
        <Text style={[styles.waitingEmoji, { fontSize: responsive.emojiSize }]}>🌱</Text>
        <Text style={[styles.waitingTitle, { fontSize: responsive.titleSize - 4 }]}>Waiting for Guardians</Text>
        
        <View style={styles.guardiansList}>
          {guardians.map(g => (
            <View key={g} style={styles.waitingGuardianItem}>
              <Text style={styles.waitingGuardianText}>@{g}</Text>
              <TouchableOpacity onPress={() => onResendInvite(g)}>
                <Text style={styles.resendText}>📤 Resend</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
        
        <TouchableOpacity style={styles.addMoreButton} onPress={() => onShowAddModal(true)}>
          <Text style={styles.addMoreText}>+ Add Another Guardian</Text>
        </TouchableOpacity>
      </View>

      <BottomNavbar 
        onAddGuardian={() => onShowAddModal(true)} 
        onSettings={onSettings}
        onFriends={() => router.push('/friends')}
        isShort={responsive.isShort}
      />
      <AddGuardianModal 
        visible={showAddModal} 
        onClose={() => onShowAddModal(false)} 
        onAdd={onAddGuardian} 
      />
    </AnimatedBackground>
  );
};

const styles = StyleSheet.create({
  waitingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  waitingEmoji: {
    marginBottom: 20,
  },
  waitingTitle: {
    fontWeight: '700',
    color: KawaiiColors.hotPink,
    marginBottom: 20,
  },
  guardiansList: {
    width: '100%',
    maxWidth: 300,
  },
  waitingGuardianItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: KawaiiColors.kawaiiPink,
  },
  waitingGuardianText: {
    fontSize: 16,
    fontWeight: '600',
    color: KawaiiColors.text,
  },
  resendText: {
    fontSize: 14,
    color: KawaiiColors.hotPink,
    fontWeight: '600',
  },
  addMoreButton: {
    marginTop: 20,
    padding: 16,
  },
  addMoreText: {
    fontSize: 16,
    color: KawaiiColors.hotPink,
    fontWeight: '600',
  },
});
