"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Sparkles,
  Heart,
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  Phone,
  CheckCircle2,
  AlertTriangle,
  X,
  ArrowRight,
  User,
  Star,
  RefreshCw,
  Compass,
  Check,
} from "lucide-react";
import type { KundliMilanResult, AshtakootScore } from "@/lib/ashtakoot";

export default function KundliMilanPage() {
  // Partner Details State
  const [boyName, setBoyName] = useState("");
  const [boyDob, setBoyDob] = useState("");
  const [boyTime, setBoyTime] = useState("12:00");
  const [boyPlace, setBoyPlace] = useState("");

  const [girlName, setGirlName] = useState("");
  const [girlDob, setGirlDob] = useState("");
  const [girlTime, setGirlTime] = useState("12:00");
  const [girlPlace, setGirlPlace] = useState("");

  // OTP Verification State
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // Results & Lead State
  const [formError, setFormError] = useState("");
  const [verifiedPhone, setVerifiedPhone] = useState("");
  const [milanResult, setMilanResult] = useState<KundliMilanResult | null>(null);

  // Delayed Pricing Popup State (3-4 seconds delay)
  const [showPricingPopup, setShowPricingPopup] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Resend Countdown Timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Delayed Registration Popup Trigger (3.5 seconds)
  useEffect(() => {
    if (milanResult && verifiedPhone) {
      const popupTimer = setTimeout(() => {
        setShowPricingPopup(true);
      }, 3500);

      // Smooth scroll to results
      if (resultsRef.current) {
        resultsRef.current.scrollIntoView({ behavior: "smooth" });
      }

      return () => clearTimeout(popupTimer);
    }
  }, [milanResult, verifiedPhone]);

  // Handle Form Submission -> Open OTP Modal
  function handleInitiateMilan(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!boyName.trim() || !boyDob || !boyPlace.trim()) {
      setFormError("Please fill in all details for Groom (Boy) including Date of Birth and Birth City.");
      return;
    }

    if (!girlName.trim() || !girlDob || !girlPlace.trim()) {
      setFormError("Please fill in all details for Bride (Girl) including Date of Birth and Birth City.");
      return;
    }

    setIsOtpModalOpen(true);
    setOtpError("");
  }

  // Send OTP Handler
  async function handleSendOtp() {
    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setOtpError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    setSendingOtp(true);
    setOtpError("");

    try {
      const res = await fetch("/api/kundli/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: cleanPhone }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setOtpError(data.error || data.message || "Failed to send OTP. Please try again.");
        return;
      }

      setOtpSent(true);
      setResendCooldown(60);
    } catch {
      setOtpError("Network error while connecting to SMS gateway. Please try again.");
    } finally {
      setSendingOtp(false);
    }
  }

  // Verify OTP & Calculate Result Handler
  async function handleVerifyOtp() {
    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    const cleanOtp = otp.trim();

    if (!cleanOtp || cleanOtp.length < 4) {
      setOtpError("Please enter the complete OTP received on your mobile.");
      return;
    }

    setVerifyingOtp(true);
    setOtpError("");

    try {
      const payload = {
        phoneNumber: cleanPhone,
        otp: cleanOtp,
        boyName: boyName.trim(),
        boyDob,
        boyTime: boyTime || "12:00",
        boyPlace: boyPlace.trim(),
        girlName: girlName.trim(),
        girlDob,
        girlTime: girlTime || "12:00",
        girlPlace: girlPlace.trim(),
      };

      const res = await fetch("/api/kundli/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setOtpError(data.error || data.message || "Invalid OTP. Please verify and retry.");
        return;
      }

      setVerifiedPhone(data.verifiedPhone);
      setMilanResult(data.result);
      setIsOtpModalOpen(false);
    } catch {
      setOtpError("Network error during verification. Please try again.");
    } finally {
      setVerifyingOtp(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2A1A1F]">
      {/* Hero Header */}
      <section className="bg-gradient-to-b from-[#4A121A] via-[#5C1621] to-[#4A121A] text-white py-14 px-4 sm:px-6 lg:px-8 border-b border-[#C5A059]/30 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#C5A059_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#C5A059]/20 border border-[#C5A059]/40 text-[#DFBA73] text-xs font-semibold tracking-wider uppercase mb-4">
            <Sparkles className="w-4 h-4 text-[#DFBA73]" />
            100% Free & Accurate Vedic Matchmaking
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight font-serif text-[#FFFDF9]">
            Free Kundli Milan <span className="text-[#DFBA73]">(गुण मिलान)</span>
          </h1>
          <p className="mt-3.5 text-base sm:text-lg text-rose-100 max-w-2xl mx-auto">
            Traditional 36-Guna Ashtakoot matching and Manglik Dosha analysis for prospective brides and grooms according to Vedic astrology.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3 sm:gap-6 text-xs sm:text-sm text-rose-200">
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-[#DFBA73]" /> 36 Guna Ashtakoot Score
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-[#DFBA73]" /> Manglik Dosha Verification
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-[#DFBA73]" /> Nadi & Bhakoot Check
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-[#DFBA73]" /> Instant SMS Verification
            </span>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Input Form */}
        <form onSubmit={handleInitiateMilan} className="space-y-8">
          {formError && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-500" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Boy's Details Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#E8DFD3] p-6 sm:p-7 relative overflow-hidden">
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#F0E8DC]">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#4A121A]">Groom Details</h2>
                    <p className="text-xs text-[#7A5835]">लड़के का विवरण</p>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 font-semibold border border-blue-200">
                  Boy
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#4A3E39] mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter boy's full name"
                    value={boyName}
                    onChange={(e) => setBoyName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C5A059] bg-[#FFFDF9]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#4A3E39] mb-1.5 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#C5A059]" />
                      Date of Birth <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={boyDob}
                      onChange={(e) => setBoyDob(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C5A059] bg-[#FFFDF9]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#4A3E39] mb-1.5 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#C5A059]" />
                      Birth Time
                    </label>
                    <input
                      type="time"
                      value={boyTime}
                      onChange={(e) => setBoyTime(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C5A059] bg-[#FFFDF9]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#4A3E39] mb-1.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#C5A059]" />
                    Birth City / Place <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Delhi, Jaipur, Hisar"
                    value={boyPlace}
                    onChange={(e) => setBoyPlace(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C5A059] bg-[#FFFDF9]"
                  />
                </div>
              </div>
            </div>

            {/* Girl's Details Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#E8DFD3] p-6 sm:p-7 relative overflow-hidden">
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#F0E8DC]">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-700 flex items-center justify-center font-bold">
                    <Heart className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#4A121A]">Bride Details</h2>
                    <p className="text-xs text-[#7A5835]">लड़की का विवरण</p>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-pink-50 text-pink-800 font-semibold border border-pink-200">
                  Girl
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#4A3E39] mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter girl's full name"
                    value={girlName}
                    onChange={(e) => setGirlName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C5A059] bg-[#FFFDF9]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#4A3E39] mb-1.5 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#C5A059]" />
                      Date of Birth <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={girlDob}
                      onChange={(e) => setGirlDob(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C5A059] bg-[#FFFDF9]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#4A3E39] mb-1.5 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#C5A059]" />
                      Birth Time
                    </label>
                    <input
                      type="time"
                      value={girlTime}
                      onChange={(e) => setGirlTime(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C5A059] bg-[#FFFDF9]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#4A3E39] mb-1.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#C5A059]" />
                    Birth City / Place <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mumbai, Chandigarh, Hisar"
                    value={girlPlace}
                    onChange={(e) => setGirlPlace(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C5A059] bg-[#FFFDF9]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="text-center pt-2">
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl text-base font-bold bg-[#4A121A] text-white hover:bg-[#601722] active:scale-[0.99] transition-all shadow-md shadow-[#4A121A]/20 border border-[#C5A059]"
            >
              <Sparkles className="w-5 h-5 text-[#DFBA73]" />
              Match Kundli Free (गुण मिलान करें)
              <ArrowRight className="w-5 h-5 ml-1" />
            </button>
            <p className="mt-2.5 text-xs text-[#7A5835]">
              Quick 1-step phone verification required to view the full 36 Guna Ashtakoot report.
            </p>
          </div>
        </form>

        {/* Results Section */}
        {milanResult && (
          <div ref={resultsRef} className="mt-14 space-y-10 scroll-mt-6">
            {/* Overall Score Banner */}
            <div className="rounded-2xl bg-gradient-to-br from-white via-[#FFFDF9] to-[#FDF7EC] border-2 border-[#C5A059]/40 shadow-lg p-6 sm:p-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-[#E8DFD3]">
                <div className="text-center md:text-left space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#4A121A]/10 text-[#4A121A]">
                    <Star className="w-3.5 h-3.5 text-[#C5A059] fill-[#C5A059]" />
                    Astrological Kundli Milan Report
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[#4A121A] font-serif">
                    {milanResult.verdict}
                  </h2>
                  <p className="text-base font-medium text-[#7A5835]">
                    {milanResult.verdictHindi} – {milanResult.verdictDescription}
                  </p>
                </div>

                {/* Score Circular Callout */}
                <div className="flex-shrink-0 text-center px-6 py-4 rounded-2xl bg-[#4A121A] text-white shadow-md border border-[#C5A059]">
                  <span className="block text-xs uppercase tracking-wider text-[#DFBA73] font-semibold">
                    Total Guna Score
                  </span>
                  <div className="text-4xl sm:text-5xl font-extrabold text-[#FFFDF9] my-1">
                    {milanResult.totalScore} <span className="text-xl text-[#DFBA73]">/ {milanResult.maxScore}</span>
                  </div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#C5A059] text-[#4A121A]">
                    {milanResult.percentage}% Compatibility
                  </span>
                </div>
              </div>

              {/* Boy & Girl Planetary Snapshot */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200/60">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-900 block mb-1">
                    Groom (वर): {milanResult.boyInfo.name}
                  </span>
                  <div className="flex flex-wrap gap-2 text-xs text-[#4A3E39]">
                    <span className="bg-white px-2.5 py-1 rounded-md border border-gray-200">
                      Rasi: <strong>{milanResult.boyInfo.rasi}</strong>
                    </span>
                    <span className="bg-white px-2.5 py-1 rounded-md border border-gray-200">
                      Nakshatra: <strong>{milanResult.boyInfo.nakshatra} (Pada {milanResult.boyInfo.charan})</strong>
                    </span>
                    <span className="bg-white px-2.5 py-1 rounded-md border border-gray-200">
                      Lord: <strong>{milanResult.boyInfo.nakshatraLord}</strong>
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-pink-50/50 border border-pink-200/60">
                  <span className="text-xs font-bold uppercase tracking-wider text-pink-900 block mb-1">
                    Bride (कन्या): {milanResult.girlInfo.name}
                  </span>
                  <div className="flex flex-wrap gap-2 text-xs text-[#4A3E39]">
                    <span className="bg-white px-2.5 py-1 rounded-md border border-gray-200">
                      Rasi: <strong>{milanResult.girlInfo.rasi}</strong>
                    </span>
                    <span className="bg-white px-2.5 py-1 rounded-md border border-gray-200">
                      Nakshatra: <strong>{milanResult.girlInfo.nakshatra} (Pada {milanResult.girlInfo.charan})</strong>
                    </span>
                    <span className="bg-white px-2.5 py-1 rounded-md border border-gray-200">
                      Lord: <strong>{milanResult.girlInfo.nakshatraLord}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Manglik Dosha Summary Banner */}
              <div
                className={`mt-5 p-4 rounded-xl border flex items-start gap-3 ${
                  milanResult.manglikAnalysis.status === "NO_MANGLIK" ||
                  milanResult.manglikAnalysis.isCanceled
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : "bg-amber-50 border-amber-200 text-amber-900"
                }`}
              >
                <ShieldCheck
                  className={`w-6 h-6 flex-shrink-0 mt-0.5 ${
                    milanResult.manglikAnalysis.status === "NO_MANGLIK" ||
                    milanResult.manglikAnalysis.isCanceled
                      ? "text-emerald-600"
                      : "text-amber-600"
                  }`}
                />
                <div className="text-sm">
                  <strong className="block font-bold">
                    Manglik Dosha Analysis:{" "}
                    {milanResult.manglikAnalysis.status === "NO_MANGLIK"
                      ? "Non-Manglik"
                      : milanResult.manglikAnalysis.isCanceled
                      ? "Manglik Dosha Cancelled (Anukul)"
                      : "Manglik Consideration"}
                  </strong>
                  <p className="mt-0.5 opacity-90">{milanResult.manglikAnalysis.details}</p>
                </div>
              </div>
            </div>

            {/* Ashtakoot 8 Guna Cards */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-xl font-extrabold text-[#4A121A] font-serif">
                    Ashtakoot Guna Breakdown (36 Gunas)
                  </h3>
                  <p className="text-xs text-[#7A5835]">अष्टकूट गुण मिलान विवरण</p>
                </div>
                <span className="text-xs font-semibold text-[#4A121A] bg-[#DFBA73]/30 px-3 py-1 rounded-full border border-[#C5A059]">
                  Max Points: 36
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {milanResult.scores.map((koot: AshtakootScore) => (
                  <div
                    key={koot.name}
                    className="bg-white rounded-xl p-5 border border-[#E8DFD3] shadow-sm hover:shadow-md transition-shadow relative"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h4 className="font-bold text-base text-[#4A121A]">{koot.name}</h4>
                        <span className="text-xs text-[#7A5835] font-medium">{koot.nameHindi}</span>
                      </div>
                      <span
                        className={`text-sm font-extrabold px-2.5 py-0.5 rounded-full ${
                          koot.obtained === koot.total
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : koot.obtained > 0
                            ? "bg-blue-100 text-blue-800 border border-blue-300"
                            : "bg-red-100 text-red-800 border border-red-300"
                        }`}
                      >
                        {koot.obtained} / {koot.total}
                      </span>
                    </div>

                    <p className="text-xs text-[#4A3E39] mb-3 line-clamp-2">{koot.description}</p>

                    <div className="pt-2.5 border-t border-gray-100 text-xs space-y-1">
                      <div className="flex justify-between text-gray-500">
                        <span>Groom:</span>
                        <strong className="text-gray-800">{koot.boyAttribute}</strong>
                      </div>
                      <div className="flex justify-between text-gray-500">
                        <span>Bride:</span>
                        <strong className="text-gray-800">{koot.girlAttribute}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Register CTA Card */}
            <div className="rounded-2xl bg-[#4A121A] text-white p-6 sm:p-8 border-2 border-[#C5A059] shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left">
                <span className="inline-block text-xs uppercase tracking-wider text-[#DFBA73] font-bold">
                  Next Step in Your Matrimonial Journey
                </span>
                <h3 className="text-2xl font-extrabold font-serif text-[#FFFDF9]">
                  Find Verified Matches Compatible With Your Kundli
                </h3>
                <p className="text-sm text-rose-100 max-w-xl">
                  Register on RishteClub (NNVS Matrimony) to explore thousands of verified matrimonial biodatas across Agarwal, Baniya, Brahmin, Punjabi, and Khatri communities.
                </p>
              </div>

              <div className="flex-shrink-0">
                <Link
                  href={`/register?phone=${verifiedPhone}`}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm bg-[#DFBA73] text-[#4A121A] hover:bg-[#E6C280] active:scale-95 transition-all shadow-md"
                >
                  <Sparkles className="w-4 h-4" />
                  Register Profile Now
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* OTP Verification Modal */}
      {isOtpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-[#E8DFD3] relative">
            <button
              onClick={() => setIsOtpModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-2xl bg-[#4A121A]/10 text-[#4A121A] flex items-center justify-center mx-auto mb-3">
                <ShieldCheck className="w-6 h-6 text-[#4A121A]" />
              </div>
              <h3 className="text-xl font-bold text-[#4A121A] font-serif">
                Verify Your Mobile Number
              </h3>
              <p className="text-xs text-[#7A5835] mt-1">
                Enter your 10-digit phone to receive a quick verification code via SMS and reveal your Kundli Milan result.
              </p>
            </div>

            {otpError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-500" />
                <span>{otpError}</span>
              </div>
            )}

            {!otpSent ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#4A3E39] mb-1.5 uppercase tracking-wider">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">
                      +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      placeholder="9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                      className="w-full pl-12 pr-4 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C5A059] bg-[#FFFDF9]"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  disabled={sendingOtp || phone.replace(/\D/g, "").length < 10}
                  onClick={handleSendOtp}
                  className="w-full py-3 rounded-xl text-sm font-bold bg-[#4A121A] text-white hover:bg-[#601722] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
                >
                  {sendingOtp ? (
                    <span className="inline-flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Sending OTP via SMS...
                    </span>
                  ) : (
                    "Send Verification Code"
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD3] text-xs text-[#7A5835]">
                  OTP dispatched to <strong>+91 {phone.slice(0, 2)}******{phone.slice(-2)}</strong>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#4A3E39] mb-1.5 uppercase tracking-wider">
                    Enter 6-Digit OTP <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Enter code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    className="w-full text-center tracking-widest text-lg font-bold py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C5A059] bg-[#FFFDF9]"
                  />
                </div>

                <button
                  type="button"
                  disabled={verifyingOtp || otp.length < 4}
                  onClick={handleVerifyOtp}
                  className="w-full py-3 rounded-xl text-sm font-bold bg-[#4A121A] text-white hover:bg-[#601722] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md flex items-center justify-center gap-2"
                >
                  {verifyingOtp ? (
                    <span className="inline-flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Verifying & Calculating Milan...
                    </span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-[#DFBA73]" />
                      Verify & Reveal Milan Report
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-xs text-[#7A5835] pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp("");
                    }}
                    className="hover:underline"
                  >
                    Change Number
                  </button>

                  <button
                    type="button"
                    disabled={resendCooldown > 0 || sendingOtp}
                    onClick={handleSendOtp}
                    className="text-[#4A121A] font-semibold hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : "Resend OTP"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delayed Registration Popup Modal (3-4 seconds delay) */}
      {showPricingPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border-2 border-[#C5A059] relative overflow-hidden">
            <button
              onClick={() => setShowPricingPopup(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors z-10"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Decorative Top Accent */}
            <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-[#DFBA73]/20 pointer-events-none" />

            <div className="text-center mb-6">
              <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#4A121A] text-[#DFBA73] border border-[#C5A059] mb-2">
                Exclusive RishteClub Membership
              </span>
              <h3 className="text-2xl font-extrabold text-[#4A121A] font-serif">
                Connect With 100% Verified Rishtey
              </h3>
              <p className="text-xs text-[#7A5835] mt-1 max-w-sm mx-auto">
                Ready to find an astrologically compatible match? Join RishteClub by NNVS Matrimony today.
              </p>
            </div>

            {/* Pricing Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {/* Female Card */}
              <div className="rounded-2xl p-4 bg-gradient-to-b from-pink-50 to-white border border-pink-200 text-center relative">
                <span className="text-[11px] font-bold uppercase tracking-wider text-pink-700 block mb-1">
                  Bride (Female)
                </span>
                <div className="text-2xl font-black text-[#4A121A]">
                  ₹471
                </div>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  ₹399 + 18% GST (₹72)
                </p>
                <div className="mt-3 pt-2.5 border-t border-pink-100 text-[11px] text-[#4A3E39] space-y-1">
                  <div className="flex items-center gap-1 justify-center">
                    <Check className="w-3.5 h-3.5 text-pink-600" /> Full Profile Visibility
                  </div>
                  <div className="flex items-center gap-1 justify-center">
                    <Check className="w-3.5 h-3.5 text-pink-600" /> Direct Family Contact
                  </div>
                </div>
              </div>

              {/* Male Card */}
              <div className="rounded-2xl p-4 bg-gradient-to-b from-blue-50 to-white border border-blue-200 text-center relative">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 block mb-1">
                  Groom (Male)
                </span>
                <div className="text-2xl font-black text-[#4A121A]">
                  ₹943
                </div>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  ₹799 + 18% GST (₹144)
                </p>
                <div className="mt-3 pt-2.5 border-t border-blue-100 text-[11px] text-[#4A3E39] space-y-1">
                  <div className="flex items-center gap-1 justify-center">
                    <Check className="w-3.5 h-3.5 text-blue-600" /> Full Profile Visibility
                  </div>
                  <div className="flex items-center gap-1 justify-center">
                    <Check className="w-3.5 h-3.5 text-blue-600" /> Direct Family Contact
                  </div>
                </div>
              </div>
            </div>

            {/* Direct Register CTA */}
            <div className="space-y-3">
              <Link
                href={`/register?phone=${verifiedPhone}`}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-[#4A121A] text-white hover:bg-[#601722] active:scale-[0.99] transition-all shadow-lg flex items-center justify-center gap-2 border border-[#C5A059]"
              >
                <Sparkles className="w-4 h-4 text-[#DFBA73]" />
                Proceed to Register (+91 {verifiedPhone})
                <ArrowRight className="w-4 h-4" />
              </Link>

              <button
                type="button"
                onClick={() => setShowPricingPopup(false)}
                className="w-full py-2 text-xs text-gray-500 hover:text-gray-800 transition-colors"
              >
                Continue Viewing Kundli Milan Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

