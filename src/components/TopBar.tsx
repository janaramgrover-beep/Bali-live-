import { useEffect, useState } from 'react';
import type React from 'react';
import { Menu, Search, Settings, Wifi, WifiOff, X, Tv } from 'lucide-react';

interface TopBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenSettings: () => void;
  onOpenMobileDrawer: () => void;
  forceMobileLayout: boolean;
  forceTvLayout: boolean;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
}

export function TopBar({
  searchQuery,
  onSearchChange,
  onOpenSettings,
  onOpenMobileDrawer,
  forceMobileLayout,
  forceTvLayout,
  searchInputRef,
}: TopBarProps) {
  const [now, setNow] = useState(() => new Date());
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 15000);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const formattedTime = now.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });

  const mobileMenuBtnClass = forceTvLayout
    ? 'hidden'
    : forceMobileLayout
      ? 'flex'
      : 'flex lg:hidden';

  return (
    <header className="sticky top-0 z-20 bg-[#060b14]/85 backdrop-blur-md border-b border-white/[0.04] lg:border-b-0 lg:bg-transparent lg:backdrop-blur-none px-4 lg:px-6 h-14 lg:h-16 flex items-center justify-between gap-3 lg:gap-6">
      {/* Left: Mobile Hamburger + Compact Brand (hidden on TV/Desktop since Sidebar shows brand) */}
      <div className={`${mobileMenuBtnClass} items-center gap-2 shrink-0`}>
        <button
          type="button"
          onClick={onOpenMobileDrawer}
          className="min-h-[44px] min-w-[44px] -ml-2 flex items-center justify-center rounded-xl text-slate-200 hover:bg-white/10"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-1.5">
          <Tv className="w-5 h-5 text-[#0088ff]" />
          <span className="font-bold text-sm sm:text-base tracking-tight whitespace-nowrap">
            BALINDER <span className="text-[#0088ff]">Live TV</span>
          </span>
        </div>
      </div>

      {/* Spacer on desktop/TV so search + status align neatly right like TV layout */}
      <div className={forceMobileLayout ? 'hidden' : forceTvLayout ? 'flex-1' : 'hidden lg:block lg:flex-1'} />

      {/* Right Zone: Search Bar + Wi-Fi + Clock + Settings */}
      <div className="flex items-center gap-2 sm:gap-4 flex-1 lg:flex-initial justify-end min-w-0">
        <div className="relative flex-1 max-w-xs sm:max-w-sm lg:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search Channels..."
            aria-label="Search Channels"
            className="tv-focusable w-full h-10 pl-10 pr-8 rounded-xl bg-white/[0.05] border border-white/[0.1] text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-[#0077ff] focus:bg-white/[0.08] transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div
          className="hidden sm:flex items-center gap-3 text-slate-300 shrink-0"
          title={isOnline ? 'Network Connected' : 'Network Offline'}
        >
          {isOnline ? (
            <Wifi className="w-4 h-4 text-slate-200" aria-label="Wi-Fi Connected" />
          ) : (
            <WifiOff className="w-4 h-4 text-rose-400" aria-label="Wi-Fi Disconnected" />
          )}
          <span className="font-mono-tabular text-sm font-medium text-slate-200 whitespace-nowrap">
            {formattedTime}
          </span>
        </div>

        <button
          type="button"
          data-tv-focusable="true"
          onClick={onOpenSettings}
          aria-label="Open Settings"
          className="tv-focusable min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-300 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer shrink-0"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
