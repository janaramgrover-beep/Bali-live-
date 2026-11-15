import { useState } from 'react';
import { Tv } from 'lucide-react';
import { Channel } from '../types/iptv';
import { useAppSettings } from '../context/SettingsContext';

interface ChannelLogoProps {
  channel: Pick<Channel, 'name' | 'logo' | 'group'>;
  className?: string;
}

const GROUP_GRADIENTS: Record<string, string> = {
  Sports: 'from-emerald-900/90 to-slate-900',
  News: 'from-rose-900/90 to-slate-900',
  Movies: 'from-violet-900/90 to-slate-900',
  Entertainment: 'from-amber-900/90 to-slate-900',
  Kids: 'from-sky-900/90 to-slate-900',
  Music: 'from-fuchsia-900/90 to-slate-900',
};

export function ChannelLogo({ channel, className = '' }: ChannelLogoProps) {
  const [failed, setFailed] = useState(false);
  const { appearance } = useAppSettings();

  if (appearance.logosMode === 'hidden') {
    return (
      <div
        className={`flex items-center justify-center rounded-lg bg-slate-900/70 border border-white/10 text-slate-400 select-none ${className}`}
        aria-label={channel.name}
      >
        <Tv className="w-5 h-5" />
      </div>
    );
  }

  if (appearance.logosMode === 'all' && channel.logo && !failed) {
    return (
      <img
        src={channel.logo}
        alt={`${channel.name} logo`}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={`object-contain select-none ${className}`}
      />
    );
  }

  const initials = channel.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  const gradient = GROUP_GRADIENTS[channel.group] ?? 'from-slate-800 to-slate-950';

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-lg bg-gradient-to-br ${gradient} border border-white/10 text-white select-none ${className}`}
      aria-label={channel.name}
    >
      {initials ? (
        <span className="font-bold tracking-wider text-sm leading-none">{initials}</span>
      ) : (
        <Tv className="w-5 h-5 text-slate-300" />
      )}
    </div>
  );
}
