"use client";

import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("RishteClub PWA Service Worker registered:", reg.scope);
        })
        .catch((err) => {
          console.error("RishteClub PWA Service Worker registration failed:", err);
        });
    }
  }, []);

  return null;
}
