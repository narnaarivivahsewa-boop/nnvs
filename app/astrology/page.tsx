"use client";

import { useState, useEffect, useCallback } from "react";
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
  LogIn,
  UserCheck,
  Edit3,
  ExternalLink,
  Users,
} from "lucide-react";
import Footer from "@/components/Footer";
import MatrimonyAvatar from "@/components/MatrimonyAvatar";
import RazorpayCheckoutButton from "@/components/RazorpayCheckoutButton";

// Helper to convert diverse birth time formats to standard 24-hr HH:mm for <input type="time" />
function to24HourTime(val?: string | null): string {
  if (!val) return "08:30";
  const trimmed = String(val).trim();
  if (!trimmed || trimmed === "-" || trimmed.toLowerCase() === "null") {
    return "08:30";
  }

  // 1. Decimal Excel fraction (e.g. 0.5520833333357587)
  const num = Number(trimmed);
  if (!isNaN(num) && num > 0 && num < 1) {
    const totalMinutes = Math.round(num * 24 * 60);
    const h = Math.floor(totalMinutes / 60) % 24;
    const m = totalMinutes % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  // 2. JavaScript Date string or 1899 date
  if (trimmed.includes("1899") || /^[A-Za-z]{3}\s+[A-Za-z]{3}\s+\d{1,2}\s+\d{4}/i.test(trimmed)) {
    const timeMatch = trimmed.match(/(\d{1,2}):(\d{2})(?::\d{2})?/);
    if (timeMatch) {
      const hours = parseInt(timeMatch[1], 10);
      const minutes = timeMatch[2];
      return `${String(hours).padStart(2, "0")}:${minutes}`;
    }
  }

  // 3. 12-hour format with AM/PM (e.g. "1:40 AM", "01:15 PM", "10:25pm")
  const ampmMatch = trimmed.match(/(\d{1,2})[:.](\d{2})\s*(am|pm)/i);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const minutes = ampmMatch[2];
    const ampm = ampmMatch[3].toUpperCase();
    if (ampm === "PM" && hours < 12) hours += 12;
    if (ampm === "AM" && hours === 12) hours = 0;
    return `${String(hours).padStart(2, "0")}:${minutes}`;
  }

  // 4. 24-hour format (e.g. "17:02:00" or "08:30")
  const match24 = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const minutes = match24[2];
    return `${String(hours).padStart(2, "0")}:${minutes}`;
  }

  // 5. Generic digits extraction
  const genericMatch = trimmed.match(/(\d{1,2})[:.](\d{2})/);
  if (genericMatch) {
    let hours = parseInt(genericMatch[1], 10);
    const minutes = genericMatch[2];
    const lower = trimmed.toLowerCase();
    if ((lower.includes("pm") || lower.includes("evening") || lower.includes("night")) && hours < 12) {
      hours += 12;
    }
    return `${String(hours).padStart(2, "0")}:${minutes}`;
  }

  return "08:30";
}

// Helper to convert date of birth to YYYY-MM-DD for <input type="date" />
function toDateInputValue(raw?: string | Date | null): string {
  if (!raw) return "1996-08-15";
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return "1996-08-15";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch {
    return "1996-08-15";
  }
}

// Helper for formatted display date (e.g. 15 Aug 1996)
function formatDisplayDate(raw?: string | Date | null): string {
  if (!raw) return "Recorded in Profile";
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return String(raw);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return String(raw);
  }
}

// Helper for formatted display time (e.g. 08:30 AM)
function formatDisplayTime(raw?: string | null): string {
  if (!raw) return "Recorded in Profile";
  const t24 = to24HourTime(raw);
  const parts = t24.split(":");
  if (parts.length === 2) {
    let h = parseInt(parts[0], 10);
    const m = parts[1];
    const ampm = h >= 12 ? "PM" : "AM";
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    return `${String(h).padStart(2, "0")}:${m} ${ampm}`;
  }
  return String(raw);
}

// Normalize manglik value to allowed select options
function normalizeManglik(val?: string | null): string {
  if (!val) return "No";
  const lower = String(val).toLowerCase();
  if (lower.includes("anshik") || lower.includes("partial")) return "Anshik";
  if (lower.includes("yes") || lower === "manglik") return "Yes";
  if (lower.includes("don't") || lower.includes("dont") || lower.includes("check")) return "Don't Know";
  return "No";
}

export default function AstrologyPage() {
  // Authentication & Profile State
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [registeredProfile, setRegisteredProfile] = useState<any>(null);
  const [accountProfiles, setAccountProfiles] = useState<any[]>([]);
  const [switchingProfile, setSwitchingProfile] = useState(false);

  // User Birth Form State (Used for calculation)
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
  const [paymentSuccessMessage, setPaymentSuccessMessage] = useState(false);

  const [qaHistory, setQaHistory] = useState<Array<{ q: string; a: string; time: string }>>([
    {
      q: "Kya dono profiles me Manglik dosha compatible hai?",
      a: "Vedic ganana ke anusar dono kundliyon me manglik prabhav santulit hai. Dosh vivaran upar scorecard me uplabdh hai.",
      time: "Recent Query",
    },
  ]);

  // Load candidate profiles strictly filtered by opposite gender
  const fetchCandidatesForGender = useCallback(
    async (activeUserGender: string, excludeProfileId?: string, excludeUserId?: string) => {
      setLoadingCandidates(true);
      try {
        const res = await fetch("/api/ai/astrology", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "profiles-list",
            userGender: activeUserGender,
          }),
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.candidates)) {
          // Strict opposite gender enforcement:
          // Male user -> Female candidate profiles only
          // Female user -> Male candidate profiles only
          const expectedTargetGender = activeUserGender === "MALE" ? "FEMALE" : "MALE";
          const filtered = data.candidates.filter((cand: any) => {
            if (cand.user?.gender && cand.user.gender !== expectedTargetGender) return false;
            if (excludeProfileId && (cand.id === excludeProfileId || cand.profileId === excludeProfileId)) {
              return false;
            }
            if (excludeUserId && (cand.userId === excludeUserId || cand.user?.id === excludeUserId)) {
              return false;
            }
            return true;
          });

          setCandidates(filtered);
          if (filtered.length > 0) {
            setSelectedCandidateId(filtered[0].id);
          } else {
            setSelectedCandidateId("");
            setMatchResult(null);
          }
        }
      } catch (err) {
        console.error("Failed to load candidates for astrology:", err);
      } finally {
        setLoadingCandidates(false);
      }
    },
    []
  );

  // Initialize: Check Authentication, Auto-fetch User Profile & Load Filtered Candidates
  useEffect(() => {
    async function init() {
      setAuthLoading(true);
      try {
        const authRes = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });
        const authData = await authRes.json();

        if (authRes.ok && authData.success && authData.user) {
          setIsAuthenticated(true);
          const currentUser = authData.user;
          const userProf = currentUser.activeProfile || currentUser.profile || currentUser.profiles?.[0];
          setAccountProfiles(currentUser.profiles || []);

          let determinedGender = (userProf?.gender || currentUser.gender || "MALE").toUpperCase();
          if (determinedGender !== "MALE" && determinedGender !== "FEMALE") {
            determinedGender = "MALE";
          }

          const determinedName =
            [userProf?.firstName, userProf?.lastName].filter(Boolean).join(" ") ||
            currentUser.fullName ||
            "My Kundli Profile";
          const determinedDob = userProf?.dateOfBirth ? toDateInputValue(userProf.dateOfBirth) : "1996-08-15";
          const determinedBirthTime = userProf?.birthTime ? to24HourTime(userProf.birthTime) : "08:30";
          const determinedBirthPlace = userProf?.birthPlace || "Delhi, India";
          const determinedManglik = normalizeManglik(userProf?.manglik);

          setUserName(determinedName);
          setUserGender(determinedGender);
          setUserDob(determinedDob);
          setUserBirthTime(determinedBirthTime);
          setUserBirthPlace(determinedBirthPlace);
          setUserManglik(determinedManglik);
          setRegisteredProfile(userProf);

          // Fetch only opposite-gender candidate profiles excluding self
          await fetchCandidatesForGender(determinedGender, userProf?.id, currentUser?.id);
        } else {
          setIsAuthenticated(false);
          // Fallback preview: load candidates for default male user (female candidates)
          await fetchCandidatesForGender("MALE");
        }
      } catch (err) {
        console.error("Failed to authenticate & auto-fetch profile for astrology:", err);
        setIsAuthenticated(false);
        await fetchCandidatesForGender("MALE");
      } finally {
        setAuthLoading(false);
      }
    }

    init();
  }, [fetchCandidatesForGender]);

  // Handle switching between account candidate profiles in Astrology view
  const handleSwitchAstrologyProfile = async (targetProfileId: string) => {
    try {
      setSwitchingProfile(true);
      const res = await fetch("/api/auth/select-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ profileId: targetProfileId }),
      });

      if (res.ok) {
        const found = accountProfiles.find(
          (p) => p.id === targetProfileId || p.profileId === targetProfileId
        );

        if (found) {
          setRegisteredProfile(found);
          let determinedGender = (found.gender || "MALE").toUpperCase();
          if (determinedGender !== "MALE" && determinedGender !== "FEMALE") {
            determinedGender = "MALE";
          }

          const determinedName =
            [found.firstName, found.lastName].filter(Boolean).join(" ") ||
            found.profileId ||
            "My Kundli Profile";
          const determinedDob = found.dateOfBirth
            ? toDateInputValue(found.dateOfBirth)
            : "1996-08-15";
          const determinedBirthTime = found.birthTime
            ? to24HourTime(found.birthTime)
            : "08:30";
          const determinedBirthPlace = found.birthPlace || "Delhi, India";
          const determinedManglik = normalizeManglik(found.manglik);

          setUserName(determinedName);
          setUserGender(determinedGender);
          setUserDob(determinedDob);
          setUserBirthTime(determinedBirthTime);
          setUserBirthPlace(determinedBirthPlace);
          setUserManglik(determinedManglik);

          setSelectedCandidateId("");
          setMatchResult(null);

          // Re-fetch candidates strictly for this profile's opposite gender
          await fetchCandidatesForGender(determinedGender, found.id);

          window.dispatchEvent(
            new CustomEvent("nnvs:profile-switched", { detail: { profileId: targetProfileId } })
          );
        }
      }
    } catch (err) {
      console.error("Failed to switch astrology profile:", err);
    } finally {
      setSwitchingProfile(false);
    }
  };

  // Sync if profile switched in Navbar
  useEffect(() => {
    function handleGlobalSwitch(e: any) {
      if (e.detail?.profileId && accountProfiles.length > 0) {
        const targetId = e.detail.profileId;
        if (targetId !== registeredProfile?.id) {
          handleSwitchAstrologyProfile(targetId);
        }
      }
    }
    window.addEventListener("nnvs:profile-switched", handleGlobalSwitch);
    return () =>
      window.removeEventListener("nnvs:profile-switched", handleGlobalSwitch);
  }, [accountProfiles, registeredProfile]);

  // Handle guest gender change: dynamically update candidate list to opposite gender
  const handleGenderChange = (newGender: string) => {
    setUserGender(newGender);
    fetchCandidatesForGender(newGender, registeredProfile?.id);
  };

  // Compute Kundli Match
  async function handleComputeMatch(candidateIdToUse?: string) {
    const targetId = candidateIdToUse || selectedCandidateId;
    if (!targetId) return;

    setCalculating(true);
    try {
      const res = await fetch("/api/ai/astrology", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "match",
          userDob,
          userBirthTime,
          userBirthPlace,
          userManglik,
          userGender,
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
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "qa",
          userDob,
          userBirthTime,
          userBirthPlace,
          userManglik,
          userGender,
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
          
          {/* Unauthenticated Members Gate Notice */}
          {!authLoading && !isAuthenticated && (
            <div className="rounded-3xl bg-amber-50/90 border border-amber-300/80 p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-5 animate-fadeIn">
              <div className="flex items-start sm:items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#4A121A] to-[#6A1A26] text-[#DFBA73] flex items-center justify-center shrink-0 shadow">
                  <Lock className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-serif-luxury text-base sm:text-lg font-bold text-[#4A121A]">
                    Registered Members: Auto-fetch Your Kundli
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-700 leading-relaxed max-w-2xl">
                    Apne registered account se login karein. Aapki profile details automatically fetch ho jayengi aur aapke liye opposite gender profiles ka 36 Guna Milan & Lal Kitab Upaye turant calculate hoga.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
                <Link
                  href="/login?redirect=/astrology"
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-xl bg-[#4A121A] px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-[#380D13] transition"
                >
                  <LogIn className="h-4 w-4 text-[#DFBA73]" />
                  <span>Login to Auto-fetch</span>
                </Link>
                <Link
                  href="/register"
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center rounded-xl bg-white border border-[#4A121A] px-4 py-2.5 text-xs font-bold text-[#4A121A] hover:bg-[#FAF0DC] transition"
                >
                  Register Profile
                </Link>
              </div>
            </div>
          )}

          {/* Top Grid: Your Kundli Profile Card + Target Candidate Selector */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Box: Your Registered Profile Card (Read-Only for Logged-In Users) */}
            <div className="lg:col-span-5 rounded-3xl bg-white border border-[#E2D4BE] p-6 sm:p-8 shadow-md space-y-6">
              
              {isAuthenticated && registeredProfile ? (
                /* Verified Read-Only Summary Card for Logged-In User */
                <div className="space-y-6">
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#EFE5D6] pb-4 gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-2xl bg-[#FAF0DC] border border-[#C5A059]/40 flex items-center justify-center text-[#4A121A] shadow-xs">
                        <UserCheck className="h-6 w-6 text-[#4A121A]" />
                      </div>
                      <div>
                        <h2 className="font-serif-luxury text-lg font-bold text-[#4A121A]">
                          Your Registered Profile
                        </h2>
                        <p className="text-xs text-gray-500">
                          Auto-loaded verified birth & Kundli parameters
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {accountProfiles.length > 1 && (
                        <div className="flex items-center gap-1.5 rounded-xl bg-[#FAF5EB] border border-[#C5A059] px-2.5 py-1 text-xs shadow-xs">
                          <Users className="h-3.5 w-3.5 text-[#C5A059]" />
                          <select
                            value={registeredProfile.id || ""}
                            disabled={switchingProfile}
                            onChange={(e) => handleSwitchAstrologyProfile(e.target.value)}
                            className="bg-transparent text-xs font-bold text-[#4A121A] focus:outline-none cursor-pointer"
                          >
                            {accountProfiles.map((p, idx) => (
                              <option key={p.id} value={p.id}>
                                {p.firstName ? `${p.firstName} (${p.profileId})` : `Profile #${idx + 1}`}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-3 py-1 rounded-full shadow-xs">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        <span>{registeredProfile.profileId || "Verified"}</span>
                      </span>
                    </div>
                  </div>

                  {/* Summary Grid */}
                  <div className="space-y-3.5">
                    {/* Full Name & Gender Banner */}
                    <div className="rounded-2xl bg-gradient-to-r from-[#FAF8F5] to-[#FAF5EB] border border-[#EFE5D6] p-4 flex items-center justify-between shadow-xs">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">
                          Registered Name
                        </span>
                        <span className="font-serif-luxury text-base sm:text-lg font-bold text-[#4A121A]">
                          {userName}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">
                          Kundli Role
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-[#4A121A] bg-[#FAF0DC] border border-[#DACBB4] px-3 py-1 rounded-full">
                          {userGender === "MALE" ? "Groom (Male)" : "Bride (Female)"}
                        </span>
                      </div>
                    </div>

                    {/* Date of Birth & Birth Time */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-[#FAF8F5] border border-[#EFE5D6] p-3.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1 mb-1">
                          <Calendar className="h-3 w-3 text-[#C5A059]" />
                          <span>Date of Birth</span>
                        </span>
                        <span className="text-sm font-bold text-gray-900 block">
                          {formatDisplayDate(userDob)}
                        </span>
                      </div>

                      <div className="rounded-2xl bg-[#FAF8F5] border border-[#EFE5D6] p-3.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1 mb-1">
                          <Clock className="h-3 w-3 text-[#C5A059]" />
                          <span>Birth Time</span>
                        </span>
                        <span className="text-sm font-bold text-gray-900 block">
                          {formatDisplayTime(userBirthTime)}
                        </span>
                      </div>
                    </div>

                    {/* Birth City & Manglik Status */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-[#FAF8F5] border border-[#EFE5D6] p-3.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1 mb-1">
                          <MapPin className="h-3 w-3 text-[#C5A059]" />
                          <span>Birth City / Place</span>
                        </span>
                        <span className="text-sm font-bold text-gray-900 truncate block" title={userBirthPlace}>
                          {userBirthPlace || "Delhi, India"}
                        </span>
                      </div>

                      <div className="rounded-2xl bg-[#FAF8F5] border border-[#EFE5D6] p-3.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1 mb-1">
                          <ShieldCheck className="h-3 w-3 text-[#C5A059]" />
                          <span>Manglik Status</span>
                        </span>
                        <span
                          className={`inline-flex items-center text-xs font-bold px-2.5 py-0.5 rounded-full ${
                            userManglik === "Yes"
                              ? "bg-rose-100 text-rose-800 border border-rose-200"
                              : userManglik === "Anshik"
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          }`}
                        >
                          {userManglik === "Yes"
                            ? "Manglik"
                            : userManglik === "Anshik"
                            ? "Anshik Manglik"
                            : "Non-Manglik"}
                        </span>
                      </div>
                    </div>

                    {/* Derived Vedic Astrological Details */}
                    {matchResult?.userAstro && (
                      <div className="rounded-2xl bg-gradient-to-r from-[#FAF0DC] to-[#F5E6CA] border border-[#DACBB4] p-4 flex items-center justify-between text-xs shadow-xs">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-[#7A5835] block mb-0.5">
                            Moon Sign (Rashi)
                          </span>
                          <span className="font-serif-luxury font-bold text-sm text-[#4A121A]">
                            {matchResult.userAstro.rashi}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-[#7A5835] block mb-0.5">
                            Birth Nakshatra
                          </span>
                          <span className="font-serif-luxury font-bold text-sm text-[#4A121A]">
                            {matchResult.userAstro.nakshatra}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Edit in Profile Notice & Action */}
                  <div className="pt-4 border-t border-[#EFE5D6] flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-[11px] text-gray-500 text-center sm:text-left leading-relaxed">
                      Birth details are locked to your registered profile for authentic calculation.
                    </p>
                    <Link
                      href="/profile/edit"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-[#4A121A] px-4 py-2 text-xs font-bold text-[#4A121A] hover:bg-[#FAF0DC] transition shadow-xs shrink-0"
                    >
                      <Edit3 className="h-3.5 w-3.5 text-[#C5A059]" />
                      <span>Edit in Profile →</span>
                    </Link>
                  </div>
                </div>
              ) : (
                /* Guest Input Form for Unauthenticated Visitors */
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-[#EFE5D6] pb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-[#FAF0DC] border border-[#C5A059]/40 flex items-center justify-center text-[#4A121A]">
                        <Sun className="h-5 w-5 text-[#C5A059]" />
                      </div>
                      <div>
                        <h2 className="font-serif-luxury text-lg font-bold text-[#4A121A]">
                          Guest Birth Parameters
                        </h2>
                        <p className="text-xs text-gray-500">
                          Login to auto-fetch or enter parameters manually
                        </p>
                      </div>
                    </div>

                    <Link
                      href="/login?redirect=/astrology"
                      className="text-xs font-bold text-[#4A121A] bg-[#FAF0DC] hover:bg-[#F3E3C3] px-3 py-1 rounded-full border border-[#DACBB4] transition"
                    >
                      Login →
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                        Your Name
                      </label>
                      <input
                        type="text"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        className="w-full rounded-xl border border-[#D9C8B0] bg-[#FAF8F5] px-3.5 py-2 text-sm font-medium text-gray-900 focus:border-[#4A121A] focus:outline-none"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">
                          Gender
                        </label>
                        <span className="text-[10px] font-bold text-[#C5A059]">
                          {userGender === "MALE" ? "Groom" : "Bride"}
                        </span>
                      </div>
                      <select
                        value={userGender}
                        onChange={(e) => handleGenderChange(e.target.value)}
                        className="w-full rounded-xl border border-[#D9C8B0] bg-[#FAF8F5] px-3.5 py-2 text-sm font-medium text-gray-900 focus:border-[#4A121A] focus:outline-none"
                      >
                        <option value="MALE">Male (Groom)</option>
                        <option value="FEMALE">Female (Bride)</option>
                      </select>
                      <p className="text-[11px] text-gray-500 mt-1 font-medium">
                        {userGender === "MALE"
                          ? "✓ Shows verified Female (Bride) profiles"
                          : "✓ Shows verified Male (Groom) profiles"}
                      </p>
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
                    <span>{calculating ? "Calculating Kundli..." : "Calculate AI Match"}</span>
                  </button>
                </div>
              )}

            </div>

            {/* Right Box: Target Candidate Profile Selector (Strictly Opposite Gender) */}
            <div className="lg:col-span-7 rounded-3xl bg-white border border-[#E2D4BE] p-6 sm:p-8 shadow-md flex flex-col justify-between space-y-6">
              <div>
                <div className="flex items-center justify-between border-b border-[#EFE5D6] pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-[#FAF0DC] border border-[#C5A059]/40 flex items-center justify-center text-[#4A121A]">
                      <Moon className="h-5 w-5 text-[#C5A059]" />
                    </div>
                    <div>
                      <h2 className="font-serif-luxury text-lg font-bold text-[#4A121A]">
                        {userGender === "MALE"
                          ? "Select Bride Profile to Match (Female)"
                          : "Select Groom Profile to Match (Male)"}
                      </h2>
                      <p className="text-xs text-gray-500">
                        {userGender === "MALE"
                          ? "Strictly verified female profiles from RishteClub database"
                          : "Strictly verified male profiles from RishteClub database"}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-[#4A121A] bg-[#FAF0DC] px-3 py-1 rounded-full border border-[#E2D4BE]">
                    {candidates.length} {userGender === "MALE" ? "Brides" : "Grooms"} Available
                  </span>
                </div>

                {/* Candidate Selection Dropdown & Quick Selector */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                      Choose {userGender === "MALE" ? "Bride (Female)" : "Groom (Male)"} Profile:
                    </label>
                    {loadingCandidates ? (
                      <div className="w-full rounded-xl border border-[#D9C8B0] bg-[#FAF8F5] px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin text-[#C5A059]" />
                        <span>Loading opposite-gender profiles...</span>
                      </div>
                    ) : candidates.length > 0 ? (
                      <select
                        value={selectedCandidateId}
                        onChange={(e) => setSelectedCandidateId(e.target.value)}
                        className="w-full rounded-xl border border-[#D9C8B0] bg-[#FAF8F5] px-4 py-3 text-sm font-semibold text-gray-900 focus:border-[#4A121A] focus:outline-none"
                      >
                        {candidates.map((cand) => (
                          <option key={cand.id} value={cand.id}>
                            {cand.user.fullName} ({cand.profileId}) • {cand.user.gender === "FEMALE" ? "Bride" : "Groom"} • {cand.caste || "General"} • {cand.manglik ? `Manglik: ${cand.manglik}` : "Non-Manglik"}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800">
                        No {userGender === "MALE" ? "female (bride)" : "male (groom)"} profiles found in this category.
                      </div>
                    )}
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
                  Authentic Vedic Ashtakoota 36 Guna Algorithm
                </span>
                <span className="text-gray-400 font-mono">Engine: Lahiri Ayanamsha</span>
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
                                {/* Blurred Placeholder Content */}
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
              <div className="space-y-5">
                <div className="text-center space-y-1">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-[#FAF0DC] px-3 py-1 text-xs font-bold text-[#4A121A] border border-[#DACBB4] mb-2">
                    <Sparkles className="h-3.5 w-3.5 text-[#C5A059]" />
                    <span>Lal Kitab Premium Remedial Report</span>
                  </div>
                  <h3 className="font-serif-luxury text-2xl font-bold text-[#4A121A]">
                    Unlock Lal Kitab Upaye
                  </h3>
                  <p className="text-xs text-gray-600">
                    Get customized remedies, dosha nivaran guidelines & unlimited questions with official GST tax invoice.
                  </p>
                </div>

                {/* Price Display */}
                <div className="rounded-2xl bg-[#FAF0DC] border border-[#DACBB4] p-4 text-center space-y-2">
                  <span className="text-xs text-gray-600 font-semibold uppercase block">Official Service Fee</span>
                  <div className="flex items-baseline justify-center gap-1 my-0.5">
                    <span className="font-serif-luxury text-3xl font-extrabold text-[#4A121A]">₹99.00</span>
                    <span className="text-xs text-gray-500">+ 18% GST</span>
                  </div>
                  <div className="text-[11px] text-gray-600 flex justify-between px-4 border-t border-[#DACBB4]/60 pt-2 font-medium">
                    <span>Base Fee: ₹99.00</span>
                    <span>GST (18%): ₹17.82</span>
                    <span className="font-bold text-[#4A121A]">Total: ₹116.82</span>
                  </div>
                </div>

                {/* Instant Razorpay Button */}
                <RazorpayCheckoutButton
                  amountInRupees={116.82}
                  service="ASTROLOGY"
                  description="RishteClub Lal Kitab Astrology Remedies (₹99 + 18% GST)"
                  buttonText="Pay ₹116.82 & Unlock Lal Kitab Report"
                  onSuccess={() => {
                    setIsUpayeUnlocked(true);
                    setPaymentSuccessMessage(true);
                    setTimeout(() => {
                      setShowPaymentModal(false);
                      setPaymentSuccessMessage(false);
                    }, 2500);
                  }}
                />

                <div className="text-center text-[11px] text-gray-500">
                  <p>Supports UPI (GPay, PhonePe, Paytm), Cards & Net Banking</p>
                  <p className="font-semibold text-gray-600 mt-0.5">Official GST Tax Invoice issued instantly</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
