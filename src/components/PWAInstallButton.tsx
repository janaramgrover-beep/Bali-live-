import { useEffect, useState } from 'react';
import { Download, FileCode2, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [downloadingHtml, setDownloadingHtml] = useState(false);
  const [downloadFeedback, setDownloadFeedback] = useState<string | null>(null);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(standalone);

    const ua = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    } else {
      setShowGuide((v) => !v);
    }
  };

  const handleDownloadHtml = async () => {
    setDownloadingHtml(true);
    setDownloadFeedback(null);
    try {
      const res = await fetch('/live-tv.html');
      if (!res.ok) throw new Error('Unable to fetch live-tv.html');
      const htmlText = await res.text();
      const blob = new Blob([htmlText], { type: 'text/html;charset=utf-8' });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'live-tv.html';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
      setDownloadFeedback('Downloaded live-tv.html');
    } catch {
      setDownloadFeedback('Download failed. Try opening /live-tv.html directly.');
    } finally {
      setDownloadingHtml(false);
    }
  };

  return (
    <div className="space-y-2.5">
      <button
        type="button"
        onClick={handleDownloadHtml}
        disabled={downloadingHtml}
        className="w-full min-h-[44px] px-4 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 text-sm font-semibold text-white flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
      >
        <FileCode2 className="w-4 h-4 text-[#38bdf8]" />
        <span>{downloadingHtml ? 'Preparing File...' : 'Download HTML (live-tv.html)'}</span>
      </button>

      {downloadFeedback && (
        <p className="text-xs text-emerald-400 text-center">{downloadFeedback}</p>
      )}

      {!isInstalled && (
        <>
          <button
            type="button"
            onClick={handleInstallClick}
            className="w-full min-h-[44px] px-4 rounded-xl bg-[#0077ff]/20 hover:bg-[#0077ff]/30 border border-[#0077ff]/40 text-sm font-semibold text-[#38bdf8] flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {isIOS ? <Smartphone className="w-4 h-4" /> : <Download className="w-4 h-4" />}
            <span>{deferredPrompt ? 'Install BALINDER Live TV' : 'Install on Android / iOS'}</span>
          </button>

          {showGuide && (
            <div className="rounded-xl bg-black/40 border border-white/10 p-3 text-xs text-slate-300 space-y-1.5 leading-relaxed">
              {isIOS ? (
                <p>
                  Open the deployed app URL directly in Safari (outside preview), tap{' '}
                  <strong>Share</strong>, and choose <strong>Add to Home Screen</strong>.
                </p>
              ) : (
                <p>
                  Open the deployed/shared URL directly in Chrome on Android (outside the AI Studio
                  preview frame), then tap Chrome menu (⋮) → <strong>Install app</strong>. Note:
                  APK binaries cannot be compiled inside this browser sandbox.
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
