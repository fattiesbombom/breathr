import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Modal, ScrollView, Image } from 'react-native';
import { KawaiiColors } from '@/constants/kawaii-theme';
import { getUserIconSource } from '@/utils/userIcons';

interface IconPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectIcon: (icon: string) => void;
  currentIcon: string | null;
}

export const IconPickerModal: React.FC<IconPickerModalProps> = ({ 
  visible, 
  onClose, 
  onSelectIcon, 
  currentIcon 
}) => {
  const availableIcons = [
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

  const handleSelectIcon = (iconFilename: string) => {
    onSelectIcon(iconFilename);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.iconPickerModalContent}>
          <Text style={styles.modalTitle}>Choose Your Icon</Text>
          <Text style={styles.modalSubtitle}>Select an icon for your profile</Text>
          
          <ScrollView 
            style={styles.iconPickerModalScroll}
            contentContainerStyle={styles.iconPickerModalGrid}
            showsVerticalScrollIndicator={false}
          >
            {availableIcons.map((iconFilename) => {
              const isSelected = currentIcon === iconFilename;
              return (
                <TouchableOpacity
                  key={iconFilename}
                  onPress={() => handleSelectIcon(iconFilename)}
                  style={[
                    styles.iconPickerModalItem,
                    isSelected && styles.iconPickerModalItemSelected
                  ]}
                >
                  <Image
                    source={getUserIconSource(iconFilename)}
                    style={styles.iconPickerModalImage}
                  />
                  {isSelected && (
                    <View style={styles.iconPickerModalCheckmark}>
                      <Text style={styles.iconPickerModalCheckmarkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          
          <TouchableOpacity style={styles.modalCancelBtn} onPress={onClose}>
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconPickerModalContent: {
    width: '100%',
    maxWidth: 360,
    maxHeight: '80%',
    backgroundColor: KawaiiColors.white,
    borderRadius: 32,
    padding: 24,
    borderWidth: 4,
    borderColor: KawaiiColors.kawaiiPink,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: KawaiiColors.hotPink,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: KawaiiColors.text,
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.8,
  },
  iconPickerModalScroll: {
    maxHeight: 400,
    marginBottom: 20,
  },
  iconPickerModalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  iconPickerModalItem: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: KawaiiColors.softPink,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: KawaiiColors.white,
  },
  iconPickerModalItemSelected: {
    borderWidth: 3,
    borderColor: KawaiiColors.hotPink,
  },
  iconPickerModalImage: {
    width: '100%',
    height: '100%',
  },
  iconPickerModalCheckmark: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: KawaiiColors.hotPink,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: KawaiiColors.white,
  },
  iconPickerModalCheckmarkText: {
    color: KawaiiColors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  modalCancelBtn: {
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: KawaiiColors.kawaiiPink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B446D',
  },
});
