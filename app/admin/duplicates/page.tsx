"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  RefreshCw,
  MessageSquare,
  Eye,
  Check,
  X,
} from "lucide-react";

export default function DuplicatesPage() {
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const loadDuplicates = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/duplicates");
      const data = await res.json();

      if (data.success) {
        setDuplicates(data.duplicates || []);
      }
    } catch (err) {
      console.error("Error loading duplicates:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const res = await fetch("/api/admin/duplicates");
        const data = await res.json();
        if (!ignore && data.success) {
          setDuplicates(data.duplicates || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, []);

  const handleResolve = async (profileId: string) => {
    if (!confirm(`Are you sure you want to resolve and clear the duplicate flag for profile ${profileId}?`)) {
      return;
    }

    try {
      setResolvingId(profileId);
      setErrorMessage("");
      setSuccessMessage("");

      const res = await fetch("/api/admin/duplicates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId, action: "RESOLVE" }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccessMessage(data.message);
        loadDuplicates();
        setTimeout(() => setSuccessMessage(""), 4000);
      } else {
        setErrorMessage(data.message || "Failed to resolve duplicate flag.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 font-serif">Duplicate Detection</h1>
            <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              Multi-Signal AI Guard
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            Review accounts flagged for potential identity overlap, duplicate phone numbers, or existing registrations.
          </p>
        </div>

        <button
          onClick={() => {
            setRefreshing(true);
            loadDuplicates();
          }}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 bg-white border border-gray-300 px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition active:scale-95 self-start sm:self-auto"
        >
          <RefreshCw className={`h-4 w-4 text-[#7A5835] ${refreshing ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-2xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage("")} className="text-emerald-700 hover:text-emerald-900">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage("")} className="text-red-700 hover:text-red-900">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#7A5835] border-t-transparent mb-3" />
          <p className="text-gray-600 text-sm font-medium">Scanning for duplicate flags...</p>
        </div>
      ) : duplicates.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
          <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-900 font-serif">No Duplicate Flags</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
            All registered profiles are unique. The multi-signal duplicate prevention engine is actively monitoring new signups.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {duplicates.map((dup) => {
            const cleanPhone = (dup.mobile || "").replace(/[^0-9]/g, "").slice(-10);

            return (
              <div
                key={dup.id}
                className="bg-white rounded-2xl border-2 border-amber-200 p-5 shadow-sm space-y-4 hover:shadow-md transition"
              >
                {/* Top Badge & Profile IDs */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="inline-block bg-[#FAF5EB] text-[#7A5835] border border-[#DACBB4] text-xs font-mono font-bold px-2.5 py-0.5 rounded-md">
                      {dup.profileId}
                    </span>
                    {dup.legacyProfileId && (
                      <span className="inline-block ml-1.5 bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-mono font-bold px-2 py-0.5 rounded-md">
                        Old: {dup.legacyProfileId}
                      </span>
                    )}
                  </div>
                  <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 text-xs font-bold px-2.5 py-0.5 rounded-full">
                    <AlertTriangle className="h-3 w-3" />
                    Duplicate Flagged
                  </span>
                </div>

                {/* Candidate Name & Masked Mobile */}
                <div>
                  <h3 className="text-base font-bold text-gray-900 font-serif">{dup.name}</h3>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                    <span>Source: <strong className="text-gray-700">{dup.source || "Website"}</strong></span>
                    <span>•</span>
                    <span>Masked Mobile: <strong className="font-mono text-gray-800">{dup.maskedMobile}</strong></span>
                  </div>
                </div>

                {/* Matching Reason / Notes */}
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs space-y-1">
                  <div className="font-bold text-amber-900 flex items-center gap-1.5">
                    <ShieldAlert className="h-4 w-4 text-amber-700 flex-shrink-0" />
                    <span>Flag Reason:</span>
                  </div>
                  <p className="text-amber-800 font-medium">{dup.duplicateNotes}</p>

                  {dup.matchedProfile && (
                    <div className="mt-2 pt-2 border-t border-amber-200 text-[11px] text-amber-900 space-y-0.5">
                      <div><strong>Matched Existing Profile:</strong> {dup.matchedProfile.name} ({dup.matchedProfile.profileId})</div>
                      <div><strong>Existing Masked Mobile:</strong> {dup.matchedProfile.maskedMobile}</div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <Link
                    href={`/profile/${dup.profileId}`}
                    target="_blank"
                    className="inline-flex items-center justify-center gap-1 bg-gray-100 text-gray-700 py-2 px-2 rounded-xl text-xs font-semibold hover:bg-gray-200 transition"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>View</span>
                  </Link>

                  {cleanPhone ? (
                    <a
                      href={`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
                        `Namaste ${dup.name}, regarding your RishteClub profile (${dup.profileId}): We noticed an existing profile with similar details. Please confirm if this is your primary profile.`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-1 bg-emerald-600 text-white py-2 px-2 rounded-xl text-xs font-semibold hover:bg-emerald-700 transition"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  ) : (
                    <span />
                  )}

                  <button
                    onClick={() => handleResolve(dup.profileId)}
                    disabled={resolvingId === dup.profileId}
                    className="inline-flex items-center justify-center gap-1 bg-[#4A121A] text-white py-2 px-2 rounded-xl text-xs font-bold hover:bg-[#350d13] transition disabled:opacity-50"
                  >
                    {resolvingId === dup.profileId ? (
                      <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Check className="h-3.5 w-3.5 text-[#C5A059]" />
                        <span>Resolve Flag</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
