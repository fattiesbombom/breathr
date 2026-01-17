/**
 * Kawaii Theme - Garden State Safety
 * Beautiful pink pastel colors for a calming, cute experience
 */

export const KawaiiColors = {
  // Primary pinks
  primaryPink: '#FFB7CE',
  softPink: '#FFE4E1',
  hotPink: '#FF1493',
  kawaiiPink: '#FFB6C1',
  dangerPink: '#FF6B8B',
  
  // Accent colors
  kawaiiLavender: '#F3E5F5',
  lavender: '#E6E6FA',
  cream: '#FFF9F0',
  safetyBlue: '#B0E0E6',
  
  // Text colors
  text: '#8B446D',
  textLight: '#8B446D80',
  
  // UI colors
  white: '#FFFFFF',
  shadow: 'rgba(0, 0, 0, 0.1)',
  
  // Status colors
  safe: '#34C759',
  warning: '#FF9500',
};

// Gradient backgrounds
export const KawaiiGradients = {
  main: ['#F3E5F5', '#E6E6FA'],
  pulse: ['#FFF0F5', '#FFC0CB'],
};

// Doodle background pattern (dots)
export const DoodleBackground = {
  backgroundColor: KawaiiColors.cream,
  dotColor: KawaiiColors.primaryPink,
  dotSize: 2,
  dotSpacing: 40,
};

// Shadows
export const KawaiiShadows = {
  button: {
    shadowColor: '#FF85A2',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 20,
  },
  card: {
    shadowColor: KawaiiColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  soft: {
    shadowColor: KawaiiColors.primaryPink,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 4,
  },
};

// Border radii
export const KawaiiBorderRadius = {
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  full: 9999,
};

// Animation durations
export const KawaiiAnimations = {
  float: 4000,
  pulse: 3000,
  bounce: 2000,
  drip: 1500,
  spin: 20000,
};
