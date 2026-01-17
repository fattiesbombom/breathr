require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Supabase clients
// Service role client (bypasses RLS) - for server-side operations
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Anon client - for user operations
const supabaseAnon = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Available user icons (from assets/user icons folder)
const USER_ICONS = [
  'Screenshot 2026-01-16 at 10.39.44ΓÇ»PM.png',
  'Screenshot 2026-01-16 at 10.39.51ΓÇ»PM.png',
  'Screenshot 2026-01-16 at 10.40.00ΓÇ»PM.png',
  'Screenshot 2026-01-16 at 10.40.19ΓÇ»PM.png',
  'Screenshot 2026-01-16 at 10.40.26ΓÇ»PM.png',
  'Screenshot 2026-01-16 at 10.40.41ΓÇ»PM.png',
  'Screenshot 2026-01-16 at 10.41.02ΓÇ»PM.png',
  'Screenshot 2026-01-16 at 10.41.09ΓÇ»PM.png',
  'Screenshot 2026-01-16 at 10.41.17ΓÇ»PM.png',
  'Screenshot 2026-01-16 at 10.41.54ΓÇ»PM.png',
];

// Function to randomly select a user icon
function getRandomUserIcon() {
  return USER_ICONS[Math.floor(Math.random() * USER_ICONS.length)];
}

// Ensure user has an icon assigned
async function ensureUserIcon(userId, existingIcon) {
  if (existingIcon) return existingIcon;
  const newIcon = getRandomUserIcon();
  const { data } = await supabaseAdmin
    .from('profiles')
    .update({ user_icon: newIcon })
    .eq('id', userId)
    .select('user_icon')
    .single();
  return data?.user_icon || newIcon;
}

// Middleware
app.use(cors());
app.use(express.json());

// ============================================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================================

/**
 * Middleware to verify Supabase JWT token and get user
 */
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify token and get user
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

/**
 * Middleware to check if user has completed onboarding (has guardian_username)
 * If not, block access to main app features
 */
const checkOnboardingComplete = async (req, res, next) => {
  try {
    const { data: userProfile, error } = await supabaseAdmin
      .from('profiles')
      .select('guardian_username')
      .eq('id', req.user.id)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return res.status(500).json({ error: 'Failed to fetch user profile' });
    }

    // Check if guardian_username is set
    if (!userProfile || !userProfile.guardian_username) {
      return res.status(403).json({ 
        error: 'Onboarding incomplete',
        requiresOnboarding: true,
        message: 'Please set your guardian username before accessing this feature'
      });
    }

    // User has completed onboarding, proceed
    req.userProfile = userProfile;
    next();
  } catch (error) {
    console.error('Onboarding check error:', error);
    return res.status(500).json({ error: 'Failed to check onboarding status' });
  }
};

// ============================================================================
// AUTHENTICATION ENDPOINTS
// ============================================================================

/**
 * POST /auth/login
 * Login with email and password
 */
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password, username, identifier } = req.body;

    const loginId = (email || identifier || username || '').trim();
    if (!loginId || !password) {
      return res.status(400).json({ error: 'Email/username and password are required' });
    }

    // Allow login by username or email
    let emailToUse = loginId;
    if (!loginId.includes('@')) {
      const { data: userRow, error: lookupError } = await supabaseAdmin
        .from('profiles')
        .select('email')
        .eq('username', loginId)
        .single();

      if (lookupError || !userRow?.email) {
        return res.status(401).json({ error: 'Invalid login credentials' });
      }

      emailToUse = userRow.email;
    }

    // Sign in with Supabase Auth
    const { data, error } = await supabaseAnon.auth.signInWithPassword({
      email: emailToUse,
      password,
    });

    if (error) {
      return res.status(401).json({ error: error.message });
    }

    // Get user profile including guardian_username
    const { data: userProfile } = await supabaseAdmin
      .from('profiles')
      .select('guardian_username, username, age, user_icon, death_count')
      .eq('id', data.user.id)
      .single();

    const userIcon = userProfile?.user_icon || null;
    console.log('🔐 Login - User icon from DB:', { userId: data.user.id, userIcon, userIconType: typeof userIcon });

    res.json({
      user: {
        ...data.user,
        guardian_username: userProfile?.guardian_username || null,
        username: userProfile?.username || null,
        age: userProfile?.age || null,
        user_icon: userIcon,
        death_count: userProfile?.death_count || 0,
      },
      session: data.session,
      onboardingComplete: !!userProfile?.guardian_username,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * POST /auth/forgot-password
 * Request password reset email
 */
app.post('/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Send password reset email
    const { data, error } = await supabaseAnon.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:8081'}/reset-password`,
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Always return success (for security - don't reveal if email exists)
    res.json({ 
      message: 'If an account exists with this email, a password reset link has been sent.',
      success: true 
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to send reset email' });
  }
});

/**
 * POST /auth/reset-password
 * Reset password with token from email link
 * Note: Supabase handles password reset via email link redirect
 * This endpoint is for manual reset if needed
 */
app.post('/auth/reset-password', async (req, res) => {
  try {
    const { password, token } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    // If token is provided, use it to update password
    if (token) {
      const { data, error } = await supabaseAnon.auth.updateUser({
        password: password,
      }, {
        access_token: token,
      });

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      return res.json({ 
        message: 'Password reset successfully. You can now sign in with your new password.',
        success: true 
      });
    }

    // If no token, user needs to use the email link
    return res.status(400).json({ 
      error: 'Please use the password reset link sent to your email.' 
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

/**
 * POST /auth/signup
 * Register new user
 */
app.post('/auth/signup', async (req, res) => {
  try {
    const { email, password, username, age } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Check if username already exists
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('profiles')
      .select('username')
      .eq('username', username)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned (username available)
      console.error('Error checking username:', checkError);
      // Continue anyway - let database constraint handle it
    }

    if (existingUser) {
      return res.status(409).json({ 
        error: 'Username already taken. Please choose a different username.',
        usernameTaken: true
      });
    }

    // Sign up with Supabase Auth
    // Note: If email confirmation is enabled, session will be null
    const { data, error } = await supabaseAnon.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username,
          age: age ? parseInt(age) : null,
          display_name: username, // Save username as display name
          full_name: username, // Also save as full name
        }
      }
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Update user profile with username and age
    if (data.user) {
      // Update the user's metadata in auth.users to set display name
      const { error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(
        data.user.id,
        {
          user_metadata: {
            username: username,
            age: age ? parseInt(age) : null,
            display_name: username,
            full_name: username,
          }
        }
      );

      if (metadataError) {
        console.error('Error updating user metadata:', metadataError);
      }

      // Assign random user icon
      const randomIcon = getRandomUserIcon();

      // Update the public.profiles table
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ 
          username: username,
          age: age ? parseInt(age) : null,
          user_icon: randomIcon
        })
        .eq('id', data.user.id);

      if (updateError) {
        console.error('Error updating user profile:', updateError);
        // Continue anyway - profile was created by trigger
      }
    }

    // If session is null, email confirmation is required
    if (!data.session) {
      return res.status(200).json({
        user: data.user,
        session: null,
        requiresEmailConfirmation: true,
        message: 'Please check your email to confirm your account before signing in.',
        onboardingComplete: false,
      });
    }

    // Get the user profile to include user_icon
    const { data: userProfile } = await supabaseAdmin
      .from('profiles')
      .select('user_icon, username, age')
      .eq('id', data.user.id)
      .single();

    res.json({
      user: {
        ...data.user,
        user_icon: userProfile?.user_icon,
        username: userProfile?.username,
        age: userProfile?.age,
      },
      session: data.session,
      requiresEmailConfirmation: false,
      onboardingComplete: false, // New users need to set guardian_username
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Signup failed' });
  }
});

/**
 * POST /auth/logout
 * Logout user
 */
app.post('/auth/logout', authenticateUser, async (req, res) => {
  try {
    const { error } = await supabaseAdmin.auth.signOut();
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// ============================================================================
// USER PROFILE ENDPOINTS
// ============================================================================

/**
 * GET /auth/me
 * Get current user profile with all details
 */
app.get('/auth/me', authenticateUser, async (req, res) => {
  try {
    let userProfile = null;
    let deathCount = 0;
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, email, display_name, death_count')
      .eq('id', req.user.id)
      .single();

    if (error && error.code === '42703') {
      const { data: fallback } = await supabaseAdmin
        .from('profiles')
        .select('id, email, display_name')
        .eq('id', req.user.id)
        .single();
      userProfile = fallback || null;
    } else if (error) {
      return res.status(500).json({ error: 'Failed to fetch user profile' });
    } else {
      userProfile = data;
      deathCount = data?.death_count || 0;
    }

    // Fetch additional user data from profiles table
    const { data: userData } = await supabaseAdmin
      .from('profiles')
      .select('user_icon, username, age, guardian_username')
      .eq('id', req.user.id)
      .single();

    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        display_name: userProfile?.display_name || null,
        username: userData?.username || null,
        age: userData?.age || null,
        death_count: deathCount,
        user_icon: userData?.user_icon || null,
        guardian_username: userData?.guardian_username || null,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

/**
 * POST /auth/increment-death
 * Increment death_count for the current profile
 */
app.post('/auth/increment-death', authenticateUser, async (req, res) => {
  try {
    const { data: current, error: selectError } = await supabaseAdmin
      .from('profiles')
      .select('death_count')
      .eq('id', req.user.id)
      .single();

    if (selectError) {
      if (selectError.code === '42703') {
        return res.status(400).json({
          error: 'profiles.death_count does not exist. Add the column to enable death counting.',
        });
      }
      return res.status(500).json({ error: 'Failed to load death count' });
    }

    const nextCount = (current?.death_count || 0) + 1;
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ death_count: nextCount })
      .eq('id', req.user.id)
      .select('death_count')
      .single();

    if (error) {
      console.error('Increment death error:', error);
      return res.status(500).json({ error: 'Failed to increment death count' });
    }

    res.json({ death_count: data?.death_count || nextCount });
  } catch (error) {
    console.error('Increment death error:', error);
    res.status(500).json({ error: 'Failed to increment death count' });
  }
});

/**
 * POST /auth/update-icon
 * Update user icon
 */
app.post('/auth/update-icon', authenticateUser, async (req, res) => {
  try {
    const { user_icon } = req.body;

    if (!user_icon) {
      return res.status(400).json({ error: 'user_icon is required' });
    }

    // Validate that the icon is one of the available icons
    // Handle encoding issues with special characters
    const normalizedIcon = user_icon.trim();
    
    // Try to find matching icon - be more lenient with encoding
    let matchedIcon = null;
    for (const icon of USER_ICONS) {
      // Exact match
      if (icon === normalizedIcon || icon.trim() === normalizedIcon) {
        matchedIcon = icon;
        break;
      }
      // Normalized comparison (remove any potential encoding differences)
      const iconNormalized = icon.trim().replace(/\s+/g, ' ');
      const receivedNormalized = normalizedIcon.replace(/\s+/g, ' ');
      if (iconNormalized === receivedNormalized) {
        matchedIcon = icon;
        break;
      }
      // Check if filenames match (more lenient)
      if (icon.endsWith('.png') && normalizedIcon.endsWith('.png')) {
        const iconBase = icon.split('/').pop() || icon;
        const receivedBase = normalizedIcon.split('/').pop() || normalizedIcon;
        if (iconBase === receivedBase || icon.includes(receivedBase) || receivedBase.includes(iconBase)) {
          matchedIcon = icon;
          break;
        }
      }
    }

    if (!matchedIcon) {
      console.error('Invalid icon received:', { 
        received: user_icon, 
        normalized: normalizedIcon,
        receivedLength: normalizedIcon.length,
        available: USER_ICONS,
        availableSample: USER_ICONS[0],
        sampleLength: USER_ICONS[0]?.length
      });
      return res.status(400).json({ error: 'Invalid user icon. Please select from available options.' });
    }

    // Update the user icon in the profiles table (use matched icon from validation)
    const iconToSave = matchedIcon || normalizedIcon;
    console.log('💾 Saving icon to database:', { userId: req.user.id, icon: iconToSave });
    
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ user_icon: iconToSave })
      .eq('id', req.user.id)
      .select('user_icon')
      .single();

    if (error) {
      console.error('❌ Update icon database error:', error);
      return res.status(500).json({ error: `Failed to update user icon: ${error.message}` });
    }

    if (!data) {
      console.error('❌ User not found after icon update');
      return res.status(404).json({ error: 'User not found' });
    }

    const iconToReturn = data.user_icon || iconToSave || normalizedIcon;
    console.log('✅ Icon saved successfully:', { savedIcon: iconToReturn, databaseIcon: data.user_icon });
    res.json({ user_icon: iconToReturn });
  } catch (error) {
    console.error('Update icon error:', error);
    res.status(500).json({ error: `Failed to update user icon: ${error.message}` });
  }
});

// ============================================================================
// ONBOARDING ENDPOINTS
// ============================================================================

/**
 * GET /auth/status
 * Check authentication and onboarding status
 */
app.get('/auth/status', authenticateUser, async (req, res) => {
  try {
    let userProfile = null;
    let deathCount = 0;
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('email, display_name, death_count')
      .eq('id', req.user.id)
      .single();

    if (error && error.code === '42703') {
      const { data: fallback } = await supabaseAdmin
        .from('profiles')
        .select('email, display_name')
        .eq('id', req.user.id)
        .single();
      userProfile = fallback || null;
    } else if (error) {
      console.error('Error fetching user profile:', error);
      return res.status(500).json({ error: 'Failed to fetch user profile' });
    } else {
      userProfile = data;
      deathCount = data?.death_count || 0;
    }

    // Fetch user icon from profiles table
    let userIcon = null;
    let guardianUsername = null;
    const { data: userData } = await supabaseAdmin
      .from('profiles')
      .select('user_icon, guardian_username, username, age')
      .eq('id', req.user.id)
      .single();
    
    if (userData) {
      userIcon = userData.user_icon || null;
      guardianUsername = userData.guardian_username || null;
      console.log('📊 Status check - User icon from DB:', { userId: req.user.id, userIcon, userIconType: typeof userIcon });
    }

    res.json({
      user: {
        ...req.user,
        email: userProfile?.email,
        username: userData?.username || userProfile?.display_name || null,
        age: userData?.age || null,
        death_count: deathCount,
        user_icon: userIcon,
        guardian_username: guardianUsername,
      },
      onboardingComplete: !!guardianUsername,
      guardianUsername: guardianUsername,
    });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ error: 'Failed to check status' });
  }
});

/**
 * POST /onboarding/set-guardian
 * Set guardian username (onboarding step)
 * This endpoint is accessible even if onboarding is incomplete
 */
app.post('/onboarding/set-guardian', authenticateUser, async (req, res) => {
  try {
    const { guardian_username } = req.body;

    if (!guardian_username || guardian_username.trim() === '') {
      return res.status(400).json({ error: 'Guardian username is required' });
    }

    // Update user profile
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ 
        guardian_username: guardian_username.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating guardian username:', error);
      return res.status(500).json({ error: 'Failed to set guardian username' });
    }

    res.json({
      message: 'Guardian username set successfully',
      user: data,
      onboardingComplete: true,
    });
  } catch (error) {
    console.error('Set guardian error:', error);
    res.status(500).json({ error: 'Failed to set guardian username' });
  }
});

// ============================================================================
// USER SEARCH ENDPOINT
// ============================================================================

/**
 * GET /users/search
 * Search for users by email or username
 * Requires authentication and completed onboarding
 */
app.get('/users/search', authenticateUser, async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim() === '') {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const trimmedQuery = query.trim();
    const searchTerm = `%${trimmedQuery.toLowerCase()}%`;

    // Search users by email (case-insensitive)
    const { data: users, error } = await supabaseAdmin
      .from('profiles')
      .select('id, email, username, guardian_username, death_count, user_icon, created_at')
      .or(`email.ilike.${searchTerm},username.ilike.${searchTerm},guardian_username.ilike.${searchTerm}`)
      .neq('id', req.user.id) // Exclude current user
      .limit(20);

    if (error) {
      console.error('Search error:', error);
      return res.status(500).json({ error: 'Search failed' });
    }

    // Also search auth.users metadata for display_name/username/full_name
    let authMatches = [];
    try {
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });
      if (authError) {
        console.error('Auth user list error:', authError);
      } else {
        const queryLower = trimmedQuery.toLowerCase();
        authMatches = (authData?.users || []).filter((authUser) => {
          if (authUser.id === req.user.id) return false;
          const displayName = (authUser.user_metadata?.display_name || authUser.user_metadata?.username || authUser.user_metadata?.full_name || '').toLowerCase();
          const email = (authUser.email || '').toLowerCase();
          return displayName.includes(queryLower) || email.includes(queryLower);
        });
      }
    } catch (authListError) {
      console.error('Auth list error:', authListError);
    }

    const displayNameMap = new Map(
      authMatches.map((authUser) => [
        authUser.id,
        authUser.user_metadata?.display_name || authUser.user_metadata?.username || authUser.user_metadata?.full_name || null,
      ])
    );

    const baseUsers = users || [];
    const baseUserIds = new Set(baseUsers.map((u) => u.id));
    const extraIds = authMatches.map((u) => u.id).filter((id) => !baseUserIds.has(id));

    let extraUsers = [];
    if (extraIds.length > 0) {
      const { data: extraData, error: extraError } = await supabaseAdmin
        .from('profiles')
        .select('id, email, username, guardian_username, death_count, user_icon, created_at')
        .in('id', extraIds)
        .limit(20);
      if (extraError) {
        console.error('Extra search error:', extraError);
      } else {
        extraUsers = extraData || [];
      }
    }

    const merged = [...baseUsers, ...extraUsers].map((user) => ({
      ...user,
      display_name: displayNameMap.get(user.id) || null,
    }));

    const uniqueById = [];
    const seenIds = new Set();
    for (const user of merged) {
      if (seenIds.has(user.id)) continue;
      seenIds.add(user.id);
      uniqueById.push(user);
    }

    res.json({
      users: uniqueById.slice(0, 20),
      count: uniqueById.length || 0,
    });
  } catch (error) {
    console.error('User search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// ============================================================================
// PROFILES SEARCH ENDPOINT
// ============================================================================

/**
 * GET /profiles/search
 * Search for users by display_name in profiles table (case-insensitive)
 */
app.get('/profiles/search', authenticateUser, async (req, res) => {
  try {
    const { query } = req.query;
    const trimmedQuery = (query || '').trim();

    if (!trimmedQuery) {
      return res.json({ users: [], count: 0 });
    }

    const searchTerm = `%${trimmedQuery}%`;
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('id, display_name, email')
      .ilike('display_name', searchTerm)
      .limit(10);

    if (error) {
      console.error('Profiles search error:', error);
      return res.status(500).json({ error: 'Search failed' });
    }

    // Fetch user icons and usernames from profiles table
    const profileIds = (profiles || []).map(p => p.id);
    let usersData = {};
    
    if (profileIds.length > 0) {
      const { data: users, error: usersError } = await supabaseAdmin
        .from('profiles')
        .select('id, username, user_icon')
        .in('id', profileIds);
      
      if (!usersError && users) {
        users.forEach(u => {
          usersData[u.id] = { username: u.username, user_icon: u.user_icon };
        });
      }
    }

    // Merge profile data with user data
    const usersWithIcons = (profiles || []).map(profile => ({
      id: profile.id,
      display_name: profile.display_name,
      email: profile.email,
      username: usersData[profile.id]?.username || null,
      user_icon: usersData[profile.id]?.user_icon || null,
    }));

    res.json({ users: usersWithIcons, count: usersWithIcons.length });
  } catch (error) {
    console.error('Profiles search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// ============================================================================
// FRIENDS & LEADERBOARD ENDPOINTS
// ============================================================================

/**
 * POST /friends/request
 * Send a friend request
 */
app.post('/friends/request', authenticateUser, async (req, res) => {
  try {
    const { receiver_id, receiver_email } = req.body;

    if (!receiver_id && !receiver_email) {
      return res.status(400).json({ error: 'receiver_id or receiver_email is required' });
    }
    if (receiver_id === req.user.id) {
      return res.status(400).json({ error: 'Cannot add yourself as a friend' });
    }

    // Resolve receiver_id against profiles table
    let resolvedReceiverId = receiver_id;
    if (receiver_email) {
      const { data: profileByEmail } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .ilike('email', receiver_email)
        .single();
      if (profileByEmail?.id) {
        resolvedReceiverId = profileByEmail.id;
      }
    }

    const { data: receiverProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', resolvedReceiverId)
      .single();

    if (!receiverProfile) {
      return res.status(404).json({ error: 'Receiver not found' });
    }

    if (resolvedReceiverId === req.user.id) {
      return res.status(400).json({ error: 'Cannot add yourself as a friend' });
    }

    const { data: existing, error: existingError } = await supabaseAdmin
      .from('friendships')
      .select('id, status, requester_id, receiver_id')
      .or(`and(requester_id.eq.${req.user.id},receiver_id.eq.${resolvedReceiverId}),and(requester_id.eq.${resolvedReceiverId},receiver_id.eq.${req.user.id})`)
      .limit(1);

    if (existingError) {
      console.error('Friend request lookup error:', existingError);
      if (existingError.code === '42P01') {
        return res.status(500).json({ error: 'Friendships table does not exist. Please apply the schema.' });
      }
      return res.status(500).json({ error: 'Failed to check existing friendship', details: existingError.message });
    }

    if (existing && existing.length > 0) {
      return res.status(409).json({ error: 'Friendship already exists or pending', friendship: existing[0] });
    }

    const { data: friendship, error } = await supabaseAdmin
      .from('friendships')
      .insert({
        requester_id: req.user.id,
        receiver_id: resolvedReceiverId,
        status: 'pending',
      })
      .select('*')
      .single();

    if (error) {
      console.error('Friend request error:', error);
      return res.status(500).json({ error: 'Failed to create friend request' });
    }

    res.json({ friendship });
  } catch (error) {
    console.error('Friend request error:', error);
    res.status(500).json({ error: 'Failed to create friend request' });
  }
});

/**
 * GET /friends/requests
 * Get incoming pending friend requests
 */
app.get('/friends/requests', authenticateUser, async (req, res) => {
  try {
    const receiverIds = new Set([req.user.id]);
    if (req.user.email) {
      const { data: profileByEmail } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', req.user.email)
        .single();
      if (profileByEmail?.id) receiverIds.add(profileByEmail.id);
    }

    const { data: requests, error } = await supabaseAdmin
      .from('friendships')
      .select('id, requester_id, receiver_id, status, created_at')
      .eq('status', 'pending')
      .in('receiver_id', Array.from(receiverIds));

    console.log('🔎 friend requests lookup', {
      authId: req.user.id,
      email: req.user.email,
      receiverIds: Array.from(receiverIds),
      count: requests?.length || 0,
    });

    if (error) {
      console.error('Fetch requests error:', error);
      return res.status(500).json({ error: 'Failed to fetch requests' });
    }

    const requesterIds = (requests || []).map((row) => row.requester_id);
    if (requesterIds.length === 0) {
      return res.json({ requests: [], count: 0 });
    }

    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, display_name, email')
      .in('id', requesterIds);

    if (profilesError) {
      console.error('Profiles lookup error:', profilesError);
      return res.status(500).json({ error: 'Failed to fetch requester profiles' });
    }

    // Fetch user icons and usernames from profiles table
    let usersData = {};
    if (requesterIds.length > 0) {
      const { data: users, error: usersError } = await supabaseAdmin
        .from('profiles')
        .select('id, username, user_icon')
        .in('id', requesterIds);
      
      if (!usersError && users) {
        users.forEach(u => {
          usersData[u.id] = { username: u.username, user_icon: u.user_icon };
        });
      }
    }

    const allUsers = (profiles || []).map((profile) => ({
      id: profile.id,
      email: profile.email,
      username: usersData[profile.id]?.username || profile.display_name || null,
      display_name: profile.display_name || null,
      user_icon: usersData[profile.id]?.user_icon || null,
    }));
    const merged = (requests || []).map((reqRow) => {
      const requester = allUsers.find((u) => u.id === reqRow.requester_id);
      return {
        ...reqRow,
        requester,
      };
    });

    res.json({ requests: merged, count: merged.length });
  } catch (error) {
    console.error('Fetch requests error:', error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

/**
 * POST /friends/respond
 * Accept or reject a friend request
 */
app.post('/friends/respond', authenticateUser, async (req, res) => {
  try {
    const { requester_id, action } = req.body;

    if (!requester_id || !action) {
      return res.status(400).json({ error: 'requester_id and action are required' });
    }
    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'action must be accept or reject' });
    }

    const receiverIds = new Set([req.user.id]);
    if (req.user.email) {
      const { data: profileByEmail } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', req.user.email)
        .single();
      if (profileByEmail?.id) receiverIds.add(profileByEmail.id);
    }

    if (action === 'reject') {
      const { error } = await supabaseAdmin
        .from('friendships')
        .delete()
        .eq('requester_id', requester_id)
        .in('receiver_id', Array.from(receiverIds))
        .eq('status', 'pending');

      if (error) {
        console.error('Respond request error:', error);
        return res.status(500).json({ error: 'Failed to update request' });
      }

      return res.json({ deleted: true });
    }

    const { data: friendship, error } = await supabaseAdmin
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('requester_id', requester_id)
      .in('receiver_id', Array.from(receiverIds))
      .eq('status', 'pending')
      .select('*')
      .single();

    if (error) {
      console.error('Respond request error:', error);
      return res.status(500).json({ error: 'Failed to update request' });
    }

    res.json({ friendship });
  } catch (error) {
    console.error('Respond request error:', error);
    res.status(500).json({ error: 'Failed to update request' });
  }
});

/**
 * GET /friends/accepted
 * Get accepted friends sorted by death_count desc
 */
app.get('/friends/accepted', authenticateUser, async (req, res) => {
  try {
    const receiverIds = new Set([req.user.id]);
    if (req.user.email) {
      const { data: profileByEmail } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', req.user.email)
        .single();
      if (profileByEmail?.id) receiverIds.add(profileByEmail.id);
    }

    const receiverIdsList = Array.from(receiverIds).join(',');
    const { data: friendships, error } = await supabaseAdmin
      .from('friendships')
      .select('requester_id, receiver_id, status')
      .eq('status', 'accepted')
      .or(`requester_id.in.(${receiverIdsList}),receiver_id.in.(${receiverIdsList})`);

    if (error) {
      console.error('Fetch friends error:', error);
      return res.status(500).json({ error: 'Failed to fetch friends' });
    }

    const friendIds = (friendships || []).map((row) =>
      receiverIds.has(row.requester_id) ? row.receiver_id : row.requester_id
    );

    if (friendIds.length === 0) {
      return res.json({ friends: [], count: 0 });
    }

    let friends = [];
    const { data: friendsWithDeath, error: friendsError } = await supabaseAdmin
      .from('profiles')
      .select('id, display_name, email, death_count')
      .in('id', friendIds);

    if (friendsError && friendsError.code === '42703') {
      const { data: friendsFallback, error: fallbackError } = await supabaseAdmin
        .from('profiles')
        .select('id, display_name, email')
        .in('id', friendIds);
      if (fallbackError) {
        console.error('Fetch friend profiles error:', fallbackError);
        return res.status(500).json({ error: 'Failed to fetch friend profiles' });
      }
      friends = friendsFallback || [];
    } else if (friendsError) {
      console.error('Fetch friend profiles error:', friendsError);
      return res.status(500).json({ error: 'Failed to fetch friend profiles' });
    } else {
      friends = friendsWithDeath || [];
    }

    // Fetch user icons, usernames, and guardian_username from profiles table
    const friendUserIds = friends.map(f => f.id);
    let usersData = {};
    
    if (friendUserIds.length > 0) {
      const { data: users, error: usersError } = await supabaseAdmin
        .from('profiles')
        .select('id, username, user_icon, guardian_username')
        .in('id', friendUserIds);
      
      if (!usersError && users) {
        users.forEach(u => {
          usersData[u.id] = { username: u.username, user_icon: u.user_icon, guardian_username: u.guardian_username };
        });
      }
    }

    const normalized = (friends || []).map((friend) => ({
      id: friend.id,
      username: usersData[friend.id]?.username || friend.display_name || null,
      display_name: friend.display_name || null,
      email: friend.email || null,
      death_count: friend.death_count || 0,
      user_icon: usersData[friend.id]?.user_icon || null,
      guardian_username: usersData[friend.id]?.guardian_username || null,
    }));
    res.json({ friends: normalized, count: normalized.length });
  } catch (error) {
    console.error('Fetch friends error:', error);
    res.status(500).json({ error: 'Failed to fetch friends' });
  }
});

// ============================================================================
// PROTECTED ENDPOINTS (Example)
// ============================================================================

/**
 * GET /api/profile
 * Get user profile (requires onboarding)
 */
app.get('/api/profile', authenticateUser, checkOnboardingComplete, async (req, res) => {
  try {
    const { data: userProfile, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch profile' });
    }

    res.json({ profile: userProfile });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
});
