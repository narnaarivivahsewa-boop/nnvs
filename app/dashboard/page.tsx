"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

type User = {
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

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadUser();
  }, []);

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
      console.error("Dashboard user error:", err);
      setError("Unable to load your account.");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } finally {
      router.push("/login");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-lg text-gray-500">
          Loading your dashboard...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="rounded-2xl bg-white p-8 shadow-lg text-center">
          <p className="text-red-600">{error}</p>

          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-xl bg-red-800 px-6 py-3 text-white"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const profile = user.profile;

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">
              Member Dashboard
            </h1>

            <p className="mt-2 text-gray-600">
              Welcome,{" "}
              <span className="font-semibold text-red-800">
                {user.fullName || "Member"}
              </span>
            </p>
          </div>

          <button
            onClick={logout}
            className="rounded-xl border border-red-700 px-5 py-3 font-semibold text-red-700 transition hover:bg-red-50"
          >
            Logout
          </button>
        </div>

        {/* Profile Summary */}
        <div className="mb-8 rounded-3xl bg-white p-8 shadow-lg">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

            <div>
              <p className="text-sm font-medium text-gray-500">
                Profile ID
              </p>

              <h2 className="mt-1 text-2xl font-bold text-red-900">
                {profile?.profileId || "Profile Not Created"}
              </h2>

              <p className="mt-2 text-gray-600">
                Mobile: {user.mobile}
              </p>

              {user.email && (
                <p className="mt-1 text-gray-600">
                  Email: {user.email}
                </p>
              )}
            </div>

            <div className="text-left md:text-right">
              <p className="text-sm text-gray-500">
                Profile Completion
              </p>

              <p className="mt-1 text-3xl font-bold text-red-800">
                {profile?.profileCompletion ?? 0}%
              </p>

              <div className="mt-3 h-3 w-56 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-red-800 transition-all"
                  style={{
                    width: `${Math.min(
                      profile?.profileCompletion ?? 0,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>

          </div>
        </div>

        {/* Main Actions */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

          <Link
            href="/profile"
            className="rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="text-3xl">👤</div>

            <h3 className="mt-4 text-xl font-semibold">
              My Profile
            </h3>

            <p className="mt-2 text-gray-500">
              View your matrimonial profile.
            </p>
          </Link>

          <Link
            href="/profile/edit"
            className="rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="text-3xl">✏️</div>

            <h3 className="mt-4 text-xl font-semibold">
              Edit Profile
            </h3>

            <p className="mt-2 text-gray-500">
              Update your personal and matrimonial details.
            </p>
          </Link>

          <Link
            href="/profiles"
            className="rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="text-3xl">🔎</div>

            <h3 className="mt-4 text-xl font-semibold">
              Browse Profiles
            </h3>

            <p className="mt-2 text-gray-500">
              Find suitable matrimonial profiles.
            </p>
          </Link>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="text-3xl">💳</div>

            <h3 className="mt-4 text-xl font-semibold">
              Premium Membership
            </h3>

            <p className="mt-2 text-gray-500">
              Manage your membership and services.
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="text-3xl">🛡️</div>

            <h3 className="mt-4 text-xl font-semibold">
              Verification
            </h3>

            <p className="mt-2 text-gray-500">
              Account and profile verification status.
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="text-3xl">💍</div>

            <h3 className="mt-4 text-xl font-semibold">
              Wedding Vendors
            </h3>

            <p className="mt-2 text-gray-500">
              Explore wedding-related services.
            </p>
          </div>

        </div>

        {/* Status */}
        <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">
            Profile Status
          </h3>

          <div className="mt-4 grid gap-4 md:grid-cols-3">

            <div>
              <p className="text-sm text-gray-500">
                Approval
              </p>

              <p className="mt-1 font-semibold">
                {profile?.approvalStatus || "Not Created"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Visibility
              </p>

              <p className="mt-1 font-semibold">
                {profile?.isVisible ? "Visible" : "Hidden"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Payment
              </p>

              <p className="mt-1 font-semibold">
                {profile?.paymentCompleted
                  ? "Completed"
                  : "Pending"}
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}