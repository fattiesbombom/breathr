import React, { useState } from 'react';
import { View, StyleSheet, Text, TextInput, TouchableOpacity, Modal, Alert } from 'react-native';
import { KawaiiColors } from '@/constants/kawaii-theme';

interface AddGuardianModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (username: string) => void;
}

export const AddGuardianModal: React.FC<AddGuardianModalProps> = ({ 
  visible, 
  onClose, 
  onAdd 
}) => {
  const [username, setUsername] = useState('');

  const handleAdd = () => {
    if (!username.trim()) {
      Alert.alert('Oops! 💕', 'Please enter a username');
      return;
    }
    onAdd(username.replace('@', '').trim());
    setUsername('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}> Add Guardian</Text>
          <Text style={styles.modalSubtitle}>Add another person to receive alerts</Text>
          
          <TextInput
            style={styles.modalInput}
            placeholder="e.g. dad_telegram"
            placeholderTextColor={KawaiiColors.textLight}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
          />
          
          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={onClose}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalAddBtn} onPress={handleAdd}>
              <Text style={styles.modalAddText}>Add</Text>
            </TouchableOpacity>
          </View>
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
  modalContent: {
    width: '100%',
    maxWidth: 340,
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
  modalInput: {
    backgroundColor: '#FFF5F8',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: KawaiiColors.kawaiiPink,
    padding: 16,
    fontSize: 18,
    color: KawaiiColors.text,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
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
  modalAddBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: KawaiiColors.hotPink,
    alignItems: 'center',
  },
  modalAddText: {
    fontSize: 16,
    fontWeight: '700',
    color: KawaiiColors.white,
  },
});
