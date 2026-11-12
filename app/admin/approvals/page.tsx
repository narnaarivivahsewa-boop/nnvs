"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  Eye,
  MessageSquare,
  Search,
  RefreshCw,
  X,
  AlertTriangle,
} from "lucide-react";
import { getAuthSession } from "@/lib/auth/session-storage";
import ErrorToast from "@/components/ui/ErrorToast";

export default function ApprovalsPage() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    profileId: string;
    profileCode?: string;
    candidateName?: string;
    action: "APPROVE" | "REJECT";
  } | null>(null);
  const [toastError, setToastError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadApprovals = useCallback(async () => {
    try {
      setLoading(true);
      const { token } = await getAuthSession();
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch("/api/admin/approvals", {
        credentials: "include",
        headers,
      });
      const data = await res.json();

      if (data.success && Array.isArray(data.profiles)) {
        setProfiles(data.profiles);
      } else if (!res.ok) {
        setToastError(data.message || "Failed to load pending approvals.");
      }
    } catch (error) {
      console.error("Error loading approvals:", error);
      setToastError("Network error while loading pending approvals.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const { token } = await getAuthSession();
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        const res = await fetch("/api/admin/approvals", {
          credentials: "include",
          headers,
        });
        const data = await res.json();
        if (!ignore && data.success && Array.isArray(data.profiles)) {
          setProfiles(data.profiles);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, []);

  const executeAction = async () => {
    if (!pendingAction || processingId) return;
    const { profileId, action, candidateName } = pendingAction;

    try {
      setProcessingId(profileId);
      setToastError(null);
      setSuccessMessage(null);

      const { token } = await getAuthSession();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`/api/admin/approvals/${profileId}`, {
        method: "PATCH",
        headers,
        credentials: "include",
        body: JSON.stringify({ action }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setToastError(data.message || `Failed to ${action.toLowerCase()} profile`);
        return;
      }

      setSuccessMessage(
        data.message ||
          `Profile ${candidateName ? `(${candidateName}) ` : ""}${
            action === "APPROVE" ? "approved" : "rejected"
          } successfully.`
      );
      setPendingAction(null);
      loadApprovals();
    } catch (error) {
      console.error(error);
      setToastError("Something went wrong while updating the profile status.");
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = profiles.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.profileId?.toLowerCase().includes(q) ||
      p.legacyProfileId?.toLowerCase().includes(q) ||
      p.user?.fullName?.toLowerCase().includes(q) ||
      p.user?.mobile?.includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <ErrorToast
        message={toastError}
        onDismiss={() => setToastError(null)}
        title="Approval Action Notice"
      />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 font-serif">Pending Approvals</h1>
            <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              {profiles.length} Pending
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            Review, verify, and approve new member profiles before making them publicly searchable.
          </p>
        </div>

        <button
          onClick={loadApprovals}
          className="inline-flex items-center justify-center gap-2 bg-white border border-gray-300 px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition active:scale-95 self-start sm:self-auto"
        >
          <RefreshCw className="h-4 w-4 text-[#7A5835]" />
          <span>Refresh</span>
        </button>
      </div>

      {successMessage && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-[#EBE3D5] shadow-sm">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by RC ID, Old NNVS ID, name, or mobile..."
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
          <p className="text-gray-600 text-sm font-medium">Loading pending profiles...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
          <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-900 font-serif">No Pending Approvals</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
            {search ? "No profiles match your search." : "All newly registered member profiles have been processed."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Mobile Cards */}
          <div className="grid grid-cols-1 md:hidden gap-3.5">
            {filtered.map((p) => {
              const cleanPhone = (p.user?.mobile || "").replace(/[^0-9]/g, "").slice(-10);
              const isProcessing = processingId === p.id;

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
                        {p.user?.fullName}
                      </h4>
                    </div>

                    <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                      Pending
                    </span>
                  </div>

                  <div className="bg-[#FAF8F5] p-2.5 rounded-xl text-xs space-y-1 text-gray-700">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Mobile:</span>
                      <span className="font-mono font-bold text-gray-800">{p.user?.mobile || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Gender & Location:</span>
                      <span>{p.user?.gender || "MALE"} • {p.career?.city || "India"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Qualification:</span>
                      <span>{p.career?.education || "-"}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-4 gap-2 pt-1">
                    <Link
                      href={`/profile/${p.profileId}`}
                      target="_blank"
                      className="inline-flex items-center justify-center gap-1 bg-gray-100 text-gray-700 py-2 rounded-xl text-xs font-semibold hover:bg-gray-200 transition"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>View</span>
                    </Link>

                    {cleanPhone ? (
                      <a
                        href={`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
                          `Namaste ${p.user?.fullName}, regarding your RishteClub profile (${p.profileId}): We are reviewing your registration details.`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-1 bg-emerald-600 text-white py-2 rounded-xl text-xs font-semibold hover:bg-emerald-700 transition"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>WA</span>
                      </a>
                    ) : (
                      <span />
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        setPendingAction({
                          profileId: p.id,
                          profileCode: p.profileId,
                          candidateName: p.user?.fullName,
                          action: "REJECT",
                        })
                      }
                      disabled={isProcessing}
                      className="inline-flex items-center justify-center gap-1 bg-red-50 text-red-700 border border-red-200 py-2 rounded-xl text-xs font-bold hover:bg-red-100 transition disabled:opacity-50"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      <span>Reject</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setPendingAction({
                          profileId: p.id,
                          profileCode: p.profileId,
                          candidateName: p.user?.fullName,
                          action: "APPROVE",
                        })
                      }
                      disabled={isProcessing}
                      className="inline-flex items-center justify-center gap-1 bg-[#4A121A] text-white py-2 rounded-xl text-xs font-bold hover:bg-[#350d13] transition shadow-sm disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#C5A059]" />
                      <span>Approve</span>
                    </button>
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
                  <th className="px-4 py-3.5">Profile ID</th>
                  <th className="px-4 py-3.5">Name</th>
                  <th className="px-4 py-3.5">Mobile</th>
                  <th className="px-4 py-3.5">Gender</th>
                  <th className="px-4 py-3.5">Qualification</th>
                  <th className="px-4 py-3.5">Profession</th>
                  <th className="px-4 py-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((p) => {
                  const cleanPhone = (p.user?.mobile || "").replace(/[^0-9]/g, "").slice(-10);
                  const isProcessing = processingId === p.id;

                  return (
                    <tr key={p.id} className="hover:bg-[#FAF8F5] transition">
                      <td className="px-4 py-3.5">
                        <div className="font-mono text-xs font-bold text-[#7A5835]">{p.profileId}</div>
                        {p.legacyProfileId && (
                          <div className="font-mono text-xs font-bold text-amber-800">
                            Old: {p.legacyProfileId}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-gray-900 font-serif">
                        {p.user?.fullName}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-gray-700">
                        {p.user?.mobile}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-600">
                        {p.user?.gender}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-600">
                        {p.career?.education || "-"}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-600">
                        {p.career?.occupation || "-"}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/profile/${p.profileId}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 bg-[#FAF5EB] text-[#7A5835] border border-[#DACBB4] px-2.5 py-1.5 rounded-lg text-xs font-bold hover:bg-[#F2E8D7] transition"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>View</span>
                          </Link>

                          {cleanPhone && (
                            <a
                              href={`https://wa.me/91${cleanPhone}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 bg-emerald-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-emerald-700 transition"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                              <span>WA</span>
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              setPendingAction({
                                profileId: p.id,
                                profileCode: p.profileId,
                                candidateName: p.user?.fullName,
                                action: "REJECT",
                              })
                            }
                            disabled={isProcessing}
                            className="inline-flex items-center gap-1 bg-red-50 text-red-700 border border-red-200 px-2.5 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100 transition disabled:opacity-50"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Reject</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setPendingAction({
                                profileId: p.id,
                                profileCode: p.profileId,
                                candidateName: p.user?.fullName,
                                action: "APPROVE",
                              })
                            }
                            disabled={isProcessing}
                            className="inline-flex items-center gap-1 bg-[#4A121A] text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#350d13] transition shadow-sm disabled:opacity-50"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 text-[#C5A059]" />
                            <span>Approve</span>
                          </button>
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

      {pendingAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  pendingAction.action === "APPROVE"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {pendingAction.action === "APPROVE" ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <AlertTriangle className="h-5 w-5" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 font-serif">
                  {pendingAction.action === "APPROVE" ? "Approve Profile?" : "Reject Profile?"}
                </h3>
                <p className="mt-1 text-xs text-gray-600 leading-relaxed">
                  Are you sure you want to{" "}
                  <strong>{pendingAction.action.toLowerCase()}</strong>{" "}
                  <span className="font-semibold text-gray-900">
                    {pendingAction.candidateName || pendingAction.profileCode || "this profile"}
                  </span>
                  {pendingAction.profileCode ? ` (${pendingAction.profileCode})` : ""}?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setPendingAction(null)}
                disabled={processingId !== null}
                className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeAction}
                disabled={processingId !== null}
                className={`rounded-xl px-4 py-2 text-xs font-bold text-white shadow-sm transition disabled:opacity-50 ${
                  pendingAction.action === "APPROVE"
                    ? "bg-[#4A121A] hover:bg-[#350d13]"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {processingId
                  ? "Processing..."
                  : pendingAction.action === "APPROVE"
                  ? "Confirm Approval"
                  : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}