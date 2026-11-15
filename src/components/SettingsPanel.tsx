import React, { useEffect, useState } from 'react';
import {
  ArrowUpCircle,
  Volume2,
  Info,
  RectangleHorizontal,
  Star,
  MonitorSmartphone,
  RefreshCw,
  Power,
  X,
  ChevronLeft,
  Check,
  Link2,
  Upload,
  RotateCcw,
  ListPlus,
  SlidersHorizontal,
  Palette,
  Settings2,
  Search,
  Bell,
  Video,
  Film,
  Download,
  FolderUp,
  Trash2,
  Play,
  Square,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import {
  AppearanceFontSize,
  AppearanceLanguage,
  AppearanceSettings,
  AppearanceTheme,
  Channel,
  DeviceType,
  GeneralSettings,
  HlsQualityLevel,
  HlsTrackItem,
  LogosDisplayMode,
  OtherSettings,
  ProgramReminder,
  QualityMode,
  RecordingEntry,
  SavedPlaylist,
  ScreenMode,
} from '../types/iptv';
import {
  FONT_SIZE_PX,
  LANGUAGE_LABELS,
  THEME_PRESETS,
} from '../data/settingsDefaults';

type SettingsSubView =
  | 'main'
  | 'playlists'
  | 'other'
  | 'appearance'
  | 'general'
  | 'quality'
  | 'audio'
  | 'subtitles'
  | 'screenMode'
  | 'qualityMode'
  | 'favorites'
  | 'deviceType';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  // M3U URL Manager & Saved Playlists
  m3uUrl: string;
  isLoadingM3u: boolean;
  m3uStatusMessage: string | null;
  m3uErrorMessage: string | null;
  savedPlaylists: SavedPlaylist[];
  activePlaylistId: string | null;
  isUpdatingAllPlaylists: boolean;
  onSaveAndLoadM3uUrl: (url: string, customName?: string) => Promise<void>;
  onLoadM3uText: (content: string, sourceLabel: string) => void;
  onResetDefaultPlaylist: () => void;
  onActivateSavedPlaylist: (pl: SavedPlaylist) => void;
  onDeleteSavedPlaylist: (id: string) => void;
  onUpdateAllPlaylists: () => Promise<string>;
  // Player-linked Controls
  hlsLevels: HlsQualityLevel[];
  selectedQualityLevel: number;
  onSelectQualityLevel: (idx: number) => void;
  audioTracks: HlsTrackItem[];
  selectedAudioTrack: number;
  onSelectAudioTrack: (id: number) => void;
  subtitleTracks: HlsTrackItem[];
  selectedSubtitleTrack: number;
  onSelectSubtitleTrack: (id: number) => void;
  screenMode: ScreenMode;
  onChangeScreenMode: (mode: ScreenMode) => void;
  qualityMode: QualityMode;
  onChangeQualityMode: (mode: QualityMode) => void;
  // App preferences
  startFavoriteChannels: boolean;
  onToggleStartFavoriteChannels: () => void;
  favoriteChannels: Channel[];
  onSelectFavoriteChannel: (ch: Channel) => void;
  deviceType: DeviceType;
  onChangeDeviceType: (device: DeviceType) => void;
  onCheckForUpdates: () => Promise<string>;
  onExitApp: () => void;
  // New Settings: Appearance, General, Other, Reminders, Recording, Backup/Restore
  appearance: AppearanceSettings;
  onUpdateAppearance: (patch: Partial<AppearanceSettings>) => void;
  general: GeneralSettings;
  onUpdateGeneral: (patch: Partial<GeneralSettings>) => void;
  other: OtherSettings;
  onUpdateOther: (patch: Partial<OtherSettings>) => void;
  reminders: ProgramReminder[];
  onAddReminderForCurrentChannel: (timeLabel: string) => void;
  onToggleReminder: (id: string) => void;
  onDeleteReminder: (id: string) => void;
  isRecording: boolean;
  recordings: RecordingEntry[];
  onToggleRecording: () => void;
  onOpenSearchBar: () => void;
  onOpenVodSection: () => void;
  onBackupAppData: () => void;
  onRestoreAppData: (file: File) => Promise<string>;
}

const SCREEN_MODE_LABELS: Record<ScreenMode, string> = {
  stretch: 'Stretch (Fill Entire Screen)',
  fit: 'Fit (Original Aspect)',
  zoom: 'Zoom (Crop to Fill)',
};

const QUALITY_MODE_LABELS: Record<QualityMode, string> = {
  auto: 'Auto Adaptive',
  high: 'High Quality (Max)',
  low: 'Data Saver (Low)',
};

const DEVICE_LABELS: Record<DeviceType, string> = {
  auto: 'Auto (Responsive)',
  tv: 'Smart TV',
  desktop: 'Desktop',
  mobile: 'Mobile',
};

function TriangleArrow() {
  return (
    <svg
      width="10"
      height="12"
      viewBox="0 0 10 12"
      fill="currentColor"
      className="text-slate-400 shrink-0"
      aria-hidden="true"
    >
      <path d="M1 1.2L9 6L1 10.8V1.2Z" />
    </svg>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onToggle,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] flex items-center justify-between gap-3 text-left transition-colors cursor-pointer"
    >
      <div className="min-w-0">
        <span className="block text-sm font-semibold text-slate-100 leading-snug">{label}</span>
        {description && (
          <span className="block text-[11px] text-slate-400 mt-0.5 leading-snug">
            {description}
          </span>
        )}
      </div>
      <span
        className={`px-2.5 py-1 rounded-md text-[11px] font-bold shrink-0 transition-colors ${
          checked
            ? 'bg-[var(--app-accent,#0077ff)] text-white'
            : 'bg-white/10 text-slate-400'
        }`}
      >
        {checked ? 'ON' : 'OFF'}
      </span>
    </button>
  );
}

export function SettingsPanel({
  isOpen,
  onClose,
  m3uUrl,
  isLoadingM3u,
  m3uStatusMessage,
  m3uErrorMessage,
  savedPlaylists,
  activePlaylistId,
  isUpdatingAllPlaylists,
  onSaveAndLoadM3uUrl,
  onLoadM3uText,
  onResetDefaultPlaylist,
  onActivateSavedPlaylist,
  onDeleteSavedPlaylist,
  onUpdateAllPlaylists,
  hlsLevels,
  selectedQualityLevel,
  onSelectQualityLevel,
  audioTracks,
  selectedAudioTrack,
  onSelectAudioTrack,
  subtitleTracks,
  selectedSubtitleTrack,
  onSelectSubtitleTrack,
  screenMode,
  onChangeScreenMode,
  qualityMode,
  onChangeQualityMode,
  startFavoriteChannels,
  onToggleStartFavoriteChannels,
  favoriteChannels,
  onSelectFavoriteChannel,
  deviceType,
  onChangeDeviceType,
  onCheckForUpdates,
  onExitApp,
  appearance,
  onUpdateAppearance,
  general,
  onUpdateGeneral,
  other,
  onUpdateOther,
  reminders,
  onAddReminderForCurrentChannel,
  onToggleReminder,
  onDeleteReminder,
  isRecording,
  recordings,
  onToggleRecording,
  onOpenSearchBar,
  onOpenVodSection,
  onBackupAppData,
  onRestoreAppData,
}: SettingsPanelProps) {
  const [subView, setSubView] = useState<SettingsSubView>('main');
  const [urlInput, setUrlInput] = useState(m3uUrl);
  const [showAddPlaylistForm, setShowAddPlaylistForm] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistUrl, setNewPlaylistUrl] = useState('');
  const [playlistUpdateSummary, setPlaylistUpdateSummary] = useState<string | null>(null);
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);
  const [checkingUpdate, setCheckingUpdate] = useState(false);

  // Reminder quick input
  const [reminderTime, setReminderTime] = useState('08:00 PM');

  // General network inputs
  const [userAgentDraft, setUserAgentDraft] = useState(general.userAgent);
  const [udpProxyDraft, setUdpProxyDraft] = useState(general.udpProxy);
  const [generalStatusMsg, setGeneralStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    setUrlInput(m3uUrl);
  }, [m3uUrl]);

  useEffect(() => {
    setUserAgentDraft(general.userAgent);
    setUdpProxyDraft(general.udpProxy);
  }, [general.userAgent, general.udpProxy]);

  if (!isOpen) return null;

  const handleSubmitUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveAndLoadM3uUrl(urlInput);
  };

  const handleAddPlaylistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistUrl.trim()) return;
    await onSaveAndLoadM3uUrl(newPlaylistUrl, newPlaylistName.trim() || undefined);
    setNewPlaylistName('');
    setNewPlaylistUrl('');
    setShowAddPlaylistForm(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onLoadM3uText(reader.result, file.name);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleUpdateAllClick = async () => {
    setPlaylistUpdateSummary(null);
    const msg = await onUpdateAllPlaylists();
    setPlaylistUpdateSummary(msg);
  };

  const handleUpdateClick = async () => {
    setCheckingUpdate(true);
    setUpdateMsg(null);
    const msg = await onCheckForUpdates();
    setUpdateMsg(msg);
    setCheckingUpdate(false);
  };

  const handleRestoreFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const msg = await onRestoreAppData(file);
    setGeneralStatusMsg(msg);
    e.target.value = '';
  };

  const handleSaveNetworkConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedProxy = udpProxyDraft.trim();
    if (cleanedProxy && !/^[a-zA-Z0-9.-]+:\d{1,5}$/.test(cleanedProxy)) {
      setGeneralStatusMsg('Invalid UDP proxy format. Use address:port (e.g. 192.168.1.1:4022).');
      return;
    }
    onUpdateGeneral({
      userAgent: userAgentDraft.trim() || 'BALINDER-LiveTV-Player/1.0',
      udpProxy: cleanedProxy,
    });
    setGeneralStatusMsg('User-Agent & UDP proxy settings saved.');
  };

  const handleBack = () => setSubView('main');

  // Dynamic panel opacity based on User interface transparency (0% = opaque, 90% = very transparent)
  const panelOpacity = Math.max(0.15, Math.min(0.98, 1 - appearance.uiTransparency / 100));

  return (
    <div
      className="fixed inset-0 z-[60] flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/55 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Glassmorphism Side Panel with live UI Transparency */}
      <div
        style={{ backgroundColor: `rgba(17, 21, 30, ${panelOpacity})` }}
        className="relative z-10 w-full sm:max-w-[435px] h-[100dvh] backdrop-blur-2xl border-l border-white/15 sm:rounded-l-[28px] shadow-2xl flex flex-col overflow-hidden text-slate-100"
      >
        {/* Panel Header */}
        <div className="px-5 sm:px-6 pt-[calc(1rem+env(safe-area-inset-top))] pb-3.5 flex items-center justify-between border-b border-white/15">
          <div className="flex items-center gap-2.5 min-w-0">
            {subView !== 'main' && (
              <button
                type="button"
                onClick={handleBack}
                aria-label="Back to Settings"
                className="min-h-[40px] min-w-[40px] -ml-2 flex items-center justify-center rounded-xl text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white truncate">
              {subView === 'main' && 'Settings'}
              {subView === 'playlists' && 'Playlists'}
              {subView === 'other' && 'Other'}
              {subView === 'appearance' && 'Appearance'}
              {subView === 'general' && 'General'}
              {subView === 'quality' && 'Stream Quality'}
              {subView === 'audio' && 'Audio Track'}
              {subView === 'subtitles' && 'Subtitles / CC'}
              {subView === 'screenMode' && 'Screen Mode'}
              {subView === 'qualityMode' && 'Stream Quality Mode'}
              {subView === 'favorites' && 'Start Favorite Channels'}
              {subView === 'deviceType' && 'Select Device Type'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Settings"
            className="min-h-[44px] min-w-[44px] -mr-2 flex items-center justify-center rounded-xl text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Settings Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-5 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] space-y-5">
          {subView === 'main' && (
            <>
              {/* Playlists Quick Box: M3U URL + Add playlist + Update all playlists */}
              <div className="rounded-2xl bg-white/[0.06] border border-white/10 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="m3u-url-input"
                    className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2"
                  >
                    <Link2 className="w-3.5 h-3.5 text-[var(--app-accent-soft,#38bdf8)]" />
                    Playlists &amp; M3U URL
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setUrlInput('');
                      onResetDefaultPlaylist();
                    }}
                    className="text-[11px] font-medium text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset Default
                  </button>
                </div>

                <form onSubmit={handleSubmitUrl} className="space-y-2.5">
                  <input
                    id="m3u-url-input"
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://example.com/playlist.m3u"
                    className="w-full h-10 px-3.5 rounded-xl bg-black/40 border border-white/15 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#0088ff]"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={isLoadingM3u || !urlInput.trim()}
                      className="flex-1 h-10 px-3 rounded-xl bg-[var(--app-accent,#0077ff)] hover:opacity-90 disabled:opacity-50 text-white text-xs font-semibold transition-all cursor-pointer whitespace-nowrap"
                    >
                      {isLoadingM3u ? 'Loading...' : 'Save & Load URL'}
                    </button>

                    <label className="h-10 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-medium text-slate-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
                      <Upload className="w-3.5 h-3.5" />
                      File
                      <input
                        type="file"
                        accept=".m3u,.m3u8,text/plain"
                        onChange={handleFileUpload}
                        className="sr-only"
                      />
                    </label>
                  </div>
                </form>

                {/* Requested Buttons: Add playlist & Update all playlists */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddPlaylistForm(true);
                      setSubView('playlists');
                    }}
                    className="h-9 px-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/10 text-xs font-semibold text-white flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <ListPlus className="w-3.5 h-3.5 text-[var(--app-accent-soft,#38bdf8)]" />
                    Add playlist
                  </button>
                  <button
                    type="button"
                    onClick={handleUpdateAllClick}
                    disabled={isUpdatingAllPlaylists}
                    className="h-9 px-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] disabled:opacity-50 border border-white/10 text-xs font-semibold text-white flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 text-[var(--app-accent-soft,#38bdf8)] ${
                        isUpdatingAllPlaylists ? 'animate-spin' : ''
                      }`}
                    />
                    {isUpdatingAllPlaylists ? 'Updating...' : 'Update all playlists'}
                  </button>
                </div>

                {playlistUpdateSummary && (
                  <p className="text-xs text-[var(--app-accent-soft,#38bdf8)] leading-snug">
                    {playlistUpdateSummary}
                  </p>
                )}
                {m3uStatusMessage && (
                  <p className="text-xs text-emerald-400 leading-snug">{m3uStatusMessage}</p>
                )}
                {m3uErrorMessage && (
                  <p className="text-xs text-rose-400 leading-snug">{m3uErrorMessage}</p>
                )}
              </div>

              {/* Core App Settings Categories (Playlists, Other, Appearance, General) */}
              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 pb-1">
                  App Settings
                </p>

                {/* 1. Playlists */}
                <button
                  type="button"
                  onClick={() => setSubView('playlists')}
                  className="w-full min-h-[50px] px-3 py-2.5 rounded-xl hover:bg-white/[0.08] flex items-center justify-between gap-3 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <ListPlus className="w-5 h-5 text-[var(--app-accent-soft,#38bdf8)] shrink-0" />
                    <div className="min-w-0">
                      <span className="block text-[15px] font-semibold text-slate-100">
                        Playlists
                      </span>
                      <span className="block text-xs text-slate-400">
                        {savedPlaylists.length} saved &middot; Add &amp; update playlists
                      </span>
                    </div>
                  </div>
                  <TriangleArrow />
                </button>

                {/* 2. Other */}
                <button
                  type="button"
                  onClick={() => setSubView('other')}
                  className="w-full min-h-[50px] px-3 py-2.5 rounded-xl hover:bg-white/[0.08] flex items-center justify-between gap-3 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <SlidersHorizontal className="w-5 h-5 text-[var(--app-accent-soft,#38bdf8)] shrink-0" />
                    <div className="min-w-0">
                      <span className="block text-[15px] font-semibold text-slate-100">
                        Other
                      </span>
                      <span className="block text-xs text-slate-400 truncate">
                        Search, Reminders ({reminders.length}), Recording, VOD
                      </span>
                    </div>
                  </div>
                  <TriangleArrow />
                </button>

                {/* 3. Appearance */}
                <button
                  type="button"
                  onClick={() => setSubView('appearance')}
                  className="w-full min-h-[50px] px-3 py-2.5 rounded-xl hover:bg-white/[0.08] flex items-center justify-between gap-3 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <Palette className="w-5 h-5 text-[var(--app-accent-soft,#38bdf8)] shrink-0" />
                    <div className="min-w-0">
                      <span className="block text-[15px] font-semibold text-slate-100">
                        Appearance
                      </span>
                      <span className="block text-xs text-slate-400 truncate">
                        {THEME_PRESETS[appearance.colorTheme].label} &middot;{' '}
                        {FONT_SIZE_PX[appearance.fontSize].label} &middot; {appearance.uiTransparency}%
                      </span>
                    </div>
                  </div>
                  <TriangleArrow />
                </button>

                {/* 4. General */}
                <button
                  type="button"
                  onClick={() => setSubView('general')}
                  className="w-full min-h-[50px] px-3 py-2.5 rounded-xl hover:bg-white/[0.08] flex items-center justify-between gap-3 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <Settings2 className="w-5 h-5 text-[var(--app-accent-soft,#38bdf8)] shrink-0" />
                    <div className="min-w-0">
                      <span className="block text-[15px] font-semibold text-slate-100">
                        General
                      </span>
                      <span className="block text-xs text-slate-400 truncate">
                        Startup, PiP, User-Agent, UDP proxy, Backup &amp; Restore
                      </span>
                    </div>
                  </div>
                  <TriangleArrow />
                </button>
              </div>

              {/* Player & Quick Controls */}
              <div className="space-y-1 pt-2 border-t border-white/10">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 pb-1">
                  Playback &amp; Device
                </p>

                <button
                  type="button"
                  onClick={() => setSubView('quality')}
                  className="w-full min-h-[50px] px-3 py-2.5 rounded-xl hover:bg-white/[0.08] flex items-center justify-between gap-3 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <ArrowUpCircle className="w-5 h-5 text-slate-400 shrink-0" />
                    <div className="min-w-0">
                      <span className="block text-[15px] font-semibold text-slate-100">
                        Stream Quality
                      </span>
                      <span className="block text-xs text-slate-400">
                        {selectedQualityLevel === -1
                          ? 'Auto'
                          : hlsLevels[selectedQualityLevel]?.label ?? 'Auto'}
                      </span>
                    </div>
                  </div>
                  <TriangleArrow />
                </button>

                <button
                  type="button"
                  onClick={() => setSubView('audio')}
                  className="w-full min-h-[50px] px-3 py-2.5 rounded-xl hover:bg-white/[0.08] flex items-center justify-between gap-3 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <Volume2 className="w-5 h-5 text-slate-400 shrink-0" />
                    <div className="min-w-0">
                      <span className="block text-[15px] font-semibold text-slate-100">
                        Audio Track
                      </span>
                      <span className="block text-xs text-slate-400 truncate">
                        {audioTracks[selectedAudioTrack]?.name ?? 'Default Stream Audio'}
                      </span>
                    </div>
                  </div>
                  <TriangleArrow />
                </button>

                <button
                  type="button"
                  onClick={() => setSubView('subtitles')}
                  className="w-full min-h-[50px] px-3 py-2.5 rounded-xl hover:bg-white/[0.08] flex items-center justify-between gap-3 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <Info className="w-5 h-5 text-slate-400 shrink-0" />
                    <div className="min-w-0">
                      <span className="block text-[15px] font-semibold text-slate-100">
                        Subtitles / CC
                      </span>
                      <span className="block text-xs text-slate-400 truncate">
                        {selectedSubtitleTrack === -1
                          ? 'Off'
                          : subtitleTracks[selectedSubtitleTrack]?.name ?? 'Enabled'}
                      </span>
                    </div>
                  </div>
                  <TriangleArrow />
                </button>

                <button
                  type="button"
                  onClick={() => setSubView('screenMode')}
                  className="w-full min-h-[50px] px-3 py-2.5 rounded-xl hover:bg-white/[0.08] flex items-center justify-between gap-3 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <RectangleHorizontal className="w-5 h-5 text-slate-400 shrink-0" />
                    <span className="text-[15px] font-semibold text-slate-100 leading-snug">
                      Screen Mode: {SCREEN_MODE_LABELS[screenMode]}
                    </span>
                  </div>
                  <TriangleArrow />
                </button>

                <button
                  type="button"
                  onClick={() => setSubView('qualityMode')}
                  className="w-full min-h-[50px] px-3 py-2.5 rounded-xl hover:bg-white/[0.08] flex items-center justify-between gap-3 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <ArrowUpCircle className="w-5 h-5 text-slate-400 shrink-0" />
                    <div className="min-w-0">
                      <span className="block text-[15px] font-semibold text-slate-100">
                        Stream Quality Mode
                      </span>
                      <span className="block text-xs text-slate-400">
                        {QUALITY_MODE_LABELS[qualityMode]}
                      </span>
                    </div>
                  </div>
                  <TriangleArrow />
                </button>

                <button
                  type="button"
                  onClick={() => setSubView('favorites')}
                  className="w-full min-h-[50px] px-3 py-2.5 rounded-xl hover:bg-white/[0.08] flex items-center justify-between gap-3 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <Star className="w-5 h-5 text-slate-400 shrink-0" />
                    <div className="min-w-0">
                      <span className="block text-[15px] font-semibold text-slate-100">
                        Start Favorite Channels
                      </span>
                      <span className="block text-xs text-slate-400">
                        {startFavoriteChannels ? 'Enabled on launch' : 'Off'} &middot;{' '}
                        {favoriteChannels.length} saved
                      </span>
                    </div>
                  </div>
                  <TriangleArrow />
                </button>

                <button
                  type="button"
                  onClick={() => setSubView('deviceType')}
                  className="w-full min-h-[50px] px-3 py-2.5 rounded-xl hover:bg-white/[0.08] flex items-center justify-between gap-3 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <MonitorSmartphone className="w-5 h-5 text-slate-400 shrink-0" />
                    <div className="min-w-0">
                      <span className="block text-[15px] font-semibold text-slate-100">
                        Select Device Type
                      </span>
                      <span className="block text-xs text-slate-400">
                        {DEVICE_LABELS[deviceType]}
                      </span>
                    </div>
                  </div>
                  <TriangleArrow />
                </button>

                <button
                  type="button"
                  onClick={handleUpdateClick}
                  disabled={checkingUpdate}
                  className="w-full min-h-[50px] px-3 py-2.5 rounded-xl hover:bg-white/[0.08] flex items-center justify-between gap-3 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <RefreshCw
                      className={`w-5 h-5 text-slate-400 shrink-0 ${
                        checkingUpdate ? 'animate-spin text-[#38bdf8]' : ''
                      }`}
                    />
                    <div className="min-w-0">
                      <span className="block text-[15px] font-semibold text-slate-100">
                        Check for Updates
                      </span>
                      {updateMsg && (
                        <span className="block text-xs text-[#38bdf8] mt-0.5">{updateMsg}</span>
                      )}
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={onExitApp}
                  className="w-full min-h-[50px] px-3 py-2.5 rounded-xl hover:bg-rose-500/15 flex items-center gap-3.5 text-left transition-colors cursor-pointer text-slate-100 hover:text-rose-300"
                >
                  <Power className="w-5 h-5 text-slate-400 shrink-0" />
                  <span className="text-[15px] font-semibold">Exit</span>
                </button>
              </div>

              <div className="pt-2 border-t border-white/10">
                <PWAInstallButton />
              </div>
            </>
          )}

          {/* 1. Sub-view: Playlists (Add playlist + Update all playlists) */}
          {subView === 'playlists' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddPlaylistForm((v) => !v)}
                  className="h-11 px-3 rounded-xl bg-[var(--app-accent,#0077ff)] hover:opacity-90 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ListPlus className="w-4 h-4" />
                  Add playlist
                </button>
                <button
                  type="button"
                  onClick={handleUpdateAllClick}
                  disabled={isUpdatingAllPlaylists}
                  className="h-11 px-3 rounded-xl bg-white/10 hover:bg-white/15 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${isUpdatingAllPlaylists ? 'animate-spin' : ''}`} />
                  {isUpdatingAllPlaylists ? 'Updating...' : 'Update all playlists'}
                </button>
              </div>

              {playlistUpdateSummary && (
                <p className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">
                  {playlistUpdateSummary}
                </p>
              )}

              {showAddPlaylistForm && (
                <form
                  onSubmit={handleAddPlaylistSubmit}
                  className="rounded-2xl bg-white/[0.06] border border-white/15 p-4 space-y-3"
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    New Playlist Details
                  </p>
                  <input
                    type="text"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    placeholder="Playlist Name (e.g. Sports HD)"
                    className="w-full h-10 px-3 rounded-xl bg-black/40 border border-white/15 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#0088ff]"
                  />
                  <input
                    type="url"
                    required
                    value={newPlaylistUrl}
                    onChange={(e) => setNewPlaylistUrl(e.target.value)}
                    placeholder="https://example.com/playlist.m3u8"
                    className="w-full h-10 px-3 rounded-xl bg-black/40 border border-white/15 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#0088ff]"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={isLoadingM3u || !newPlaylistUrl.trim()}
                      className="flex-1 h-10 rounded-xl bg-[var(--app-accent,#0077ff)] text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                    >
                      {isLoadingM3u ? 'Saving...' : 'Save Playlist'}
                    </button>
                    <label className="h-10 px-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-medium flex items-center gap-1.5 cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      M3U File
                      <input
                        type="file"
                        accept=".m3u,.m3u8,text/plain"
                        onChange={handleFileUpload}
                        className="sr-only"
                      />
                    </label>
                  </div>
                </form>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Saved Playlists ({savedPlaylists.length})
                  </p>
                  <button
                    type="button"
                    onClick={onResetDefaultPlaylist}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Default Lineup
                  </button>
                </div>

                {savedPlaylists.length === 0 ? (
                  <p className="text-xs text-slate-400 px-3 py-4 rounded-xl bg-white/[0.04]">
                    No custom playlists saved yet. Tap &ldquo;Add playlist&rdquo; to add an M3U/M3U8
                    URL or file.
                  </p>
                ) : (
                  savedPlaylists.map((pl) => {
                    const isActive = activePlaylistId === pl.id;
                    return (
                      <div
                        key={pl.id}
                        className={`rounded-xl p-3 border transition-colors ${
                          isActive
                            ? 'bg-[var(--app-accent,#0077ff)]/20 border-[var(--app-accent,#0077ff)]'
                            : 'bg-white/[0.05] border-white/10'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{pl.name}</p>
                            <p className="text-[11px] text-slate-400 truncate">{pl.url}</p>
                            <p className="text-[11px] text-slate-300 mt-1">
                              {pl.channelCount} channels &middot; Updated{' '}
                              {new Date(pl.lastUpdated).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => onActivateSavedPlaylist(pl)}
                              className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white cursor-pointer"
                            >
                              {isActive ? 'Active' : 'Load'}
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteSavedPlaylist(pl.id)}
                              aria-label={`Delete ${pl.name}`}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* 2. Sub-view: Other (Search, Reminders, Recording, VOD) */}
          {subView === 'other' && (
            <div className="space-y-5">
              {/* Search */}
              <div className="rounded-2xl bg-white/[0.05] border border-white/10 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white flex items-center gap-2">
                    <Search className="w-4 h-4 text-[var(--app-accent-soft,#38bdf8)]" />
                    Search
                  </span>
                  <button
                    type="button"
                    onClick={onOpenSearchBar}
                    className="px-3 py-1 rounded-lg bg-[var(--app-accent,#0077ff)] text-white text-xs font-semibold cursor-pointer"
                  >
                    Open Search
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['all', 'channels', 'programs'] as const).map((scope) => (
                    <button
                      key={scope}
                      type="button"
                      onClick={() => onUpdateOther({ searchScope: scope })}
                      className={`py-2 rounded-lg text-xs font-semibold capitalize cursor-pointer ${
                        other.searchScope === scope
                          ? 'bg-[var(--app-accent,#0077ff)] text-white'
                          : 'bg-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {scope}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reminders */}
              <div className="rounded-2xl bg-white/[0.05] border border-white/10 p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[var(--app-accent-soft,#38bdf8)]" />
                    Reminders
                  </span>
                  <button
                    type="button"
                    onClick={() => onUpdateOther({ remindersEnabled: !other.remindersEnabled })}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer ${
                      other.remindersEnabled
                        ? 'bg-[var(--app-accent,#0077ff)] text-white'
                        : 'bg-white/10 text-slate-400'
                    }`}
                  >
                    {other.remindersEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    placeholder="e.g. 08:30 PM"
                    className="flex-1 h-9 px-3 rounded-xl bg-black/40 border border-white/15 text-xs text-white focus:outline-none focus:border-[#0088ff]"
                  />
                  <button
                    type="button"
                    onClick={() => onAddReminderForCurrentChannel(reminderTime.trim() || 'Soon')}
                    className="h-9 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white cursor-pointer whitespace-nowrap"
                  >
                    + Add Current
                  </button>
                </div>

                {reminders.length === 0 ? (
                  <p className="text-xs text-slate-400">No program reminders scheduled.</p>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {reminders.map((rem) => (
                      <div
                        key={rem.id}
                        className="px-3 py-2 rounded-xl bg-black/30 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white truncate">
                            {rem.channelName}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {rem.programTitle} &middot; {rem.timeLabel}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => onToggleReminder(rem.id)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                              rem.enabled
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-white/10 text-slate-400'
                            }`}
                          >
                            {rem.enabled ? 'ON' : 'OFF'}
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteReminder(rem.id)}
                            aria-label="Delete reminder"
                            className="p-1 text-slate-400 hover:text-rose-300 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recording */}
              <div className="rounded-2xl bg-white/[0.05] border border-white/10 p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white flex items-center gap-2">
                    <Video className="w-4 h-4 text-[var(--app-accent-soft,#38bdf8)]" />
                    Recording
                  </span>
                  <button
                    type="button"
                    onClick={onToggleRecording}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                      isRecording
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-[var(--app-accent,#0077ff)] text-white'
                    }`}
                  >
                    {isRecording ? (
                      <>
                        <Square className="w-3 h-3 fill-white" /> Stop &amp; Save
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 fill-white" /> Record Live
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  {(['webm', 'mp4', 'ts'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => onUpdateOther({ recordingFormat: fmt })}
                      className={`py-1.5 rounded-lg text-xs font-semibold uppercase cursor-pointer ${
                        other.recordingFormat === fmt
                          ? 'bg-white/20 text-white'
                          : 'bg-white/5 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>

                {recordings.length > 0 && (
                  <div className="space-y-1 max-h-28 overflow-y-auto">
                    {recordings.map((rec) => (
                      <div
                        key={rec.id}
                        className="px-2.5 py-1.5 rounded-lg bg-black/30 flex items-center justify-between text-xs"
                      >
                        <span className="truncate text-slate-200">{rec.channelName}</span>
                        <span className="text-slate-400 shrink-0">
                          {rec.status === 'recording' ? 'REC...' : `${rec.durationSec}s saved`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* VOD */}
              <div className="rounded-2xl bg-white/[0.05] border border-white/10 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white flex items-center gap-2">
                    <Film className="w-4 h-4 text-[var(--app-accent-soft,#38bdf8)]" />
                    VOD (Movies &amp; On-Demand)
                  </span>
                  <button
                    type="button"
                    onClick={() => onUpdateOther({ vodEnabled: !other.vodEnabled })}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer ${
                      other.vodEnabled
                        ? 'bg-[var(--app-accent,#0077ff)] text-white'
                        : 'bg-white/10 text-slate-400'
                    }`}
                  >
                    {other.vodEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>
                {other.vodEnabled && (
                  <button
                    type="button"
                    onClick={onOpenVodSection}
                    className="w-full h-9 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white cursor-pointer"
                  >
                    Browse Movies / VOD Catalog
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 3. Sub-view: Appearance (TV guide, Player, Groups, Logos, Language, Font size, Color theme, Transparency) */}
          {subView === 'appearance' && (
            <div className="space-y-4">
              {/* TV Guide */}
              <div className="space-y-1.5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
                  TV guide
                </p>
                <ToggleRow
                  label="Show EPG Program Details"
                  description="Display program title, subtitle & description"
                  checked={appearance.tvGuideShowEpg}
                  onToggle={() =>
                    onUpdateAppearance({ tvGuideShowEpg: !appearance.tvGuideShowEpg })
                  }
                />
                <ToggleRow
                  label="Show Program Time & Progress Bar"
                  checked={appearance.tvGuideShowProgress}
                  onToggle={() =>
                    onUpdateAppearance({ tvGuideShowProgress: !appearance.tvGuideShowProgress })
                  }
                />
              </div>

              {/* Player */}
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
                  Player
                </p>
                <div className="rounded-xl bg-white/[0.05] p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">OSD Auto-Hide Timeout</span>
                    <span className="text-[var(--app-accent-soft,#38bdf8)] font-mono-tabular">
                      {appearance.playerOsdTimeoutSec === 0
                        ? 'Always On'
                        : `${appearance.playerOsdTimeoutSec}s`}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[2, 3.5, 5, 0].map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => onUpdateAppearance({ playerOsdTimeoutSec: sec })}
                        className={`py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                          appearance.playerOsdTimeoutSec === sec
                            ? 'bg-[var(--app-accent,#0077ff)] text-white'
                            : 'bg-white/10 text-slate-300'
                        }`}
                      >
                        {sec === 0 ? 'Stay' : `${sec}s`}
                      </button>
                    ))}
                  </div>
                </div>
                <ToggleRow
                  label="Show Corner Play & Fullscreen Buttons"
                  checked={appearance.playerShowCornerButtons}
                  onToggle={() =>
                    onUpdateAppearance({
                      playerShowCornerButtons: !appearance.playerShowCornerButtons,
                    })
                  }
                />
              </div>

              {/* Groups */}
              <div className="space-y-1.5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
                  Groups
                </p>
                <ToggleRow
                  label="Show Categories Row on Home"
                  checked={appearance.groupsShowRow}
                  onToggle={() => onUpdateAppearance({ groupsShowRow: !appearance.groupsShowRow })}
                />
                <ToggleRow
                  label="Show Channel Count Badges"
                  checked={appearance.groupsShowCounts}
                  onToggle={() =>
                    onUpdateAppearance({ groupsShowCounts: !appearance.groupsShowCounts })
                  }
                />
              </div>

              {/* Logos */}
              <div className="space-y-1.5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
                  Logos
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  {(
                    [
                      ['all', 'Channel Logos'],
                      ['initials', 'Initials'],
                      ['hidden', 'Minimal Icon'],
                    ] as [LogosDisplayMode, string][]
                  ).map(([mode, lbl]) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => onUpdateAppearance({ logosMode: mode })}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold cursor-pointer ${
                        appearance.logosMode === mode
                          ? 'bg-[var(--app-accent,#0077ff)] text-white'
                          : 'bg-white/[0.06] text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Language */}
              <div className="space-y-1.5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
                  Language
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['system', 'en', 'hi', 'pa'] as AppearanceLanguage[]).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => onUpdateAppearance({ language: lang })}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold text-left flex items-center justify-between cursor-pointer ${
                        appearance.language === lang
                          ? 'bg-[var(--app-accent,#0077ff)] text-white'
                          : 'bg-white/[0.06] text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      <span>{LANGUAGE_LABELS[lang]}</span>
                      {appearance.language === lang && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font size */}
              <div className="space-y-1.5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
                  Font size ({FONT_SIZE_PX[appearance.fontSize].label})
                </p>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['small', 'medium', 'large', 'xlarge'] as AppearanceFontSize[]).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => onUpdateAppearance({ fontSize: sz })}
                      className={`py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                        appearance.fontSize === sz
                          ? 'bg-[var(--app-accent,#0077ff)] text-white'
                          : 'bg-white/[0.06] text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {FONT_SIZE_PX[sz].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color theme */}
              <div className="space-y-1.5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
                  Color theme
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(THEME_PRESETS) as AppearanceTheme[]).map((themeKey) => {
                    const preset = THEME_PRESETS[themeKey];
                    const selected = appearance.colorTheme === themeKey;
                    return (
                      <button
                        key={themeKey}
                        type="button"
                        onClick={() => onUpdateAppearance({ colorTheme: themeKey })}
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 cursor-pointer ${
                          selected
                            ? 'border-[var(--app-accent,#0077ff)] bg-white/10'
                            : 'border-white/10 bg-white/[0.04] hover:bg-white/[0.08]'
                        }`}
                      >
                        <span
                          className="w-5 h-5 rounded-full shrink-0 border border-white/25"
                          style={{ backgroundColor: preset.accent }}
                        />
                        <span className="text-xs font-semibold text-white truncate">
                          {preset.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* User interface transparency */}
              <div className="rounded-xl bg-white/[0.05] border border-white/10 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200">User interface transparency</span>
                  <span className="font-mono-tabular font-bold text-[var(--app-accent-soft,#38bdf8)]">
                    {appearance.uiTransparency}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={85}
                  step={5}
                  value={appearance.uiTransparency}
                  onChange={(e) =>
                    onUpdateAppearance({ uiTransparency: Number(e.target.value) })
                  }
                  aria-label="User interface transparency"
                  className="w-full accent-[var(--app-accent,#0077ff)] cursor-pointer"
                />
                <div className="flex justify-between gap-1.5">
                  {[0, 25, 50, 75].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => onUpdateAppearance({ uiTransparency: pct })}
                      className={`flex-1 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${
                        appearance.uiTransparency === pct
                          ? 'bg-[var(--app-accent,#0077ff)] text-white'
                          : 'bg-white/10 text-slate-300'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 4. Sub-view: General (5 ON/OFF toggles + User-Agent + UDP proxy + Back up & Restore) */}
          {subView === 'general' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
                  Startup &amp; Navigation
                </p>
                <ToggleRow
                  label="Auto start app on boot"
                  description="Skip splash delay & launch straight into Live TV"
                  checked={general.autoStartOnBoot}
                  onToggle={() =>
                    onUpdateGeneral({ autoStartOnBoot: !general.autoStartOnBoot })
                  }
                />
                <ToggleRow
                  label="Auto start app on wake up from sleep mode"
                  description="Automatically resume live stream when screen wakes"
                  checked={general.autoStartOnWake}
                  onToggle={() =>
                    onUpdateGeneral({ autoStartOnWake: !general.autoStartOnWake })
                  }
                />
                <ToggleRow
                  label="Turn on last channel on app start"
                  description="Restore your last watched channel on next open"
                  checked={general.turnOnLastChannel}
                  onToggle={() =>
                    onUpdateGeneral({ turnOnLastChannel: !general.turnOnLastChannel })
                  }
                />
                <ToggleRow
                  label="Switch to picture-in-picture mode on press Home"
                  description="Enter floating PiP window when pressing Home"
                  checked={general.pipOnHomePress}
                  onToggle={() =>
                    onUpdateGeneral({ pipOnHomePress: !general.pipOnHomePress })
                  }
                />
                <ToggleRow
                  label="Confirm exit by second press Back"
                  description="Require pressing Back/Esc twice to exit"
                  checked={general.confirmExitSecondBack}
                  onToggle={() =>
                    onUpdateGeneral({
                      confirmExitSecondBack: !general.confirmExitSecondBack,
                    })
                  }
                />
              </div>

              {/* User-Agent & UDP Proxy */}
              <form
                onSubmit={handleSaveNetworkConfig}
                className="rounded-2xl bg-white/[0.05] border border-white/10 p-4 space-y-3"
              >
                <p className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Stream Network Headers &amp; Proxy
                </p>

                <div>
                  <label
                    htmlFor="ua-input"
                    className="block text-xs text-slate-400 mb-1"
                  >
                    User-Agent
                  </label>
                  <input
                    id="ua-input"
                    type="text"
                    value={userAgentDraft}
                    onChange={(e) => setUserAgentDraft(e.target.value)}
                    placeholder="BALINDER-LiveTV-Player/1.0"
                    className="w-full h-9 px-3 rounded-xl bg-black/40 border border-white/15 text-xs text-white focus:outline-none focus:border-[#0088ff]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="udp-proxy-input"
                    className="block text-xs text-slate-400 mb-1"
                  >
                    UDP proxy (address:port)
                  </label>
                  <input
                    id="udp-proxy-input"
                    type="text"
                    value={udpProxyDraft}
                    onChange={(e) => setUdpProxyDraft(e.target.value)}
                    placeholder="e.g. 192.168.1.1:4022"
                    className="w-full h-9 px-3 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#0088ff]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-9 rounded-xl bg-[var(--app-accent,#0077ff)] hover:opacity-90 text-white text-xs font-semibold cursor-pointer"
                >
                  Save Network Settings
                </button>
              </form>

              {/* Back up & Restore */}
              <div className="rounded-2xl bg-white/[0.05] border border-white/10 p-4 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  App Data Backup &amp; Restore
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={onBackupAppData}
                    className="h-10 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-[var(--app-accent-soft,#38bdf8)]" />
                    Back up
                  </button>

                  <label className="h-10 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer">
                    <FolderUp className="w-4 h-4 text-[var(--app-accent-soft,#38bdf8)]" />
                    Restore
                    <input
                      type="file"
                      accept="application/json,.json"
                      onChange={handleRestoreFileChange}
                      className="sr-only"
                    />
                  </label>
                </div>

                {generalStatusMsg && (
                  <p className="text-xs text-[var(--app-accent-soft,#38bdf8)] leading-snug">
                    {generalStatusMsg}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Sub-view: Stream Quality */}
          {subView === 'quality' && (
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => onSelectQualityLevel(-1)}
                className={`w-full min-h-[48px] px-4 rounded-xl flex items-center justify-between text-sm font-medium cursor-pointer ${
                  selectedQualityLevel === -1
                    ? 'bg-[var(--app-accent,#0077ff)] text-white'
                    : 'bg-white/[0.05] hover:bg-white/[0.1] text-slate-200'
                }`}
              >
                <span>Auto (Adaptive Bitrate)</span>
                {selectedQualityLevel === -1 && <Check className="w-4 h-4" />}
              </button>

              {hlsLevels.length === 0 ? (
                <p className="text-xs text-slate-400 px-2 pt-2">
                  The active stream provides a single adaptive quality variant.
                </p>
              ) : (
                hlsLevels.map((lvl) => (
                  <button
                    key={lvl.index}
                    type="button"
                    onClick={() => onSelectQualityLevel(lvl.index)}
                    className={`w-full min-h-[48px] px-4 rounded-xl flex items-center justify-between text-sm font-medium cursor-pointer ${
                      selectedQualityLevel === lvl.index
                        ? 'bg-[var(--app-accent,#0077ff)] text-white'
                        : 'bg-white/[0.05] hover:bg-white/[0.1] text-slate-200'
                    }`}
                  >
                    <span>
                      {lvl.label}
                      {lvl.bitrate ? ` (${Math.round(lvl.bitrate / 1000)} kbps)` : ''}
                    </span>
                    {selectedQualityLevel === lvl.index && <Check className="w-4 h-4" />}
                  </button>
                ))
              )}
            </div>
          )}

          {/* Sub-view: Audio Track */}
          {subView === 'audio' && (
            <div className="space-y-1.5">
              {audioTracks.length === 0 ? (
                <div className="px-4 py-3 rounded-xl bg-white/[0.05] text-sm text-slate-300 flex items-center justify-between">
                  <span>Default Stream Audio</span>
                  <Check className="w-4 h-4 text-[#38bdf8]" />
                </div>
              ) : (
                audioTracks.map((track) => (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() => onSelectAudioTrack(track.id)}
                    className={`w-full min-h-[48px] px-4 rounded-xl flex items-center justify-between text-sm font-medium cursor-pointer ${
                      selectedAudioTrack === track.id
                        ? 'bg-[var(--app-accent,#0077ff)] text-white'
                        : 'bg-white/[0.05] hover:bg-white/[0.1] text-slate-200'
                    }`}
                  >
                    <span>
                      {track.name} {track.lang ? `(${track.lang.toUpperCase()})` : ''}
                    </span>
                    {selectedAudioTrack === track.id && <Check className="w-4 h-4" />}
                  </button>
                ))
              )}
            </div>
          )}

          {/* Sub-view: Subtitles / CC */}
          {subView === 'subtitles' && (
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => onSelectSubtitleTrack(-1)}
                className={`w-full min-h-[48px] px-4 rounded-xl flex items-center justify-between text-sm font-medium cursor-pointer ${
                  selectedSubtitleTrack === -1
                    ? 'bg-[var(--app-accent,#0077ff)] text-white'
                    : 'bg-white/[0.05] hover:bg-white/[0.1] text-slate-200'
                }`}
              >
                <span>Off</span>
                {selectedSubtitleTrack === -1 && <Check className="w-4 h-4" />}
              </button>
              {subtitleTracks.length === 0 ? (
                <p className="text-xs text-slate-400 px-2 pt-2">
                  No closed-caption tracks advertised by the current channel stream.
                </p>
              ) : (
                subtitleTracks.map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => onSelectSubtitleTrack(sub.id)}
                    className={`w-full min-h-[48px] px-4 rounded-xl flex items-center justify-between text-sm font-medium cursor-pointer ${
                      selectedSubtitleTrack === sub.id
                        ? 'bg-[var(--app-accent,#0077ff)] text-white'
                        : 'bg-white/[0.05] hover:bg-white/[0.1] text-slate-200'
                    }`}
                  >
                    <span>
                      {sub.name} {sub.lang ? `(${sub.lang.toUpperCase()})` : ''}
                    </span>
                    {selectedSubtitleTrack === sub.id && <Check className="w-4 h-4" />}
                  </button>
                ))
              )}
            </div>
          )}

          {/* Sub-view: Screen Mode */}
          {subView === 'screenMode' && (
            <div className="space-y-1.5">
              {(['stretch', 'fit', 'zoom'] as ScreenMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onChangeScreenMode(mode)}
                  className={`w-full min-h-[48px] px-4 rounded-xl flex items-center justify-between text-sm font-medium cursor-pointer ${
                    screenMode === mode
                      ? 'bg-[var(--app-accent,#0077ff)] text-white'
                      : 'bg-white/[0.05] hover:bg-white/[0.1] text-slate-200'
                  }`}
                >
                  <span>{SCREEN_MODE_LABELS[mode]}</span>
                  {screenMode === mode && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          )}

          {/* Sub-view: Stream Quality Mode */}
          {subView === 'qualityMode' && (
            <div className="space-y-1.5">
              {(['auto', 'high', 'low'] as QualityMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onChangeQualityMode(mode)}
                  className={`w-full min-h-[48px] px-4 rounded-xl flex items-center justify-between text-sm font-medium cursor-pointer ${
                    qualityMode === mode
                      ? 'bg-[var(--app-accent,#0077ff)] text-white'
                      : 'bg-white/[0.05] hover:bg-white/[0.1] text-slate-200'
                  }`}
                >
                  <span>{QUALITY_MODE_LABELS[mode]}</span>
                  {qualityMode === mode && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          )}

          {/* Sub-view: Start Favorite Channels */}
          {subView === 'favorites' && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={onToggleStartFavoriteChannels}
                className="w-full min-h-[50px] px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-between text-sm font-medium cursor-pointer"
              >
                <span>Start with Favorite Channels on Launch</span>
                <span
                  className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                    startFavoriteChannels
                      ? 'bg-[var(--app-accent,#0077ff)] text-white'
                      : 'bg-white/10 text-slate-400'
                  }`}
                >
                  {startFavoriteChannels ? 'ON' : 'OFF'}
                </span>
              </button>

              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">
                  Saved Favorites ({favoriteChannels.length})
                </p>
                {favoriteChannels.length === 0 ? (
                  <p className="text-xs text-slate-400 px-1">
                    Tap the heart icon on any channel card to save it to your favorites.
                  </p>
                ) : (
                  favoriteChannels.map((ch) => (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => {
                        onSelectFavoriteChannel(ch);
                        onClose();
                      }}
                      className="w-full min-h-[48px] px-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-between text-sm font-medium text-slate-100 cursor-pointer"
                    >
                      <span className="truncate">{ch.name}</span>
                      <span className="text-xs text-slate-400 shrink-0">{ch.group}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Sub-view: Select Device Type */}
          {subView === 'deviceType' && (
            <div className="space-y-1.5">
              {(['auto', 'tv', 'desktop', 'mobile'] as DeviceType[]).map((dev) => (
                <button
                  key={dev}
                  type="button"
                  onClick={() => onChangeDeviceType(dev)}
                  className={`w-full min-h-[48px] px-4 rounded-xl flex items-center justify-between text-sm font-medium cursor-pointer ${
                    deviceType === dev
                      ? 'bg-[var(--app-accent,#0077ff)] text-white'
                      : 'bg-white/[0.05] hover:bg-white/[0.1] text-slate-200'
                  }`}
                >
                  <span>{DEVICE_LABELS[dev]}</span>
                  {deviceType === dev && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
