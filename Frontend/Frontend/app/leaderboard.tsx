import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { SUPABASE_API_URL, API_BASE_URL } from '@/config';
import { KawaiiColors } from '@/constants/kawaii-theme';

type FriendUser = {
  id: string;
  username: string | null;
  display_name?: string | null;
  email?: string | null;
  death_count?: number | null;
  user_icon?: string | null;
  guardian_username?: string | null;
};

// Helper function to get user icon source (same as in friends.tsx)
const getUserIconSource = (iconFilename: string | null) => {
  const defaultIcon = require('@/assets/user icons/Screenshot 2026-01-16 at 10.39.44ΓÇ»PM.png');
  if (!iconFilename) return defaultIcon;

  const normalizeFilename = (filename: string) => {
    return filename.trim().replace(/\s+/g, ' ');
  };

  const normalizedIconFilename = normalizeFilename(iconFilename);

  const iconMap: { [key: string]: any } = {
    'Screenshot 2026-01-16 at 10.39.44ΓÇ»PM.png': require('@/assets/user icons/Screenshot 2026-01-16 at 10.39.44ΓÇ»PM.png'),
    'Screenshot 2026-01-16 at 10.39.51ΓÇ»PM.png': require('@/assets/user icons/Screenshot 2026-01-16 at 10.39.51ΓÇ»PM.png'),
    'Screenshot 2026-01-16 at 10.40.00ΓÇ»PM.png': require('@/assets/user icons/Screenshot 2026-01-16 at 10.40.00ΓÇ»PM.png'),
    'Screenshot 2026-01-16 at 10.40.19ΓÇ»PM.png': require('@/assets/user icons/Screenshot 2026-01-16 at 10.40.19ΓÇ»PM.png'),
    'Screenshot 2026-01-16 at 10.40.26ΓÇ»PM.png': require('@/assets/user icons/Screenshot 2026-01-16 at 10.40.26ΓÇ»PM.png'),
    'Screenshot 2026-01-16 at 10.40.41ΓÇ»PM.png': require('@/assets/user icons/Screenshot 2026-01-16 at 10.40.41ΓÇ»PM.png'),
    'Screenshot 2026-01-16 at 10.41.02ΓÇ»PM.png': require('@/assets/user icons/Screenshot 2026-01-16 at 10.41.02ΓÇ»PM.png'),
    'Screenshot 2026-01-16 at 10.41.09ΓÇ»PM.png': require('@/assets/user icons/Screenshot 2026-01-16 at 10.41.09ΓÇ»PM.png'),
    'Screenshot 2026-01-16 at 10.41.17ΓÇ»PM.png': require('@/assets/user icons/Screenshot 2026-01-16 at 10.41.17ΓÇ»PM.png'),
    'Screenshot 2026-01-16 at 10.41.54ΓÇ»PM.png': require('@/assets/user icons/Screenshot 2026-01-16 at 10.41.54ΓÇ»PM.png'),
  };

  if (iconMap[iconFilename]) return iconMap[iconFilename];
  if (iconMap[normalizedIconFilename]) return iconMap[normalizedIconFilename];

  const filenamePart = iconFilename.split('/').pop() || iconFilename;
  for (const [key, value] of Object.entries(iconMap)) {
    if (key.includes(filenamePart) || filenamePart.includes(key)) {
      return value;
    }
  }

  return defaultIcon;
};

export default function LeaderboardScreen() {
  const router = useRouter();
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);

  const getAccessToken = async () => {
    const session = await AsyncStorage.getItem('auth_session');
    if (!session) return null;
    const parsed = JSON.parse(session);
    return parsed?.access_token || null;
  };

  const loadLeaderboard = async () => {
    try {
      const token = await getAccessToken();
      if (!token) return;
      
      const friendsResponse = await fetch(`${SUPABASE_API_URL}/friends/accepted`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const friendsData = await friendsResponse.json();
      
      const meResponse = await fetch(`${SUPABASE_API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const meData = await meResponse.json();
      
      if (friendsResponse.ok && meResponse.ok) {
        const friendsList = friendsData.friends || [];
        const currentUser = meData.user;
        
        if (currentUser) {
          setCurrentUserId(currentUser.id);
          setCurrentUsername(currentUser.username || currentUser.display_name || null);
          
          const allUsers = [
            ...friendsList.filter((f: FriendUser) => f.id !== currentUser.id),
            {
              id: currentUser.id,
              username: currentUser.username,
              display_name: currentUser.display_name,
              email: currentUser.email,
              death_count: currentUser.death_count || 0,
              user_icon: currentUser.user_icon,
            }
          ];
          
          const sortedUsers = allUsers.sort((a, b) => (b.death_count || 0) - (a.death_count || 0));
          setFriends(sortedUsers);
          
          // Find current user rank
          const rank = sortedUsers.findIndex(u => u.id === currentUser.id) + 1;
          setCurrentUserRank(rank);
        } else {
          setFriends(friendsList);
        }
      }
    } catch (e) {
      console.log('Failed to load leaderboard:', e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadLeaderboard();
    }, [])
  );

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const handleGrieve = async (targetUser: FriendUser) => {
    if (!targetUser.guardian_username) {
      console.log('⚠️ No guardian username for user:', targetUser.username);
      return;
    }

    try {
      const grievingUsername = currentUsername || 'Someone';
      const message = `${grievingUsername} is grieving for you 💀`;
      
      const response = await fetch(`${API_BASE_URL}/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          target_username: targetUser.guardian_username, 
          message 
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        console.log('✅ Grieve notification sent to:', targetUser.guardian_username);
      } else {
        console.log('❌ Failed to send grieve notification:', data.error);
      }
    } catch (error) {
      console.log('❌ Error sending grieve notification:', error);
    }
  };

  const top3 = friends.slice(0, 3);
  const rest = friends.slice(3);

  const getTombstoneHeight = (rank: number) => {
    if (rank === 1) return 265;
    if (rank === 2) return 220;
    return 205;
  };

  const getTombstoneBg = (rank: number) => {
    if (rank === 1) return '#F0F0F0'; // ghost-white
    return '#DED2EB'; // lavender
  };

  const renderTombstone = (user: FriendUser | null, rank: number, isEmpty: boolean = false) => {
    if (isEmpty || !user) {
      // Placeholder tombstone
      return (
        <View key={`placeholder-${rank}`} style={[styles.tombstoneContainer, { width: rank === 1 ? '34%' : '30%' }]}>
          <View style={[
            styles.tombstone,
            {
              height: getTombstoneHeight(rank),
              backgroundColor: getTombstoneBg(rank),
              opacity: 0.3,
            }
          ]}>
            <Text style={[styles.rankText, { opacity: 0.5 }]}>#{rank}</Text>
            <Text style={[styles.ripText, { opacity: 0.5 }]}>RIP</Text>
            
            <View style={[styles.tombstoneAvatar, { opacity: 0.3 }]}>
              <View style={{ width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 999 }} />
            </View>
            
            <Text style={[styles.tombstoneName, { color: rank === 1 ? '#221019' : '#4a355a', opacity: 0.5 }]}>
              ---
            </Text>
            <Text style={[styles.tombstoneDeaths, { color: rank === 1 ? '#221019' : '#4a355a', opacity: 0.5 }]}>
              Deaths: 0
            </Text>
          </View>
        </View>
      );
    }

    const displayName = user.username || user.display_name || (user.email ? user.email.split('@')[0] : 'user');
    const isCurrentUser = user.id === currentUserId;
    
    return (
      <View key={user.id} style={[styles.tombstoneContainer, { width: rank === 1 ? '34%' : '30%' }]}>
        <View style={[
          styles.tombstone,
          {
            height: getTombstoneHeight(rank),
            backgroundColor: getTombstoneBg(rank),
          }
        ]}>
          <Text style={styles.rankText}>#{rank}</Text>
          <Text style={styles.ripText}>RIP</Text>
          
          <View style={styles.tombstoneAvatar}>
            <Image 
              source={getUserIconSource(user.user_icon || null)}
              style={[styles.tombstoneImage, { opacity: 0.8 }]}
            />
          </View>
          
          <Text style={[styles.tombstoneName, { color: rank === 1 ? '#221019' : '#4a355a' }]}>
            {displayName}
          </Text>
          <Text style={[styles.tombstoneDeaths, { color: rank === 1 ? '#221019' : '#4a355a' }]}>
            Deaths: {user.death_count || 0}
          </Text>
          
          <TouchableOpacity 
            style={[styles.grieveButton, { backgroundColor: rank === 1 ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.5)' }]}
            onPress={() => handleGrieve(user)}
          >
            <Text style={[styles.grieveButtonText, { color: rank === 1 ? '#221019' : '#4a355a' }]}>
              Grieve
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const currentUser = friends.find(u => u.id === currentUserId);
  const currentUserRankIndex = currentUserRank ? currentUserRank - 1 : null;

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={KawaiiColors.hotPink} />
          <Text style={styles.loadingText}>Loading leaderboard...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.leaderboardText}>Loserboard</Text>
        <View style={styles.topBarSpacer} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>The Fallen Breathren</Text>
        </View>

        {/* Top 3 Podium - Reordered: 3rd on left, 1st in middle, 2nd on right */}
        <View style={styles.podiumContainer}>
          <View style={styles.podiumRow}>
            {[
              { rank: 3, userIndex: 2 }, // 3rd place on left
              { rank: 1, userIndex: 0 }, // 1st place in middle
              { rank: 2, userIndex: 1 }, // 2nd place on right
            ].map(({ rank, userIndex }) => {
              const user = top3[userIndex] || null;
              return renderTombstone(user, rank, !user);
            })}
          </View>
        </View>

        {/* Current User Rank (sticky-like) */}
        {currentUser && currentUserRank && currentUserRank > 3 && (
          <View style={styles.currentUserCard}>
            <View style={styles.currentUserLeft}>
              <View style={styles.currentUserRankBadge}>
                <Text style={styles.currentUserRankText}>{currentUserRank}</Text>
              </View>
              <Image 
                source={getUserIconSource(currentUser.user_icon || null)}
                style={styles.currentUserAvatar}
              />
              <View style={styles.currentUserInfo}>
                <Text style={styles.currentUserName}>Your Rank</Text>
                <Text style={styles.currentUserDeaths}>Deaths: {currentUser.death_count || 0}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.viewButton}>
              <Text style={styles.viewButtonText}>View</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Rest of Leaderboard */}
        <View style={styles.listContainer}>
          {rest.map((user, index) => {
            const rank = index + 4;
            const displayName = user.username || user.display_name || (user.email ? user.email.split('@')[0] : 'user');
            const isCurrentUser = user.id === currentUserId;
            
            return (
              <View 
                key={user.id} 
                style={[
                  styles.leaderboardRow,
                  isCurrentUser && styles.currentUserRow
                ]}
              >
                <View style={styles.rowLeft}>
                  <Text style={styles.rowRank}>#{rank}</Text>
                  <Image 
                    source={getUserIconSource(user.user_icon || null)}
                    style={styles.rowAvatar}
                  />
                  <View style={styles.rowInfo}>
                    <Text style={styles.rowName}>{displayName}</Text>
                    <Text style={styles.rowDeaths}>Deaths: {user.death_count || 0}</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.grieveRowButton}
                  onPress={() => handleGrieve(user)}
                >
                  <Text style={styles.grieveRowButtonText}>Grieve</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {friends.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No friends yet</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#221019',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 60,
    backgroundColor: 'rgba(34, 16, 25, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245, 138, 191, 0.1)',
  },
  backButton: {
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backIcon: {
    fontSize: 40,
    color: KawaiiColors.hotPink,
  },
  leaderboardText: {
    fontSize: 20,
    fontWeight: '700',
    color: KawaiiColors.hotPink,
    flex: 1,
    textAlign: 'center',
    // marginLeft: 8,
    // marginTop: 10,
  },
  topBarSpacer: {
    width: 40, // Same width as back button to center the text
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#FFF',
    fontSize: 14,
  },
  titleContainer: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -0.5,
  },
  podiumContainer: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  podiumRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 16,
  },
  tombstoneContainer: {
    alignItems: 'center',
    minWidth: 110,
  },
  tombstone: {
    width: '100%',
    borderRadius: 9999,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    borderBottomWidth: 4,
    borderBottomColor: 'rgba(0, 0, 0, 0.2)',
    alignItems: 'center',
    paddingTop: 16,
    paddingHorizontal: 16,
    shadowColor: KawaiiColors.hotPink,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 5,
  },
  rankText: {
    fontSize: 14,
    fontWeight: '900',
    color: KawaiiColors.hotPink,
  },
  ripText: {
    fontSize: 20,
    fontWeight: '800',
    color: KawaiiColors.hotPink,
    marginTop: 4,
    letterSpacing: -0.5,
  },
  tombstoneAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    overflow: 'hidden',
    backgroundColor: 'rgba(245, 138, 191, 0.2)',
    marginTop: 8,
  },
  tombstoneImage: {
    width: '100%',
    height: '100%',
  },
  tombstoneName: {
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 8,
  },
  tombstoneDeaths: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  grieveButton: {
    marginTop: 'auto',
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 9999,
    borderWidth: 1,
  },
  grieveButtonText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  currentUserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 32,
    marginBottom: 16,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 138, 191, 0.15)',
    backgroundColor: 'rgba(34, 16, 25, 0.7)',
  },
  currentUserLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  currentUserRankBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 138, 191, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 138, 191, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentUserRankText: {
    fontSize: 16,
    fontWeight: '900',
    color: KawaiiColors.hotPink,
  },
  currentUserAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  currentUserInfo: {
    flex: 1,
  },
  currentUserName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFF',
  },
  currentUserDeaths: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(245, 138, 191, 0.8)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  viewButton: {
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 9999,
    backgroundColor: 'rgba(245, 138, 191, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(245, 138, 191, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewButtonText: {
    fontSize: 10,
    fontWeight: '800',
    color: KawaiiColors.hotPink,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  listContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 138, 191, 0.1)',
    backgroundColor: 'rgba(245, 138, 191, 0.05)',
  },
  currentUserRow: {
    backgroundColor: 'rgba(245, 138, 191, 0.15)',
    borderColor: 'rgba(245, 138, 191, 0.3)',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  rowRank: {
    width: 32,
    fontSize: 18,
    fontWeight: '900',
    color: KawaiiColors.hotPink,
    textAlign: 'center',
  },
  rowAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  rowInfo: {
    flex: 1,
  },
  rowName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFF',
  },
  rowDeaths: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(245, 138, 191, 0.7)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  grieveRowButton: {
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 9999,
    backgroundColor: 'rgba(245, 138, 191, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 138, 191, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  grieveRowButtonText: {
    fontSize: 10,
    fontWeight: '800',
    color: KawaiiColors.hotPink,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
  },
});
