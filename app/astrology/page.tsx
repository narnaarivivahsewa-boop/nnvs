"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Compass,
  Moon,
  Sun,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  Send,
  User,
  ArrowRight,
  Bot,
  Calendar,
  Clock,
  MapPin,
  RefreshCw,
  Lock,
  Unlock,
  CreditCard,
  QrCode,
  X,
  AlertTriangle,
} from "lucide-react";
import Footer from "@/components/Footer";
import MatrimonyAvatar from "@/components/MatrimonyAvatar";

export default function AstrologyPage() {
  // User Birth Form State
  const [userName, setUserName] = useState("My Kundli Profile");
  const [userGender, setUserGender] = useState("MALE");
  const [userDob, setUserDob] = useState("1996-08-15");
  const [userBirthTime, setUserBirthTime] = useState("08:30");
  const [userBirthPlace, setUserBirthPlace] = useState("Delhi, India");
  const [userManglik, setUserManglik] = useState("No");

  // Candidates list & selection
  const [candidates, setCandidates] = useState<any[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>("");
  const [loadingCandidates, setLoadingCandidates] = useState(true);

  // Match result
  const [calculating, setCalculating] = useState(false);
  const [matchResult, setMatchResult] = useState<any>(null);

  // Astrological Q&A & ₹99 Monetization State
  const [questionText, setQuestionText] = useState("");
  const [answering, setAnswering] = useState(false);
  const [freeQuestionsCount, setFreeQuestionsCount] = useState(0);
  const MAX_FREE_QUESTIONS = 3;

  const [isUpayeUnlocked, setIsUpayeUnlocked] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [utrNumber, setUtrNumber] = useState("");
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [paymentSuccessMessage, setPaymentSuccessMessage] = useState(false);

  const [qaHistory, setQaHistory] = useState<Array<{ q: string; a: string; time: string }>>([
    {
      q: "Kya dono profiles me Manglik dosha compatible hai?",
      a: "Vedic ganana ke anusar dono kundliyon me manglik prabhav santulit hai. Dosh vivaran upar scorecard me uplabdh hai.",
      time: "Recent Query",
    },
  ]);

  // Load profiles for matching
  useEffect(() => {
    async function loadCandidates() {
      try {
        const res = await fetch("/api/ai/astrology", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "profiles-list" }),
        });
        const data = await res.json();
        if (data.success && data.candidates?.length > 0) {
          setCandidates(data.candidates);
          // Auto select first candidate
          setSelectedCandidateId(data.candidates[0].id);
        }
      } catch (err) {
        console.error("Failed to load candidates for astrology:", err);
      } finally {
        setLoadingCandidates(false);
      }
    }
    loadCandidates();
  }, []);

  // Compute Kundli Match
  async function handleComputeMatch(candidateIdToUse?: string) {
    const targetId = candidateIdToUse || selectedCandidateId;
    if (!targetId) return;

    setCalculating(true);
    try {
      const res = await fetch("/api/ai/astrology", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "match",
          userDob,
          userBirthTime,
          userBirthPlace,
          userManglik,
          candidateProfileId: targetId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMatchResult(data);
      }
    } catch (err) {
      console.error("Failed to compute kundli match:", err);
    } finally {
      setCalculating(false);
    }
  }

  // Trigger initial match when candidate loaded
  useEffect(() => {
    if (selectedCandidateId) {
      handleComputeMatch(selectedCandidateId);
    }
  }, [selectedCandidateId]);

  // Handle Ask Astrology Question
  async function handleAskQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!questionText.trim() || !selectedCandidateId) return;

    // Check free question limit
    if (freeQuestionsCount >= MAX_FREE_QUESTIONS && !isUpayeUnlocked) {
      setShowPaymentModal(true);
      return;
    }

    const q = questionText.trim();
    setQuestionText("");
    setAnswering(true);
    setFreeQuestionsCount((prev) => prev + 1);

    try {
      const res = await fetch("/api/ai/astrology", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "qa",
          userDob,
          userBirthTime,
          userBirthPlace,
          userManglik,
          candidateProfileId: selectedCandidateId,
          question: q,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setQaHistory((prev) => [
          {
            q,
            a: data.answer,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
          ...prev,
        ]);
      }
    } catch (err) {
      console.error("Failed to ask astrology question:", err);
    } finally {
      setAnswering(false);
    }
  }

  // Handle ₹99 Payment Unlock
  function handleUnlockPayment(e: React.FormEvent) {
    e.preventDefault();
    setVerifyingPayment(true);
    setTimeout(() => {
      setVerifyingPayment(false);
      setIsUpayeUnlocked(true);
      setPaymentSuccessMessage(true);
      setTimeout(() => {
        setShowPaymentModal(false);
        setPaymentSuccessMessage(false);
      }, 2000);
    }, 1500);
  }

  const selectedCandidate = candidates.find((c) => c.id === selectedCandidateId);

  return (
    <div className="min-h-screen bg-[#FAF6EF] flex flex-col font-sans">
      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#4A121A] via-[#380D13] to-[#25050A] text-white py-14 sm:py-18 border-b border-[#C5A059]/40">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#DFBA73_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#DFBA73]/50 bg-[#DFBA73]/10 px-4 py-1.5 text-xs font-semibold text-[#DFBA73] backdrop-blur-md">
            <Sparkles className="h-4 w-4 text-[#DFBA73]" />
            <span>AI Vedic Horoscope & Kundli Matchmaking</span>
          </div>

          <h1 className="font-serif-luxury text-3xl sm:text-5xl font-bold tracking-tight text-white">
            AI Kundli Milan & Astrological Compatibility
          </h1>

          <p className="mx-auto max-w-2xl text-sm sm:text-base text-[#EAD8D0] leading-relaxed">
            Match horoscopes instantly with verified RishteClub profiles using 36 Guna Ashtakoota algorithms, Manglik dosha checks, and AI Vedic insights without needing external phone calls.
          </p>
        </div>
      </section>

      {/* Main Astrological Workspace */}
      <main className="flex-1 py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
          
          {/* Top Grid: Your Kundli Inputs + Target Profile Selector */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Box: Your Birth Details */}
            <div className="lg:col-span-5 rounded-3xl bg-white border border-[#E2D4BE] p-6 sm:p-8 shadow-md space-y-6">
              <div className="flex items-center gap-3 border-b border-[#EFE5D6] pb-4">
                <div className="h-10 w-10 rounded-xl bg-[#FAF0DC] border border-[#C5A059]/40 flex items-center justify-center text-[#4A121A]">
                  <Sun className="h-5 w-5 text-[#C5A059]" />
                </div>
                <div>
                  <h2 className="font-serif-luxury text-lg font-bold text-[#4A121A]">
                    Your Birth & Kundli Details
                  </h2>
                  <p className="text-xs text-gray-500">
                    Enter your birth parameters for exact Guna calculation
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                    Your Name / Identity
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full rounded-xl border border-[#D9C8B0] bg-[#FAF8F5] px-3.5 py-2 text-sm font-medium text-gray-900 focus:border-[#4A121A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                    Gender
                  </label>
                  <select
                    value={userGender}
                    onChange={(e) => setUserGender(e.target.value)}
                    className="w-full rounded-xl border border-[#D9C8B0] bg-[#FAF8F5] px-3.5 py-2 text-sm font-medium text-gray-900 focus:border-[#4A121A] focus:outline-none"
                  >
                    <option value="MALE">Male (Groom)</option>
                    <option value="FEMALE">Female (Bride)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-[#C5A059]" />
                    <span>Date of Birth</span>
                  </label>
                  <input
                    type="date"
                    value={userDob}
                    onChange={(e) => setUserDob(e.target.value)}
                    className="w-full rounded-xl border border-[#D9C8B0] bg-[#FAF8F5] px-3.5 py-2 text-sm font-medium text-gray-900 focus:border-[#4A121A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1 flex items-center gap-1">
                    <Clock className="h-3 w-3 text-[#C5A059]" />
                    <span>Time of Birth</span>
                  </label>
                  <input
                    type="time"
                    value={userBirthTime}
                    onChange={(e) => setUserBirthTime(e.target.value)}
                    className="w-full rounded-xl border border-[#D9C8B0] bg-[#FAF8F5] px-3.5 py-2 text-sm font-medium text-gray-900 focus:border-[#4A121A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-[#C5A059]" />
                    <span>Birth City / Place</span>
                  </label>
                  <input
                    type="text"
                    value={userBirthPlace}
                    onChange={(e) => setUserBirthPlace(e.target.value)}
                    className="w-full rounded-xl border border-[#D9C8B0] bg-[#FAF8F5] px-3.5 py-2 text-sm font-medium text-gray-900 focus:border-[#4A121A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                    Manglik Status
                  </label>
                  <select
                    value={userManglik}
                    onChange={(e) => setUserManglik(e.target.value)}
                    className="w-full rounded-xl border border-[#D9C8B0] bg-[#FAF8F5] px-3.5 py-2 text-sm font-medium text-gray-900 focus:border-[#4A121A] focus:outline-none"
                  >
                    <option value="No">Non-Manglik</option>
                    <option value="Yes">Manglik</option>
                    <option value="Anshik">Anshik / Partial Manglik</option>
                    <option value="Don't Know">Don&apos;t Know / Check via AI</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleComputeMatch()}
                disabled={calculating}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#4A121A] py-3.5 text-sm font-bold text-white shadow-md hover:bg-[#380D13] transition disabled:opacity-60"
              >
                <RefreshCw className={`h-4 w-4 text-[#DFBA73] ${calculating ? "animate-spin" : ""}`} />
                <span>{calculating ? "Recalculating Kundli..." : "Recalculate AI Match"}</span>
              </button>
            </div>

            {/* Right Box: Target Candidate Profile Selector */}
            <div className="lg:col-span-7 rounded-3xl bg-white border border-[#E2D4BE] p-6 sm:p-8 shadow-md flex flex-col justify-between space-y-6">
              <div>
                <div className="flex items-center justify-between border-b border-[#EFE5D6] pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-[#FAF0DC] border border-[#C5A059]/40 flex items-center justify-center text-[#4A121A]">
                      <Moon className="h-5 w-5 text-[#C5A059]" />
                    </div>
                    <div>
                      <h2 className="font-serif-luxury text-lg font-bold text-[#4A121A]">
                        Select Matrimony Profile to Match
                      </h2>
                      <p className="text-xs text-gray-500">
                        Choose any verified member profile from the RishteClub database
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-[#4A121A] bg-[#FAF0DC] px-3 py-1 rounded-full border border-[#E2D4BE]">
                    {candidates.length} Profiles Available
                  </span>
                </div>

                {/* Candidate Selection Dropdown & Quick Selector */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                      Choose Candidate Profile:
                    </label>
                    <select
                      value={selectedCandidateId}
                      onChange={(e) => setSelectedCandidateId(e.target.value)}
                      className="w-full rounded-xl border border-[#D9C8B0] bg-[#FAF8F5] px-4 py-3 text-sm font-semibold text-gray-900 focus:border-[#4A121A] focus:outline-none"
                    >
                      {candidates.map((cand) => (
                        <option key={cand.id} value={cand.id}>
                          {cand.user.fullName} ({cand.profileId}) • {cand.user.gender} • {cand.caste || "General"} • {cand.manglik ? `Manglik: ${cand.manglik}` : "Non-Manglik"}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Selected Candidate Preview Card */}
                  {selectedCandidate && (
                    <div className="rounded-2xl border border-[#DACBB4] bg-[#FAF5EB] p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-5">
                      <div className="h-20 w-20 rounded-2xl overflow-hidden border-2 border-white shadow-sm shrink-0">
                        <MatrimonyAvatar
                          imageUrl={selectedCandidate.photos?.[0]?.imageUrl}
                          fullName={selectedCandidate.user.fullName}
                          gender={selectedCandidate.user.gender}
                          size="md"
                          className="h-full w-full object-cover"
                        />
                      </div>

                      <div className="flex-1 space-y-1 text-center sm:text-left">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                          <h3 className="font-serif-luxury text-lg font-bold text-[#4A121A]">
                            {selectedCandidate.user.fullName}
                          </h3>
                          <span className="text-xs font-mono font-bold text-[#7A1F2D] bg-[#FDE8EC] px-2 py-0.5 rounded border border-[#F5C2CB]">
                            {selectedCandidate.profileId}
                          </span>
                        </div>

                        <p className="text-xs text-gray-600 font-medium">
                          {selectedCandidate.caste || "Community"} • {selectedCandidate.religion || "Hindu"}
                        </p>

                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1 text-xs text-[#5A4E48]">
                          <span className="bg-white px-2 py-0.5 rounded border border-[#E2D4BE]">
                            DOB: {selectedCandidate.dateOfBirth ? new Date(selectedCandidate.dateOfBirth).toLocaleDateString("en-IN") : "Recorded"}
                          </span>
                          <span className="bg-white px-2 py-0.5 rounded border border-[#E2D4BE]">
                            Birth Place: {selectedCandidate.birthPlace || "On Profile"}
                          </span>
                          <span className="bg-[#FAF0DC] text-[#4A121A] font-semibold px-2 py-0.5 rounded border border-[#E2D4BE]">
                            Manglik: {selectedCandidate.manglik || "Non-Manglik"}
                          </span>
                        </div>
                      </div>

                      <Link
                        href={`/profile/${selectedCandidate.profileId}`}
                        target="_blank"
                        className="rounded-xl bg-white border border-[#4A121A] px-4 py-2 text-xs font-bold text-[#4A121A] hover:bg-[#FAF0DC] transition shrink-0"
                      >
                        View Full Bio →
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center justify-between text-xs text-gray-500 border-t border-[#EFE5D6] pt-3">
                <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  100% Vedic Astrological Guna Computation
                </span>
                <span className="text-gray-400 font-mono">Algorithm: Ashtakoota v2.4</span>
              </div>
            </div>
          </div>

          {/* 36 Guna Scoreboard & AI Match Card */}
          {matchResult && matchResult.gunaMilan && (
            <div className="rounded-3xl bg-white border border-[#C5A059]/40 shadow-xl overflow-hidden">
              {/* Scorecard Header */}
              <div className="bg-gradient-to-r from-[#4A121A] via-[#5C1924] to-[#4A121A] p-6 sm:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 border-b border-[#C5A059]/30">
                <div className="space-y-2 text-center md:text-left">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-[#DFBA73]/20 px-3 py-1 text-xs font-bold text-[#DFBA73] border border-[#DFBA73]/30">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Astrological Compatibility Result</span>
                  </div>
                  <h2 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-white">
                    {matchResult.matchQuality}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#EAD8D0] max-w-xl">
                    {matchResult.aiSummary}
                  </p>
                </div>

                {/* Score Pill */}
                <div className="flex flex-col items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-[#DFBA73]/40 px-8 py-5 text-center shrink-0">
                  <span className="text-xs uppercase font-bold text-[#DFBA73] tracking-wider">
                    Total Guna Score
                  </span>
                  <div className="flex items-baseline gap-1 my-1">
                    <span className="font-serif-luxury text-4xl sm:text-5xl font-extrabold text-[#DFBA73]">
                      {matchResult.gunaMilan.totalGuna}
                    </span>
                    <span className="text-lg text-white/70 font-semibold">/36</span>
                  </div>
                  <span className="text-[11px] text-emerald-300 font-semibold">
                    {matchResult.gunaMilan.totalGuna >= 18 ? "✓ Auspicious Match (>18 Gunas)" : "Requires Remedies"}
                  </span>
                </div>
              </div>

              {/* Guna Breakdown Grid */}
              <div className="p-6 sm:p-8 space-y-6">
                <h3 className="font-serif-luxury text-lg font-bold text-[#4A121A] border-b border-gray-100 pb-2">
                  Ashtakoota 8-Factor Milan Breakdown
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(matchResult.gunaMilan.breakdown).map(([key, item]: any) => (
                    <div
                      key={key}
                      className="rounded-2xl border border-[#E8DCC8] bg-[#FAF8F5] p-4 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-[#4A121A] uppercase tracking-wide">
                            {key.toUpperCase()}
                          </span>
                          <span className="font-serif-luxury text-sm font-extrabold text-[#4A121A] bg-[#FAF0DC] px-2 py-0.5 rounded border border-[#DACBB4]">
                            {item.scored} / {item.max}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 font-medium">{item.label}</p>
                      </div>

                      {/* Mini progress bar */}
                      <div className="mt-3 h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
                        <div
                          className="h-full bg-[#C5A059] rounded-full"
                          style={{ width: `${(item.scored / item.max) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Manglik & Planetary Verdict */}
                <div className="rounded-2xl bg-[#FAF0DC]/70 border border-[#DACBB4] p-5 flex items-start gap-4">
                  <ShieldCheck className="h-6 w-6 text-[#4A121A] shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-[#4A121A]">
                      Manglik Dosha Status: {matchResult.gunaMilan.manglikCompatibility}
                    </h4>
                    <p className="text-xs text-[#5A4E48] leading-relaxed">
                      {matchResult.gunaMilan.manglikVerdict}
                    </p>
                  </div>
                </div>

                {/* Lal Kitab Dosha & ₹99 Remedies Paywall Section */}
                {matchResult.lalKitabData && (
                  <div className="rounded-2xl bg-gradient-to-br from-[#FAF5EB] to-[#FAF0DC] border-2 border-[#C5A059]/50 p-6 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2D4BE] pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">📖</span>
                        <h4 className="font-serif-luxury text-lg font-bold text-[#4A121A]">
                          Lal Kitab Dosh & Upaye (लाल किताब दोष एवं उपाय)
                        </h4>
                      </div>
                      <span className="text-xs font-semibold text-[#7A5835] bg-white px-3 py-1 rounded-full border border-[#DACBB4]">
                        Authentic Vedic Remedial Analysis
                      </span>
                    </div>

                    {/* Detected Doshas List (Always Free to View Dosh Status) */}
                    {matchResult.lalKitabData.doshas?.length > 0 ? (
                      <div className="space-y-4">
                        {matchResult.lalKitabData.doshas.map((dosh: any, idx: number) => (
                          <div key={idx} className="rounded-xl bg-white border border-[#DACBB4] p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-sm text-[#4A121A] flex items-center gap-1.5">
                                <AlertTriangle className="h-4 w-4 text-amber-600" />
                                {dosh.hindiName} ({dosh.name})
                              </span>
                              <span
                                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                                  dosh.severity === "Resolved"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : dosh.severity === "High"
                                    ? "bg-rose-100 text-rose-800"
                                    : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {dosh.severity === "Resolved" ? "✓ Shubh / Cancelled" : `${dosh.severity} Priority Dosh`}
                              </span>
                            </div>

                            <p className="text-xs text-[#5A4E48]">{dosh.description}</p>

                            {/* REMEDY / UPAYE SECTION - PAYWALLED IF NOT UNLOCKED */}
                            {isUpayeUnlocked ? (
                              <div className="rounded-lg bg-[#FAF8F5] p-3.5 border border-[#C5A059]/60 space-y-2 animate-fadeIn">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-[#7A1F2D] flex items-center gap-1.5">
                                    <Unlock className="h-3.5 w-3.5 text-emerald-600" />
                                    Lal Kitab Achook Upaye (निवारण उपाय - Unlocked):
                                  </span>
                                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                                    ✓ Premium Unlocked
                                  </span>
                                </div>
                                <ul className="space-y-1.5 text-xs text-[#4A3E39] list-disc list-inside">
                                  {dosh.remedies.map((rem: string, rIdx: number) => (
                                    <li key={rIdx} className="leading-relaxed">{rem}</li>
                                  ))}
                                </ul>
                              </div>
                            ) : (
                              <div className="relative overflow-hidden rounded-xl border border-[#E2D4BE] bg-[#FAF8F5] p-4 text-center">
                                {/* Blurred Fake Content */}
                                <div className="filter blur-xs select-none opacity-40 text-xs space-y-1 text-left">
                                  <p>• Neem ke ped ki jad me kacha doodh arpit karein aur shanti mantra jaap karein...</p>
                                  <p>• Chandi ka bina jod wala chhalla dharan karein aur mangalwar ko daan karein...</p>
                                </div>

                                {/* Paywall Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/80 to-transparent flex flex-col items-center justify-center p-3 gap-2">
                                  <div className="flex items-center gap-1 text-xs font-bold text-[#4A121A]">
                                    <Lock className="h-3.5 w-3.5 text-[#C5A059]" />
                                    <span>Lal Kitab Achook Upaye (Locked)</span>
                                  </div>
                                  <p className="text-[11px] text-gray-600 max-w-sm">
                                    Is dosha ka step-by-step Lal Kitab upaye, daan vidhi aur mantra report unlock karein.
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => setShowPaymentModal(true)}
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#4A121A] to-[#6A1A26] px-5 py-2 text-xs font-bold text-[#DFBA73] shadow hover:scale-105 transition"
                                  >
                                    <Sparkles className="h-3.5 w-3.5" />
                                    <span>Unlock Lal Kitab Upaye @ ₹99 Only</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl bg-white border border-emerald-200 p-4 text-xs text-emerald-800 font-medium">
                        ✓ Dono kundliyon me koi bada grah dosha nahi paya gaya. Milan shanti aur samridhi dayak hai.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Interactive Astrological Q&A Section */}
          <div className="rounded-3xl bg-white border border-[#E2D4BE] p-6 sm:p-8 shadow-md space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EFE5D6] pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#FAF0DC] border border-[#C5A059]/40 flex items-center justify-center text-[#4A121A]">
                  <Bot className="h-5 w-5 text-[#4A121A]" />
                </div>
                <div>
                  <h3 className="font-serif-luxury text-xl font-bold text-[#4A121A]">
                    Ask Astrological Question About This Profile
                  </h3>
                  <p className="text-xs text-gray-500">
                    Ask regarding Dosha, Guna Milan, or planetary balance without phoning!
                  </p>
                </div>
              </div>

              {!isUpayeUnlocked && (
                <div className="text-xs text-[#7A5835] bg-[#FAF0DC] px-3.5 py-1.5 rounded-full border border-[#DACBB4] font-semibold">
                  Free Questions: {Math.max(0, MAX_FREE_QUESTIONS - freeQuestionsCount)} / {MAX_FREE_QUESTIONS} Left
                </div>
              )}
            </div>

            {/* Suggested Question Chips */}
            <div className="flex flex-wrap gap-2">
              {[
                "Kya is Kundli me koi bada Dosh hai?",
                "Gun milan aur future compatibility kaisi rahegi?",
                "Career and family harmony analysis kya kehta hai?",
                "Is profile ki exact birth time and place record verify karein",
              ].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setQuestionText(chip)}
                  className="rounded-full bg-[#FAF5EB] border border-[#DACBB4] px-3.5 py-1.5 text-xs font-semibold text-[#4A121A] hover:bg-[#FAF0DC] hover:border-[#C5A059] transition"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Question Input Form */}
            <form onSubmit={handleAskQuestion} className="flex gap-3">
              <input
                type="text"
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="Type your astrological question (e.g. Kya hamara Kundli milan shubh hai?)..."
                className="flex-1 rounded-2xl border border-[#D9C8B0] bg-[#FAF8F5] px-4 py-3 text-sm text-gray-900 focus:border-[#4A121A] focus:outline-none"
              />
              <button
                type="submit"
                disabled={answering || !questionText.trim()}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#4A121A] px-6 py-3 text-sm font-bold text-white shadow hover:bg-[#380D13] transition disabled:opacity-50"
              >
                <Send className="h-4 w-4 text-[#DFBA73]" />
                <span>{answering ? "Analyzing..." : "Ask AI"}</span>
              </button>
            </form>

            {/* Q&A Thread History */}
            <div className="space-y-4 pt-2">
              {qaHistory.map((item, idx) => (
                <div key={idx} className="rounded-2xl border border-[#E8DCC8] bg-[#FAF8F5] p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#4A121A] flex items-center gap-1.5">
                      <HelpCircle className="h-3.5 w-3.5 text-[#C5A059]" />
                      Question: {item.q}
                    </span>
                    <span className="text-[11px] text-gray-400 font-mono">{item.time}</span>
                  </div>
                  <div className="rounded-xl bg-white p-3.5 border border-[#DACBB4] text-xs sm:text-sm text-[#4A3E39] leading-relaxed">
                    <span className="font-bold text-[#4A121A] block mb-1">✨ Astrological Verdict:</span>
                    {item.a}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>

      {/* ₹99 Lal Kitab Remedies Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-3xl bg-white border border-[#E2D4BE] p-6 sm:p-8 shadow-2xl space-y-6 animate-scaleUp">
            <button
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-4 right-4 rounded-full bg-gray-100 p-2 text-gray-500 hover:bg-gray-200 transition"
            >
              <X className="h-4 w-4" />
            </button>

            {paymentSuccessMessage ? (
              <div className="py-8 text-center space-y-3">
                <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="font-serif-luxury text-2xl font-bold text-gray-900">
                  Lal Kitab Remedies Unlocked!
                </h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  Aapki complete Lal Kitab Upaye & remedies report successfully unlock ho chuki hai.
                </p>
              </div>
            ) : (
              <form onSubmit={handleUnlockPayment} className="space-y-5">
                <div className="text-center space-y-1">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-[#FAF0DC] px-3 py-1 text-xs font-bold text-[#4A121A] border border-[#DACBB4] mb-2">
                    <Sparkles className="h-3.5 w-3.5 text-[#C5A059]" />
                    <span>Lal Kitab Premium Remedial Report</span>
                  </div>
                  <h3 className="font-serif-luxury text-2xl font-bold text-[#4A121A]">
                    Unlock Lal Kitab Upaye
                  </h3>
                  <p className="text-xs text-gray-600">
                    Get customized remedies, dosha nivaran guidelines & unlimited questions.
                  </p>
                </div>

                {/* Price Display */}
                <div className="rounded-2xl bg-[#FAF0DC] border border-[#DACBB4] p-4 text-center">
                  <span className="text-xs text-gray-600 font-semibold uppercase block">One-Time Fee</span>
                  <div className="flex items-baseline justify-center gap-1 my-0.5">
                    <span className="font-serif-luxury text-4xl font-extrabold text-[#4A121A]">₹99</span>
                    <span className="text-xs text-gray-500 line-through">₹499</span>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700">Instant Access & Complete Report</span>
                </div>

                {/* QR Code */}
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-center space-y-2">
                  <p className="text-xs font-bold text-gray-700">Scan QR Code via Any UPI App:</p>
                  <div className="h-44 w-44 mx-auto rounded-xl overflow-hidden border border-gray-300 bg-white p-2">
                    <img
                      src="/payment-qr.jpeg"
                      alt="UPI QR Code"
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <p className="font-mono text-xs font-bold text-[#4A121A]">
                    UPI ID: narnaarivivahsewa@okicici
                  </p>
                </div>

                {/* UPI Direct Link */}
                <a
                  href="upi://pay?pa=narnaarivivahsewa@okicici&pn=RishteClub%20Astrology&am=99&cu=INR"
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition"
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Pay ₹99 on GPay / PhonePe / Paytm</span>
                </a>

                {/* UTR Input */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    UPI Ref / UTR No. (12 Digits)
                  </label>
                  <input
                    type="text"
                    required
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    placeholder="Enter 12-digit UTR after payment"
                    className="w-full rounded-xl border border-[#D9C8B0] bg-[#FAF8F5] px-3.5 py-2 text-xs text-gray-900 focus:border-[#4A121A] focus:outline-none font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={verifyingPayment || !utrNumber.trim()}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#4A121A] py-3.5 text-sm font-bold text-white shadow hover:bg-[#380D13] transition disabled:opacity-50"
                >
                  <Unlock className="h-4 w-4 text-[#DFBA73]" />
                  <span>{verifyingPayment ? "Verifying..." : "Verify & Unlock Upaye"}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
