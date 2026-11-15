import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  ChevronLeft,
  ChevronRight,
  Settings,
  AlertCircle,
  RefreshCw,
  Home,
  Tv,
  LayoutGrid,
  Heart,
  X,
} from 'lucide-react';
import {
  CategorySummary,
  Channel,
  HlsQualityLevel,
  HlsTrackItem,
  QualityMode,
  ScreenMode,
} from '../types/iptv';
import { ChannelLogo } from './ChannelLogo';
import { useAppSettings } from '../context/SettingsContext';

interface HlsPlayerProps {
  channel: Channel;
  channelsCount: number;
  screenMode: ScreenMode;
  qualityMode: QualityMode;
  selectedQualityLevel: number; // -1 = Auto
  selectedAudioTrack: number;
  selectedSubtitleTrack: number; // -1 = Off
  isExited: boolean;
  osdTriggerKey: number;
  numericInput: string;
  onResumeFromExit: () => void;
  onPrevChannel: () => void;
  onNextChannel: () => void;
  onOpenSettings: () => void;
  onLevelsLoaded: (levels: HlsQualityLevel[]) => void;
  onAudioTracksLoaded: (tracks: HlsTrackItem[]) => void;
  onSubtitleTracksLoaded: (tracks: HlsTrackItem[]) => void;
  onFullscreenChange: (isFullscreen: boolean) => void;
  onShowOsdExternal?: () => void;
  onVideoRefChange?: (video: HTMLVideoElement | null) => void;
  renderFullscreenOverlay?: () => React.ReactNode;
  allChannels?: Channel[];
  categories?: CategorySummary[];
  favoriteIds?: string[];
  onSelectChannel?: (ch: Channel) => void;
  onToggleFavorite?: (channelId: string) => void;
  onNavigateHome?: () => void;
}

export function HlsPlayer({
  channel,
  channelsCount,
  screenMode,
  qualityMode,
  selectedQualityLevel,
  selectedAudioTrack,
  selectedSubtitleTrack,
  isExited,
  osdTriggerKey,
  numericInput,
  onResumeFromExit,
  onPrevChannel,
  onNextChannel,
  onOpenSettings,
  onLevelsLoaded,
  onAudioTracksLoaded,
  onSubtitleTracksLoaded,
  onFullscreenChange,
  onVideoRefChange,
  renderFullscreenOverlay,
  allChannels = [],
  categories = [],
  favoriteIds = [],
  onSelectChannel,
  onToggleFavorite,
  onNavigateHome,
}: HlsPlayerProps) {
  const { appearance } = useAppSettings();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const osdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isNativeFullscreen, setIsNativeFullscreen] = useState(false);
  const [isPseudoFullscreen, setIsPseudoFullscreen] = useState(false);
  const isFullscreen = isNativeFullscreen || isPseudoFullscreen;
  const [osdVisible, setOsdVisible] = useState(false);
  const [fullscreenDrawer, setFullscreenDrawer] = useState<
    'live' | 'categories' | 'favorites' | null
  >(null);
  const [selectedFsCategory, setSelectedFsCategory] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const isFirstChannelRenderRef = useRef(true);

  const showOsdTemporarily = useCallback(
    (durationMs?: number) => {
      setOsdVisible(true);
      if (osdTimerRef.current) {
        clearTimeout(osdTimerRef.current);
      }
      const resolvedMs =
        durationMs ??
        (appearance.playerOsdTimeoutSec <= 0
          ? 0
          : appearance.playerOsdTimeoutSec * 1000);
      if (resolvedMs > 0) {
        osdTimerRef.current = setTimeout(() => {
          setOsdVisible(false);
        }, resolvedMs);
      }
    },
    [appearance.playerOsdTimeoutSec]
  );

  useEffect(() => {
    onVideoRefChange?.(videoRef.current);
    return () => onVideoRefChange?.(null);
  }, [onVideoRefChange]);

  // Trigger OSD automatically whenever changing channels (skip initial idle load so TV player matches clean screenshot)
  useEffect(() => {
    if (isFirstChannelRenderRef.current) {
      isFirstChannelRenderRef.current = false;
      return;
    }
    showOsdTemporarily();
    return () => {
      if (osdTimerRef.current) clearTimeout(osdTimerRef.current);
    };
  }, [channel.id, osdTriggerKey, showOsdTemporarily]);

  // Listen to browser fullscreen changes
  useEffect(() => {
    const handleFsChange = () => {
      const active = document.fullscreenElement === containerRef.current;
      setIsNativeFullscreen(active);
      if (!active && !isPseudoFullscreen) {
        setFullscreenDrawer(null);
        setSelectedFsCategory(null);
      }
      onFullscreenChange(active || isPseudoFullscreen);
      if (active) showOsdTemporarily(3500);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, [isPseudoFullscreen, onFullscreenChange, showOsdTemporarily]);

  // Allow Escape key to exit pseudo-fullscreen
  useEffect(() => {
    if (!isPseudoFullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsPseudoFullscreen(false);
        setFullscreenDrawer(null);
        setSelectedFsCategory(null);
        onFullscreenChange(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isPseudoFullscreen, onFullscreenChange]);

  // Initialize and clean up HLS.js / native video whenever channel URL or retryToken changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !channel.url || isExited) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      return;
    }

    setErrorMsg(null);
    setIsBuffering(true);
    onLevelsLoaded([]);
    onAudioTracksLoaded([]);
    onSubtitleTracksLoaded([]);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const startPlayback = () => {
      video
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch(() => {
          video.muted = true;
          setIsMuted(true);
          video
            .play()
            .then(() => setIsPlaying(true))
            .catch(() => setIsPlaying(false));
        });
    };

    const attachDirectMedia = () => {
      video.src = channel.url;
      const onLoadedMeta = () => {
        setIsBuffering(false);
        setErrorMsg(null);
        startPlayback();
      };
      const onError = () => {
        setIsBuffering(false);
        setErrorMsg(
          'Stream unavailable, unauthorized, or unsupported format. Verify the URL and try again.'
        );
      };
      video.addEventListener('loadedmetadata', onLoadedMeta);
      video.addEventListener('error', onError);
      return () => {
        video.removeEventListener('loadedmetadata', onLoadedMeta);
        video.removeEventListener('error', onError);
        video.removeAttribute('src');
        video.load();
      };
    };

    const isDirect = /\.(mp4|webm|ogg|m4v|mov)(\?.*)?$/i.test(channel.url);

    if (isDirect) {
      return attachDirectMedia();
    }

    if (Hls.isSupported()) {
      let networkRetries = 0;
      let fallbackCleanup: (() => void) | null = null;

      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30,
      });
      hlsRef.current = hls;

      hls.loadSource(channel.url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_evt, data) => {
        setIsBuffering(false);
        networkRetries = 0;
        const mappedLevels: HlsQualityLevel[] = data.levels.map((lvl, idx) => ({
          index: idx,
          height: lvl.height || 0,
          width: lvl.width || 0,
          bitrate: lvl.bitrate || 0,
          label: lvl.height
            ? `${lvl.height}p`
            : `${Math.round((lvl.bitrate || 0) / 1000)} kbps`,
        }));
        onLevelsLoaded(mappedLevels);
        startPlayback();
      });

      hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (_evt, data) => {
        const tracks: HlsTrackItem[] = data.audioTracks.map((t, idx) => ({
          id: idx,
          name: t.name || t.lang || `Audio ${idx + 1}`,
          lang: t.lang,
        }));
        onAudioTracksLoaded(tracks);
      });

      hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, (_evt, data) => {
        const subs: HlsTrackItem[] = data.subtitleTracks.map((s, idx) => ({
          id: idx,
          name: s.name || s.lang || `Subtitle ${idx + 1}`,
          lang: s.lang,
        }));
        onSubtitleTracksLoaded(subs);
      });

      hls.on(Hls.Events.ERROR, (_evt, data) => {
        if (!data.fatal) return;

        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          const code = data.response?.code;
          if (code === 401 || code === 403) {
            setIsBuffering(false);
            setErrorMsg(
              `Access denied (HTTP ${code}). Only authorized and legally accessible streams are supported.`
            );
            hls.destroy();
            return;
          }
          if (networkRetries < 2) {
            networkRetries += 1;
            hls.startLoad();
            return;
          }
          setIsBuffering(false);
          setErrorMsg(
            code
              ? `Stream unavailable (HTTP ${code}). Check authorization or stream status.`
              : 'Network error or stream blocked by server. Check URL and retry.'
          );
          hls.destroy();
        } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          hls.recoverMediaError();
        } else {
          // Attempt native video fallback once if URL serves direct media without extension
          hls.destroy();
          hlsRef.current = null;
          fallbackCleanup = attachDirectMedia();
        }
      });

      return () => {
        if (fallbackCleanup) fallbackCleanup();
        hls.destroy();
        hlsRef.current = null;
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      return attachDirectMedia();
    } else {
      return attachDirectMedia();
    }
  }, [
    channel.url,
    channel.id,
    isExited,
    retryToken,
    onLevelsLoaded,
    onAudioTracksLoaded,
    onSubtitleTracksLoaded,
  ]);

  // Apply Stream Quality Level & Quality Mode to HLS.js
  useEffect(() => {
    const hls = hlsRef.current;
    if (!hls) return;

    if (selectedQualityLevel >= 0 && selectedQualityLevel < hls.levels.length) {
      hls.currentLevel = selectedQualityLevel;
      hls.autoLevelCapping = -1;
    } else {
      hls.currentLevel = -1;
      if (qualityMode === 'low' && hls.levels.length > 0) {
        hls.autoLevelCapping = 0;
      } else if (qualityMode === 'high' && hls.levels.length > 0) {
        hls.autoLevelCapping = -1;
        hls.nextLevel = hls.levels.length - 1;
      } else {
        hls.autoLevelCapping = -1;
      }
    }
  }, [selectedQualityLevel, qualityMode]);

  // Apply Audio Track to HLS.js
  useEffect(() => {
    const hls = hlsRef.current;
    if (!hls || hls.audioTracks.length === 0) return;
    if (selectedAudioTrack >= 0 && selectedAudioTrack < hls.audioTracks.length) {
      hls.audioTrack = selectedAudioTrack;
    }
  }, [selectedAudioTrack]);

  // Apply Subtitles / CC to HLS.js
  useEffect(() => {
    const hls = hlsRef.current;
    if (!hls) return;
    hls.subtitleTrack = selectedSubtitleTrack;
    hls.subtitleDisplay = selectedSubtitleTrack >= 0;
  }, [selectedSubtitleTrack]);

  const togglePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    showOsdTemporarily(3500);
    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [showOsdTemporarily]);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    showOsdTemporarily(3500);
    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, [showOsdTemporarily]);

  const toggleFullscreen = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;

    if (document.fullscreenElement === el) {
      await document.exitFullscreen().catch(() => {});
      setIsPseudoFullscreen(false);
      onFullscreenChange(false);
      return;
    }

    if (isPseudoFullscreen) {
      setIsPseudoFullscreen(false);
      setFullscreenDrawer(null);
      setSelectedFsCategory(null);
      onFullscreenChange(false);
      return;
    }

    try {
      if (typeof el.requestFullscreen === 'function') {
        await el.requestFullscreen();
        return;
      }
    } catch {
      // Fallback to CSS fixed fullscreen on iOS Safari / restricted webviews
    }

    setIsPseudoFullscreen(true);
    onFullscreenChange(true);
    showOsdTemporarily(4000);
  }, [isPseudoFullscreen, onFullscreenChange, showOsdTemporarily]);

  // Touch swipe left/right on player to zap channels smoothly on mobile/tablets
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartXRef.current;
    const dy = e.changedTouches[0].clientY - touchStartYRef.current;
    touchStartXRef.current = null;
    touchStartYRef.current = null;

    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      if (dx < 0) {
        onNextChannel();
      } else {
        onPrevChannel();
      }
    }
  };

  const videoObjectFitClass =
    screenMode === 'stretch'
      ? 'object-fill'
      : screenMode === 'zoom'
        ? 'object-cover'
        : 'object-contain';

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onMouseMove={() => showOsdTemporarily(3500)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onDoubleClick={toggleFullscreen}
      aria-label={`Video Player: ${channel.name}`}
      className={`tv-focusable bg-black overflow-hidden select-none group ${
        isFullscreen
          ? `${isPseudoFullscreen ? 'fixed inset-0 z-50 h-[100dvh] w-screen' : 'relative w-full h-full'} rounded-none`
          : 'relative w-full h-full aspect-video lg:aspect-auto rounded-2xl border border-white/[0.12] shadow-2xl shadow-black/60'
      }`}
    >
      {/* HLS Video Element (Tap to toggle OSD & Fullscreen Navigation) */}
      <video
        ref={videoRef}
        playsInline
        onClick={() => {
          if (osdVisible) {
            setOsdVisible(false);
          } else {
            showOsdTemporarily();
          }
        }}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => {
          setIsBuffering(false);
          setErrorMsg(null);
          setIsPlaying(true);
        }}
        onPause={() => setIsPlaying(false)}
        className={`w-full h-full bg-black transition-all duration-200 ${videoObjectFitClass}`}
      />

      {/* Top-Right Channel Watermark & LIVE Tag (hidden when Fullscreen Top OSD is open) */}
      {(!isFullscreen || !osdVisible) && (
        <div
          className={`pointer-events-none absolute top-4 right-4 z-10 flex items-center gap-2.5 transition-opacity duration-300 ${
            osdVisible ? 'opacity-100' : 'opacity-70'
          }`}
        >
          <div className="h-8 w-14 rounded-lg bg-black/50 backdrop-blur-sm p-1 border border-white/10 hidden sm:flex items-center justify-center">
            <ChannelLogo channel={channel} className="w-full h-full" />
          </div>
          <span className="px-2 py-0.5 rounded bg-[#e11d48] text-white text-[10px] font-bold tracking-wider uppercase shadow">
            LIVE
          </span>
        </div>
      )}

      {/* Numeric D-Pad Channel Entry Indicator */}
      {numericInput && (
        <div className="absolute top-5 left-5 z-30 px-4 py-2 rounded-xl bg-black/80 backdrop-blur-md border border-[#0077ff]/60 text-white font-mono-tabular text-xl font-bold tracking-widest shadow-xl">
          CH {numericInput}
        </div>
      )}

      {/* Buffering Spinner */}
      {isBuffering && !errorMsg && !isExited && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="w-11 h-11 rounded-full border-3 border-white/20 border-t-[#0088ff] animate-spin" />
        </div>
      )}

      {/* Stream Error Overlay */}
      {errorMsg && !isExited && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#060b14]/90 px-6 text-center">
          <AlertCircle className="w-10 h-10 text-amber-400 mb-3" />
          <p className="text-sm sm:text-base font-semibold text-white max-w-md">{errorMsg}</p>
          <p className="text-xs text-slate-400 mt-1">
            Channel {channel.number} &middot; {channel.name}
          </p>
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setRetryToken((t) => t + 1)}
              className="px-4 py-2 rounded-xl bg-[#0077ff] hover:bg-[#0066dd] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry Stream
            </button>
            <button
              type="button"
              onClick={onNextChannel}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer"
            >
              Next Channel
            </button>
          </div>
        </div>
      )}

      {/* Paused / Exited State Overlay */}
      {isExited && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#060b14]/95 px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#0077ff]/15 border border-[#0077ff]/30 flex items-center justify-center mb-4">
            <Play className="w-7 h-7 text-[#0088ff]" />
          </div>
          <h3 className="text-lg font-bold text-white">Playback Stopped</h3>
          <p className="text-sm text-slate-400 mt-1">
            Select a channel or resume watching {channel.name}.
          </p>
          <button
            type="button"
            onClick={onResumeFromExit}
            className="mt-4 px-5 py-2.5 rounded-xl bg-[#0077ff] hover:bg-[#0066dd] text-white text-sm font-semibold cursor-pointer"
          >
            Resume BALINDER Live TV
          </button>
        </div>
      )}

      {/* INLINE (Non-Fullscreen) OSD Bottom Bar */}
      {!isFullscreen && (
        <div
          className={`absolute inset-x-0 bottom-0 z-20 transition-all duration-300 ${
            osdVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
          }`}
        >
          <div className="bg-gradient-to-t from-black/95 via-black/75 to-transparent pt-12 pb-3.5 px-4 sm:px-5">
            <div className="flex items-center gap-3.5 mb-3">
              <div className="w-14 h-10 sm:w-16 sm:h-11 rounded-lg bg-white/10 border border-white/15 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                <ChannelLogo channel={channel} className="w-full h-full" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono-tabular text-xs font-bold text-[#38bdf8] shrink-0">
                    CH {String(channel.number).padStart(2, '0')}
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-white truncate">
                    {channel.name}
                  </h3>
                  <span className="text-xs text-slate-300 hidden sm:inline shrink-0">
                    &middot; {channel.group}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 mt-0.5">
                  <p className="text-xs text-slate-300 truncate">{channel.programTitle}</p>
                  <span className="font-mono-tabular text-[11px] text-slate-400 shrink-0">
                    {channel.startTime} &ndash; {channel.endTime}
                  </span>
                </div>
                <div className="mt-1.5 h-1 w-full rounded-full bg-white/20 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#0088ff] transition-all duration-300"
                    style={{ width: `${channel.progress}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={togglePlayPause}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={onPrevChannel}
                  aria-label="Previous channel"
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={onNextChannel}
                  aria-label="Next channel"
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={toggleMute}
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={onOpenSettings}
                  aria-label="Player Settings"
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                >
                  <Settings className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={toggleFullscreen}
                  aria-label="Enter Fullscreen"
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
                >
                  <Maximize className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN TOP HEADER & CENTER TRANSPORT (Optimized for Mobile Portrait & Landscape) */}
      {isFullscreen && !fullscreenDrawer && (
        <>
          {/* Top Bar */}
          <div
            className={`absolute inset-x-0 top-0 z-30 bg-gradient-to-b from-black/90 via-black/60 to-transparent px-3.5 sm:px-5 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-6 transition-all duration-300 ${
              osdVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-11 h-8 rounded-lg bg-white/10 border border-white/15 p-1 flex items-center justify-center shrink-0">
                  <ChannelLogo channel={channel} className="w-full h-full" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-mono-tabular text-[11px] font-bold text-[#38bdf8] shrink-0">
                      CH {String(channel.number).padStart(2, '0')}
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-white truncate">
                      {channel.name}
                    </h3>
                    <span className="px-1.5 py-0.5 rounded bg-[#e11d48] text-white text-[9px] font-bold uppercase shrink-0">
                      LIVE
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 truncate">
                    {channel.programTitle} &middot; {channel.startTime}–{channel.endTime}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={toggleMute}
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-white/15 hover:bg-white/25 text-white cursor-pointer"
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  aria-label="Exit Fullscreen"
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-white/15 hover:bg-white/25 text-white cursor-pointer"
                >
                  <Minimize className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Center Prev / Play-Pause / Next Touch Controls */}
          <div
            className={`pointer-events-none absolute inset-0 z-20 flex items-center justify-center gap-6 sm:gap-10 transition-opacity duration-300 ${
              osdVisible ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <button
              type="button"
              onClick={() => {
                onPrevChannel();
                showOsdTemporarily(4000);
              }}
              aria-label="Previous channel"
              className={`w-12 h-12 rounded-full bg-black/65 hover:bg-black/85 border border-white/20 text-white flex items-center justify-center backdrop-blur-sm cursor-pointer ${
                osdVisible ? 'pointer-events-auto' : 'pointer-events-none'
              }`}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              type="button"
              onClick={togglePlayPause}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className={`w-14 h-14 rounded-full bg-[#0077ff]/90 hover:bg-[#0077ff] border border-white/25 text-white flex items-center justify-center shadow-lg shadow-[#0077ff]/40 cursor-pointer ${
                osdVisible ? 'pointer-events-auto' : 'pointer-events-none'
              }`}
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </button>
            <button
              type="button"
              onClick={() => {
                onNextChannel();
                showOsdTemporarily(4000);
              }}
              aria-label="Next channel"
              className={`w-12 h-12 rounded-full bg-black/65 hover:bg-black/85 border border-white/20 text-white flex items-center justify-center backdrop-blur-sm cursor-pointer ${
                osdVisible ? 'pointer-events-auto' : 'pointer-events-none'
              }`}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </>
      )}

      {/* Fullscreen In-Player Drawer for Live TV / Categories / Favorites (Leaves bottom 5-tab bar accessible!) */}
      {isFullscreen && fullscreenDrawer && (
        <div className="absolute inset-x-0 top-0 bottom-[calc(62px+env(safe-area-inset-bottom))] z-40 flex items-end sm:items-stretch sm:justify-end bg-black/60 backdrop-blur-[2px]">
          <div
            className="flex-1 hidden sm:block"
            onClick={() => setFullscreenDrawer(null)}
            aria-hidden="true"
          />
          <div className="w-full sm:w-96 max-h-[82%] sm:max-h-full h-full sm:h-auto bg-[#091221]/95 backdrop-blur-2xl border-t sm:border-t-0 sm:border-l border-white/15 rounded-t-2xl sm:rounded-none flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between gap-2 pt-[calc(0.75rem+env(safe-area-inset-top))] sm:pt-3">
              <div className="flex items-center gap-2 min-w-0">
                {fullscreenDrawer === 'categories' && selectedFsCategory && (
                  <button
                    type="button"
                    onClick={() => setSelectedFsCategory(null)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                    aria-label="Back to categories"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}
                <h3 className="text-base font-bold text-white truncate">
                  {fullscreenDrawer === 'live' && `Live TV (${allChannels.length})`}
                  {fullscreenDrawer === 'categories' &&
                    (selectedFsCategory ? selectedFsCategory : `Categories (${categories.length})`)}
                  {fullscreenDrawer === 'favorites' &&
                    `Favorites (${allChannels.filter((c) => favoriteIds.includes(c.id)).length})`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setFullscreenDrawer(null)}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
                aria-label="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {fullscreenDrawer === 'categories' && !selectedFsCategory ? (
                categories.map((cat) => (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => setSelectedFsCategory(cat.name)}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 flex items-center justify-between text-left cursor-pointer"
                  >
                    <div>
                      <p className="text-sm font-bold text-white">{cat.name}</p>
                      <p className="text-xs text-slate-400">{cat.subtitle}</p>
                    </div>
                    <span className="font-mono-tabular text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#0077ff]/20 text-[#38bdf8]">
                      {cat.count}
                    </span>
                  </button>
                ))
              ) : (
                (() => {
                  const list =
                    fullscreenDrawer === 'favorites'
                      ? allChannels.filter((c) => favoriteIds.includes(c.id))
                      : fullscreenDrawer === 'categories' && selectedFsCategory
                        ? allChannels.filter(
                            (c) => c.group.toLowerCase() === selectedFsCategory.toLowerCase()
                          )
                        : allChannels;

                  if (list.length === 0) {
                    return (
                      <div className="p-6 text-center rounded-xl bg-white/[0.04] border border-white/10">
                        <p className="text-sm font-semibold text-slate-200">
                          {fullscreenDrawer === 'favorites'
                            ? 'No favorite channels saved yet.'
                            : 'No channels found.'}
                        </p>
                        {fullscreenDrawer === 'favorites' && (
                          <button
                            type="button"
                            onClick={() => setFullscreenDrawer('live')}
                            className="mt-3 px-4 py-2 rounded-xl bg-[#0077ff] text-white text-xs font-semibold cursor-pointer"
                          >
                            Browse Live TV
                          </button>
                        )}
                      </div>
                    );
                  }

                  return list.map((ch) => {
                    const isActive = ch.id === channel.id;
                    const isFav = favoriteIds.includes(ch.id);
                    return (
                      <div
                        key={`fs-${ch.id}`}
                        className={`rounded-xl p-2 border flex items-center gap-3 ${
                          isActive
                            ? 'bg-[#0077ff]/20 border-[#0088ff]'
                            : 'bg-white/[0.05] border-white/10 hover:bg-white/[0.1]'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            onSelectChannel?.(ch);
                            setFullscreenDrawer(null);
                          }}
                          className="flex-1 min-w-0 flex items-center gap-3 text-left cursor-pointer"
                        >
                          <div className="w-12 h-9 rounded-lg bg-black/50 p-1 flex items-center justify-center shrink-0">
                            <ChannelLogo channel={ch} className="w-full h-full" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{ch.name}</p>
                            <p className="text-[11px] text-slate-400 truncate">
                              CH {ch.number} &middot; {ch.group}
                            </p>
                          </div>
                        </button>
                        {onToggleFavorite && (
                          <button
                            type="button"
                            onClick={() => onToggleFavorite(ch.id)}
                            aria-label={isFav ? 'Remove favorite' : 'Add favorite'}
                            className={`p-2 rounded-lg cursor-pointer ${
                              isFav ? 'text-rose-400' : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-400' : ''}`} />
                          </button>
                        )}
                      </div>
                    );
                  });
                })()
              )}
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN 5-TAB BOTTOM NAVIGATION BAR (Home | Live TV | Categories | Favorites | Settings) */}
      {isFullscreen && (
        <div
          className={`absolute inset-x-0 bottom-0 z-50 transition-all duration-300 ${
            osdVisible || fullscreenDrawer !== null
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-3 pointer-events-none'
          }`}
        >
          {!fullscreenDrawer && (
            <div className="px-4 pb-1.5">
              <div className="h-1 w-full rounded-full bg-white/20 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#0088ff] transition-all duration-300"
                  style={{ width: `${channel.progress}%` }}
                />
              </div>
            </div>
          )}
          <nav
            aria-label="Fullscreen Navigation"
            className="bg-[#070d18]/95 backdrop-blur-lg border-t border-white/15 grid grid-cols-5 min-h-[60px] pb-[env(safe-area-inset-bottom)]"
          >
            <button
              type="button"
              onClick={async () => {
                setFullscreenDrawer(null);
                setSelectedFsCategory(null);
                if (document.fullscreenElement) {
                  await document.exitFullscreen().catch(() => {});
                }
                if (isPseudoFullscreen) {
                  setIsPseudoFullscreen(false);
                  onFullscreenChange(false);
                }
                onNavigateHome?.();
              }}
              className="flex flex-col items-center justify-center min-h-[54px] py-1 text-slate-300 hover:text-white cursor-pointer"
            >
              <Home className="w-5 h-5" />
              <span className="text-[10px] font-semibold mt-0.5 whitespace-nowrap">Home</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedFsCategory(null);
                setFullscreenDrawer((d) => (d === 'live' ? null : 'live'));
                showOsdTemporarily(6000);
              }}
              className={`relative flex flex-col items-center justify-center min-h-[54px] py-1 cursor-pointer ${
                fullscreenDrawer === 'live' ? 'text-[#38bdf8]' : 'text-slate-300 hover:text-white'
              }`}
            >
              {fullscreenDrawer === 'live' && (
                <span className="absolute top-0 inset-x-3 h-0.5 rounded-full bg-[#0088ff]" />
              )}
              <Tv className="w-5 h-5" />
              <span className="text-[10px] font-semibold mt-0.5 whitespace-nowrap">Live TV</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setFullscreenDrawer((d) => (d === 'categories' ? null : 'categories'));
                showOsdTemporarily(6000);
              }}
              className={`relative flex flex-col items-center justify-center min-h-[54px] py-1 cursor-pointer ${
                fullscreenDrawer === 'categories'
                  ? 'text-[#38bdf8]'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {fullscreenDrawer === 'categories' && (
                <span className="absolute top-0 inset-x-3 h-0.5 rounded-full bg-[#0088ff]" />
              )}
              <LayoutGrid className="w-5 h-5" />
              <span className="text-[10px] font-semibold mt-0.5 whitespace-nowrap">Categories</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setFullscreenDrawer((d) => (d === 'favorites' ? null : 'favorites'));
                showOsdTemporarily(6000);
              }}
              className={`relative flex flex-col items-center justify-center min-h-[54px] py-1 cursor-pointer ${
                fullscreenDrawer === 'favorites'
                  ? 'text-[#38bdf8]'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {fullscreenDrawer === 'favorites' && (
                <span className="absolute top-0 inset-x-3 h-0.5 rounded-full bg-[#0088ff]" />
              )}
              <Heart
                className={`w-5 h-5 ${
                  fullscreenDrawer === 'favorites' ? 'fill-rose-400 text-rose-400' : 'text-rose-400/85'
                }`}
              />
              <span className="text-[10px] font-semibold mt-0.5 whitespace-nowrap">Favorites</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setFullscreenDrawer(null);
                onOpenSettings();
              }}
              className="flex flex-col items-center justify-center min-h-[54px] py-1 text-slate-300 hover:text-white cursor-pointer"
            >
              <Settings className="w-5 h-5" />
              <span className="text-[10px] font-semibold mt-0.5 whitespace-nowrap">Settings</span>
            </button>
          </nav>
        </div>
      )}

      {/* Clean Corner Controls (visible when full OSD fades out) */}
      {!osdVisible && !fullscreenDrawer && !isExited && appearance.playerShowCornerButtons && (
        <div className="absolute inset-x-0 bottom-0 z-20 p-3.5 pb-[calc(0.875rem+env(safe-area-inset-bottom))] flex items-center justify-between pointer-events-none">
          <button
            type="button"
            onClick={togglePlayPause}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="pointer-events-auto w-11 h-11 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-sm border border-white/15 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>

          {isFullscreen && (
            <button
              type="button"
              onClick={() => showOsdTemporarily(5000)}
              aria-label="Show Fullscreen Navigation"
              className="pointer-events-auto h-10 px-4 rounded-xl bg-black/65 hover:bg-black/85 backdrop-blur-sm border border-white/15 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LayoutGrid className="w-4 h-4 text-[#38bdf8]" />
              <span>Menu</span>
            </button>
          )}

          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            className="pointer-events-auto w-11 h-11 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-sm border border-white/15 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
        </div>
      )}

      {/* Render Glassmorphic Settings Panel inside Fullscreen container when in fullscreen */}
      {isFullscreen && renderFullscreenOverlay && renderFullscreenOverlay()}
    </div>
  );
}
