import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Image } from 'react-native';
import { KawaiiColors } from '@/constants/kawaii-theme';

interface BottomNavbarProps {
  onAddGuardian: () => void;
  onSettings: () => void;
  onFriends: () => void;
  onLeaderboard?: () => void;
  isShort: boolean;
}

export const BottomNavbar: React.FC<BottomNavbarProps> = ({ 
  onAddGuardian, 
  onSettings, 
  onFriends, 
  onLeaderboard, 
  isShort 
}) => (
  <View style={[styles.bottomNav, { height: isShort ? 75 : 90 }]}>
    <TouchableOpacity style={styles.navItem} onPress={onLeaderboard || (() => {})}>
      <Image
        source={require('@/assets/images/leaderboard01.png')} 
        style={styles.navIconImage}
        resizeMode="contain"
      />
    </TouchableOpacity>

    <TouchableOpacity style={styles.navItem} onPress={onFriends}>
      <Image
        source={require('@/assets/images/friend.png')}
        style={styles.navIconImage}
        resizeMode="contain"
      />
    </TouchableOpacity>
    
    <TouchableOpacity style={styles.navItemAdd} onPress={onAddGuardian}>
      <View style={styles.addButton}>
        <Text style={styles.addButtonText}>+</Text>
      </View>
    </TouchableOpacity>
    
    <TouchableOpacity style={styles.navItem} onPress={onSettings}>
      <Image 
        source={require('@/assets/images/setting.png')} 
        style={styles.navIconImage}
        resizeMode="contain"
      />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: KawaiiColors.white,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    borderTopWidth: 4,
    borderTopColor: '#FFF0F5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    flex: 1,
  },
  navItemAdd: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    flex: 1,
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: KawaiiColors.hotPink,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF85A2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  addButtonText: {
    fontSize: 32,
    fontWeight: '700',
    color: KawaiiColors.white,
    marginTop: -2,
  },
  navIconImage: {
    width: 28,
    height: 28,
    opacity: 0.7,
  },
});
