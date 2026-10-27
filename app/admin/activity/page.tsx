"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  Users,
  UserCheck,
  Clock,
  Download,
  Search,
  RefreshCw,
  MessageSquare,
  Smartphone,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  KeyRound,
  Filter,
} from "lucide-react";

interface ProfileActivity {
  id: string;
  profileId: string;
  legacyProfileId: string | null;
  candidateName: string;
  mobile: string;
  gender: string | null;
  lastLoginDate: string | null;
  passwordChanged: boolean;
  isPending: boolean;
  source: string;
  paymentCompleted: boolean;
  approvalStatus: string;
  registeredAt: string;
}

interface Metrics {
  totalRegisteredProfiles: number;
  totalActiveProfiles: number;
  totalPendingProfiles: number;
  adoptionRatePercent: number;
}

export default function UserActivityDashboard() {
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<ProfileActivity[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({
    totalRegisteredProfiles: 0,
    totalActiveProfiles: 0,
    totalPendingProfiles: 0,
    adoptionRatePercent: 0,
  });

  const [filter, setFilter] = useState<"ALL" | "PENDING" | "ACTIVE">("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [copiedMobile, setCopiedMobile] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [, startTransition] = useTransition();

  // Load data
  const loadData = async (
    targetFilter = filter,
    targetSearch = search,
    targetPage = page
  ) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        filter: targetFilter,
        search: targetSearch,
        page: targetPage.toString(),
        limit: "25",
      });

      const res = await fetch(`/api/admin/activity?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setProfiles(data.profiles || []);
        setMetrics(data.metrics || {
          totalRegisteredProfiles: 0,
          totalActiveProfiles: 0,
          totalPendingProfiles: 0,
          adoptionRatePercent: 0,
        });
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.totalCount || 0);
      } else {
        setActionError(data.message || "Failed to load activity data");
      }
    } catch (err: any) {
      console.error("Activity load error:", err);
      setActionError(err.message || "Network error loading data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(filter, search, page);
  }, [filter, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData(filter, search, 1);
  };

  const handleFilterChange = (newFilter: "ALL" | "PENDING" | "ACTIVE") => {
    setFilter(newFilter);
    setPage(1);
  };

  const handleCopyMobile = (mobile: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(mobile);
      setCopiedMobile(mobile);
      setTimeout(() => setCopiedMobile(null), 2000);
    }
  };

  // WhatsApp Reminder Link Generator
  const getWhatsAppReminderUrl = (p: ProfileActivity) => {
    const candidateName = p.candidateName || "Member";
    const text = `Namaste ${candidateName} ji,\n\nAapka RishteClub (NNVS Matrimony) profile [${p.profileId}] tayar hai! 💐\n\nKripya niche diye gaye link par jakar apne mobile number se login karein aur verified matches check karein:\n👉 https://www.rishteclub.com/login\n\nLogin ke baad kripya apna password update karein taaki aapka account surakshit rahe.\n\nKisi bhi sahayata ke liye is number par sampark karein.\n- Team RishteClub (Nar Naari Vivah Sewa)`;
    return `https://wa.me/91${p.mobile}?text=${encodeURIComponent(text)}`;
  };

  // Log reminder click
  const logReminder = async (p: ProfileActivity, channel: "WHATSAPP" | "SMS") => {
    try {
      await fetch("/api/admin/activity/reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: p.profileId,
          mobile: p.mobile,
          candidateName: p.candidateName,
          channel,
        }),
      });
      setActionSuccess(`Logged ${channel} reminder for ${p.candidateName} (${p.mobile})`);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch {
      // Ignore background log error
    }
  };

  // Reset password to default
  const handleResetPassword = async (p: ProfileActivity) => {
    if (
      !confirm(
        `Reset password for ${p.candidateName} (${p.mobile}) to default temporary password 'NNVS@RC2026'?\n\nThey will be required to set a new password on their next login.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch("/api/admin/activity/reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: p.profileId,
          mobile: p.mobile,
          candidateName: p.candidateName,
          action: "RESET_DEFAULT_PASSWORD",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(data.message);
        loadData(filter, search, page);
      } else {
        setActionError(data.message || "Failed to reset password");
      }
    } catch (err: any) {
      setActionError(err.message || "Network error");
    }
  };

  // Download CSV export
  const handleExportCSV = async (exportFilter = filter) => {
    try {
      setIsExporting(true);
      const url = `/api/admin/activity?filter=${exportFilter}&export=true&format=csv`;
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `NNVS-${exportFilter}-Fast2SMS-Campaign.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setActionSuccess(`Export initiated for ${exportFilter} users list.`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      setActionError("Failed to trigger export download.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 font-serif-luxury">
            User Activity &amp; Password Adoption
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Track user portal onboarding, initial logins, password migrations, and campaign follow-ups.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Export Pending Campaign List */}
          <button
            type="button"
            onClick={() => handleExportCSV("PENDING")}
            disabled={isExporting}
            className="inline-flex items-center gap-2 rounded-xl bg-[#4A121A] px-3.5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#300B11] transition disabled:opacity-50"
            title="Download 10-digit mobile numbers formatted for Fast2SMS / WhatsApp campaign"
          >
            <Download className="h-4 w-4 text-[#DFBA73]" />
            <span>Export Pending List (CSV)</span>
          </button>

          <button
            type="button"
            onClick={() => loadData(filter, search, page)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2.5 text-xs font-bold text-gray-700 border border-gray-200 shadow-xs hover:bg-gray-50 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs font-semibold text-emerald-800 flex items-center justify-between">
          <span>✓ {actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-600 hover:text-emerald-900 font-bold">
            &times;
          </button>
        </div>
      )}

      {actionError && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-3.5 text-xs font-semibold text-red-800 flex items-center justify-between">
          <span>⚠️ {actionError}</span>
          <button onClick={() => setActionError(null)} className="text-red-600 hover:text-red-900 font-bold">
            &times;
          </button>
        </div>
      )}

      {/* Top 3 Adoption Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Registered Profiles */}
        <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-900">
              Total Registered Profiles
            </span>
            <div className="rounded-xl p-2.5 bg-blue-600 text-white shadow-xs">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-black font-mono text-blue-950">
              {metrics.totalRegisteredProfiles}
            </div>
            <p className="text-[11px] text-blue-700 font-medium">
              All registered candidate profiles in database
            </p>
          </div>
        </div>

        {/* Total Users Logged In / Password Changed */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
              Active / Password Changed
            </span>
            <div className="rounded-xl p-2.5 bg-emerald-600 text-white shadow-xs">
              <UserCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-black font-mono text-emerald-950">
              {metrics.totalActiveProfiles}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-emerald-800 font-bold">
              <span>{metrics.adoptionRatePercent}% Adoption Rate</span>
              <span className="text-emerald-500">&bull;</span>
              <span className="text-emerald-600 font-normal">Active &amp; Onboarded</span>
            </div>
          </div>
        </div>

        {/* Total Pending Users */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
              Pending / Never Logged In
            </span>
            <div className="rounded-xl p-2.5 bg-amber-600 text-white shadow-xs">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-black font-mono text-amber-950">
              {metrics.totalPendingProfiles}
            </div>
            <p className="text-[11px] text-amber-800 font-medium">
              Password not updated &bull; Fast2SMS / WhatsApp campaign target
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="rounded-2xl bg-white p-4 sm:p-5 border border-gray-100 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-gray-100/80 rounded-xl text-xs font-bold w-fit">
            <button
              type="button"
              onClick={() => handleFilterChange("ALL")}
              className={`px-3.5 py-1.5 rounded-lg transition ${
                filter === "ALL"
                  ? "bg-white text-gray-900 shadow-xs font-extrabold"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              All Profiles ({metrics.totalRegisteredProfiles})
            </button>
            <button
              type="button"
              onClick={() => handleFilterChange("PENDING")}
              className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                filter === "PENDING"
                  ? "bg-amber-600 text-white shadow-xs font-extrabold"
                  : "text-amber-800 hover:text-amber-950"
              }`}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Pending / Never Logged In ({metrics.totalPendingProfiles})</span>
            </button>
            <button
              type="button"
              onClick={() => handleFilterChange("ACTIVE")}
              className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                filter === "ACTIVE"
                  ? "bg-emerald-600 text-white shadow-xs font-extrabold"
                  : "text-emerald-800 hover:text-emerald-950"
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Active / Logged In ({metrics.totalActiveProfiles})</span>
            </button>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search Candidate, Profile ID, Mobile..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2 pl-9 pr-3 text-xs text-gray-900 placeholder-gray-400 focus:bg-white focus:border-[#4A121A] focus:outline-none focus:ring-1 focus:ring-[#4A121A]"
              />
            </div>
            <button
              type="submit"
              className="rounded-xl bg-[#4A121A] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#300B11] transition"
            >
              Search
            </button>
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  loadData(filter, "", 1);
                }}
                className="text-xs text-gray-500 hover:text-gray-800 font-semibold underline"
              >
                Clear
              </button>
            )}
          </form>
        </div>

        {/* Secondary Bar with Quick Actions */}
        <div className="flex flex-wrap items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-gray-400" />
            <span>
              Showing <strong className="text-gray-900">{profiles.length}</strong> of{" "}
              <strong className="text-gray-900">{totalCount}</strong> profiles
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleExportCSV(filter)}
              className="text-[#7A5835] hover:text-[#4A121A] font-bold hover:underline inline-flex items-center gap-1"
            >
              <Download className="h-3 w-3" />
              <span>Export Current View (CSV)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Profiles Activity Table */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAF8F5] border-b border-gray-100 text-gray-700 uppercase tracking-wider text-[11px] font-bold">
                <th className="py-3 px-4">Profile ID</th>
                <th className="py-3 px-4">Candidate Name</th>
                <th className="py-3 px-4">Mobile Number</th>
                <th className="py-3 px-4">Last Login Date</th>
                <th className="py-3 px-4 text-center">Password Changed</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Quick Follow-up Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-[#C5A059]" />
                    <p className="font-semibold text-xs">Loading activity records...</p>
                  </td>
                </tr>
              ) : profiles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="font-bold text-sm text-gray-700">No profiles found</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Try switching filter tabs or clearing your search term.
                    </p>
                  </td>
                </tr>
              ) : (
                profiles.map((p) => {
                  const whatsappUrl = getWhatsAppReminderUrl(p);

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-[#FAF8F5]/80 transition text-gray-800"
                    >
                      {/* Profile ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-[#4A121A]">
                        <div className="flex items-center gap-1.5">
                          <span>{p.profileId}</span>
                          {p.legacyProfileId && (
                            <span className="text-[10px] text-gray-400 font-normal">
                              ({p.legacyProfileId})
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-sans font-medium text-gray-400">
                          {p.source}
                        </span>
                      </td>

                      {/* Candidate Name */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-gray-900">{p.candidateName}</div>
                        <div className="text-[10px] text-gray-400">
                          Registered: {new Date(p.registeredAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                      </td>

                      {/* Mobile Number with Copy */}
                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1.5 font-mono text-gray-900 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                          <Smartphone className="h-3 w-3 text-gray-400" />
                          <span className="font-bold">{p.mobile}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyMobile(p.mobile)}
                            className="text-gray-400 hover:text-gray-700 ml-0.5"
                            title="Copy 10-digit number"
                          >
                            {copiedMobile === p.mobile ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Last Login Date */}
                      <td className="py-3.5 px-4">
                        {p.lastLoginDate ? (
                          <div>
                            <span className="font-bold text-gray-900 block">
                              {new Date(p.lastLoginDate).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {new Date(p.lastLoginDate).toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-bold text-gray-600">
                            <Clock className="h-3 w-3 text-gray-400" />
                            <span>Never Logged In</span>
                          </span>
                        )}
                      </td>

                      {/* Password Changed (Yes/No) */}
                      <td className="py-3.5 px-4 text-center">
                        {p.passwordChanged ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Yes</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-900">
                            <XCircle className="h-3.5 w-3.5 text-amber-600" />
                            <span>No</span>
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            p.isPending
                              ? "bg-amber-100 text-amber-900 border border-amber-200"
                              : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          }`}
                        >
                          {p.isPending ? "Pending Follow-up" : "Adopted / Active"}
                        </span>
                      </td>

                      {/* Quick Follow-up Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {/* Send WhatsApp Reminder */}
                          <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => logReminder(p, "WHATSAPP")}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-bold text-white shadow-xs hover:bg-emerald-700 transition"
                            title="Open WhatsApp with pre-composed reminder message"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            <span>WhatsApp</span>
                          </a>

                          {/* Fast2SMS Direct Trigger / Copy text */}
                          <button
                            type="button"
                            onClick={() => {
                              handleCopyMobile(p.mobile);
                              logReminder(p, "SMS");
                              alert(
                                `Mobile number ${p.mobile} copied!\n\nUse Fast2SMS or your SMS broadcast tool to send:\n"Namaste ${p.candidateName}, login to RishteClub at https://www.rishteclub.com/login with your mobile number to view matches and set your password."`
                              );
                            }}
                            className="inline-flex items-center gap-1 rounded-lg bg-blue-50 border border-blue-200 px-2.5 py-1.5 text-[11px] font-bold text-blue-700 hover:bg-blue-100 transition"
                            title="Copy number & log SMS reminder"
                          >
                            <Smartphone className="h-3.5 w-3.5 text-blue-600" />
                            <span>SMS</span>
                          </button>

                          {/* Reset Password to Default */}
                          <button
                            type="button"
                            onClick={() => handleResetPassword(p)}
                            className="inline-flex items-center gap-1 rounded-lg bg-gray-100 border border-gray-200 px-2 py-1.5 text-[11px] font-bold text-gray-700 hover:bg-gray-200 transition"
                            title="Reset password to default temporary NNVS@RC2026"
                          >
                            <KeyRound className="h-3.5 w-3.5 text-gray-500" />
                            <span className="sr-only sm:not-sr-only">Reset</span>
                          </button>

                          {/* View Profile */}
                          <Link
                            href={`/admin/profiles?search=${encodeURIComponent(p.profileId)}`}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                            title="View full candidate profile in Admin"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-[#FAF8F5] border-t border-gray-100 text-xs">
            <span className="text-gray-500">
              Page <strong className="text-gray-900">{page}</strong> of{" "}
              <strong className="text-gray-900">{totalPages}</strong> ({totalCount} total profiles)
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page <= 1 || loading}
                className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page >= totalPages || loading}
                className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Campaign Instructions & Fast2SMS Help Box */}
      <div className="rounded-2xl bg-[#FAF8F5] p-5 border border-[#E8DCC8] shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#4A121A] mb-2 flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-[#C5A059]" />
          <span>Fast2SMS &amp; WhatsApp Campaign Guide for Admin</span>
        </h3>
        <p className="text-xs text-gray-600 leading-relaxed">
          To conduct a bulk outreach campaign for pending members, click the{" "}
          <strong>&quot;Export Pending List (CSV)&quot;</strong> button at the top. The exported CSV file contains clean,
          10-digit Indian mobile numbers ready to be uploaded directly into Fast2SMS Quick SMS / Bulk Sender, or imported
          into WhatsApp Business Broadcast lists.
        </p>
      </div>
    </div>
  );
}
