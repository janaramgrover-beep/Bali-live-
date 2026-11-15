import {
  AppearanceFontSize,
  AppearanceLanguage,
  AppearanceSettings,
  AppearanceTheme,
  GeneralSettings,
  OtherSettings,
} from '../types/iptv';

export const DEFAULT_APPEARANCE_SETTINGS: AppearanceSettings = {
  tvGuideShowEpg: true,
  tvGuideShowProgress: true,
  playerOsdTimeoutSec: 3.5,
  playerShowCornerButtons: true,
  groupsShowRow: true,
  groupsShowCounts: true,
  logosMode: 'all',
  language: 'system',
  fontSize: 'medium',
  colorTheme: 'grey-blue',
  uiTransparency: 50,
};

export const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
  autoStartOnBoot: false,
  autoStartOnWake: true,
  turnOnLastChannel: true,
  pipOnHomePress: true,
  confirmExitSecondBack: true,
  userAgent: 'BALINDER-LiveTV-Player/1.0',
  udpProxy: '',
};

export const DEFAULT_OTHER_SETTINGS: OtherSettings = {
  searchScope: 'all',
  remindersEnabled: true,
  recordingFormat: 'webm',
  vodEnabled: true,
};

export const THEME_PRESETS: Record<
  AppearanceTheme,
  { label: string; bg: string; card: string; accent: string; accentSoft: string }
> = {
  'grey-blue': {
    label: 'Grey - Blue',
    bg: '#060b14',
    card: '#091221',
    accent: '#0077ff',
    accentSoft: '#38bdf8',
  },
  'midnight-emerald': {
    label: 'Grey - Emerald',
    bg: '#050d0c',
    card: '#0a1917',
    accent: '#10b981',
    accentSoft: '#34d399',
  },
  'crimson-dark': {
    label: 'Obsidian - Crimson',
    bg: '#0e0609',
    card: '#1a0b12',
    accent: '#e11d48',
    accentSoft: '#fb7185',
  },
  'royal-purple': {
    label: 'Dark - Violet',
    bg: '#080612',
    card: '#120d26',
    accent: '#7c3aed',
    accentSoft: '#a78bfa',
  },
};

export const FONT_SIZE_PX: Record<AppearanceFontSize, { label: string; rootPx: number }> = {
  small: { label: 'Small', rootPx: 14 },
  medium: { label: 'Medium', rootPx: 16 },
  large: { label: 'Large', rootPx: 18 },
  xlarge: { label: 'Extra Large', rootPx: 20 },
};

export const LANGUAGE_LABELS: Record<AppearanceLanguage, string> = {
  system: 'System default',
  en: 'English',
  hi: 'Hindi (हिन्दी)',
  pa: 'Punjabi (ਪੰਜਾਬੀ)',
};
