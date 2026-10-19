"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Users,
  User,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  LogOut,
  PlusCircle,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { saveAuthSession, clearAuthSession } from "@/lib/auth/session-storage";

interface ProfileItem {
  id: string;
  profileId: string;
  oldNnvsId?: string | null;
  legacyProfileId?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  gender?: string | null;
  photo?: string | null;
  dateOfBirth?: string | null;
  approvalStatus?: string;
  paymentCompleted?: boolean;
}

function calculateAge(dobStr?: string | null): number | null {
  if (!dobStr) return null;
  const dob = new Date(dobStr);
  if (isNaN(dob.getTime())) return null;
  const diff = Date.now() - dob.getTime();
  const ageDt = new Date(diff);
  return Math.abs(ageDt.getUTCFullYear() - 1970);
}

function SelectProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "";

  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<ProfileItem[]>([]);
  const [userName, setUserName] = useState<string>("");
  const [userMobile, setUserMobile] = useState<string>("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [switching, setSwitching] = useState<string | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    async function loadAccountProfiles() {
      try {
        setLoading(true);
        const res = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
        });

        if (!res.ok) {
          router.push(`/login${redirectUrl ? `?redirect=${encodeURIComponent(redirectUrl)}` : ""}`);
          return;
        }

        const data = await res.json();
        if (!data.success || !data.user) {
          router.push("/login");
          return;
        }

        const user = data.user;
        setUserName(user.fullName || "Member");
        setUserMobile(user.mobile || "");

        const list: ProfileItem[] = user.profiles || [];
        setProfiles(list);

        if (user.activeProfile?.id) {
          setSelectedId(user.activeProfile.id);
        } else if (list.length > 0) {
          setSelectedId(list[0].id);
        }

        // If only 1 profile exists, auto-select and proceed
        if (list.length === 1) {
          await handleSelectProfile(list[0].id);
        } else if (list.length === 0) {
          router.push("/dashboard");
        }
      } catch (err) {
        console.error("Failed to load profiles:", err);
        setError("Unable to load candidate profiles. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    loadAccountProfiles();
  }, [router, redirectUrl]);

  async function handleSelectProfile(profileId: string) {
    try {
      setSwitching(profileId);
      setError("");

      const res = await fetch("/api/auth/select-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ profileId }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Failed to switch profile.");
        setSwitching(null);
        return;
      }

      if (data.token) {
        await saveAuthSession(data.token, data.activeProfileId, data.activeProfile);
      }

      window.dispatchEvent(
        new CustomEvent("nnvs:profile-switched", { detail: { profileId } })
      );

      const targetDest = redirectUrl || data.redirectTo || "/dashboard";
      window.location.href = targetDest;
    } catch {
      setError("An unexpected error occurred while selecting the profile.");
      setSwitching(null);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      await clearAuthSession();
      router.push("/login");
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FAF6EF] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#4A121A] border-t-transparent mx-auto mb-4" />
          <p className="text-base font-bold text-[#4A121A]">Loading registered profiles...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAF6EF] flex flex-col justify-between py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl w-full">
        {/* Brand & Greeting */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-block mb-4">
            <img
              src="/nnvs-logo.png"
              alt="RishteClub Matrimony"
              className="h-14 sm:h-16 w-auto mx-auto object-contain"
            />
          </Link>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F0E6D6] border border-[#DACBB4] text-xs font-bold text-[#4A121A] mb-2">
            <Users className="h-3.5 w-3.5 text-[#C5A059]" />
            <span>Multiple Profiles Account</span>
          </div>

          <h1 className="font-serif-luxury text-2xl sm:text-4xl font-bold text-[#4A121A] tracking-tight">
            Select Candidate Profile
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-[#5A4E48] max-w-md mx-auto">
            Your registered mobile (<span className="font-bold text-[#2D221E]">{userMobile}</span>) manages {profiles.length} profiles. Select which profile you wish to manage today.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs font-semibold text-rose-800 flex items-center gap-2 max-w-xl mx-auto">
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Profile Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto">
          {profiles.map((p, idx) => {
            const fullName = [p.firstName, p.lastName].filter(Boolean).join(" ") || `Candidate Profile #${idx + 1}`;
            const age = calculateAge(p.dateOfBirth);
            const isCurrentlySelected = selectedId === p.id;
            const isPendingSwitch = switching === p.id;

            return (
              <div
                key={p.id}
                onClick={() => !switching && handleSelectProfile(p.id)}
                className={`group relative rounded-3xl p-6 transition-all cursor-pointer border-2 bg-white shadow-md hover:shadow-xl hover:-translate-y-1 ${
                  isCurrentlySelected
                    ? "border-[#4A121A] ring-2 ring-[#4A121A]/20 bg-[#FCF9F3]"
                    : "border-[#DACBB4] hover:border-[#C5A059]"
                }`}
              >
                {/* Active Indicator Badge */}
                {isCurrentlySelected && (
                  <div className="absolute top-4 right-4 inline-flex items-center gap-1 rounded-full bg-[#4A121A] px-2.5 py-0.5 text-[10px] font-bold text-[#DFBA73]">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Last Active</span>
                  </div>
                )}

                <div className="flex items-start gap-4">
                  {/* Photo or Initials Avatar */}
                  <div className="relative flex-shrink-0">
                    {p.photo ? (
                      <img
                        src={p.photo}
                        alt={fullName}
                        className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl object-cover border-2 border-[#C5A059] shadow-sm"
                      />
                    ) : (
                      <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-[#F0E6D6] border-2 border-[#DACBB4] flex items-center justify-center text-[#4A121A] font-bold text-xl sm:text-2xl font-serif-luxury shadow-inner">
                        {p.firstName ? p.firstName[0].toUpperCase() : <User className="h-8 w-8 text-[#8A7972]" />}
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 rounded-full bg-white p-0.5 shadow">
                      <span className="block h-3.5 w-3.5 rounded-full bg-emerald-500" />
                    </div>
                  </div>

                  {/* Profile Metadata */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-bold text-[#2D221E] truncate group-hover:text-[#4A121A] transition">
                      {fullName}
                    </h3>

                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span className="text-xs font-mono font-bold text-[#4A121A] bg-[#F4E8D6] px-2 py-0.5 rounded-md">
                        {p.profileId}
                      </span>
                      {(p.oldNnvsId || p.legacyProfileId) && (
                        <span className="text-[10px] font-semibold text-[#8A7972]">
                          Old: {p.oldNnvsId || p.legacyProfileId}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-[#5A4E48]">
                      {p.gender && (
                        <span className="font-semibold px-2 py-0.5 bg-[#FAF0DC] rounded text-[#7A1F2D]">
                          {p.gender === "MALE" ? "Groom (वर)" : "Bride (वधू)"}
                        </span>
                      )}
                      {age && <span>{age} Years</span>}
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <ShieldCheck className="h-3 w-3" />
                        <span>{p.approvalStatus || "ACTIVE"}</span>
                      </span>

                      {p.paymentCompleted && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                          <span>Paid ✓</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Continue Action Button */}
                <div className="mt-5 pt-4 border-t border-[#EBDCC8] flex items-center justify-between">
                  <span className="text-xs font-bold text-[#4A121A] group-hover:underline">
                    {isPendingSwitch ? "Opening Dashboard..." : "Select & Continue"}
                  </span>
                  <button
                    type="button"
                    disabled={isPendingSwitch}
                    className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-[#4A121A] text-white shadow group-hover:bg-[#C5A059] group-hover:scale-105 transition"
                  >
                    {isPendingSwitch ? (
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <ArrowRight className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Navigation Options */}
        <div className="mt-10 pt-6 border-t border-[#DACBB4] max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            href={`/register?mobile=${encodeURIComponent(userMobile)}`}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#4A121A] hover:text-[#C5A059] transition"
          >
            <PlusCircle className="h-4 w-4 text-[#C5A059]" />
            <span>Register Another Candidate Profile</span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#8A7972] hover:text-red-700 transition"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out / Switch Number</span>
          </button>
        </div>
      </div>

      <footer className="mt-12 text-center text-xs text-[#8A7972]">
        © 2026 RishteClub Matrimony (NNVS). Managed with sacred trust & verification.
      </footer>
    </main>
  );
}

export default function SelectProfilePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#FAF6EF] flex items-center justify-center px-4">
          <div className="text-center font-bold text-[#4A121A]">
            Loading profile selector...
          </div>
        </main>
      }
    >
      <SelectProfileContent />
    </Suspense>
  );
}
