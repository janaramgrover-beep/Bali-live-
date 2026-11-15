import React, { useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Newspaper,
  Trophy,
  Film,
  Tv,
  Baby,
  Music,
  Sparkles,
  Heart,
} from 'lucide-react';
import { CategorySummary, Channel } from '../types/iptv';
import { ChannelLogo } from './ChannelLogo';
import { useAppSettings } from '../context/SettingsContext';

interface ContentRowsProps {
  channels: Channel[];
  allChannels: Channel[];
  categories: CategorySummary[];
  activeChannelId: string;
  activeNav: string;
  favoriteIds: string[];
  showAllChannelsGrid: boolean;
  onSelectChannel: (channel: Channel) => void;
  onSelectCategory: (category: string) => void;
  onToggleFavorite: (channelId: string) => void;
  onToggleViewAll: () => void;
  onBrowseLiveTv?: () => void;
  onOpenCategories?: () => void;
}

const CATEGORY_STYLES: Record<
  string,
  { gradient: string; iconBg: string; icon: React.ComponentType<{ className?: string }> }
> = {
  News: {
    gradient: 'from-[#dc2626] to-[#991b1b]',
    iconBg: 'bg-white/20',
    icon: Newspaper,
  },
  Sports: {
    gradient: 'from-[#16a34a] to-[#14532d]',
    iconBg: 'bg-white/20',
    icon: Trophy,
  },
  Movies: {
    gradient: 'from-[#7c3aed] to-[#4c1d95]',
    iconBg: 'bg-white/20',
    icon: Film,
  },
  Entertainment: {
    gradient: 'from-[#ea580c] to-[#9a3412]',
    iconBg: 'bg-white/20',
    icon: Tv,
  },
  Kids: {
    gradient: 'from-[#0284c7] to-[#075985]',
    iconBg: 'bg-white/20',
    icon: Baby,
  },
  Music: {
    gradient: 'from-[#db2777] to-[#831843]',
    iconBg: 'bg-white/20',
    icon: Music,
  },
};

const FALLBACK_GRADIENTS = [
  'from-[#0f766e] to-[#134e4a]',
  'from-[#4338ca] to-[#312e81]',
  'from-[#b45309] to-[#78350f]',
  'from-[#be123c] to-[#881337]',
];

function HorizontalScrollControls({
  scrollRef,
}: {
  scrollRef: React.RefObject<HTMLDivElement | null>;
}) {
  const scrollByAmount = (dir: number) => {
    scrollRef.current?.scrollBy({ left: dir * 320, behavior: 'smooth' });
  };

  return (
    <div className="hidden sm:flex items-center gap-1">
      <button
        type="button"
        onClick={() => scrollByAmount(-1)}
        aria-label="Scroll left"
        className="w-7 h-7 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => scrollByAmount(1)}
        aria-label="Scroll right"
        className="w-7 h-7 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ContentRows({
  channels,
  allChannels,
  categories,
  activeChannelId,
  activeNav,
  favoriteIds,
  showAllChannelsGrid,
  onSelectChannel,
  onSelectCategory,
  onToggleFavorite,
  onToggleViewAll,
  onBrowseLiveTv,
  onOpenCategories,
}: ContentRowsProps) {
  const liveRowRef = useRef<HTMLDivElement | null>(null);
  const categoriesRowRef = useRef<HTMLDivElement | null>(null);
  const popularRowRef = useRef<HTMLDivElement | null>(null);
  const { appearance } = useAppSettings();

  // Pick a diverse cross-section from the loaded M3U URL across categories
  const popularChannels = (() => {
    const picked: Channel[] = [];
    const seen = new Set<string>();
    const byGroup = new Map<string, Channel[]>();
    for (const ch of allChannels) {
      const list = byGroup.get(ch.group) ?? [];
      list.push(ch);
      byGroup.set(ch.group, list);
    }
    let round = 0;
    while (picked.length < 14 && picked.length < allChannels.length) {
      let addedInRound = false;
      for (const list of byGroup.values()) {
        if (list[round] && !seen.has(list[round].id)) {
          picked.push(list[round]);
          seen.add(list[round].id);
          addedInRound = true;
          if (picked.length >= 14) break;
        }
      }
      if (!addedInRound) break;
      round++;
    }
    return picked;
  })();

  const sectionHeading =
    activeNav === 'Home' || activeNav === 'Live TV'
      ? 'Live Channels'
      : activeNav === 'Favorites'
        ? 'Favorite Channels'
        : activeNav === 'Categories'
          ? 'Browse All Categories'
          : `${activeNav} Channels`;

  const isSpecificCategory =
    activeNav !== 'Home' &&
    activeNav !== 'Live TV' &&
    activeNav !== 'Categories' &&
    activeNav !== 'Favorites' &&
    activeNav !== 'Settings';

  return (
    <div className="space-y-4">
      {/* Row 1: Live Channels (Swipeable Row or Expanded Grid) */}
      {activeNav !== 'Categories' && (
        <section aria-label={sectionHeading}>
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2 min-w-0">
              {isSpecificCategory && onOpenCategories && (
                <button
                  type="button"
                  onClick={onOpenCategories}
                  aria-label="Back to Categories"
                  className="p-1.5 rounded-lg bg-white/[0.07] hover:bg-white/[0.14] text-slate-200 cursor-pointer shrink-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
              <h2 className="text-base font-bold text-white tracking-tight truncate">
                {sectionHeading}
              </h2>
              {appearance.groupsShowCounts && (
                <span className="font-mono-tabular text-xs text-slate-400 shrink-0">
                  {channels.length}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              {!showAllChannelsGrid && <HorizontalScrollControls scrollRef={liveRowRef} />}
              <button
                type="button"
                onClick={onToggleViewAll}
                className="text-xs font-medium text-[#38bdf8] hover:text-white flex items-center gap-0.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                {showAllChannelsGrid ? 'Compact Row' : 'View All'}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {channels.length === 0 ? (
            <div className="rounded-2xl bg-[#0b1322] border border-white/[0.08] p-6 text-center">
              <p className="text-sm font-semibold text-slate-200">
                {activeNav === 'Favorites'
                  ? 'No favorite channels saved yet.'
                  : 'No channels match this filter.'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {activeNav === 'Favorites'
                  ? 'Tap the heart icon on any channel card or player panel to add it to Favorites.'
                  : 'Try clearing your search or selecting another category.'}
              </p>
              {activeNav === 'Favorites' && onBrowseLiveTv && (
                <button
                  type="button"
                  onClick={onBrowseLiveTv}
                  className="mt-4 px-4 py-2.5 rounded-xl bg-[#0077ff] hover:bg-[#0066dd] text-white text-xs font-semibold cursor-pointer"
                >
                  Browse Live TV Channels
                </button>
              )}
            </div>
          ) : (
            <div
              ref={liveRowRef}
              className={
                showAllChannelsGrid
                  ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3'
                  : 'flex items-stretch gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-1 touch-pan-x'
              }
            >
              {channels.map((ch) => {
                const isActive = ch.id === activeChannelId;
                const isFav = favoriteIds.includes(ch.id);
                return (
                  <div
                    key={ch.id}
                    className={`relative group rounded-xl transition-all duration-150 ${
                      showAllChannelsGrid ? 'w-full' : 'w-36 sm:w-40 shrink-0 snap-start'
                    }`}
                  >
                    <button
                      type="button"
                      data-tv-focusable="true"
                      onClick={() => onSelectChannel(ch)}
                      className={`tv-focusable w-full h-full text-left rounded-xl p-2 transition-all duration-150 cursor-pointer flex flex-col justify-between ${
                        isActive
                          ? 'bg-[#0b1930] ring-2 ring-[#0088ff] shadow-lg shadow-[#0077ff]/20'
                          : 'bg-[#0a1220] border border-white/[0.08] hover:border-white/25 hover:bg-[#101c30]'
                      }`}
                    >
                      <div className="relative w-full aspect-[16/9] rounded-lg bg-black/40 overflow-hidden flex items-center justify-center p-1.5">
                        <ChannelLogo channel={ch} className="w-full h-full" />
                        <span className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-[#e11d48] text-white text-[9px] font-bold tracking-wider uppercase leading-none">
                          LIVE
                        </span>
                      </div>

                      <div className="mt-2 px-0.5">
                        <p className="text-xs font-semibold text-white truncate">{ch.name}</p>
                        <p className="text-[11px] text-slate-400 truncate">{ch.group}</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(ch.id);
                      }}
                      aria-label={isFav ? `Unfavorite ${ch.name}` : `Favorite ${ch.name}`}
                      className={`absolute top-2.5 left-2.5 w-7 h-7 rounded-md flex items-center justify-center transition-opacity cursor-pointer ${
                        isFav
                          ? 'bg-black/75 text-rose-400 opacity-100'
                          : 'bg-black/65 text-slate-200 opacity-90 lg:opacity-0 lg:group-hover:opacity-100 focus-visible:opacity-100'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-400' : ''}`} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Row 2: Categories (Dynamic from M3U group-title + Color Cards) */}
      {(activeNav === 'Categories' || (appearance.groupsShowRow && activeNav === 'Home')) && (
        <section aria-label="Categories">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-bold text-white tracking-tight">Categories</h2>
            {activeNav !== 'Categories' && (
              <HorizontalScrollControls scrollRef={categoriesRowRef} />
            )}
          </div>

        <div
          ref={categoriesRowRef}
          className={
            activeNav === 'Categories'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'
              : 'flex items-stretch gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-1 touch-pan-x'
          }
        >
          {categories.map((cat, idx) => {
            const preset = CATEGORY_STYLES[cat.name];
            const gradient =
              preset?.gradient ?? FALLBACK_GRADIENTS[idx % FALLBACK_GRADIENTS.length];
            const Icon = preset?.icon ?? Sparkles;
            const isSelected = activeNav === cat.name;

            return (
              <button
                key={cat.name}
                type="button"
                data-tv-focusable="true"
                onClick={() => onSelectCategory(cat.name)}
                className={`tv-focusable group relative rounded-xl bg-gradient-to-r ${gradient} p-3 text-left flex items-center justify-between gap-2.5 transition-transform duration-150 hover:scale-[1.01] cursor-pointer ${
                  activeNav === 'Categories' ? 'w-full' : 'w-48 sm:w-52 shrink-0 snap-start'
                } ${isSelected ? 'ring-2 ring-white' : ''}`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{cat.name}</p>
                    <p className="text-[11px] text-white/85 truncate">{cat.subtitle}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-white/80 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </button>
            );
          })}
        </div>
      </section>
      )}

      {/* Row 3: Popular Channels (Compact Square Logo Cards, shown on Home) */}
      {activeNav === 'Home' && (
      <section aria-label="Popular Channels">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-bold text-white tracking-tight">
            Popular Channels
          </h2>
          <HorizontalScrollControls scrollRef={popularRowRef} />
        </div>

        <div
          ref={popularRowRef}
          className="flex items-center gap-2.5 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-1 touch-pan-x"
        >
          {popularChannels.map((ch) => {
            const isActive = ch.id === activeChannelId;
            return (
              <button
                key={`pop-${ch.id}`}
                type="button"
                data-tv-focusable="true"
                onClick={() => onSelectChannel(ch)}
                title={`${ch.name} (${ch.group})`}
                aria-label={`Watch ${ch.name}`}
                className={`tv-focusable w-24 h-14 shrink-0 snap-start rounded-xl p-1.5 flex items-center justify-center transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#0b1930] ring-2 ring-[#0088ff]'
                    : 'bg-[#0a1220] border border-white/[0.08] hover:border-white/25 hover:bg-[#101c30]'
                }`}
              >
                <ChannelLogo channel={ch} className="w-full h-full" />
              </button>
            );
          })}
        </div>
      </section>
      )}
    </div>
  );
}
