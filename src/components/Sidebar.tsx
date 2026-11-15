import React from 'react';
import {
  Tv,
  Home,
  Film,
  Trophy,
  Newspaper,
  Smile,
  Baby,
  Music,
  Settings,
  X,
  Heart,
  LayoutGrid,
} from 'lucide-react';
import { BuiltInNavSection, CategorySummary } from '../types/iptv';

interface SidebarProps {
  activeNav: string;
  onSelectNav: (nav: string) => void;
  onOpenSettings: () => void;
  isMobileDrawerOpen: boolean;
  onCloseMobileDrawer: () => void;
  forceMobileLayout: boolean;
  forceTvLayout: boolean;
  favoritesCount: number;
  isSettingsOpen?: boolean;
  dynamicCategories?: CategorySummary[];
}

const NAV_ITEMS: { id: BuiltInNavSection; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'Home', label: 'Home', icon: Home },
  { id: 'Live TV', label: 'Live TV', icon: Tv },
  { id: 'Movies', label: 'Movies', icon: Film },
  { id: 'Sports', label: 'Sports', icon: Trophy },
  { id: 'News', label: 'News', icon: Newspaper },
  { id: 'Entertainment', label: 'Entertainment', icon: Smile },
  { id: 'Kids', label: 'Kids', icon: Baby },
  { id: 'Music', label: 'Music', icon: Music },
  { id: 'Settings', label: 'Settings', icon: Settings },
];

export function Sidebar({
  activeNav,
  onSelectNav,
  onOpenSettings,
  isMobileDrawerOpen,
  onCloseMobileDrawer,
  forceMobileLayout,
  forceTvLayout,
  favoritesCount,
  isSettingsOpen = false,
  dynamicCategories = [],
}: SidebarProps) {
  const builtInLower = new Set(NAV_ITEMS.map((i) => i.id.toLowerCase()));
  const extraCategories = dynamicCategories.filter(
    (c) => !builtInLower.has(c.name.toLowerCase())
  );
  const handleItemClick = (id: string) => {
    if (id === 'Settings') {
      onOpenSettings();
    } else {
      onSelectNav(id);
    }
    onCloseMobileDrawer();
  };

  const sidebarVisibilityClass = forceMobileLayout
    ? 'hidden'
    : forceTvLayout
      ? 'flex'
      : 'hidden lg:flex';

  const bottomNavVisibilityClass = forceTvLayout
    ? 'hidden'
    : forceMobileLayout
      ? 'grid'
      : 'grid lg:hidden';

  return (
    <>
      {/* Fixed Left Sidebar (Smart TV & Desktop Mode) */}
      <aside
        aria-label="Primary Navigation"
        className={`${sidebarVisibilityClass} flex-col w-60 shrink-0 bg-[#070d18] border-r border-white/[0.06] h-screen sticky top-0 select-none z-30`}
      >
        {/* Brand Header */}
        <div className="px-5 pt-6 pb-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0077ff]/15 border border-[#0077ff]/30 flex items-center justify-center shrink-0">
            <Tv className="w-6 h-6 text-[#0088ff]" />
          </div>
          <div className="min-w-0">
            <div className="text-[17px] font-extrabold tracking-tight leading-tight">
              <span className="text-white">BALINDER </span>
              <span className="text-[#0088ff]">Live TV</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 truncate">Watch Your Favorite Channels</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto no-scrollbar">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                type="button"
                data-tv-focusable="true"
                onClick={() => handleItemClick(item.id)}
                className={`tv-focusable w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-[14px] font-medium transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#0077ff] text-white shadow-lg shadow-[#0077ff]/25'
                    : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}

          {extraCategories.length > 0 && (
            <div className="pt-2 mt-2 border-t border-white/[0.06] space-y-1">
              {extraCategories.map((cat) => {
                const isActive = activeNav.toLowerCase() === cat.name.toLowerCase();
                return (
                  <button
                    key={cat.name}
                    type="button"
                    data-tv-focusable="true"
                    onClick={() => handleItemClick(cat.name)}
                    className={`tv-focusable w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-[#0077ff] text-white shadow-lg shadow-[#0077ff]/25'
                        : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
                    }`}
                  >
                    <span className="flex items-center gap-3 min-w-0">
                      <LayoutGrid className="w-4 h-4 shrink-0 text-slate-400" />
                      <span className="truncate">{cat.name}</span>
                    </span>
                    <span className="font-mono-tabular text-[11px] opacity-70">{cat.count}</span>
                  </button>
                );
              })}
            </div>
          )}
        </nav>

        {/* Quick Favorites Shortcut */}
        {favoritesCount > 0 && (
          <div className="px-3 pb-4 pt-2 border-t border-white/[0.06]">
            <button
              type="button"
              data-tv-focusable="true"
              onClick={() => handleItemClick('Favorites')}
              className={`tv-focusable w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-[13px] font-medium transition-colors cursor-pointer ${
                activeNav === 'Favorites'
                  ? 'bg-[#0077ff] text-white'
                  : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              <span className="flex items-center gap-3 whitespace-nowrap">
                <Heart className="w-4 h-4 text-rose-400" />
                Favorites
              </span>
              <span className="font-mono-tabular text-xs opacity-75">{favoritesCount}</span>
            </button>
          </div>
        )}
      </aside>

      {/* Mobile Slide-Over Hamburger Drawer */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onCloseMobileDrawer}
            aria-hidden="true"
          />
          <aside
            aria-label="Mobile Navigation Drawer"
            className="relative w-72 max-w-[82vw] bg-[#080f1d] border-r border-white/10 h-full flex flex-col z-10 shadow-2xl"
          >
            <div className="px-5 py-4 flex items-center justify-between border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#0077ff]/15 border border-[#0077ff]/30 flex items-center justify-center">
                  <Tv className="w-5 h-5 text-[#0088ff]" />
                </div>
                <div>
                  <div className="text-base font-extrabold tracking-tight leading-none">
                    <span className="text-white">BALINDER </span>
                    <span className="text-[#0088ff]">Live TV</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">Smart IPTV Player</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onCloseMobileDrawer}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
                aria-label="Close navigation menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleItemClick(item.id)}
                    className={`w-full min-h-[46px] flex items-center gap-3.5 px-4 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                      isActive
                        ? 'bg-[#0077ff] text-white'
                        : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => handleItemClick('Favorites')}
                className={`w-full min-h-[46px] flex items-center justify-between px-4 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                  activeNav === 'Favorites'
                    ? 'bg-[#0077ff] text-white'
                    : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                <span className="flex items-center gap-3.5">
                  <Heart className="w-5 h-5 text-rose-400 shrink-0" />
                  <span>Favorites</span>
                </span>
                <span className="font-mono-tabular text-xs opacity-75">{favoritesCount}</span>
              </button>
            </nav>
          </aside>
        </div>
      )}

      {/* Mobile Fixed Bottom Thumb Navigation Bar (Home, Live TV, Categories, Favorites, Settings) */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className={`${bottomNavVisibilityClass} fixed bottom-0 left-0 right-0 z-40 grid-cols-5 min-h-[60px] pb-[env(safe-area-inset-bottom)] bg-[#070d18] border-t border-white/[0.12] shadow-[0_-8px_24px_rgba(0,0,0,0.55)] ${
          forceMobileLayout ? 'max-w-[440px] mx-auto' : ''
        }`}
      >
        {[
          { id: 'Home', label: 'Home', icon: Home },
          { id: 'Live TV', label: 'Live TV', icon: Tv },
          { id: 'Categories', label: 'Categories', icon: LayoutGrid },
          { id: 'Favorites', label: 'Favorites', icon: Heart },
          { id: 'Settings', label: 'Settings', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive =
            tab.id === 'Settings' ? isSettingsOpen : !isSettingsOpen && activeNav === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleItemClick(tab.id)}
              className={`relative flex flex-col items-center justify-center min-h-[54px] py-1.5 transition-colors cursor-pointer ${
                isActive ? 'text-[#38bdf8]' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isActive && (
                <span className="absolute top-0 inset-x-3 h-0.5 rounded-full bg-[#0088ff]" />
              )}
              <Icon
                className={`w-5 h-5 ${
                  tab.id === 'Favorites' && (isActive || favoritesCount > 0)
                    ? isActive
                      ? 'fill-rose-400 text-rose-400'
                      : 'text-rose-400/80'
                    : ''
                }`}
              />
              <span className="text-[10px] font-semibold mt-0.5 whitespace-nowrap shrink-0">
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
