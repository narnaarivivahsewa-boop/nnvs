"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Sparkles,
  SlidersHorizontal,
  Search,
  FileSpreadsheet,
  FileDown,
  X,
  Eye,
  AlertTriangle,
  RotateCcw,
  Loader2,
  CheckCircle2,
  ChevronRight,
  HeartHandshake,
} from "lucide-react";
import MatrimonyAvatar from "@/components/MatrimonyAvatar";

interface CandidateMatcherProps {
  targetProfile: any;
}

export default function CandidateMatcher({ targetProfile }: CandidateMatcherProps) {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalMatches, setTotalMatches] = useState(0);

  // Filters State
  const [minAge, setMinAge] = useState<string>("");
  const [maxAge, setMaxAge] = useState<string>("");
  const [caste, setCaste] = useState<string>("");
  const [gotra, setGotra] = useState<string>("");
  const [excludeSameGotra, setExcludeSameGotra] = useState<boolean>(true);
  const [manglik, setManglik] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");

  // Kundali Modal State
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);
  const [kundaliLoading, setKundaliLoading] = useState(false);
  const [kundaliData, setKundaliData] = useState<any | null>(null);
  const [exporting, setExporting] = useState(false);

  // Auto-initialize partner preferences from target profile
  useEffect(() => {
    if (targetProfile) {
      if (targetProfile.partnerPreference?.minAge) {
        setMinAge(String(targetProfile.partnerPreference.minAge));
      }
      if (targetProfile.partnerPreference?.maxAge) {
        setMaxAge(String(targetProfile.partnerPreference.maxAge));
      }
      if (targetProfile.partnerPreference?.preferredCaste) {
        setCaste(targetProfile.partnerPreference.preferredCaste);
      }
    }
  }, [targetProfile]);

  const fetchMatches = useCallback(async () => {
    if (!targetProfile?.id) return;
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (minAge) params.set("minAge", minAge);
      if (maxAge) params.set("maxAge", maxAge);
      if (caste) params.set("caste", caste);
      if (gotra) params.set("gotra", gotra);
      if (excludeSameGotra) params.set("excludeSameGotra", "true");
      if (manglik !== "ALL") params.set("manglik", manglik);
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/profiles/${targetProfile.id}/match?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setCandidates(data.matches || []);
        setTotalMatches(data.totalMatches || 0);
      }
    } catch (err) {
      console.error("Failed to fetch matches:", err);
    } finally {
      setLoading(false);
    }
  }, [targetProfile?.id, minAge, maxAge, caste, gotra, excludeSameGotra, manglik, search]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const handleResetFilters = () => {
    setMinAge("");
    setMaxAge("");
    setCaste("");
    setGotra("");
    setExcludeSameGotra(false);
    setManglik("ALL");
    setSearch("");
  };

  const handleExportExcel = async () => {
    if (!targetProfile?.id) return;
    try {
      setExporting(true);
      const params = new URLSearchParams();
      if (minAge) params.set("minAge", minAge);
      if (maxAge) params.set("maxAge", maxAge);
      if (caste) params.set("caste", caste);
      if (gotra) params.set("gotra", gotra);
      if (excludeSameGotra) params.set("excludeSameGotra", "true");
      if (manglik !== "ALL") params.set("manglik", manglik);
      if (search) params.set("search", search);
      params.set("export", "excel");

      const res = await fetch(`/api/admin/profiles/${targetProfile.id}/match?${params.toString()}`);
      if (!res.ok) {
        alert("Failed to export Excel file.");
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Matching_Biodatas_${targetProfile.profileId}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export error:", err);
      alert("Error generating matching biodatas export.");
    } finally {
      setExporting(false);
    }
  };

  const openKundaliMilan = async (cand: any) => {
    setSelectedCandidate(cand);
    setKundaliLoading(true);
    setKundaliData(null);
    try {
      const res = await fetch(`/api/admin/profiles/${targetProfile.id}/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId: cand.id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setKundaliData(data);
      } else {
        alert(data.message || "Failed to calculate Kundali Milan.");
      }
    } catch (err) {
      console.error("Kundali error:", err);
      alert("Failed to calculate Kundali Milan.");
    } finally {
      setKundaliLoading(false);
    }
  };

  const targetGender = String(targetProfile?.user?.gender || "").toUpperCase();
  const oppositeGenderLabel = targetGender === "MALE" ? "Female (Brides)" : "Male (Grooms)";

  return (
    <div className="rounded-3xl border border-[#E8DCC8] bg-white p-6 shadow-sm space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#F0E6D8] pb-5">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#FAF0DC] px-3 py-1 text-xs font-bold text-[#4A121A] mb-1.5 border border-[#E2D4BE]">
            <HeartHandshake className="h-4 w-4 text-[#C5A059]" />
            <span>Smart Matchmaker & Kundali Milan Engine</span>
          </div>
          <h2 className="text-2xl font-bold font-serif text-[#2D221E]">
            Candidate Matches for {targetProfile.user?.fullName}
          </h2>
          <p className="mt-1 text-xs text-[#5A4E48]">
            Filter verified {oppositeGenderLabel} based on age, height, gotra, caste, and manglik alignment.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={exporting || candidates.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-800 transition disabled:opacity-50"
            title="Download consolidated matching candidate biodatas as Excel sheet"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
            <span>Export Biodatas (Excel)</span>
          </button>
        </div>
      </div>

      {/* Interactive Filters Grid */}
      <div className="rounded-2xl bg-[#FAF8F5] border border-[#E8DCC8] p-4 text-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-bold uppercase tracking-wider text-[#7A5835] flex items-center gap-1.5">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filter Matching Candidates
          </span>
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-[#4A121A]"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Min Age */}
          <div>
            <label className="block text-[11px] font-bold text-gray-700 mb-1">Min Age (Yrs)</label>
            <input
              type="number"
              placeholder="e.g. 21"
              value={minAge}
              onChange={(e) => setMinAge(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs focus:ring-1 focus:ring-[#7A5835] outline-none"
            />
          </div>

          {/* Max Age */}
          <div>
            <label className="block text-[11px] font-bold text-gray-700 mb-1">Max Age (Yrs)</label>
            <input
              type="number"
              placeholder="e.g. 32"
              value={maxAge}
              onChange={(e) => setMaxAge(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs focus:ring-1 focus:ring-[#7A5835] outline-none"
            />
          </div>

          {/* Caste */}
          <div>
            <label className="block text-[11px] font-bold text-gray-700 mb-1">Caste / Community</label>
            <input
              type="text"
              placeholder="e.g. Arora, Khatri..."
              value={caste}
              onChange={(e) => setCaste(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs focus:ring-1 focus:ring-[#7A5835] outline-none"
            />
          </div>

          {/* Gotra */}
          <div>
            <label className="block text-[11px] font-bold text-gray-700 mb-1">Gotra Keyword</label>
            <input
              type="text"
              placeholder="e.g. Kashyap, Garg"
              value={gotra}
              onChange={(e) => setGotra(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs focus:ring-1 focus:ring-[#7A5835] outline-none"
            />
          </div>

          {/* Manglik */}
          <div>
            <label className="block text-[11px] font-bold text-gray-700 mb-1">Manglik Status</label>
            <select
              value={manglik}
              onChange={(e) => setManglik(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white px-2 py-1.5 text-xs focus:ring-1 focus:ring-[#7A5835] outline-none"
            >
              <option value="ALL">Any Manglik Status</option>
              <option value="NON_MANGLIK">Non-Manglik Only</option>
              <option value="MANGLIK">Manglik Only</option>
            </select>
          </div>

          {/* Search Keyword */}
          <div>
            <label className="block text-[11px] font-bold text-gray-700 mb-1">Name / City / Job</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search text..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white pl-8 pr-3 py-1.5 text-xs focus:ring-1 focus:ring-[#7A5835] outline-none"
              />
            </div>
          </div>
        </div>

        {/* Sagotra Exclusion Checkbox */}
        <div className="pt-2 border-t border-gray-200/60 flex items-center gap-2">
          <input
            type="checkbox"
            id="excludeSameGotra"
            checked={excludeSameGotra}
            onChange={(e) => setExcludeSameGotra(e.target.checked)}
            className="rounded border-gray-300 text-[#4A121A] focus:ring-[#4A121A]"
          />
          <label htmlFor="excludeSameGotra" className="text-xs font-semibold text-gray-700 cursor-pointer">
            Exclude Same Gotra (Sagotra) Profiles automatically for Hindu marriage compliance
          </label>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-[#5A4E48]">
        <div>
          Showing <strong className="text-[#4A121A] font-bold text-sm">{candidates.length}</strong> matching opposite-gender candidates
        </div>
        {loading && (
          <div className="flex items-center gap-1.5 text-[#7A5835] font-semibold">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Calculating Guna Milan scores...</span>
          </div>
        )}
      </div>

      {/* Matches Grid */}
      {candidates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {candidates.map((cand) => (
            <div
              key={cand.id}
              className="rounded-2xl border border-[#E8DCC8] bg-[#FAF8F5] p-4 shadow-2xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="flex items-start gap-3">
                <div className="relative h-20 w-20 flex-shrink-0 rounded-xl overflow-hidden border border-[#DACBB4]">
                  <MatrimonyAvatar
                    imageUrl={cand.photos?.[0]?.imageUrl}
                    fullName={cand.user?.fullName}
                    gender={cand.user?.gender}
                    size="md"
                    badge={false}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-serif font-bold text-base text-gray-900 truncate">
                      {cand.user?.fullName}
                    </h4>
                    <span className="font-mono text-[10px] font-bold text-[#7A5835] bg-[#FAF0DC] px-2 py-0.5 rounded border border-[#E2D4BE]">
                      {cand.profileId}
                    </span>
                  </div>

                  <div className="text-xs text-gray-600 mt-1 flex flex-wrap gap-x-2 gap-y-0.5">
                    <span>{cand.calculatedAge ? `${cand.calculatedAge} Yrs` : "Age N/A"}</span>
                    <span>&bull;</span>
                    <span>{cand.height || "Height N/A"}</span>
                    <span>&bull;</span>
                    <span className="font-medium text-[#4A121A]">{cand.caste || "Caste N/A"}</span>
                  </div>

                  <div className="text-xs text-gray-500 mt-0.5">
                    <span>Gotra: </span>
                    <strong className="text-gray-800">{cand.gotra || "Not specified"}</strong>
                    {cand.isSameGotra && (
                      <span className="ml-2 text-[10px] font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded">
                        Same Gotra
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-gray-500 mt-0.5 truncate">
                    <span>{cand.occupation?.profession || cand.education?.highestQualification || cand.birthPlace || "-"}</span>
                  </div>
                </div>
              </div>

              {/* Guna Milan Score Strip */}
              <div className="mt-3 pt-3 border-t border-[#E8DCC8] flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 rounded-lg bg-white px-2 py-1 border border-[#DACBB4] font-bold text-[#4A121A]">
                    <Sparkles className="h-3.5 w-3.5 text-[#C5A059]" />
                    <span>{cand.gunaScore !== null ? `${cand.gunaScore} / 36 Gunas` : "Guna N/A"}</span>
                  </div>
                  <span className={`text-[11px] font-semibold ${
                    cand.gunaScore && cand.gunaScore >= 18 ? "text-emerald-700" : "text-amber-700"
                  }`}>
                    {cand.gunaVerdict}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => openKundaliMilan(cand)}
                    className="rounded-lg bg-[#4A121A] text-white px-2.5 py-1.5 text-xs font-bold hover:bg-[#350d13] transition shadow-2xs"
                  >
                    Kundali Milan
                  </button>

                  <a
                    href={`/api/profiles/${cand.id}/pdf`}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-white border border-gray-300 p-1.5 text-gray-600 hover:text-red-700 hover:border-red-300 transition"
                    title="Download Candidate PDF"
                  >
                    <FileDown className="h-3.5 w-3.5" />
                  </a>

                  <Link
                    href={`/profile/${cand.profileId}`}
                    className="rounded-lg bg-white border border-gray-300 p-1.5 text-gray-600 hover:text-[#4A121A] hover:border-[#4A121A] transition"
                    title="View Profile (In-App)"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : !loading ? (
        <div className="rounded-2xl border border-dashed border-[#DACBB4] bg-[#FAF8F5] p-8 text-center text-gray-500">
          <HeartHandshake className="mx-auto h-8 w-8 text-[#C5A059] mb-2" />
          <p className="font-bold text-gray-800 text-sm">No Matching Opposite-Gender Profiles Found</p>
          <p className="text-xs text-gray-500 mt-1">
            Try broadening your age, caste, or gotra filters to see more candidates.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="mt-3 inline-flex items-center gap-1 rounded-xl bg-white border border-gray-300 px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50 shadow-2xs"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Filters</span>
          </button>
        </div>
      ) : null}

      {/* COMPREHENSIVE KUNDALI MILAN MODAL */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white border border-[#E8DCC8] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#F0E6D8] pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#C5A059] mb-1">
                  <Sparkles className="h-4 w-4" />
                  <span>36 Guna Ashtakoota & Horoscope Milan</span>
                </div>
                <h3 className="text-xl font-bold font-serif text-[#2D221E]">
                  Horoscope Matching Analysis
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCandidate(null)}
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Candidates Comparison Pill */}
            <div className="mt-4 grid grid-cols-2 gap-3 bg-[#FAF8F5] p-3 rounded-2xl border border-[#E8DCC8] text-xs">
              <div>
                <span className="text-gray-400 font-semibold block uppercase text-[10px]">Primary Profile</span>
                <strong className="text-gray-900 font-serif text-sm">{targetProfile.user?.fullName}</strong>
                <div className="text-gray-600 mt-0.5">
                  {targetProfile.user?.gender} • {targetProfile.caste || "Caste N/A"}
                </div>
                <div className="text-gray-500 text-[11px]">
                  Manglik: <strong>{targetProfile.manglik || "Non-Manglik"}</strong>
                </div>
              </div>

              <div>
                <span className="text-gray-400 font-semibold block uppercase text-[10px]">Matched Profile</span>
                <strong className="text-gray-900 font-serif text-sm">{selectedCandidate.user?.fullName}</strong>
                <div className="text-gray-600 mt-0.5">
                  {selectedCandidate.user?.gender} • {selectedCandidate.caste || "Caste N/A"}
                </div>
                <div className="text-gray-500 text-[11px]">
                  Manglik: <strong>{selectedCandidate.manglik || "Non-Manglik"}</strong>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            {kundaliLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#4A121A] mb-3" />
                <p className="text-xs font-bold text-gray-700">Calculating Ashtakoota 36 Guna Milan & Planetary Positions...</p>
              </div>
            ) : kundaliData?.gunaMilan ? (
              <div className="mt-5 space-y-5">
                {/* Score Card */}
                <div className="rounded-2xl bg-gradient-to-br from-[#4A121A] via-[#5C1924] to-[#7A1F2D] p-5 text-white text-center shadow-md">
                  <span className="text-xs uppercase tracking-widest text-[#DFBA73] font-bold">
                    Total Guna Score
                  </span>
                  <div className="mt-1 text-4xl sm:text-5xl font-black font-serif text-[#DFBA73]">
                    {kundaliData.gunaMilan.totalGuna} <span className="text-2xl text-white/80">/ 36</span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-white/90">
                    {kundaliData.gunaMilan.totalGuna >= 28
                      ? "Uttam Match (Highly Auspicious Union)"
                      : kundaliData.gunaMilan.totalGuna >= 18
                      ? "Madhyam Match (Auspicious & Favorable)"
                      : "Requires Lal Kitab Astrological Remedies (<18 Gunas)"}
                  </p>
                </div>

                {/* Gotra & Manglik Verdict */}
                <div className="space-y-2 text-xs">
                  {kundaliData.isSameGotra && (
                    <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-red-800">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                      <div>
                        <strong>Sagotra Warning (Same Gotra):</strong>
                        <p className="mt-0.5">{kundaliData.gotraMessage}</p>
                      </div>
                    </div>
                  )}

                  <div className="rounded-xl bg-[#FAF8F5] border border-[#E8DCC8] p-3">
                    <strong className="text-gray-900 block font-serif">Manglik Alignment Verdict:</strong>
                    <p className="text-gray-700 mt-0.5">{kundaliData.gunaMilan.manglikVerdict}</p>
                  </div>
                </div>

                {/* 8 Ashtakoota Gunas Breakdown */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                    Ashtakoota 36 Guna Breakdown
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {Object.entries(kundaliData.gunaMilan.breakdown || {}).map(([key, item]: any) => (
                      <div
                        key={key}
                        className="rounded-xl border border-gray-200 bg-white p-2.5 text-center shadow-2xs"
                      >
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">{key}</span>
                        <div className="text-base font-black text-[#4A121A] mt-0.5">
                          {item.scored} <span className="text-[11px] font-normal text-gray-400">/ {item.max}</span>
                        </div>
                        <span className="text-[10px] text-gray-600 block truncate mt-0.5" title={item.label}>
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Lal Kitab Remedies */}
                {kundaliData.gunaMilan.lalKitabData && (
                  <div className="rounded-2xl bg-amber-50/70 border border-amber-200 p-4 text-xs text-amber-900 space-y-2">
                    <strong className="font-bold font-serif text-sm block text-amber-950">
                      Lal Kitab Guidance & Remedies
                    </strong>
                    <ul className="list-disc pl-4 space-y-1">
                      {kundaliData.gunaMilan.lalKitabData.universalRemedies?.map((rem: string, i: number) => (
                        <li key={i}>{rem}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-gray-500">
                Could not retrieve complete Kundali data. Please verify birth date and time details.
              </div>
            )}

            {/* Modal Footer */}
            <div className="mt-6 flex justify-end gap-2 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={() => setSelectedCandidate(null)}
                className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100"
              >
                Close
              </button>
              <Link
                href={`/profile/${selectedCandidate.profileId}`}
                className="rounded-xl bg-[#4A121A] px-4 py-2 text-xs font-bold text-white hover:bg-[#350d13]"
              >
                View Full Candidate Profile
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
