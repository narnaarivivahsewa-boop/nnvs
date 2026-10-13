"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Download, Share, PlusSquare, X, Sparkles } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const DISMISS_KEY = "rishteclub_pwa_prompt_dismissed_at";
const COOLDOWN_DAYS = 7;
const COOLDOWN_MS = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

export default function PWAInstallPrompt() {
  const [isVisible, setIsVisible] = useState(false);
  const [platform, setPlatform] = useState<"android" | "ios" | null>(null);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Check if app is already running in standalone mode (already installed)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes("android-app://");

    if (isStandalone) {
      return;
    }

    // 2. Check if user dismissed prompt within cooldown period
    try {
      const dismissedAt = localStorage.getItem(DISMISS_KEY);
      if (dismissedAt) {
        const parsedTime = parseInt(dismissedAt, 10);
        if (!isNaN(parsedTime) && Date.now() - parsedTime < COOLDOWN_MS) {
          return;
        }
      }
    } catch {
      // Ignore localStorage access issues (e.g. strict private browsing)
    }

    // 3. Android / Chromium detection via beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      setPlatform("android");
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // 4. Listen for appinstalled event to hide prompt if installed
    const handleAppInstalled = () => {
      setIsVisible(false);
      deferredPromptRef.current = null;
    };
    window.addEventListener("appinstalled", handleAppInstalled);

    // 5. iOS / Safari detection
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(ua);
    const isSafari =
      /safari/.test(ua) &&
      !/chrome|crios|crmo|firefox|fxios|edg|edge|opr|opera|brave/i.test(ua);

    let iosTimer: NodeJS.Timeout | null = null;
    if (isIOS && isSafari && !isStandalone) {
      // Small delay on iOS so it doesn't pop up abruptly on initial page load
      iosTimer = setTimeout(() => {
        setPlatform("ios");
        setIsVisible(true);
      }, 2500);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      if (iosTimer) clearTimeout(iosTimer);
    };
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, Date.now().toString());
    } catch {
      // Storage access error handling
    }
  };

  const handleInstallClick = async () => {
    const promptEvent = deferredPromptRef.current;
    if (!promptEvent) return;

    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice.outcome === "accepted") {
        setIsVisible(false);
      }
    } catch (err) {
      console.error("RishteClub PWA install error:", err);
    } finally {
      deferredPromptRef.current = null;
    }
  };

  if (!isVisible || !platform) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="pwa-prompt-title"
      className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="relative bg-[#4A121A] text-white rounded-2xl shadow-2xl border border-[#D4AF37]/40 p-4 backdrop-blur-md overflow-hidden ring-1 ring-black/20">
        {/* Subtle decorative gold sheen */}
        <div className="absolute -top-10 -right-10 w-28 h-28 bg-[#D4AF37]/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-md ring-1 ring-[#D4AF37]/50 bg-white flex-shrink-0">
              <Image
                src="/icon-192.png"
                alt="RishteClub App Icon"
                fill
                sizes="48px"
                className="object-contain p-0.5"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3
                  id="pwa-prompt-title"
                  className="font-bold text-white text-base leading-tight tracking-tight"
                >
                  RishteClub Matrimony
                </h3>
                <Sparkles className="w-3.5 h-3.5 text-[#E9C377]" />
              </div>
              <p className="text-xs text-[#E9C377] font-medium mt-0.5">
                Install Official App (No Play Store required)
              </p>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            aria-label="Dismiss app install prompt"
            className="text-stone-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 active:scale-95 transition-all flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Platform-specific content */}
        {platform === "android" ? (
          <div className="mt-3">
            <p className="text-xs text-stone-200 leading-relaxed">
              Add RishteClub to your home screen for quick 1-tap access, real-time match alerts, and a faster full-screen experience.
            </p>

            <div className="mt-3.5 flex items-center gap-2">
              <button
                onClick={handleInstallClick}
                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] text-[#4A121A] font-bold text-sm rounded-xl shadow-lg shadow-[#D4AF37]/20 hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Install App</span>
              </button>
              <button
                onClick={handleDismiss}
                className="py-2.5 px-3.5 text-xs text-stone-300 hover:text-white font-medium rounded-xl hover:bg-white/10 transition cursor-pointer"
              >
                Not Now
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-3">
            <p className="text-xs text-stone-200 leading-relaxed mb-2.5">
              Install RishteClub directly to your iPhone / iPad home screen:
            </p>

            {/* iOS Step-by-Step Instructions */}
            <div className="bg-[#380E14] border border-[#D4AF37]/25 rounded-xl p-2.5 space-y-2 text-xs text-stone-200">
              <div className="flex items-center gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#D4AF37]/20 text-[#E9C377] font-semibold text-[11px] flex-shrink-0">
                  1
                </span>
                <span className="flex items-center gap-1 flex-wrap">
                  Tap the Safari <strong>Share</strong> button{" "}
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-white/15 rounded text-[11px] font-mono text-white">
                    <Share className="w-3 h-3 inline text-[#E9C377]" /> ⎋
                  </span>
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#D4AF37]/20 text-[#E9C377] font-semibold text-[11px] flex-shrink-0">
                  2
                </span>
                <span className="flex items-center gap-1 flex-wrap">
                  Scroll and select <strong>&quot;Add to Home Screen&quot;</strong>{" "}
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-white/15 rounded text-[11px] font-mono text-white">
                    <PlusSquare className="w-3 h-3 inline text-[#E9C377]" /> ⊞
                  </span>
                </span>
              </div>
            </div>

            <div className="mt-3 flex justify-end">
              <button
                onClick={handleDismiss}
                className="py-1.5 px-4 bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] text-[#4A121A] font-bold text-xs rounded-lg shadow hover:brightness-105 active:scale-[0.98] transition cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
