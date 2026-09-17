import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';

import { Colors, Spacing, Layout, TextPresets, BorderRadius } from '@theme/index';

interface GenderPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (gender: 'male' | 'female' | 'other' | undefined) => void;
  selected?: 'male' | 'female' | 'other';
}

export const GenderPickerModal: React.FC<GenderPickerModalProps> = ({
  visible,
  onClose,
  onSelect,
  selected,
}) => {
  const options: { label: string; value: 'male' | 'female' | 'other' | undefined }[] = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Other', value: 'other' },
    { label: 'Prefer not to say', value: undefined },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <Text style={[TextPresets.h3, styles.title]}>Select Gender</Text>
              
              {options.map((option) => (
                <TouchableOpacity
                  key={option.label}
                  style={[
                    styles.optionButton,
                    selected === option.value && styles.optionSelected,
                  ]}
                  onPress={() => {
                    onSelect(option.value);
                    onClose();
                  }}
                >
                  <Text
                    style={[
                      TextPresets.body,
                      selected === option.value ? styles.textSelected : styles.text,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={[TextPresets.button, styles.cancelText]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.background.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Layout.screenPaddingH,
  },
  modalContent: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    width: '100%',
    padding: Spacing[6],
  },
  title: {
    color: Colors.text.primary,
    marginBottom: Spacing[4],
    textAlign: 'center',
  },
  optionButton: {
    paddingVertical: Spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border.primary,
    alignItems: 'center',
  },
  optionSelected: {
    backgroundColor: Colors.background.tertiary,
  },
  text: {
    color: Colors.text.primary,
  },
  textSelected: {
    color: Colors.brand.primary,
    fontFamily: TextPresets.h4.fontFamily,
  },
  cancelButton: {
    marginTop: Spacing[6],
    alignItems: 'center',
    paddingVertical: Spacing[3],
  },
  cancelText: {
    color: Colors.text.secondary,
  },
});
