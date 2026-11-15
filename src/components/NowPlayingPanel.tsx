import { Heart } from 'lucide-react';
import { Channel } from '../types/iptv';
import { ChannelLogo } from './ChannelLogo';
import { useAppSettings } from '../context/SettingsContext';

interface NowPlayingPanelProps {
  channel: Channel;
  isFavorite: boolean;
  onToggleFavorite: (channelId: string) => void;
  onSelectCategory: (category: string) => void;
  onPrevChannel: () => void;
  onNextChannel: () => void;
}

export function NowPlayingPanel({
  channel,
  isFavorite,
  onToggleFavorite,
  onSelectCategory,
}: NowPlayingPanelProps) {
  const { appearance } = useAppSettings();

  return (
    <aside
      aria-label="Current Program Details"
      className="bg-[var(--app-card,#091221)] border border-white/[0.08] rounded-2xl p-4 sm:p-5 flex flex-col justify-between h-full transition-colors"
    >
      <div>
        {/* Top Row: Channel Logo on left + LIVE badge on right (matching TV screenshot) */}
        <div className="flex items-start justify-between gap-3">
          <div className="w-24 h-12 rounded-xl bg-black/35 p-1 flex items-center justify-start overflow-hidden">
            <ChannelLogo channel={channel} className="w-full h-full object-left" />
          </div>
          <span className="px-2.5 py-1 rounded bg-[#e11d48] text-white text-[11px] font-bold tracking-wider uppercase leading-none">
            LIVE
          </span>
        </div>

        {/* Program Title & Subtitle */}
        <div className="mt-3">
          <h2 className="text-lg xl:text-xl font-bold text-white leading-snug line-clamp-1">
            {appearance.tvGuideShowEpg ? channel.programTitle : channel.name}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-0.5 truncate">
            {appearance.tvGuideShowEpg
              ? `${channel.name} · ${channel.programSubtitle}`
              : channel.group}
          </p>
        </div>

        {/* Category Filter Button + Language Tag (matching TV screenshot) */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onSelectCategory(channel.group)}
            className="px-3.5 py-1 rounded-full bg-[var(--app-accent,#0077ff)] hover:opacity-90 text-white text-xs font-semibold transition-all cursor-pointer whitespace-nowrap"
          >
            {channel.group}
          </button>
          <span className="px-3.5 py-1 rounded-full bg-white/[0.08] border border-white/[0.08] text-slate-200 text-xs font-medium whitespace-nowrap">
            {channel.language}
          </span>
        </div>

        {appearance.tvGuideShowEpg && (
          <p className="mt-3 text-xs sm:text-[13px] text-slate-300/85 leading-relaxed line-clamp-2">
            {channel.description}
          </p>
        )}
      </div>

      {/* Bottom: Time Window + Progress Bar + Favorite Toggle */}
      <div className="mt-4 pt-2">
        <div className="flex items-center justify-between text-xs font-mono-tabular text-slate-300 mb-2">
          <span>
            {appearance.tvGuideShowProgress
              ? `${channel.startTime} – ${channel.endTime}`
              : 'Live Broadcast'}
          </span>
          <button
            type="button"
            onClick={() => onToggleFavorite(channel.id)}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            className={`p-1 rounded-md transition-colors cursor-pointer ${
              isFavorite ? 'text-rose-400' : 'text-slate-400 hover:text-white'
            }`}
            title={isFavorite ? 'Saved in Favorites' : 'Add to Favorites'}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-400' : ''}`} />
          </button>
        </div>
        {appearance.tvGuideShowProgress && (
          <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--app-accent-soft,#0088ff)] transition-all duration-300"
              style={{ width: `${channel.progress}%` }}
            />
          </div>
        )}
      </div>
    </aside>
  );
}
