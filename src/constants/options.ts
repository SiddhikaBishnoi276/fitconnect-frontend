import { DropdownOption } from '@components/index';

export const BODY_PARTS: DropdownOption[] = [
  { label: 'Knee', value: 'knee' },
  { label: 'Shoulder', value: 'shoulder' },
  { label: 'Ankle', value: 'ankle' },
  { label: 'Lower Back', value: 'lower_back' },
  { label: 'Hip', value: 'hip' },
  { label: 'Wrist', value: 'wrist' },
  { label: 'Elbow', value: 'elbow' },
  { label: 'Hamstring', value: 'hamstring' },
  { label: 'Neck', value: 'neck' },
  { label: 'Other', value: 'other' },
];

export const CONDITIONS: DropdownOption[] = [
  { label: 'Sprain', value: 'sprain' },
  { label: 'Fracture', value: 'fracture' },
  { label: 'ACL Tear', value: 'acl_tear' },
  { label: 'Chronic Pain', value: 'chronic_pain' },
  { label: 'Post-Surgery', value: 'post_surgery' },
  { label: 'Tendinitis', value: 'tendinitis' },
  { label: 'Other', value: 'other' },
];

export const RECOVERY_STATUSES: DropdownOption[] = [
  { label: 'Fully Healed', value: 'fully_healed' },
  { label: 'Mostly Recovered', value: 'mostly_recovered' },
  { label: 'Partially Recovered', value: 'partially_recovered' },
  { label: 'Ongoing', value: 'ongoing' },
];

export const DIET_PREFS = [
  { id: 'veg', label: 'Veg' },
  { id: 'non_veg', label: 'Non-veg' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'eggetarian', label: 'Eggetarian' },
];

export const CUISINES = [
  'North Indian', 'South Indian', 'Maharashtrian', 
  'Gujarati', 'Bengali', 'Punjabi'
];

