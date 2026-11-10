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
}: {
  position: "tl" | "tr" | "bl" | "br";
}) {
  const stylePos: Record<string, string | number> = {
    position: "absolute",
    display: "flex",
  };
  if (position === "tl") {
    stylePos.top = 18;
    stylePos.left = 18;
  } else if (position === "tr") {
    stylePos.top = 18;
    stylePos.right = 18;
    stylePos.transform = "rotate(90deg)";
  } else if (position === "bl") {
    stylePos.bottom = 18;
    stylePos.left = 18;
    stylePos.transform = "rotate(270deg)";
  } else {
    stylePos.bottom = 18;
    stylePos.right = 18;
    stylePos.transform = "rotate(180deg)";
  }

  return (
    <div style={stylePos}>
      <svg width="56" height="56" viewBox="0 0 72 72">
        <path
          d="M4 60 L4 12 Q4 4 12 4 L60 4"
          stroke="#E6C67C"
          strokeWidth="2.5"
          fill="none"
          opacity="0.7"
        />
        <path
          d="M12 44 L12 16 Q12 12 16 12 L44 12"
          stroke="#C5A059"
          strokeWidth="1.5"
          fill="none"
          opacity="0.5"
        />
        <circle cx="14" cy="14" r="4" fill="#F2D28B" opacity="0.85" />
        <circle cx="28" cy="10" r="2.2" fill="#E6C67C" opacity="0.65" />
        <circle cx="10" cy="28" r="2.2" fill="#E6C67C" opacity="0.65" />
      </svg>
    </div>
  );
}

function WeddingMandalaWatermark() {
  return (
    <div
      style={{
        position: "absolute",
        top: "140px",
        right: "-140px",
        opacity: 0.08,
        display: "flex",
        pointerEvents: "none",
      }}
    >
      <svg width="560" height="560" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="90" stroke="#F2D28B" strokeWidth="1.5" fill="none" />
        <circle cx="100" cy="100" r="72" stroke="#F2D28B" strokeWidth="1" fill="none" strokeDasharray="4 4" />
        <circle cx="100" cy="100" r="52" stroke="#F2D28B" strokeWidth="1.5" fill="none" />
        <circle cx="100" cy="100" r="28" stroke="#F2D28B" strokeWidth="1" fill="none" />
        <path
          d="M100 10 L118 82 L190 100 L118 118 L100 190 L82 118 L10 100 L82 82 Z"
          stroke="#F2D28B"
          strokeWidth="1.2"
          fill="none"
        />
        <path
          d="M36 36 L100 74 L164 36 L126 100 L164 164 L100 126 L36 164 L74 100 Z"
          stroke="#F2D28B"
          strokeWidth="1"
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
        borderBottom: "2px solid rgba(230, 198, 124, 0.35)",
        paddingBottom: "18px",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <span style={{ fontSize: 42, fontWeight: 900, color: "#FFFFFF", letterSpacing: "-0.5px" }}>
            Rishte
          </span>
          <span style={{ fontSize: 42, fontWeight: 900, color: "#F2D28B", letterSpacing: "-0.5px" }}>
            Club
          </span>
          <span style={{ fontSize: 16, color: "#F2D28B", fontWeight: 700, marginLeft: 4 }}>
            ™
          </span>
        </div>
        <span
          style={{
            fontSize: 13,
            color: "#E6C67C",
            fontWeight: 700,
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
          border: `2px solid ${badgeBorder}`,
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
              strokeWidth="2.6"
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
}: {
  websitePath: string;
  helpline1: string;
  helpline2: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "rgba(9, 17, 40, 0.72)",
        border: "2px solid rgba(230, 198, 124, 0.55)",
        borderRadius: "18px",
        padding: "14px 26px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        <svg width="22" height="22" viewBox="0 0 24 24" style={{ marginRight: 10, flexShrink: 0 }}>
          <circle cx="12" cy="12" r="10" stroke="#F2D28B" strokeWidth="2" fill="none" />
          <ellipse cx="12" cy="12" rx="4.5" ry="10" stroke="#F2D28B" strokeWidth="1.5" fill="none" />
          <line x1="2" y1="12" x2="22" y2="12" stroke="#F2D28B" strokeWidth="1.5" />
        </svg>
        <span style={{ color: "#FFFFFF", fontSize: 20, fontWeight: 800 }}>
          {websitePath}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            backgroundColor: "rgba(37, 211, 102, 0.14)",
            border: "1px solid rgba(37, 211, 102, 0.5)",
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
          <span style={{ color: "#F5D78E", fontSize: 17, fontWeight: 800 }}>
            {helpline1}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            backgroundColor: "rgba(37, 211, 102, 0.14)",
            border: "1px solid rgba(37, 211, 102, 0.5)",
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
          <span style={{ color: "#F5D78E", fontSize: 17, fontWeight: 800 }}>
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
        strokeWidth="2.6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CtaArrowIcon({
  bg = "#3D0914",
  arrowColor = "#F2D28B",
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
        strokeWidth="2.4"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
              backgroundColor: "#3D0914",
              backgroundImage:
                "linear-gradient(145deg, #0D1B3E 0%, #4E0D1B 38%, #360711 72%, #190307 100%)",
              padding: "46px 48px",
              boxSizing: "border-box",
              fontFamily: "sans-serif",
              position: "relative",
              border: "16px solid #D4AF63",
            }}
          >
            {/* Inner Gold Frame */}
            <div
              style={{
                position: "absolute",
                top: "14px",
                left: "14px",
                right: "14px",
                bottom: "14px",
                border: "2px solid rgba(242, 210, 139, 0.45)",
                pointerEvents: "none",
              }}
            />

            <WeddingMandalaWatermark />
            <CornerFiligree position="tl" />
            <CornerFiligree position="tr" />
            <CornerFiligree position="bl" />
            <CornerFiligree position="br" />

            <BrandHeader
              badgeContent={
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ color: "#FFFFFF", fontSize: 16, fontWeight: 900 }}>✨</span>
                  <OgHindiText phrase="badhuProfile" fontSize={17} color="#FFFFFF" />
                  <span style={{ color: "#F5D78E", fontSize: 16, fontWeight: 900, letterSpacing: "0.5px" }}>
                    (VERIFIED BRIDE)
                  </span>
                </div>
              }
              badgeBg="rgba(190, 18, 60, 0.85)"
              badgeBorder="#F2D28B"
              badgeTextColor="#FFFFFF"
              withCheck={true}
            />

            {/* Main 2-Column Showcase */}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "stretch",
                justifyContent: "space-between",
                gap: "28px",
                margin: "auto 0",
                height: "696px",
              }}
            >
              {/* Left Column: High-Res Framed Portrait + Prominent Location Badge */}
              <div
                style={{
                  width: "418px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: "rgba(11, 22, 51, 0.55)",
                  border: "2px solid rgba(242, 210, 139, 0.6)",
                  borderRadius: "24px",
                  padding: "18px",
                  boxSizing: "border-box",
                }}
              >
                <div
                  style={{
                    width: "380px",
                    height: "548px",
                    borderRadius: "18px",
                    overflow: "hidden",
                    border: "3px solid #F2D28B",
                    display: "flex",
                    position: "relative",
                    backgroundColor: "#140407",
                  }}
                >
                  <img
                    src={verifiedPhotoDataUri}
                    alt="Verified Bride Profile"
                    width={380}
                    height={548}
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
                      top: "14px",
                      left: "14px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      backgroundColor: "rgba(190, 18, 60, 0.92)",
                      border: "1.5px solid #F2D28B",
                      borderRadius: "20px",
                      padding: "6px 14px",
                    }}
                  >
                    <span style={{ color: "#FFFFFF", fontSize: 13, fontWeight: 900 }}>✨</span>
                    <OgHindiText phrase="badhuProfile" fontSize={14} color="#FFFFFF" />
                    <span style={{ color: "#F5D78E", fontSize: 13, fontWeight: 900, letterSpacing: "0.4px" }}>
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
                    backgroundColor: "#0F1E3D",
                    border: "2px solid #F2D28B",
                    borderRadius: "14px",
                    padding: "11px 16px",
                    marginTop: "12px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <span style={{ fontSize: 18, marginRight: 6 }}>📍</span>
                    <span style={{ color: "#FFFFFF", fontSize: 17, fontWeight: 800 }}>
                      {city}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      backgroundColor: "#F2D28B",
                      color: "#3D0914",
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
                  backgroundColor: "rgba(18, 4, 9, 0.72)",
                  border: "2px solid rgba(242, 210, 139, 0.55)",
                  borderRadius: "24px",
                  padding: "24px 28px",
                  boxSizing: "border-box",
                }}
              >
                {/* Header: Name + Direct Verified Tag */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderBottom: "1.5px solid rgba(242, 210, 139, 0.35)",
                    paddingBottom: "14px",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ color: "#F2D28B", fontSize: 13, fontWeight: 800, letterSpacing: "1.5px" }}>
                      FEATURED BRIDE SPOTLIGHT
                    </span>
                    <span style={{ color: "#FFFFFF", fontSize: 34, fontWeight: 900, marginTop: 2 }}>
                      {displayName}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "7px",
                      backgroundColor: "rgba(16, 185, 129, 0.2)",
                      border: "1.5px solid #10B981",
                      borderRadius: "12px",
                      padding: "8px 14px",
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
                    <span style={{ color: "#6EE7B7", fontSize: 14, fontWeight: 900 }}>
                      VERIFIED
                    </span>
                  </div>
                </div>

                {/* 5 Clean Biodata Cards */}
                <div style={{ display: "flex", flexDirection: "column", gap: "11px", margin: "10px 0" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      backgroundColor: "rgba(255, 255, 255, 0.09)",
                      border: "1px solid rgba(242, 210, 139, 0.3)",
                      borderRadius: "13px",
                      padding: "10px 16px",
                    }}
                  >
                    <span style={{ fontSize: 22, marginRight: 14, flexShrink: 0 }}>🎂</span>
                    <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
                      <span style={{ color: "#F2D28B", fontSize: 12, fontWeight: 800, textTransform: "uppercase" }}>
                        Age &amp; Height
                      </span>
                      <span style={{ color: "#FFFFFF", fontSize: 21, fontWeight: 800 }}>
                        {age} Yrs • {height}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      backgroundColor: "rgba(255, 255, 255, 0.09)",
                      border: "1px solid rgba(242, 210, 139, 0.3)",
                      borderRadius: "13px",
                      padding: "10px 16px",
                    }}
                  >
                    <span style={{ fontSize: 22, marginRight: 14, flexShrink: 0 }}>🎓</span>
                    <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
                      <span style={{ color: "#F2D28B", fontSize: 12, fontWeight: 800, textTransform: "uppercase" }}>
                        Education
                      </span>
                      <span style={{ color: "#FFFFFF", fontSize: 20, fontWeight: 800 }}>
                        {education}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      backgroundColor: "rgba(255, 255, 255, 0.09)",
                      border: "1px solid rgba(242, 210, 139, 0.3)",
                      borderRadius: "13px",
                      padding: "10px 16px",
                    }}
                  >
                    <span style={{ fontSize: 22, marginRight: 14, flexShrink: 0 }}>💼</span>
                    <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
                      <span style={{ color: "#F2D28B", fontSize: 12, fontWeight: 800, textTransform: "uppercase" }}>
                        Profession
                      </span>
                      <span style={{ color: "#FFFFFF", fontSize: 20, fontWeight: 800 }}>
                        {profession}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      backgroundColor: "rgba(255, 255, 255, 0.09)",
                      border: "1px solid rgba(242, 210, 139, 0.3)",
                      borderRadius: "13px",
                      padding: "10px 16px",
                    }}
                  >
                    <span style={{ fontSize: 22, marginRight: 14, flexShrink: 0 }}>🏛️</span>
                    <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
                      <span style={{ color: "#F2D28B", fontSize: 12, fontWeight: 800, textTransform: "uppercase" }}>
                        Community
                      </span>
                      <span style={{ color: "#FFFFFF", fontSize: 20, fontWeight: 800 }}>
                        {caste}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      backgroundColor: "rgba(255, 255, 255, 0.09)",
                      border: "1px solid rgba(242, 210, 139, 0.3)",
                      borderRadius: "13px",
                      padding: "10px 16px",
                    }}
                  >
                    <span style={{ fontSize: 22, marginRight: 14, flexShrink: 0 }}>📍</span>
                    <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
                      <span style={{ color: "#F2D28B", fontSize: 12, fontWeight: 800, textTransform: "uppercase" }}>
                        City / Location
                      </span>
                      <span style={{ color: "#FFFFFF", fontSize: 20, fontWeight: 800 }}>
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
                    backgroundColor: "rgba(242, 210, 139, 0.16)",
                    border: "1.5px solid #F2D28B",
                    borderRadius: "14px",
                    padding: "11px 16px",
                    textAlign: "center",
                  }}
                >
                  <span style={{ color: "#FFFFFF", fontSize: 15, fontWeight: 800 }}>
                    🔒 Direct Family Connect • Privacy Protected
                  </span>
                  <span style={{ color: "#F5D78E", fontSize: 14, fontWeight: 800, marginTop: 3 }}>
                    Visit rishteclub.com/register &amp; search ID #{displayId}
                  </span>
                </div>
              </div>
            </div>

            <WhatsAppFooterBar
              websitePath="rishteclub.com/register"
              helpline1={helpline1}
              helpline2={helpline2}
            />
          </div>
        ),
        { width: 1080, height: 1080, headers: OG_CACHE_HEADERS }
      );
    }

    // =========================================================================
    // CATEGORY C: FREE KUNDALI MILAN (ROYAL CELESTIAL NAVY & GOLD)
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
              backgroundColor: "#0B1633",
              backgroundImage:
                "radial-gradient(circle at 50% 28%, #1C3570 0%, #0D1B3E 58%, #060D21 100%)",
              padding: "48px 50px",
              boxSizing: "border-box",
              fontFamily: "sans-serif",
              position: "relative",
              border: "16px solid #D4AF63",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "14px",
                left: "14px",
                right: "14px",
                bottom: "14px",
                border: "2px solid rgba(242, 210, 139, 0.42)",
                pointerEvents: "none",
              }}
            />

            <WeddingMandalaWatermark />
            <CornerFiligree position="tl" />
            <CornerFiligree position="tr" />
            <CornerFiligree position="bl" />
            <CornerFiligree position="br" />

            <BrandHeader
              badgeText="✨ 100% FREE VEDIC ASTROLOGY"
              badgeBg="rgba(190, 18, 60, 0.78)"
              badgeBorder="#F2D28B"
              badgeTextColor="#FFFFFF"
            />

            {/* Main Hero Card */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                backgroundColor: "rgba(6, 13, 33, 0.74)",
                border: "2px solid rgba(242, 210, 139, 0.55)",
                borderRadius: "26px",
                padding: "32px 36px",
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
                  marginBottom: "24px",
                  gap: "24px",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      backgroundColor: "#F2D28B",
                      color: "#0B1633",
                      padding: "6px 18px",
                      borderRadius: "20px",
                      fontSize: 15,
                      fontWeight: 900,
                      letterSpacing: "1px",
                      alignSelf: "flex-start",
                      marginBottom: "14px",
                    }}
                  >
                    36 GUNA ASHTAKOOT &amp; MANGLIK CHECK
                  </div>
                  <span style={{ color: "#FFFFFF", fontSize: 40, fontWeight: 900, lineHeight: 1.15 }}>
                    Free &amp; Accurate Kundali Matching
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "12px" }}>
                    <OgHindiText phrase="kundaliSubhead1" fontSize={22} color="#F5D78E" />
                    <OgHindiText phrase="kundaliSubhead2" fontSize={20} color="#FDE68A" />
                  </div>
                </div>

                {/* North-Indian Vedic Diamond Kundali Emblem */}
                <div
                  style={{
                    width: "176px",
                    height: "176px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "rgba(91, 14, 28, 0.72)",
                    border: "3px solid #F2D28B",
                    borderRadius: "24px",
                    flexShrink: 0,
                    position: "relative",
                  }}
                >
                  <svg width="136" height="136" viewBox="0 0 120 120">
                    <rect x="8" y="8" width="104" height="104" stroke="#F2D28B" strokeWidth="2.5" fill="none" />
                    <line x1="8" y1="8" x2="112" y2="112" stroke="#E6C67C" strokeWidth="1.8" />
                    <line x1="112" y1="8" x2="8" y2="112" stroke="#E6C67C" strokeWidth="1.8" />
                    <polygon points="60,8 112,60 60,112 8,60" stroke="#F5D78E" strokeWidth="2" fill="none" />
                  </svg>
                  <div
                    style={{
                      position: "absolute",
                      top: "62px",
                      left: "62px",
                      width: "52px",
                      height: "52px",
                      borderRadius: "26px",
                      backgroundColor: "#F2D28B",
                      border: "2px solid #FFF7DF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span style={{ color: "#3D0914", fontSize: 22, fontWeight: 900 }}>
                      36
                    </span>
                  </div>
                </div>
              </div>

              {/* 2x2 Feature Cards Grid */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "22px" }}>
                <div style={{ display: "flex", flexDirection: "row", gap: "16px" }}>
                  <div
                    style={{
                      width: "49%",
                      display: "flex",
                      alignItems: "center",
                      backgroundColor: "rgba(255, 255, 255, 0.08)",
                      border: "1.5px solid rgba(242, 210, 139, 0.35)",
                      borderRadius: "16px",
                      padding: "16px 18px",
                    }}
                  >
                    <GreenCheckIcon />
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ color: "#F5D78E", fontSize: 18, fontWeight: 900 }}>
                        36 Guna Ashtakoot Score
                      </span>
                      <span style={{ color: "#E5E7EB", fontSize: 15, fontWeight: 600, marginTop: 2 }}>
                        Varna, Vashya, Nadi &amp; Bhakoot insights
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      width: "49%",
                      display: "flex",
                      alignItems: "center",
                      backgroundColor: "rgba(255, 255, 255, 0.08)",
                      border: "1.5px solid rgba(242, 210, 139, 0.35)",
                      borderRadius: "16px",
                      padding: "16px 18px",
                    }}
                  >
                    <GreenCheckIcon />
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ color: "#F5D78E", fontSize: 18, fontWeight: 900 }}>
                        Manglik Dosha Verification
                      </span>
                      <span style={{ color: "#E5E7EB", fontSize: 15, fontWeight: 600, marginTop: 2 }}>
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
                      backgroundColor: "rgba(255, 255, 255, 0.08)",
                      border: "1.5px solid rgba(242, 210, 139, 0.35)",
                      borderRadius: "16px",
                      padding: "16px 18px",
                    }}
                  >
                    <GreenCheckIcon />
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ color: "#F5D78E", fontSize: 18, fontWeight: 900 }}>
                        Hindi &amp; English Reports
                      </span>
                      <span style={{ color: "#E5E7EB", fontSize: 15, fontWeight: 600, marginTop: 2 }}>
                        Clear interpretation for families
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      width: "49%",
                      display: "flex",
                      alignItems: "center",
                      backgroundColor: "rgba(255, 255, 255, 0.08)",
                      border: "1.5px solid rgba(242, 210, 139, 0.35)",
                      borderRadius: "16px",
                      padding: "16px 18px",
                    }}
                  >
                    <GreenCheckIcon />
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ color: "#F5D78E", fontSize: 18, fontWeight: 900 }}>
                        Instant Free PDF Download
                      </span>
                      <span style={{ color: "#E5E7EB", fontSize: 15, fontWeight: 600, marginTop: 2 }}>
                        100% Free — No App Install Needed
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bold Gold CTA Box */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: "#741127",
                  border: "2px solid #F2D28B",
                  borderRadius: "16px",
                  padding: "15px 24px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  <CtaArrowIcon bg="#F2D28B" arrowColor="#3D0914" />
                  <OgHindiText phrase="kundaliCta" fontSize={21} color="#FFFFFF" />
                </div>
                <span style={{ color: "#F5D78E", fontSize: 22, fontWeight: 900 }}>
                  rishteclub.com/kundali
                </span>
              </div>
            </div>

            <WhatsAppFooterBar
              websitePath="rishteclub.com/kundali"
              helpline1={helpline1}
              helpline2={helpline2}
            />
          </div>
        ),
        { width: 1080, height: 1080, headers: OG_CACHE_HEADERS }
      );
    }

    // =========================================================================
    // CATEGORY D: VERIFIED PROFILES & TRUST (MAROON + ROYAL NAVY SHIELD CREST)
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
              backgroundColor: "#3D0914",
              backgroundImage:
                "linear-gradient(155deg, #530E1D 0%, #30060F 48%, #0D1B3E 100%)",
              padding: "48px 50px",
              boxSizing: "border-box",
              fontFamily: "sans-serif",
              position: "relative",
              border: "16px solid #D4AF63",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "14px",
                left: "14px",
                right: "14px",
                bottom: "14px",
                border: "2px solid rgba(242, 210, 139, 0.45)",
                pointerEvents: "none",
              }}
            />

            <WeddingMandalaWatermark />
            <CornerFiligree position="tl" />
            <CornerFiligree position="tr" />
            <CornerFiligree position="bl" />
            <CornerFiligree position="br" />

            <BrandHeader
              badgeText="🛡️ 100% MANUALLY VERIFIED"
              badgeBg="rgba(16, 185, 129, 0.22)"
              badgeBorder="#10B981"
              badgeTextColor="#FFFFFF"
              withCheck={true}
            />

            {/* Main Content Card */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                backgroundColor: "rgba(10, 14, 34, 0.7)",
                border: "2px solid rgba(242, 210, 139, 0.55)",
                borderRadius: "26px",
                padding: "30px 36px",
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
                  marginBottom: "22px",
                  gap: "24px",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      backgroundColor: "rgba(242, 210, 139, 0.18)",
                      border: "1.5px solid #F2D28B",
                      borderRadius: "20px",
                      padding: "6px 16px",
                      alignSelf: "flex-start",
                      marginBottom: "12px",
                    }}
                  >
                    <span style={{ color: "#F5D78E", fontSize: 15, fontWeight: 900 }}>
                      DIRECT FAMILY CONNECT • ZERO BROKERAGE
                    </span>
                  </div>
                  <span style={{ color: "#FFFFFF", fontSize: 38, fontWeight: 900, lineHeight: 1.15 }}>
                    100% Manually Verified Matches
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "10px" }}>
                    <OgHindiText phrase="trustSubhead1" fontSize={21} color="#F5D78E" />
                    <OgHindiText phrase="trustSubhead2" fontSize={21} color="#FDE68A" />
                  </div>
                </div>

                {/* Golden Trust Shield Badge */}
                <div
                  style={{
                    width: "148px",
                    height: "148px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "rgba(16, 185, 129, 0.14)",
                    border: "3px solid #F2D28B",
                    borderRadius: "74px",
                    flexShrink: 0,
                  }}
                >
                  <svg width="88" height="88" viewBox="0 0 24 24">
                    <path
                      d="M12 2L4 5.5v6c0 5.25 3.4 10.1 8 11.5 4.6-1.4 8-6.25 8-11.5v-6L12 2z"
                      fill="#10B981"
                      stroke="#F2D28B"
                      strokeWidth="1.4"
                    />
                    <path
                      d="M8.5 12.2l2.4 2.4 4.8-5.1"
                      stroke="#FFFFFF"
                      strokeWidth="2.3"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>

              {/* 4 Trust Pillars */}
              <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "22px" }}>
                <div style={{ display: "flex", flexDirection: "row", gap: "14px" }}>
                  <div
                    style={{
                      width: "49%",
                      display: "flex",
                      alignItems: "center",
                      backgroundColor: "rgba(255, 255, 255, 0.08)",
                      border: "1px solid rgba(242, 210, 139, 0.35)",
                      borderRadius: "16px",
                      padding: "16px 18px",
                    }}
                  >
                    <GreenCheckIcon />
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ color: "#FFFFFF", fontSize: 18, fontWeight: 900 }}>
                        Human Profile Screening
                      </span>
                      <span style={{ color: "#F2D28B", fontSize: 14, fontWeight: 700, marginTop: 2 }}>
                        Every biodata manually checked before approval
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      width: "49%",
                      display: "flex",
                      alignItems: "center",
                      backgroundColor: "rgba(255, 255, 255, 0.08)",
                      border: "1px solid rgba(242, 210, 139, 0.35)",
                      borderRadius: "16px",
                      padding: "16px 18px",
                    }}
                  >
                    <GreenCheckIcon />
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ color: "#FFFFFF", fontSize: 18, fontWeight: 900 }}>
                        Direct Parents Connect
                      </span>
                      <span style={{ color: "#F2D28B", fontSize: 14, fontWeight: 700, marginTop: 2 }}>
                        No agents, no middlemen commission
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "row", gap: "14px" }}>
                  <div
                    style={{
                      width: "49%",
                      display: "flex",
                      alignItems: "center",
                      backgroundColor: "rgba(255, 255, 255, 0.08)",
                      border: "1px solid rgba(242, 210, 139, 0.35)",
                      borderRadius: "16px",
                      padding: "16px 18px",
                    }}
                  >
                    <GreenCheckIcon />
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ color: "#FFFFFF", fontSize: 18, fontWeight: 900 }}>
                        Strict Photo &amp; Data Privacy
                      </span>
                      <span style={{ color: "#F2D28B", fontSize: 14, fontWeight: 700, marginTop: 2 }}>
                        Contacts protected &amp; member-verified only
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      width: "49%",
                      display: "flex",
                      alignItems: "center",
                      backgroundColor: "rgba(255, 255, 255, 0.08)",
                      border: "1px solid rgba(242, 210, 139, 0.35)",
                      borderRadius: "16px",
                      padding: "16px 18px",
                    }}
                  >
                    <GreenCheckIcon />
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ color: "#FFFFFF", fontSize: 18, fontWeight: 900 }}>
                        Respected Communities
                      </span>
                      <span style={{ color: "#F2D28B", fontSize: 14, fontWeight: 700, marginTop: 2 }}>
                        Agarwal • Baniya • Brahmin • Punjabi • Khatri • Jain
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bold CTA */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: "#F2D28B",
                  borderRadius: "16px",
                  padding: "15px 24px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  <CtaArrowIcon bg="#3D0914" arrowColor="#F2D28B" />
                  <OgHindiText phrase="trustCta" fontSize={21} color="#3D0914" />
                </div>
                <span style={{ color: "#0D1B3E", fontSize: 21, fontWeight: 900 }}>
                  rishteclub.com/register
                </span>
              </div>
            </div>

            <WhatsAppFooterBar
              websitePath="rishteclub.com/register"
              helpline1={helpline1}
              helpline2={helpline2}
            />
          </div>
        ),
        { width: 1080, height: 1080, headers: OG_CACHE_HEADERS }
      );
    }

    // =========================================================================
    // CATEGORY B: ₹99 LAUNCH OFFER (ROYAL NAVY + CRIMSON BURGUNDY + GOLD)
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
            backgroundColor: "#140D29",
            backgroundImage:
              "linear-gradient(135deg, #0D1B3E 0%, #4E0D1B 52%, #22050B 100%)",
            padding: "48px 50px",
            boxSizing: "border-box",
            fontFamily: "sans-serif",
            position: "relative",
            border: "16px solid #D4AF63",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "14px",
              left: "14px",
              right: "14px",
              bottom: "14px",
              border: "2px solid rgba(242, 210, 139, 0.45)",
              pointerEvents: "none",
            }}
          />

          <WeddingMandalaWatermark />
          <CornerFiligree position="tl" />
          <CornerFiligree position="tr" />
          <CornerFiligree position="bl" />
          <CornerFiligree position="br" />

          <BrandHeader
            badgeText={isOfferActive ? "🎉 LIMITED-TIME LAUNCH OFFER" : "✨ LIFETIME MEMBERSHIP"}
            badgeBg="#F2D28B"
            badgeBorder="#FFF5DC"
            badgeTextColor="#2A060E"
          />

          {/* Main Promotion Stage */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              backgroundColor: "rgba(9, 13, 30, 0.72)",
              border: "2px solid rgba(242, 210, 139, 0.58)",
              borderRadius: "26px",
              padding: "28px 34px",
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
                  marginBottom: "20px",
                  gap: "20px",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                  <span style={{ color: "#F5D78E", fontSize: 16, fontWeight: 900, letterSpacing: "1px" }}>
                    🔥 {OFFER_VALIDITY_LABEL}
                  </span>
                  <span style={{ color: "#FFFFFF", fontSize: 36, fontWeight: 900, lineHeight: 1.15, marginTop: 6 }}>
                    Get Direct Verified Match Contacts
                  </span>
                  <div style={{ display: "flex", alignItems: "center", marginTop: "10px" }}>
                    <OgHindiText phrase="offerSubhead" fontSize={19} color="#E5E7EB" />
                  </div>
                </div>

                {/* Big Golden ₹99 Focal Badge */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#F2D28B",
                    border: "3px solid #FFF7DF",
                    borderRadius: "22px",
                    padding: "16px 26px",
                    flexShrink: 0,
                  }}
                >
                  <span style={{ color: "#3D0914", fontSize: 14, fontWeight: 900, letterSpacing: "1px" }}>
                    AT JUST
                  </span>
                  <span style={{ color: "#0D1B3E", fontSize: 56, fontWeight: 900, lineHeight: 1 }}>
                    ₹{femalePricing.baseFee}
                  </span>
                  <span style={{ color: "#3D0914", fontSize: 14, fontWeight: 800, marginTop: 2 }}>
                    + 18% GST (₹{Math.round(femalePricing.totalAmount)})
                  </span>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", textAlign: "center", alignItems: "center", marginBottom: "20px" }}>
                <span style={{ color: "#FFFFFF", fontSize: 36, fontWeight: 900 }}>
                  Lifetime Matrimonial Registration
                </span>
                <span style={{ color: "#F5D78E", fontSize: 19, fontWeight: 700, marginTop: 6 }}>
                  100% Manually Verified Profiles • Direct Family Contact
                </span>
              </div>
            )}

            {/* Kanya vs Var Cards */}
            <div style={{ display: "flex", justifyContent: "space-between", gap: "18px", marginBottom: "18px" }}>
              {/* Kanya */}
              <div
                style={{
                  width: "49%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  backgroundColor: "rgba(190, 18, 60, 0.28)",
                  border: "2px solid #FB7185",
                  borderRadius: "18px",
                  padding: "16px",
                  textAlign: "center",
                }}
              >
                <span style={{ color: "#FECDD3", fontSize: 16, fontWeight: 900, letterSpacing: "1px" }}>
                  👰 KANYA (BRIDE)
                </span>
                {isOfferActive && (
                  <span style={{ color: "#FDA4AF", fontSize: 15, fontWeight: 700, textDecoration: "line-through", marginTop: 4 }}>
                    Regular ₹{femalePricing.regularBaseFee} + GST
                  </span>
                )}
                <span style={{ color: "#FFFFFF", fontSize: 36, fontWeight: 900, margin: "2px 0" }}>
                  ₹{femalePricing.baseFee} + GST
                </span>
                <span style={{ color: "#F5D78E", fontSize: 14, fontWeight: 800 }}>
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
                  backgroundColor: "rgba(37, 99, 235, 0.25)",
                  border: "2px solid #60A5FA",
                  borderRadius: "18px",
                  padding: "16px",
                  textAlign: "center",
                }}
              >
                <span style={{ color: "#BFDBFE", fontSize: 16, fontWeight: 900, letterSpacing: "1px" }}>
                  🤵 VAR (GROOM)
                </span>
                {isOfferActive && (
                  <span style={{ color: "#93C5FD", fontSize: 15, fontWeight: 700, textDecoration: "line-through", marginTop: 4 }}>
                    Regular ₹{malePricing.regularBaseFee} + GST
                  </span>
                )}
                <span style={{ color: "#FFFFFF", fontSize: 36, fontWeight: 900, margin: "2px 0" }}>
                  ₹{malePricing.baseFee} + GST
                </span>
                <span style={{ color: "#F5D78E", fontSize: 14, fontWeight: 800 }}>
                  Total ₹{malePricing.totalAmount.toFixed(2)} • One-Time
                </span>
              </div>
            </div>

            {/* 3 High-Contrast Benefits */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "18px" }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <GreenCheckIcon />
                <span style={{ color: "#FFFFFF", fontSize: 18, fontWeight: 700 }}>
                  Direct Parents Contact Numbers — Zero Middlemen Brokerage
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center" }}>
                <GreenCheckIcon />
                <span style={{ color: "#FFFFFF", fontSize: 18, fontWeight: 700 }}>
                  100% Mobile &amp; Family Screened Matches Across Communities
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center" }}>
                <GreenCheckIcon />
                <span style={{ color: "#FFFFFF", fontSize: 18, fontWeight: 700 }}>
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
                backgroundColor: "#F2D28B",
                borderRadius: "16px",
                padding: "14px 24px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                <CtaArrowIcon bg="#3D0914" arrowColor="#F2D28B" />
                <OgHindiText phrase="offerCta" fontSize={20} color="#3D0914" />
              </div>
              <span style={{ color: "#0D1B3E", fontSize: 21, fontWeight: 900 }}>
                www.rishteclub.com
              </span>
            </div>
          </div>

          <WhatsAppFooterBar
            websitePath="rishteclub.com"
            helpline1={helpline1}
            helpline2={helpline2}
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
