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
  displayName?: string;
  fullName: string;
  gender: "MALE" | "FEMALE";
  age: string;
  height: string;
  caste: string;
  profession: string;
  city: string;
  education?: string;
  photoUrl?: string;
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

type SocialCategoryType = "PROFILE_SPOTLIGHT" | "OFFER_99" | "KUNDLI_MILAN" | "TRUST_VERIFIED";

export default function SocialAutomationPage() {
  const [loading, setLoading] = useState(true);
  const [autoPostingEnabled, setAutoPostingEnabled] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [metaConfig, setMetaConfig] = useState<MetaConfigState | null>(null);
  const [logs, setLogs] = useState<SocialLog[]>([]);
  const [candidates, setCandidates] = useState<CandidateOption[]>([]);
  const [defaultCaptions, setDefaultCaptions] = useState<Record<string, string>>({});

  // Studio Test State
  const [selectedSlot, setSelectedSlot] = useState<SocialCategoryType>("PROFILE_SPOTLIGHT");
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>("");
  const [dryRun, setDryRun] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<any>(null);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [showConfigGuide, setShowConfigGuide] = useState(false);

  // Compute live OG Image Preview URL
  const previewCandidate =
    selectedSlot === "PROFILE_SPOTLIGHT"
      ? candidates.find((c) => c.id === selectedCandidateId) || candidates[0]
      : undefined;

  const computePreviewImageUrl = () => {
    const params = new URLSearchParams();

    if (selectedSlot === "PROFILE_SPOTLIGHT" && previewCandidate && previewCandidate.photoUrl) {
      params.set("slot", "PROFILE_SPOTLIGHT");
      params.set("id", previewCandidate.displayId);
      params.set("name", previewCandidate.displayName || previewCandidate.fullName);
      params.set("gender", previewCandidate.gender);
      params.set("age", previewCandidate.age);
      params.set("height", previewCandidate.height);
      params.set("profession", previewCandidate.profession);
      params.set("education", previewCandidate.education || "Graduate");
      params.set("city", previewCandidate.city);
      params.set("caste", previewCandidate.caste);
      params.set("photo", previewCandidate.photoUrl);
    } else {
      params.set("slot", selectedSlot);
    }
    return `/api/og/social-post?${params.toString()}`;
  };

  const [previewUrl, setPreviewUrl] = useState("/api/og/social-post?slot=OFFER_99");

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
        if (data.defaultCaptions) {
          setDefaultCaptions(data.defaultCaptions);
        }
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
          candidateId: selectedSlot === "PROFILE_SPOTLIGHT" ? selectedCandidateId || undefined : undefined,
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
              Automatically renders scroll-stopping 1080x1080 graphics in Royal Navy, Deep Maroon, and Gold accents and rotates across 4 high-converting categories every 2 hours on Instagram Business and Facebook Page.
            </p>
          </div>

          {/* Master Auto-Posting Toggle Switch */}
          <div className="flex items-center gap-4 bg-black/30 p-4 rounded-2xl border border-white/10 shrink-0">
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wider">
                Automated 2-Hour Rotation
              </p>
              <p className="text-[11px] text-[#DFBA73]">
                {autoPostingEnabled ? "Active (4-Way Rotation Engine)" : "Paused by Administrator"}
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

      {/* 4 Content Category Engine Cards (Rotate Every 2 Hours) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Category A: Female Bride Spotlight */}
        <div className="rounded-2xl bg-white border border-[#E8DCC8] p-5 shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Category A</span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              2-Hr Cycle
            </span>
          </div>
          <div>
            <h3 className="font-serif-luxury text-base font-bold text-[#4A121A] flex items-center gap-1.5">
              <span>👰 Female Bride Spotlight</span>
            </h3>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              Verified &amp; consented bride postcard with high-res framed photo, bio &amp; helpline.
            </p>
          </div>
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
            <span>CTA: /register</span>
            <button
              type="button"
              onClick={() => setSelectedSlot("PROFILE_SPOTLIGHT")}
              className="text-[#4A121A] font-bold hover:underline cursor-pointer"
            >
              Preview →
            </button>
          </div>
        </div>

        {/* Category B: ₹99 Launch Offer */}
        <div className="rounded-2xl bg-white border border-[#E8DCC8] p-5 shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Flame className="h-3 w-3" />
              <span>Category B</span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              2-Hr Cycle
            </span>
          </div>
          <div>
            <h3 className="font-serif-luxury text-base font-bold text-[#4A121A] flex items-center gap-1.5">
              <span>🎉 ₹99 Launch Offer</span>
            </h3>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              &ldquo;Get Direct Verified Match Contacts at just ₹99&rdquo; festive pricing showcase.
            </p>
          </div>
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
            <span>CTA: rishteclub.com</span>
            <button
              type="button"
              onClick={() => setSelectedSlot("OFFER_99")}
              className="text-[#4A121A] font-bold hover:underline cursor-pointer"
            >
              Preview →
            </button>
          </div>
        </div>

        {/* Category C: Free Kundali Milan */}
        <div className="rounded-2xl bg-white border border-[#E8DCC8] p-5 shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              <span>Category C</span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              2-Hr Cycle
            </span>
          </div>
          <div>
            <h3 className="font-serif-luxury text-base font-bold text-[#4A121A] flex items-center gap-1.5">
              <span>🔮 Free Kundali Milan</span>
            </h3>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              &ldquo;100% Free &amp; Accurate 36 Guna Ashtakoot Matching&rdquo; celestial Navy &amp; Gold card.
            </p>
          </div>
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
            <span>CTA: /kundali</span>
            <button
              type="button"
              onClick={() => setSelectedSlot("KUNDLI_MILAN")}
              className="text-[#4A121A] font-bold hover:underline cursor-pointer"
            >
              Preview →
            </button>
          </div>
        </div>

        {/* Category D: Verified Profiles & Trust */}
        <div className="rounded-2xl bg-white border border-[#E8DCC8] p-5 shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" />
              <span>Category D</span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              2-Hr Cycle
            </span>
          </div>
          <div>
            <h3 className="font-serif-luxury text-base font-bold text-[#4A121A] flex items-center gap-1.5">
              <span>🛡️ Verified Profiles &amp; Trust</span>
            </h3>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              &ldquo;100% Manually Verified Matches | Direct Family Connect&rdquo; trust shield card.
            </p>
          </div>
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
            <span>CTA: /register &amp; /kundali</span>
            <button
              type="button"
              onClick={() => setSelectedSlot("TRUST_VERIFIED")}
              className="text-[#4A121A] font-bold hover:underline cursor-pointer"
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

          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1 bg-[#FAF6EF] p-1.5 rounded-2xl border border-[#DACBB4]">
            {(
              [
                { id: "PROFILE_SPOTLIGHT", label: "👰 Bride Spotlight" },
                { id: "OFFER_99", label: "🎉 ₹99 Launch Offer" },
                { id: "KUNDLI_MILAN", label: "🔮 Free Kundali" },
                { id: "TRUST_VERIFIED", label: "🛡️ Trust & Verified" },
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

        {/* Female Bride Selector Option */}
        {selectedSlot === "PROFILE_SPOTLIGHT" && (
          <div className="p-4 rounded-2xl bg-[#FAF6EF] border border-[#DACBB4] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <label className="block text-xs font-bold text-[#7A5835] uppercase tracking-wider mb-1">
                Select Verified Consented Bride from Database
              </label>
              <select
                value={selectedCandidateId}
                onChange={(e) => setSelectedCandidateId(e.target.value)}
                className="w-full sm:w-96 rounded-xl border border-[#DACBB4] bg-white px-3 py-2 text-xs font-bold text-[#2D221E] focus:outline-none"
              >
                <option value="">Auto-Select Verified Bride (With Approved Photo)</option>
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.displayName || c.fullName} ({c.displayId}) • {c.age} Yrs • {c.city}
                  </option>
                ))}
              </select>
            </div>
            <span className="text-[11px] text-gray-500 italic">
              Strict privacy consent enforced • Personal phone numbers remain hidden
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
                {selectedSlot === "PROFILE_SPOTLIGHT" && (
                  <>
                    ✨ वधू प्रोफाइल (Verified Bride Spotlight) — RishteClub Matrimony ✨{"\n"}
                    पारिवारिक मूल्यों और विश्वास पर आधारित 100% सत्यापित रिश्ता 💍{"\n\n"}
                    🆔 Profile ID: {previewCandidate?.displayId || "NNVS-G-XXXX"}{"\n"}
                    👰 Candidate: {previewCandidate?.displayName || "Verified Bride"} (Verified Bride){"\n"}
                    • 🎂 Age &amp; Height: {previewCandidate?.age || "26"} Yrs • {previewCandidate?.height || "5'4\""}{"\n"}
                    • 🎓 Education: {previewCandidate?.education || "Post Graduate"}{"\n"}
                    • 💼 Profession: {previewCandidate?.profession || "Working Professional"}{"\n"}
                    • 🏛️ Community: {previewCandidate?.caste || "Hindu"}{"\n"}
                    • 📍 Location: {previewCandidate?.city || "Delhi NCR"}{"\n\n"}
                    🔒 Privacy Guarantee: परिवार के फ़ोन नंबर केवल सत्यापित और रजिस्टर्ड परिवारों को ही उपलब्ध कराए जाते हैं — कोई दलाल या कमीशन नहीं!{"\n\n"}
                    👉 पूरी प्रोफाइल देखने और संपर्क करने के लिए विजिट करें: https://www.rishteclub.com/register{"\n\n"}
                    📞 WhatsApp &amp; Matchmaking Helpline:{"\n"}
                    • WhatsApp / Call: +91 9871592002 | +91 7015812359{"\n\n"}
                    #RishteClub #Matrimony #Shaadi #KundaliMilan #VerifiedMatches #BrideSpotlight #VerifiedBride #Vivah #HinduMatrimony #IndianWedding
                  </>
                )}

                {selectedSlot === "OFFER_99" && (
                  <>
                    {defaultCaptions.OFFER_99 ||
                      `🎉 धमाकेदार लॉन्च ऑफर! Get Direct Verified Match Contacts at just ₹99! 🎉\n\n👉 ऑफर का लाभ उठाने के लिए अभी रजिस्टर करें: https://www.rishteclub.com\n\n📞 WhatsApp Registration Support:\n• WhatsApp / Call: +91 9871592002 | +91 7015812359\n\n#RishteClub #Matrimony #Shaadi #KundaliMilan #VerifiedMatches`}
                  </>
                )}

                {selectedSlot === "KUNDLI_MILAN" && (
                  <>
                    {defaultCaptions.KUNDLI_MILAN ||
                      `🔮 RishteClub पर पाएं 100% Free & Accurate Kundali Matching! ✨\n\n👉 फ्री कुंडली मिलान के लिए क्लिक करें: https://www.rishteclub.com/kundali\n\n📞 WhatsApp & Astrology Helpline:\n• WhatsApp / Call: +91 9871592002 | +91 7015812359\n\n#RishteClub #Matrimony #Shaadi #KundaliMilan #VerifiedMatches`}
                  </>
                )}

                {selectedSlot === "TRUST_VERIFIED" && (
                  <>
                    {defaultCaptions.TRUST_VERIFIED ||
                      `🛡️ 100% Manually Verified Matches | Direct Family Connect — RishteClub Matrimony 💍\n\n👉 पूरी प्रोफाइल देखने और संपर्क करने के लिए विजिट करें: https://www.rishteclub.com/register\n👉 फ्री कुंडली मिलान के लिए क्लिक करें: https://www.rishteclub.com/kundali\n\n📞 WhatsApp & Matchmaker Support:\n• WhatsApp / Call: +91 9871592002 | +91 7015812359\n\n#RishteClub #Matrimony #Shaadi #KundaliMilan #VerifiedMatches`}
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
                            log.slot === "AFTERNOON" ||
                            log.slot === "SPOTLIGHT" ||
                            log.slot === "PROFILE_SPOTLIGHT"
                              ? "bg-rose-100 text-rose-800"
                              : log.slot === "OFFER_99" ||
                                log.slot === "PROMOTION" ||
                                log.slot === "EVENING"
                              ? "bg-amber-100 text-amber-800"
                              : log.slot === "MORNING" || log.slot === "KUNDLI_MILAN"
                              ? "bg-indigo-100 text-indigo-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {log.slot}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-700">
                        {log.triggeredBy === "CRON"
                          ? "⏰ Vercel Cron"
                          : log.triggeredBy === "ADMIN_FORCE"
                          ? "⚡ Force Trigger"
                          : "👤 Admin Test"}
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
