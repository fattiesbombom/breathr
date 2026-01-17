import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

export const AnimatedPepeDie: React.FC = () => {
  const translateY = useSharedValue(0);
  
  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-20, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: translateY.value },
      ],
    };
  });
  
  return (
    <View style={styles.ghostContainer}>
      <Animated.Image
        source={require('@/assets/images/pepedie.png')}
        style={[
          { width: 300, height: 300 },
          animatedStyle
        ]}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  ghostContainer: {
    marginTop: -40,
    marginBottom: -40,
  },
});
