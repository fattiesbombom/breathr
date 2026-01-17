import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { AnimatedBackground } from '@/components/layout/AnimatedBackground';
import { KawaiiColors } from '@/constants/kawaii-theme';
import { useResponsive } from '@/utils/responsive';

export const LoadingScreen: React.FC = () => {
  const responsive = useResponsive();
  const spin = useSharedValue(0);
  
  useEffect(() => {
    spin.value = withRepeat(
      withTiming(360, { duration: 2000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${spin.value}deg` }],
    };
  });
  
  return (
    <AnimatedBackground variant="gradient">
      <View style={styles.centerContainer}>
        <Animated.Image
          source={require('@/assets/images/pepe.png')}
          style={[
            { width: 100, height: 100 },
            animatedStyle
          ]}
        />
        <Text style={styles.loadingText}>Checking authentication...</Text>
      </View>
    </AnimatedBackground>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: KawaiiColors.text,
    fontWeight: '500',
  },
});
