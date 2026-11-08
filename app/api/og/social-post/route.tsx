import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

// Curated rotation of inspirational matrimonial suvichar for Morning slot
const MORNING_SUVICHAR = [
  {
    hindi: "विवाह केवल दो व्यक्तियों का नहीं, बल्कि दो परिवारों और दो आत्माओं का पवित्र संगम है। जहाँ सम्मान और विश्वास हो, वही रिश्ता स्वर्ग बनता है।",
    english: "Marriage is not just the union of two individuals, but a sacred bond between two families anchored in mutual respect, patience, and love.",
    topic: "विश्वास और समर्पण (Trust & Dedication)",
  },
  {
    hindi: "एक सफल वैवाहिक जीवन की नींव एक-दूसरे की कमियों को स्वीकार करने और अच्छाइयों को संजोने में है। सच्चा साथी वही है जो हर मोड़ पर साथ निभाए।",
    english: "A lasting marriage isn't about finding a flawless partner, but embracing each other completely with care, dignity, and understanding.",
    topic: "पारस्परिक समझ (Mutual Harmony)",
  },
  {
    hindi: "जहाँ बड़ों का आशीर्वाद और अपनों का साथ हो, उस वैवाहिक बंधन में ईश्वर की कृपा सदैव बनी रहती है। अपनों के लिए सही रिश्ता चुनना ही समझदारी है।",
    english: "When a new journey begins with the heartfelt blessings of elders, happiness and prosperity follow naturally.",
    topic: "संस्कार और आशीर्वाद (Family Values)",
  },
  {
    hindi: "सच्चा जीवनसाथी वह है जो आपकी खुशियों में मुस्कान और आपके संघर्षों में शक्ति बनकर हर कदम पर खड़ा रहे।",
    english: "A true soulmate multiplies your joys and becomes your quiet strength through every phase of life.",
    topic: "सच्चा जीवनसाथी (True Companionship)",
  },
];

// Curated Vedic Astrology insights for Evening slot
const ASTROLOGY_INSIGHTS = [
  {
    title: "36 Guna Ashtakoota Milan: The Vedic Framework",
    subtitle: "वैदिक अष्टकूट मिलान — सुखद वैवाहिक जीवन का आधार",
    points: [
      "18+ Gunas: Auspicious & recommended for a harmonious union",
      "Nadi Koota (8 Pts): Genetic compatibility, health & progeny well-being",
      "Bhakoot Koota (7 Pts): Emotional bonding, mutual love & financial stability",
      "Graha Maitri & Gana: Psychological wavelengths & temperamental harmony",
    ],
    remedyTip: "Lal Kitab Tip: Minor planetary doshas can be resolved with simple, non-superstitious daily Vedic remedies.",
  },
  {
    title: "Demystifying Manglik Dosha (मंगल दोष का सच)",
    subtitle: "Fear Not: Understanding Shubh Sanyog & Cancellations",
    points: [
      "Both partners having Mars influence automatically cancels Mangal Dosha",
      "Jupiter aspect (Brihaspati Drishti) softens and pacifies fiery traits",
      "After age 28, Mars energy matures into determination, vigor & leadership",
      "Compatibility of values and mental wavelength always supersedes fear",
    ],
    remedyTip: "Vedic Guidance: Keeping peace at home and honoring family elders brings natural planetary peace.",
  },
  {
    title: "Nadi & Bhakoot: The Foundations of Lineage",
    subtitle: "नाड़ी और भकूट दोष का वास्तविक वैज्ञानिक परिप्रेक्ष्य",
    points: [
      "Nadi represents metabolic balance and genetic diversity",
      "Different constellations (Nakshatras) provide natural cancellation exemptions",
      "Bhakoot reflects family prosperity and shared domestic peace",
      "Consult authentic classical calculations rather than algorithmic myths",
    ],
    remedyTip: "Free AI Kundli: Calculate your complete 36 Guna score instantly on RishteClub Astrology.",
  },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slot = (searchParams.get("slot") || "MORNING").toUpperCase();

    // Determine Day-of-Year index for auto-rotation
    const now = new Date();
    const dayOfYear = Math.floor(
      (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24
    );

    // Common Contact Details
    const helpline1 = "+91-9871592002";
    const helpline2 = "+91-7015812359";
    const website = "rishteclub.com";

    // -------------------------------------------------------------
    // TEMPLATE 1: MORNING / KUNDLI MILAN PROMOTIONAL CARD
    // -------------------------------------------------------------
    if (slot === "MORNING" || slot === "KUNDLI_MILAN") {
      return new ImageResponse(
        (
          <div
            style={{
              height: "100%",
              width: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              backgroundColor: "#4A0E17",
              backgroundImage: "radial-gradient(circle at 50% 25%, #681523 0%, #4A0E17 60%, #200408 100%)",
              padding: "54px",
              boxSizing: "border-box",
              fontFamily: "sans-serif",
              position: "relative",
              border: "16px solid #C5A059",
            }}
          >
            {/* Inner Golden Ornamental Border */}
            <div
              style={{
                position: "absolute",
                top: "16px",
                left: "16px",
                right: "16px",
                bottom: "16px",
                border: "2px solid rgba(223, 186, 115, 0.4)",
                pointerEvents: "none",
              }}
            />

            {/* Top Brand Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "2px solid rgba(223, 186, 115, 0.4)",
                paddingBottom: "20px",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", alignItems: "baseline" }}>
                  <span style={{ fontSize: 42, fontWeight: 900, color: "#FFFFFF" }}>Rishte</span>
                  <span style={{ fontSize: 42, fontWeight: 900, color: "#DFBA73" }}>Club</span>
                  <span style={{ fontSize: 16, color: "#DFBA73", fontWeight: 700, marginLeft: 4 }}>™</span>
                </div>
                <span style={{ fontSize: 13, color: "#DFBA73", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase" }}>
                  Managed by NNVS Matrimony
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  backgroundColor: "rgba(223, 186, 115, 0.2)",
                  border: "2px solid #DFBA73",
                  borderRadius: "24px",
                  padding: "8px 22px",
                }}
              >
                <span style={{ color: "#DFBA73", fontSize: 16, fontWeight: 800 }}>
                  ✨ 100% FREE AI KUNDALI MILAN
                </span>
              </div>
            </div>

            {/* Middle Feature Content */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                backgroundColor: "rgba(0, 0, 0, 0.45)",
                border: "2px solid rgba(223, 186, 115, 0.5)",
                borderRadius: "24px",
                padding: "36px 40px",
                margin: "auto 0",
              }}
            >
              {/* Main Badge & Title */}
              <div style={{ display: "flex", flexDirection: "column", marginBottom: "22px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: "#DFBA73",
                    color: "#4A0E17",
                    padding: "6px 18px",
                    borderRadius: "14px",
                    fontSize: 15,
                    fontWeight: 900,
                    letterSpacing: "1.5px",
                    textTransform: "uppercase",
                    alignSelf: "flex-start",
                    marginBottom: "12px",
                  }}
                >
                  36 GUNA ASHTAKOOTA MILAN &amp; DOSHA CHECK
                </div>

                <span style={{ color: "#FFFFFF", fontSize: 34, fontWeight: 900, lineHeight: 1.25 }}>
                  Kundali Milan &amp; Horoscope Matching
                </span>
                <span style={{ color: "#DFBA73", fontSize: 19, fontWeight: 700, marginTop: "6px" }}>
                  Accurate Vedic Compatibility Analysis • Free Downloadable PDF Report
                </span>
              </div>

              {/* 4 Feature Points */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "22px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(223, 186, 115, 0.25)",
                    borderRadius: "14px",
                    padding: "12px 18px",
                  }}
                >
                  <span style={{ color: "#DFBA73", fontSize: 20, fontWeight: 900, marginRight: 12 }}>•</span>
                  <span style={{ color: "#FFFFFF", fontSize: 18, fontWeight: 600 }}>
                    36 Guna Ashtakoot Score with Detailed Hindi &amp; English Interpretation
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(223, 186, 115, 0.25)",
                    borderRadius: "14px",
                    padding: "12px 18px",
                  }}
                >
                  <span style={{ color: "#DFBA73", fontSize: 20, fontWeight: 900, marginRight: 12 }}>•</span>
                  <span style={{ color: "#FFFFFF", fontSize: 18, fontWeight: 600 }}>
                    Manglik Dosha Verification &amp; Authentic Classical Vedic Remedies
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(223, 186, 115, 0.25)",
                    borderRadius: "14px",
                    padding: "12px 18px",
                  }}
                >
                  <span style={{ color: "#DFBA73", fontSize: 20, fontWeight: 900, marginRight: 12 }}>•</span>
                  <span style={{ color: "#FFFFFF", fontSize: 18, fontWeight: 600 }}>
                    Instant Downloadable Vedic Matchmaking Certificate (PDF)
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(223, 186, 115, 0.25)",
                    borderRadius: "14px",
                    padding: "12px 18px",
                  }}
                >
                  <span style={{ color: "#DFBA73", fontSize: 20, fontWeight: 900, marginRight: 12 }}>•</span>
                  <span style={{ color: "#FFFFFF", fontSize: 18, fontWeight: 600 }}>
                    No App Installation Needed — Fast, Confidential &amp; 100% Free
                  </span>
                </div>
              </div>

              {/* Bottom CTA Highlight Box */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: "rgba(223, 186, 115, 0.16)",
                  border: "1px solid #DFBA73",
                  borderRadius: "14px",
                  padding: "12px 20px",
                }}
              >
                <span style={{ color: "#FFFFFF", fontSize: 17, fontWeight: 700 }}>
                  👉 Check Compatibility Free:
                </span>
                <span style={{ color: "#DFBA73", fontSize: 18, fontWeight: 900, letterSpacing: "0.5px" }}>
                  rishteclub.com/kundli-milan
                </span>
              </div>
            </div>

            {/* Bottom Contact & Helpline Bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "rgba(0, 0, 0, 0.35)",
                border: "2px solid rgba(223, 186, 115, 0.5)",
                borderRadius: "18px",
                padding: "16px 30px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                <span style={{ color: "#DFBA73", fontSize: 22, marginRight: 8 }}>🌐</span>
                <span style={{ color: "#FFFFFF", fontSize: 20, fontWeight: 700 }}>{website}/kundli-milan</span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span style={{ color: "#25D366", fontSize: 22, marginRight: 8 }}>📞</span>
                  <span style={{ color: "#DFBA73", fontSize: 18, fontWeight: 700 }}>{helpline1}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span style={{ color: "#25D366", fontSize: 22, marginRight: 8 }}>📞</span>
                  <span style={{ color: "#DFBA73", fontSize: 18, fontWeight: 700 }}>{helpline2}</span>
                </div>
              </div>
            </div>
          </div>
        ),
        { width: 1080, height: 1080 }
      );
    }

    // -------------------------------------------------------------
    // -------------------------------------------------------------
    // TEMPLATE 2: PROFILE SPOTLIGHT (AFTERNOON SLOT) WITH PHOTO
    // -------------------------------------------------------------
    if (
      slot === "PROFILE_SPOTLIGHT" ||
      ((slot === "AFTERNOON" || slot === "CANDIDATE") &&
        (searchParams.get("id") || searchParams.get("photo")))
    ) {
      const isFemale = (searchParams.get("gender") || "FEMALE").toUpperCase() === "FEMALE";
      const displayId = searchParams.get("id") || `RC${Math.floor(1000 + Math.random() * 9000)}`;
      const displayName =
        searchParams.get("name") || (isFemale ? "Verified Bride" : "Verified Groom");
      const age = searchParams.get("age") || "26";
      const height = searchParams.get("height") || (isFemale ? "5'4\"" : "5'10\"");
      const profession = searchParams.get("profession") || "Working Professional";
      const education = searchParams.get("education") || "Graduate";
      const city = searchParams.get("city") || "Delhi NCR";
      const caste = searchParams.get("caste") || "Hindu";
      const photoUrl = searchParams.get("photo") || "";

      return new ImageResponse(
        (
          <div
            style={{
              height: "100%",
              width: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              backgroundColor: "#4A0E17",
              backgroundImage:
                "radial-gradient(circle at 50% 25%, #63121F 0%, #4A0E17 65%, #250409 100%)",
              padding: "46px 48px",
              boxSizing: "border-box",
              fontFamily: "sans-serif",
              position: "relative",
              border: "16px solid #C5A059",
            }}
          >
            {/* Inner Golden Ornamental Border */}
            <div
              style={{
                position: "absolute",
                top: "16px",
                left: "16px",
                right: "16px",
                bottom: "16px",
                border: "2px solid rgba(223, 186, 115, 0.4)",
                pointerEvents: "none",
              }}
            />

            {/* Top Brand Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "2px solid rgba(223, 186, 115, 0.4)",
                paddingBottom: "18px",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", alignItems: "baseline" }}>
                  <span style={{ fontSize: 40, fontWeight: 900, color: "#FFFFFF" }}>Rishte</span>
                  <span style={{ fontSize: 40, fontWeight: 900, color: "#DFBA73" }}>Club</span>
                  <span style={{ fontSize: 16, color: "#DFBA73", fontWeight: 700, marginLeft: 4 }}>
                    ™
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 13,
                    color: "#DFBA73",
                    fontWeight: 700,
                    letterSpacing: "2px",
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
                  backgroundColor: "rgba(16, 185, 129, 0.2)",
                  border: "2px solid #10B981",
                  borderRadius: "24px",
                  padding: "8px 20px",
                }}
              >
                <span style={{ color: "#10B981", fontSize: 16, fontWeight: 800, marginRight: 6 }}>
                  ✓
                </span>
                <span style={{ color: "#FFFFFF", fontSize: 16, fontWeight: 800 }}>
                  100% VERIFIED PROFILE
                </span>
              </div>
            </div>

            {/* Middle Section: Split 2 Columns (Left: Photo & Gender, Right: Biodata Details) */}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "stretch",
                justifyContent: "space-between",
                gap: "30px",
                margin: "auto 0",
                height: "690px",
              }}
            >
              {/* Left Column: Photo Card */}
              <div
                style={{
                  width: "410px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: "rgba(0, 0, 0, 0.4)",
                  border: "2px solid rgba(223, 186, 115, 0.45)",
                  borderRadius: "22px",
                  padding: "18px",
                  boxSizing: "border-box",
                }}
              >
                {/* Photo Container */}
                <div
                  style={{
                    width: "374px",
                    height: "550px",
                    borderRadius: "16px",
                    overflow: "hidden",
                    border: "3px solid #DFBA73",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#1e0408",
                  }}
                >
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt="Verified Candidate"
                      width={374}
                      height={550}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "100%",
                        color: "#DFBA73",
                      }}
                    >
                      <span style={{ fontSize: 90 }}>{isFemale ? "👰" : "🤵"}</span>
                      <span
                        style={{
                          fontSize: 18,
                          fontWeight: 700,
                          marginTop: 12,
                          color: "#FFFFFF",
                        }}
                      >
                        Verified Photo On File
                      </span>
                    </div>
                  )}
                </div>

                {/* Candidate Role Badge */}
                <div
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isFemale ? "#E11D48" : "#2563EB",
                    color: "#FFFFFF",
                    padding: "10px 0",
                    borderRadius: "12px",
                    fontSize: 18,
                    fontWeight: 900,
                    letterSpacing: "1px",
                    marginTop: "12px",
                  }}
                >
                  {isFemale ? "वधू (BRIDE CANDIDATE)" : "वर (GROOM CANDIDATE)"}
                </div>
              </div>

              {/* Right Column: Safe Biodata Attributes */}
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  backgroundColor: "rgba(0, 0, 0, 0.4)",
                  border: "2px solid rgba(223, 186, 115, 0.45)",
                  borderRadius: "22px",
                  padding: "24px 28px",
                  boxSizing: "border-box",
                }}
              >
                {/* Header: Name & Profile ID Badge */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderBottom: "1px solid rgba(223, 186, 115, 0.3)",
                    paddingBottom: "14px",
                  }}
                >
                  <span style={{ color: "#FFFFFF", fontSize: 32, fontWeight: 900 }}>
                    {displayName}
                  </span>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      backgroundColor: "#DFBA73",
                      color: "#4A0E17",
                      padding: "8px 18px",
                      borderRadius: "12px",
                      fontSize: 19,
                      fontWeight: 900,
                      fontFamily: "monospace",
                    }}
                  >
                    ID: #{displayId}
                  </div>
                </div>

                {/* 5 Safe Biodata Cards */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    margin: "12px 0",
                  }}
                >
                  {/* Age & Height */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      backgroundColor: "rgba(255, 255, 255, 0.08)",
                      border: "1px solid rgba(223, 186, 115, 0.25)",
                      borderRadius: "12px",
                      padding: "10px 16px",
                    }}
                  >
                    <span style={{ color: "#DFBA73", fontSize: 22, marginRight: 12 }}>🎂</span>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span
                        style={{
                          color: "#DFBA73",
                          fontSize: 12,
                          fontWeight: 700,
                          textTransform: "uppercase",
                        }}
                      >
                        Age &amp; Height
                      </span>
                      <span style={{ color: "#FFFFFF", fontSize: 20, fontWeight: 700 }}>
                        {age} Yrs • {height}
                      </span>
                    </div>
                  </div>

                  {/* Profession */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      backgroundColor: "rgba(255, 255, 255, 0.08)",
                      border: "1px solid rgba(223, 186, 115, 0.25)",
                      borderRadius: "12px",
                      padding: "10px 16px",
                    }}
                  >
                    <span style={{ color: "#DFBA73", fontSize: 22, marginRight: 12 }}>💼</span>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span
                        style={{
                          color: "#DFBA73",
                          fontSize: 12,
                          fontWeight: 700,
                          textTransform: "uppercase",
                        }}
                      >
                        Profession
                      </span>
                      <span style={{ color: "#FFFFFF", fontSize: 20, fontWeight: 700 }}>
                        {profession}
                      </span>
                    </div>
                  </div>

                  {/* Education */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      backgroundColor: "rgba(255, 255, 255, 0.08)",
                      border: "1px solid rgba(223, 186, 115, 0.25)",
                      borderRadius: "12px",
                      padding: "10px 16px",
                    }}
                  >
                    <span style={{ color: "#DFBA73", fontSize: 22, marginRight: 12 }}>🎓</span>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span
                        style={{
                          color: "#DFBA73",
                          fontSize: 12,
                          fontWeight: 700,
                          textTransform: "uppercase",
                        }}
                      >
                        Education
                      </span>
                      <span style={{ color: "#FFFFFF", fontSize: 20, fontWeight: 700 }}>
                        {education}
                      </span>
                    </div>
                  </div>

                  {/* Community */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      backgroundColor: "rgba(255, 255, 255, 0.08)",
                      border: "1px solid rgba(223, 186, 115, 0.25)",
                      borderRadius: "12px",
                      padding: "10px 16px",
                    }}
                  >
                    <span style={{ color: "#DFBA73", fontSize: 22, marginRight: 12 }}>🏛️</span>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span
                        style={{
                          color: "#DFBA73",
                          fontSize: 12,
                          fontWeight: 700,
                          textTransform: "uppercase",
                        }}
                      >
                        Community
                      </span>
                      <span style={{ color: "#FFFFFF", fontSize: 20, fontWeight: 700 }}>
                        {caste}
                      </span>
                    </div>
                  </div>

                  {/* Location */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      backgroundColor: "rgba(255, 255, 255, 0.08)",
                      border: "1px solid rgba(223, 186, 115, 0.25)",
                      borderRadius: "12px",
                      padding: "10px 16px",
                    }}
                  >
                    <span style={{ color: "#DFBA73", fontSize: 22, marginRight: 12 }}>📍</span>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span
                        style={{
                          color: "#DFBA73",
                          fontSize: 12,
                          fontWeight: 700,
                          textTransform: "uppercase",
                        }}
                      >
                        Location
                      </span>
                      <span style={{ color: "#FFFFFF", fontSize: 20, fontWeight: 700 }}>
                        {city}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Privacy Safeguard Callout */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    backgroundColor: "rgba(223, 186, 115, 0.14)",
                    border: "1px dashed rgba(223, 186, 115, 0.6)",
                    borderRadius: "12px",
                    padding: "10px 14px",
                    textAlign: "center",
                  }}
                >
                  <span style={{ color: "#FFFFFF", fontSize: 14, fontWeight: 700 }}>
                    🔒 Strict Privacy Safeguard • Direct Family Connection
                  </span>
                  <span
                    style={{
                      color: "#DFBA73",
                      fontSize: 13,
                      fontWeight: 600,
                      marginTop: 3,
                    }}
                  >
                    Search Profile ID &apos;{displayId}&apos; on rishteclub.com to view full verified details
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Contact & Helpline Bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "rgba(0, 0, 0, 0.35)",
                border: "2px solid rgba(223, 186, 115, 0.5)",
                borderRadius: "18px",
                padding: "14px 28px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                <span style={{ color: "#DFBA73", fontSize: 22, marginRight: 8 }}>🌐</span>
                <span style={{ color: "#FFFFFF", fontSize: 20, fontWeight: 700 }}>{website}</span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span style={{ color: "#25D366", fontSize: 22, marginRight: 8 }}>📞</span>
                  <span style={{ color: "#DFBA73", fontSize: 18, fontWeight: 700 }}>
                    {helpline1}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span style={{ color: "#25D366", fontSize: 22, marginRight: 8 }}>📞</span>
                  <span style={{ color: "#DFBA73", fontSize: 18, fontWeight: 700 }}>
                    {helpline2}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ),
        { width: 1080, height: 1080 }
      );
    }

    // -------------------------------------------------------------
    // TEMPLATE 3: MATRIMONY REGISTRATION & LIFETIME MEMBERSHIP AWARENESS
    // (EVENING / PROMOTION / REGISTRATION / FALLBACK)
    // -------------------------------------------------------------
    if (
      slot === "PROMOTION" ||
      slot === "EVENING" ||
      slot === "REGISTRATION" ||
      slot === "AFTERNOON"
    ) {
      return new ImageResponse(
        (
          <div
            style={{
              height: "100%",
              width: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              backgroundColor: "#4A0E17",
              backgroundImage:
                "radial-gradient(circle at 50% 25%, #63121F 0%, #4A0E17 65%, #250409 100%)",
              padding: "54px",
              boxSizing: "border-box",
              fontFamily: "sans-serif",
              position: "relative",
              border: "16px solid #C5A059",
            }}
          >
            {/* Inner Golden Ornamental Border */}
            <div
              style={{
                position: "absolute",
                top: "16px",
                left: "16px",
                right: "16px",
                bottom: "16px",
                border: "2px solid rgba(223, 186, 115, 0.4)",
                pointerEvents: "none",
              }}
            />

            {/* Top Brand Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "2px solid rgba(223, 186, 115, 0.4)",
                paddingBottom: "20px",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", alignItems: "baseline" }}>
                  <span style={{ fontSize: 42, fontWeight: 900, color: "#FFFFFF" }}>Rishte</span>
                  <span style={{ fontSize: 42, fontWeight: 900, color: "#DFBA73" }}>Club</span>
                  <span style={{ fontSize: 16, color: "#DFBA73", fontWeight: 700, marginLeft: 4 }}>
                    ™
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 13,
                    color: "#DFBA73",
                    fontWeight: 700,
                    letterSpacing: "2px",
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
                  backgroundColor: "rgba(16, 185, 129, 0.2)",
                  border: "2px solid #10B981",
                  borderRadius: "24px",
                  padding: "8px 20px",
                }}
              >
                <span style={{ color: "#10B981", fontSize: 16, fontWeight: 800, marginRight: 6 }}>
                  ✓
                </span>
                <span style={{ color: "#FFFFFF", fontSize: 16, fontWeight: 800 }}>
                  100% VERIFIED MATRIMONY
                </span>
              </div>
            </div>

            {/* Middle Registration Box */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                backgroundColor: "rgba(0, 0, 0, 0.45)",
                border: "2px solid rgba(223, 186, 115, 0.5)",
                borderRadius: "24px",
                padding: "36px 40px",
                margin: "auto 0",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  textAlign: "center",
                  alignItems: "center",
                  marginBottom: "22px",
                }}
              >
                <span style={{ color: "#FFFFFF", fontSize: 34, fontWeight: 900, lineHeight: 1.25 }}>
                  Lifetime Matrimonial Registration
                </span>
                <span style={{ color: "#DFBA73", fontSize: 18, fontWeight: 700, marginTop: "6px" }}>
                  Agarwal • Baniya • Brahmin • Punjabi • Khatri • Jain Communities
                </span>
              </div>

              {/* 2 Big Pricing Cards: Kanya vs Var */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "20px",
                  marginBottom: "24px",
                }}
              >
                {/* Kanya Card */}
                <div
                  style={{
                    width: "48%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    backgroundColor: "rgba(225, 29, 72, 0.2)",
                    border: "2px solid #E11D48",
                    borderRadius: "18px",
                    padding: "20px",
                    textAlign: "center",
                  }}
                >
                  <span
                    style={{
                      color: "#FDA4AF",
                      fontSize: 16,
                      fontWeight: 800,
                      letterSpacing: "1px",
                      textTransform: "uppercase",
                    }}
                  >
                    👧 Kanya (Bride)
                  </span>
                  <span
                    style={{ color: "#FFFFFF", fontSize: 44, fontWeight: 900, margin: "6px 0" }}
                  >
                    ₹471
                  </span>
                  <span style={{ color: "#DFBA73", fontSize: 14, fontWeight: 700 }}>
                    One-Time Lifetime Access
                  </span>
                </div>

                {/* Var Card */}
                <div
                  style={{
                    width: "48%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    backgroundColor: "rgba(37, 99, 235, 0.2)",
                    border: "2px solid #3B82F6",
                    borderRadius: "18px",
                    padding: "20px",
                    textAlign: "center",
                  }}
                >
                  <span
                    style={{
                      color: "#93C5FD",
                      fontSize: 16,
                      fontWeight: 800,
                      letterSpacing: "1px",
                      textTransform: "uppercase",
                    }}
                  >
                    👦 Var (Groom)
                  </span>
                  <span
                    style={{ color: "#FFFFFF", fontSize: 44, fontWeight: 900, margin: "6px 0" }}
                  >
                    ₹943
                  </span>
                  <span style={{ color: "#DFBA73", fontSize: 14, fontWeight: 700 }}>
                    One-Time Lifetime Access
                  </span>
                </div>
              </div>

              {/* Key Benefits List */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  marginBottom: "18px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span style={{ color: "#10B981", fontSize: 20, fontWeight: 900, marginRight: 10 }}>
                    ✓
                  </span>
                  <span style={{ color: "#FFFFFF", fontSize: 17, fontWeight: 600 }}>
                    Direct Contact with Respected Families — Zero Middlemen Commission
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span style={{ color: "#10B981", fontSize: 20, fontWeight: 900, marginRight: 10 }}>
                    ✓
                  </span>
                  <span style={{ color: "#FFFFFF", fontSize: 17, fontWeight: 600 }}>
                    100% Background &amp; Mobile Verified Matrimonial Biodatas
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span style={{ color: "#10B981", fontSize: 20, fontWeight: 900, marginRight: 10 }}>
                    ✓
                  </span>
                  <span style={{ color: "#FFFFFF", fontSize: 17, fontWeight: 600 }}>
                    No Recurring Subscriptions — Complete Data Privacy Guaranteed
                  </span>
                </div>
              </div>

              {/* CTA Callout */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: "rgba(223, 186, 115, 0.16)",
                  border: "1px solid #DFBA73",
                  borderRadius: "14px",
                  padding: "12px 20px",
                }}
              >
                <span style={{ color: "#FFFFFF", fontSize: 17, fontWeight: 700 }}>
                  👉 Register Your Biodata Today:
                </span>
                <span style={{ color: "#DFBA73", fontSize: 18, fontWeight: 900 }}>
                  rishteclub.com/register
                </span>
              </div>
            </div>

            {/* Bottom Contact & Helpline Bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "rgba(0, 0, 0, 0.35)",
                border: "2px solid rgba(223, 186, 115, 0.5)",
                borderRadius: "18px",
                padding: "16px 30px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                <span style={{ color: "#DFBA73", fontSize: 22, marginRight: 8 }}>🌐</span>
                <span style={{ color: "#FFFFFF", fontSize: 20, fontWeight: 700 }}>
                  {website}/register
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span style={{ color: "#25D366", fontSize: 22, marginRight: 8 }}>📞</span>
                  <span style={{ color: "#DFBA73", fontSize: 18, fontWeight: 700 }}>
                    {helpline1}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span style={{ color: "#25D366", fontSize: 22, marginRight: 8 }}>📞</span>
                  <span style={{ color: "#DFBA73", fontSize: 18, fontWeight: 700 }}>
                    {helpline2}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ),
        { width: 1080, height: 1080 }
      );
    }

    // -------------------------------------------------------------
    // TEMPLATE 3: EVENING 36 GUNA MILAN & ASTROLOGY INSIGHT
    // -------------------------------------------------------------
    const astroIndex = dayOfYear % ASTROLOGY_INSIGHTS.length;
    const astro = {
      title: searchParams.get("title") || ASTROLOGY_INSIGHTS[astroIndex].title,
      subtitle: searchParams.get("subtitle") || ASTROLOGY_INSIGHTS[astroIndex].subtitle,
      remedyTip: searchParams.get("remedy") || ASTROLOGY_INSIGHTS[astroIndex].remedyTip,
      points: ASTROLOGY_INSIGHTS[astroIndex].points,
    };

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            backgroundColor: "#4A0E17",
            backgroundImage: "radial-gradient(circle at 50% 20%, #681523 0%, #4A0E17 60%, #200408 100%)",
            padding: "54px",
            boxSizing: "border-box",
            fontFamily: "sans-serif",
            position: "relative",
            border: "16px solid #C5A059",
          }}
        >
          {/* Top Brand Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "2px solid rgba(223, 186, 115, 0.4)",
              paddingBottom: "20px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "baseline" }}>
                <span style={{ fontSize: 42, fontWeight: 900, color: "#FFFFFF" }}>Rishte</span>
                <span style={{ fontSize: 42, fontWeight: 900, color: "#DFBA73" }}>Club</span>
                <span style={{ fontSize: 16, color: "#DFBA73", fontWeight: 700, marginLeft: 4 }}>™</span>
              </div>
              <span style={{ fontSize: 13, color: "#DFBA73", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase" }}>
                Managed by NNVS Matrimony
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: "rgba(223, 186, 115, 0.15)",
                border: "2px solid #DFBA73",
                borderRadius: "24px",
                padding: "8px 22px",
              }}
            >
              <span style={{ color: "#DFBA73", fontSize: 16, fontWeight: 800 }}>✨ VEDIC ASTROLOGY INSIGHT</span>
            </div>
          </div>

          {/* Middle Astrology Insight Content */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              backgroundColor: "rgba(0, 0, 0, 0.45)",
              border: "2px solid rgba(223, 186, 115, 0.5)",
              borderRadius: "24px",
              padding: "36px 40px",
              margin: "auto 0",
            }}
          >
            {/* Title & Subtitle */}
            <div style={{ display: "flex", flexDirection: "column", marginBottom: "24px" }}>
              <span style={{ color: "#DFBA73", fontSize: 32, fontWeight: 900, lineHeight: 1.3 }}>
                {astro.title}
              </span>
              <span style={{ color: "#FFFFFF", fontSize: 20, fontWeight: 700, marginTop: "6px" }}>
                {astro.subtitle}
              </span>
            </div>

            {/* Points List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "24px" }}>
              {astro.points.map((pt, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(223, 186, 115, 0.25)",
                    borderRadius: "14px",
                    padding: "14px 20px",
                  }}
                >
                  <span style={{ color: "#DFBA73", fontSize: 22, fontWeight: 900, marginRight: 14 }}>
                    •
                  </span>
                  <span style={{ color: "#FFFFFF", fontSize: 20, fontWeight: 600 }}>{pt}</span>
                </div>
              ))}
            </div>

            {/* Remedy Tip Card */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: "rgba(223, 186, 115, 0.18)",
                border: "1px solid #DFBA73",
                borderRadius: "14px",
                padding: "14px 20px",
                color: "#DFBA73",
                fontSize: 17,
                fontWeight: 700,
              }}
            >
              🌿 {astro.remedyTip}
            </div>
          </div>

          {/* Bottom Contact & Helpline Bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: "rgba(0, 0, 0, 0.35)",
              border: "2px solid rgba(223, 186, 115, 0.5)",
              borderRadius: "18px",
              padding: "16px 30px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              <span style={{ color: "#DFBA73", fontSize: 22, marginRight: 8 }}>🌐</span>
              <span style={{ color: "#FFFFFF", fontSize: 20, fontWeight: 700 }}>{website}/kundli-milan</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <span style={{ color: "#25D366", fontSize: 22, marginRight: 8 }}>📞</span>
                <span style={{ color: "#DFBA73", fontSize: 18, fontWeight: 700 }}>{helpline1}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center" }}>
                <span style={{ color: "#25D366", fontSize: 22, marginRight: 8 }}>📞</span>
                <span style={{ color: "#DFBA73", fontSize: 18, fontWeight: 700 }}>{helpline2}</span>
              </div>
            </div>
          </div>
        </div>
      ),
      { width: 1080, height: 1080 }
    );
  } catch (err: any) {
    console.error("OG Image generation failed:", err);
    return new Response(`OG Image error: ${err.message}`, { status: 500 });
  }
}
