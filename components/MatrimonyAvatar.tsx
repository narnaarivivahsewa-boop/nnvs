"use client";

import React from "react";
import MandalaPattern from "./MandalaPattern";

interface MatrimonyAvatarProps {
  imageUrl?: string | null;
  fullName?: string | null;
  gender?: string | null;
  size?: "sm" | "md" | "lg" | "xl" | "hero";
  className?: string;
  badge?: boolean;
}

export default function MatrimonyAvatar({
  imageUrl,
  fullName,
  gender,
  size = "md",
  className = "",
  badge = true,
}: MatrimonyAvatarProps) {
  const isFemale = String(gender || "").toUpperCase() === "FEMALE";

  // Size configurations
  const sizeClasses = {
    sm: "h-12 w-12 text-xs",
    md: "h-24 w-20 sm:h-28 sm:w-24 text-sm",
    lg: "h-36 w-32 sm:h-40 sm:w-40 text-base",
    xl: "h-48 w-48 text-lg",
    hero: "h-full w-full min-h-[320px] text-xl",
  };

  // If real Cloudinary photo exists, render the real photo with gold border
  if (imageUrl && imageUrl.trim() !== "") {
    return (
      <div className={`relative overflow-hidden rounded-2xl bg-[#FAF0DC] border-2 border-[#DFBA73] shadow-sm flex items-center justify-center ${sizeClasses[size]} ${className}`}>
        <img
          src={imageUrl}
          alt={fullName || (isFemale ? "Bride Profile" : "Groom Profile")}
          className="h-full w-full object-cover object-top transition-transform duration-500 hover:scale-105"
          loading="lazy"
        />
      </div>
    );
  }

  // Premium Matrimonial Placeholder (Gender-specific luxury styling)
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border-2 border-[#DFBA73]/70 shadow-md flex flex-col items-center justify-center select-none text-center p-3 ${
        isFemale
          ? "bg-gradient-to-br from-[#4A121A] via-[#631823] to-[#2E070C] text-[#DFBA73]"
          : "bg-gradient-to-br from-[#1C2331] via-[#2F1420] to-[#12050A] text-[#DFBA73]"
      } ${sizeClasses[size]} ${className}`}
    >
      {/* Decorative Gold Mandala Pattern Background */}
      <div className="absolute inset-0 pointer-events-none opacity-20 flex items-center justify-center overflow-hidden">
        <MandalaPattern className="w-48 h-48 text-[#DFBA73] transform rotate-45 scale-125" />
      </div>

      {/* Royal Matrimonial Motif */}
      <div className="relative z-10 flex flex-col items-center justify-center space-y-1.5">
        {/* Artistic Matrimonial Silhouette Icon */}
        <div className="relative flex items-center justify-center">
          <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-[#DFBA73]/15 border border-[#DFBA73]/40 flex items-center justify-center shadow-inner">
            {isFemale ? (
              // Bridal Silhouette Icon (Maang Tikka & Veil Motif)
              <svg
                viewBox="0 0 64 64"
                fill="none"
                className="h-9 w-9 sm:h-10 sm:w-10 text-[#DFBA73]"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Traditional Maang Tikka */}
                <circle cx="32" cy="18" r="2.5" fill="#DFBA73" />
                <path d="M32 12v6" stroke="#DFBA73" strokeWidth="1.5" strokeLinecap="round" />
                {/* Bride Head */}
                <circle cx="32" cy="25" r="9" stroke="#DFBA73" strokeWidth="2" fill="#54151E" />
                {/* Bridal Dupatta / Veil Arch */}
                <path
                  d="M18 48c0-9 6-15 14-15s14 6 14 15"
                  stroke="#DFBA73"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                {/* Decorative Jewels */}
                <path
                  d="M26 34c2 3 10 3 12 0"
                  stroke="#DFBA73"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                {/* Bindi */}
                <circle cx="32" cy="24" r="1" fill="#DFBA73" />
              </svg>
            ) : (
              // Groom Silhouette Icon (Royal Turban / Safa Motif)
              <svg
                viewBox="0 0 64 64"
                fill="none"
                className="h-9 w-9 sm:h-10 sm:w-10 text-[#DFBA73]"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Royal Kalgi / Feather Brooch */}
                <path
                  d="M32 8c1 3-1 6 0 9"
                  stroke="#DFBA73"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle cx="32" cy="17" r="2" fill="#DFBA73" />
                {/* Royal Turban / Safa Arch */}
                <path
                  d="M20 22c2-8 22-8 24 0"
                  stroke="#DFBA73"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="#3B121A"
                />
                {/* Groom Head */}
                <circle cx="32" cy="28" r="8" stroke="#DFBA73" strokeWidth="2" fill="#241017" />
                {/* Royal Sherwani Collar */}
                <path
                  d="M18 50c0-10 6-14 14-14s14 4 14 14"
                  stroke="#DFBA73"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path d="M32 37v13" stroke="#DFBA73" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            )}
          </div>
        </div>

        {/* Text Badge */}
        {badge && (
          <div className="flex flex-col items-center">
            <span className="inline-block px-2 py-0.5 rounded-full bg-[#DFBA73]/20 border border-[#DFBA73]/50 text-[10px] sm:text-[11px] font-serif-luxury font-bold tracking-wider uppercase text-white shadow-xs">
              {isFemale ? "Bride Profile" : "Groom Profile"}
            </span>
            <span className="text-[9px] text-[#DFBA73]/80 font-medium tracking-wide mt-0.5">
              Verified Biodata
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
