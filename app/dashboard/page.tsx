"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  User,
  Edit3,
  Search,
  LogOut,
  Sparkles,
  ArrowRight,
  Eye,
  CheckCircle2,
  AlertCircle,
  Users,
  Bot,
} from "lucide-react";
import AIMatchmakerModal from "@/components/AIMatchmakerModal";

type UserProfile = {
  id: string;
  profileId: string;
  oldNnvsId?: string | null;
  legacyProfileId?: string | null;
  profileCompletion: number;
  firstName: string | null;
  lastName: string | null;
  approvalStatus: string;
  isVisible: boolean;
  paymentCompleted: boolean;
  isPaymentExempted?: boolean;
};

type UserData = {
  id: string;
  fullName: string | null;
  mobile: string;
  email: string | null;
  gender: string | null;
  role: string;
  status: string;
  mobileVerified: boolean;
  mustChangePassword?: boolean;
  profile: UserProfile | null;
  profiles: UserProfile[];
};

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<UserData | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState("");
  const [showAiModal, setShowAiModal] = useState(false);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          router.push("/login");
          return;
        }

        if (data.user?.mustChangePassword) {
          router.push("/profile/change-password");
          return;
        }

        setUser(data.user);
        if (data.user.profiles?.length > 0) {
          const matchedProfile = searchParams.get("profileId")
            ? data.user.profiles.find(
                (p: UserProfile) =>
                  p.id === searchParams.get("profileId") ||
                  p.profileId === searchParams.get("profileId")
              )
            : null;

          setSelectedProfileId(matchedProfile ? matchedProfile.id : data.user.profiles[0].id);
        }

        // Auto trigger AI Matchmaking onboarding modal if redirected after payment or onboarding flag
        if (
          searchParams.get("onboarding") === "true" ||
          searchParams.get("payment") === "success"
        ) {
          setShowAiModal(true);
        }
      } catch (err) {
        console.error("Dashboard load user error:", err);
        setError("Unable to load your account.");
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [router, searchParams]);

  async function logout() {
    try {
      setLoggingOut(true);
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } finally {
      setUser(null);
      setLoggingOut(false);
      router.push("/login");
    }
  }

  if (loading) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center bg-gray-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-red-800 border-t-transparent mb-4" />
        <p className="text-lg font-bold text-gray-700">Loading your member dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center bg-gray-50 px-4">
        <div className="rounded-3xl bg-white p-8 shadow-xl text-center max-w-md border border-gray-100">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-3" />
          <p className="text-gray-800 font-semibold">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-xl bg-red-800 px-6 py-2.5 text-sm font-bold text-white shadow"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const profilesList = user.profiles && user.profiles.length > 0 ? user.profiles : (user.profile ? [user.profile] : []);
  const profile = profilesList.find((p) => p.id === selectedProfileId || p.profileId === selectedProfileId) || profilesList[0] || null;
  const completion = profile?.profileCompletion ?? (profile ? 70 : 0);

  return (
    <div className="min-h-screen bg-gray-50/70 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        {/* Post-Payment Onboarding Alert Banner */}
        {searchParams.get("payment") === "success" && (
          <div className="mb-6 rounded-2xl bg-emerald-50 border border-emerald-300 p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="h-6 w-6 text-emerald-700" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-emerald-950">
                  Payment Verified Successfully!
                </h3>
                <p className="text-xs text-emerald-800">
                  Your profile has been submitted for Admin approval. Set your AI matchmaking preferences to receive top recommendations.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowAiModal(true)}
              className="rounded-xl bg-[#4A121A] px-4 py-2 text-xs font-bold text-white shadow hover:bg-[#380C13] transition"
            >
              Start AI Onboarding ✨
            </button>
          </div>
        )}

        {/* Welcome Header Bar */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-100/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-900 mb-2">
              <Sparkles className="h-3.5 w-3.5 text-red-700" />
              <span>Member Portal</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              Welcome, <span className="text-red-900">{profile?.firstName || user.fullName || "Member"}</span>
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage your matrimonial profile, preferences, and connections.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Multi-Profile Switcher Dropdown (If Parent owns multiple profiles) */}
            {profilesList.length > 1 && (
              <div className="flex items-center gap-2 rounded-2xl bg-white border-2 border-[#4A121A] px-3.5 py-2 shadow-sm">
                <Users className="h-4 w-4 text-[#C5A059]" />
                <span className="text-xs font-bold text-gray-700 whitespace-nowrap">Switch Profile:</span>
                <select
                  value={profile?.id || ""}
                  onChange={(e) => setSelectedProfileId(e.target.value)}
                  className="bg-transparent text-xs font-bold text-[#4A121A] focus:outline-none cursor-pointer"
                >
                  {profilesList.map((p, idx) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName ? `${p.firstName} (${p.profileId})` : `Profile #${idx + 1} (${p.profileId})`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="button"
              onClick={logout}
              disabled={loggingOut}
              className="inline-flex items-center gap-2 rounded-xl border border-red-800/80 bg-white px-5 py-2.5 text-sm font-bold text-red-900 shadow-sm transition hover:bg-red-50 disabled:opacity-60"
            >
              <LogOut className="h-4 w-4" />
              <span>{loggingOut ? "Logging out..." : "Logout"}</span>
            </button>
          </div>
        </div>

        {/* Profile Snapshot & Status Card */}
        <div className="mb-10 rounded-3xl bg-white p-6 lg:p-8 shadow-xl border border-gray-100">
          <div className="grid md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-7 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                <span>Profile Reference</span>
              </div>
              <div className="flex flex-wrap items-baseline gap-3">
                <h2 className="text-3xl font-black text-red-950 tracking-tight">
                  {profile?.profileId || "Profile ID Pending"}
                </h2>
                {(profile?.oldNnvsId || profile?.legacyProfileId) && (
                  <span className="inline-flex items-center rounded-lg bg-[#FAF0DC] px-2.5 py-1 text-xs font-bold text-[#7A1F2D] border border-[#DACBB4]">
                    Old NNVS ID: {profile.oldNnvsId || profile.legacyProfileId}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-gray-600 pt-1">
                <span>📱 {user.mobile}</span>
                {user.email && <span>✉️ {user.email}</span>}
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Status: {profile?.approvalStatus || "ACTIVE"}</span>
                </span>

                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3.5 py-1 text-xs font-bold text-blue-800 border border-blue-200">
                  <Eye className="h-3.5 w-3.5 text-blue-600" />
                  <span>Visibility: {profile?.isVisible ? "Public / Live" : "Private / Pending Review"}</span>
                </span>

                {(profile?.paymentCompleted || profile?.isPaymentExempted) && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-3.5 py-1 text-xs font-bold text-purple-800 border border-purple-200">
                    <span>✓ Membership Paid</span>
                  </span>
                )}
              </div>
            </div>

            {/* Completion Gauge / Progress Column */}
            <div className="md:col-span-5 bg-gradient-to-br from-rose-50/50 to-orange-50/40 p-6 rounded-2xl border border-rose-100/70">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-gray-700">Profile Completeness</span>
                <span className="text-sm font-black text-red-900">{completion}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-red-800 to-amber-600 h-3 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${completion}%` }}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href={profile?.profileId ? `/profile/${profile.profileId}` : "/profile"}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-red-900 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-red-800 transition"
                >
                  <User className="h-3.5 w-3.5" />
                  <span>View Biodata</span>
                </Link>

                <Link
                  href={`/profile/edit?profileId=${profile?.profileId || ""}`}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-red-800 bg-white px-4 py-2.5 text-xs font-bold text-red-900 hover:bg-rose-50 transition"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Edit Profile</span>
                </Link>

                {profile?.profileId && (
                  <a
                    href={`/api/profiles/${encodeURIComponent(profile.profileId)}/pdf`}
                    download
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-800 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition"
                  >
                    <span>Download PDF</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid md:grid-cols-4 gap-6">
          {/* AI Matchmaking Preferences Trigger Card */}
          <div
            onClick={() => setShowAiModal(true)}
            className="cursor-pointer group rounded-3xl bg-gradient-to-br from-[#4A121A] to-[#681925] p-6 shadow-md border border-[#C5A059]/40 text-white transition hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FAF0DC] text-[#4A121A] mb-4 group-hover:scale-110 transition">
              <Bot className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-[#DFBA73] mb-1">AI Matchmaking</h3>
            <p className="text-xs text-rose-100/90 mb-4 leading-relaxed">
              Answer the smart compatibility onboarding quiz to get tailored recommendations.
            </p>
            <div className="inline-flex items-center gap-1 text-xs font-bold text-[#DFBA73] group-hover:gap-2 transition-all">
              <span>{searchParams.get("payment") === "success" ? "Start Onboarding" : "Update Preferences"}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>

          <Link
            href="/profiles"
            className="group rounded-3xl bg-white p-6 shadow-md border border-gray-100 transition hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-red-900 mb-4 group-hover:scale-110 transition">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Search Matches</h3>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Explore thousands of verified profiles filtered by community, education, and location.
            </p>
            <div className="inline-flex items-center gap-1 text-xs font-bold text-red-900 group-hover:gap-2 transition-all">
              <span>Find Matches</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </Link>

          <Link
            href="/astrology"
            className="group rounded-3xl bg-white p-6 shadow-md border border-gray-100 transition hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-900 mb-4 group-hover:scale-110 transition">
              <Sparkles className="h-6 w-6 text-amber-700" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">AI Kundli & Astrology</h3>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Check 36 Guna Ashtakoota score, Manglik dosha compatibility, and Lal Kitab remedies.
            </p>
            <div className="inline-flex items-center gap-1 text-xs font-bold text-amber-900 group-hover:gap-2 transition-all">
              <span>Kundli Milan</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </Link>

          <Link
            href={profile?.profileId ? `/invoice?profileId=${encodeURIComponent(profile.profileId)}` : "/payment"}
            className="group rounded-3xl bg-white p-6 shadow-md border border-gray-100 transition hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-900 mb-4 group-hover:scale-110 transition">
              <CheckCircle2 className="h-6 w-6 text-emerald-700" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">GST Tax Invoice</h3>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Download your official GST tax invoice with SAC code and trade entity details.
            </p>
            <div className="inline-flex items-center gap-1 text-xs font-bold text-emerald-900 group-hover:gap-2 transition-all">
              <span>View Invoices</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </Link>
        </div>
      </div>

      {/* Post-Payment AI Matchmaker Onboarding Modal */}
      <AIMatchmakerModal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        profileId={profile?.id || profile?.profileId}
      />
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[75vh] flex flex-col items-center justify-center bg-gray-50">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-red-800 border-t-transparent mb-4" />
          <p className="text-lg font-bold text-gray-700">Loading your member dashboard...</p>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}