import React from "react";
import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getRegistrationPricingDetails, OFFER_VALIDITY_LABEL } from "@/lib/pricing";
import {
  fetchVerifiedRasterPhoto,
  normalizeSlotToCategory,
} from "@/lib/social-poster";
import { OgHindiText } from "@/lib/og-hindi-text";

export const runtime = "nodejs";

const OG_CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=43200",
};

function CornerFiligree({
  position,
  color = "#FFD700",
}: {
  position: "tl" | "tr" | "bl" | "br";
  color?: string;
}) {
  const stylePos: Record<string, string | number> = {
    position: "absolute",
    display: "flex",
  };
  if (position === "tl") {
    stylePos.top = 16;
    stylePos.left = 16;
  } else if (position === "tr") {
    stylePos.top = 16;
    stylePos.right = 16;
    stylePos.transform = "rotate(90deg)";
  } else if (position === "bl") {
    stylePos.bottom = 16;
    stylePos.left = 16;
    stylePos.transform = "rotate(270deg)";
  } else {
    stylePos.bottom = 16;
    stylePos.right = 16;
    stylePos.transform = "rotate(180deg)";
  }

  return (
    <div style={stylePos}>
      <svg width="56" height="56" viewBox="0 0 72 72">
        <path
          d="M4 60 L4 12 Q4 4 12 4 L60 4"
          stroke={color}
          strokeWidth="3"
          fill="none"
          opacity="0.9"
        />
        <path
          d="M12 44 L12 16 Q12 12 16 12 L44 12"
          stroke="#FEF08A"
          strokeWidth="1.8"
          fill="none"
          opacity="0.75"
        />
        <circle cx="14" cy="14" r="4.5" fill="#FEF08A" opacity="0.95" />
        <circle cx="28" cy="10" r="2.5" fill={color} opacity="0.85" />
        <circle cx="10" cy="28" r="2.5" fill={color} opacity="0.85" />
      </svg>
    </div>
  );
}

function WeddingMandalaWatermark({ color = "#FEF08A" }: { color?: string }) {
  return (
    <div
      style={{
        position: "absolute",
        top: "120px",
        right: "-130px",
        opacity: 0.14,
        display: "flex",
      }}
    >
      <svg width="560" height="560" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="90" stroke={color} strokeWidth="1.8" fill="none" />
        <circle cx="100" cy="100" r="72" stroke={color} strokeWidth="1.2" fill="none" strokeDasharray="4 4" />
        <circle cx="100" cy="100" r="52" stroke={color} strokeWidth="1.8" fill="none" />
        <circle cx="100" cy="100" r="28" stroke={color} strokeWidth="1.2" fill="none" />
        <path
          d="M100 10 L118 82 L190 100 L118 118 L100 190 L82 118 L10 100 L82 82 Z"
          stroke={color}
          strokeWidth="1.4"
          fill="none"
        />
        <path
          d="M36 36 L100 74 L164 36 L126 100 L164 164 L100 126 L36 164 L74 100 Z"
          stroke={color}
          strokeWidth="1.2"
          fill="none"
        />
      </svg>
    </div>
  );
}

function BrandHeader({
  badgeText,
  badgeContent,
  badgeBg,
  badgeBorder,
  badgeTextColor,
  withCheck = false,
}: {
  badgeText?: string;
  badgeContent?: React.ReactNode;
  badgeBg: string;
  badgeBorder: string;
  badgeTextColor: string;
  withCheck?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "2.5px solid rgba(255, 215, 0, 0.55)",
        paddingBottom: "14px",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <span style={{ fontSize: 42, fontWeight: 900, color: "#FFFFFF", letterSpacing: "-0.5px" }}>
            Rishte
          </span>
          <span style={{ fontSize: 42, fontWeight: 900, color: "#FFD700", letterSpacing: "-0.5px" }}>
            Club
          </span>
          <span style={{ fontSize: 16, color: "#FEF08A", fontWeight: 900, marginLeft: 4 }}>
            ™
          </span>
        </div>
        <span
          style={{
            fontSize: 13,
            color: "#FEF08A",
            fontWeight: 800,
            letterSpacing: "2.2px",
            textTransform: "uppercase",
          }}
        >
          Managed by NNVS Matrimony
        </span>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          backgroundColor: badgeBg,
          border: `2.5px solid ${badgeBorder}`,
          borderRadius: "28px",
          padding: "10px 22px",
        }}
      >
        {withCheck && (
          <svg width="20" height="20" viewBox="0 0 24 24" style={{ marginRight: 8, flexShrink: 0 }}>
            <circle cx="12" cy="12" r="11" fill="#10B981" />
            <path
              d="M7 12.5l3 3 7-7"
              stroke="#FFFFFF"
              strokeWidth="2.8"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
        {badgeContent ? (
          badgeContent
        ) : (
          <span style={{ color: badgeTextColor, fontSize: 16, fontWeight: 900, letterSpacing: "0.5px" }}>
            {badgeText}
          </span>
        )}
      </div>
    </div>
  );
}

function WhatsAppFooterBar({
  websitePath,
  helpline1,
  helpline2,
  bgColor = "rgba(127, 29, 29, 0.88)",
}: {
  websitePath: string;
  helpline1: string;
  helpline2: string;
  bgColor?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: bgColor,
        border: "2.5px solid #FFD700",
        borderRadius: "18px",
        padding: "13px 24px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        <svg width="22" height="22" viewBox="0 0 24 24" style={{ marginRight: 10, flexShrink: 0 }}>
          <circle cx="12" cy="12" r="10" stroke="#FFD700" strokeWidth="2.2" fill="none" />
          <ellipse cx="12" cy="12" rx="4.5" ry="10" stroke="#FFD700" strokeWidth="1.6" fill="none" />
          <line x1="2" y1="12" x2="22" y2="12" stroke="#FFD700" strokeWidth="1.6" />
        </svg>
        <span style={{ color: "#FFFFFF", fontSize: 20, fontWeight: 900 }}>
          {websitePath}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            backgroundColor: "#047857",
            border: "1.5px solid #6EE7B7",
            borderRadius: "20px",
            padding: "6px 14px",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" style={{ marginRight: 8, flexShrink: 0 }}>
            <circle cx="12" cy="12" r="11" fill="#25D366" />
            <path
              d="M15.4 13.7c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.91-2.2-.24-.58-.48-.5-.67-.5h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.75-.72 2-1.41.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35z"
              fill="#FFFFFF"
            />
          </svg>
          <span style={{ color: "#FFFFFF", fontSize: 17, fontWeight: 900 }}>
            {helpline1}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            backgroundColor: "#047857",
            border: "1.5px solid #6EE7B7",
            borderRadius: "20px",
            padding: "6px 14px",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" style={{ marginRight: 8, flexShrink: 0 }}>
            <circle cx="12" cy="12" r="11" fill="#25D366" />
            <path
              d="M15.4 13.7c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.91-2.2-.24-.58-.48-.5-.67-.5h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.75-.72 2-1.41.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35z"
              fill="#FFFFFF"
            />
          </svg>
          <span style={{ color: "#FFFFFF", fontSize: 17, fontWeight: 900 }}>
            {helpline2}
          </span>
        </div>
      </div>
    </div>
  );
}

function GreenCheckIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" style={{ marginRight: 12, flexShrink: 0 }}>
      <circle cx="12" cy="12" r="11" fill="#10B981" />
      <path
        d="M7 12.5l3 3 7-7"
        stroke="#FFFFFF"
        strokeWidth="2.8"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CtaArrowIcon({
  bg = "#FFD700",
  arrowColor = "#7F1D1D",
}: {
  bg?: string;
  arrowColor?: string;
}) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" style={{ marginRight: 10, flexShrink: 0 }}>
      <circle cx="12" cy="12" r="11" fill={bg} />
      <path
        d="M8 12h8M13 8.5L16.5 12 13 15.5"
        stroke={arrowColor}
        strokeWidth="2.6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SparkleIcon({
  color = "#7F1D1D",
  size = 20,
}: {
  color?: string;
  size?: number;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <path
        d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z"
        fill={color}
      />
      <circle cx="19" cy="5" r="1.8" fill={color} />
    </svg>
  );
}

function RingEmblemIcon() {
  return (
    <div
      style={{
        width: "40px",
        height: "40px",
        borderRadius: "20px",
        backgroundColor: "#991B1B",
        border: "2px solid #FFFFFF",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24">
        <polygon points="12,2 16,6 12,9 8,6" fill="#FEF08A" stroke="#FFFFFF" strokeWidth="1" />
        <circle cx="12" cy="14.5" r="6" stroke="#FFD700" strokeWidth="2.6" fill="none" />
      </svg>
    </div>
  );
}

function LockBadgeIcon({ color = "#FFD700" }: { color?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" style={{ marginRight: 8, flexShrink: 0 }}>
      <rect x="4" y="10" width="16" height="11" rx="2.5" fill={color} />
      <path
        d="M7.5 10V7.5a4.5 4.5 0 0 1 9 0V10"
        stroke={color}
        strokeWidth="2.4"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="12" cy="15.5" r="1.6" fill="#064E3B" />
    </svg>
  );
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawSlot = (searchParams.get("slot") || "MORNING").toUpperCase();
    const hasCandidateContext = Boolean(searchParams.get("id") || searchParams.get("photo"));

    let category = normalizeSlotToCategory(rawSlot);
    if (
      (rawSlot === "AFTERNOON" || rawSlot === "SPOTLIGHT") &&
      !hasCandidateContext
    ) {
      category = "OFFER_99";
    }

    const now = new Date();
    const dayOfYear = Math.floor(
      (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24
    );

    const femalePricing = getRegistrationPricingDetails("FEMALE", now);
    const malePricing = getRegistrationPricingDetails("MALE", now);
    const isOfferActive = femalePricing.isOfferActive;

    const helpline1 = "+91-9871592002";
    const helpline2 = "+91-7015812359";

    // =========================================================================
    // CATEGORY A: FEMALE BRIDE SPOTLIGHT (WITH VERIFIED REAL PHOTO — NO SILHOUETTE)
    // =========================================================================
    if (category === "PROFILE_SPOTLIGHT") {
      const displayId = searchParams.get("id") || `RC-${String(dayOfYear).padStart(3, "0")}`;
      const displayName = searchParams.get("name") || "Verified Bride";
      const age = searchParams.get("age") || "26";
      const height = searchParams.get("height") || "5'4\"";
      const profession = searchParams.get("profession") || "Working Professional";
      const education = searchParams.get("education") || "Graduate";
      const city = searchParams.get("city") || "Delhi NCR";
      const caste = searchParams.get("caste") || "Hindu";
      const photoUrl = searchParams.get("photo") || "";

      const photoCheck = photoUrl
        ? await fetchVerifiedRasterPhoto(photoUrl)
        : { valid: false, reason: "Missing candidate photo URL for spotlight postcard" };

      if (!photoCheck.valid || !photoCheck.dataUri) {
        return new Response(
          JSON.stringify({
            success: false,
            error:
              photoCheck.reason ||
              "Automated spotlight postcards require a valid, downloadable candidate photo (placeholders/silhouettes are disabled).",
          }),
          {
            status: 422,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-store",
            },
          }
        );
      }

      const verifiedPhotoDataUri = photoCheck.dataUri;

      return new ImageResponse(
        (
          <div
            style={{
              height: "100%",
              width: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              backgroundColor: "#DC143C",
              backgroundImage:
                "linear-gradient(145deg, #DC143C 0%, #B91C1C 48%, #EA580C 100%)",
              padding: "30px 40px",
              boxSizing: "border-box",
              fontFamily: "sans-serif",
              position: "relative",
              border: "14px solid #FFD700",
            }}
          >
            {/* Inner Gold Frame */}
            <div
              style={{
                position: "absolute",
                top: "12px",
                left: "12px",
                right: "12px",
                bottom: "12px",
                border: "2.5px solid rgba(254, 240, 138, 0.72)",
              }}
            />

            <WeddingMandalaWatermark color="#FEF08A" />
            <CornerFiligree position="tl" color="#FFD700" />
            <CornerFiligree position="tr" color="#FFD700" />
            <CornerFiligree position="bl" color="#FFD700" />
            <CornerFiligree position="br" color="#FFD700" />

            <BrandHeader
              badgeContent={
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <SparkleIcon color="#7F1D1D" size={18} />
                  <OgHindiText phrase="badhuProfile" fontSize={17} color="#7F1D1D" />
                  <span style={{ color: "#991B1B", fontSize: 15, fontWeight: 900, letterSpacing: "0.5px" }}>
                    (VERIFIED BRIDE)
                  </span>
                </div>
              }
              badgeBg="#FFD700"
              badgeBorder="#FFFFFF"
              badgeTextColor="#7F1D1D"
              withCheck={true}
            />

            {/* Bright Attention-Grabber Hook Banner */}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: "16px",
                backgroundImage: "linear-gradient(90deg, #FEF08A 0%, #FFD700 50%, #FACC15 100%)",
                border: "3px solid #FFFFFF",
                borderRadius: "18px",
                padding: "11px 22px",
                margin: "8px 0 4px 0",
              }}
            >
              <RingEmblemIcon />
              <OgHindiText phrase="brideHook" fontSize={31} color="#7F1D1D" />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  backgroundColor: "#B91C1C",
                  border: "2px solid #FFFFFF",
                  borderRadius: "24px",
                  padding: "6px 18px",
                }}
              >
                <span style={{ color: "#FFFFFF", fontSize: 20, fontWeight: 900 }}>
                  RishteClub Verified Bride
                </span>
              </div>
            </div>

            {/* Main 2-Column Showcase */}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "stretch",
                justifyContent: "space-between",
                gap: "24px",
                margin: "auto 0",
                height: "620px",
              }}
            >
              {/* Left Column: High-Res Framed Portrait + Prominent Location Badge */}
              <div
                style={{
                  width: "396px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: "rgba(127, 29, 29, 0.78)",
                  border: "2.5px solid #FFD700",
                  borderRadius: "22px",
                  padding: "15px",
                  boxSizing: "border-box",
                }}
              >
                <div
                  style={{
                    width: "364px",
                    height: "518px",
                    borderRadius: "16px",
                    overflow: "hidden",
                    border: "3.5px solid #FFD700",
                    display: "flex",
                    position: "relative",
                    backgroundColor: "#7F1D1D",
                  }}
                >
                  <img
                    src={verifiedPhotoDataUri}
                    alt="Verified Bride Profile"
                    width={364}
                    height={518}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      objectPosition: "center 20%",
                    }}
                  />

                  {/* Top-left floating Bride Tag */}
                  <div
                    style={{
                      position: "absolute",
                      top: "12px",
                      left: "12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      backgroundColor: "#047857",
                      border: "2px solid #FFD700",
                      borderRadius: "20px",
                      padding: "6px 14px",
                    }}
                  >
                    <span style={{ color: "#FEF08A", fontSize: 13, fontWeight: 900 }}>✨</span>
                    <OgHindiText phrase="badhuProfile" fontSize={14} color="#FFFFFF" />
                    <span style={{ color: "#FEF08A", fontSize: 13, fontWeight: 900, letterSpacing: "0.4px" }}>
                      • Verified
                    </span>
                  </div>
                </div>

                {/* Location + ID Ribbon */}
                <div
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: "#991B1B",
                    border: "2px solid #FFD700",
                    borderRadius: "14px",
                    padding: "9px 14px",
                    marginTop: "10px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <span style={{ fontSize: 18, marginRight: 6 }}>📍</span>
                    <span style={{ color: "#FFFFFF", fontSize: 17, fontWeight: 900 }}>
                      {city}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      backgroundColor: "#FFD700",
                      color: "#7F1D1D",
                      padding: "4px 10px",
                      borderRadius: "8px",
                      fontSize: 14,
                      fontWeight: 900,
                    }}
                  >
                    #{displayId}
                  </div>
                </div>
              </div>

              {/* Right Column: High-Contrast Biodata Card */}
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  backgroundColor: "rgba(127, 29, 29, 0.82)",
                  border: "2.5px solid #FFD700",
                  borderRadius: "22px",
                  padding: "20px 24px",
                  boxSizing: "border-box",
                }}
              >
                {/* Header: Name + Direct Verified Tag */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderBottom: "2px solid rgba(255, 215, 0, 0.45)",
                    paddingBottom: "11px",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ color: "#FEF08A", fontSize: 13, fontWeight: 900, letterSpacing: "1.5px" }}>
                      FEATURED BRIDE SPOTLIGHT
                    </span>
                    <span style={{ color: "#FFFFFF", fontSize: 32, fontWeight: 900, marginTop: 2 }}>
                      {displayName}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "7px",
                      backgroundColor: "#047857",
                      border: "2px solid #6EE7B7",
                      borderRadius: "12px",
                      padding: "7px 14px",
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                      <circle cx="12" cy="12" r="11" fill="#10B981" />
                      <path
                        d="M7 12.5l3 3 7-7"
                        stroke="#FFFFFF"
                        strokeWidth="2.8"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span style={{ color: "#FFFFFF", fontSize: 14, fontWeight: 900 }}>
                      VERIFIED
                    </span>
                  </div>
                </div>

                {/* 5 Clean Biodata Cards */}
                <div style={{ display: "flex", flexDirection: "column", gap: "9px", margin: "8px 0" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      backgroundColor: "rgba(255, 255, 255, 0.14)",
                      border: "1.5px solid rgba(254, 240, 138, 0.55)",
                      borderRadius: "12px",
                      padding: "9px 15px",
                    }}
                  >
                    <span style={{ fontSize: 21, marginRight: 13, flexShrink: 0 }}>🎂</span>
                    <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
                      <span style={{ color: "#FEF08A", fontSize: 12, fontWeight: 900, textTransform: "uppercase" }}>
                        Age &amp; Height
                      </span>
                      <span style={{ color: "#FFFFFF", fontSize: 20, fontWeight: 900 }}>
                        {age} Yrs • {height}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      backgroundColor: "rgba(255, 255, 255, 0.14)",
                      border: "1.5px solid rgba(254, 240, 138, 0.55)",
                      borderRadius: "12px",
                      padding: "9px 15px",
                    }}
                  >
                    <span style={{ fontSize: 21, marginRight: 13, flexShrink: 0 }}>🎓</span>
                    <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
                      <span style={{ color: "#FEF08A", fontSize: 12, fontWeight: 900, textTransform: "uppercase" }}>
                        Education
                      </span>
                      <span style={{ color: "#FFFFFF", fontSize: 19, fontWeight: 900 }}>
                        {education}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      backgroundColor: "rgba(255, 255, 255, 0.14)",
                      border: "1.5px solid rgba(254, 240, 138, 0.55)",
                      borderRadius: "12px",
                      padding: "9px 15px",
                    }}
                  >
                    <span style={{ fontSize: 21, marginRight: 13, flexShrink: 0 }}>💼</span>
                    <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
                      <span style={{ color: "#FEF08A", fontSize: 12, fontWeight: 900, textTransform: "uppercase" }}>
                        Profession
                      </span>
                      <span style={{ color: "#FFFFFF", fontSize: 19, fontWeight: 900 }}>
                        {profession}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      backgroundColor: "rgba(255, 255, 255, 0.14)",
                      border: "1.5px solid rgba(254, 240, 138, 0.55)",
                      borderRadius: "12px",
                      padding: "9px 15px",
                    }}
                  >
                    <span style={{ fontSize: 21, marginRight: 13, flexShrink: 0 }}>🏛️</span>
                    <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
                      <span style={{ color: "#FEF08A", fontSize: 12, fontWeight: 900, textTransform: "uppercase" }}>
                        Community
                      </span>
                      <span style={{ color: "#FFFFFF", fontSize: 19, fontWeight: 900 }}>
                        {caste}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      backgroundColor: "rgba(255, 255, 255, 0.14)",
                      border: "1.5px solid rgba(254, 240, 138, 0.55)",
                      borderRadius: "12px",
                      padding: "9px 15px",
                    }}
                  >
                    <span style={{ fontSize: 21, marginRight: 13, flexShrink: 0 }}>📍</span>
                    <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
                      <span style={{ color: "#FEF08A", fontSize: 12, fontWeight: 900, textTransform: "uppercase" }}>
                        City / Location
                      </span>
                      <span style={{ color: "#FFFFFF", fontSize: 19, fontWeight: 900 }}>
                        {city}
                      </span>
                    </div>
                  </div>
                </div>

                {/* High-Contrast CTA Callout */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    backgroundColor: "#047857",
                    border: "2.5px solid #FFD700",
                    borderRadius: "14px",
                    padding: "10px 16px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <LockBadgeIcon color="#FFD700" />
                    <span style={{ color: "#FFFFFF", fontSize: 15, fontWeight: 900 }}>
                      Direct Family Connect • Privacy Protected
                    </span>
                  </div>
                  <span style={{ color: "#FEF08A", fontSize: 14, fontWeight: 900, marginTop: 3 }}>
                    Visit rishteclub.com/register &amp; search ID #{displayId}
                  </span>
                </div>
              </div>
            </div>

            <WhatsAppFooterBar
              websitePath="rishteclub.com/register"
              helpline1={helpline1}
              helpline2={helpline2}
              bgColor="rgba(127, 29, 29, 0.92)"
            />
          </div>
        ),
        { width: 1080, height: 1080, headers: OG_CACHE_HEADERS }
      );
    }

    // =========================================================================
    // CATEGORY C: FREE KUNDALI MILAN (RICH SAFFRON / HALDI + ROYAL CRIMSON + GOLD)
    // =========================================================================
    if (category === "KUNDLI_MILAN") {
      return new ImageResponse(
        (
          <div
            style={{
              height: "100%",
              width: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              backgroundColor: "#B91C1C",
              backgroundImage:
                "linear-gradient(140deg, #B91C1C 0%, #EA580C 48%, #D97706 100%)",
              padding: "30px 40px",
              boxSizing: "border-box",
              fontFamily: "sans-serif",
              position: "relative",
              border: "14px solid #FFD700",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "12px",
                left: "12px",
                right: "12px",
                bottom: "12px",
                border: "2.5px solid rgba(254, 240, 138, 0.72)",
              }}
            />

            <WeddingMandalaWatermark color="#FEF08A" />
            <CornerFiligree position="tl" color="#FFD700" />
            <CornerFiligree position="tr" color="#FFD700" />
            <CornerFiligree position="bl" color="#FFD700" />
            <CornerFiligree position="br" color="#FFD700" />

            <BrandHeader
              badgeContent={
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <SparkleIcon color="#7F1D1D" size={18} />
                  <span style={{ color: "#7F1D1D", fontSize: 16, fontWeight: 900, letterSpacing: "0.5px" }}>
                    100% FREE VEDIC ASTROLOGY
                  </span>
                </div>
              }
              badgeBg="#FFD700"
              badgeBorder="#FFFFFF"
              badgeTextColor="#7F1D1D"
            />

            {/* Massive Hindi Hook Banner */}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: "14px",
                backgroundImage: "linear-gradient(90deg, #FEF08A 0%, #FFD700 50%, #FACC15 100%)",
                border: "3px solid #FFFFFF",
                borderRadius: "18px",
                padding: "13px 24px",
                margin: "8px 0 4px 0",
              }}
            >
              <SparkleIcon color="#991B1B" size={34} />
              <OgHindiText phrase="kundaliHook" fontSize={39} color="#991B1B" />
            </div>

            {/* Main Hero Card */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                backgroundColor: "rgba(127, 29, 29, 0.86)",
                border: "2.5px solid #FFD700",
                borderRadius: "24px",
                padding: "30px 32px",
                margin: "auto 0",
              }}
            >
              {/* Top Hero Split: Headline + Sacred Vedic Kundali Emblem */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "20px",
                  gap: "24px",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      backgroundColor: "#047857",
                      border: "1.5px solid #6EE7B7",
                      color: "#FFFFFF",
                      padding: "6px 18px",
                      borderRadius: "20px",
                      fontSize: 15,
                      fontWeight: 900,
                      letterSpacing: "1px",
                      alignSelf: "flex-start",
                      marginBottom: "12px",
                    }}
                  >
                    36 GUNA ASHTAKOOT &amp; MANGLIK CHECK
                  </div>
                  <span style={{ color: "#FFFFFF", fontSize: 38, fontWeight: 900, lineHeight: 1.15 }}>
                    Free &amp; Accurate Kundali Matching
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "10px" }}>
                    <OgHindiText phrase="kundaliSubhead1" fontSize={21} color="#FFD700" />
                    <OgHindiText phrase="kundaliSubhead2" fontSize={19} color="#FEF08A" />
                  </div>
                </div>

                {/* North-Indian Vedic Diamond Kundali Emblem */}
                <div
                  style={{
                    width: "168px",
                    height: "168px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundImage: "linear-gradient(145deg, #F59E0B 0%, #DC143C 100%)",
                    border: "3.5px solid #FFD700",
                    borderRadius: "24px",
                    flexShrink: 0,
                    position: "relative",
                  }}
                >
                  <svg width="132" height="132" viewBox="0 0 120 120">
                    <rect x="8" y="8" width="104" height="104" stroke="#FEF08A" strokeWidth="2.8" fill="none" />
                    <line x1="8" y1="8" x2="112" y2="112" stroke="#FFD700" strokeWidth="2" />
                    <line x1="112" y1="8" x2="8" y2="112" stroke="#FFD700" strokeWidth="2" />
                    <polygon points="60,8 112,60 60,112 8,60" stroke="#FFFFFF" strokeWidth="2.2" fill="none" />
                  </svg>
                  <div
                    style={{
                      position: "absolute",
                      top: "58px",
                      left: "58px",
                      width: "52px",
                      height: "52px",
                      borderRadius: "26px",
                      backgroundColor: "#FFD700",
                      border: "2.5px solid #FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span style={{ color: "#7F1D1D", fontSize: 22, fontWeight: 900 }}>
                      36
                    </span>
                  </div>
                </div>
              </div>

              {/* 2x2 Feature Cards Grid */}
              <div style={{ display: "flex", flexDirection: "column", gap: "18px", marginBottom: "22px" }}>
                <div style={{ display: "flex", flexDirection: "row", gap: "16px" }}>
                  <div
                    style={{
                      width: "49%",
                      display: "flex",
                      alignItems: "center",
                      backgroundColor: "rgba(255, 255, 255, 0.14)",
                      border: "1.5px solid #FDE047",
                      borderRadius: "16px",
                      padding: "16px 18px",
                    }}
                  >
                    <GreenCheckIcon />
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ color: "#FEF08A", fontSize: 19, fontWeight: 900 }}>
                        36 Guna Ashtakoot Score
                      </span>
                      <span style={{ color: "#FFFFFF", fontSize: 15, fontWeight: 700, marginTop: 3 }}>
                        Varna, Vashya, Nadi &amp; Bhakoot insights
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      width: "49%",
                      display: "flex",
                      alignItems: "center",
                      backgroundColor: "rgba(255, 255, 255, 0.14)",
                      border: "1.5px solid #FDE047",
                      borderRadius: "16px",
                      padding: "16px 18px",
                    }}
                  >
                    <GreenCheckIcon />
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ color: "#FEF08A", fontSize: 19, fontWeight: 900 }}>
                        Manglik Dosha Verification
                      </span>
                      <span style={{ color: "#FFFFFF", fontSize: 15, fontWeight: 700, marginTop: 3 }}>
                        Shubh Sanyog &amp; Vedic remedies
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "row", gap: "16px" }}>
                  <div
                    style={{
                      width: "49%",
                      display: "flex",
                      alignItems: "center",
                      backgroundColor: "rgba(255, 255, 255, 0.14)",
                      border: "1.5px solid #FDE047",
                      borderRadius: "16px",
                      padding: "16px 18px",
                    }}
                  >
                    <GreenCheckIcon />
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ color: "#FEF08A", fontSize: 19, fontWeight: 900 }}>
                        Hindi &amp; English Reports
                      </span>
                      <span style={{ color: "#FFFFFF", fontSize: 15, fontWeight: 700, marginTop: 3 }}>
                        Clear interpretation for families
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      width: "49%",
                      display: "flex",
                      alignItems: "center",
                      backgroundColor: "rgba(255, 255, 255, 0.14)",
                      border: "1.5px solid #FDE047",
                      borderRadius: "16px",
                      padding: "16px 18px",
                    }}
                  >
                    <GreenCheckIcon />
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ color: "#FEF08A", fontSize: 19, fontWeight: 900 }}>
                        Instant Free PDF Download
                      </span>
                      <span style={{ color: "#FFFFFF", fontSize: 15, fontWeight: 700, marginTop: 3 }}>
                        100% Free — No App Install Needed
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bold Emerald & Gold CTA Box */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: "#047857",
                  border: "2.5px solid #FFD700",
                  borderRadius: "16px",
                  padding: "16px 24px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  <CtaArrowIcon bg="#FFD700" arrowColor="#064E3B" />
                  <OgHindiText phrase="kundaliCta" fontSize={21} color="#FFFFFF" />
                </div>
                <span style={{ color: "#FEF08A", fontSize: 22, fontWeight: 900 }}>
                  rishteclub.com/kundali
                </span>
              </div>
            </div>

            <WhatsAppFooterBar
              websitePath="rishteclub.com/kundali"
              helpline1={helpline1}
              helpline2={helpline2}
              bgColor="rgba(127, 29, 29, 0.92)"
            />
          </div>
        ),
        { width: 1080, height: 1080, headers: OG_CACHE_HEADERS }
      );
    }

    // =========================================================================
    // CATEGORY D: VERIFIED PROFILES & TRUST (VIVID EMERALD + ROYAL CRIMSON + GOLD)
    // =========================================================================
    if (category === "TRUST_VERIFIED") {
      return new ImageResponse(
        (
          <div
            style={{
              height: "100%",
              width: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              backgroundColor: "#047857",
              backgroundImage:
                "linear-gradient(145deg, #047857 0%, #059669 44%, #B91C1C 100%)",
              padding: "30px 40px",
              boxSizing: "border-box",
              fontFamily: "sans-serif",
              position: "relative",
              border: "14px solid #FFD700",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "12px",
                left: "12px",
                right: "12px",
                bottom: "12px",
                border: "2.5px solid rgba(254, 240, 138, 0.72)",
              }}
            />

            <WeddingMandalaWatermark color="#FEF08A" />
            <CornerFiligree position="tl" color="#FFD700" />
            <CornerFiligree position="tr" color="#FFD700" />
            <CornerFiligree position="bl" color="#FFD700" />
            <CornerFiligree position="br" color="#FFD700" />

            <BrandHeader
              badgeText="🛡️ 100% MANUALLY VERIFIED"
              badgeBg="#FFD700"
              badgeBorder="#FFFFFF"
              badgeTextColor="#064E3B"
              withCheck={true}
            />

            {/* Massive Trust Hook Banner */}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                backgroundImage: "linear-gradient(90deg, #FEF08A 0%, #FFD700 50%, #FACC15 100%)",
                border: "3px solid #FFFFFF",
                borderRadius: "18px",
                padding: "13px 20px",
                margin: "8px 0 4px 0",
              }}
            >
              <span style={{ color: "#7F1D1D", fontSize: 29, fontWeight: 900, letterSpacing: "-0.3px" }}>
                🛡️ 100% Manually Verified Rishte | No Fake Profiles
              </span>
            </div>

            {/* Main Content Card */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                backgroundColor: "rgba(6, 78, 59, 0.84)",
                border: "2.5px solid #FFD700",
                borderRadius: "24px",
                padding: "30px 32px",
                margin: "auto 0",
              }}
            >
              {/* Top Hero with Gold Shield Icon */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "24px",
                  gap: "24px",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      backgroundColor: "#DC143C",
                      border: "1.5px solid #FFD700",
                      borderRadius: "20px",
                      padding: "6px 16px",
                      alignSelf: "flex-start",
                      marginBottom: "10px",
                    }}
                  >
                    <span style={{ color: "#FFFFFF", fontSize: 15, fontWeight: 900 }}>
                      DIRECT FAMILY CONNECT • ZERO BROKERAGE
                    </span>
                  </div>
                  <span style={{ color: "#FFFFFF", fontSize: 38, fontWeight: 900, lineHeight: 1.15 }}>
                    Trusted Indian Matchmaking
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "8px" }}>
                    <OgHindiText phrase="trustSubhead1" fontSize={21} color="#FFD700" />
                    <OgHindiText phrase="trustSubhead2" fontSize={21} color="#FEF08A" />
                  </div>
                </div>

                {/* Golden Trust Shield Badge */}
                <div
                  style={{
                    width: "144px",
                    height: "144px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundImage: "linear-gradient(145deg, #FEF08A 0%, #FFD700 100%)",
                    border: "3.5px solid #FFFFFF",
                    borderRadius: "72px",
                    flexShrink: 0,
                  }}
                >
                  <svg width="86" height="86" viewBox="0 0 24 24">
                    <path
                      d="M12 2L4 5.5v6c0 5.25 3.4 10.1 8 11.5 4.6-1.4 8-6.25 8-11.5v-6L12 2z"
                      fill="#047857"
                      stroke="#7F1D1D"
                      strokeWidth="1.4"
                    />
                    <path
                      d="M8.5 12.2l2.4 2.4 4.8-5.1"
                      stroke="#FFFFFF"
                      strokeWidth="2.5"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>

              {/* 4 Trust Pillars */}
              <div style={{ display: "flex", flexDirection: "column", gap: "18px", marginBottom: "22px" }}>
                <div style={{ display: "flex", flexDirection: "row", gap: "16px" }}>
                  <div
                    style={{
                      width: "49%",
                      display: "flex",
                      alignItems: "center",
                      backgroundColor: "rgba(255, 255, 255, 0.14)",
                      border: "1.5px solid #FDE047",
                      borderRadius: "16px",
                      padding: "17px 18px",
                    }}
                  >
                    <GreenCheckIcon />
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ color: "#FFFFFF", fontSize: 19, fontWeight: 900 }}>
                        Human Profile Screening
                      </span>
                      <span style={{ color: "#FEF08A", fontSize: 15, fontWeight: 800, marginTop: 3 }}>
                        Every biodata manually checked before approval
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      width: "49%",
                      display: "flex",
                      alignItems: "center",
                      backgroundColor: "rgba(255, 255, 255, 0.14)",
                      border: "1.5px solid #FDE047",
                      borderRadius: "16px",
                      padding: "17px 18px",
                    }}
                  >
                    <GreenCheckIcon />
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ color: "#FFFFFF", fontSize: 19, fontWeight: 900 }}>
                        Direct Parents Connect
                      </span>
                      <span style={{ color: "#FEF08A", fontSize: 15, fontWeight: 800, marginTop: 3 }}>
                        No agents, no middlemen commission
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "row", gap: "16px" }}>
                  <div
                    style={{
                      width: "49%",
                      display: "flex",
                      alignItems: "center",
                      backgroundColor: "rgba(255, 255, 255, 0.14)",
                      border: "1.5px solid #FDE047",
                      borderRadius: "16px",
                      padding: "17px 18px",
                    }}
                  >
                    <GreenCheckIcon />
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ color: "#FFFFFF", fontSize: 19, fontWeight: 900 }}>
                        Strict Photo &amp; Data Privacy
                      </span>
                      <span style={{ color: "#FEF08A", fontSize: 15, fontWeight: 800, marginTop: 3 }}>
                        Contacts protected &amp; member-verified only
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      width: "49%",
                      display: "flex",
                      alignItems: "center",
                      backgroundColor: "rgba(255, 255, 255, 0.14)",
                      border: "1.5px solid #FDE047",
                      borderRadius: "16px",
                      padding: "17px 18px",
                    }}
                  >
                    <GreenCheckIcon />
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ color: "#FFFFFF", fontSize: 19, fontWeight: 900 }}>
                        Respected Communities
                      </span>
                      <span style={{ color: "#FEF08A", fontSize: 15, fontWeight: 800, marginTop: 3 }}>
                        Agarwal • Baniya • Brahmin • Punjabi • Khatri • Jain
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bold Crimson & Gold CTA */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: "#DC143C",
                  border: "2.5px solid #FFD700",
                  borderRadius: "16px",
                  padding: "16px 24px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  <CtaArrowIcon bg="#FFD700" arrowColor="#7F1D1D" />
                  <OgHindiText phrase="trustCta" fontSize={21} color="#FFFFFF" />
                </div>
                <span style={{ color: "#FEF08A", fontSize: 21, fontWeight: 900 }}>
                  rishteclub.com/register
                </span>
              </div>
            </div>

            <WhatsAppFooterBar
              websitePath="rishteclub.com/register"
              helpline1={helpline1}
              helpline2={helpline2}
              bgColor="rgba(6, 78, 59, 0.92)"
            />
          </div>
        ),
        { width: 1080, height: 1080, headers: OG_CACHE_HEADERS }
      );
    }

    // =========================================================================
    // CATEGORY B: ₹99 LAUNCH OFFER (BRIGHT ROYAL CRIMSON RED + SAFFRON + FESTIVE GOLD)
    // =========================================================================
    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            backgroundColor: "#DC143C",
            backgroundImage:
              "linear-gradient(135deg, #DC143C 0%, #EA580C 50%, #B91C1C 100%)",
            padding: "30px 40px",
            boxSizing: "border-box",
            fontFamily: "sans-serif",
            position: "relative",
            border: "14px solid #FFD700",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "12px",
              left: "12px",
              right: "12px",
              bottom: "12px",
              border: "2.5px solid rgba(254, 240, 138, 0.72)",
            }}
          />

          <WeddingMandalaWatermark color="#FEF08A" />
          <CornerFiligree position="tl" color="#FFD700" />
          <CornerFiligree position="tr" color="#FFD700" />
          <CornerFiligree position="bl" color="#FFD700" />
          <CornerFiligree position="br" color="#FFD700" />

          <BrandHeader
            badgeContent={
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <SparkleIcon color="#7F1D1D" size={18} />
                <span style={{ color: "#7F1D1D", fontSize: 16, fontWeight: 900, letterSpacing: "0.5px" }}>
                  {isOfferActive ? "LIMITED-TIME LAUNCH OFFER" : "LIFETIME MEMBERSHIP"}
                </span>
              </div>
            }
            badgeBg="#FFD700"
            badgeBorder="#FFFFFF"
            badgeTextColor="#7F1D1D"
          />

          {/* Massive Scroll-Stopping Slogan Banner */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              backgroundImage: "linear-gradient(90deg, #FEF08A 0%, #FFD700 50%, #FACC15 100%)",
              border: "3px solid #FFFFFF",
              borderRadius: "20px",
              padding: "11px 22px",
              margin: "6px 0 4px 0",
            }}
          >
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: 32 }}>🔥</span>
              <OgHindiText
                phrase={isOfferActive ? "offerHook" : "regularOfferHook"}
                fontSize={36}
                color="#7F1D1D"
              />
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: "#047857",
                border: "1.5px solid #FFFFFF",
                borderRadius: "20px",
                padding: "4px 18px",
                marginTop: "6px",
              }}
            >
              <span style={{ color: "#FFFFFF", fontSize: 19, fontWeight: 900, letterSpacing: "0.3px" }}>
                {isOfferActive
                  ? `Rishte Hi Rishte! Direct Contacts @ ₹${femalePricing.baseFee}`
                  : "Rishte Hi Rishte! Direct Verified Family Contacts"}
              </span>
            </div>
          </div>

          {/* Main Promotion Stage */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              backgroundColor: "rgba(127, 29, 29, 0.84)",
              border: "2.5px solid #FFD700",
              borderRadius: "24px",
              padding: "26px 30px",
              margin: "auto 0",
            }}
          >
            {isOfferActive ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "18px",
                  gap: "18px",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                  <span style={{ color: "#FEF08A", fontSize: 15, fontWeight: 900, letterSpacing: "1px" }}>
                    🔥 {OFFER_VALIDITY_LABEL}
                  </span>
                  <span style={{ color: "#FFFFFF", fontSize: 33, fontWeight: 900, lineHeight: 1.15, marginTop: 4 }}>
                    Get Direct Verified Match Contacts
                  </span>
                  <div style={{ display: "flex", alignItems: "center", marginTop: "8px" }}>
                    <OgHindiText phrase="offerSubhead" fontSize={18} color="#FEF08A" />
                  </div>
                </div>

                {/* Big Golden ₹99 Focal Badge */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundImage: "linear-gradient(155deg, #FEF08A 0%, #FFD700 60%, #F59E0B 100%)",
                    border: "3.5px solid #FFFFFF",
                    borderRadius: "20px",
                    padding: "13px 24px",
                    flexShrink: 0,
                  }}
                >
                  <span style={{ color: "#7F1D1D", fontSize: 13, fontWeight: 900, letterSpacing: "1px" }}>
                    AT JUST
                  </span>
                  <span style={{ color: "#991B1B", fontSize: 54, fontWeight: 900, lineHeight: 1 }}>
                    ₹{femalePricing.baseFee}
                  </span>
                  <span style={{ color: "#7F1D1D", fontSize: 14, fontWeight: 900, marginTop: 2 }}>
                    + 18% GST (₹{Math.round(femalePricing.totalAmount)})
                  </span>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", textAlign: "center", alignItems: "center", marginBottom: "16px" }}>
                <span style={{ color: "#FFFFFF", fontSize: 34, fontWeight: 900 }}>
                  Lifetime Matrimonial Registration
                </span>
                <span style={{ color: "#FEF08A", fontSize: 18, fontWeight: 800, marginTop: 4 }}>
                  100% Manually Verified Profiles • Direct Family Contact
                </span>
              </div>
            )}

            {/* Kanya vs Var Cards */}
            <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", marginBottom: "18px" }}>
              {/* Kanya */}
              <div
                style={{
                  width: "49%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  backgroundColor: "rgba(225, 29, 72, 0.85)",
                  border: "2.5px solid #FEF08A",
                  borderRadius: "18px",
                  padding: "13px",
                  textAlign: "center",
                }}
              >
                <span style={{ color: "#FEF08A", fontSize: 16, fontWeight: 900, letterSpacing: "1px" }}>
                  👰 KANYA (BRIDE)
                </span>
                {isOfferActive && (
                  <span style={{ color: "#FFE4E6", fontSize: 15, fontWeight: 700, textDecoration: "line-through", marginTop: 3 }}>
                    Regular ₹{femalePricing.regularBaseFee} + GST
                  </span>
                )}
                <span style={{ color: "#FFFFFF", fontSize: 34, fontWeight: 900, margin: "2px 0" }}>
                  ₹{femalePricing.baseFee} + GST
                </span>
                <span style={{ color: "#FFD700", fontSize: 14, fontWeight: 900 }}>
                  Total ₹{femalePricing.totalAmount.toFixed(2)} • One-Time
                </span>
              </div>

              {/* Var */}
              <div
                style={{
                  width: "49%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  backgroundColor: "rgba(4, 120, 87, 0.90)",
                  border: "2.5px solid #6EE7B7",
                  borderRadius: "18px",
                  padding: "13px",
                  textAlign: "center",
                }}
              >
                <span style={{ color: "#FEF08A", fontSize: 16, fontWeight: 900, letterSpacing: "1px" }}>
                  🤵 VAR (GROOM)
                </span>
                {isOfferActive && (
                  <span style={{ color: "#D1FAE5", fontSize: 15, fontWeight: 700, textDecoration: "line-through", marginTop: 3 }}>
                    Regular ₹{malePricing.regularBaseFee} + GST
                  </span>
                )}
                <span style={{ color: "#FFFFFF", fontSize: 34, fontWeight: 900, margin: "2px 0" }}>
                  ₹{malePricing.baseFee} + GST
                </span>
                <span style={{ color: "#FFD700", fontSize: 14, fontWeight: 900 }}>
                  Total ₹{malePricing.totalAmount.toFixed(2)} • One-Time
                </span>
              </div>
            </div>

            {/* 3 High-Contrast Benefits */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "18px" }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <GreenCheckIcon />
                <span style={{ color: "#FFFFFF", fontSize: 18, fontWeight: 800 }}>
                  Direct Parents Contact Numbers — Zero Middlemen Brokerage
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center" }}>
                <GreenCheckIcon />
                <span style={{ color: "#FFFFFF", fontSize: 18, fontWeight: 800 }}>
                  100% Mobile &amp; Family Screened Matches Across Communities
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center" }}>
                <GreenCheckIcon />
                <span style={{ color: "#FFFFFF", fontSize: 18, fontWeight: 800 }}>
                  No Monthly Subscriptions — Free 36 Guna Kundali Matching Included
                </span>
              </div>
            </div>

            {/* CTA Banner */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "#047857",
                border: "2.5px solid #FFD700",
                borderRadius: "16px",
                padding: "15px 24px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                <CtaArrowIcon bg="#FFD700" arrowColor="#064E3B" />
                <OgHindiText phrase="offerCta" fontSize={20} color="#FFFFFF" />
              </div>
              <span style={{ color: "#FEF08A", fontSize: 21, fontWeight: 900 }}>
                www.rishteclub.com
              </span>
            </div>
          </div>

          <WhatsAppFooterBar
            websitePath="rishteclub.com"
            helpline1={helpline1}
            helpline2={helpline2}
            bgColor="rgba(127, 29, 29, 0.92)"
          />
        </div>
      ),
      { width: 1080, height: 1080, headers: OG_CACHE_HEADERS }
    );
  } catch (err: any) {
    console.error("OG Image generation failed:", err);
    return new Response(`OG Image error: ${err.message}`, { status: 500 });
  }
}
