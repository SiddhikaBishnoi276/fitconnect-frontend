import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface OnboardingState {
  name?: string;
  email?: string;
  password?: string;
  username?: string;
  age?: number;
  weight_kg?: string;
  height_cm?: string;
  gender?: 'male' | 'female' | 'other';
  sports?: number[];
  // Future fields for injuries, etc.
}

interface OnboardingContextType {
  state: OnboardingState;
  updateState: (updates: Partial<OnboardingState>) => void;
  resetState: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<OnboardingState>({});

  const updateState = (updates: Partial<OnboardingState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const resetState = () => {
    setState({});
  };

  return (
    <OnboardingContext.Provider value={{ state, updateState, resetState }}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};
