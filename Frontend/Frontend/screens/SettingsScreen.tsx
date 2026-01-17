import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { AnimatedBackground } from '@/components/layout/AnimatedBackground';
import { IconPickerModal } from '@/components/modals/IconPickerModal';
import { KawaiiColors } from '@/constants/kawaii-theme';
import { useResponsive } from '@/utils/responsive';
import { getUserIconSource } from '@/utils/userIcons';

interface SettingsScreenProps {
  guardians: string[];
  onBack: () => void;
  onRemoveGuardian: (username: string) => void;
  onResetApp: () => void;
  onLogout: () => void;
  userEmail: string | null;
  userUsername: string | null;
  userAge: number | null;
  userDeathCount: number;
  userIcon: string | null;
  onUpdateIcon: (icon: string) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  guardians,
  onBack,
  onRemoveGuardian,
  onResetApp,
  onLogout,
  userEmail,
  userUsername,
  userAge,
  userDeathCount,
  userIcon,
  onUpdateIcon,
}) => {
  const responsive = useResponsive();
  const [showIconPicker, setShowIconPicker] = useState(false);

  return (
    <AnimatedBackground variant="gradient">
      <View style={[styles.settingsContainer, { padding: responsive.spacing }]}>
        {/* Header */}
        <View style={styles.settingsHeader}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <View style={styles.settingsHeaderCenter}>
            <Text style={styles.settingsTitle}>Settings</Text>
          </View>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView 
          style={styles.settingsScroll} 
          contentContainerStyle={styles.settingsScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Guardians Section */}
          <View style={styles.settingsSection}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Your Guardians</Text>
            </View>
            
            {guardians.length === 0 ? (
              <View style={styles.emptyGuardians}>
                <Text style={styles.emptyText}>No guardians added yet</Text>
              </View>
            ) : (
              guardians.map((guardian, index) => (
                <View key={guardian} style={styles.guardianItem}>
                  <View style={styles.guardianInfo}>
                    <Text style={styles.guardianEmoji}>👤</Text>
                    <Text style={styles.guardianName}>@{guardian}</Text>
                    {index === 0 && <Text style={styles.primaryBadge}>Primary</Text>}
                  </View>
                  <TouchableOpacity 
                    onPress={() => {
                      Alert.alert(
                        'Remove Guardian',
                        `Remove @${guardian}?`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Remove', style: 'destructive', onPress: () => onRemoveGuardian(guardian) }
                        ]
                      );
                    }}
                    style={styles.removeButton}
                  >
                    <Image 
                      source={require('@/assets/images/bin.png')} 
                      style={styles.removeButtonIcon}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>

          {/* User Profile Section */}
          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>Your Profile</Text>
            <View style={styles.userIconContainer}>
              <Image 
                source={getUserIconSource(userIcon)}
                style={styles.userIconImage}
              />
            </View>
            
            {/* Change Icon Button */}
            <TouchableOpacity 
              style={styles.changeIconButton}
              onPress={() => setShowIconPicker(true)}
            >
              <Text style={styles.changeIconButtonText}>Change Icon</Text>
            </TouchableOpacity>
            
            {userEmail && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{userEmail}</Text>
              </View>
            )}
            {userUsername && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Username</Text>
                <Text style={styles.infoValue}>@{userUsername}</Text>
              </View>
            )}
            {userAge && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Age</Text>
                <Text style={styles.infoValue}>{userAge}</Text>
              </View>
            )}
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Total Deaths</Text>
              <Text style={styles.infoValue}>{userDeathCount}</Text>
            </View>
          </View>

          {/* App Info Section */}
          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>App Info</Text>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Version</Text>
              <Text style={styles.infoValue}>4.2.0</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Breathe Timer</Text>
              <Text style={styles.infoValue}>10 seconds</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Alert Timer</Text>
              <Text style={styles.infoValue}>60 seconds</Text>
            </View>
          </View>

          {/* Reset Section */}
          <View style={styles.settingsSection}>
            <TouchableOpacity 
              style={styles.dangerButton}
              onPress={() => {
                Alert.alert(
                  'Reset App',
                  'This will remove all guardians and reset the app. Are you sure?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Reset', style: 'destructive', onPress: onResetApp }
                  ]
                );
              }}
            >
              <Text style={styles.dangerButtonText}>Reset All Data</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.dangerButton, { marginTop: 16, backgroundColor: KawaiiColors.hotPink }]}
              onPress={() => {
                Alert.alert(
                  'Sign Out',
                  'Are you sure you want to sign out?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Sign Out', style: 'destructive', onPress: onLogout }
                  ]
                );
              }}
            >
              <Text style={styles.singOutButtonText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
      
      <IconPickerModal
        visible={showIconPicker}
        onClose={() => setShowIconPicker(false)}
        onSelectIcon={onUpdateIcon}
        currentIcon={userIcon}
      />
    </AnimatedBackground>
  );
};

const styles = StyleSheet.create({
  settingsContainer: {
    flex: 1,
    paddingTop: 60,
  },
  settingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 30,
    fontWeight: '600',
    color: KawaiiColors.hotPink,
  },
  settingsHeaderCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'center',
    marginLeft: 20,
  },
  settingsTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: KawaiiColors.hotPink,
  },
  settingsScroll: {
    flex: 1,
  },
  settingsScrollContent: {
    paddingBottom: 120,
  },
  settingsSection: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: KawaiiColors.softPink,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: KawaiiColors.hotPink,
  },
  emptyGuardians: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: KawaiiColors.textLight,
  },
  guardianItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: KawaiiColors.softPink,
  },
  guardianInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  guardianEmoji: {
    fontSize: 20,
  },
  guardianName: {
    fontSize: 16,
    fontWeight: '600',
    color: KawaiiColors.text,
  },
  primaryBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: KawaiiColors.white,
    backgroundColor: KawaiiColors.hotPink,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  removeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFE4E1',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: KawaiiColors.dangerPink,
  },
  removeButtonIcon: {
    width: 20,
    height: 20,
  },
  userIconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  userIconImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: KawaiiColors.hotPink,
  },
  changeIconButton: {
    backgroundColor: KawaiiColors.softPink,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: KawaiiColors.hotPink,
  },
  changeIconButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: KawaiiColors.hotPink,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: KawaiiColors.softPink,
  },
  infoLabel: {
    fontSize: 14,
    color: KawaiiColors.text,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: KawaiiColors.hotPink,
  },
  dangerButton: {
    backgroundColor: '#FFE4E1',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: KawaiiColors.dangerPink,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: KawaiiColors.dangerPink,
  },
  singOutButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFE4E1',
  },
});
