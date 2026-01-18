// Configuration file for the Telegram Alert App
// Values are loaded from environment variables (see .env file)
// For Expo, environment variables must be prefixed with EXPO_PUBLIC_

// Your computer's local IP address
// Find it by running: ipconfig (Windows) or ifconfig (Mac/Linux)
// Look for IPv4 Address (e.g., 192.168.1.5 or 10.91.88.113)
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
export const SUPABASE_API_URL = process.env.EXPO_PUBLIC_SUPABASE_API_URL;

// Supabase configuration
// Note: The frontend doesn't connect to Supabase directly - it uses the backend API
// The backend server (Backend/supabase-server) handles all Supabase connections
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';

export const BOT_USERNAME = process.env.EXPO_PUBLIC_BOT_USERNAME || 'PanicBreatheBot'; 

export const DEFAULT_MESSAGE = 'I AM DYING';

