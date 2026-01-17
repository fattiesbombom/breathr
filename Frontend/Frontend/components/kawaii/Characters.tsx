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
import { KawaiiColors, KawaiiAnimations } from '@/constants/kawaii-theme';

/**
 * Ghost Character - Shown on REST screen
 * A cute floating ghost with a ribbon bow
 */
export const GhostChar: React.FC = () => {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-15, { duration: KawaiiAnimations.float / 2, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: KawaiiAnimations.float / 2, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.ghostContainer, animatedStyle]}>
      {/* Main ghost body */}
      <View style={styles.ghostBody}>
        {/* Ribbon bow on head */}
        <View style={styles.ribbonContainer}>
          <View style={styles.ribbonCenter} />
          <View style={styles.ribbonLeft} />
          <View style={styles.ribbonRight} />
        </View>
        
        {/* Face */}
        <View style={styles.ghostFace}>
          {/* Closed eyes (curved lines) */}
          <View style={styles.ghostEyesRow}>
            <View style={styles.ghostEyeClosed} />
            <View style={styles.ghostEyeClosed} />
          </View>
          {/* Blush */}
          <View style={styles.ghostBlushRow}>
            <View style={styles.ghostBlush} />
            <View style={styles.ghostBlush} />
          </View>
          {/* Mouth */}
          <View style={styles.ghostMouth} />
        </View>
        
        {/* Ghost bottom waves */}
        <View style={styles.ghostBottom}>
          <View style={styles.ghostWave} />
          <View style={styles.ghostWave} />
          <View style={styles.ghostWave} />
          <View style={styles.ghostWave} />
        </View>
      </View>
      
      {/* Shadow */}
      <View style={styles.ghostShadow} />
    </Animated.View>
  );
};

/**
 * Cloud Character - Shown on ALERTING screen
 * A crying cloud with tears
 */
export const CloudChar: React.FC = () => {
  const bounce = useSharedValue(0);
  const tearY = useSharedValue(0);
  const tearOpacity = useSharedValue(1);

  useEffect(() => {
    // Bounce animation
    bounce.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 500 }),
        withTiming(0, { duration: 500 })
      ),
      -1,
      true
    );

    // Tear drip animation
    tearY.value = withRepeat(
      withTiming(20, { duration: KawaiiAnimations.drip, easing: Easing.linear }),
      -1,
      false
    );
    tearOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 0 }),
        withTiming(0, { duration: KawaiiAnimations.drip, easing: Easing.linear })
      ),
      -1,
      false
    );
  }, []);

  const bounceStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bounce.value }],
  }));

  const tearStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: tearY.value }],
    opacity: tearOpacity.value,
  }));

  return (
    <Animated.View style={[styles.cloudContainer, bounceStyle]}>
      {/* Cloud body */}
      <View style={styles.cloudBody}>
        {/* Cloud bumps */}
        <View style={styles.cloudBumpLeft} />
        <View style={styles.cloudBumpRight} />
        
        {/* Face container */}
        <View style={styles.cloudFace}>
          {/* Eyes with tears */}
          <View style={styles.cloudEyesRow}>
            <View style={styles.cloudEye}>
              <Animated.View style={[styles.cloudTear, tearStyle]} />
            </View>
            <View style={styles.cloudEye}>
              <Animated.View style={[styles.cloudTear, { ...tearStyle }]} />
            </View>
          </View>
          {/* Sad mouth */}
          <View style={styles.cloudMouth} />
          {/* Blush */}
          <View style={styles.cloudBlushRow}>
            <View style={styles.cloudBlush} />
            <View style={styles.cloudBlush} />
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  // Ghost styles
  ghostContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  ghostBody: {
    width: 180,
    height: 200,
    backgroundColor: KawaiiColors.white,
    borderTopLeftRadius: 90,
    borderTopRightRadius: 90,
    borderWidth: 4,
    borderColor: KawaiiColors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.05,
    shadowRadius: 40,
    elevation: 10,
    position: 'relative',
  },
  ribbonContainer: {
    position: 'absolute',
    top: -10,
    right: 30,
    zIndex: 20,
  },
  ribbonCenter: {
    width: 30,
    height: 22,
    backgroundColor: KawaiiColors.kawaiiPink,
    borderRadius: 8,
    transform: [{ rotate: '-12deg' }],
    borderWidth: 2,
    borderColor: KawaiiColors.white,
  },
  ribbonLeft: {
    position: 'absolute',
    top: 4,
    left: -10,
    width: 16,
    height: 16,
    backgroundColor: KawaiiColors.kawaiiPink,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: KawaiiColors.white,
  },
  ribbonRight: {
    position: 'absolute',
    top: 4,
    right: -10,
    width: 16,
    height: 16,
    backgroundColor: KawaiiColors.kawaiiPink,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: KawaiiColors.white,
  },
  ghostFace: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 50,
  },
  ghostEyesRow: {
    flexDirection: 'row',
    gap: 40,
    marginBottom: 8,
  },
  ghostEyeClosed: {
    width: 24,
    height: 12,
    borderBottomWidth: 4,
    borderBottomColor: `${KawaiiColors.kawaiiPink}66`,
    borderRadius: 12,
  },
  ghostBlushRow: {
    flexDirection: 'row',
    gap: 55,
    marginTop: -4,
    marginBottom: 8,
  },
  ghostBlush: {
    width: 24,
    height: 12,
    backgroundColor: '#FFE4E1',
    borderRadius: 12,
    opacity: 0.8,
  },
  ghostMouth: {
    width: 16,
    height: 8,
    borderBottomWidth: 2,
    borderBottomColor: `${KawaiiColors.kawaiiPink}66`,
    borderRadius: 8,
  },
  ghostBottom: {
    position: 'absolute',
    bottom: -20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ghostWave: {
    width: 44,
    height: 44,
    backgroundColor: KawaiiColors.white,
    borderRadius: 22,
  },
  ghostShadow: {
    width: 120,
    height: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
    marginTop: 40,
  },

  // Cloud styles
  cloudContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  cloudBody: {
    width: 180,
    height: 120,
    backgroundColor: KawaiiColors.white,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: KawaiiColors.kawaiiPink,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    position: 'relative',
  },
  cloudBumpLeft: {
    position: 'absolute',
    top: -25,
    left: 20,
    width: 75,
    height: 75,
    backgroundColor: KawaiiColors.white,
    borderRadius: 40,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: KawaiiColors.kawaiiPink,
  },
  cloudBumpRight: {
    position: 'absolute',
    top: -20,
    right: 15,
    width: 90,
    height: 90,
    backgroundColor: KawaiiColors.white,
    borderRadius: 45,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: KawaiiColors.kawaiiPink,
  },
  cloudFace: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
  },
  cloudEyesRow: {
    flexDirection: 'row',
    gap: 32,
    marginBottom: 4,
  },
  cloudEye: {
    width: 16,
    height: 16,
    backgroundColor: KawaiiColors.text,
    borderRadius: 8,
    position: 'relative',
    overflow: 'visible',
  },
  cloudTear: {
    position: 'absolute',
    bottom: -2,
    left: 2,
    width: 8,
    height: 8,
    backgroundColor: '#87CEEB',
    borderRadius: 4,
  },
  cloudMouth: {
    width: 24,
    height: 12,
    borderBottomWidth: 4,
    borderBottomColor: KawaiiColors.text,
    borderRadius: 12,
    marginBottom: 4,
  },
  cloudBlushRow: {
    flexDirection: 'row',
    gap: 40,
    marginTop: 2,
  },
  cloudBlush: {
    width: 24,
    height: 12,
    backgroundColor: '#FFB6C1',
    borderRadius: 12,
    opacity: 0.6,
  },
});
