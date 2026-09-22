import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, TextPresets, BorderRadius, Layout } from '@theme/index';

import { SettingsSection, SettingsInput, DietSelector } from '@components/settings/SettingsComponents';
import { DropdownPickerModal } from '@components/index';
import { useSettings } from '@hooks/settings/useSettings';
import { BODY_PARTS, CONDITIONS, RECOVERY_STATUSES, DIET_PREFS } from '@constants/options';

const SettingsScreen = (): React.JSX.Element => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const {
    loading,
    saving,
    formData,
    errors,
    hasUnsavedChanges,
    updateField,
    saveSettings,
    logout
  } = useSettings();

  const [activeModal, setActiveModal] = useState<{ type: string; index: number } | null>(null);

  const handleBack = () => {
    if (hasUnsavedChanges) {
      Alert.alert(
        'Unsaved Changes',
        'Please save your changes or discard them.',
        [
          { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const handleSave = async () => {
    const success = await saveSettings();
    if (success) {
      Alert.alert('Success', 'All settings updated successfully');
    }
  };

  const confirmLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            navigation.reset({ index: 0, routes: [{ name: 'Welcome' } as any] });
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#CCFF00" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.responsiveContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.backIcon}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <TouchableOpacity onPress={handleSave} disabled={!hasUnsavedChanges || saving} style={styles.saveBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            {saving ? (
              <ActivityIndicator size="small" color="#0B0F17" />
            ) : (
              <Text style={[styles.saveText, !hasUnsavedChanges && styles.saveTextDisabled]}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 20) + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Info */}
          <SettingsSection title="PROFILE INFO">
            <SettingsInput
              label="Name"
              value={formData.name || ''}
              onChangeText={(t) => updateField('name', t)}
              error={errors.name}
            />
            <View style={styles.row}>
              <View style={styles.flex1}>
                <SettingsInput
                  label="Age"
                  keyboardType="numeric"
                  value={formData.age?.toString() || ''}
                  onChangeText={(t) => updateField('age', t)}
                  error={errors.age}
                />
              </View>
              <View style={{ width: Spacing[4] }} />
              <View style={styles.flex1}>
                <SettingsInput
                  label="Weight (kg)"
                  keyboardType="numeric"
                  value={formData.weight_kg?.toString() || ''}
                  onChangeText={(t) => updateField('weight_kg', t)}
                  error={errors.weight_kg}
                />
              </View>
            </View>
            <SettingsInput
              label="Height (cm)"
              keyboardType="numeric"
              value={formData.height_cm?.toString() || ''}
              onChangeText={(t) => updateField('height_cm', t)}
              error={errors.height_cm}
            />
            <TouchableOpacity style={styles.photoBtn} activeOpacity={0.7}>
              <Text style={styles.photoBtnText}>Change Profile Photo</Text>
            </TouchableOpacity>
          </SettingsSection>

          {/* Injuries */}
          <SettingsSection title="INJURY / LIMITATION">
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                <Text style={styles.warningHighlight}>Hard constraint: </Text>
                these fields are used by the AI to avoid unsafe exercises — not just suggestions.
              </Text>
            </View>

            {(formData.injuries || []).map((inj, idx) => (
              <View key={idx} style={styles.injuryBlock}>
                {idx > 0 && <View style={styles.divider} />}

                <Text style={styles.label}>Body part</Text>
                <TouchableOpacity style={styles.dropdown} onPress={() => setActiveModal({ type: 'body_part', index: idx })}>
                  <Text style={styles.dropdownText}>
                    {BODY_PARTS.find(b => b.value === inj.body_part)?.label || inj.body_part || 'Select...'}
                  </Text>
                </TouchableOpacity>
                {errors[`injury_${idx}_body_part`] && <Text style={styles.errorTextInline}>{errors[`injury_${idx}_body_part`]}</Text>}

                <Text style={[styles.label, { marginTop: Spacing[4] }]}>Injury type</Text>
                <TouchableOpacity style={styles.dropdown} onPress={() => setActiveModal({ type: 'condition', index: idx })}>
                  <Text style={styles.dropdownText}>
                    {CONDITIONS.find(c => c.value === inj.condition)?.label || inj.condition || 'Select...'}
                  </Text>
                </TouchableOpacity>
                {errors[`injury_${idx}_condition`] && <Text style={styles.errorTextInline}>{errors[`injury_${idx}_condition`]}</Text>}

                <Text style={[styles.label, { marginTop: Spacing[4] }]}>Recovery status</Text>
                <TouchableOpacity style={styles.dropdown} onPress={() => setActiveModal({ type: 'recovery', index: idx })}>
                  <Text style={styles.dropdownText}>
                    {RECOVERY_STATUSES.find(r => r.value === inj.recovery_status)?.label || inj.recovery_status || 'Select...'}
                  </Text>
                </TouchableOpacity>
                {errors[`injury_${idx}_recovery_status`] && <Text style={styles.errorTextInline}>{errors[`injury_${idx}_recovery_status`]}</Text>}

                <TouchableOpacity
                  style={styles.removeInjBtn}
                  onPress={() => {
                    const newInj = [...(formData.injuries || [])];
                    newInj.splice(idx, 1);
                    updateField('injuries', newInj);
                  }}
                >
                  <Text style={styles.removeInjText}>Remove Injury</Text>
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity
              style={styles.addInjBtn}
              onPress={() => {
                updateField('injuries', [...(formData.injuries || []), { body_part: '', condition: '', recovery_status: '' }]);
              }}
            >
              <Text style={styles.addInjText}>+ Add another injury</Text>
            </TouchableOpacity>
          </SettingsSection>

          {/* Diet Preferences */}
          <SettingsSection title="DIET PREFERENCE">
            <DietSelector
              options={DIET_PREFS}
              selectedValue={formData.diet_preference}
              onSelect={(val) => updateField('diet_preference', val)}
            />
          </SettingsSection>

          {/* Logout */}
          <View style={styles.logoutContainer}>
            <TouchableOpacity style={styles.logoutBtn} onPress={confirmLogout}>
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {/* Modals for Injuries */}
      <DropdownPickerModal
        visible={activeModal !== null}
        title={`Select ${activeModal?.type.replace('_', ' ')}`}
        options={
          activeModal?.type === 'body_part' ? BODY_PARTS :
            activeModal?.type === 'condition' ? CONDITIONS :
              RECOVERY_STATUSES
        }
        selected={
          activeModal ? (formData.injuries?.[activeModal.index] as any)?.[activeModal.type] : undefined
        }
        onSelect={(val) => {
          if (activeModal) {
            const newInj = [...(formData.injuries || [])];
            (newInj[activeModal.index] as any)[activeModal.type] = val;
            updateField('injuries', newInj);
          }
          setActiveModal(null);
        }}
        onClose={() => setActiveModal(null)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F17',
  },
  responsiveContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPaddingH,
    paddingVertical: Spacing[4],
  },
  backBtn: {
    width: 40,
    height: 40,
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    color: Colors.text.inverse,
    fontSize: 20,
    // fontWeight: bold removed temporarily
  },
  headerTitle: {
    ...TextPresets.h3,
    color: Colors.text.inverse,
    // fontWeight: bold removed temporarily
  },
  saveBtn: {
    backgroundColor: '#CCFF00',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.sm,
    minWidth: 70,
    alignItems: 'center',
  },
  saveText: {
    color: '#000000',
    // fontWeight: bold removed temporarily
    ...TextPresets.body,
  },
  saveTextDisabled: {
    color: 'rgba(0,0,0,0.4)',
  },
  content: {
    paddingHorizontal: Layout.screenPaddingH,
    paddingTop: Spacing[4],
  },
  row: {
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
  },
  photoBtn: {
    backgroundColor: 'rgba(204, 255, 0, 0.05)',
    paddingVertical: Spacing[3],
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing[2],
  },
  photoBtnText: {
    color: '#CCFF00',
    // fontWeight: bold removed temporarily
    ...TextPresets.body,
  },
  warningBox: {
    backgroundColor: 'rgba(217, 119, 6, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.3)',
    padding: Spacing[4],
    borderRadius: BorderRadius.md,
    marginBottom: Spacing[4],
  },
  warningText: {
    color: Colors.text.secondary,
    ...TextPresets.body,
    lineHeight: 20,
  },
  warningHighlight: {
    color: '#D97706',
    // fontWeight: bold removed temporarily
  },
  label: {
    ...TextPresets.caption,
    color: Colors.text.primary,
    // fontWeight: bold removed temporarily
    marginBottom: Spacing[2],
  },
  dropdown: {
    backgroundColor: Colors.background.tertiary,
    padding: Spacing[3],
    borderRadius: BorderRadius.md,
    minHeight: 48,
    justifyContent: 'center',
  },
  dropdownText: {
    color: Colors.text.inverse,
    ...TextPresets.body,
  },
  injuryBlock: {
    marginBottom: Spacing[4],
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border.primary,
    marginVertical: Spacing[4],
  },
  errorTextInline: {
    color: Colors.status.error,
    ...TextPresets.caption,
    marginTop: Spacing[1],
  },
  removeInjBtn: {
    marginTop: Spacing[4],
    alignSelf: 'flex-start',
  },
  removeInjText: {
    color: Colors.status.error,
    ...TextPresets.body,
    // fontWeight: bold removed temporarily
  },
  addInjBtn: {
    marginTop: Spacing[2],
    alignSelf: 'center',
  },
  addInjText: {
    color: '#CCFF00',
    ...TextPresets.body,
    // fontWeight: bold removed temporarily
  },
  logoutContainer: {
    marginTop: Spacing[2],
  },
  logoutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing[4],
    alignItems: 'center',
  },
  logoutText: {
    color: Colors.status.error,
    ...TextPresets.h4,
    // fontWeight: bold removed temporarily
  }
});

export default SettingsScreen;
