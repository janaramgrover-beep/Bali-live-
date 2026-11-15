import { Channel } from '../types/iptv';

// Crisp SVG broadcast badges rendered locally so default channel logos never 404
function makeLogoSvg(bg1: string, bg2: string, title: string, accent: string, sub?: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 100">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${bg1}"/>
        <stop offset="100%" stop-color="${bg2}"/>
      </linearGradient>
    </defs>
    <rect width="160" height="100" rx="14" fill="url(#g)"/>
    <circle cx="132" cy="22" r="26" fill="${accent}" fill-opacity="0.18"/>
    <text x="80" y="${sub ? '49' : '58'}" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-weight="800" font-size="${title.length > 7 ? '21' : '26'}" fill="#ffffff" letter-spacing="0.5">${title}</text>
    ${sub ? `<text x="80" y="72" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-weight="600" font-size="11" fill="${accent}" letter-spacing="1.4">${sub}</text>` : ''}
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const DEFAULT_M3U_PLAYLIST = `#EXTM3U
#EXTINF:-1 tvg-id="sports-hd" tvg-name="Star Sports 1 HD" group-title="Sports" tvg-language="Hindi / English" tvg-program="World Championship Live" tvg-subtitle="Live Stadium Feed",Star Sports 1 HD
https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8
#EXTINF:-1 tvg-id="sony-ent" tvg-name="Sony Entertainment" group-title="Entertainment" tvg-language="Hindi" tvg-program="Primetime Showcase" tvg-subtitle="Evening Drama Special",Sony Entertainment
https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8
#EXTINF:-1 tvg-id="zee-tv" tvg-name="Zee TV" group-title="Entertainment" tvg-language="Hindi" tvg-program="Cinema &amp; Reality Hour" tvg-subtitle="Studio Broadcast",Zee TV
https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8
#EXTINF:-1 tvg-id="colors-tv" tvg-name="Colors TV" group-title="Entertainment" tvg-language="Hindi" tvg-program="Weekend Live Stage" tvg-subtitle="HD Network Simulcast",Colors TV
https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8
#EXTINF:-1 tvg-id="aaj-tak" tvg-name="Aaj Tak" group-title="News" tvg-language="Hindi" tvg-program="Prime Time Debate" tvg-subtitle="Live Newsroom Bulletin",Aaj Tak
https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8
#EXTINF:-1 tvg-id="ndtv-india" tvg-name="NDTV 24x7" group-title="News" tvg-language="English" tvg-program="Global Headlines" tvg-subtitle="Breaking News &amp; Analysis",NDTV 24x7
https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8
#EXTINF:-1 tvg-id="cnbc-tv18" tvg-name="CNBC TV18" group-title="News" tvg-language="English" tvg-program="Closing Bell Markets" tvg-subtitle="Financial Markets Live",CNBC TV18
https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8
#EXTINF:-1 tvg-id="sony-max" tvg-name="Sony MAX" group-title="Movies" tvg-language="Hindi / English" tvg-program="Tears of Steel (4K Remaster)" tvg-subtitle="Sci-Fi Action Feature",Sony MAX
https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8
#EXTINF:-1 tvg-id="hbo-hd" tvg-name="HBO Cinema HD" group-title="Movies" tvg-language="English" tvg-program="Sintel: Director's Cut" tvg-subtitle="Animated Fantasy Feature",HBO Cinema HD
https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8
#EXTINF:-1 tvg-id="nick-hd" tvg-name="Nick HD+" group-title="Kids" tvg-language="English" tvg-program="Big Buck Bunny" tvg-subtitle="Animated Comedy Short",Nick HD+
https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8
#EXTINF:-1 tvg-id="cartoon-net" tvg-name="Cartoon Network" group-title="Kids" tvg-language="English" tvg-program="Adventure Block" tvg-subtitle="Kids Morning Marathon",Cartoon Network
https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8
#EXTINF:-1 tvg-id="mtv-beats" tvg-name="MTV Beats" group-title="Music" tvg-language="Hindi / English" tvg-program="Top 20 Live Hits" tvg-subtitle="Non-Stop Music Videos",MTV Beats
https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8
`;

export const DEFAULT_LOGOS: Record<string, string> = {
  'Star Sports 1 HD': makeLogoSvg('#0d2247', '#071329', 'STAR 1', '#38bdf8', 'SPORTS HD'),
  'Sony Entertainment': makeLogoSvg('#3b2609', '#1e1204', 'SONY', '#fbbf24', 'ENTERTAINMENT'),
  'Zee TV': makeLogoSvg('#2e1042', '#130720', 'ZEE TV', '#fb923c', 'HD'),
  'Colors TV': makeLogoSvg('#2c103b', '#140821', 'colors', '#f472b6', 'HD'),
  'Aaj Tak': makeLogoSvg('#7f1d1d', '#450a0a', 'AAJ TAK', '#fca5a5', 'LIVE NEWS'),
  'NDTV 24x7': makeLogoSvg('#1e293b', '#0f172a', 'NDTV', '#f87171', '24x7'),
  'CNBC TV18': makeLogoSvg('#0f2c59', '#091936', 'CNBC', '#38bdf8', 'TV18'),
  'Sony MAX': makeLogoSvg('#78350f', '#451a03', 'SONY', '#facc15', 'MAX HD'),
  'HBO Cinema HD': makeLogoSvg('#18181b', '#09090b', 'HBO', '#e4e4e7', 'CINEMA'),
  'Nick HD+': makeLogoSvg('#9a3412', '#431407', 'nick', '#fdba74', 'HD+'),
  'Cartoon Network': makeLogoSvg('#171717', '#09090b', 'CN', '#38bdf8', 'CARTOONS'),
  'MTV Beats': makeLogoSvg('#701a75', '#3b0764', 'MTV', '#f472b6', 'BEATS'),
};

export function hydrateDefaultLogos(channels: Channel[]): Channel[] {
  return channels.map((ch) => ({
    ...ch,
    logo: ch.logo || DEFAULT_LOGOS[ch.name] || '',
  }));
}
