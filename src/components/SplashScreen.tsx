import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
  durationMs?: number;
}

export function SplashScreen({ onComplete, durationMs = 3000 }: SplashScreenProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const fadeStartMs = Math.max(0, durationMs - 500);
    const fadeTimer = setTimeout(() => {
      setIsExiting(true);
    }, fadeStartMs);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, durationMs);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [durationMs, onComplete]);

  return (
    <div
      role="dialog"
      aria-label="BALINDER LIVE TV Welcome Splash Screen"
      className={`fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#02050c] select-none transition-all duration-500 ease-out ${
        isExiting ? 'opacity-0 scale-[1.03] pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* 16:9 Android TV Cinema Stage */}
      <div className="relative w-full h-full flex items-center justify-center bg-[radial-gradient(ellipse_at_center,#0a2554_0%,#06132b_38%,#030814_72%,#010308_100%)]">
        {/* Subtle Ambient Blue Light Rays & Glowing Atmosphere */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* Central Pulsing Neon Blue Halo */}
          <div className="animate-splash-halo absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] sm:w-[680px] sm:h-[680px] rounded-full bg-[radial-gradient(circle,rgba(0,136,255,0.28)_0%,rgba(56,189,248,0.1)_42%,transparent_72%)] blur-2xl" />

          {/* Top Edge Ambient Sapphire Glow */}
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[75%] h-64 bg-[radial-gradient(ellipse_at_center,rgba(0,119,255,0.22)_0%,transparent_70%)] blur-3xl" />

          {/* Sweeping Volumetric Blue Light Beam */}
          <div className="animate-splash-sweep absolute inset-y-0 w-72 bg-gradient-to-r from-transparent via-[#38bdf8]/12 to-transparent blur-2xl" />

          {/* Subtle Horizon Floor Reflection */}
          <div className="absolute bottom-14 left-1/2 -translate-x-1/2 w-[70%] max-w-3xl h-px bg-gradient-to-r from-transparent via-[#0088ff]/60 to-transparent shadow-[0_0_24px_rgba(0,136,255,0.75)]" />
        </div>

        {/* Center 16:9 Content Frame */}
        <div className="relative z-10 w-full max-w-5xl aspect-video flex flex-col items-center justify-center px-6 text-center">
          {/* Smooth Zooming Logo + Neon Blue Glow */}
          <div className="animate-splash-zoom flex flex-col items-center">
            <div className="relative flex items-center justify-center">
              {/* Outer Neon Ring Glow */}
              <div className="absolute -inset-4 rounded-[38px] bg-[#0088ff]/20 blur-xl" />

              {/* Exact Blue TV + Play Triangle Logo Box */}
              <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-[30px] bg-gradient-to-b from-[#0b1930] to-[#060e1c] border border-[#38bdf8]/45 shadow-[0_0_45px_rgba(0,136,255,0.55),inset_0_0_22px_rgba(56,189,248,0.18)] flex items-center justify-center">
                <svg
                  viewBox="0 0 512 512"
                  className="w-24 h-24 sm:w-32 sm:h-32 drop-shadow-[0_0_18px_rgba(0,136,255,0.85)]"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient id="splashTvStroke" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#38bdf8" />
                      <stop offset="55%" stopColor="#0088ff" />
                      <stop offset="100%" stopColor="#0066ff" />
                    </linearGradient>
                  </defs>
                  {/* TV V-Antenna */}
                  <path
                    d="M178 118 L256 188 L334 118"
                    fill="none"
                    stroke="url(#splashTvStroke)"
                    strokeWidth="28"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* TV Rounded Screen Bezel */}
                  <rect
                    x="104"
                    y="184"
                    width="304"
                    height="214"
                    rx="38"
                    fill="#0077ff"
                    fillOpacity="0.16"
                    stroke="url(#splashTvStroke)"
                    strokeWidth="28"
                  />
                  {/* Center Play Triangle */}
                  <polygon
                    points="226,244 226,338 308,291"
                    fill="#38bdf8"
                  />
                </svg>
              </div>
            </div>

            {/* Brand Wordmark */}
            <div className="mt-7 flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1">
              <span className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white drop-shadow-[0_2px_20px_rgba(255,255,255,0.25)]">
                BALINDER
              </span>
              <span className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-[#38bdf8] via-[#0099ff] to-[#0077ff] bg-clip-text text-transparent drop-shadow-[0_0_26px_rgba(0,136,255,0.75)]">
                LIVE TV
              </span>
            </div>
          </div>

          {/* Welcome Subtitle */}
          <p className="animate-splash-text mt-5 text-xs sm:text-sm md:text-base font-semibold uppercase tracking-[0.24em] text-[#bae6fd]/90 drop-shadow-[0_0_12px_rgba(56,189,248,0.45)]">
            WELCOME TO BALINDER LIVE TV
          </p>

          {/* Sleek Neon Blue Progress Bar */}
          <div className="mt-8 w-52 sm:w-64 h-1 rounded-full bg-white/10 overflow-hidden">
            <div className="animate-splash-progress h-full w-full rounded-full bg-gradient-to-r from-[#0066ff] via-[#0099ff] to-[#38bdf8] shadow-[0_0_14px_rgba(56,189,248,0.9)]" />
          </div>
        </div>
      </div>
    </div>
  );
}
