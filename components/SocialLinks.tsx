import React from "react";
import { BUSINESS_INFO } from "@/lib/gst";

// Clean SVG Icons for Social Media & Email
export function InstagramIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

export function FacebookIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

export function YouTubeIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

export function EmailIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

export const OFFICIAL_SOCIAL_LINKS = [
  {
    name: "Instagram",
    handle: BUSINESS_INFO.social.instagramHandle,
    href: BUSINESS_INFO.social.instagram,
    ariaLabel: "Follow RishteClub on Instagram (@rishteclub)",
    icon: InstagramIcon,
    hoverBg: "hover:bg-[#E1306C]/10",
    hoverText: "hover:text-[#E1306C]",
    brandColor: "#E1306C",
  },
  {
    name: "Facebook",
    handle: "RishteClub",
    href: BUSINESS_INFO.social.facebook,
    ariaLabel: "Connect with RishteClub on Facebook",
    icon: FacebookIcon,
    hoverBg: "hover:bg-[#1877F2]/10",
    hoverText: "hover:text-[#1877F2]",
    brandColor: "#1877F2",
  },
  {
    name: "YouTube",
    handle: "@NarNaariVivahSewa",
    href: BUSINESS_INFO.social.youtube,
    ariaLabel: "Subscribe to RishteClub Matrimony on YouTube (@NarNaariVivahSewa)",
    icon: YouTubeIcon,
    hoverBg: "hover:bg-[#FF0000]/10",
    hoverText: "hover:text-[#FF0000]",
    brandColor: "#FF0000",
  },
  {
    name: "Email",
    handle: BUSINESS_INFO.email,
    href: `mailto:${BUSINESS_INFO.email}`,
    ariaLabel: `Send email to ${BUSINESS_INFO.email}`,
    icon: EmailIcon,
    hoverBg: "hover:bg-[#DFBA73]/10",
    hoverText: "hover:text-[#DFBA73]",
    brandColor: "#DFBA73",
  },
] as const;

/**
 * Compact Icon Bar (For Header, Topbar, or Mobile Drawer)
 */
export function SocialIconsRow({
  className = "flex items-center gap-3",
  iconClassName = "h-4 w-4",
  variant = "light",
}: {
  className?: string;
  iconClassName?: string;
  variant?: "light" | "dark" | "gold";
}) {
  const baseColors =
    variant === "dark"
      ? "text-stone-300 hover:text-white"
      : variant === "gold"
      ? "text-[#DFBA73] hover:text-white"
      : "text-[#5A4E48] hover:text-[#4A121A]";

  return (
    <div className={className}>
      {OFFICIAL_SOCIAL_LINKS.map((item) => {
        const Icon = item.icon;
        return (
          <a
            key={item.name}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={item.ariaLabel}
            title={`${item.name}: ${item.handle}`}
            className={`transition-all duration-200 transform hover:scale-110 p-1 rounded-full ${baseColors} ${item.hoverText}`}
          >
            <Icon className={iconClassName} />
          </a>
        );
      })}
    </div>
  );
}

/**
 * Rich Card Grid for Contact Page & Footer
 */
export function OfficialSocialCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {OFFICIAL_SOCIAL_LINKS.map((item) => {
        const Icon = item.icon;
        return (
          <a
            key={item.name}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={item.ariaLabel}
            className="group relative flex items-center gap-3.5 p-4 rounded-2xl bg-white border border-[#E8DCC8] shadow-xs hover:shadow-md hover:border-[#C5A059] transition-all duration-200"
          >
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs transition-transform group-hover:scale-105"
              style={{ backgroundColor: item.brandColor }}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#7A5835]">
                  {item.name}
                </span>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 font-semibold px-1.5 py-0.5 rounded-full">
                  Official
                </span>
              </div>
              <p className="text-xs font-bold text-[#2D221E] truncate group-hover:text-[#4A121A] transition">
                {item.handle}
              </p>
            </div>
          </a>
        );
      })}
    </div>
  );
}
