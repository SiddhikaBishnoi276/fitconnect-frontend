import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

import { useAppDispatch } from '@store/hooks';
import { logout } from '@store/slices/authSlice';
import { Colors, Spacing, Layout, TextPresets, BorderRadius } from '@theme/index';
import { AppButton } from '@components/index';
import apiClient from '@api/client';
import { Endpoints } from '@api/endpoints';
import { Storage } from '@utils/storage';

const SettingsScreen = (): React.JSX.Element => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();

  const [loading, setLoading] = useState(true);
  
  // Section states
  const [profileForm, setProfileForm] = useState({ name: '', photo_url: '', age: '', weight_kg: '', height_cm: '' });
  const [originalProfile, setOriginalProfile] = useState<any>(null);
  
  const [preferences, setPreferences] = useState({ diet_preference: '', regional_cuisine: '', privacy: '' });
  const [originalPreferences, setOriginalPreferences] = useState<any>(null);
  
  // Basic array of string injuries for simplicity here, though it might be objects.
  // The backend might expect structured objects, but let's assume strings for the quick UI or 
  // `{ body_part, condition }`. I'll use simple string representation and map it back.
  const [injuries, setInjuries] = useState<any[]>([]);

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [savingInjuries, setSavingInjuries] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [profRes, prefsRes, injRes] = await Promise.allSettled([
          apiClient.get(Endpoints.profile.me),
          apiClient.get(Endpoints.profile.preferences),
          apiClient.get(Endpoints.profile.injuries)
        ]);

        if (profRes.status === 'fulfilled') {
          const p = profRes.value.data?.data;
          setOriginalProfile(p);
          setProfileForm({
            name: p?.name || '',
            photo_url: p?.photo_url || '',
            age: p?.age ? String(p.age) : '',
            weight_kg: p?.weight_kg ? String(p.weight_kg) : '',
            height_cm: p?.height_cm ? String(p.height_cm) : '',
          });
        }
        if (prefsRes.status === 'fulfilled') {
          const p = prefsRes.value.data?.data;
          setOriginalPreferences(p);
          setPreferences({
            diet_preference: p?.diet_preference || '',
            regional_cuisine: p?.regional_cuisine || '',
            privacy: p?.privacy || 'private',
          });
        }
        if (injRes.status === 'fulfilled') {
          setInjuries(injRes.value.data?.data || []);
        }
      } catch (err) {
        console.error('Failed to load settings data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleUpdateProfile = async () => {
    setSavingProfile(true);
    try {
      // Compute diff
      const payload: any = {};
      if (profileForm.name !== originalProfile.name) payload.name = profileForm.name;
      if (profileForm.photo_url !== originalProfile.photo_url) payload.photo_url = profileForm.photo_url;
      if (profileForm.age !== String(originalProfile.age)) payload.age = parseInt(profileForm.age, 10);
      if (profileForm.weight_kg !== String(originalProfile.weight_kg)) payload.weight_kg = parseFloat(profileForm.weight_kg);
      if (profileForm.height_cm !== String(originalProfile.height_cm)) payload.height_cm = parseFloat(profileForm.height_cm);

      if (Object.keys(payload).length > 0) {
        await apiClient.patch(Endpoints.profile.me, payload);
        Toast.show({ type: 'success', text1: 'Profile Updated' });
        setOriginalProfile({ ...originalProfile, ...payload });
      } else {
        Toast.show({ type: 'info', text1: 'No changes to save' });
      }
    } catch (err) {
      console.error(err);
      Toast.show({ type: 'error', text1: 'Update failed' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePreferences = async () => {
    setSavingPrefs(true);
    try {
      const payload: any = {};
      if (preferences.diet_preference !== originalPreferences.diet_preference) payload.diet_preference = preferences.diet_preference;
      if (preferences.regional_cuisine !== originalPreferences.regional_cuisine) payload.regional_cuisine = preferences.regional_cuisine;
      if (preferences.privacy !== originalPreferences.privacy) payload.privacy = preferences.privacy;

      if (Object.keys(payload).length > 0) {
        await apiClient.patch(Endpoints.profile.preferences, payload);
        Toast.show({ type: 'success', text1: 'Preferences Updated' });
        setOriginalPreferences({ ...originalPreferences, ...payload });
      } else {
        Toast.show({ type: 'info', text1: 'No changes to save' });
      }
    } catch (err) {
      console.error(err);
      Toast.show({ type: 'error', text1: 'Update failed' });
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleUpdateInjuries = async () => {
    setSavingInjuries(true);
    try {
      await apiClient.put(Endpoints.profile.injuries, { injuries });
      Toast.show({ type: 'success', text1: 'Injuries Updated' });
    } catch (err) {
      console.error(err);
      Toast.show({ type: 'error', text1: 'Update failed' });
    } finally {
      setSavingInjuries(false);
    }
  };

  const addInjury = () => {
    setInjuries([...injuries, { body_part: 'New Part', condition: 'Soreness' }]);
  };

  const removeInjury = (index: number) => {
    const updated = [...injuries];
    updated.splice(index, 1);
    setInjuries(updated);
  };

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Log out', 
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.post(Endpoints.auth.logout);
          } catch (e) {
            // best effort
          }
          Storage.clearAll();
          dispatch(logout());
        }
      }
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.brand.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* --- Profile Info --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Info</Text>
          <View style={styles.card}>
            <Text style={styles.label}>Name</Text>
            <TextInput 
              style={styles.input} 
              value={profileForm.name} 
              onChangeText={(t) => setProfileForm({...profileForm, name: t})} 
            />
            
            <View style={styles.rowInputs}>
              <View style={styles.flexHalf}>
                <Text style={styles.label}>Age</Text>
                <TextInput 
                  style={styles.input} 
                  keyboardType="numeric"
                  value={profileForm.age} 
                  onChangeText={(t) => setProfileForm({...profileForm, age: t})} 
                />
              </View>
              <View style={{ width: Spacing[4] }} />
              <View style={styles.flexHalf}>
                <Text style={styles.label}>Weight (kg)</Text>
                <TextInput 
                  style={styles.input} 
                  keyboardType="numeric"
                  value={profileForm.weight_kg} 
                  onChangeText={(t) => setProfileForm({...profileForm, weight_kg: t})} 
                />
              </View>
            </View>
            
            <AppButton title="Save Profile" onPress={handleUpdateProfile} loading={savingProfile} />
          </View>
        </View>

        {/* --- Injuries --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Injuries & Limitations</Text>
          <View style={styles.card}>
            {injuries.length === 0 ? (
              <Text style={styles.emptyText}>No injuries reported.</Text>
            ) : (
              injuries.map((inj, idx) => (
                <View key={idx} style={styles.injuryRow}>
                  <View style={styles.injuryInputs}>
                    <TextInput 
                      style={[styles.input, { marginBottom: Spacing[2] }]} 
                      value={inj.body_part} 
                      onChangeText={(t) => {
                        const updated = [...injuries];
                        updated[idx].body_part = t;
                        setInjuries(updated);
                      }}
                      placeholder="Body part"
                    />
                    <TextInput 
                      style={styles.input} 
                      value={inj.condition} 
                      onChangeText={(t) => {
                        const updated = [...injuries];
                        updated[idx].condition = t;
                        setInjuries(updated);
                      }}
                      placeholder="Condition"
                    />
                  </View>
                  <TouchableOpacity onPress={() => removeInjury(idx)} style={styles.removeBtn}>
                    <Text style={styles.removeBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
            
            <View style={styles.injuryActions}>
              <TouchableOpacity onPress={addInjury}>
                <Text style={styles.addBtnText}>+ Add Injury</Text>
              </TouchableOpacity>
              <AppButton title="Save Injuries" onPress={handleUpdateInjuries} loading={savingInjuries} style={{ width: 140 }} />
            </View>
          </View>
        </View>

        {/* --- Preferences --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.card}>
            <Text style={styles.label}>Diet Preference</Text>
            <TextInput 
              style={styles.input} 
              value={preferences.diet_preference} 
              onChangeText={(t) => setPreferences({...preferences, diet_preference: t})} 
            />
            
            <Text style={styles.label}>Privacy (public/private)</Text>
            <TextInput 
              style={styles.input} 
              autoCapitalize="none"
              value={preferences.privacy} 
              onChangeText={(t) => setPreferences({...preferences, privacy: t})} 
            />
            
            <AppButton title="Save Preferences" onPress={handleUpdatePreferences} loading={savingPrefs} />
          </View>
        </View>

        {/* --- Logout --- */}
        <View style={[styles.section, { marginTop: Spacing[6] }]}>
          <AppButton title="Log Out" variant="outline" onPress={handleLogout} />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.screenPaddingH,
    paddingVertical: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  backText: {
    ...TextPresets.body,
    color: Colors.brand.primary,
  },
  headerTitle: {
    ...TextPresets.h3,
    color: Colors.text.primary,
  },
  content: {
    paddingHorizontal: Layout.screenPaddingH,
    paddingTop: Spacing[6],
    paddingBottom: Spacing[10],
  },
  section: {
    marginBottom: Spacing[8],
  },
  sectionTitle: {
    ...TextPresets.h4,
    color: Colors.text.primary,
    marginBottom: Spacing[4],
  },
  card: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing[5],
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  label: {
    ...TextPresets.caption,
    color: Colors.text.secondary,
    marginBottom: Spacing[2],
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing[3],
    ...TextPresets.body,
    color: Colors.text.primary,
    backgroundColor: Colors.background.primary,
    marginBottom: Spacing[4],
  },
  rowInputs: {
    flexDirection: 'row',
  },
  flexHalf: {
    flex: 1,
  },
  emptyText: {
    ...TextPresets.body,
    color: Colors.text.secondary,
    marginBottom: Spacing[4],
    fontStyle: 'italic',
  },
  injuryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingBottom: Spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border.primary,
    marginBottom: Spacing[4],
  },
  injuryInputs: {
    flex: 1,
  },
  removeBtn: {
    padding: Spacing[3],
    marginLeft: Spacing[2],
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: BorderRadius.md,
  },
  removeBtnText: {
    color: Colors.status.error,
    fontWeight: 'bold',
  },
  injuryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing[2],
  },
  addBtnText: {
    ...TextPresets.body,
    color: Colors.brand.primary,
    fontWeight: 'bold',
  }
});

export default SettingsScreen;
