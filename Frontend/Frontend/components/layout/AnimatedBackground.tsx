import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';

interface AnimatedBackgroundProps {
  children: React.ReactNode;
  variant?: 'dots' | 'gradient';
}

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ 
  children, variant = 'dots' 
}) => {
  const colorProgress = useSharedValue(0);

  useEffect(() => {
    if (variant === 'gradient') {
      colorProgress.value = 0;
    } else {
      colorProgress.value = 0;
    }
    
    return () => {
      colorProgress.value = 0;
    };
  }, [variant]);

  const animatedStyle = useAnimatedStyle(() => {
    if (variant === 'gradient') {
      return { backgroundColor: '#FFF0F5' };
    }
    return {};
  });

  return (
    <Animated.View style={[styles.background, variant === 'dots' ? styles.doodleBg : styles.gradientBg, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  doodleBg: {
    backgroundColor: '#FFF0F5',
  },
  gradientBg: {
    backgroundColor: '#FFF0F5',
  },
});
