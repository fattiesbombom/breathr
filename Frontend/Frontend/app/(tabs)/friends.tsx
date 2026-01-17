import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SUPABASE_API_URL } from '@/config';
import { KawaiiColors, KawaiiShadows } from '@/constants/kawaii-theme';

type FriendUser = {
  id: string;
  username: string | null;
  display_name?: string | null;
  email?: string | null;
  guardian_username?: string | null;
  death_count?: number | null;
  user_icon?: string | null;
  status?: 'pending' | 'accepted' | 'rejected';
};

type FriendRequest = {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: string;
  requester?: FriendUser;
};

// Helper function to get user icon source
const getUserIconSource = (iconFilename: string | null) => {
  const defaultIcon = require('@/assets/user icons/Screenshot 2026-01-16 at 10.39.44ΓÇ»PM.png');
  if (!iconFilename) return defaultIcon;

  // Normalize filename for matching (handle encoding issues)
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

  // Try exact match first
  if (iconMap[iconFilename]) {
    return iconMap[iconFilename];
  }

  // Try normalized match
  if (iconMap[normalizedIconFilename]) {
    return iconMap[normalizedIconFilename];
  }

  // Try matching by filename part (handle encoding variations)
  const filenamePart = iconFilename.split('/').pop() || iconFilename;
  for (const [key, value] of Object.entries(iconMap)) {
    if (key.includes(filenamePart) || filenamePart.includes(key)) {
      console.log(`🔄 Matched icon by partial filename: ${iconFilename} -> ${key}`);
      return value;
    }
  }

  console.warn(`⚠️ Icon not found for: ${iconFilename}, using default`);
  return defaultIcon;
};

export default function FriendsScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FriendUser[]>([]);
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [searching, setSearching] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const getAccessToken = async () => {
    const session = await AsyncStorage.getItem('auth_session');
    if (!session) return null;
    const parsed = JSON.parse(session);
    return parsed?.access_token || null;
  };

  const loadFriends = async () => {
    try {
      const token = await getAccessToken();
      if (!token) return;
      
      // Load friends
      const friendsResponse = await fetch(`${SUPABASE_API_URL}/friends/accepted`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const friendsData = await friendsResponse.json();
      
      // Load current user profile
      const meResponse = await fetch(`${SUPABASE_API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const meData = await meResponse.json();
      
      if (friendsResponse.ok && meResponse.ok) {
        const friendsList = friendsData.friends || [];
        const currentUser = meData.user;
        
        if (currentUser) {
          setCurrentUserId(currentUser.id);
          
          // Combine friends with current user, remove duplicates
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

          // Debug: Log icon values
          console.log('👤 Current user icon:', currentUser.user_icon);
          console.log('📋 All users icons:', allUsers.map(u => ({ id: u.id, icon: u.user_icon })));
          
          // Sort by death_count descending (highest first)
          const sortedUsers = allUsers.sort((a, b) => (b.death_count || 0) - (a.death_count || 0));
          setFriends(sortedUsers);
        } else {
          setFriends(friendsList);
        }
      }
    } catch (e) {
      console.log('Failed to load friends:', e);
    } finally {
      setLoadingFriends(false);
    }
  };

  const loadRequests = async () => {
    try {
      const token = await getAccessToken();
      if (!token) return;
      const response = await fetch(`${SUPABASE_API_URL}/friends/requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setRequests(data.requests || []);
      }
    } catch (e) {
      console.log('Failed to load requests:', e);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleSearch = async () => {
    const trimmed = query.trim();
    if (trimmed.length < 1) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const token = await getAccessToken();
      if (!token) return;
      const response = await fetch(`${SUPABASE_API_URL}/profiles/search?query=${encodeURIComponent(trimmed)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setSearchResults(data.users || []);
      }
    } catch (e) {
      console.log('Search failed:', e);
    } finally {
      setSearching(false);
    }
  };

  const handleAddFriend = async (receiverId: string, receiverEmail?: string | null) => {
    try {
      const token = await getAccessToken();
      if (!token) return;
      const response = await fetch(`${SUPABASE_API_URL}/friends/request`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ receiver_id: receiverId, receiver_email: receiverEmail || null }),
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert('Sent! 💌', 'Friend request sent.');
        setSearchResults((prev) =>
          prev.map((user) => (user.id === receiverId ? { ...user, status: 'pending' } : user))
        );
        loadRequests();
      } else {
        Alert.alert('Oops 💕', data.error || 'Could not send request');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to send friend request');
    }
  };

  useEffect(() => {
    loadFriends();
    loadRequests();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      loadFriends();
      loadRequests();
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFriends();
      loadRequests();
    }, [])
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      handleSearch();
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const handleRespond = async (requesterId: string, action: 'accept' | 'reject') => {
    try {
      const token = await getAccessToken();
      if (!token) return;
      const response = await fetch(`${SUPABASE_API_URL}/friends/respond`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requester_id: requesterId, action }),
      });
      const data = await response.json();
      if (response.ok) {
        if (action === 'accept') {
          loadFriends();
        }
        loadRequests();
      } else {
        Alert.alert('Oops 💕', data.error || 'Could not update request');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to update request');
    }
  };

  const renderFriendItem = ({ item, index }: { item: FriendUser; index: number }) => {
    const displayName = item.username || item.display_name || item.guardian_username || (item.email ? item.email.split('@')[0] : 'friend');
    const isCurrentUser = item.id === currentUserId;
    const rank = index + 1;
    
    return (
      <View style={[styles.friendRow, isCurrentUser && styles.currentUserRow]}>
        <View style={styles.friendLeft}>
          <View style={styles.rankContainer}>
            <Text style={[styles.rankNumber, isCurrentUser && styles.currentUserRank]}>#{rank}</Text>
          </View>
          <Image source={getUserIconSource(item.user_icon || null)} style={styles.friendAvatar} />
          <Text style={[styles.friendName, isCurrentUser && styles.currentUserName]}>
            {isCurrentUser ? '⭐ ' : ''}@{displayName}
          </Text>
        </View>
        <View style={[styles.deathBadge, isCurrentUser && styles.currentUserBadge]}>
          <Text style={styles.deathText}>{item.death_count || 0}</Text>
        </View>
      </View>
    );
  };

  const renderSearchItem = ({ item }: { item: FriendUser }) => {
    const displayName = item.display_name || item.username || item.guardian_username || (item.email ? item.email.split('@')[0] : 'user');
    const isRequested = item.status === 'pending';
    return (
      <View style={styles.searchRow}>
        <View style={styles.friendLeft}>
          <Image source={getUserIconSource(item.user_icon || null)} style={styles.searchAvatar} />
          <Text style={styles.searchName}>@{displayName}</Text>
        </View>
        <TouchableOpacity
          style={[styles.addFriendButton, isRequested && styles.requestedButton]}
          onPress={() => handleAddFriend(item.id, item.email)}
          disabled={isRequested}
        >
          <Text style={styles.addFriendText}>{isRequested ? 'Requested' : 'Request'}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderRequestItem = ({ item }: { item: FriendRequest }) => {
    const requester = item.requester;
    const displayName = requester?.display_name || requester?.username || (requester?.email ? requester.email.split('@')[0] : 'user');
    return (
      <View style={styles.requestRow}>
        <View style={styles.friendLeft}>
          <Image source={getUserIconSource(requester?.user_icon || null)} style={styles.searchAvatar} />
          <Text style={styles.searchName}>@{displayName}</Text>
        </View>
        <View style={styles.requestButtons}>
          <TouchableOpacity style={styles.acceptButton} onPress={() => handleRespond(item.requester_id, 'accept')}>
            <Text style={styles.requestButtonText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.rejectButton} onPress={() => handleRespond(item.requester_id, 'reject')}>
            <Text style={styles.requestButtonTextDark}>Reject</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Friends</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.searchSection}>
        <Text style={styles.sectionTitle}>Add Friends</Text>
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by display name"
            placeholderTextColor={KawaiiColors.textLight}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        </View>
        {searching ? (
          <ActivityIndicator size="small" color={KawaiiColors.hotPink} />
        ) : (
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            renderItem={renderSearchItem}
            contentContainerStyle={styles.searchResults}
            ListEmptyComponent={<Text style={styles.emptyText}>No results yet</Text>}
          />
        )}
      </View>

      <View style={styles.requestsSection}>
        <Text style={styles.sectionTitle}>Friend Requests</Text>
        {loadingRequests ? (
          <ActivityIndicator size="small" color={KawaiiColors.hotPink} />
        ) : (
          <FlatList
            data={requests}
            keyExtractor={(item) => item.id}
            renderItem={renderRequestItem}
            contentContainerStyle={styles.leaderboardList}
            ListEmptyComponent={<Text style={styles.emptyText}>No requests yet</Text>}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF0F5', paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 16 },
  backButton: { padding: 8 },
  backText: { color: KawaiiColors.hotPink, fontWeight: '700' , fontSize: 30},
  title: { fontSize: 22, fontWeight: '800', color: KawaiiColors.hotPink, marginTop: 10 },
  headerSpacer: { width: 60 },

  searchSection: { paddingHorizontal: 20, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: KawaiiColors.text, marginBottom: 10 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: KawaiiColors.white, borderRadius: 18, paddingHorizontal: 12, borderWidth: 2, borderColor: KawaiiColors.softPink },
  searchInput: { flex: 1, paddingVertical: 10, color: KawaiiColors.text },
  searchButton: { backgroundColor: KawaiiColors.hotPink, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  searchButtonText: { color: KawaiiColors.white, fontWeight: '700', fontSize: 12 },
  searchResults: { paddingVertical: 10 },
  searchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 16, padding: 12, marginBottom: 10, borderWidth: 2, borderColor: KawaiiColors.softPink },
  searchAvatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: KawaiiColors.hotPink },
  searchName: { fontSize: 14, fontWeight: '700', color: KawaiiColors.text },
  addFriendButton: { backgroundColor: KawaiiColors.kawaiiPink, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14 },
  requestedButton: { backgroundColor: '#F7B6C8' },
  addFriendText: { color: KawaiiColors.white, fontWeight: '700' },

  leaderboardList: { paddingBottom: 40 },
  requestsSection: { paddingHorizontal: 20, marginBottom: 12 },
  requestRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 16, padding: 12, marginBottom: 10, borderWidth: 2, borderColor: KawaiiColors.softPink },
  requestButtons: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  acceptButton: { backgroundColor: KawaiiColors.hotPink, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  rejectButton: { backgroundColor: '#FFD6E5', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 2, borderColor: KawaiiColors.hotPink },
  requestButtonText: { color: KawaiiColors.white, fontWeight: '700', fontSize: 12 },
  requestButtonTextDark: { color: KawaiiColors.hotPink, fontWeight: '700', fontSize: 12 },
  friendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 18, padding: 14, marginBottom: 12, borderWidth: 2, borderColor: KawaiiColors.softPink, ...KawaiiShadows.card },
  currentUserRow: { backgroundColor: '#FFF0F8', borderWidth: 3, borderColor: KawaiiColors.hotPink },
  friendLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  rankContainer: { minWidth: 35, alignItems: 'center' },
  rankNumber: { fontSize: 16, fontWeight: '900', color: KawaiiColors.hotPink },
  currentUserRank: { fontSize: 18, color: KawaiiColors.hotPink },
  friendAvatar: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderColor: KawaiiColors.hotPink },
  friendName: { fontSize: 15, fontWeight: '800', color: KawaiiColors.text, flex: 1 },
  currentUserName: { color: KawaiiColors.hotPink, fontSize: 16 },
  deathBadge: { backgroundColor: '#FFE3EE', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, borderWidth: 2, borderColor: KawaiiColors.hotPink },
  currentUserBadge: { backgroundColor: '#FFD6E5', borderWidth: 3 },
  deathText: { color: KawaiiColors.hotPink, fontWeight: '800' },
  emptyText: { textAlign: 'center', color: KawaiiColors.textLight, marginTop: 8 },
});
