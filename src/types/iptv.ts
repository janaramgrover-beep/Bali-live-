export type BuiltInNavSection =
  | 'Home'
  | 'Live TV'
  | 'Movies'
  | 'Sports'
  | 'News'
  | 'Entertainment'
  | 'Kids'
  | 'Music'
  | 'Settings';

export type ScreenMode = 'stretch' | 'fit' | 'zoom';
export type QualityMode = 'auto' | 'high' | 'low';
export type DeviceType = 'auto' | 'tv' | 'desktop' | 'mobile';

export type AppearanceLanguage = 'system' | 'en' | 'hi' | 'pa';
export type AppearanceFontSize = 'small' | 'medium' | 'large' | 'xlarge';
export type AppearanceTheme = 'grey-blue' | 'midnight-emerald' | 'crimson-dark' | 'royal-purple';
export type LogosDisplayMode = 'all' | 'initials' | 'hidden';

export interface SavedPlaylist {
  id: string;
  name: string;
  url: string;
  channelCount: number;
  lastUpdated: string;
  content?: string;
}

export interface ProgramReminder {
  id: string;
  channelId: string;
  channelName: string;
  programTitle: string;
  timeLabel: string;
  enabled: boolean;
}

export interface RecordingEntry {
  id: string;
  channelName: string;
  startedAt: string;
  durationSec: number;
  status: 'recording' | 'saved';
}

export interface AppearanceSettings {
  tvGuideShowEpg: boolean;
  tvGuideShowProgress: boolean;
  playerOsdTimeoutSec: number;
  playerShowCornerButtons: boolean;
  groupsShowRow: boolean;
  groupsShowCounts: boolean;
  logosMode: LogosDisplayMode;
  language: AppearanceLanguage;
  fontSize: AppearanceFontSize;
  colorTheme: AppearanceTheme;
  uiTransparency: number; // 0 to 90 (%)
}

export interface GeneralSettings {
  autoStartOnBoot: boolean;
  autoStartOnWake: boolean;
  turnOnLastChannel: boolean;
  pipOnHomePress: boolean;
  confirmExitSecondBack: boolean;
  userAgent: string;
  udpProxy: string; // address:port
}

export interface OtherSettings {
  searchScope: 'all' | 'channels' | 'programs';
  remindersEnabled: boolean;
  recordingFormat: 'mp4' | 'webm' | 'ts';
  vodEnabled: boolean;
}

export interface AppBackupData {
  version: number;
  exportedAt: string;
  m3uUrl: string;
  savedPlaylists: SavedPlaylist[];
  favoriteIds: string[];
  reminders: ProgramReminder[];
  screenMode: ScreenMode;
  qualityMode: QualityMode;
  deviceType: DeviceType;
  startFavoriteChannels: boolean;
  lastChannelId: string;
  appearance: AppearanceSettings;
  general: GeneralSettings;
  other: OtherSettings;
}

export interface Channel {
  id: string;
  number: number;
  name: string;
  url: string;
  logo: string;
  group: string;
  language: string;
  programTitle: string;
  programSubtitle: string;
  description: string;
  startTime: string;
  endTime: string;
  progress: number;
  isPopular?: boolean;
}

export interface CategorySummary {
  name: string;
  count: number;
  subtitle: string;
}

export interface HlsQualityLevel {
  index: number;
  height: number;
  width: number;
  bitrate: number;
  label: string;
}

export interface HlsTrackItem {
  id: number;
  name: string;
  lang?: string;
}
