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
    // TEMPLATE 1: MORNING SUVICHAR / MATRIMONIAL WISDOM
    // -------------------------------------------------------------
    if (slot === "MORNING") {
      const quoteIndex = dayOfYear % MORNING_SUVICHAR.length;
      const suvichar = {
        hindi: searchParams.get("hindi") || MORNING_SUVICHAR[quoteIndex].hindi,
        english: searchParams.get("english") || MORNING_SUVICHAR[quoteIndex].english,
        topic: searchParams.get("topic") || MORNING_SUVICHAR[quoteIndex].topic,
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
              backgroundImage: "radial-gradient(circle at 50% 30%, #681523 0%, #4A0E17 65%, #2B070E 100%)",
              padding: "60px",
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
                top: "20px",
                left: "20px",
                right: "20px",
                bottom: "20px",
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
                paddingBottom: "24px",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", alignItems: "baseline" }}>
                  <span style={{ fontSize: 44, fontWeight: 900, color: "#FFFFFF", letterSpacing: "-1px" }}>
                    Rishte
                  </span>
                  <span style={{ fontSize: 44, fontWeight: 900, color: "#DFBA73", letterSpacing: "-1px" }}>
                    Club
                  </span>
                  <span style={{ fontSize: 16, color: "#DFBA73", fontWeight: 700, marginLeft: 4 }}>™</span>
                </div>
                <span style={{ fontSize: 14, color: "#DFBA73", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase" }}>
                  Managed by NNVS Matrimony
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  backgroundColor: "rgba(223, 186, 115, 0.15)",
                  border: "1px solid #DFBA73",
                  borderRadius: "30px",
                  padding: "8px 24px",
                }}
              >
                <span style={{ color: "#DFBA73", fontSize: 18, fontWeight: 700 }}>
                  🙏 जय श्री श्याम 🙏
                </span>
              </div>
            </div>

            {/* Middle Content: Suvichar Card */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                padding: "20px 40px",
                margin: "auto 0",
              }}
            >
              {/* Badge */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  backgroundColor: "#DFBA73",
                  color: "#4A0E17",
                  padding: "6px 20px",
                  borderRadius: "20px",
                  fontSize: 15,
                  fontWeight: 900,
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  marginBottom: "28px",
                }}
              >
                ✦ आज का विचार • {suvichar.topic} ✦
              </div>

              {/* Decorative Quotation Mark */}
              <div
                style={{
                  fontSize: 70,
                  lineHeight: 1,
                  color: "#DFBA73",
                  opacity: 0.6,
                  marginBottom: "-10px",
                }}
              >
                “
              </div>

              {/* Hindi Wisdom Text */}
              <div
                style={{
                  fontSize: 32,
                  lineHeight: 1.5,
                  color: "#FFFFFF",
                  fontWeight: 700,
                  marginBottom: "24px",
                  maxWidth: "880px",
                  textShadow: "0 2px 4px rgba(0,0,0,0.5)",
                }}
              >
                {suvichar.hindi}
              </div>

              {/* English Sub-Translation */}
              <div
                style={{
                  fontSize: 19,
                  lineHeight: 1.5,
                  color: "#E8D8C0",
                  fontStyle: "italic",
                  maxWidth: "820px",
                  borderTop: "1px solid rgba(223, 186, 115, 0.3)",
                  paddingTop: "20px",
                }}
              >
                &ldquo;{suvichar.english}&rdquo;
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
                <span style={{ color: "#FFFFFF", fontSize: 20, fontWeight: 700 }}>{website}</span>
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
    // TEMPLATE 2: AFTERNOON ANONYMOUS CANDIDATE PROFILE CARD
    // -------------------------------------------------------------
    if (slot === "AFTERNOON") {
      const isFemale = (searchParams.get("gender") || "FEMALE").toUpperCase() === "FEMALE";
      const displayId = searchParams.get("id") || `RC${Math.floor(1000 + Math.random() * 9000)}`;
      const age = searchParams.get("age") || "26";
      const height = searchParams.get("height") || (isFemale ? "5'4\"" : "5'11\"");
      const profession = searchParams.get("profession") || "Software Professional / MNC";
      const education = searchParams.get("education") || "B.Tech / Post Graduate";
      const city = searchParams.get("city") || "Delhi NCR / Gurugram";
      const caste = searchParams.get("caste") || "Baniya / Agarwal";
      const gotra = searchParams.get("gotra") || "Garg Gotra";
      const manglik = searchParams.get("manglik") || "Non-Manglik";

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
              backgroundImage: "radial-gradient(circle at 50% 25%, #63121F 0%, #4A0E17 65%, #250409 100%)",
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
                  Apno Ke Liye Sahi Rishta
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
                <span style={{ color: "#10B981", fontSize: 16, fontWeight: 800, marginRight: 6 }}>✓</span>
                <span style={{ color: "#FFFFFF", fontSize: 16, fontWeight: 800 }}>100% VERIFIED PROFILE</span>
              </div>
            </div>

            {/* Candidate Feature Box */}
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
              {/* Category & Candidate Code */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
                <div
                  style={{
                    backgroundColor: isFemale ? "#E11D48" : "#2563EB",
                    color: "#FFFFFF",
                    padding: "8px 22px",
                    borderRadius: "14px",
                    fontSize: 20,
                    fontWeight: 900,
                    letterSpacing: "1px",
                  }}
                >
                  {isFemale ? "वधू (BRIDE CANDIDATE)" : "वर (GROOM CANDIDATE)"}
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: "#DFBA73",
                    color: "#4A0E17",
                    padding: "8px 20px",
                    borderRadius: "14px",
                    fontSize: 20,
                    fontWeight: 900,
                    fontFamily: "monospace",
                  }}
                >
                  ID: #{displayId}
                </div>
              </div>

              {/* Data Grid: 6 Distinct Parameter Cards */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginBottom: "22px" }}>
                {/* Age & Height */}
                <div
                  style={{
                    width: "48%",
                    display: "flex",
                    flexDirection: "column",
                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(223, 186, 115, 0.3)",
                    borderRadius: "14px",
                    padding: "16px 20px",
                  }}
                >
                  <span style={{ color: "#DFBA73", fontSize: 14, fontWeight: 700, textTransform: "uppercase" }}>
                    Age & Height
                  </span>
                  <span style={{ color: "#FFFFFF", fontSize: 24, fontWeight: 800, marginTop: "4px" }}>
                    {age} Yrs • {height}
                  </span>
                </div>

                {/* Community & Gotra */}
                <div
                  style={{
                    width: "48%",
                    display: "flex",
                    flexDirection: "column",
                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(223, 186, 115, 0.3)",
                    borderRadius: "14px",
                    padding: "16px 20px",
                  }}
                >
                  <span style={{ color: "#DFBA73", fontSize: 14, fontWeight: 700, textTransform: "uppercase" }}>
                    Community & Gotra
                  </span>
                  <span style={{ color: "#FFFFFF", fontSize: 22, fontWeight: 800, marginTop: "4px" }}>
                    {caste} • {gotra}
                  </span>
                </div>

                {/* Profession / Role */}
                <div
                  style={{
                    width: "48%",
                    display: "flex",
                    flexDirection: "column",
                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(223, 186, 115, 0.3)",
                    borderRadius: "14px",
                    padding: "16px 20px",
                  }}
                >
                  <span style={{ color: "#DFBA73", fontSize: 14, fontWeight: 700, textTransform: "uppercase" }}>
                    Profession / Job
                  </span>
                  <span style={{ color: "#FFFFFF", fontSize: 22, fontWeight: 800, marginTop: "4px" }}>
                    {profession}
                  </span>
                </div>

                {/* Education */}
                <div
                  style={{
                    width: "48%",
                    display: "flex",
                    flexDirection: "column",
                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(223, 186, 115, 0.3)",
                    borderRadius: "14px",
                    padding: "16px 20px",
                  }}
                >
                  <span style={{ color: "#DFBA73", fontSize: 14, fontWeight: 700, textTransform: "uppercase" }}>
                    Education
                  </span>
                  <span style={{ color: "#FFFFFF", fontSize: 22, fontWeight: 800, marginTop: "4px" }}>
                    {education}
                  </span>
                </div>

                {/* City / Base Location */}
                <div
                  style={{
                    width: "48%",
                    display: "flex",
                    flexDirection: "column",
                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(223, 186, 115, 0.3)",
                    borderRadius: "14px",
                    padding: "16px 20px",
                  }}
                >
                  <span style={{ color: "#DFBA73", fontSize: 14, fontWeight: 700, textTransform: "uppercase" }}>
                    Location / City
                  </span>
                  <span style={{ color: "#FFFFFF", fontSize: 22, fontWeight: 800, marginTop: "4px" }}>
                    {city}
                  </span>
                </div>

                {/* Manglik Status */}
                <div
                  style={{
                    width: "48%",
                    display: "flex",
                    flexDirection: "column",
                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(223, 186, 115, 0.3)",
                    borderRadius: "14px",
                    padding: "16px 20px",
                  }}
                >
                  <span style={{ color: "#DFBA73", fontSize: 14, fontWeight: 700, textTransform: "uppercase" }}>
                    Astrological Status
                  </span>
                  <span style={{ color: "#FFFFFF", fontSize: 22, fontWeight: 800, marginTop: "4px" }}>
                    {manglik}
                  </span>
                </div>
              </div>

              {/* Privacy Notice Bar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(223, 186, 115, 0.12)",
                  border: "1px dashed rgba(223, 186, 115, 0.6)",
                  borderRadius: "12px",
                  padding: "10px 16px",
                  color: "#E8D8C0",
                  fontSize: 15,
                  textAlign: "center",
                }}
              >
                🔒 Anonymous for Candidate Privacy • Contact via RishteClub Matchmakers
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
                <span style={{ color: "#FFFFFF", fontSize: 20, fontWeight: 700 }}>{website}</span>
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
                    ✦
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
              <span style={{ color: "#FFFFFF", fontSize: 20, fontWeight: 700 }}>{website}/astrology</span>
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
