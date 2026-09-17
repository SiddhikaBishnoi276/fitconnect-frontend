import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';

import { Colors, Spacing, BorderRadius, TextPresets } from '@theme/index';

interface SelectableCardProps {
  label: string;
  icon?: string;
  selected: boolean;
  onToggle: () => void;
}

export const SelectableCard: React.FC<SelectableCardProps> = ({
  label,
  icon,
  selected,
  onToggle,
}) => {
  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.cardSelected]}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, selected && styles.iconContainerSelected]}>
        {icon && <Text style={styles.icon}>{icon}</Text>}
      </View>
      <Text
        style={[
          TextPresets.label,
          styles.label,
          selected && styles.labelSelected,
        ]}
        numberOfLines={2}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background.secondary,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: BorderRadius.md,
    padding: Spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 110,
  },
  cardSelected: {
    backgroundColor: Colors.background.tertiary,
    borderColor: Colors.brand.primary,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[2],
  },
  iconContainerSelected: {
    backgroundColor: Colors.background.secondary,
  },
  icon: {
    fontSize: 24,
  },
  label: {
    color: Colors.text.primary,
    textAlign: 'center',
  },
  labelSelected: {
    color: Colors.brand.primary,
  },
});
