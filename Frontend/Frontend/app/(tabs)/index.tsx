import React, { useState, useEffect, useRef } from 'react';
import { 
  View, StyleSheet, Alert, 
  ActivityIndicator, Linking, 
  AppState, AppStateStatus,
} from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { API_BASE_URL, BOT_USERNAME, SUPABASE_API_URL } from '@/config';
import { KawaiiColors, KawaiiShadows } from '@/constants/kawaii-theme';

// Import screens
import { AuthScreen } from '@/screens/AuthScreen';
import { LoadingScreen } from '@/screens/LoadingScreen';
import { SetupScreen } from '@/screens/SetupScreen';
import { WaitingScreen } from '@/screens/WaitingScreen';
import { MonitoringScreen } from '@/screens/MonitoringScreen';
import { AlertingScreen } from '@/screens/AlertingScreen';
import { RestScreen } from '@/screens/RestScreen';

// Import components
import { AnimatedBackground } from '@/components/layout/AnimatedBackground';

// Import utilities
import { BREATHE_TIMER, ALERT_TIMER, NOTIFICATION_INTERVAL, ALERT_MESSAGES, AppStatus } from '@/utils/constants';
import { useResponsive } from '@/utils/responsive';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ============================================================================
// MAIN APP
// ============================================================================
export default function HomeScreen() {
  const router = useRouter();
  const segments = useSegments();
  const responsive = useResponsive();
  
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userUsername, setUserUsername] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userAge, setUserAge] = useState<number | null>(null);
  const [userDeathCount, setUserDeathCount] = useState<number>(0);
  const [userIcon, setUserIcon] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [guardians, setGuardians] = useState<string[]>([]);
  const [inputText, setInputText] = useState('');
  const [connectedGuardians, setConnectedGuardians] = useState<string[]>([]);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [supportMessage, setSupportMessage] = useState("Stay Safe");

  const displayUsername = userUsername || (userEmail ? userEmail.split('@')[0] : null);
  const guardiansStorageKey = userId ? `guardians_${userId}` : 'guardians';
  
  // Game state
  const [timer, setTimer] = useState(BREATHE_TIMER);
  const [alertTimer, setAlertTimer] = useState(ALERT_TIMER);
  const [status, setStatus] = useState<AppStatus>(AppStatus.SETUP);
  const [messagesSent, setMessagesSent] = useState(0);
  const messageIndexRef = useRef(0); // Use ref for immediate updates
  const [hasGuardianLink, setHasGuardianLink] = useState(false);
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Refs
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const alertTimerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const notificationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const spamMessageIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const statusRef = useRef<AppStatus>(status);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const backgroundTimeRef = useRef<number | null>(null);
  const shouldStopSpamRef = useRef(false); // Flag to stop spam immediately
  const connectedGuardiansRef = useRef<string[]>([]); // Ref for guardians to avoid stale closures
  const breatheTimerEndRef = useRef<number | null>(null); // Timestamp when breathe timer should expire
  const alertTimerEndRef = useRef<number | null>(null); // Timestamp when alert timer should expire
  const deathCountIncrementedRef = useRef(false); // Flag to ensure death count is only incremented once per death

  // ============== AUTHENTICATION FUNCTIONS ==============
  const checkAuthStatus = async () => {
    try {
      const savedSession = await AsyncStorage.getItem('auth_session');
      if (savedSession) {
        const session = JSON.parse(savedSession);
        // Verify session is still valid by checking with server (with timeout)
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
          
          const response = await fetch(`${SUPABASE_API_URL}/auth/status`, {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const data = await response.json();
            const usernameFromMetadata = data.user?.user_metadata?.username || data.user?.user_metadata?.display_name;
            const guardianFromStatus = data.guardianUsername || data.user?.guardian_username;
            setIsAuthenticated(true);
            setUserId(data.user?.id || session.user?.id || null);
            setUserEmail(data.user?.email || session.user?.email || null);
            setUserUsername(data.user?.username || usernameFromMetadata || null);
            setUserAge(data.user?.age || null);
            setUserDeathCount(data.user?.death_count || 0);
            const iconFromStatus = data.user?.user_icon || null;
            setUserIcon(iconFromStatus);
            console.log('✅ Auth status check - icon from DB:', iconFromStatus);
            setHasGuardianLink(!!guardianFromStatus);
            setAccessToken(session.access_token);
            setAuthLoading(false);
            if (guardianFromStatus) {
              const normalized = guardianFromStatus.trim();
              if (normalized) {
                await AsyncStorage.setItem(`guardians_${data.user?.id || session.user?.id}`, JSON.stringify([normalized]));
                setGuardians([normalized]);
              }
            }
            return;
          }
          if (response.status === 401) {
            await AsyncStorage.removeItem('auth_session');
          } else {
            const sessionUser = session.user || {};
            const userIdFromSession = sessionUser.id || null;
            const guardiansKey = userIdFromSession ? `guardians_${userIdFromSession}` : 'guardians';
            const savedGuardians = await AsyncStorage.getItem(guardiansKey);
            const parsedGuardians = savedGuardians ? JSON.parse(savedGuardians) : [];
            if (parsedGuardians.length > 0) {
              setGuardians(parsedGuardians);
              setHasGuardianLink(true);
            }
            setIsAuthenticated(true);
            setUserId(userIdFromSession);
            setUserEmail(sessionUser.email || null);
            setUserUsername(sessionUser.user_metadata?.username || sessionUser.user_metadata?.display_name || null);
            setAccessToken(session.access_token);
            setAuthLoading(false);
            return;
          }
        } catch (e: any) {
          // Keep local session if server is unavailable
          console.log('Auth check failed:', e.message);
          const sessionUser = session.user || {};
          const userIdFromSession = sessionUser.id || null;
          const guardiansKey = userIdFromSession ? `guardians_${userIdFromSession}` : 'guardians';
          const savedGuardians = await AsyncStorage.getItem(guardiansKey);
          const parsedGuardians = savedGuardians ? JSON.parse(savedGuardians) : [];
          if (parsedGuardians.length > 0) {
            setGuardians(parsedGuardians);
            setHasGuardianLink(true);
          }
          setIsAuthenticated(true);
          setUserId(userIdFromSession);
          setUserEmail(sessionUser.email || null);
          setUserUsername(sessionUser.user_metadata?.username || sessionUser.user_metadata?.display_name || null);
          setAccessToken(session.access_token);
          setAuthLoading(false);
          return;
        }
      }
      setIsAuthenticated(false);
      setUserId(null);
      setUserEmail(null);
      setUserUsername(null);
      setUserAge(null);
      setUserDeathCount(0);
      setUserIcon(null);
      setAuthLoading(false);
    } catch (e: any) {
      console.log('Auth check error:', e.message);
      setIsAuthenticated(false);
      setUserId(null);
      setUserEmail(null);
      setUserUsername(null);
      setUserAge(null);
      setUserDeathCount(0);
      setUserIcon(null);
      setHasGuardianLink(false);
      setAuthLoading(false);
    }
  };

  const handleLogin = async (identifier: string, password: string) => {
    setAuthError(null);
    setLoading(true);
    try {
      console.log('🔐 Attempting login...', { identifier });
      console.log(`   URL: ${SUPABASE_API_URL}/auth/login`);
      
      // Add timeout to fetch
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${SUPABASE_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      const data = await response.json();
      console.log('📥 Login response:', { status: response.status, hasSession: !!data.session, error: data.error });
      
      if (response.ok && data.session) {
        // Save session
        const sessionData = {
          access_token: data.session.access_token,
          user: data.user,
        };
        await AsyncStorage.setItem('auth_session', JSON.stringify(sessionData));
        
        const userId = data.user?.id || null;
        const guardianFromDB = data.user?.guardian_username;
        
        setUserId(userId);
        setIsAuthenticated(true);
        setUserEmail(data.user?.email || identifier);
        setUserUsername(data.user?.username || data.user?.user_metadata?.username || null);
        setUserAge(data.user?.age || null);
        setUserDeathCount(data.user?.death_count || 0);
        const iconFromDB = data.user?.user_icon || null;
        setUserIcon(iconFromDB);
        console.log('✅ Login successful - icon from DB:', iconFromDB);
        setAccessToken(data.session.access_token);
        setAuthError(null);
        
        // Load guardian from database if it exists (persists across devices)
        if (guardianFromDB && userId) {
          const normalized = guardianFromDB.trim();
          if (normalized) {
            const guardiansKey = `guardians_${userId}`;
            await AsyncStorage.setItem(guardiansKey, JSON.stringify([normalized]));
            setGuardians([normalized]);
            setHasGuardianLink(true);
            console.log('✅ Guardian loaded from database:', normalized);
          }
        } else {
          // If no guardian in database, check local storage as fallback
          if (userId) {
            const guardiansKey = `guardians_${userId}`;
            const savedGuardians = await AsyncStorage.getItem(guardiansKey);
            const parsedGuardians = savedGuardians ? JSON.parse(savedGuardians) : [];
            if (parsedGuardians.length > 0) {
              setGuardians(parsedGuardians);
              setHasGuardianLink(true);
            }
          }
        }
        
        console.log('Login successful');
      } else {
        console.error('Login failed:', data.error);
        // Better error messages
        if (data.error?.includes('Invalid login credentials') || data.error?.includes('Email not confirmed')) {
          setAuthError('Invalid email or password.');
        } else {
          setAuthError(data.error || 'Login failed');
        }
      }
    } catch (error: any) {
      console.error('❌ Login network error:', error);
      if (error.name === 'AbortError') {
        setAuthError(`Request timed out. Is the server running at ${SUPABASE_API_URL}? If using Expo Go on a device, use your computer's IP address instead of localhost.`);
      } else {
        setAuthError(error.message || `Network error. Make sure the Supabase server is running at ${SUPABASE_API_URL}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (email: string, password: string, username: string, age: string) => {
    setAuthError(null);
    setLoading(true);
    try {
      console.log('🔐 Attempting signup...', { email, username });
      console.log(`   URL: ${SUPABASE_API_URL}/auth/signup`);
      
      // Add timeout to fetch
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${SUPABASE_API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, username, age: age || null }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      const data = await response.json();
      console.log('📥 Signup response:', { status: response.status, data });
      
      if (response.ok) {
        // Check if email confirmation is required
        if (data.requiresEmailConfirmation) {
          setAuthError(data.message || 'Please check your email to confirm your account, then sign in.');
          setLoading(false);
          return;
        }
        
        // If session exists, save it and log in automatically
        if (data.session) {
          console.log('✅ Signup successful, auto-logging in...');
          await AsyncStorage.setItem('auth_session', JSON.stringify({
            access_token: data.session.access_token,
            user: data.user,
          }));
          setUserId(data.user?.id || null);
          setIsAuthenticated(true);
          setUserEmail(data.user?.email || email);
          setUserUsername(data.user?.username || username);
          setUserAge(data.user?.age || (age ? parseInt(age) : null));
          setUserDeathCount(data.user?.death_count || 0);
          setUserIcon(data.user?.user_icon || null);
          setAccessToken(data.session.access_token);
          setAuthError(null);
        } else {
          // No session - email confirmation required, don't try to login
          console.log('⚠️ No session returned, email confirmation may be required');
          setAuthError('Signup successful! Please check your email to confirm your account, then sign in.');
        }
      } else {
        console.error('❌ Signup failed:', data.error);
        // Better error message for username taken
        if (data.usernameTaken || data.error?.includes('username') || data.error?.includes('Username')) {
          setAuthError('Username already taken. Please choose a different username.');
        } else {
          setAuthError(data.error || 'Signup failed');
        }
      }
    } catch (error: any) {
      console.error('❌ Signup network error:', error);
      if (error.name === 'AbortError') {
        setAuthError(`Request timed out. Is the server running at ${SUPABASE_API_URL}? If using Expo Go on a device, use your computer's IP address instead of localhost.`);
      } else {
        setAuthError(error.message || `Network error. Make sure the Supabase server is running at ${SUPABASE_API_URL}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (email: string): Promise<{ success: boolean; message: string }> => {
    setAuthError(null);
    setLoading(true);
    try {
      console.log('🔐 Requesting password reset...', { email });
      const response = await fetch(`${SUPABASE_API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      console.log('📥 Forgot password response:', { status: response.status, data });
      
      if (response.ok) {
        setAuthError(null);
        return { 
          success: true, 
          message: data.message || 'Password reset link sent! Check your email.' 
        };
      } else {
        const errorMsg = data.error || 'Failed to send reset email';
        setAuthError(errorMsg);
        return { success: false, message: errorMsg };
      }
    } catch (error: any) {
      console.error('❌ Forgot password error:', error);
      const errorMsg = error.message || `Network error. Make sure the Supabase server is running at ${SUPABASE_API_URL}`;
      setAuthError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = async () => {
    if (!accessToken) return;
    try {
      console.log('🔄 Loading user profile from database...');
      const response = await fetch(`${SUPABASE_API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        const iconFromDB = data.user?.user_icon || null;
        setUserId(data.user?.id || userId);
        setUserEmail(data.user?.email || null);
        setUserUsername(data.user?.username || null);
        setUserAge(data.user?.age || null);
        setUserDeathCount(data.user?.death_count || 0);
        setUserIcon(iconFromDB);
        console.log('✅ User profile loaded, icon from DB:', iconFromDB);
        if (data.user?.guardian_username && guardians.length === 0) {
          const guardianFromProfile = data.user.guardian_username.trim();
          if (guardianFromProfile) {
            await AsyncStorage.setItem(guardiansStorageKey, JSON.stringify([guardianFromProfile]));
            setGuardians([guardianFromProfile]);
            setHasGuardianLink(true);
          }
        }
      } else {
        console.error('❌ Failed to load user profile:', response.status);
      }
    } catch (e) {
      console.error('❌ Failed to load user profile:', e);
    }
  };

  const handleUpdateIcon = async (iconFilename: string) => {
    if (!accessToken) {
      Alert.alert('Error', 'You must be logged in to change your icon');
      return;
    }

    setLoading(true);
    try {
      console.log('🔄 Updating icon to:', iconFilename);
      const response = await fetch(`${SUPABASE_API_URL}/auth/update-icon`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_icon: iconFilename }),
      });

      const data = await response.json();

      if (response.ok) {
        const updatedIcon = data.user_icon || iconFilename;
        // Update state immediately with the icon from the response
        // The backend returns the saved icon, so we trust it
        setUserIcon(updatedIcon);
        console.log('✅ Icon updated successfully to:', updatedIcon);
        console.log('📦 Icon from backend response:', updatedIcon);
        
        // Don't reload profile immediately - this could cause race conditions
        // The icon is already updated in the database and we have it from the response
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

  const handleLogout = async () => {
    console.log('🚪 [LOGOUT] Starting logout process...');
    
    // Stop all timers and intervals first
    shouldStopSpamRef.current = true;
    [timerIntervalRef, alertTimerIntervalRef, notificationIntervalRef, spamMessageIntervalRef].forEach(ref => {
      if (ref.current) {
        clearInterval(ref.current);
        ref.current = null;
      }
    });
    
    try {
      if (accessToken) {
        // Add timeout to logout request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        try {
          const response = await fetch(`${SUPABASE_API_URL}/auth/logout`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          
          if (response.ok) {
            console.log('✅ [LOGOUT] Server logout successful');
          } else {
            const data = await response.json().catch(() => ({}));
            console.log('⚠️ [LOGOUT] Server response not OK:', response.status, data);
          }
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          if (fetchError.name !== 'AbortError') {
            console.log('⚠️ [LOGOUT] Request error:', fetchError.message);
          }
        }
      }
    } catch (e: any) {
      console.log('⚠️ [LOGOUT] Error:', e.message);
    }
    
    // Always clear local storage and state, even if server logout fails
    try {
      await AsyncStorage.removeItem('auth_session');
      console.log('✅ [LOGOUT] Auth session cleared from storage');
    } catch (e) {
      console.log('⚠️ [LOGOUT] Error clearing storage:', e);
    }
    
    // Clear all state
    setIsAuthenticated(false);
    setUserId(null);
    setUserEmail(null);
    setUserUsername(null);
    setUserAge(null);
    setUserDeathCount(0);
    setUserIcon(null);
    setHasGuardianLink(false);
    setAccessToken(null);
    setGuardians([]);
    setConnectedGuardians([]);
    setStatus(AppStatus.SETUP);
    setTimer(BREATHE_TIMER);
    setAlertTimer(ALERT_TIMER);
    setMessagesSent(0);
    
    console.log('✅ [LOGOUT] Logout complete - all state cleared');
  };

  // ============== EFFECTS ==============
  useEffect(() => {
    // TEMPORARY: Uncomment this line to always start fresh (for testing)
    // AsyncStorage.removeItem('auth_session').then(() => checkAuthStatus());
    
    checkAuthStatus();
    requestNotificationPermissions();
  }, []);

  // Re-check auth status when screen comes into focus (e.g., after logout from settings)
  useFocusEffect(
    React.useCallback(() => {
      // Re-check auth status when returning to this screen
      // This ensures logout from settings page properly shows auth screen
      checkAuthStatus();
    }, [])
  );

  useEffect(() => {
    if (isAuthenticated) {
      loadGuardians();
      loadUserProfile();
    }
  }, [isAuthenticated, accessToken, userId]);

  useEffect(() => {
    // Only run if authenticated
    if (!isAuthenticated) return;
    if (guardians.length === 0) return;
    checkGuardianStatus();
    const interval = setInterval(checkGuardianStatus, 3000);
    return () => clearInterval(interval);
  }, [guardians, isAuthenticated]);

  useEffect(() => {
    // Keep ref in sync with state for use in intervals
    connectedGuardiansRef.current = connectedGuardians;

    const currentStatus = statusRef.current;
    
    // Don't change status if user is on settings/friends/leaderboard routes
    const currentPath = segments.join('/');
    const isOnSettingsScreen = currentPath.includes('settings');
    const isOnFriendsScreen = currentPath.includes('friends');
    const isOnLeaderboardScreen = currentPath.includes('leaderboard');
    
    if (isOnSettingsScreen || isOnFriendsScreen || isOnLeaderboardScreen) {
      return;
    }
    
    // Don't interfere if already in MONITORING, ALERTING, or REST
    // ALERTING takes priority - once we're in ALERTING, stay there
    if (currentStatus === AppStatus.ALERTING || currentStatus === AppStatus.REST) {
      return;
    }
    
    if (currentStatus === AppStatus.MONITORING) {
      return;
    }
    
    if (guardians.length > 0 && connectedGuardians.length === 0) {
      setStatus(AppStatus.WAITING);
    } else if (connectedGuardians.length > 0) {
      if (currentStatus === AppStatus.WAITING || currentStatus === AppStatus.SETUP) {
        console.log('🔄 Transitioning to MONITORING from', currentStatus);
        setStatus(AppStatus.MONITORING);
        setTimer(BREATHE_TIMER);
      }
    }
  }, [guardians, connectedGuardians]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Listen for notification responses (when timer expires in background)
    const notificationResponseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      const currentStatus = statusRef.current;
      
      if (data?.action === 'breatheTimeout' && currentStatus === AppStatus.MONITORING) {
        handleBreatheTimeout();
      } else if (data?.action === 'alertTimeout' && currentStatus === AppStatus.ALERTING) {
        handleAlertTimeout();
      }
    });

    // Listen for notifications received in background (fires even without user interaction)
    const notificationReceivedSubscription = Notifications.addNotificationReceivedListener(notification => {
      const data = notification.request.content.data;
      if (data?.action === 'sendAlertMessage' && statusRef.current === AppStatus.ALERTING) {
        // Trigger message sending when background notification is received
        if (!shouldStopSpamRef.current) {
          sendMessageToAll().then(sent => {
            if (sent > 0 && !shouldStopSpamRef.current) {
              setMessagesSent((prev) => prev + sent);
            }
          }).catch(err => console.log('Background message send error:', err));
        }
      }
    });
    
    return () => {
      subscription.remove();
      notificationResponseSubscription.remove();
      notificationReceivedSubscription.remove();
    };
  }, [status, timer]);

  // Keep status ref in sync
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // Stop all activity when user is not authenticated
  useEffect(() => {
    if (isAuthenticated) return;
    shouldStopSpamRef.current = true;
    [timerIntervalRef, alertTimerIntervalRef, notificationIntervalRef, spamMessageIntervalRef].forEach(ref => {
      if (ref.current) {
        clearInterval(ref.current);
        ref.current = null;
      }
    });
  }, [isAuthenticated]);

  // Breathe timer countdown (10 seconds)
  useEffect(() => {
    // Stop all timers if not authenticated
    if (!isAuthenticated) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      breatheTimerEndRef.current = null;
      return;
    }

    // Clear interval if leaving MONITORING (only pause on ALERTING, REST, WAITING, SETUP)
    // Timer continues running when on settings/friends/leaderboard routes (like friends page)
    const currentPath = segments.join('/');
    const isOnOtherRoute = currentPath.includes('settings') || currentPath.includes('friends') || currentPath.includes('leaderboard');
    
    if (status !== AppStatus.MONITORING && !isOnOtherRoute) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      breatheTimerEndRef.current = null;
      return;
    }

    // Always clear existing interval first to ensure fresh start
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    // Ensure timer is valid before creating interval
    if (timer <= 0) {
      console.log('⚠️ Timer is 0 or negative, resetting to BREATHE_TIMER');
      setTimer(BREATHE_TIMER);
      breatheTimerEndRef.current = Date.now() + (BREATHE_TIMER * 1000);
    } else {
      // Create interval when entering MONITORING or SETTINGS
      // Also schedule background notification for timer expiration
      breatheTimerEndRef.current = Date.now() + (timer * 1000);
    }
    
    const timerEndTime = breatheTimerEndRef.current;
    
    // Schedule notification for when timer expires (for background execution)
    Notifications.cancelAllScheduledNotificationsAsync().then(() => {
      Notifications.scheduleNotificationAsync({
        identifier: 'breathe-timer-expiry',
        content: {
          title: '⏰ Timer Expired!',
          body: 'Breathe timer has expired',
          sound: true,
          data: { action: 'breatheTimeout' },
        },
        trigger: { seconds: timer },
      });
    });
    
    console.log('⏱️ Creating timer interval for status:', status, 'current timer:', timer, 'expires at:', timerEndTime);
    timerIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const timeRemaining = Math.ceil((breatheTimerEndRef.current! - now) / 1000);
      
      setTimer((prev) => {
        const currentStatus = statusRef.current;
        const currentPath = segments.join('/');
        const isOnOtherRoute = currentPath.includes('settings') || currentPath.includes('friends') || currentPath.includes('leaderboard');
        
        // If not in MONITORING and not on other routes, stop counting
        if (currentStatus !== AppStatus.MONITORING && !isOnOtherRoute) {
          return prev;
        }

        // Check if timer expired (handle both foreground and background)
        if (timeRemaining <= 0 || prev <= 1) {
          if (currentStatus === AppStatus.MONITORING || isOnOtherRoute) {
            handleBreatheTimeout();
            breatheTimerEndRef.current = null;
          }
          return 0;
        }
        
        // Use calculated time remaining (more accurate, especially after background)
        return Math.max(0, timeRemaining);
      });
    }, 1000);

    return () => {
      // Cleanup: always clear interval on unmount or status change
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [status, isAuthenticated, timer]);

  // Alert timer countdown (60 seconds before REST)
  // Also schedules background notifications to send messages while in ALERTING
  useEffect(() => {
    // Stop if not authenticated
    if (!isAuthenticated) {
      if (alertTimerIntervalRef.current) {
        clearInterval(alertTimerIntervalRef.current);
        alertTimerIntervalRef.current = null;
      }
      // Cancel all scheduled message notifications
      Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
      return;
    }
    if (status !== AppStatus.ALERTING) {
      alertTimerEndRef.current = null;
      // Cancel scheduled message notifications when not in ALERTING
      Notifications.getAllScheduledNotificationsAsync().then(notifications => {
        const messageNotifs = notifications.filter(n => 
          n.identifier.startsWith('alert-message-bg-')
        );
        messageNotifs.forEach(notif => {
          Notifications.cancelScheduledNotificationAsync(notif.identifier).catch(() => {});
        });
      }).catch(() => {});
      return;
    }

    // Schedule background notification for alert timer expiration
    const alertEndTime = Date.now() + (alertTimer * 1000);
    alertTimerEndRef.current = alertEndTime;
    
    // Schedule notification for when alert timer expires
    Notifications.scheduleNotificationAsync({
      identifier: 'alert-timer-expiry',
      content: {
        title: '💀 Alert Timer Expired!',
        body: 'You have died!',
        sound: true,
        data: { action: 'alertTimeout' },
      },
      trigger: { seconds: alertTimer },
    });

    alertTimerIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const timeRemaining = Math.ceil((alertTimerEndRef.current! - now) / 1000);
      
      setAlertTimer((prev) => {
        // Check if timer expired (handle both foreground and background)
        if (timeRemaining <= 0 || prev <= 1) {
          handleAlertTimeout();
          alertTimerEndRef.current = null;
          return 0;
        }
        
        // Use calculated time remaining (more accurate, especially after background)
        return Math.max(0, timeRemaining);
      });
    }, 1000);

    return () => { if (alertTimerIntervalRef.current) clearInterval(alertTimerIntervalRef.current); };
  }, [status, isAuthenticated]);

  // Increment death count when reaching REST status (backup mechanism)
  useEffect(() => {
    if (status === AppStatus.REST && isAuthenticated && !deathCountIncrementedRef.current) {
      console.log('💀 REST status detected - incrementing death count...');
      deathCountIncrementedRef.current = true; // Set flag first to prevent double increment
      incrementDeathCount().catch(err => {
        console.error('❌ Error in incrementDeathCount from useEffect:', err);
      });
    }
  }, [status, isAuthenticated, accessToken]);

  // Immediately cancel notifications when entering settings/friends/leaderboard screen
  useEffect(() => {
    const currentPath = segments.join('/');
    const isOnFriendsScreen = currentPath.includes('friends');
    const isOnSettingsScreen = currentPath.includes('settings');
    const isOnLeaderboardScreen = currentPath.includes('leaderboard');
    
    if (isOnSettingsScreen || isOnFriendsScreen || isOnLeaderboardScreen) {
      console.log('🔔 Canceling all notifications - entering settings/friends/leaderboard');
      // Cancel the interval immediately
      if (notificationIntervalRef.current) {
        clearInterval(notificationIntervalRef.current);
        notificationIntervalRef.current = null;
      }
      // Cancel all scheduled notifications
      Notifications.cancelAllScheduledNotificationsAsync().catch(err => {
        console.log('Failed to cancel notifications:', err);
      });
    }
  }, [status, segments]);

  // Notification spam during monitoring
  // Pauses when not in MONITORING or when on friends/settings screen (synced with timer)
  useEffect(() => {
    // Stop if not authenticated
    if (!isAuthenticated) {
      if (notificationIntervalRef.current) {
        clearInterval(notificationIntervalRef.current);
        notificationIntervalRef.current = null;
      }
      return;
    }

    // Check if we're on friends, settings, or leaderboard screen
    const currentPath = segments.join('/');
    const isOnFriendsScreen = currentPath.includes('friends');
    const isOnSettingsScreen = currentPath.includes('settings');
    const isOnLeaderboardScreen = currentPath.includes('leaderboard');

    // Always clear existing notification interval first to ensure fresh state
    if (notificationIntervalRef.current) {
      clearInterval(notificationIntervalRef.current);
      notificationIntervalRef.current = null;
    }

    // Only create interval when in MONITORING AND on the main screen (not friends/settings/leaderboard)
    // This ensures notifications pause when on settings/friends/leaderboard routes (same as timer)
    if (status !== AppStatus.MONITORING || isOnFriendsScreen || isOnSettingsScreen || isOnLeaderboardScreen) {
      console.log('🔔 Pausing notifications - status:', status, 'onFriends:', isOnFriendsScreen, 'onSettings:', isOnSettingsScreen, 'onLeaderboard:', isOnLeaderboardScreen);
      // Cancel all scheduled notifications when pausing (especially when entering settings)
      Notifications.cancelAllScheduledNotificationsAsync().catch(err => {
        console.log('Failed to cancel notifications:', err);
      });
      return;
    }

    // Create notification interval only when actively monitoring on main screen
    console.log('🔔 Creating notification interval for MONITORING');
    notificationIntervalRef.current = setInterval(() => {
      // Double-check status before sending notification (sync with timer)
      // The timer already pauses when status !== MONITORING, so notifications should too
      const currentStatus = statusRef.current;
      
      // Only trigger if actively monitoring (the useEffect already ensures we're not in settings/friends)
      if (currentStatus === AppStatus.MONITORING) {
        triggerNotification();
      }
    }, NOTIFICATION_INTERVAL);

    return () => {
      if (notificationIntervalRef.current) {
        clearInterval(notificationIntervalRef.current);
        notificationIntervalRef.current = null;
      }
    };
  }, [status, isAuthenticated, segments]);

  // ============== HANDLERS ==============
  const requestNotificationPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Oops! 💕', 'Notifications help keep you safe!');
    }
  };

  const triggerNotification = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🌸 BREATHE NOW!🌸',
        body: 'Take a breath and tap the button! 💖',
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null,
    });
  };

  // Reset notification timer when button is pressed
  const resetNotificationTimer = () => {
    if (notificationIntervalRef.current) {
      clearInterval(notificationIntervalRef.current);
    }
    notificationIntervalRef.current = setInterval(() => {
      triggerNotification();
    }, NOTIFICATION_INTERVAL);
  };

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
      // App returning to foreground - check if timers expired while in background
      const now = Date.now();
      
      // Check breathe timer expiration (works for MONITORING and settings/friends/leaderboard routes)
      const currentPath = segments.join('/');
      const isOnOtherRoute = currentPath.includes('settings') || currentPath.includes('friends') || currentPath.includes('leaderboard');
      
      if (breatheTimerEndRef.current && (status === AppStatus.MONITORING || isOnOtherRoute)) {
        const timeRemaining = Math.ceil((breatheTimerEndRef.current - now) / 1000);
        if (timeRemaining <= 0) {
          // Timer expired while in background
          handleBreatheTimeout();
          breatheTimerEndRef.current = null;
        } else {
          // Update timer with remaining time
          setTimer(timeRemaining);
        }
      }
      
      // Check alert timer expiration
      if (alertTimerEndRef.current && status === AppStatus.ALERTING) {
        const timeRemaining = Math.ceil((alertTimerEndRef.current - now) / 1000);
        if (timeRemaining <= 0) {
          // Timer expired while in background
          handleAlertTimeout();
          alertTimerEndRef.current = null;
        } else {
          // Update timer with remaining time
          setAlertTimer(timeRemaining);
        }
      }
      
      backgroundTimeRef.current = null;
    } else if (nextAppState.match(/inactive|background/)) {
      backgroundTimeRef.current = Date.now();
    }
    appStateRef.current = nextAppState;
  };

  const loadGuardians = async () => {
    try {
      const saved = await AsyncStorage.getItem(guardiansStorageKey);
      if (saved) {
        setGuardians(JSON.parse(saved));
      }
    } catch (e) {
      console.log('Failed to load guardians');
    } finally {
      setCheckingStatus(false);
    }
  };

  const saveGuardians = async (newGuardians: string[]) => {
    try {
      await AsyncStorage.setItem(guardiansStorageKey, JSON.stringify(newGuardians));
      setGuardians(newGuardians);
    } catch (e) {
      console.log('Failed to save guardians');
    }
  };

  const checkGuardianStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users`);
      if (!response.ok) {
        console.log(`⚠️ Server responded with status: ${response.status}`);
        return;
      }
      const data = await response.json();
      if (data.success && data.users) {
        // Normalize usernames (remove @, lowercase) for comparison
        const normalizedDbUsers = data.users.map((u: string) => u.toLowerCase().replace('@', ''));
        const normalizedGuardians = guardians.map(g => g.toLowerCase().replace('@', ''));
        
        const connected = guardians.filter(g => {
          const normalized = g.toLowerCase().replace('@', '');
          return normalizedDbUsers.includes(normalized);
        });
        
        console.log('🔍 Guardian Check:', {
          guardians: guardians,
          dbUsers: data.users,
          connected: connected,
          currentStatus: status
        });
        
        const prevConnected = connectedGuardians.length;
        setConnectedGuardians(connected);

        const currentStatus = statusRef.current;
        const currentPath = segments.join('/');
        const isOnSettingsScreen = currentPath.includes('settings');
        const isOnFriendsScreen = currentPath.includes('friends');
        const isOnLeaderboardScreen = currentPath.includes('leaderboard');

        // Don't change status if user is on settings/friends/leaderboard routes
        if (isOnSettingsScreen || isOnFriendsScreen || isOnLeaderboardScreen) {
          return;
        }

        // Don't reset timer if already in MONITORING, ALERTING, or REST
        if (currentStatus === AppStatus.MONITORING || currentStatus === AppStatus.ALERTING || currentStatus === AppStatus.REST) {
          return;
        }
        
        // If guardians just connected (went from 0 to >0), transition to monitoring
        if (prevConnected === 0 && connected.length > 0) {
          console.log('✅ Guardian connected! Transitioning to monitoring...');
          setStatus(AppStatus.MONITORING);
          setTimer(BREATHE_TIMER);
        } else if (connected.length > 0 && (currentStatus === AppStatus.WAITING || currentStatus === AppStatus.SETUP)) {
          console.log('✅ Found connected guardians, transitioning to monitoring...');
          setStatus(AppStatus.MONITORING);
          setTimer(BREATHE_TIMER);
        }
      }
    } catch (error: any) {
      // Only log network errors occasionally to avoid spam
      if (error?.message?.includes('Network request failed') || error?.message?.includes('Failed to fetch')) {
        console.log(`⚠️ Cannot reach server at ${API_BASE_URL}`);
        console.log("💡 Make sure:");
        console.log("   1. Flask server is running (python api_server.py)");
        console.log("   2. IP address in config.ts matches your current IP");
        console.log("   3. Phone and computer are on the same Wi-Fi network");
      } else {
        console.log("Polling error:", error);
      }
    }
  };

  const getNextMessage = () => {
    const index = messageIndexRef.current % ALERT_MESSAGES.length;
    const message = ALERT_MESSAGES[index];
    messageIndexRef.current = messageIndexRef.current + 1;
    console.log(`Sending message ${index}: ${message}`);
    return message;
  };

  const sendMessageToAll = async (): Promise<number> => {
    if (!isAuthenticated) {
      return 0;
    }
    // Check if we should stop
    if (shouldStopSpamRef.current) {
      console.log('Spam stopped, not sending');
      return 0;
    }
    
    let sent = 0;
    const message = getNextMessage();
    const guardiansToMessage = connectedGuardiansRef.current; // Use ref to avoid stale closure
    
    for (const guardian of guardiansToMessage) {
      // Double check stop flag before each send
      if (shouldStopSpamRef.current) break;
      
      try {
        const response = await fetch(`${API_BASE_URL}/send-message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ target_username: guardian, message }),
        });
        const data = await response.json();
        if (response.ok && data.success) sent++;
      } catch (error) {
        console.log(`Failed to send to ${guardian}`);
      }
    }
    return sent;
  };

  const handleBreathe = () => {
    const currentStatus = statusRef.current;
    if (currentStatus !== AppStatus.MONITORING) return;
    
    // Reset timer to 10 seconds - update both state and ref
    setTimer(BREATHE_TIMER);
    // Reset the timer end timestamp so the interval recalculates from now
    breatheTimerEndRef.current = Date.now() + (BREATHE_TIMER * 1000);
    
    // Reschedule notification for timer expiry
    Notifications.cancelScheduledNotificationAsync('breathe-timer-expiry').catch(() => {});
    Notifications.scheduleNotificationAsync({
      identifier: 'breathe-timer-expiry',
      content: {
        title: '⏰ Timer Expired!',
        body: 'Breathe timer has expired',
        sound: true,
        data: { action: 'breatheTimeout' },
      },
      trigger: { seconds: BREATHE_TIMER },
    }).catch(() => {});
    
    // Reset notification timer
    resetNotificationTimer();
  };

  // When breathe timer (10s) reaches 0 → go to ALERTING
  // Works like friends/leaderboard - just changes status, no navigation
  const handleBreatheTimeout = () => {
    const currentStatus = statusRef.current;
    
    // Only allow transition from MONITORING
    if (currentStatus !== AppStatus.MONITORING) {
      return;
    }
    
    // Clear notification interval (but keep timer interval for alert timer)
    if (notificationIntervalRef.current) clearInterval(notificationIntervalRef.current);

    // Reset message index and enable spam
    messageIndexRef.current = 0;
    shouldStopSpamRef.current = false;

    // Start sending messages
    sendMessageToAll().then(sent => setMessagesSent(sent));
    
    // Start spam interval (runs even when app is briefly backgrounded)
    // The interval will continue for ~30 seconds in background before OS throttles it
    spamMessageIntervalRef.current = setInterval(async () => {
      if (shouldStopSpamRef.current) return; // Extra check
      const sent = await sendMessageToAll();
      if (!shouldStopSpamRef.current) {
        setMessagesSent((prev) => prev + sent);
      }
    }, 1000);

    // Also schedule background notifications to trigger message sending periodically
    // This helps ensure messages continue even if the interval gets throttled
    const scheduleBackgroundMessageNotifications = () => {
      // Schedule notifications every 2 seconds for the alert duration
      // (Less frequent than interval to avoid hitting notification limits)
      const notificationsToSchedule = Math.floor(alertTimer / 2);
      for (let i = 2; i <= Math.min(alertTimer, notificationsToSchedule * 2); i += 2) {
        Notifications.scheduleNotificationAsync({
          identifier: `alert-message-bg-${i}`,
          content: {
            title: '', // Empty to avoid notification spam
            body: '',
            sound: false,
            data: { action: 'sendAlertMessage' },
          },
          trigger: { seconds: i },
        }).catch(() => {}); // Silently fail if limit reached
      }
    };
    scheduleBackgroundMessageNotifications();

    // Go to ALERTING screen with 60s timer
    // This transition happens in the background - user will see ALERTING screen (60s countdown)
    setAlertTimer(ALERT_TIMER);
    setStatus(AppStatus.ALERTING);
    console.log('🚨 Transitioning to ALERTING from', currentStatus);
  };

  // Send final message to all guardians
  const sendFinalMessage = async (): Promise<void> => {
    if (!isAuthenticated) {
      console.log('⚠️ Cannot send final message - not authenticated');
      return;
    }
    
    const finalMessage = 'YOUR WARD IS MOST PROBABLY DEAD';
    const guardiansToMessage = connectedGuardiansRef.current;
    
    console.log('💀 Sending final message to guardians:', guardiansToMessage);
    
    for (const guardian of guardiansToMessage) {
      try {
        const response = await fetch(`${API_BASE_URL}/send-message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ target_username: guardian, message: finalMessage }),
        });
        const data = await response.json();
        if (response.ok && data.success) {
          console.log(`✅ Final message sent to ${guardian}`);
        } else {
          console.log(`❌ Failed to send final message to ${guardian}`);
        }
      } catch (error) {
        console.log(`❌ Error sending final message to ${guardian}:`, error);
      }
    }
  };

  // When alert timer (60s) reaches 0 → go to REST
  const handleAlertTimeout = async () => {
    console.log('ALERT TIMEOUT - STOPPING ALL MESSAGES');
    
    // SET STOP FLAG FIRST
    shouldStopSpamRef.current = true;
    
    if (alertTimerIntervalRef.current) {
      clearInterval(alertTimerIntervalRef.current);
      alertTimerIntervalRef.current = null;
    }
    if (spamMessageIntervalRef.current) {
      clearInterval(spamMessageIntervalRef.current);
      spamMessageIntervalRef.current = null;
    }
    
    // Send final message to all guardians before going to REST
    await sendFinalMessage();
    
    // Set status to REST first, then increment (useEffect will also catch it as backup)
    setStatus(AppStatus.REST);
    
    // Increment death count (only once per death)
    if (!deathCountIncrementedRef.current) {
      deathCountIncrementedRef.current = true; // Set flag first to prevent double increment
      await incrementDeathCount();
    }
  };

  const incrementDeathCount = async () => {
    if (!accessToken) {
      console.log('⚠️ Cannot increment death count - no access token');
      return;
    }
    try {
      console.log('💀 Incrementing death count...');
      console.log('🔗 API URL:', `${SUPABASE_API_URL}/auth/increment-death`);
      console.log('🔑 Has access token:', !!accessToken);
      
      const response = await fetch(`${SUPABASE_API_URL}/auth/increment-death`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('📡 Response status:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        const newDeathCount = data.death_count || 0;
        setUserDeathCount(newDeathCount);
        console.log('✅ Death count incremented to:', newDeathCount);
        
        // Also refresh the full profile to ensure consistency
        await loadUserProfile();
      } else {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = errorText;
        }
        console.error('❌ Failed to increment death count. Status:', response.status);
        console.error('❌ Error data:', errorData);
      }
    } catch (e) {
      console.error('❌ Failed to increment death count - network error:', e);
    }
  };

  // False alarm - stop everything and go back to monitoring
  const handleFalseAlarm = () => {
    console.log('FALSE ALARM PRESSED - STOPPING ALL MESSAGES');
    
    // SET STOP FLAG FIRST - this stops any in-progress sends
    shouldStopSpamRef.current = true;
    
    // Then clear all intervals
    if (alertTimerIntervalRef.current) {
      clearInterval(alertTimerIntervalRef.current);
      alertTimerIntervalRef.current = null;
    }
    if (spamMessageIntervalRef.current) {
      clearInterval(spamMessageIntervalRef.current);
      spamMessageIntervalRef.current = null;
    }
    
    setSupportMessage("You're safe now! 💖✨");
    setTimeout(() => setSupportMessage("Stay Safe"), 5000);
    
    setMessagesSent(0);
    messageIndexRef.current = 0;
    setTimer(BREATHE_TIMER);
    setStatus(AppStatus.MONITORING);
  };

  const handleSetupGuardian = async (username: string) => {
    if (!username.trim()) {
      Alert.alert('Oops! 💕', 'Please enter a username');
      return;
    }

    const cleanUsername = username.replace('@', '').trim();
    await saveGuardians([cleanUsername]);
    setStatus(AppStatus.WAITING);
    
    // Send invite - open Telegram with message pre-filled
    const botLink = `https://t.me/${BOT_USERNAME}?start=start`;
    const message = `Hey! Please click this link and press Start: ${botLink}`;
    
    // Try tg:// protocol first (works better on mobile)
    const telegramUrl = `tg://resolve?domain=${cleanUsername}&text=${encodeURIComponent(message)}`;
    
    try {
      const supported = await Linking.canOpenURL(telegramUrl);
      if (supported) {
        await Linking.openURL(telegramUrl);
      } else {
        // Fallback to https://t.me with text parameter
        const fallbackUrl = `https://t.me/${cleanUsername}?text=${encodeURIComponent(message)}`;
        const fallbackSupported = await Linking.canOpenURL(fallbackUrl);
        if (fallbackSupported) {
          await Linking.openURL(fallbackUrl);
        } else {
          // Last resort: copy to clipboard and open chat
          await Clipboard.setStringAsync(message);
          await Linking.openURL(`https://t.me/${cleanUsername}`);
          setTimeout(() => {
            Alert.alert(
              '📋 Message Copied!', 
              'The invite message has been copied to your clipboard. Just paste it in the chat and send!',
              [{ text: 'Got it! 💕' }]
            );
          }, 500);
        }
      }
    } catch (e) {
      // Fallback: copy to clipboard
      await Clipboard.setStringAsync(message);
      Alert.alert('Setup Complete!', `Message copied! Please open Telegram and send it to @${cleanUsername}`);
    }
  };

  const handleAddGuardian = async (username: string) => {
    if (guardians.includes(username)) {
      Alert.alert('Already Added', `@${username} is already a guardian`);
      return;
    }
    
    const newGuardians = [...guardians, username];
    await saveGuardians(newGuardians);
    
    // Send invite - open Telegram with message pre-filled
    const botLink = `https://t.me/${BOT_USERNAME}?start=start`;
    const message = `Hey! Please click this link and press Start: ${botLink}`;
    
    // Try tg:// protocol first (works better on mobile)
    const telegramUrl = `tg://resolve?domain=${username}&text=${encodeURIComponent(message)}`;
    
    try {
      const supported = await Linking.canOpenURL(telegramUrl);
      if (supported) {
        await Linking.openURL(telegramUrl);
      } else {
        // Fallback to https://t.me with text parameter
        const fallbackUrl = `https://t.me/${username}?text=${encodeURIComponent(message)}`;
        const fallbackSupported = await Linking.canOpenURL(fallbackUrl);
        if (fallbackSupported) {
          await Linking.openURL(fallbackUrl);
        } else {
          // Last resort: copy to clipboard and open chat
          await Clipboard.setStringAsync(message);
          await Linking.openURL(`https://t.me/${username}`);
          setTimeout(() => {
            Alert.alert(
              '📋 Message Copied!', 
              'The invite message has been copied. Just paste it in the chat and send!',
              [{ text: 'Got it! 💕' }]
            );
          }, 500);
        }
      }
    } catch (e) {
      // Fallback: copy to clipboard
      await Clipboard.setStringAsync(message);
      Alert.alert('Guardian Added!', `Message copied! Send it to @${username} on Telegram.`);
    }
  };

  const handleRemoveGuardian = async (username: string) => {
    const newGuardians = guardians.filter(g => g !== username);
    await saveGuardians(newGuardians);
    
    if (newGuardians.length === 0) {
      setStatus(AppStatus.SETUP);
    }
  };

  const handleResetApp = async () => {
    // Clear all intervals and stop messages
    [timerIntervalRef, alertTimerIntervalRef, notificationIntervalRef, spamMessageIntervalRef].forEach(ref => {
      if (ref.current) {
        clearInterval(ref.current);
        ref.current = null;
      }
    });
    
    await AsyncStorage.removeItem('guardians');
    setGuardians([]);
    setConnectedGuardians([]);
    setInputText('');
    setStatus(AppStatus.SETUP);
    setTimer(BREATHE_TIMER);
    setAlertTimer(ALERT_TIMER);
    setMessagesSent(0);
    messageIndexRef.current = 0;
  };

  const handleRestart = () => {
    console.log('RESTART PRESSED - STOPPING ALL MESSAGES');
    
    // Clear timer expiration refs
    breatheTimerEndRef.current = null;
    alertTimerEndRef.current = null;
    
    // Reset death count increment flag for next session
    deathCountIncrementedRef.current = false;
    
    // Cancel all scheduled notifications
    Notifications.cancelAllScheduledNotificationsAsync();
    
    // SET STOP FLAG FIRST - this stops any in-progress sends
    shouldStopSpamRef.current = true;
    
    // Then clear all intervals
    if (spamMessageIntervalRef.current) {
      clearInterval(spamMessageIntervalRef.current);
      spamMessageIntervalRef.current = null;
    }
    if (alertTimerIntervalRef.current) {
      clearInterval(alertTimerIntervalRef.current);
      alertTimerIntervalRef.current = null;
    }
    
    setStatus(AppStatus.MONITORING);
    setTimer(BREATHE_TIMER);
    setAlertTimer(ALERT_TIMER);
    setMessagesSent(0);
    messageIndexRef.current = 0;
  };

  const handleResendInvite = async (username: string) => {
    const botLink = `https://t.me/${BOT_USERNAME}?start=start`;
    const message = `Hey! Please click this link and press Start: ${botLink}`;
    
    // Try tg:// protocol first (works better on mobile)
    const telegramUrl = `tg://resolve?domain=${username}&text=${encodeURIComponent(message)}`;
    
    try {
      const supported = await Linking.canOpenURL(telegramUrl);
      if (supported) {
        await Linking.openURL(telegramUrl);
      } else {
        // Fallback to https://t.me with text parameter
        const fallbackUrl = `https://t.me/${username}?text=${encodeURIComponent(message)}`;
        const fallbackSupported = await Linking.canOpenURL(fallbackUrl);
        if (fallbackSupported) {
          await Linking.openURL(fallbackUrl);
        } else {
          // Last resort: copy to clipboard and open chat
          await Clipboard.setStringAsync(message);
          await Linking.openURL(`https://t.me/${username}`);
          setTimeout(() => {
            Alert.alert(
              '📋 Message Copied!', 
              'The invite message has been copied. Just paste it in the chat and send!',
              [{ text: 'Got it! 💕' }]
            );
          }, 500);
        }
      }
    } catch (e) {
      // Fallback: copy to clipboard
      await Clipboard.setStringAsync(message);
      Alert.alert('Message Copied! 📋', `Please open Telegram and send it to @${username}`);
    }
  };


  // ============== AUTHENTICATION CHECK ==============
  if (authLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return (
      <AuthScreen
        onLogin={handleLogin}
        onSignup={handleSignup}
        onForgotPassword={handleForgotPassword}
        isLoading={loading}
        error={authError}
      />
    );
  }

  // ============== LOADING ==============
  if (checkingStatus) {
    return <LoadingScreen />;
  }

  // ============== ALERTING SCREEN ==============
  // Check ALERTING first (after loading) so it takes priority when timer expires
  // This ensures smooth transition from SETTINGS to ALERTING
  if (status === AppStatus.ALERTING) {
    return (
      <AlertingScreen
        alertTimer={alertTimer}
        messagesSent={messagesSent}
        onFalseAlarm={handleFalseAlarm}
      />
    );
  }

  // ============== REST SCREEN ==============
  if (status === AppStatus.REST) {
    return (
      <RestScreen
        messagesSent={messagesSent}
        onRestart={handleRestart}
      />
    );
  }


  // ============== SETUP SCREEN ==============
  if (guardians.length === 0 && !hasGuardianLink) {
    return (
      <SetupScreen onSetup={handleSetupGuardian} />
    );
  }

  // ============== WAITING SCREEN ==============
  if (status === AppStatus.WAITING || connectedGuardians.length === 0) {
    return (
      <WaitingScreen
        guardians={guardians}
        connectedGuardians={connectedGuardians}
        onAddGuardian={handleAddGuardian}
        onResendInvite={handleResendInvite}
        onSettings={() => router.push('/settings')}
        showAddModal={showAddModal}
        onShowAddModal={setShowAddModal}
      />
    );
  }

  // ============== MONITORING SCREEN ==============
  if (status === AppStatus.MONITORING) {
    return (
      <MonitoringScreen
        timer={timer}
        displayUsername={displayUsername}
        userIcon={userIcon}
        supportMessage={supportMessage}
        loading={loading}
        onBreathe={handleBreathe}
        onAddGuardian={handleAddGuardian}
        onSettings={() => router.push('/settings')}
        showAddModal={showAddModal}
        onShowAddModal={setShowAddModal}
      />
    );
  }

  return null;
}

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
  background: { flex: 1 },
  doodleBg: { backgroundColor: KawaiiColors.cream },
  gradientBg: { backgroundColor: '#F3E5F5' },
  scrollContainer: { flexGrow: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingEmoji: { marginBottom: 20 },
  loadingText: { marginTop: 16, fontSize: 16, color: KawaiiColors.text, fontWeight: '500' },

  // Setup
  setupContainer: { flex: 1, paddingTop: 80, alignItems: 'center' },
  setupEmoji: { marginBottom: 16 },
  setupTitle: { fontWeight: '700', color: KawaiiColors.hotPink, marginBottom: 8, textAlign: 'center' },
  setupSubtitle: { fontSize: 16, color: KawaiiColors.text, opacity: 0.8, marginBottom: 40, textAlign: 'center' },
  setupCard: { width: '100%', backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 32, padding: 24, borderWidth: 4, borderColor: KawaiiColors.softPink, ...KawaiiShadows.card },
  cardTitle: { fontSize: 18, fontWeight: '700', color: KawaiiColors.hotPink, marginBottom: 16 },
  input: { backgroundColor: KawaiiColors.white, borderRadius: 16, borderWidth: 2, borderColor: KawaiiColors.kawaiiPink, padding: 16, color: KawaiiColors.text, marginBottom: 20 },
  setupButton: { backgroundColor: KawaiiColors.hotPink, paddingVertical: 16, borderRadius: 16, alignItems: 'center', ...KawaiiShadows.button },
  setupButtonText: { color: KawaiiColors.white, fontSize: 18, fontWeight: '700' },
  footerText: { marginTop: 40, fontSize: 10, fontWeight: '700', color: KawaiiColors.textLight, textTransform: 'uppercase', letterSpacing: 2 },
  buttonDisabled: { opacity: 0.6 },

  // Auth
  authContainer: { flex: 1, paddingTop: 80, alignItems: 'center' },
  authEmoji: { marginBottom: 16 },
  authTitle: { fontWeight: '700', color: KawaiiColors.hotPink, marginBottom: 8, textAlign: 'center' },
  authSubtitle: { fontSize: 16, color: KawaiiColors.text, opacity: 0.8, marginBottom: 40, textAlign: 'center' },
  authCard: { width: '100%', backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 32, padding: 24, borderWidth: 4, borderColor: KawaiiColors.softPink, ...KawaiiShadows.card },
  errorContainer: { backgroundColor: '#FFE5E5', borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 2, borderColor: '#FF6B6B' },
  errorText: { color: '#D32F2F', fontSize: 14, fontWeight: '600', textAlign: 'center' },
  authSubmitButton: { backgroundColor: KawaiiColors.hotPink, paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  authSubmitButtonText: { color: KawaiiColors.white, fontSize: 18, fontWeight: '700' },
  switchAuthButton: { marginTop: 20, padding: 12 },
  switchAuthText: { fontSize: 14, color: KawaiiColors.hotPink, fontWeight: '600', textAlign: 'center' },
  forgotPasswordButton: { marginTop: 12, padding: 8, alignItems: 'center' },
  forgotPasswordText: { fontSize: 14, color: KawaiiColors.hotPink, fontWeight: '600', textDecorationLine: 'underline' },

  // Waiting
  waitingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 },
  waitingEmoji: { marginBottom: 20 },
  waitingTitle: { fontWeight: '700', color: KawaiiColors.hotPink, marginBottom: 20 },
  guardiansList: { width: '100%', maxWidth: 300 },
  waitingGuardianItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.8)', padding: 16, borderRadius: 16, marginBottom: 10, borderWidth: 2, borderColor: KawaiiColors.kawaiiPink },
  waitingGuardianText: { fontSize: 16, fontWeight: '600', color: KawaiiColors.text },
  resendText: { fontSize: 14, color: KawaiiColors.hotPink, fontWeight: '600' },
  addMoreButton: { marginTop: 20, padding: 16 },
  addMoreText: { fontSize: 16, color: KawaiiColors.hotPink, fontWeight: '600' },

  // Monitoring
  monitoringContainer: { flex: 1, maxWidth: 500, alignSelf: 'center', width: '100%' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 10 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.8)', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, borderWidth: 2, borderColor: KawaiiColors.primaryPink },
  statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: KawaiiColors.primaryPink, marginRight: 8 },
  statusText: { fontWeight: '700', color: KawaiiColors.primaryPink, textTransform: 'uppercase', letterSpacing: 1 },
  headerEmoji: {},
  guardianCount: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.8)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16 },
  guardianCountText: { fontSize: 14, fontWeight: '700', color: KawaiiColors.hotPink },
  guardianCountIcon: { width: 18, height: 18, borderRadius: 9, borderWidth: 1, borderColor: KawaiiColors.hotPink },

  // Breathe Button
  breatheContainer: { alignItems: 'center', justifyContent: 'center', marginBottom: 30 },
  pulseRing: { position: 'absolute', backgroundColor: `${KawaiiColors.primaryPink}20` },
  dashedBorder: { position: 'absolute', borderWidth: 4, borderStyle: 'dashed', borderColor: `${KawaiiColors.primaryPink}40` },
  breatheButton: { backgroundColor: KawaiiColors.primaryPink, alignItems: 'center', justifyContent: 'center', shadowColor: '#FF85A2', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 1, shadowRadius: 0, elevation: 20 },
  buttonFace: { alignItems: 'center', marginBottom: 8 },
  buttonEyesRow: { flexDirection: 'row', gap: 20, marginBottom: 8 },
  buttonEye: { width: 12, height: 12, borderRadius: 6, backgroundColor: KawaiiColors.white },
  buttonSmile: { width: 40, height: 16, borderBottomWidth: 4, borderBottomColor: KawaiiColors.white, borderRadius: 20 },
  breatheButtonText: { fontWeight: '900', color: KawaiiColors.white, textTransform: 'uppercase', letterSpacing: 2, marginTop: 8 },
  supportRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, maxWidth: 180 },
  supportIcon: { fontSize: 12, marginRight: 4 },
  supportText: { fontSize: 9, fontWeight: '700', color: KawaiiColors.white, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center', flexShrink: 1 },

  // Timer Card
  mainContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingBottom: 100 },
  usernameDisplay: { marginBottom: 20, paddingVertical: 8, paddingHorizontal: 16, backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 20, borderWidth: 2, borderColor: KawaiiColors.primaryPink },
  usernameDisplayText: { fontSize: 16, fontWeight: '700', color: KawaiiColors.hotPink, textAlign: 'center' },
  userIconContainer: { alignItems: 'center', marginBottom: 16 },
  userIconImage: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: KawaiiColors.hotPink },
  changeIconButton: { backgroundColor: KawaiiColors.softPink, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 16, alignItems: 'center', marginBottom: 20, borderWidth: 2, borderColor: KawaiiColors.hotPink },
  changeIconButtonText: { fontSize: 16, fontWeight: '600', color: KawaiiColors.hotPink },
  iconPickerModalContent: { width: '100%', maxWidth: 360, maxHeight: '80%', backgroundColor: KawaiiColors.white, borderRadius: 32, padding: 24, borderWidth: 4, borderColor: KawaiiColors.kawaiiPink },
  iconPickerModalScroll: { maxHeight: 400, marginBottom: 20 },
  iconPickerModalGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16 },
  iconPickerModalItem: { width: 70, height: 70, borderRadius: 35, borderWidth: 2, borderColor: KawaiiColors.softPink, overflow: 'hidden', position: 'relative', backgroundColor: KawaiiColors.white },
  iconPickerModalItemSelected: { borderWidth: 3, borderColor: KawaiiColors.hotPink },
  iconPickerModalImage: { width: '100%', height: '100%' },
  iconPickerModalCheckmark: { position: 'absolute', bottom: 2, right: 2, width: 22, height: 22, borderRadius: 11, backgroundColor: KawaiiColors.hotPink, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: KawaiiColors.white },
  iconPickerModalCheckmarkText: { color: KawaiiColors.white, fontSize: 14, fontWeight: '700' },
  timerCard: { width: '100%', backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 32, borderWidth: 4, borderColor: KawaiiColors.softPink },
  timerHeader: { alignItems: 'center', marginBottom: 16 },
  timerLabel: { fontWeight: '700', color: KawaiiColors.dangerPink, textTransform: 'uppercase', letterSpacing: 1 },
  timerCenter: { alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  timerValue: { fontWeight: '700', color: KawaiiColors.dangerPink, fontVariant: ['tabular-nums'] },
  progressBar: { height: 16, backgroundColor: `${KawaiiColors.softPink}50`, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: KawaiiColors.softPink, marginBottom: 12 },
  progressFill: { height: '100%', backgroundColor: KawaiiColors.dangerPink, borderRadius: 8 },
  timerFooter: { flexDirection: 'row', alignItems: 'center' },
  timerFooterIcon: { fontSize: 14, marginRight: 4 },
  timerFooterText: { fontSize: 10, fontWeight: '700', color: '#999', textTransform: 'uppercase' },

  // Bottom Nav
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: KawaiiColors.white, borderTopLeftRadius: 40, borderTopRightRadius: 40, borderTopWidth: 4, borderTopColor: '#FFF0F5', shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 10 },
  navItem: { alignItems: 'center', justifyContent: 'center', padding: 10, flex: 1 },
  navItemAdd: { alignItems: 'center', justifyContent: 'center', padding: 10, flex: 1 },
  addButton: { width: 56, height: 56, borderRadius: 28, backgroundColor: KawaiiColors.hotPink, alignItems: 'center', justifyContent: 'center', shadowColor: '#FF85A2', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8 },
  addButtonText: { fontSize: 32, fontWeight: '700', color: KawaiiColors.white, marginTop: -2 },
  navIconImage: { width: 28, height: 28, opacity: 0.7 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContent: { width: '100%', maxWidth: 340, backgroundColor: KawaiiColors.white, borderRadius: 32, padding: 24, borderWidth: 4, borderColor: KawaiiColors.kawaiiPink },
  modalTitle: { fontSize: 24, fontWeight: '700', color: KawaiiColors.hotPink, textAlign: 'center', marginBottom: 8 },
  modalSubtitle: { fontSize: 14, color: KawaiiColors.text, textAlign: 'center', marginBottom: 20, opacity: 0.8 },
  modalInput: { backgroundColor: '#FFF5F8', borderRadius: 16, borderWidth: 2, borderColor: KawaiiColors.kawaiiPink, padding: 16, fontSize: 18, color: KawaiiColors.text, marginBottom: 20 },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalCancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 16, borderWidth: 2, borderColor: KawaiiColors.kawaiiPink, alignItems: 'center' },
  modalCancelText: { fontSize: 16, fontWeight: '600', color: KawaiiColors.hotPink },
  modalAddBtn: { flex: 1, paddingVertical: 14, borderRadius: 16, backgroundColor: KawaiiColors.hotPink, alignItems: 'center' },
  modalAddText: { fontSize: 16, fontWeight: '700', color: KawaiiColors.white },

  // Settings
  settingsContainer: { flex: 1, paddingTop: 60 },
  settingsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  backButton: { padding: 8 },
  backButtonText: { fontSize: 30, fontWeight: '600', color: KawaiiColors.hotPink },
  settingsHeaderCenter: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'center', marginLeft: 20},
  settingsLogo: { width: 28, height: 28 },
  settingsTitle: { fontSize: 24, fontWeight: '700', color: KawaiiColors.hotPink },
  settingsScroll: { flex: 1 },
  settingsScrollContent: { paddingBottom: 120 }, // Add padding to prevent bottom nav from blocking content
  settingsSection: { backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 24, padding: 20, marginBottom: 20, borderWidth: 3, borderColor: KawaiiColors.softPink },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: KawaiiColors.hotPink },
  guardianIcon: { width: 20, height: 20 },
  sectionSubtitle: { fontSize: 12, color: KawaiiColors.text, opacity: 0.7, marginBottom: 16 },
  emptyGuardians: { padding: 20, alignItems: 'center' },
  emptyText: { fontSize: 14, color: KawaiiColors.textLight },
  guardianItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: KawaiiColors.softPink },
  guardianInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  guardianEmoji: { fontSize: 20 },
  guardianName: { fontSize: 16, fontWeight: '600', color: KawaiiColors.text },
  primaryBadge: { fontSize: 10, fontWeight: '700', color: KawaiiColors.white, backgroundColor: KawaiiColors.hotPink, paddingVertical: 2, paddingHorizontal: 8, borderRadius: 8 },
  removeButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFE4E1', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: KawaiiColors.dangerPink },
  removeButtonIcon: { width: 20, height: 20 },
  removeButtonText: { fontSize: 18, color: KawaiiColors.dangerPink, fontWeight: '700' },
  infoItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: KawaiiColors.softPink },
  infoLabel: { fontSize: 14, color: KawaiiColors.text },
  infoValue: { fontSize: 14, fontWeight: '600', color: KawaiiColors.hotPink },
  dangerButton: { backgroundColor: '#FFE4E1', paddingVertical: 16, borderRadius: 16, alignItems: 'center', borderWidth: 2, borderColor: KawaiiColors.dangerPink },
  dangerButtonText: { fontSize: 16, fontWeight: '700', color: KawaiiColors.dangerPink },
  singOutButtonText: { fontSize: 16, fontWeight: '700', color: '#FFE4E1' },
  settingsFooter: { textAlign: 'center', fontSize: 10, fontWeight: '700', color: KawaiiColors.textLight, textTransform: 'uppercase', letterSpacing: 2, paddingVertical: 20 },

  // Alerting
  alertingContainer: { flex: 1, alignItems: 'center' },
  alertHeader: { flexDirection: 'row', alignItems: 'center', width: '100%', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 10 },
  alertHeaderIcon: { fontSize: 32 },
  alertHeaderTitle: { flex: 1, fontSize: 20, fontWeight: '700', color: KawaiiColors.hotPink, textAlign: 'center', marginRight: 32 },
  alertContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingBottom: 200 },
  alertTitle: { fontSize: 24, fontWeight: '700', color: KawaiiColors.hotPink, textTransform: 'uppercase', textAlign: 'center', marginTop: 10 },
  alertBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: KawaiiColors.white, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 2, borderColor: KawaiiColors.kawaiiPink, marginTop: 16 },
  pingDot: { width: 12, height: 12, marginRight: 8, justifyContent: 'center', alignItems: 'center' },
  pingDotInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: KawaiiColors.hotPink },
  alertBadgeText: { fontSize: 14, fontWeight: '700', color: KawaiiColors.hotPink },
  alertSubtext: { fontSize: 16, color: KawaiiColors.text, opacity: 0.8, textAlign: 'center', marginTop: 8, maxWidth: 280 },
  alertTimerDisplay: { marginTop: 12, alignItems: 'center' },
  alertTimerBig: { fontSize: 48, fontWeight: '900', color: KawaiiColors.hotPink },
  alertTimerLabel: { fontSize: 12, color: KawaiiColors.textLight, textTransform: 'uppercase', marginTop: 4 },
  alertBottom: { position: 'absolute', bottom: 100, left: 0, right: 0, alignItems: 'center', paddingHorizontal: 24, width: '100%', maxWidth: 400, alignSelf: 'center' },
  messagesSentAlert: { fontSize: 16, fontWeight: '600', color: KawaiiColors.hotPink, marginBottom: 40},
  falseAlarmButton: { width: '100%', aspectRatio: 1, maxHeight: 160, backgroundColor: KawaiiColors.white, borderRadius: 80, borderWidth: 4, borderColor: KawaiiColors.kawaiiPink, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 8 },
  falseAlarmStars: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  starSmall: { fontSize: 14, color: '#FFD700' },
  starLarge: { fontSize: 28, color: '#FFD700', marginHorizontal: 4 },
  falseAlarmText: { fontSize: 18, fontWeight: '900', color: KawaiiColors.text, textAlign: 'center' },
  falseAlarmHint: { fontSize: 9, fontWeight: '700', color: KawaiiColors.hotPink, textTransform: 'uppercase', letterSpacing: 1, marginTop: 6 },
  versionText: { marginTop: 16, fontSize: 10, fontWeight: '700', color: `${KawaiiColors.hotPink}60`, textTransform: 'uppercase', letterSpacing: 2 },

  // Rest
  restContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  restTitle: { fontWeight: '700', color: KawaiiColors.hotPink, marginBottom: 30 },
  ghostContainer: { marginTop: -40, marginBottom: -40 },
  restSubtext: { fontSize: 16, color: `${KawaiiColors.hotPink}99`, textAlign: 'center', marginTop: 20, marginBottom: 16, maxWidth: 280 },
  messagesSentBadge: { backgroundColor: 'rgba(255,255,255,0.8)', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 16, marginBottom: 20, borderWidth: 2, borderColor: KawaiiColors.kawaiiPink },
  messagesSentText: { fontSize: 14, fontWeight: '600', color: KawaiiColors.hotPink },
  restartButton: { backgroundColor: KawaiiColors.hotPink, paddingVertical: 16, paddingHorizontal: 32, borderRadius: 24, shadowColor: '#FF85A2', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 0, elevation: 8 },
  restartButtonText: { fontSize: 18, fontWeight: '700', color: KawaiiColors.white },
  restPlant: { fontSize: 28, marginTop: 30, opacity: 0.6 },
  restFooter: { position: 'absolute', bottom: 40, width: '100%', paddingHorizontal: 24, alignItems: 'center' },
  restProgressBar: { height: 4, width: '100%', backgroundColor: `${KawaiiColors.kawaiiPink}30`, borderRadius: 2, marginBottom: 20 },
  restProgressFill: { height: '100%', width: '100%', backgroundColor: `${KawaiiColors.kawaiiPink}60`, borderRadius: 2 },
  restFooterText: { fontSize: 10, fontWeight: '700', color: `${KawaiiColors.kawaiiPink}99`, textTransform: 'uppercase', letterSpacing: 2 },
});
