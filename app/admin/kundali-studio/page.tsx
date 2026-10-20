"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Sparkles,
  Search,
  User,
  Calendar,
  Clock,
  MapPin,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Download,
  ExternalLink,
  RefreshCw,
  ArrowRightLeft,
  ShieldCheck,
  Printer,
  X,
  Heart,
  ChevronDown,
  Info,
} from "lucide-react";
import { calculateAuthenticGunaMilan } from "@/lib/astrology/vedic-match";

interface CandidateProfile {
  id: string;
  profileId: string;
  legacyProfileId?: string | null;
  displayId: string;
  fullName: string;
  gender: "MALE" | "FEMALE";
  mobile: string;
  email: string;
  dateOfBirth?: string | null;
  birthTime?: string | null;
  birthPlace?: string | null;
  manglik?: string | null;
  caste?: string | null;
  religion?: string | null;
  maritalStatus?: string | null;
  education?: string | null;
  occupation?: string | null;
  photo?: string | null;
  paymentCompleted?: boolean;
}

interface SideFormState {
  profile: CandidateProfile | null;
  name: string;
  dob: string;
  birthTime: string;
  birthPlace: string;
  manglik: string;
  caste: string;
  gotra: string;
}

// Convert various birth time inputs to 24-hr HH:mm format for input[type="time"]
function to24HourTime(val?: string | null): string {
  if (!val) return "08:30";
  const trimmed = String(val).trim();
  if (!trimmed || trimmed === "-" || trimmed.toLowerCase() === "null") {
    return "08:30";
  }

  // 1. Decimal fraction
  const num = Number(trimmed);
  if (!isNaN(num) && num > 0 && num < 1) {
    const totalMinutes = Math.round(num * 24 * 60);
    const h = Math.floor(totalMinutes / 60) % 24;
    const m = totalMinutes % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  // 2. 12-hour format with AM/PM
  const ampmMatch = trimmed.match(/(\d{1,2})[:.](\d{2})\s*(am|pm)/i);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const minutes = ampmMatch[2];
    const ampm = ampmMatch[3].toUpperCase();
    if (ampm === "PM" && hours < 12) hours += 12;
    if (ampm === "AM" && hours === 12) hours = 0;
    return `${String(hours).padStart(2, "0")}:${minutes}`;
  }

  // 3. 24-hour format
  const match24 = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const minutes = match24[2];
    return `${String(hours).padStart(2, "0")}:${minutes}`;
  }

  return "08:30";
}

function normalizeManglik(val?: string | null): string {
  if (!val) return "No";
  const lower = String(val).toLowerCase();
  if (lower.includes("anshik") || lower.includes("partial")) return "Anshik";
  if (lower.includes("yes") || lower === "manglik") return "Yes";
  if (lower.includes("don't") || lower.includes("dont") || lower.includes("check")) return "Don't Know";
  return "No";
}

export default function AdminKundaliStudioPage() {
  // Left Side: Groom (Male)
  const [groomSearchQuery, setGroomSearchQuery] = useState("");
  const [groomResults, setGroomResults] = useState<CandidateProfile[]>([]);
  const [searchingGroom, setSearchingGroom] = useState(false);
  const [groomDropdownOpen, setGroomDropdownOpen] = useState(false);
  const groomDropdownRef = useRef<HTMLDivElement>(null);

  const [groomForm, setGroomForm] = useState<SideFormState>({
    profile: null,
    name: "",
    dob: "1996-08-15",
    birthTime: "08:30",
    birthPlace: "Delhi, India",
    manglik: "No",
    caste: "",
    gotra: "",
  });

  // Right Side: Bride (Female)
  const [brideSearchQuery, setBrideSearchQuery] = useState("");
  const [brideResults, setBrideResults] = useState<CandidateProfile[]>([]);
  const [searchingBride, setSearchingBride] = useState(false);
  const [brideDropdownOpen, setBrideDropdownOpen] = useState(false);
  const brideDropdownRef = useRef<HTMLDivElement>(null);

  const [brideForm, setBrideForm] = useState<SideFormState>({
    profile: null,
    name: "",
    dob: "1998-11-20",
    birthTime: "10:15",
    birthPlace: "Hisar, Haryana",
    manglik: "No",
    caste: "",
    gotra: "",
  });

  // Match Calculation State
  const [calculating, setCalculating] = useState(false);
  const [matchResult, setMatchResult] = useState<any>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (groomDropdownRef.current && !groomDropdownRef.current.contains(e.target as Node)) {
        setGroomDropdownOpen(false);
      }
      if (brideDropdownRef.current && !brideDropdownRef.current.contains(e.target as Node)) {
        setBrideDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search Groom Debounced
  const fetchGrooms = useCallback(async (query: string) => {
    setSearchingGroom(true);
    try {
      const res = await fetch(
        `/api/admin/kundali-studio/search?gender=MALE&q=${encodeURIComponent(query)}&limit=25`,
        { credentials: "include" }
      );
      const data = await res.json();
      if (data.success) {
        setGroomResults(data.profiles || []);
      }
    } catch (err) {
      console.error("Failed to search grooms:", err);
    } finally {
      setSearchingGroom(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchGrooms(groomSearchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [groomSearchQuery, fetchGrooms]);

  // Search Bride Debounced
  const fetchBrides = useCallback(async (query: string) => {
    setSearchingBride(true);
    try {
      const res = await fetch(
        `/api/admin/kundali-studio/search?gender=FEMALE&q=${encodeURIComponent(query)}&limit=25`,
        { credentials: "include" }
      );
      const data = await res.json();
      if (data.success) {
        setBrideResults(data.profiles || []);
      }
    } catch (err) {
      console.error("Failed to search brides:", err);
    } finally {
      setSearchingBride(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBrides(brideSearchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [brideSearchQuery, fetchBrides]);

  // Auto-fill Groom Selection
  const handleSelectGroom = (candidate: CandidateProfile) => {
    setGroomForm({
      profile: candidate,
      name: candidate.fullName,
      dob: candidate.dateOfBirth || "1996-08-15",
      birthTime: to24HourTime(candidate.birthTime),
      birthPlace: candidate.birthPlace || "Delhi, India",
      manglik: normalizeManglik(candidate.manglik),
      caste: candidate.caste || "",
      gotra: "",
    });
    setGroomDropdownOpen(false);
  };

  // Auto-fill Bride Selection
  const handleSelectBride = (candidate: CandidateProfile) => {
    setBrideForm({
      profile: candidate,
      name: candidate.fullName,
      dob: candidate.dateOfBirth || "1998-11-20",
      birthTime: to24HourTime(candidate.birthTime),
      birthPlace: candidate.birthPlace || "Hisar, Haryana",
      manglik: normalizeManglik(candidate.manglik),
      caste: candidate.caste || "",
      gotra: "",
    });
    setBrideDropdownOpen(false);
  };

  // Instant Calculate Match
  const handleCalculateMatch = () => {
    setCalculating(true);
    try {
      const result = calculateAuthenticGunaMilan(
        groomForm.dob,
        brideForm.dob,
        groomForm.birthTime,
        brideForm.birthTime,
        groomForm.manglik,
        brideForm.manglik
      );

      // Sagotra analysis
      const gGotra = groomForm.gotra.trim().toLowerCase();
      const bGotra = brideForm.gotra.trim().toLowerCase();
      const isSagotra = gGotra && bGotra && gGotra === bGotra;

      setMatchResult({
        ...result,
        sagotraCheck: {
          checked: Boolean(gGotra && bGotra),
          isSagotra,
          groomGotra: groomForm.gotra.trim(),
          brideGotra: brideForm.gotra.trim(),
        },
        calculatedAt: new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      });
    } catch (err) {
      console.error("Match calculation error:", err);
    } finally {
      setCalculating(false);
    }
  };

  // Swap Left & Right
  const handleSwapSides = () => {
    const tempGroom = { ...groomForm };
    setGroomForm({ ...brideForm });
    setBrideForm(tempGroom);
    setMatchResult(null);
  };

  // Clear All
  const handleReset = () => {
    setGroomForm({
      profile: null,
      name: "",
      dob: "1996-08-15",
      birthTime: "08:30",
      birthPlace: "Delhi, India",
      manglik: "No",
      caste: "",
      gotra: "",
    });
    setBrideForm({
      profile: null,
      name: "",
      dob: "1998-11-20",
      birthTime: "10:15",
      birthPlace: "Hisar, Haryana",
      manglik: "No",
      caste: "",
      gotra: "",
    });
    setMatchResult(null);
  };

  // Print Matchmaker Report
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 print:p-0 print:space-y-4">
      {/* Studio Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#4A121A] via-[#5F1824] to-[#4A121A] p-6 sm:p-8 text-white shadow-xl border border-[#6B1F2D] print:border-none print:shadow-none print:p-4 print:text-black print:bg-none">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DFBA73]/20 border border-[#DFBA73]/40 text-[#DFBA73] text-xs font-bold tracking-wide">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Admin Matchmaker Studio</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[11px] font-bold">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>100% Free & Unrestricted</span>
              </span>
            </div>
            <h1 className="font-serif-luxury text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Dual Kundali Milan & Matchmaking Studio
            </h1>
            <p className="text-xs sm:text-sm text-[#E8D8C0] max-w-2xl leading-relaxed">
              Select any registered Groom & Bride from the database, auto-fill verified birth parameters, make manual adjustments, and calculate authentic 36 Guna Ashtakoota compatibility with 1-click Biodata PDF downloads.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto shrink-0 print:hidden">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
            {matchResult && (
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 rounded-xl bg-[#DFBA73] hover:bg-[#C9A254] text-[#4A121A] text-xs font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Certificate</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Dual Selection Grid: Groom (Left) vs Bride (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-2">
        {/* ========================================================= */}
        {/* LEFT COLUMN: GROOM (MALE)                                */}
        {/* ========================================================= */}
        <div className="rounded-3xl bg-white border border-[#E8DCC8] shadow-sm p-6 sm:p-7 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#F0E6D6]">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-serif-luxury text-lg font-bold text-[#4A121A]">
                  Groom (वर) Profile
                </h2>
                <p className="text-[11px] text-gray-500">
                  Select registered Male candidate from database
                </p>
              </div>
            </div>

            {groomForm.profile && (
              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
                {groomForm.profile.displayId}
              </span>
            )}
          </div>

          {/* Searchable Groom Picker */}
          <div className="relative print:hidden" ref={groomDropdownRef}>
            <label className="block text-xs font-bold text-[#7A5835] uppercase tracking-wider mb-1.5">
              Search Registered Groom (Name, Mobile, ID)
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={groomSearchQuery}
                onChange={(e) => {
                  setGroomSearchQuery(e.target.value);
                  setGroomDropdownOpen(true);
                }}
                onFocus={() => setGroomDropdownOpen(true)}
                placeholder="Type Name, Mobile (e.g. 9871...), or ID (e.g. NNVS / RC)..."
                className="w-full rounded-xl border border-[#DACBB4] bg-[#FAF6EF] pl-10 pr-10 py-2.5 text-xs text-[#2D221E] font-medium focus:border-[#4A121A] focus:bg-white focus:outline-none transition shadow-xs"
              />
              {groomSearchQuery && (
                <button
                  type="button"
                  onClick={() => setGroomSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Dropdown Candidate Results */}
            {groomDropdownOpen && (
              <div className="absolute left-0 right-0 mt-2 max-h-72 overflow-y-auto rounded-2xl bg-white border border-[#DACBB4] shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 border-b border-gray-100 flex items-center justify-between text-[11px] text-gray-500 font-semibold">
                  <span>Registered Grooms ({groomResults.length})</span>
                  {searchingGroom && <span className="text-[#C5A059]">Searching...</span>}
                </div>

                {groomResults.length === 0 && !searchingGroom && (
                  <div className="p-4 text-center text-xs text-gray-500">
                    No registered groom found for &ldquo;{groomSearchQuery}&rdquo;
                  </div>
                )}

                <div className="space-y-1 mt-1">
                  {groomResults.map((candidate) => (
                    <button
                      key={candidate.id}
                      type="button"
                      onClick={() => handleSelectGroom(candidate)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition cursor-pointer ${
                        groomForm.profile?.id === candidate.id
                          ? "bg-blue-50 border border-blue-200"
                          : "hover:bg-[#FAF6EF]"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {candidate.photo ? (
                          <img
                            src={candidate.photo}
                            alt={candidate.fullName}
                            className="h-9 w-9 rounded-full object-cover border border-[#C5A059] shrink-0"
                          />
                        ) : (
                          <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {candidate.fullName.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-[#2D221E] truncate">
                            {candidate.fullName}
                          </p>
                          <p className="text-[10px] text-gray-500 flex items-center gap-2">
                            <span className="font-mono font-semibold text-[#4A121A]">
                              {candidate.displayId}
                            </span>
                            <span>•</span>
                            <span>{candidate.mobile || "No Mobile"}</span>
                            {candidate.birthPlace && (
                              <>
                                <span>•</span>
                                <span className="truncate">{candidate.birthPlace}</span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0 ml-2">
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full">
                          Select
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Selected Groom Quick Info & PDF Download */}
          {groomForm.profile && (
            <div className="p-3.5 rounded-2xl bg-[#FAF5EB] border border-[#E8DCC8] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {groomForm.profile.photo ? (
                  <img
                    src={groomForm.profile.photo}
                    alt={groomForm.name}
                    className="h-10 w-10 rounded-full object-cover border border-[#C5A059] shrink-0"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                    {groomForm.name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#4A121A] truncate">
                    {groomForm.name} ({groomForm.profile.displayId})
                  </p>
                  <p className="text-[11px] text-gray-600">
                    Mobile: <span className="font-mono">{groomForm.profile.mobile || "—"}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={`/api/profiles/${groomForm.profile.id}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#4A121A] text-white hover:bg-[#3A0C13] text-[11px] font-bold transition shadow-xs"
                  title="Download Groom Biodata PDF"
                >
                  <Download className="h-3 w-3 text-[#DFBA73]" />
                  <span>Biodata PDF</span>
                </a>
                <Link
                  href={`/profiles/${groomForm.profile.id}`}
                  target="_blank"
                  className="p-1.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-white transition"
                  title="View full profile"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          )}

          {/* Editable Parameters (Auto-filled with manual override) */}
          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold text-[#7A5835] uppercase tracking-wider mb-1">
                  Candidate Name
                </label>
                <input
                  type="text"
                  value={groomForm.name}
                  onChange={(e) => setGroomForm({ ...groomForm, name: e.target.value })}
                  placeholder="Groom Name"
                  className="w-full rounded-xl border border-[#DACBB4] bg-white px-3 py-2 text-xs font-bold text-[#2D221E] focus:border-[#4A121A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#7A5835] uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-[#C5A059]" />
                  <span>Date of Birth</span>
                </label>
                <input
                  type="date"
                  value={groomForm.dob}
                  onChange={(e) => setGroomForm({ ...groomForm, dob: e.target.value })}
                  className="w-full rounded-xl border border-[#DACBB4] bg-white px-3 py-2 text-xs font-bold text-[#2D221E] focus:border-[#4A121A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#7A5835] uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Clock className="h-3 w-3 text-[#C5A059]" />
                  <span>Birth Time (24h)</span>
                </label>
                <input
                  type="time"
                  value={groomForm.birthTime}
                  onChange={(e) => setGroomForm({ ...groomForm, birthTime: e.target.value })}
                  className="w-full rounded-xl border border-[#DACBB4] bg-white px-3 py-2 text-xs font-bold text-[#2D221E] focus:border-[#4A121A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#7A5835] uppercase tracking-wider mb-1 flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-[#C5A059]" />
                  <span>Birth Place</span>
                </label>
                <input
                  type="text"
                  value={groomForm.birthPlace}
                  onChange={(e) => setGroomForm({ ...groomForm, birthPlace: e.target.value })}
                  placeholder="City, State"
                  className="w-full rounded-xl border border-[#DACBB4] bg-white px-3 py-2 text-xs font-semibold text-[#2D221E] focus:border-[#4A121A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#7A5835] uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Flame className="h-3 w-3 text-red-600" />
                  <span>Manglik Status</span>
                </label>
                <select
                  value={groomForm.manglik}
                  onChange={(e) => setGroomForm({ ...groomForm, manglik: e.target.value })}
                  className="w-full rounded-xl border border-[#DACBB4] bg-white px-3 py-2 text-xs font-bold text-[#2D221E] focus:border-[#4A121A] focus:outline-none cursor-pointer"
                >
                  <option value="No">No (Non-Manglik)</option>
                  <option value="Yes">Yes (Manglik)</option>
                  <option value="Anshik">Anshik (Partial Manglik)</option>
                  <option value="Don't Know">Don&apos;t Know / Check Kundli</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#7A5835] uppercase tracking-wider mb-1">
                  Gotra (For Sagotra Check)
                </label>
                <input
                  type="text"
                  value={groomForm.gotra}
                  onChange={(e) => setGroomForm({ ...groomForm, gotra: e.target.value })}
                  placeholder="e.g. Kaushik, Kashyap, Garg"
                  className="w-full rounded-xl border border-[#DACBB4] bg-white px-3 py-2 text-xs font-semibold text-[#2D221E] focus:border-[#4A121A] focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: BRIDE (FEMALE)                             */}
        {/* ========================================================= */}
        <div className="rounded-3xl bg-white border border-[#E8DCC8] shadow-sm p-6 sm:p-7 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#F0E6D6]">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center font-bold">
                <Heart className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-serif-luxury text-lg font-bold text-[#4A121A]">
                  Bride (वधू) Profile
                </h2>
                <p className="text-[11px] text-gray-500">
                  Select registered Female candidate from database
                </p>
              </div>
            </div>

            {brideForm.profile && (
              <span className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full">
                {brideForm.profile.displayId}
              </span>
            )}
          </div>

          {/* Searchable Bride Picker */}
          <div className="relative print:hidden" ref={brideDropdownRef}>
            <label className="block text-xs font-bold text-[#7A5835] uppercase tracking-wider mb-1.5">
              Search Registered Bride (Name, Mobile, ID)
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={brideSearchQuery}
                onChange={(e) => {
                  setBrideSearchQuery(e.target.value);
                  setBrideDropdownOpen(true);
                }}
                onFocus={() => setBrideDropdownOpen(true)}
                placeholder="Type Name, Mobile (e.g. 9871...), or ID (e.g. NNVS / RC)..."
                className="w-full rounded-xl border border-[#DACBB4] bg-[#FAF6EF] pl-10 pr-10 py-2.5 text-xs text-[#2D221E] font-medium focus:border-[#4A121A] focus:bg-white focus:outline-none transition shadow-xs"
              />
              {brideSearchQuery && (
                <button
                  type="button"
                  onClick={() => setBrideSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Dropdown Candidate Results */}
            {brideDropdownOpen && (
              <div className="absolute left-0 right-0 mt-2 max-h-72 overflow-y-auto rounded-2xl bg-white border border-[#DACBB4] shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 border-b border-gray-100 flex items-center justify-between text-[11px] text-gray-500 font-semibold">
                  <span>Registered Brides ({brideResults.length})</span>
                  {searchingBride && <span className="text-[#C5A059]">Searching...</span>}
                </div>

                {brideResults.length === 0 && !searchingBride && (
                  <div className="p-4 text-center text-xs text-gray-500">
                    No registered bride found for &ldquo;{brideSearchQuery}&rdquo;
                  </div>
                )}

                <div className="space-y-1 mt-1">
                  {brideResults.map((candidate) => (
                    <button
                      key={candidate.id}
                      type="button"
                      onClick={() => handleSelectBride(candidate)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition cursor-pointer ${
                        brideForm.profile?.id === candidate.id
                          ? "bg-rose-50 border border-rose-200"
                          : "hover:bg-[#FAF6EF]"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {candidate.photo ? (
                          <img
                            src={candidate.photo}
                            alt={candidate.fullName}
                            className="h-9 w-9 rounded-full object-cover border border-[#C5A059] shrink-0"
                          />
                        ) : (
                          <div className="h-9 w-9 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {candidate.fullName.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-[#2D221E] truncate">
                            {candidate.fullName}
                          </p>
                          <p className="text-[10px] text-gray-500 flex items-center gap-2">
                            <span className="font-mono font-semibold text-[#4A121A]">
                              {candidate.displayId}
                            </span>
                            <span>•</span>
                            <span>{candidate.mobile || "No Mobile"}</span>
                            {candidate.birthPlace && (
                              <>
                                <span>•</span>
                                <span className="truncate">{candidate.birthPlace}</span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0 ml-2">
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-100/70 px-2 py-0.5 rounded-full">
                          Select
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Selected Bride Quick Info & PDF Download */}
          {brideForm.profile && (
            <div className="p-3.5 rounded-2xl bg-[#FAF5EB] border border-[#E8DCC8] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {brideForm.profile.photo ? (
                  <img
                    src={brideForm.profile.photo}
                    alt={brideForm.name}
                    className="h-10 w-10 rounded-full object-cover border border-[#C5A059] shrink-0"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-sm shrink-0">
                    {brideForm.name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#4A121A] truncate">
                    {brideForm.name} ({brideForm.profile.displayId})
                  </p>
                  <p className="text-[11px] text-gray-600">
                    Mobile: <span className="font-mono">{brideForm.profile.mobile || "—"}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={`/api/profiles/${brideForm.profile.id}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#4A121A] text-white hover:bg-[#3A0C13] text-[11px] font-bold transition shadow-xs"
                  title="Download Bride Biodata PDF"
                >
                  <Download className="h-3 w-3 text-[#DFBA73]" />
                  <span>Biodata PDF</span>
                </a>
                <Link
                  href={`/profiles/${brideForm.profile.id}`}
                  target="_blank"
                  className="p-1.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-white transition"
                  title="View full profile"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          )}

          {/* Editable Parameters (Auto-filled with manual override) */}
          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold text-[#7A5835] uppercase tracking-wider mb-1">
                  Candidate Name
                </label>
                <input
                  type="text"
                  value={brideForm.name}
                  onChange={(e) => setBrideForm({ ...brideForm, name: e.target.value })}
                  placeholder="Bride Name"
                  className="w-full rounded-xl border border-[#DACBB4] bg-white px-3 py-2 text-xs font-bold text-[#2D221E] focus:border-[#4A121A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#7A5835] uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-[#C5A059]" />
                  <span>Date of Birth</span>
                </label>
                <input
                  type="date"
                  value={brideForm.dob}
                  onChange={(e) => setBrideForm({ ...brideForm, dob: e.target.value })}
                  className="w-full rounded-xl border border-[#DACBB4] bg-white px-3 py-2 text-xs font-bold text-[#2D221E] focus:border-[#4A121A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#7A5835] uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Clock className="h-3 w-3 text-[#C5A059]" />
                  <span>Birth Time (24h)</span>
                </label>
                <input
                  type="time"
                  value={brideForm.birthTime}
                  onChange={(e) => setBrideForm({ ...brideForm, birthTime: e.target.value })}
                  className="w-full rounded-xl border border-[#DACBB4] bg-white px-3 py-2 text-xs font-bold text-[#2D221E] focus:border-[#4A121A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#7A5835] uppercase tracking-wider mb-1 flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-[#C5A059]" />
                  <span>Birth Place</span>
                </label>
                <input
                  type="text"
                  value={brideForm.birthPlace}
                  onChange={(e) => setBrideForm({ ...brideForm, birthPlace: e.target.value })}
                  placeholder="City, State"
                  className="w-full rounded-xl border border-[#DACBB4] bg-white px-3 py-2 text-xs font-semibold text-[#2D221E] focus:border-[#4A121A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#7A5835] uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Flame className="h-3 w-3 text-red-600" />
                  <span>Manglik Status</span>
                </label>
                <select
                  value={brideForm.manglik}
                  onChange={(e) => setBrideForm({ ...brideForm, manglik: e.target.value })}
                  className="w-full rounded-xl border border-[#DACBB4] bg-white px-3 py-2 text-xs font-bold text-[#2D221E] focus:border-[#4A121A] focus:outline-none cursor-pointer"
                >
                  <option value="No">No (Non-Manglik)</option>
                  <option value="Yes">Yes (Manglik)</option>
                  <option value="Anshik">Anshik (Partial Manglik)</option>
                  <option value="Don't Know">Don&apos;t Know / Check Kundli</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#7A5835] uppercase tracking-wider mb-1">
                  Gotra (For Sagotra Check)
                </label>
                <input
                  type="text"
                  value={brideForm.gotra}
                  onChange={(e) => setBrideForm({ ...brideForm, gotra: e.target.value })}
                  placeholder="e.g. Kaushik, Kashyap, Bansal"
                  className="w-full rounded-xl border border-[#DACBB4] bg-white px-3 py-2 text-xs font-semibold text-[#2D221E] focus:border-[#4A121A] focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar: Calculate Match & Swap */}
      <div className="flex flex-wrap items-center justify-center gap-4 py-3 print:hidden">
        <button
          type="button"
          onClick={handleSwapSides}
          className="px-5 py-3 rounded-2xl bg-white border border-[#DACBB4] text-[#4A121A] text-xs font-bold hover:bg-[#FAF0DC] transition flex items-center gap-2 shadow-xs cursor-pointer"
          title="Swap Groom and Bride parameters"
        >
          <ArrowRightLeft className="h-4 w-4 text-[#C5A059]" />
          <span>Swap Sides</span>
        </button>

        <button
          type="button"
          onClick={handleCalculateMatch}
          disabled={calculating}
          className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#4A121A] to-[#6A1A26] text-white hover:from-[#3A0C13] hover:to-[#55141E] text-sm font-bold shadow-lg transition transform hover:scale-[1.02] flex items-center gap-2.5 cursor-pointer disabled:opacity-60"
        >
          <Sparkles className="h-4 w-4 text-[#DFBA73] animate-pulse" />
          <span>{calculating ? "Calculating 36 Gunas..." : "Calculate Ashtakoota Match (36 Gunas)"}</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* MATCH RESULTS SECTION                                    */}
      {/* ========================================================= */}
      {matchResult && (
        <div className="rounded-3xl bg-white border border-[#E8DCC8] shadow-xl p-6 sm:p-8 space-y-8 animate-in fade-in duration-300">
          {/* Header & Overall Scorecard */}
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-[#F0E6D6] gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#C5A059]">
                  Vedic Ashtakoota Kundali Milan Certificate
                </span>
                <span className="text-[10px] text-gray-500 font-mono">
                  Calculated at {matchResult.calculatedAt}
                </span>
              </div>
              <h2 className="font-serif-luxury text-2xl font-bold text-[#4A121A] mt-1">
                {groomForm.name || "Groom"} &amp; {brideForm.name || "Bride"}
              </h2>
              <p className="text-xs text-gray-600 mt-0.5">
                Authentic 36 Guna Ashtakoota Milan • Manglik Dosha Analysis • Lal Kitab Guidance
              </p>
            </div>

            {/* Overall Score Badge */}
            <div className="flex items-center gap-4 bg-[#FAF5EB] border border-[#DACBB4] p-4 rounded-2xl shrink-0">
              <div className="text-center">
                <div className="flex items-baseline justify-center">
                  <span className="font-serif-luxury text-3xl sm:text-4xl font-extrabold text-[#4A121A]">
                    {matchResult.totalGuna}
                  </span>
                  <span className="text-sm font-bold text-gray-500 ml-1">/ 36</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A5835]">
                  Gunas Matched
                </span>
              </div>

              <div className="h-10 w-[1px] bg-[#E8DCC8]" />

              <div>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                    matchResult.totalGuna >= 28
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : matchResult.totalGuna >= 21
                      ? "bg-blue-100 text-blue-800 border border-blue-300"
                      : matchResult.totalGuna >= 18
                      ? "bg-amber-100 text-amber-800 border border-amber-300"
                      : "bg-rose-100 text-rose-800 border border-rose-300"
                  }`}
                >
                  {matchResult.totalGuna >= 28
                    ? "उत्कृष्ट मिलान (Excellent)"
                    : matchResult.totalGuna >= 21
                    ? "शुभ मिलान (Good / Auspicious)"
                    : matchResult.totalGuna >= 18
                    ? "मध्यम मिलान (Average)"
                    : "सावधानी (Below 18)"}
                </span>
                <p className="text-[11px] text-gray-600 mt-1 max-w-[200px] leading-tight">
                  {matchResult.recommendation}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Badges: Astrological Signs, Gotra & Manglik Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Groom Signs */}
            <div className="p-4 rounded-2xl bg-[#FAF6EF] border border-[#E8DCC8]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A5835]">
                Groom Astrology
              </span>
              <p className="text-xs font-bold text-[#4A121A] mt-1">
                {matchResult.boySign.rashi}
              </p>
              <p className="text-[11px] text-gray-600">
                Nakshatra: <span className="font-semibold">{matchResult.boySign.nakshatra}</span>
              </p>
              <p className="text-[10px] text-gray-500">
                Gana: {matchResult.boySign.gana} • Nadi: {matchResult.boySign.nadiName}
              </p>
            </div>

            {/* Bride Signs */}
            <div className="p-4 rounded-2xl bg-[#FAF6EF] border border-[#E8DCC8]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A5835]">
                Bride Astrology
              </span>
              <p className="text-xs font-bold text-[#4A121A] mt-1">
                {matchResult.girlSign.rashi}
              </p>
              <p className="text-[11px] text-gray-600">
                Nakshatra: <span className="font-semibold">{matchResult.girlSign.nakshatra}</span>
              </p>
              <p className="text-[10px] text-gray-500">
                Gana: {matchResult.girlSign.gana} • Nadi: {matchResult.girlSign.nadiName}
              </p>
            </div>

            {/* Manglik Verdict */}
            <div className="p-4 rounded-2xl bg-[#FAF6EF] border border-[#E8DCC8]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A5835] flex items-center gap-1">
                <Flame className="h-3 w-3 text-red-600" />
                <span>Manglik Compatibility</span>
              </span>
              <p className="text-xs font-bold text-[#4A121A] mt-1">
                {matchResult.manglikCompatibility}
              </p>
              <p className="text-[11px] text-gray-600 mt-0.5 leading-snug">
                {matchResult.manglikVerdict}
              </p>
            </div>

            {/* Sagotra Check */}
            <div className="p-4 rounded-2xl bg-[#FAF6EF] border border-[#E8DCC8]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A5835]">
                Gotra Alignment
              </span>
              {matchResult.sagotraCheck.checked ? (
                matchResult.sagotraCheck.isSagotra ? (
                  <div>
                    <p className="text-xs font-bold text-red-700 mt-1 flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                      <span>सगोत्र दोष (Same Gotra)</span>
                    </p>
                    <p className="text-[10px] text-red-600 mt-0.5">
                      Both share gotra: &ldquo;{matchResult.sagotraCheck.groomGotra}&rdquo;.
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-bold text-emerald-700 mt-1 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      <span>भिन्न गोत्र (Compatible)</span>
                    </p>
                    <p className="text-[10px] text-gray-600 mt-0.5">
                      Groom: {matchResult.sagotraCheck.groomGotra} • Bride: {matchResult.sagotraCheck.brideGotra}
                    </p>
                  </div>
                )
              ) : (
                <div>
                  <p className="text-xs font-semibold text-gray-600 mt-1">
                    Gotra Not Specified
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    Enter gotra above for automatic Sagotra check.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 8 Ashtakoota Breakdown Table */}
          <div className="space-y-3">
            <h3 className="font-serif-luxury text-base font-bold text-[#4A121A] flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#C5A059]" />
              <span>36 Guna Ashtakoota Detailed Breakdown</span>
            </h3>

            <div className="overflow-x-auto rounded-2xl border border-[#DACBB4]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF5EB] text-[#7A5835] font-bold uppercase tracking-wider text-[11px] border-b border-[#DACBB4]">
                  <tr>
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Koota</th>
                    <th className="px-4 py-3">Area / Aspect</th>
                    <th className="px-4 py-3">Max Gunas</th>
                    <th className="px-4 py-3">Obtained</th>
                    <th className="px-4 py-3">Analysis &amp; Shubh Fal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0E6D6] text-[#2D221E]">
                  {matchResult.breakdown.map((koota: any, idx: number) => {
                    const isPerfect = koota.score === koota.max;
                    const isZero = koota.score === 0;

                    return (
                      <tr key={koota.name} className="hover:bg-[#FAF6EF]/60 transition">
                        <td className="px-4 py-3 font-mono font-bold text-gray-400">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-3 font-bold text-[#4A121A]">
                          {koota.name}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {koota.area}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-gray-500">
                          {koota.max}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`font-mono font-extrabold text-sm ${
                              isPerfect
                                ? "text-emerald-700"
                                : isZero
                                ? "text-red-600"
                                : "text-amber-700"
                            }`}
                          >
                            {koota.score}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700 leading-snug">
                          {koota.description}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-[#FAF0DC] font-bold text-[#4A121A] border-t-2 border-[#C5A059]">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-right uppercase tracking-wider text-xs">
                      Total Ashtakoota Milan Score:
                    </td>
                    <td className="px-4 py-3 font-mono text-sm">36</td>
                    <td className="px-4 py-3 font-mono text-base font-extrabold text-[#4A121A]">
                      {matchResult.totalGuna}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold">
                      {matchResult.recommendation}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Lal Kitab Remedies & Guidance Section */}
          {matchResult.lalKitabData && (
            <div className="space-y-4 rounded-2xl bg-[#FAF5EB] p-5 sm:p-6 border border-[#DACBB4]">
              <div className="flex items-center gap-2">
                <span className="font-serif-luxury text-base font-bold text-[#4A121A]">
                  Lal Kitab Vedic Upaye &amp; Remedies (लाल किताब सरल निवारण)
                </span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Admin Unlocked
                </span>
              </div>

              {matchResult.lalKitabData.hasDoshas ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {matchResult.lalKitabData.doshas.map((dosha: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-white border border-[#E8DCC8] shadow-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#4A121A]">
                          {dosha.hindiName || dosha.name}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            dosha.severity === "Resolved"
                              ? "bg-emerald-100 text-emerald-800"
                              : dosha.severity === "High"
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {dosha.severity}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-600 leading-relaxed">
                        {dosha.description}
                      </p>
                      <div className="pt-2 border-t border-gray-100">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A5835] block mb-1">
                          Recommended Remedies:
                        </span>
                        <ul className="list-disc list-inside text-[11px] text-gray-700 space-y-0.5">
                          {dosha.remedies.map((rem: string, rIdx: number) => (
                            <li key={rIdx}>{rem}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-white border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>
                    No severe doshas (Nadi, Bhakoot, Gana or Mangal) detected. Shubh graha alignment for marriage.
                  </span>
                </div>
              )}

              {/* Universal Auspicious Practices */}
              <div className="pt-3 border-t border-[#DACBB4]">
                <span className="text-xs font-bold text-[#7A5835] uppercase tracking-wider block mb-1.5">
                  Universal Auspicious Blessings:
                </span>
                <div className="grid sm:grid-cols-3 gap-2 text-[11px] text-gray-700">
                  {matchResult.lalKitabData.universalRemedies.map((uRem: string, uIdx: number) => (
                    <div
                      key={uIdx}
                      className="p-2.5 rounded-xl bg-white/70 border border-[#E8DCC8]"
                    >
                      ✓ {uRem}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Action Bar: Download Groom PDF & Bride PDF */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#F0E6D6] print:hidden">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 font-medium">1-Click Biodatas:</span>
              {groomForm.profile ? (
                <a
                  href={`/api/profiles/${groomForm.profile.id}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Groom PDF ({groomForm.profile.displayId})</span>
                </a>
              ) : (
                <span className="text-xs text-gray-400 italic">No Groom selected</span>
              )}

              {brideForm.profile ? (
                <a
                  href={`/api/profiles/${brideForm.profile.id}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Bride PDF ({brideForm.profile.displayId})</span>
                </a>
              ) : (
                <span className="text-xs text-gray-400 italic">No Bride selected</span>
              )}
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2 rounded-xl bg-[#4A121A] hover:bg-[#3A0C13] text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5 text-[#DFBA73]" />
              <span>Print Matchmaker Certificate</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
