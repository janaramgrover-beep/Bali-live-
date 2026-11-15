import React, { createContext, useContext } from 'react';
import { AppearanceSettings, GeneralSettings, OtherSettings } from '../types/iptv';
import {
  DEFAULT_APPEARANCE_SETTINGS,
  DEFAULT_GENERAL_SETTINGS,
  DEFAULT_OTHER_SETTINGS,
} from '../data/settingsDefaults';

interface SettingsContextValue {
  appearance: AppearanceSettings;
  general: GeneralSettings;
  other: OtherSettings;
}

const SettingsContext = createContext<SettingsContextValue>({
  appearance: DEFAULT_APPEARANCE_SETTINGS,
  general: DEFAULT_GENERAL_SETTINGS,
  other: DEFAULT_OTHER_SETTINGS,
});

export function SettingsProvider({
  value,
  children,
}: {
  value: SettingsContextValue;
  children: React.ReactNode;
}) {
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useAppSettings() {
  return useContext(SettingsContext);
}
