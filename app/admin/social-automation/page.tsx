"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Share2,
  Sparkles,
  Send,
  Eye,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  HelpCircle,
  Settings,
  Calendar,
  Image as ImageIcon,
  Flame,
  User,
  Radio,
} from "lucide-react";

interface CandidateOption {
  id: string;
  displayId: string;
  fullName: string;
  gender: "MALE" | "FEMALE";
  age: string;
  height: string;
  caste: string;
  profession: string;
  city: string;
}

interface SocialLog {
  id: string;
  slot: string;
  platform: string;
  imageUrl: string | null;
  caption: string | null;
  status: "SUCCESS" | "FAILED" | "SKIPPED";
  instagramMediaId: string | null;
  facebookPostId: string | null;
  error: string | null;
  candidateId: string | null;
  triggeredBy: string;
  createdAt: string;
}

interface MetaConfigState {
  isConfigured: boolean;
  hasFacebook: boolean;
  hasInstagram: boolean;
  hasToken: boolean;
  hasCronSecret: boolean;
  facebookPageId: string | null;
  instagramAccountId: string | null;
  appUrl: string;
}

export default function SocialAutomationPage() {
  const [loading, setLoading] = useState(true);
  const [autoPostingEnabled, setAutoPostingEnabled] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [metaConfig, setMetaConfig] = useState<MetaConfigState | null>(null);
  const [logs, setLogs] = useState<SocialLog[]>([]);
  const [candidates, setCandidates] = useState<CandidateOption[]>([]);

  // Studio Test State
  const [selectedSlot, setSelectedSlot] = useState<"MORNING" | "AFTERNOON" | "EVENING">("MORNING");
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>("");
  const [dryRun, setDryRun] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<any>(null);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [showConfigGuide, setShowConfigGuide] = useState(false);

  // Compute live OG Image Preview URL
  const computePreviewImageUrl = () => {
    const params = new URLSearchParams();
    params.set("slot", selectedSlot);

    if (selectedSlot === "AFTERNOON" && selectedCandidateId) {
      const cand = candidates.find((c) => c.id === selectedCandidateId);
      if (cand) {
        params.set("id", cand.displayId);
        params.set("gender", cand.gender);
        params.set("age", cand.age);
        params.set("height", cand.height);
        params.set("profession", cand.profession);
        params.set("city", cand.city);
        params.set("caste", cand.caste);
      }
    }
    return `/api/og/social-post?${params.toString()}`;
  };

  const [previewUrl, setPreviewUrl] = useState("/api/og/social-post?slot=MORNING");

  useEffect(() => {
    setPreviewUrl(computePreviewImageUrl());
  }, [selectedSlot, selectedCandidateId, candidates]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/social-automation", {
        cache: "no-store",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setAutoPostingEnabled(data.settings?.socialAutoPostingEnabled ?? true);
        setMetaConfig(data.metaConfig);
        setLogs(data.logs || []);
        setCandidates(data.candidates || []);
      }
    } catch (err) {
      console.error("Failed to load social automation state:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Toggle Auto-Posting
  const handleToggle = async (newVal: boolean) => {
    setToggling(true);
    try {
      const res = await fetch("/api/admin/social-automation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "toggle", enabled: newVal }),
      });
      const data = await res.json();
      if (data.success) {
        setAutoPostingEnabled(newVal);
      }
    } catch (err) {
      console.error("Failed to toggle auto-posting:", err);
    } finally {
      setToggling(false);
    }
  };

  // Handle Test Post Now
  const handleTestPost = async (isDryRun: boolean) => {
    setPublishing(true);
    setPublishResult(null);
    try {
      const res = await fetch("/api/admin/social-automation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "test_post",
          slot: selectedSlot,
          candidateId: selectedSlot === "AFTERNOON" ? selectedCandidateId || undefined : undefined,
          dryRun: isDryRun,
        }),
      });
      const data = await res.json();
      setPublishResult(data);
      // Reload logs after post
      loadData();
    } catch (err: any) {
      setPublishResult({ success: false, error: err.message || "Failed to trigger post" });
    } finally {
      setPublishing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner & Control Header */}
      <div className="rounded-3xl bg-gradient-to-r from-[#4A0E17] via-[#5F1824] to-[#4A0E17] p-6 sm:p-8 text-white shadow-xl border border-[#6B1F2D]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DFBA73]/20 border border-[#DFBA73]/40 text-[#DFBA73] text-xs font-bold tracking-wide">
                <Radio className="h-3.5 w-3.5 animate-pulse" />
                <span>Hands-Off Social Media Auto-Poster</span>
              </span>
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                  metaConfig?.isConfigured
                    ? "bg-emerald-500/20 border border-emerald-400/40 text-emerald-300"
                    : "bg-amber-500/20 border border-amber-400/40 text-amber-200"
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>{metaConfig?.isConfigured ? "Meta Graph API Connected" : "Meta Config Simulated / Pending"}</span>
              </span>
            </div>

            <h1 className="font-serif-luxury text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Meta Auto-Poster &amp; Dynamic Image Studio
            </h1>
            <p className="text-xs sm:text-sm text-[#E8D8C0] max-w-2xl leading-relaxed">
              Automatically renders dynamic 1080x1080 graphics in royal maroon with gold accents and publishes daily updates to Instagram Business and Facebook Page at 09:30 AM, 02:00 PM, and 07:30 PM IST.
            </p>
          </div>

          {/* Master Auto-Posting Toggle Switch */}
          <div className="flex items-center gap-4 bg-black/30 p-4 rounded-2xl border border-white/10 shrink-0">
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wider">
                Daily Cron Auto-Posting
              </p>
              <p className="text-[11px] text-[#DFBA73]">
                {autoPostingEnabled ? "Active (3x Daily IST)" : "Paused by Administrator"}
              </p>
            </div>

            <button
              type="button"
              disabled={toggling}
              onClick={() => handleToggle(!autoPostingEnabled)}
              className={`relative inline-flex h-8 w-16 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                autoPostingEnabled ? "bg-emerald-500" : "bg-gray-600"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  autoPostingEnabled ? "translate-x-8" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* 3 Daily Schedules Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Slot 1: Morning */}
        <div className="rounded-2xl bg-white border border-[#E8DCC8] p-5 shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>09:30 AM IST</span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Slot 1
            </span>
          </div>
          <div>
            <h3 className="font-serif-luxury text-base font-bold text-[#4A121A] flex items-center gap-1.5">
              <span>🌅 Matrimonial Wisdom</span>
            </h3>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              Inspirational daily Suvichar on mutual respect, family values, and sacred companionship.
            </p>
          </div>
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
            <span>Theme: Royal Maroon &amp; Gold</span>
            <button
              type="button"
              onClick={() => setSelectedSlot("MORNING")}
              className="text-[#4A121A] font-bold hover:underline"
            >
              Preview →
            </button>
          </div>
        </div>

        {/* Slot 2: Afternoon */}
        <div className="rounded-2xl bg-white border border-[#E8DCC8] p-5 shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>02:00 PM IST</span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Slot 2
            </span>
          </div>
          <div>
            <h3 className="font-serif-luxury text-base font-bold text-[#4A121A] flex items-center gap-1.5">
              <span>☀️ Candidate Profile Card</span>
            </h3>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              Anonymous verified candidate card featuring Age, Height, Gotra, Profession, and City.
            </p>
          </div>
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
            <span>Database Candidate Rotation</span>
            <button
              type="button"
              onClick={() => setSelectedSlot("AFTERNOON")}
              className="text-[#4A121A] font-bold hover:underline"
            >
              Preview →
            </button>
          </div>
        </div>

        {/* Slot 3: Evening */}
        <div className="rounded-2xl bg-white border border-[#E8DCC8] p-5 shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>07:30 PM IST</span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Slot 3
            </span>
          </div>
          <div>
            <h3 className="font-serif-luxury text-base font-bold text-[#4A121A] flex items-center gap-1.5">
              <span>🌙 36 Guna Milan &amp; Astrology</span>
            </h3>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              Vedic Ashtakoota compatibility facts, Manglik insights, and Lal Kitab remedies.
            </p>
          </div>
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
            <span>Directs to /astrology</span>
            <button
              type="button"
              onClick={() => setSelectedSlot("EVENING")}
              className="text-[#4A121A] font-bold hover:underline"
            >
              Preview →
            </button>
          </div>
        </div>
      </div>

      {/* Meta API Configuration Status Strip */}
      <div className="rounded-2xl bg-[#FAF5EB] border border-[#DACBB4] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-[#4A121A] text-[#DFBA73] flex items-center justify-center shrink-0">
            <Settings className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#4A121A]">
              Meta Graph API Connectivity Status
            </p>
            <p className="text-[11px] text-gray-600">
              Facebook Page:{" "}
              <span className="font-mono font-semibold">
                {metaConfig?.facebookPageId ? `Linked (${metaConfig.facebookPageId})` : "Not Configured"}
              </span>{" "}
              • Instagram Business:{" "}
              <span className="font-mono font-semibold">
                {metaConfig?.instagramAccountId ? `Linked (${metaConfig.instagramAccountId})` : "Not Configured"}
              </span>{" "}
              • Token:{" "}
              <span className="font-semibold text-emerald-700">
                {metaConfig?.hasToken ? "Active" : "Missing / Dry Run Fallback"}
              </span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowConfigGuide(!showConfigGuide)}
          className="text-xs font-bold text-[#4A121A] hover:underline flex items-center gap-1 self-start sm:self-auto cursor-pointer"
        >
          <HelpCircle className="h-3.5 w-3.5 text-[#C5A059]" />
          <span>{showConfigGuide ? "Hide Setup Guide" : "View Meta Setup Guide"}</span>
        </button>
      </div>

      {/* Setup Guide Accordion */}
      {showConfigGuide && (
        <div className="rounded-2xl bg-white border border-[#DACBB4] p-5 shadow-sm space-y-3 text-xs text-gray-700 animate-in fade-in">
          <h4 className="font-bold text-sm text-[#4A121A]">
            Configuring Meta Graph API Credentials in Vercel / Environment
          </h4>
          <p>
            To post live to your Instagram Business account and Facebook Page, provide the following environment variables in your Vercel project settings or <code className="bg-gray-100 px-1.5 py-0.5 rounded text-red-600">.env</code>:
          </p>
          <div className="space-y-1.5 font-mono text-[11px] bg-stone-900 text-stone-200 p-4 rounded-xl">
            <p><span className="text-amber-400">META_PAGE_ACCESS_TOKEN</span>=&quot;EAA... (Never-expiring Page Access Token)&quot;</p>
            <p><span className="text-amber-400">META_PAGE_ID</span>=&quot;1000... (Your Facebook Page Numerical ID)&quot;</p>
            <p><span className="text-amber-400">INSTAGRAM_BUSINESS_ACCOUNT_ID</span>=&quot;1784... (Instagram Business ID linked to Page)&quot;</p>
            <p><span className="text-amber-400">CRON_SECRET</span>=&quot;any_strong_random_secret_string&quot;</p>
          </div>
          <p className="text-[11px] text-gray-500">
            * Note: When Meta credentials are absent or during local development, the engine automatically runs in <strong>Safe Dry Run Mode</strong> with zero crashes and records logs accurately.
          </p>
        </div>
      )}

      {/* ========================================================= */}
      {/* TEST POST STUDIO WITH LIVE 1080x1080 PREVIEW              */}
      {/* ========================================================= */}
      <div className="rounded-3xl bg-white border border-[#E8DCC8] shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#F0E6D6] gap-3">
          <div>
            <h2 className="font-serif-luxury text-xl font-bold text-[#4A121A] flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#C5A059]" />
              <span>Test Post Studio &amp; Live Graphic Preview</span>
            </h2>
            <p className="text-xs text-gray-500">
              Inspect the exact 1080x1080 graphic and caption before triggering a test publish
            </p>
          </div>

          {/* Slot Tabs */}
          <div className="flex items-center gap-1 bg-[#FAF6EF] p-1.5 rounded-2xl border border-[#DACBB4]">
            {(
              [
                { id: "MORNING", label: "🌅 Morning Suvichar" },
                { id: "AFTERNOON", label: "☀️ Afternoon Profile" },
                { id: "EVENING", label: "🌙 Evening Astrology" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedSlot(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedSlot === tab.id
                    ? "bg-[#4A121A] text-white shadow-xs"
                    : "text-[#5A4E48] hover:bg-[#F2E8D7]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Afternoon Candidate Selector Option */}
        {selectedSlot === "AFTERNOON" && (
          <div className="p-4 rounded-2xl bg-[#FAF6EF] border border-[#DACBB4] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <label className="block text-xs font-bold text-[#7A5835] uppercase tracking-wider mb-1">
                Select Candidate from Database
              </label>
              <select
                value={selectedCandidateId}
                onChange={(e) => setSelectedCandidateId(e.target.value)}
                className="w-full sm:w-96 rounded-xl border border-[#DACBB4] bg-white px-3 py-2 text-xs font-bold text-[#2D221E] focus:outline-none"
              >
                <option value="">Auto-Select Latest Verified Candidate</option>
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} ({c.displayId}) • {c.gender} • {c.caste} • {c.city}
                  </option>
                ))}
              </select>
            </div>
            <span className="text-[11px] text-gray-500 italic">
              Data is automatically anonymized on the 1080x1080 card for privacy
            </span>
          </div>
        )}

        {/* Dual Live Preview Layout: Graphic (Left) & Caption (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: 1080x1080 Rendered Graphic Frame */}
          <div className="lg:col-span-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#7A5835] uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="h-4 w-4 text-[#C5A059]" />
                <span>Live 1080x1080 Image Preview</span>
              </span>
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-[#4A121A] hover:underline flex items-center gap-1"
              >
                <span>Full Resolution (1080x1080)</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {/* Responsive 1:1 Aspect Ratio Frame */}
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden border-2 border-[#C5A059] shadow-lg bg-[#4A0E17]">
              <img
                src={previewUrl}
                alt="Social Media Post Graphic Preview"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Right: Caption Preview & Controls */}
          <div className="lg:col-span-6 space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#7A5835] uppercase tracking-wider">
                  Auto-Generated Social Caption
                </span>
                <button
                  type="button"
                  onClick={() => {
                    // Fetch or generate caption
                    const captionEl = document.getElementById("caption-preview-box");
                    if (captionEl) copyToClipboard(captionEl.innerText);
                  }}
                  className="text-xs font-bold text-[#4A121A] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {copiedCaption ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-[#C5A059]" />
                      <span>Copy Caption</span>
                    </>
                  )}
                </button>
              </div>

              {/* Caption Preview Box */}
              <div
                id="caption-preview-box"
                className="rounded-2xl bg-[#FAF6EF] border border-[#DACBB4] p-4 text-xs font-mono text-gray-800 whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto"
              >
                {selectedSlot === "MORNING" && (
                  <>
                    🙏 सुप्रभात • आज का पावन विचार • RishteClub Matrimony 🙏{"\n\n"}
                    &ldquo;विवाह केवल दो व्यक्तियों का नहीं, बल्कि दो परिवारों और दो आत्माओं का पवित्र संगम है। जहाँ सम्मान और विश्वास हो, वही रिश्ता स्वर्ग बनता है।&rdquo;{"\n\n"}
                    ✨ अपनों के लिए सही रिश्ता — सरलता, गरिमा और विश्वास के साथ।{"\n\n"}
                    📞 WhatsApp / Call Helpline:{"\n"}
                    • +91 9871592002{"\n"}
                    • +91 7015812359{"\n\n"}
                    🌐 100% Verified Profiles: https://www.rishteclub.com{"\n\n"}
                    #RishteClub #Suvichar #Matrimony #Shaadi #VivahSewa #GoodMorning #IndianWedding #HinduMatrimony #Rishtey
                  </>
                )}

                {selectedSlot === "AFTERNOON" && (
                  <>
                    ✨ 100% VERIFIED CANDIDATE PROFILE HIGHLIGHT ✨{"\n"}
                    Platform: RishteClub Matrimony (Managed by NNVS Matrimony){"\n\n"}
                    👤 Candidate: Verified Match Candidate{"\n"}
                    🎂 Age &amp; Height: 26 Yrs • 5&apos;5&quot;{"\n"}
                    🏛️ Community: Agarwal / Baniya (Garg Gotra){"\n"}
                    💼 Profession: Working Professional / MNC{"\n"}
                    📍 City / Location: Delhi NCR / Haryana{"\n\n"}
                    🔒 Privacy Note: Candidate profile is anonymized for privacy. Complete biodata with family background is available to verified members on RishteClub.{"\n\n"}
                    📞 Contact Our Matchmaker Helpline:{"\n"}
                    • WhatsApp: +91 9871592002{"\n"}
                    • Calling: +91 7015812359{"\n\n"}
                    🌐 View Profiles &amp; Register: https://www.rishteclub.com/profiles{"\n\n"}
                    #RishteClub #MatrimonialProfile #GroomBiodata #BrideBiodata #HinduMatrimony #DelhiNCRMatrimony #Shaadi #Rishtey
                  </>
                )}

                {selectedSlot === "EVENING" && (
                  <>
                    ✨ वैदिक ज्योतिष एवं कुंडली मिलान अंतर्दृष्टि ✨{"\n"}
                    RishteClub AI Kundli Milan &amp; Vedic Insights{"\n\n"}
                    ⭐ 36 Guna Ashtakoota Milan: विवाह से पूर्व दोनों कुंडलियों का अष्टकूट मिलान (वर्ण, वश्य, तारा, योनि, ग्रह मैत्री, गण, भकूट, नाड़ी) मानसिक, शारीरिक और पारिवारिक सामंजस्य का दर्पण है।{"\n\n"}
                    🌿 लाल किताब सरल समाधान: यदि नाड़ी या भकूट में मतभेद हो, तो भयभीत होने के बजाय शास्त्रीय नियमों और सरल लाल किताब उपायों से समाधान संभव है।{"\n\n"}
                    🔮 Free AI Kundli Milan: अपनी व अपने जीवनसाथी की जन्म तिथि डालकर तुरंत 36 गुण व मांगलिक विश्लेषण प्राप्त करें।{"\n\n"}
                    📞 Astrological Query Helpline:{"\n"}
                    • +91 9871592002 | +91 7015812359{"\n\n"}
                    🌐 AI Kundli Milan Calculator: https://www.rishteclub.com/astrology{"\n\n"}
                    #RishteClub #KundaliMilan #36Guna #VedicAstrology #ManglikDosha #HoroscopeMatching #LalKitab #IndianWedding #Shaadi
                  </>
                )}
              </div>
            </div>

            {/* Test Publish Buttons */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={publishing}
                  onClick={() => handleTestPost(true)}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-[#4A121A] text-[#4A121A] hover:bg-[#FAF0DC] px-5 py-3 text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-60"
                >
                  <Eye className="h-4 w-4 text-[#C5A059]" />
                  <span>{publishing ? "Processing..." : "Dry Run Test (Simulate)"}</span>
                </button>

                <button
                  type="button"
                  disabled={publishing}
                  onClick={() => handleTestPost(false)}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#4A121A] hover:bg-[#3A0C13] text-white px-5 py-3 text-xs font-bold transition shadow-md cursor-pointer disabled:opacity-60"
                >
                  <Send className="h-4 w-4 text-[#DFBA73]" />
                  <span>{publishing ? "Publishing..." : "Publish Live to Meta"}</span>
                </button>
              </div>

              <p className="text-[11px] text-gray-500 text-center">
                Dry Run validates image generation and records the post log without making live network calls to Instagram / Facebook.
              </p>
            </div>

            {/* Publish Results Feedback Banner */}
            {publishResult && (
              <div
                className={`p-4 rounded-2xl border text-xs animate-in fade-in ${
                  publishResult.success
                    ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                    : "bg-rose-50 border-rose-300 text-rose-900"
                }`}
              >
                <div className="flex items-center gap-2 font-bold mb-1">
                  {publishResult.success ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-rose-600" />
                  )}
                  <span>
                    {publishResult.success
                      ? publishResult.dryRun
                        ? "Dry Run Simulation Successful! Log created."
                        : "Post Published Successfully to Meta Channels!"
                      : "Publishing Issue Encountered"}
                  </span>
                </div>

                <div className="space-y-1 text-[11px] mt-2">
                  <p>Slot: <strong>{publishResult.slot}</strong></p>
                  {publishResult.facebook?.postId && (
                    <p>Facebook Post ID: <span className="font-mono">{publishResult.facebook.postId}</span></p>
                  )}
                  {publishResult.instagram?.mediaId && (
                    <p>Instagram Media ID: <span className="font-mono">{publishResult.instagram.mediaId}</span></p>
                  )}
                  {publishResult.error && (
                    <p className="text-amber-800">Notice: {publishResult.error}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* RECENT SOCIAL AUTO-POST LOGS TABLE                        */}
      {/* ========================================================= */}
      <div className="rounded-3xl bg-white border border-[#E8DCC8] shadow-sm p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#F0E6D6]">
          <div>
            <h3 className="font-serif-luxury text-lg font-bold text-[#4A121A] flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#C5A059]" />
              <span>Social Media Post Logs &amp; Audit Trail</span>
            </h3>
            <p className="text-xs text-gray-500">
              Complete history of automated cron triggers and admin test posts
            </p>
          </div>

          <button
            type="button"
            onClick={loadData}
            className="px-3.5 py-1.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-[#FAF6EF] transition flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        {logs.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-500 bg-[#FAF6EF] rounded-2xl border border-dashed border-[#DACBB4]">
            No social posts logged yet. Click &ldquo;Dry Run Test&rdquo; or wait for the next scheduled cron window (09:30 AM, 02:00 PM, 07:30 PM IST).
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-[#DACBB4]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF5EB] text-[#7A5835] font-bold uppercase tracking-wider text-[11px] border-b border-[#DACBB4]">
                <tr>
                  <th className="px-4 py-3">Date &amp; Time (IST)</th>
                  <th className="px-4 py-3">Slot</th>
                  <th className="px-4 py-3">Triggered By</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Target Platform</th>
                  <th className="px-4 py-3">Meta Post IDs / Details</th>
                  <th className="px-4 py-3">Image Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0E6D6] text-[#2D221E]">
                {logs.map((log) => {
                  const dt = new Date(log.createdAt);
                  const formattedDate = dt.toLocaleString("en-IN", {
                    timeZone: "Asia/Kolkata",
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <tr key={log.id} className="hover:bg-[#FAF6EF]/60 transition">
                      <td className="px-4 py-3 font-mono font-medium text-gray-600">
                        {formattedDate}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`font-bold text-[10px] px-2.5 py-0.5 rounded-full ${
                            log.slot === "MORNING"
                              ? "bg-amber-100 text-amber-800"
                              : log.slot === "AFTERNOON"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {log.slot}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-700">
                        {log.triggeredBy === "CRON" ? "⏰ Vercel Cron" : "👤 Admin Test"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 font-bold text-[10px] px-2 py-0.5 rounded-full ${
                            log.status === "SUCCESS"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : log.status === "SKIPPED"
                              ? "bg-amber-100 text-amber-800 border border-amber-300"
                              : "bg-rose-100 text-rose-800 border border-rose-300"
                          }`}
                        >
                          {log.status === "SUCCESS" ? (
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          ) : log.status === "SKIPPED" ? (
                            <AlertTriangle className="h-3 w-3 text-amber-600" />
                          ) : (
                            <XCircle className="h-3 w-3 text-rose-600" />
                          )}
                          <span>{log.status}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-gray-600">
                        {log.platform}
                      </td>
                      <td className="px-4 py-3 max-w-xs truncate text-[11px] text-gray-600 font-mono">
                        {log.facebookPostId && <span>FB: {log.facebookPostId} </span>}
                        {log.instagramMediaId && <span>IG: {log.instagramMediaId}</span>}
                        {log.error && <span className="text-red-700">{log.error}</span>}
                      </td>
                      <td className="px-4 py-3">
                        {log.imageUrl ? (
                          <a
                            href={log.imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#4A121A] font-bold hover:underline flex items-center gap-1 text-[11px]"
                          >
                            <span>View</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
