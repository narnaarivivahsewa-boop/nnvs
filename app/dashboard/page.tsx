"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
} from "lucide-react";

type UserProfile = {
  id: string;
  profileId: string;
  profileCompletion: number;
  firstName: string | null;
  lastName: string | null;
  approvalStatus: string;
  isVisible: boolean;
  paymentCompleted: boolean;
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
  profile: UserProfile | null;
};

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState("");

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

        setUser(data.user);
      } catch (err) {
        console.error("Dashboard load user error:", err);
        setError("Unable to load your account.");
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [router]);

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
            className="mt-6 rounded-full bg-red-800 px-8 py-3 text-sm font-bold text-white shadow hover:bg-red-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const profile = user.profile;
  const completion = profile?.profileCompletion ?? (profile ? 70 : 0);

  return (
    <div className="min-h-screen bg-gray-50/70 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        {/* Welcome Header Bar */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-100/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-900 mb-2">
              <Sparkles className="h-3.5 w-3.5 text-red-700" />
              <span>Member Portal</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              Welcome, <span className="text-red-900">{user.fullName || "Member"}</span>
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage your matrimonial profile, preferences, and connections.
            </p>
          </div>

          <div className="flex items-center gap-3">
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
              <h2 className="text-3xl font-black text-red-950 tracking-tight">
                {profile?.profileId || "Profile ID Pending"}
              </h2>

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
                  <span>Visibility: {profile?.isVisible ? "Visible" : "Members Only"}</span>
                </span>
              </div>
            </div>

            {/* Completion Gauge */}
            <div className="md:col-span-5 bg-gradient-to-br from-rose-50/60 to-red-50/40 rounded-2xl p-6 border border-rose-100/80">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-red-900">
                  Profile Completeness
                </span>
                <span className="text-2xl font-black text-red-900">{completion}%</span>
              </div>

              <div className="mt-3 h-3.5 w-full overflow-hidden rounded-full bg-gray-200 shadow-inner">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-red-700 to-rose-600 transition-all duration-700"
                  style={{ width: `${Math.min(completion, 100)}%` }}
                />
              </div>

              <p className="mt-3 text-xs text-gray-600">
                A 100% complete profile gets up to 4x more interest responses from suitable families.
              </p>
            </div>
          </div>
        </div>

        {/* Action Grid Tiles */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* My Profile */}
          <Link
            href="/profile"
            className="group rounded-3xl bg-white p-7 shadow-md border border-gray-100 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:border-red-200 flex flex-col justify-between"
          >
            <div>
              <div className="inline-flex p-3.5 rounded-2xl bg-rose-50 text-red-800 group-hover:bg-red-800 group-hover:text-white transition-colors shadow-sm">
                <User className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-xl font-bold text-gray-900 group-hover:text-red-900 transition-colors">
                View My Profile
              </h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                Preview how your complete matrimonial biodata appears to other prospective members.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1 text-sm font-bold text-red-800 group-hover:translate-x-1 transition-transform">
              <span>Open Profile</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </Link>

          {/* Edit Profile */}
          <Link
            href="/profile/edit"
            className="group rounded-3xl bg-white p-7 shadow-md border border-gray-100 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:border-red-200 flex flex-col justify-between"
          >
            <div>
              <div className="inline-flex p-3.5 rounded-2xl bg-amber-50 text-amber-800 group-hover:bg-amber-700 group-hover:text-white transition-colors shadow-sm">
                <Edit3 className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-xl font-bold text-gray-900 group-hover:text-amber-800 transition-colors">
                Edit Biodata
              </h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                Update education, career, family details, and partner preferences anytime.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1 text-sm font-bold text-amber-800 group-hover:translate-x-1 transition-transform">
              <span>Edit Details</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </Link>

          {/* Browse Matches */}
          <Link
            href="/profiles"
            className="group rounded-3xl bg-white p-7 shadow-md border border-gray-100 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:border-red-200 flex flex-col justify-between"
          >
            <div>
              <div className="inline-flex p-3.5 rounded-2xl bg-blue-50 text-blue-800 group-hover:bg-blue-700 group-hover:text-white transition-colors shadow-sm">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-xl font-bold text-gray-900 group-hover:text-blue-900 transition-colors">
                Search Matches
              </h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                Filter and discover verified prospective alliances based on age, education, and caste.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1 text-sm font-bold text-blue-800 group-hover:translate-x-1 transition-transform">
              <span>Explore Directory</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </Link>

          {/* GST Invoice & Receipts */}
          <Link
            href={profile?.profileId ? `/invoice?profileId=${encodeURIComponent(profile.profileId)}` : "/payment"}
            className="group rounded-3xl bg-white p-7 shadow-md border border-gray-100 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:border-[#DACBB4] flex flex-col justify-between sm:col-span-2 lg:col-span-3 bg-gradient-to-r from-[#FAF6EF] to-white"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-[#FAF5EB] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#7A5835] border border-[#E8DCC8] mb-2">
                  <span>GST Registered &bull; Trendy Traders</span>
                </div>
                <h3 className="text-xl font-bold text-[#4A121A]">
                  GST Tax Invoice & Payment Receipt
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  View and print your official GST tax invoice issued by Trendy Traders (RishteClub, Managed by NNVS Matrimony).
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-xl bg-[#4A121A] px-5 py-2.5 text-sm font-bold text-white shadow-md group-hover:bg-[#380C13] transition shrink-0 self-start sm:self-auto">
                <span>View GST Invoice</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}