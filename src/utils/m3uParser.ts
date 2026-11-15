import { CategorySummary, Channel } from '../types/iptv';

const DEFAULT_DESCRIPTIONS: Record<string, { subtitle: string; desc: string }> = {
  Sports: {
    subtitle: 'Live Championship Broadcast',
    desc: 'High-frame-rate live sports coverage, match telemetry, and post-game studio analysis.',
  },
  News: {
    subtitle: '24/7 Live News Desk',
    desc: 'Continuous breaking news, global correspondents, and live market & weather briefings.',
  },
  Entertainment: {
    subtitle: 'Prime Time Series & Specials',
    desc: 'Flagship dramas, live variety stages, and evening primetime entertainment.',
  },
  Movies: {
    subtitle: 'Cinema HD Feature',
    desc: 'Uncut feature films, director spotlights, and widescreen theatrical broadcasts.',
  },
  Kids: {
    subtitle: 'Family & Animation Block',
    desc: 'Safe, colorful animated adventures and educational shows for younger viewers.',
  },
  Music: {
    subtitle: 'Non-Stop Live Sessions',
    desc: 'Curated music videos, acoustic sessions, and live concert broadcasts in stereo.',
  },
};

function extractAttribute(extinfLine: string, attrName: string): string {
  const quotedRegex = new RegExp(`${attrName}\\s*=\\s*["']([^"']*)["']`, 'i');
  const quotedMatch = extinfLine.match(quotedRegex);
  if (quotedMatch) return quotedMatch[1].trim();

  const unquotedRegex = new RegExp(`${attrName}\\s*=\\s*([^\\s,]+)`, 'i');
  const unquotedMatch = extinfLine.match(unquotedRegex);
  return unquotedMatch ? unquotedMatch[1].trim() : '';
}

function extractChannelName(extinfLine: string): string {
  let inSingle = false;
  let inDouble = false;
  let lastCommaIdx = -1;

  for (let i = 0; i < extinfLine.length; i++) {
    const ch = extinfLine[i];
    if (ch === '"' && !inSingle) inDouble = !inDouble;
    else if (ch === "'" && !inDouble) inSingle = !inSingle;
    else if (ch === ',' && !inSingle && !inDouble) lastCommaIdx = i;
  }

  if (lastCommaIdx !== -1) {
    return extinfLine.slice(lastCommaIdx + 1).trim();
  }
  return '';
}

function formatScheduleWindow(seed: number): { startTime: string; endTime: string; progress: number } {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const blockMinutes = 90;
  const offset = (seed * 17) % 45;
  const startTotal = currentMinutes - offset;
  const endTotal = startTotal + blockMinutes;

  const fmt = (totalMins: number) => {
    const wrapped = ((totalMins % 1440) + 1440) % 1440;
    const h24 = Math.floor(wrapped / 60);
    const m = wrapped % 60;
    const period = h24 >= 12 ? 'PM' : 'AM';
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    return `${h12}:${String(m).padStart(2, '0')} ${period}`;
  };

  return {
    startTime: fmt(startTotal),
    endTime: fmt(endTotal),
    progress: Math.min(92, Math.max(12, Math.round((offset / blockMinutes) * 100) + 22)),
  };
}

export function normalizeGroupTitle(rawGroup: string): string {
  const cleaned = rawGroup.trim();
  if (!cleaned) return 'General';

  const lower = cleaned.toLowerCase();
  if (lower.includes('sport')) return 'Sports';
  if (lower.includes('news') || lower.includes('business')) return 'News';
  if (lower.includes('movie') || lower.includes('cinema') || lower.includes('film')) return 'Movies';
  if (lower.includes('kid') || lower.includes('cartoon') || lower.includes('anim')) return 'Kids';
  if (lower.includes('music') || lower.includes('mtv') || lower.includes('radio')) return 'Music';
  if (lower.includes('entertain') || lower.includes('drama') || lower.includes('comedy')) return 'Entertainment';

  return cleaned;
}

export function applyUdpProxy(rawUrl: string, udpProxy?: string): string {
  const proxy = (udpProxy || '').trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');
  if (!proxy) return rawUrl;

  if (/^udp:\/\/@?(.+)$/i.test(rawUrl)) {
    const target = rawUrl.replace(/^udp:\/\/@?/i, '');
    return `http://${proxy}/udp/${target}`;
  }
  if (/^rtp:\/\/@?(.+)$/i.test(rawUrl)) {
    const target = rawUrl.replace(/^rtp:\/\/@?/i, '');
    return `http://${proxy}/rtp/${target}`;
  }
  return rawUrl;
}

export function parseM3U(content: string, udpProxy?: string): Channel[] {
  const trimmed = content.trim();
  if (!trimmed) return [];

  // If the file is actually an HLS master/media manifest (#EXT-X-STREAM-INF / #EXT-X-TARGETDURATION),
  // it represents a single playable HLS stream rather than a multi-channel list.
  if (
    trimmed.startsWith('#EXTM3U') &&
    (trimmed.includes('#EXT-X-STREAM-INF') ||
      trimmed.includes('#EXT-X-TARGETDURATION') ||
      trimmed.includes('#EXT-X-MEDIA-SEQUENCE'))
  ) {
    return [];
  }

  const lines = trimmed.split(/\r?\n/);
  const channels: Channel[] = [];

  let pendingExtinf: string | null = null;
  let pendingGroup = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith('#EXTINF:')) {
      pendingExtinf = line;
      continue;
    }

    if (line.startsWith('#EXTGRP:')) {
      pendingGroup = line.slice(8).trim();
      continue;
    }

    if (line.startsWith('#')) {
      continue;
    }

    if (
      /^(https?|rtmp|rtsp|udp):\/\//i.test(line) ||
      /\.(m3u8?|mp4|webm|ogg|ts)(\?.*)?$/i.test(line)
    ) {
      const idx = channels.length + 1;
      const extinf = pendingExtinf ?? '';

      const tvgId = extractAttribute(extinf, 'tvg-id');
      const tvgName = extractAttribute(extinf, 'tvg-name');
      const tvgLogo = extractAttribute(extinf, 'tvg-logo');
      const rawGroup = extractAttribute(extinf, 'group-title') || pendingGroup || 'General';
      const language = extractAttribute(extinf, 'tvg-language') || 'English';
      const chNoRaw = extractAttribute(extinf, 'tvg-chno');
      const parsedName = extractChannelName(extinf) || tvgName || `Channel ${idx}`;
      const group = normalizeGroupTitle(rawGroup);

      const programTitle = extractAttribute(extinf, 'tvg-program') || `${parsedName} Live`;
      const metaDefaults = DEFAULT_DESCRIPTIONS[group] ?? {
        subtitle: `${group} Live Feed`,
        desc: `Streaming ${parsedName} live in ${group}.`,
      };

      const schedule = formatScheduleWindow(idx);

      channels.push({
        id: tvgId
          ? `${tvgId}-${idx}`
          : `ch-${idx}-${parsedName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        number: chNoRaw && !Number.isNaN(Number(chNoRaw)) ? Number(chNoRaw) : idx,
        name: parsedName,
        url: applyUdpProxy(line, udpProxy),
        logo: tvgLogo,
        group,
        language,
        programTitle,
        programSubtitle: extractAttribute(extinf, 'tvg-subtitle') || metaDefaults.subtitle,
        description: extractAttribute(extinf, 'tvg-desc') || metaDefaults.desc,
        ...schedule,
        isPopular: idx <= 12,
      });

      pendingExtinf = null;
      pendingGroup = '';
    }
  }

  return channels;
}

const CATEGORY_SUBTITLES: Record<string, string> = {
  News: 'Latest News & Updates',
  Sports: 'Live Sports & Events',
  Movies: 'Blockbusters & More',
  Entertainment: 'Shows & Serials',
  Kids: 'Cartoons & Kids Shows',
  Music: 'Music Videos & More',
};

export function extractCategories(channels: Channel[]): CategorySummary[] {
  const counts = new Map<string, number>();

  for (const ch of channels) {
    const key = ch.group || 'General';
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const preferredOrder = ['News', 'Sports', 'Movies', 'Entertainment', 'Kids', 'Music'];
  const entries = Array.from(counts.entries()).sort((a, b) => {
    const idxA = preferredOrder.indexOf(a[0]);
    const idxB = preferredOrder.indexOf(b[0]);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a[0].localeCompare(b[0]);
  });

  return entries.map(([name, count]) => ({
    name,
    count,
    subtitle: CATEGORY_SUBTITLES[name] ?? `${count} Live Channels`,
  }));
}
