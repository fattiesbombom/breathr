import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { AnimatedBackground } from '@/components/layout/AnimatedBackground';
import { IconPickerModal } from '@/components/modals/IconPickerModal';
import { SUPABASE_API_URL } from '@/config';
import { KawaiiColors } from '@/constants/kawaii-theme';
import { useResponsive } from '@/utils/responsive';
import { getUserIconSource } from '@/utils/userIcons';

export default function SettingsScreen() {
  const router = useRouter();
  const responsive = useResponsive();
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [guardians, setGuardians] = useState<string[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userUsername, setUserUsername] = useState<string | null>(null);
  const [userAge, setUserAge] = useState<number | null>(null);
  const [userDeathCount, setUserDeathCount] = useState<number>(0);
  const [userIcon, setUserIcon] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getAccessToken = async () => {
    const session = await AsyncStorage.getItem('auth_session');
    if (!session) return null;
    const parsed = JSON.parse(session);
    return parsed.access_token || null;
  };

  const loadUserProfile = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) return;

    setAccessToken(token);
    try {
      const response = await fetch(`${SUPABASE_API_URL}/auth/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserId(data.user?.id || null);
        setUserEmail(data.user?.email || null);
        setUserUsername(data.user?.username || data.user?.user_metadata?.username || null);
        setUserAge(data.user?.age || null);
        setUserDeathCount(data.user?.death_count || 0);
        setUserIcon(data.user?.user_icon || null);
      }
    } catch (e) {
      console.error('Failed to load user profile:', e);
    }
  }, []);

  const loadGuardians = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) return;

    try {
      const response = await fetch(`${SUPABASE_API_URL}/auth/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const userId = data.user?.id;
        if (userId) {
          const stored = await AsyncStorage.getItem(`guardians_${userId}`);
          if (stored) {
            setGuardians(JSON.parse(stored));
          }
        }
      }
    } catch (e) {
      console.error('Failed to load guardians:', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUserProfile();
      loadGuardians();
    }, [loadUserProfile, loadGuardians])
  );

  const handleUpdateIcon = async (iconFilename: string) => {
    const token = await getAccessToken();
    if (!token) {
      Alert.alert('Error', 'You must be logged in to change your icon');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${SUPABASE_API_URL}/auth/update-icon`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_icon: iconFilename }),
      });

      const data = await response.json();

      if (response.ok) {
        const updatedIcon = data.user_icon || iconFilename;
        setUserIcon(updatedIcon);
        console.log('✅ Icon updated successfully to:', updatedIcon);
      } else {
        console.error('❌ Icon update failed:', data.error);
        Alert.alert('Error', data.error || 'Failed to update icon');
      }
    } catch (error: any) {
      console.error('❌ Update icon error:', error);
      Alert.alert('Error', error.message || 'Failed to update icon. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveGuardian = async (username: string) => {
    const token = await getAccessToken();
    if (!token || !userId) return;

    try {
      const updated = guardians.filter(g => g !== username);
      setGuardians(updated);
      await AsyncStorage.setItem(`guardians_${userId}`, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to remove guardian:', e);
    }
  };

  const handleResetApp = async () => {
    const token = await getAccessToken();
    if (!token || !userId) return;

    try {
      setGuardians([]);
      await AsyncStorage.removeItem(`guardians_${userId}`);
      Alert.alert('Success', 'App has been reset');
    } catch (e) {
      console.error('Failed to reset app:', e);
    }
  };

  const handleLogout = async () => {
    try {
      console.log('🚪 Attempting logout...');
      const token = await getAccessToken();
      if (token) {
        // Add timeout to logout request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        try {
          const response = await fetch(`${SUPABASE_API_URL}/auth/logout`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          
          if (response.ok) {
            console.log('✅ Logout successful');
          } else {
            const data = await response.json().catch(() => ({}));
            console.log('⚠️ Logout response not OK:', response.status, data);
          }
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          if (fetchError.name !== 'AbortError') {
            console.log('⚠️ Logout request error:', fetchError.message);
          }
        }
      }
    } catch (e: any) {
      console.log('⚠️ Logout error:', e.message);
    }
    
    // Always clear local storage and navigate, even if server logout fails
    try {
      await AsyncStorage.removeItem('auth_session');
      console.log('✅ Auth session cleared');
    } catch (e) {
      console.log('⚠️ Error clearing auth session:', e);
    }
    
    // Navigate back to main screen (which will show auth screen)
    // Use replace to prevent going back to settings, and use index to ensure we go to the root
    router.replace('/(tabs)/');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <AnimatedBackground variant="gradient">
      <View style={[styles.settingsContainer, { padding: responsive.spacing }]}>
        {/* Header */}
        <View style={styles.settingsHeader}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
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
                          { text: 'Remove', style: 'destructive', onPress: () => handleRemoveGuardian(guardian) }
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
                    { text: 'Reset', style: 'destructive', onPress: handleResetApp }
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
                    { text: 'Sign Out', style: 'destructive', onPress: handleLogout }
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
        onSelectIcon={handleUpdateIcon}
        currentIcon={userIcon}
      />
    </AnimatedBackground>
  );
}

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
