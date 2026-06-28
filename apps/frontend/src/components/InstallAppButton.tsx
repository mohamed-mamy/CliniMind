import { useEffect, useMemo, useState } from 'react';
import { Download, Share2, Smartphone, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

function isAppleMobileDevice() {
  const userAgent = window.navigator.userAgent.toLowerCase();
  const isTouchMac = /macintosh/.test(userAgent) && window.navigator.maxTouchPoints > 1;
  return /iphone|ipad|ipod/.test(userAgent) || isTouchMac;
}

function isStandaloneMode() {
  return window.matchMedia('(display-mode: standalone)').matches || Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
}

export default function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isAppleMobile, setIsAppleMobile] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showAppleHelp, setShowAppleHelp] = useState(false);

  useEffect(() => {
    setIsAppleMobile(isAppleMobileDevice());
    setIsInstalled(isStandaloneMode());

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
      setShowAppleHelp(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const canShow = useMemo(() => {
    if (isInstalled) return false;
    return isAppleMobile || Boolean(deferredPrompt);
  }, [deferredPrompt, isAppleMobile, isInstalled]);

  const handleInstall = async () => {
    if (isAppleMobile) {
      setShowAppleHelp(true);
      return;
    }

    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  if (!canShow) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleInstall}
        className="flex min-h-9 items-center gap-2 rounded-xl bg-sky-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-sky-700 active:scale-95 dark:bg-sky-500 dark:hover:bg-sky-400"
      >
        <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="max-w-32 leading-tight sm:max-w-none">تثبيت التطبيق على الهاتف</span>
      </button>

      {showAppleHelp && (
        <div className="absolute top-12 z-40 w-72 rounded-2xl border border-slate-100 bg-white p-4 text-right shadow-xl dark:border-slate-800 dark:bg-slate-900 ltr:right-0 rtl:left-0">
          <button
            type="button"
            onClick={() => setShowAppleHelp(false)}
            className="absolute left-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            title="إغلاق"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>

          <div className="mb-3 flex items-center gap-2 pe-8 text-sky-700 dark:text-sky-300">
            <Smartphone className="h-4 w-4" aria-hidden="true" />
            <span className="text-xs font-black">تثبيت CliniMind على iPhone</span>
          </div>

          <ol className="space-y-2 text-xs font-semibold leading-relaxed text-slate-700 dark:text-slate-200">
            <li>افتح الرابط في Safari</li>
            <li className="flex items-center justify-end gap-2">
              <span>اضغط زر المشاركة</span>
              <Share2 className="h-4 w-4 text-sky-600 dark:text-sky-300" aria-hidden="true" />
            </li>
            <li>اختر Add to Home Screen</li>
          </ol>

          <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs font-semibold leading-relaxed text-slate-500 dark:bg-slate-800 dark:text-slate-300">
            عند تحديث النظام، أغلق التطبيق وافتحه من جديد إذا لم تظهر التغييرات.
          </p>
        </div>
      )}
    </div>
  );
}
