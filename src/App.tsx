import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AppBackupData,
  AppearanceSettings,
  Channel,
  DeviceType,
  GeneralSettings,
  HlsQualityLevel,
  HlsTrackItem,
  OtherSettings,
  ProgramReminder,
  QualityMode,
  RecordingEntry,
  SavedPlaylist,
  ScreenMode,
} from './types/iptv';
import { DEFAULT_M3U_PLAYLIST, hydrateDefaultLogos } from './data/defaultPlaylist';
import {
  DEFAULT_APPEARANCE_SETTINGS,
  DEFAULT_GENERAL_SETTINGS,
  DEFAULT_OTHER_SETTINGS,
  FONT_SIZE_PX,
  THEME_PRESETS,
} from './data/settingsDefaults';
import { extractCategories, parseM3U } from './utils/m3uParser';
import { SettingsProvider } from './context/SettingsContext';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { HlsPlayer } from './components/HlsPlayer';
import { NowPlayingPanel } from './components/NowPlayingPanel';
import { ContentRows } from './components/ContentRows';
import { SettingsPanel } from './components/SettingsPanel';
import { SplashScreen } from './components/SplashScreen';

const STORAGE_KEYS = {
  m3uUrl: 'livetv_m3u_url',
  playlistText: 'livetv_playlist_text',
  savedPlaylists: 'livetv_saved_playlists',
  activePlaylistId: 'livetv_active_playlist_id',
  favorites: 'livetv_favorites',
  lastChannelId: 'livetv_last_channel_id',
  screenMode: 'livetv_screen_mode',
  qualityMode: 'livetv_quality_mode',
  deviceType: 'livetv_device_type',
  startFavorites: 'livetv_start_favorites',
  appearance: 'livetv_appearance_settings',
  general: 'livetv_general_settings',
  other: 'livetv_other_settings',
  reminders: 'livetv_reminders',
};

function readJsonStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return fallback;
  }
}

function readArrayStorage<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadInitialChannels(udpProxy?: string): Channel[] {
  try {
    const savedText = localStorage.getItem(STORAGE_KEYS.playlistText);
    if (savedText) {
      const parsed = parseM3U(savedText, udpProxy);
      if (parsed.length > 0) return hydrateDefaultLogos(parsed);
    }
  } catch {
    // Ignore storage read error
  }
  return hydrateDefaultLogos(parseM3U(DEFAULT_M3U_PLAYLIST, udpProxy));
}

export default function App() {
  const [appearance, setAppearance] = useState<AppearanceSettings>(() =>
    readJsonStorage(STORAGE_KEYS.appearance, DEFAULT_APPEARANCE_SETTINGS)
  );
  const [general, setGeneral] = useState<GeneralSettings>(() =>
    readJsonStorage(STORAGE_KEYS.general, DEFAULT_GENERAL_SETTINGS)
  );
  const [other, setOther] = useState<OtherSettings>(() =>
    readJsonStorage(STORAGE_KEYS.other, DEFAULT_OTHER_SETTINGS)
  );

  const [channels, setChannels] = useState<Channel[]>(() =>
    loadInitialChannels(general.udpProxy)
  );
  const [savedPlaylists, setSavedPlaylists] = useState<SavedPlaylist[]>(() =>
    readArrayStorage<SavedPlaylist>(STORAGE_KEYS.savedPlaylists)
  );
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.activePlaylistId);
    } catch {
      return null;
    }
  });
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() =>
    readArrayStorage<string>(STORAGE_KEYS.favorites)
  );
  const [reminders, setReminders] = useState<ProgramReminder[]>(() =>
    readArrayStorage<ProgramReminder>(STORAGE_KEYS.reminders)
  );
  const [startFavoriteChannels, setStartFavoriteChannels] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.startFavorites) === 'true';
    } catch {
      return false;
    }
  });

  const [activeNav, setActiveNav] = useState<string>(() =>
    startFavoriteChannels ? 'Favorites' : 'Home'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllChannelsGrid, setShowAllChannelsGrid] = useState(false);

  const [activeChannelId, setActiveChannelId] = useState<string>(() => {
    const initialList = loadInitialChannels(general.udpProxy);
    if (startFavoriteChannels && favoriteIds.length > 0) {
      const firstFav = initialList.find((c) => favoriteIds.includes(c.id));
      if (firstFav) return firstFav.id;
    }
    if (general.turnOnLastChannel) {
      try {
        const lastId = localStorage.getItem(STORAGE_KEYS.lastChannelId);
        if (lastId && initialList.some((c) => c.id === lastId)) {
          return lastId;
        }
      } catch {
        // Ignore
      }
    }
    return initialList[0]?.id ?? '';
  });

  // UI overlays & responsive mode
  const [showSplash, setShowSplash] = useState<boolean>(() => !general.autoStartOnBoot);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isExited, setIsExited] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState<RecordingEntry[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingStartMsRef = useRef<number>(0);

  // Refs for player PiP/Recording, Search focus, ContentRows scroll, and confirm-exit back press
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const contentRowsRef = useRef<HTMLDivElement | null>(null);
  const backExitArmedRef = useRef<boolean>(false);
  const backExitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
  }, []);

  const showToast = useCallback((msg: string, durationMs = 2800) => {
    setToastMessage(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, durationMs);
  }, []);

  // M3U Manager state
  const [m3uUrl, setM3uUrl] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.m3uUrl) ?? '';
    } catch {
      return '';
    }
  });
  const [isLoadingM3u, setIsLoadingM3u] = useState(false);
  const [isUpdatingAllPlaylists, setIsUpdatingAllPlaylists] = useState(false);
  const [m3uStatusMessage, setM3uStatusMessage] = useState<string | null>(null);
  const [m3uErrorMessage, setM3uErrorMessage] = useState<string | null>(null);

  // Player / Settings linked controls
  const [hlsLevels, setHlsLevels] = useState<HlsQualityLevel[]>([]);
  const [selectedQualityLevel, setSelectedQualityLevel] = useState<number>(-1);
  const [audioTracks, setAudioTracks] = useState<HlsTrackItem[]>([]);
  const [selectedAudioTrack, setSelectedAudioTrack] = useState<number>(0);
  const [subtitleTracks, setSubtitleTracks] = useState<HlsTrackItem[]>([]);
  const [selectedSubtitleTrack, setSelectedSubtitleTrack] = useState<number>(-1);

  const [screenMode, setScreenMode] = useState<ScreenMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.screenMode) as ScreenMode | null;
      return saved === 'fit' || saved === 'zoom' || saved === 'stretch' ? saved : 'stretch';
    } catch {
      return 'stretch';
    }
  });
  const [qualityMode, setQualityMode] = useState<QualityMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.qualityMode) as QualityMode | null;
      return saved === 'auto' || saved === 'high' || saved === 'low' ? saved : 'auto';
    } catch {
      return 'auto';
    }
  });
  const [deviceType, setDeviceType] = useState<DeviceType>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.deviceType) as DeviceType | null;
      return saved === 'auto' || saved === 'tv' || saved === 'desktop' || saved === 'mobile'
        ? saved
        : 'auto';
    } catch {
      return 'auto';
    }
  });

  // OSD trigger & numeric D-pad entry
  const [osdTriggerKey, setOsdTriggerKey] = useState(0);
  const [numericInput, setNumericInput] = useState('');
  const numericTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Apply live Appearance CSS variables (Theme, Font Size, Language)
  useEffect(() => {
    const preset = THEME_PRESETS[appearance.colorTheme];
    const root = document.documentElement;
    root.style.setProperty('--app-bg', preset.bg);
    root.style.setProperty('--app-card', preset.card);
    root.style.setProperty('--app-accent', preset.accent);
    root.style.setProperty('--app-accent-soft', preset.accentSoft);
    root.style.fontSize = `${FONT_SIZE_PX[appearance.fontSize].rootPx}px`;
    root.lang =
      appearance.language === 'system'
        ? navigator.language || 'en'
        : appearance.language;
  }, [appearance.colorTheme, appearance.fontSize, appearance.language]);

  // Persist user settings
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(favoriteIds));
      localStorage.setItem(STORAGE_KEYS.savedPlaylists, JSON.stringify(savedPlaylists));
      localStorage.setItem(STORAGE_KEYS.reminders, JSON.stringify(reminders));
      if (activePlaylistId) {
        localStorage.setItem(STORAGE_KEYS.activePlaylistId, activePlaylistId);
      } else {
        localStorage.removeItem(STORAGE_KEYS.activePlaylistId);
      }
    } catch {
      // Ignore storage error
    }
  }, [favoriteIds, savedPlaylists, reminders, activePlaylistId]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.screenMode, screenMode);
      localStorage.setItem(STORAGE_KEYS.qualityMode, qualityMode);
      localStorage.setItem(STORAGE_KEYS.deviceType, deviceType);
      localStorage.setItem(STORAGE_KEYS.startFavorites, String(startFavoriteChannels));
      localStorage.setItem(STORAGE_KEYS.appearance, JSON.stringify(appearance));
      localStorage.setItem(STORAGE_KEYS.general, JSON.stringify(general));
      localStorage.setItem(STORAGE_KEYS.other, JSON.stringify(other));
    } catch {
      // Ignore storage error
    }
  }, [screenMode, qualityMode, deviceType, startFavoriteChannels, appearance, general, other]);

  // Save last watched channel for "Turn on last channel on app start"
  useEffect(() => {
    if (!activeChannelId) return;
    try {
      localStorage.setItem(STORAGE_KEYS.lastChannelId, activeChannelId);
    } catch {
      // Ignore
    }
  }, [activeChannelId]);

  // Auto start/resume playback on wake up from sleep mode
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && general.autoStartOnWake && !isExited) {
        videoElementRef.current?.play().catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [general.autoStartOnWake, isExited]);

  // Derived Categories from group-title
  const categories = useMemo(() => extractCategories(channels), [channels]);

  // Filtered Live TV Channels based on active sidebar nav + search query + Other.searchScope
  const filteredChannels = useMemo(() => {
    let list = channels;

    if (activeNav === 'Favorites') {
      list = list.filter((c) => favoriteIds.includes(c.id));
    } else if (
      activeNav !== 'Home' &&
      activeNav !== 'Live TV' &&
      activeNav !== 'Categories' &&
      activeNav !== 'Settings'
    ) {
      list = list.filter((c) => c.group.toLowerCase() === activeNav.toLowerCase());
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((c) => {
        if (other.searchScope === 'channels') {
          return c.name.toLowerCase().includes(q) || c.group.toLowerCase().includes(q);
        }
        if (other.searchScope === 'programs') {
          return (
            c.programTitle.toLowerCase().includes(q) ||
            c.programSubtitle.toLowerCase().includes(q)
          );
        }
        return (
          c.name.toLowerCase().includes(q) ||
          c.group.toLowerCase().includes(q) ||
          c.programTitle.toLowerCase().includes(q)
        );
      });
    }

    return list;
  }, [channels, activeNav, favoriteIds, searchQuery, other.searchScope]);

  const activeChannel = useMemo(() => {
    return channels.find((c) => c.id === activeChannelId) ?? channels[0];
  }, [channels, activeChannelId]);

  const favoriteChannels = useMemo(
    () => channels.filter((c) => favoriteIds.includes(c.id)),
    [channels, favoriteIds]
  );

  // Channel Selection & Zapping
  const handleSelectChannel = useCallback((ch: Channel) => {
    setActiveChannelId(ch.id);
    setIsExited(false);
    setSelectedQualityLevel(-1);
    setSelectedAudioTrack(0);
    setSelectedSubtitleTrack(-1);
    setOsdTriggerKey((k) => k + 1);
  }, []);

  const zapChannel = useCallback(
    (direction: 1 | -1) => {
      const pool = filteredChannels.length > 0 ? filteredChannels : channels;
      if (pool.length === 0) return;

      const currentIdx = pool.findIndex((c) => c.id === activeChannel?.id);
      const nextIdx =
        currentIdx === -1
          ? 0
          : (currentIdx + direction + pool.length) % pool.length;

      handleSelectChannel(pool[nextIdx]);
    },
    [activeChannel?.id, filteredChannels, channels, handleSelectChannel]
  );

  const handleToggleFavorite = useCallback((channelId: string) => {
    setFavoriteIds((prev) =>
      prev.includes(channelId) ? prev.filter((id) => id !== channelId) : [...prev, channelId]
    );
  }, []);

  // Helper to fetch M3U text using custom User-Agent
  const fetchPlaylistText = useCallback(
    async (targetUrl: string): Promise<string> => {
      const proxyRes = await fetch(
        `/api/fetch-m3u?url=${encodeURIComponent(targetUrl)}&ua=${encodeURIComponent(
          general.userAgent
        )}`
      );
      if (proxyRes.ok) {
        return proxyRes.text();
      }
      const directRes = await fetch(targetUrl);
      if (!directRes.ok) {
        const errJson = await proxyRes.json().catch(() => null);
        throw new Error(errJson?.error || `Failed to load URL (HTTP ${proxyRes.status}).`);
      }
      return directRes.text();
    },
    [general.userAgent]
  );

  // Load M3U content string into app state
  const applyM3uText = useCallback(
    (text: string, sourceLabel: string) => {
      const parsed = parseM3U(text, general.udpProxy);
      if (parsed.length === 0) {
        setM3uErrorMessage(
          `No playable streams found in ${sourceLabel}. Ensure it is a valid #EXTM3U or .m3u8 playlist.`
        );
        setM3uStatusMessage(null);
        return 0;
      }

      const hydrated = hydrateDefaultLogos(parsed);
      const cats = extractCategories(hydrated);

      setChannels(hydrated);
      setActiveChannelId(hydrated[0].id);
      setActiveNav('Home');
      setIsExited(false);
      setOsdTriggerKey((k) => k + 1);
      setM3uErrorMessage(null);
      setM3uStatusMessage(
        `Loaded ${hydrated.length} channels across ${cats.length} categories from ${sourceLabel}.`
      );

      try {
        localStorage.setItem(STORAGE_KEYS.playlistText, text);
      } catch {
        // Ignore storage quota issues
      }
      return hydrated.length;
    },
    [general.udpProxy]
  );

  // Save & Load M3U URL + store in savedPlaylists
  const handleSaveAndLoadM3uUrl = useCallback(
    async (rawUrl: string, customName?: string) => {
      const trimmed = rawUrl.trim();
      if (!trimmed) return;

      setIsLoadingM3u(true);
      setM3uErrorMessage(null);
      setM3uStatusMessage(null);

      try {
        const playlistText = await fetchPlaylistText(trimmed);
        const count = applyM3uText(playlistText, customName || 'saved M3U URL');
        if (count > 0) {
          setM3uUrl(trimmed);
          try {
            localStorage.setItem(STORAGE_KEYS.m3uUrl, trimmed);
          } catch {
            // Ignore
          }

          let derivedName = customName || '';
          if (!derivedName) {
            try {
              derivedName = new URL(trimmed).hostname.replace(/^www\./, '');
            } catch {
              derivedName = 'Custom Playlist';
            }
          }

          setSavedPlaylists((prev) => {
            const existing = prev.find((p) => p.url === trimmed);
            if (existing) {
              setActivePlaylistId(existing.id);
              return prev.map((p) =>
                p.id === existing.id
                  ? {
                      ...p,
                      name: customName || p.name,
                      channelCount: count,
                      lastUpdated: new Date().toISOString(),
                      content: playlistText,
                    }
                  : p
              );
            }
            const nextId = `pl-${Date.now()}`;
            setActivePlaylistId(nextId);
            return [
              {
                id: nextId,
                name: derivedName,
                url: trimmed,
                channelCount: count,
                lastUpdated: new Date().toISOString(),
                content: playlistText,
              },
              ...prev,
            ];
          });
        }
      } catch (err) {
        setM3uErrorMessage(
          err instanceof Error ? err.message : 'Unable to fetch M3U playlist URL.'
        );
      } finally {
        setIsLoadingM3u(false);
      }
    },
    [fetchPlaylistText, applyM3uText]
  );

  const handleActivateSavedPlaylist = useCallback(
    (pl: SavedPlaylist) => {
      if (pl.content) {
        const count = applyM3uText(pl.content, pl.name);
        if (count > 0) {
          setActivePlaylistId(pl.id);
          setM3uUrl(pl.url);
        }
      } else {
        handleSaveAndLoadM3uUrl(pl.url, pl.name);
      }
    },
    [applyM3uText, handleSaveAndLoadM3uUrl]
  );

  const handleDeleteSavedPlaylist = useCallback(
    (id: string) => {
      setSavedPlaylists((prev) => prev.filter((p) => p.id !== id));
      if (activePlaylistId === id) {
        setActivePlaylistId(null);
      }
    },
    [activePlaylistId]
  );

  const handleUpdateAllPlaylists = useCallback(async (): Promise<string> => {
    setIsUpdatingAllPlaylists(true);
    try {
      const targets = [...savedPlaylists];
      if (m3uUrl && !targets.some((t) => t.url === m3uUrl)) {
        targets.unshift({
          id: 'active-url',
          name: 'Active M3U URL',
          url: m3uUrl,
          channelCount: channels.length,
          lastUpdated: new Date().toISOString(),
        });
      }

      if (targets.length === 0) {
        const refreshed = hydrateDefaultLogos(parseM3U(DEFAULT_M3U_PLAYLIST, general.udpProxy));
        setChannels(refreshed);
        return `Refreshed default playlist (${refreshed.length} channels).`;
      }

      let updatedCount = 0;
      let totalChannels = 0;
      const nextSaved = [...savedPlaylists];

      for (const pl of targets) {
        try {
          const text = await fetchPlaylistText(pl.url);
          const parsed = parseM3U(text, general.udpProxy);
          if (parsed.length > 0) {
            updatedCount++;
            totalChannels += parsed.length;
            const idx = nextSaved.findIndex((item) => item.id === pl.id);
            if (idx !== -1) {
              nextSaved[idx] = {
                ...nextSaved[idx],
                channelCount: parsed.length,
                lastUpdated: new Date().toISOString(),
                content: text,
              };
            }
            if (pl.id === activePlaylistId || pl.url === m3uUrl) {
              applyM3uText(text, pl.name);
            }
          }
        } catch {
          // Continue updating remaining playlists
        }
      }

      setSavedPlaylists(nextSaved);
      return updatedCount > 0
        ? `Updated ${updatedCount} playlist(s) · ${totalChannels} channels verified.`
        : 'Could not reach upstream playlists. Check network or User-Agent.';
    } finally {
      setIsUpdatingAllPlaylists(false);
    }
  }, [
    savedPlaylists,
    m3uUrl,
    channels.length,
    general.udpProxy,
    fetchPlaylistText,
    activePlaylistId,
    applyM3uText,
  ]);

  const handleResetDefaultPlaylist = useCallback(() => {
    const defaultChannels = hydrateDefaultLogos(parseM3U(DEFAULT_M3U_PLAYLIST, general.udpProxy));
    setChannels(defaultChannels);
    setActiveChannelId(defaultChannels[0].id);
    setActivePlaylistId(null);
    setM3uUrl('');
    setM3uErrorMessage(null);
    setM3uStatusMessage('Restored default Live TV channel lineup.');
    setActiveNav('Home');
    setIsExited(false);
    setOsdTriggerKey((k) => k + 1);
    try {
      localStorage.removeItem(STORAGE_KEYS.m3uUrl);
      localStorage.removeItem(STORAGE_KEYS.playlistText);
    } catch {
      // Ignore
    }
  }, [general.udpProxy]);

  const handleCheckForUpdates = useCallback(async () => {
    if (m3uUrl) {
      await handleSaveAndLoadM3uUrl(m3uUrl);
      return 'Playlist refreshed from saved M3U URL.';
    }
    return `Channel lineup is up to date (${channels.length} channels active).`;
  }, [m3uUrl, handleSaveAndLoadM3uUrl, channels.length]);

  const handleExitApp = useCallback(async () => {
    setIsSettingsOpen(false);
    setIsExited(true);
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {
        // Ignore
      }
    }
  }, []);

  // Picture-in-Picture trigger when pressing Home
  const triggerPipIfEnabled = useCallback(async () => {
    if (!general.pipOnHomePress) return;
    const video = videoElementRef.current;
    if (!video || video.paused || !document.pictureInPictureEnabled) return;
    try {
      if (document.pictureInPictureElement !== video) {
        await video.requestPictureInPicture();
        showToast('Switched to Picture-in-Picture mode');
      }
    } catch {
      // Ignore browser PiP restriction when triggered indirectly
    }
  }, [general.pipOnHomePress, showToast]);

  // Reminders handlers
  const handleAddReminderForCurrentChannel = useCallback(
    (timeLabel: string) => {
      if (!activeChannel) return;
      const newRem: ProgramReminder = {
        id: `rem-${Date.now()}`,
        channelId: activeChannel.id,
        channelName: activeChannel.name,
        programTitle: activeChannel.programTitle,
        timeLabel,
        enabled: true,
      };
      setReminders((prev) => [newRem, ...prev]);
      showToast(`Reminder set for ${activeChannel.name} (${timeLabel})`);
    },
    [activeChannel, showToast]
  );

  // Recording handler (captures video stream when supported, else records timed DVR clip entry)
  const handleToggleRecording = useCallback(() => {
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      const elapsedSec = Math.max(
        1,
        Math.round((Date.now() - recordingStartMsRef.current) / 1000)
      );
      setIsRecording(false);
      setRecordings((prev) =>
        prev.map((r, i) =>
          i === 0 && r.status === 'recording'
            ? { ...r, durationSec: elapsedSec, status: 'saved' }
            : r
        )
      );
      showToast(`Recording saved (${elapsedSec}s)`);
      return;
    }

    if (!activeChannel) return;
    recordingStartMsRef.current = Date.now();
    const recId = `rec-${Date.now()}`;
    setRecordings((prev) => [
      {
        id: recId,
        channelName: activeChannel.name,
        startedAt: new Date().toLocaleTimeString(),
        durationSec: 0,
        status: 'recording',
      },
      ...prev,
    ]);
    setIsRecording(true);
    showToast(`Recording started: ${activeChannel.name}`);

    const video = videoElementRef.current as (HTMLVideoElement & {
      captureStream?: () => MediaStream;
    }) | null;
    if (video && typeof video.captureStream === 'function' && typeof MediaRecorder !== 'undefined') {
      try {
        const stream = video.captureStream();
        const recorder = new MediaRecorder(stream);
        const chunks: Blob[] = [];
        recorder.ondataavailable = (ev) => {
          if (ev.data.size > 0) chunks.push(ev.data);
        };
        recorder.onstop = () => {
          if (chunks.length > 0) {
            const blob = new Blob(chunks, { type: recorder.mimeType || 'video/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${activeChannel.name.replace(/[^a-z0-9]+/gi, '_')}.${other.recordingFormat}`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
          }
        };
        recorder.start();
        mediaRecorderRef.current = recorder;
      } catch {
        // Cross-origin video stream: timed DVR session log still works cleanly
      }
    }
  }, [isRecording, activeChannel, other.recordingFormat, showToast]);

  // Backup & Restore handlers
  const handleBackupAppData = useCallback(() => {
    const payload: AppBackupData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      m3uUrl,
      savedPlaylists,
      favoriteIds,
      reminders,
      screenMode,
      qualityMode,
      deviceType,
      startFavoriteChannels,
      lastChannelId: activeChannelId,
      appearance,
      general,
      other,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateTag = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `balinder-livetv-backup-${dateTag}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast('App backup downloaded');
  }, [
    m3uUrl,
    savedPlaylists,
    favoriteIds,
    reminders,
    screenMode,
    qualityMode,
    deviceType,
    startFavoriteChannels,
    activeChannelId,
    appearance,
    general,
    other,
    showToast,
  ]);

  const handleRestoreAppData = useCallback(
    async (file: File): Promise<string> => {
      try {
        const text = await file.text();
        const data = JSON.parse(text) as Partial<AppBackupData>;
        if (!data || typeof data !== 'object' || !data.appearance || !data.general) {
          return 'Invalid backup file format.';
        }
        setAppearance({ ...DEFAULT_APPEARANCE_SETTINGS, ...data.appearance });
        setGeneral({ ...DEFAULT_GENERAL_SETTINGS, ...data.general });
        if (data.other) setOther({ ...DEFAULT_OTHER_SETTINGS, ...data.other });
        if (Array.isArray(data.savedPlaylists)) setSavedPlaylists(data.savedPlaylists);
        if (Array.isArray(data.favoriteIds)) setFavoriteIds(data.favoriteIds);
        if (Array.isArray(data.reminders)) setReminders(data.reminders);
        if (data.screenMode) setScreenMode(data.screenMode);
        if (data.qualityMode) setQualityMode(data.qualityMode);
        if (data.deviceType) setDeviceType(data.deviceType);
        if (typeof data.startFavoriteChannels === 'boolean') {
          setStartFavoriteChannels(data.startFavoriteChannels);
        }
        if (typeof data.m3uUrl === 'string') setM3uUrl(data.m3uUrl);
        if (data.lastChannelId) setActiveChannelId(data.lastChannelId);
        showToast('Backup restored successfully');
        return 'App data restored successfully.';
      } catch {
        return 'Could not parse backup JSON file.';
      }
    },
    [showToast]
  );

  // Spatial D-pad Navigation + Fullscreen Set-Top Box Channel Zapping + Confirm Exit
  useEffect(() => {
    const moveSpatialFocus = (key: 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight') => {
      const focusables = Array.from(
        document.querySelectorAll<HTMLElement>('[data-tv-focusable="true"]')
      ).filter((el) => el.offsetParent !== null && !el.hasAttribute('disabled'));

      if (focusables.length === 0) return;

      const activeEl = document.activeElement as HTMLElement | null;
      const currentIdx = activeEl ? focusables.indexOf(activeEl) : -1;

      if (currentIdx === -1) {
        focusables[0].focus();
        return;
      }

      const currentRect = focusables[currentIdx].getBoundingClientRect();
      const cx = currentRect.left + currentRect.width / 2;
      const cy = currentRect.top + currentRect.height / 2;

      let bestEl: HTMLElement | null = null;
      let bestScore = Infinity;

      for (const candidate of focusables) {
        if (candidate === focusables[currentIdx]) continue;
        const rect = candidate.getBoundingClientRect();
        const tx = rect.left + rect.width / 2;
        const ty = rect.top + rect.height / 2;
        const dx = tx - cx;
        const dy = ty - cy;

        const inDirection =
          (key === 'ArrowRight' && dx > 12) ||
          (key === 'ArrowLeft' && dx < -12) ||
          (key === 'ArrowDown' && dy > 12) ||
          (key === 'ArrowUp' && dy < -12);

        if (!inDirection) continue;

        const primaryDist =
          key === 'ArrowLeft' || key === 'ArrowRight' ? Math.abs(dx) : Math.abs(dy);
        const crossDist =
          key === 'ArrowLeft' || key === 'ArrowRight' ? Math.abs(dy) : Math.abs(dx);

        const score = primaryDist + crossDist * 2.4;
        if (score < bestScore) {
          bestScore = score;
          bestEl = candidate;
        }
      }

      if (bestEl) {
        bestEl.focus();
        bestEl.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      if (isTyping) {
        if (e.key === 'Escape') {
          target.blur();
        }
        return;
      }

      if (e.key === 'Home') {
        triggerPipIfEnabled();
        return;
      }

      if (e.key === 'Escape') {
        if (isSettingsOpen) {
          e.preventDefault();
          setIsSettingsOpen(false);
          return;
        }
        if (isMobileDrawerOpen) {
          e.preventDefault();
          setIsMobileDrawerOpen(false);
          return;
        }
        if (general.confirmExitSecondBack && !isExited && !document.fullscreenElement) {
          e.preventDefault();
          if (backExitArmedRef.current) {
            backExitArmedRef.current = false;
            handleExitApp();
          } else {
            backExitArmedRef.current = true;
            showToast('Press Back / Esc again to exit', 2400);
            if (backExitTimerRef.current) clearTimeout(backExitTimerRef.current);
            backExitTimerRef.current = setTimeout(() => {
              backExitArmedRef.current = false;
            }, 2400);
          }
          return;
        }
      }

      // Dedicated Channel Up / Channel Down keys work anywhere
      if (e.key === 'PageUp' || e.key === 'ChannelUp') {
        e.preventDefault();
        zapChannel(1);
        return;
      }
      if (e.key === 'PageDown' || e.key === 'ChannelDown') {
        e.preventDefault();
        zapChannel(-1);
        return;
      }

      // Numeric Set-Top Box channel entry (0-9)
      if (/^[0-9]$/.test(e.key) && !isSettingsOpen) {
        e.preventDefault();
        const nextDigits = (numericInput + e.key).slice(0, 3);
        setNumericInput(nextDigits);
        if (numericTimerRef.current) clearTimeout(numericTimerRef.current);
        numericTimerRef.current = setTimeout(() => {
          const num = parseInt(nextDigits, 10);
          const match = channels.find((c) => c.number === num) ?? channels[num - 1];
          if (match) {
            handleSelectChannel(match);
          }
          setNumericInput('');
        }, 1100);
        return;
      }

      // Fullscreen Smart TV Zapping
      if (isFullscreen && !isSettingsOpen) {
        if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
          e.preventDefault();
          zapChannel(1);
          return;
        }
        if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
          e.preventDefault();
          zapChannel(-1);
          return;
        }
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setOsdTriggerKey((k) => k + 1);
          return;
        }
      }

      // Non-fullscreen TV D-pad spatial navigation
      if (
        !isSettingsOpen &&
        (e.key === 'ArrowUp' ||
          e.key === 'ArrowDown' ||
          e.key === 'ArrowLeft' ||
          e.key === 'ArrowRight')
      ) {
        e.preventDefault();
        moveSpatialFocus(e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isFullscreen,
    isSettingsOpen,
    isMobileDrawerOpen,
    isExited,
    general.confirmExitSecondBack,
    zapChannel,
    numericInput,
    channels,
    handleSelectChannel,
    handleExitApp,
    triggerPipIfEnabled,
    showToast,
  ]);

  const forceMobileLayout = deviceType === 'mobile';
  const forceTvLayout = deviceType === 'tv' || deviceType === 'desktop';
  const themePreset = THEME_PRESETS[appearance.colorTheme];

  const settingsContextValue = useMemo(
    () => ({ appearance, general, other }),
    [appearance, general, other]
  );

  const renderSettingsPanel = () => (
    <SettingsPanel
      isOpen={isSettingsOpen}
      onClose={() => setIsSettingsOpen(false)}
      m3uUrl={m3uUrl}
      isLoadingM3u={isLoadingM3u}
      m3uStatusMessage={m3uStatusMessage}
      m3uErrorMessage={m3uErrorMessage}
      savedPlaylists={savedPlaylists}
      activePlaylistId={activePlaylistId}
      isUpdatingAllPlaylists={isUpdatingAllPlaylists}
      onSaveAndLoadM3uUrl={handleSaveAndLoadM3uUrl}
      onLoadM3uText={applyM3uText}
      onResetDefaultPlaylist={handleResetDefaultPlaylist}
      onActivateSavedPlaylist={handleActivateSavedPlaylist}
      onDeleteSavedPlaylist={handleDeleteSavedPlaylist}
      onUpdateAllPlaylists={handleUpdateAllPlaylists}
      hlsLevels={hlsLevels}
      selectedQualityLevel={selectedQualityLevel}
      onSelectQualityLevel={(lvl) => {
        setSelectedQualityLevel(lvl);
        setOsdTriggerKey((k) => k + 1);
      }}
      audioTracks={audioTracks}
      selectedAudioTrack={selectedAudioTrack}
      onSelectAudioTrack={(id) => {
        setSelectedAudioTrack(id);
        setOsdTriggerKey((k) => k + 1);
      }}
      subtitleTracks={subtitleTracks}
      selectedSubtitleTrack={selectedSubtitleTrack}
      onSelectSubtitleTrack={(id) => {
        setSelectedSubtitleTrack(id);
        setOsdTriggerKey((k) => k + 1);
      }}
      screenMode={screenMode}
      onChangeScreenMode={(mode) => {
        setScreenMode(mode);
        setOsdTriggerKey((k) => k + 1);
      }}
      qualityMode={qualityMode}
      onChangeQualityMode={(mode) => {
        setQualityMode(mode);
        setSelectedQualityLevel(-1);
        setOsdTriggerKey((k) => k + 1);
      }}
      startFavoriteChannels={startFavoriteChannels}
      onToggleStartFavoriteChannels={() => setStartFavoriteChannels((v) => !v)}
      favoriteChannels={favoriteChannels}
      onSelectFavoriteChannel={handleSelectChannel}
      deviceType={deviceType}
      onChangeDeviceType={setDeviceType}
      onCheckForUpdates={handleCheckForUpdates}
      onExitApp={handleExitApp}
      appearance={appearance}
      onUpdateAppearance={(patch) => setAppearance((prev) => ({ ...prev, ...patch }))}
      general={general}
      onUpdateGeneral={(patch) => setGeneral((prev) => ({ ...prev, ...patch }))}
      other={other}
      onUpdateOther={(patch) => setOther((prev) => ({ ...prev, ...patch }))}
      reminders={reminders}
      onAddReminderForCurrentChannel={handleAddReminderForCurrentChannel}
      onToggleReminder={(id) =>
        setReminders((prev) =>
          prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
        )
      }
      onDeleteReminder={(id) =>
        setReminders((prev) => prev.filter((r) => r.id !== id))
      }
      isRecording={isRecording}
      recordings={recordings}
      onToggleRecording={handleToggleRecording}
      onOpenSearchBar={() => {
        setIsSettingsOpen(false);
        setTimeout(() => searchInputRef.current?.focus(), 60);
      }}
      onOpenVodSection={() => {
        setActiveNav('Movies');
        setShowAllChannelsGrid(true);
        setIsSettingsOpen(false);
      }}
      onBackupAppData={handleBackupAppData}
      onRestoreAppData={handleRestoreAppData}
    />
  );

  return (
    <SettingsProvider value={settingsContextValue}>
      <div
        style={{ backgroundColor: themePreset.bg }}
        className={`min-h-[100dvh] text-slate-100 flex transition-colors duration-200 ${
          forceMobileLayout ? 'max-w-[440px] mx-auto border-x border-white/10 shadow-2xl' : ''
        }`}
      >
        {/* Left Fixed Sidebar (TV/Desktop) + Mobile Drawer & Bottom Nav */}
        <Sidebar
          activeNav={activeNav}
          onSelectNav={(nav) => {
            if (nav === 'Home' && activeNav !== 'Home') {
              triggerPipIfEnabled();
            }
            setActiveNav(nav);
            setShowAllChannelsGrid(nav !== 'Home');
            if (forceMobileLayout || window.innerWidth < 1024) {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          onOpenSettings={() => setIsSettingsOpen(true)}
          isMobileDrawerOpen={isMobileDrawerOpen}
          onCloseMobileDrawer={() => setIsMobileDrawerOpen(false)}
          forceMobileLayout={forceMobileLayout}
          forceTvLayout={forceTvLayout}
          favoritesCount={favoriteIds.length}
          isSettingsOpen={isSettingsOpen}
          dynamicCategories={categories}
        />

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 flex flex-col">
          <TopBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)}
            forceMobileLayout={forceMobileLayout}
            forceTvLayout={forceTvLayout}
            searchInputRef={searchInputRef}
          />

          <main
            className={`flex-1 px-4 sm:px-6 pt-2 sm:pt-3 space-y-4 ${
              forceTvLayout ? 'pb-5' : 'pb-24 lg:pb-5'
            }`}
          >
            {/* Main Video Player + Program Info Split (TV Mode always 12-col side-by-side) */}
            {activeChannel && (
              <section
                aria-label="Featured Live Player"
                className={`grid gap-4 items-stretch ${
                  forceMobileLayout
                    ? 'grid-cols-1'
                    : forceTvLayout
                      ? 'grid-cols-12 h-[310px] xl:h-[345px]'
                      : 'grid-cols-1 lg:grid-cols-12 lg:h-[310px] xl:h-[345px]'
                }`}
              >
                <div
                  className={`h-full ${
                    forceMobileLayout
                      ? ''
                      : forceTvLayout
                        ? 'col-span-8'
                        : 'lg:col-span-8'
                  }`}
                >
                  <HlsPlayer
                    channel={activeChannel}
                    channelsCount={channels.length}
                    screenMode={screenMode}
                    qualityMode={qualityMode}
                    selectedQualityLevel={selectedQualityLevel}
                    selectedAudioTrack={selectedAudioTrack}
                    selectedSubtitleTrack={selectedSubtitleTrack}
                    isExited={isExited}
                    osdTriggerKey={osdTriggerKey}
                    numericInput={numericInput}
                    onResumeFromExit={() => setIsExited(false)}
                    onPrevChannel={() => zapChannel(-1)}
                    onNextChannel={() => zapChannel(1)}
                    onOpenSettings={() => setIsSettingsOpen(true)}
                    onLevelsLoaded={setHlsLevels}
                    onAudioTracksLoaded={setAudioTracks}
                    onSubtitleTracksLoaded={setSubtitleTracks}
                    onFullscreenChange={setIsFullscreen}
                    onVideoRefChange={(el) => {
                      videoElementRef.current = el;
                    }}
                    renderFullscreenOverlay={renderSettingsPanel}
                    allChannels={channels}
                    categories={categories}
                    favoriteIds={favoriteIds}
                    onSelectChannel={handleSelectChannel}
                    onToggleFavorite={handleToggleFavorite}
                    onNavigateHome={() => {
                      setActiveNav('Home');
                      setShowAllChannelsGrid(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  />
                </div>

                <div
                  className={
                    forceMobileLayout
                      ? activeNav === 'Home'
                        ? ''
                        : 'hidden'
                      : forceTvLayout
                        ? 'col-span-4'
                        : activeNav === 'Home'
                          ? 'lg:col-span-4'
                          : 'hidden lg:block lg:col-span-4'
                  }
                >
                  <NowPlayingPanel
                    channel={activeChannel}
                    isFavorite={favoriteIds.includes(activeChannel.id)}
                    onToggleFavorite={handleToggleFavorite}
                    onSelectCategory={(cat) => {
                      setActiveNav(cat);
                      setShowAllChannelsGrid(true);
                    }}
                    onPrevChannel={() => zapChannel(-1)}
                    onNextChannel={() => zapChannel(1)}
                  />
                </div>
              </section>
            )}

            {/* Live TV Content Rows */}
            <div ref={contentRowsRef} className="scroll-mt-16">
              <ContentRows
                channels={filteredChannels}
                allChannels={channels}
                categories={categories}
                activeChannelId={activeChannel?.id ?? ''}
                activeNav={activeNav}
                favoriteIds={favoriteIds}
                showAllChannelsGrid={showAllChannelsGrid}
                onSelectChannel={handleSelectChannel}
                onSelectCategory={(cat) => {
                  setActiveNav(cat);
                  setShowAllChannelsGrid(true);
                }}
                onToggleFavorite={handleToggleFavorite}
                onToggleViewAll={() => setShowAllChannelsGrid((v) => !v)}
                onBrowseLiveTv={() => {
                  setActiveNav('Live TV');
                  setShowAllChannelsGrid(true);
                }}
                onOpenCategories={() => {
                  setActiveNav('Categories');
                  setShowAllChannelsGrid(true);
                }}
              />
            </div>
          </main>
        </div>

        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-16 lg:bottom-6 left-1/2 -translate-x-1/2 z-[70] px-4 py-2.5 rounded-xl bg-black/85 backdrop-blur-md border border-white/15 text-xs sm:text-sm font-semibold text-white shadow-2xl">
            {toastMessage}
          </div>
        )}

        {/* Glassmorphism Settings Panel (when not in fullscreen) */}
        {!isFullscreen && renderSettingsPanel()}

        {/* 3-Second Android TV Opening Splash Screen */}
        {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      </div>
    </SettingsProvider>
  );
}
