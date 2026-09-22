import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import apiClient from '@api/client';
import { Endpoints } from '@api/endpoints';
import { SettingsData, SettingsInjury } from '@t/settings';

export const useSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [originalData, setOriginalData] = useState<SettingsData | null>(null);
  
  // Local editable state
  const [formData, setFormData] = useState<Partial<SettingsData>>({});
  
  // Field-level errors (e.g. { weight_kg: "Weight must be positive" })
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(Endpoints.auth.me);
      if (response.data?.success) {
        setOriginalData(response.data.data);
        setFormData(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Update a single field in form data
  const updateField = (field: keyof SettingsData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrs = { ...prev };
        delete newErrs[field];
        return newErrs;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) newErrors.name = 'Name cannot be empty';
    if (formData.age !== undefined && (formData.age < 1 || formData.age > 120)) {
      newErrors.age = 'Age must be between 1 and 120';
    }
    
    const w = parseFloat(formData.weight_kg as string);
    if (isNaN(w) || w <= 0) newErrors.weight_kg = 'Weight must be a positive number';
    
    const h = parseFloat(formData.height_cm as string);
    if (isNaN(h) || h <= 0) newErrors.height_cm = 'Height must be a positive number';

    // Validate injuries
    formData.injuries?.forEach((inj, idx) => {
      if (!inj.body_part) newErrors[`injury_${idx}_body_part`] = 'Required';
      if (!inj.condition) newErrors[`injury_${idx}_condition`] = 'Required';
      if (!inj.recovery_status) newErrors[`injury_${idx}_recovery_status`] = 'Required';
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const hasUnsavedChanges = JSON.stringify(originalData) !== JSON.stringify(formData);

  const saveSettings = async () => {
    if (!validate()) return false;
    
    setSaving(true);
    try {
      // 1. Profile Update
      const profilePayload: any = {};
      if (formData.name !== originalData?.name) profilePayload.name = formData.name;
      if (formData.age !== originalData?.age) profilePayload.age = Number(formData.age);
      if (formData.weight_kg !== originalData?.weight_kg) profilePayload.weight_kg = parseFloat(formData.weight_kg as string);
      if (formData.height_cm !== originalData?.height_cm) profilePayload.height_cm = parseFloat(formData.height_cm as string);
      if (formData.photo_url !== originalData?.photo_url) profilePayload.photo_url = formData.photo_url;
      
      const promises = [];
      if (Object.keys(profilePayload).length > 0) {
        promises.push(apiClient.patch(Endpoints.profile.me, profilePayload));
      }

      // 2. Injuries Update
      if (JSON.stringify(formData.injuries) !== JSON.stringify(originalData?.injuries)) {
        // Prepare injuries without internal ids or extra fields if needed, 
        // though backend accepts them and overrides.
        promises.push(apiClient.put(Endpoints.profile.injuries, formData.injuries || []));
      }

      // 3. Preferences Update
      const prefsPayload: any = {};
      if (formData.diet_preference !== originalData?.diet_preference) prefsPayload.diet_preference = formData.diet_preference;
      if (formData.regional_cuisine !== originalData?.regional_cuisine) prefsPayload.regional_cuisine = formData.regional_cuisine;
      if (formData.privacy !== originalData?.privacy) prefsPayload.privacy = formData.privacy;
      if (formData.notifications_enabled !== originalData?.notifications_enabled) prefsPayload.notifications_enabled = formData.notifications_enabled;

      if (Object.keys(prefsPayload).length > 0) {
        promises.push(apiClient.patch(Endpoints.profile.preferences, prefsPayload));
      }

      await Promise.all(promises);
      
      // Update original data to reflect save
      setOriginalData(formData as SettingsData);
      return true;
    } catch (err) {
      console.error('Failed to save settings:', err);
      Alert.alert('Error', 'Failed to save settings. Please try again.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const logout = async () => {
    try {
      // Assume refreshToken is stored somewhere securely, or handled by a generic auth context
      // For now, we mock the payload as required by backend:
      await apiClient.post(Endpoints.auth.logout, { refreshToken: "mock_token" });
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  return {
    loading,
    saving,
    formData,
    originalData,
    errors,
    hasUnsavedChanges,
    updateField,
    saveSettings,
    logout
  };
};

