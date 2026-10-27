"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export default function VisitorTracker() {
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;

    // Do not track admin panels, api endpoints, or internal routes
    if (pathname.startsWith("/admin") || pathname.startsWith("/api")) {
      return;
    }

    // Prevent duplicate firing for the exact same path in quick succession
    if (lastTrackedPath.current === pathname) {
      return;
    }
    lastTrackedPath.current = pathname;

    try {
      // Retrieve or generate persistent visitor id
      let visitorId = "";
      if (typeof window !== "undefined" && window.localStorage) {
        visitorId = localStorage.getItem("rc_vid") || "";
        if (!visitorId) {
          visitorId = `rc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
          localStorage.setItem("rc_vid", visitorId);
        }
      }

      const payload = JSON.stringify({
        path: pathname,
        referer: typeof document !== "undefined" ? document.referrer : "",
        visitorId,
      });

      // Dispatch tracking request asynchronously
      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon("/api/track-visit", blob);
      } else {
        fetch("/api/track-visit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {
          // Silent catch to prevent any user-facing console noise
        });
      }
    } catch {
      // Ignore client side errors silently
    }
  }, [pathname]);

  return null;
}
