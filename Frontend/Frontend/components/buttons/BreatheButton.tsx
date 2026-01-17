import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { KawaiiColors } from '@/constants/kawaii-theme';

interface BreatheButtonProps {
  onPress: () => void;
  supportMessage: string;
  isLoading: boolean;
  size: number;
}

export const BreatheButton: React.FC<BreatheButtonProps> = ({ 
  onPress, 
  supportMessage, 
  isLoading, 
  size 
}) => {
  const pulse = useSharedValue(1);
  const rotation = useSharedValue(0);
  const [isPressed, setIsPressed] = useState(false);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1, true
    );
    rotation.value = withRepeat(withTiming(360, { duration: 20000, easing: Easing.linear }), -1, false);
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  const rotateStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));

  const ringSize = size + 50;
  const dashedSize = size + 30;
  const pressedColor = '#F597B8';

  return (
    <View style={[styles.breatheContainer, { width: ringSize, height: ringSize }]}>
      <Animated.View style={[styles.pulseRing, pulseStyle, { width: ringSize, height: ringSize, borderRadius: ringSize / 2 }]} />
      <Animated.View style={[styles.dashedBorder, rotateStyle, { width: dashedSize, height: dashedSize, borderRadius: dashedSize / 2 }]} />
      
      <TouchableOpacity
        style={[
          styles.breatheButton, 
          { 
            width: size, 
            height: size, 
            borderRadius: size / 2,
            backgroundColor: isPressed ? pressedColor : KawaiiColors.primaryPink
          }
        ]}
        onPress={onPress}
        onPressIn={() => { 
          pulse.value = withSpring(0.95);
          setIsPressed(true);
        }}
        onPressOut={() => { 
          pulse.value = withSpring(1);
          setIsPressed(false);
        }}
        activeOpacity={1}
      >
        <View style={styles.buttonFace}>
          <View style={styles.buttonEyesRow}>
            <View style={styles.buttonEye} />
            <View style={styles.buttonEye} />
          </View>
          <View style={styles.buttonSmile} />
        </View>
        <Text style={[styles.breatheButtonText, { fontSize: size * 0.09 }]}>I BREATHE</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  breatheContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  pulseRing: {
    position: 'absolute',
    backgroundColor: `${KawaiiColors.primaryPink}20`,
  },
  dashedBorder: {
    position: 'absolute',
    borderWidth: 4,
    borderStyle: 'dashed',
    borderColor: `${KawaiiColors.primaryPink}40`,
  },
  breatheButton: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF85A2',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 20,
  },
  buttonFace: {
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonEyesRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 8,
  },
  buttonEye: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: KawaiiColors.white,
  },
  buttonSmile: {
    width: 40,
    height: 16,
    borderBottomWidth: 4,
    borderBottomColor: KawaiiColors.white,
    borderRadius: 20,
  },
  breatheButtonText: {
    fontWeight: '900',
    color: KawaiiColors.white,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 8,
  },
});
