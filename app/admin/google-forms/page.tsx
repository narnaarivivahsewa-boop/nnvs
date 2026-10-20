"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  FileSpreadsheet,
  Search,
  MessageSquare,
  Eye,
  Image as ImageIcon,
  ShieldCheck,
  RefreshCw,
  X,
  FileText,
  CheckCircle2,
  AlertCircle,
  Download,
} from "lucide-react";

export default function GoogleFormsMonitorPage() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [generatingPdfs, setGeneratingPdfs] = useState(false);
  const [pdfResult, setPdfResult] = useState<any | null>(null);

  const handleGeneratePdfs = async () => {
    try {
      setGeneratingPdfs(true);
      const res = await fetch("/api/admin/google-forms/generate-pdfs", {
        method: "POST",
      });
      const data = await res.json();
      setPdfResult(data);
    } catch (err: any) {
      setPdfResult({
        success: false,
        message: err?.message || "Failed to trigger batch PDF generation.",
      });
    } finally {
      setGeneratingPdfs(false);
    }
  };

  const loadProfiles = useCallback(async (query: string = "") => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/google-forms?search=${encodeURIComponent(query)}`);
      const data = await res.json();

      if (data.success) {
        setProfiles(data.profiles || []);
      }
    } catch (err) {
      console.error("Error loading Google Form profiles:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const res = await fetch(`/api/admin/google-forms?search=${encodeURIComponent(search)}`);
        const data = await res.json();
        if (!ignore && data.success) {
          setProfiles(data.profiles || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!ignore) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, [search]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 font-serif">Google Form Imports</h1>
            <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              Live Monitor
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            Read-only monitoring of Google Form responses synced into RishteClub profiles with legacy ID tracking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleGeneratePdfs}
            disabled={generatingPdfs}
            className="inline-flex items-center justify-center gap-2 bg-[#7A5835] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#634628] shadow-sm transition active:scale-95 disabled:opacity-50"
          >
            <FileText className={`h-4 w-4 ${generatingPdfs ? "animate-spin" : ""}`} />
            <span>{generatingPdfs ? "Scanning & Generating..." : "Generate Missing Paid PDFs"}</span>
          </button>

          <button
            onClick={() => {
              setRefreshing(true);
              loadProfiles(search);
            }}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 bg-white border border-gray-300 px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition active:scale-95"
          >
            <RefreshCw className={`h-4 w-4 text-[#7A5835] ${refreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Batch PDF Generation Result Modal / Card */}
      {pdfResult && (
        <div className={`p-4 rounded-2xl border shadow-sm ${pdfResult.success ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              {pdfResult.success ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              )}
              <div>
                <h4 className={`text-sm font-bold ${pdfResult.success ? "text-emerald-900" : "text-red-900"}`}>
                  {pdfResult.success ? "Batch PDF Generation Complete" : "Batch PDF Generation Failed"}
                </h4>
                <div className="mt-1 text-xs text-gray-700 space-y-1">
                  {pdfResult.success ? (
                    <>
                      <p>
                        Total Paid Profiles: <strong>{pdfResult.total}</strong> • Already on Disk: <strong>{pdfResult.alreadyPresentCount}</strong> • Newly Generated: <strong>{pdfResult.newlyGeneratedCount}</strong> • Failed: <strong>{pdfResult.failedCount}</strong>
                      </p>
                      {pdfResult.generatedList && pdfResult.generatedList.length > 0 && (
                        <div className="mt-2 bg-white/70 p-2 rounded-lg border border-emerald-200 font-mono text-[11px] max-h-32 overflow-y-auto">
                          {pdfResult.generatedList.map((item: string, idx: number) => (
                            <div key={idx}>✓ {item}</div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <p>{pdfResult.message || "An error occurred while generating missing PDFs."}</p>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => setPdfResult(null)}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Sync Safety Notice */}
      <div className="bg-[#FAF8F5] border border-[#EBE3D5] rounded-2xl p-4 flex items-start gap-3 text-xs text-gray-700 shadow-sm">
        <ShieldCheck className="h-5 w-5 text-[#7A5835] flex-shrink-0 mt-0.5" />
        <div>
          <strong className="text-gray-900 font-semibold">Protected Sync Engine:</strong> Automated synchronization is managed continuously via Google Apps Script. This monitor is strictly read-only and does not alter the sync cursor or re-import existing rows.
        </div>
      </div>

      {/* Search Filter */}
      <div className="bg-white p-4 rounded-2xl border border-[#EBE3D5] shadow-sm space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Old NNVS ID (e.g. NNVS-B-0001), RishteClub ID, name, or mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7A5835] focus:bg-white transition"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#7A5835] border-t-transparent mb-3" />
          <p className="text-gray-600 text-sm font-medium">Loading Google Form imported records...</p>
        </div>
      ) : profiles.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
          <FileSpreadsheet className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-900 font-serif">No Records Found</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
            {search ? "No imported records matched your search." : "Imported Google Form records will appear here."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Mobile Cards */}
          <div className="grid grid-cols-1 md:hidden gap-3.5">
            {profiles.map((p) => {
              const candidateName = `${p.firstName || ""} ${p.lastName || ""}`.trim() || p.user?.fullName || "Candidate";
              const mobile = p.user?.mobile || p.contactNumber || "";
              const cleanPhone = mobile.replace(/[^0-9]/g, "").slice(-10);
              const hasPhotos = p.photos && p.photos.length > 0;

              return (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl border border-[#EBE3D5] p-4 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className="font-mono text-xs font-bold text-[#7A5835] bg-[#FAF5EB] px-2 py-0.5 rounded-md border border-[#DACBB4]">
                          {p.profileId}
                        </span>
                        {p.legacyProfileId && (
                          <span className="font-mono text-xs font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            Old: {p.legacyProfileId}
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-gray-900 text-base font-serif">
                        {candidateName}
                      </h4>
                    </div>

                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        p.isVisible
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {p.isVisible ? "Live" : "Hidden"}
                    </span>
                  </div>

                  <div className="bg-[#FAF8F5] p-2.5 rounded-xl text-xs space-y-1 text-gray-700">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Mobile:</span>
                      <span className="font-mono font-bold text-gray-800">{mobile || "Not provided"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Gender & City:</span>
                      <span>
                        {p.user?.gender || "MALE"} • {p.career?.city || "India"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Photo Status:</span>
                      <span
                        className={`inline-flex items-center gap-1 font-semibold ${
                          hasPhotos ? "text-emerald-700" : "text-amber-700"
                        }`}
                      >
                        <ImageIcon className="h-3 w-3" />
                        {hasPhotos ? `${p.photos.length} Photo(s)` : "No Photo"}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Link
                      href={`/profile/${p.profileId}`}
                      target="_blank"
                      className="inline-flex items-center justify-center gap-1 bg-[#4A121A] text-white py-2 px-3 rounded-xl text-xs font-bold hover:bg-[#350d13] transition"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>View Profile</span>
                    </Link>

                    {cleanPhone ? (
                      <a
                        href={`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
                          `Namaste ${candidateName}, regarding your RishteClub profile (${p.profileId} / Old ID: ${p.legacyProfileId || "N/A"}): How can we assist you today?`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-1 bg-emerald-600 text-white py-2 px-3 rounded-xl text-xs font-semibold hover:bg-emerald-700 transition"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>WhatsApp</span>
                      </a>
                    ) : (
                      <span />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto bg-white rounded-2xl border border-[#EBE3D5] shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#4A121A] text-white text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Old NNVS ID</th>
                  <th className="px-4 py-3.5">RishteClub ID</th>
                  <th className="px-4 py-3.5">Candidate Name</th>
                  <th className="px-4 py-3.5">Mobile</th>
                  <th className="px-4 py-3.5">Photos</th>
                  <th className="px-4 py-3.5">Visibility</th>
                  <th className="px-4 py-3.5">Import Date</th>
                  <th className="px-4 py-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {profiles.map((p) => {
                  const candidateName = `${p.firstName || ""} ${p.lastName || ""}`.trim() || p.user?.fullName || "Candidate";
                  const mobile = p.user?.mobile || p.contactNumber || "";
                  const cleanPhone = mobile.replace(/[^0-9]/g, "").slice(-10);
                  const hasPhotos = p.photos && p.photos.length > 0;

                  return (
                    <tr key={p.id} className="hover:bg-[#FAF8F5] transition">
                      <td className="px-4 py-3.5 font-mono text-xs font-bold text-amber-900">
                        {p.legacyProfileId || "-"}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs font-bold text-[#7A5835]">
                        {p.profileId}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-gray-900 font-serif">
                        {candidateName}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-gray-700">
                        {mobile || "-"}
                      </td>
                      <td className="px-4 py-3.5 text-xs">
                        <span
                          className={`inline-flex items-center gap-1 font-semibold ${
                            hasPhotos ? "text-emerald-700" : "text-amber-700"
                          }`}
                        >
                          <ImageIcon className="h-3 w-3" />
                          {hasPhotos ? `${p.photos.length} Photo(s)` : "None"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full ${
                            p.isVisible
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {p.isVisible ? "Live" : "Hidden"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-600 whitespace-nowrap">
                        {new Date(p.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/profile/${p.profileId}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 bg-[#FAF5EB] text-[#7A5835] border border-[#DACBB4] px-2.5 py-1 rounded-lg text-xs font-bold hover:bg-[#F2E8D7] transition"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>View</span>
                          </Link>

                          {cleanPhone && (
                            <a
                              href={`https://wa.me/91${cleanPhone}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 bg-emerald-600 text-white px-2.5 py-1 rounded-lg text-xs font-semibold hover:bg-emerald-700 transition"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                              <span>WA</span>
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
