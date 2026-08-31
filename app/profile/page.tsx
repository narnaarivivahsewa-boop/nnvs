"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Edit, GraduationCap, Users2, HeartHandshake } from "lucide-react";

type ProfileData = {
  profileId: string;
  religion?: string | null;
  caste?: string | null;
  motherTongue?: string | null;
  maritalStatus?: string | null;
  height?: string | number | null;
  user: {
    fullName: string | null;
    mobile: string;
    email: string | null;
    gender: string | null;
  };
  photos: {
    imageUrl: string;
    isPrimary: boolean;
  }[];
  family?: {
    fatherName?: string | null;
    motherName?: string | null;
    brothers?: number | null;
    sisters?: number | null;
    familyType?: string | null;
    familyStatus?: string | null;
  } | null;
  education?: {
    highestQualification?: string | null;
    college?: string | null;
    occupationField?: string | null;
  } | null;
  occupation?: {
    profession?: string | null;
    company?: string | null;
    annualIncome?: string | null;
  } | null;
  partnerPreference?: {
    minAge?: number | null;
    maxAge?: number | null;
    minHeight?: string | null;
    maxHeight?: string | null;
    preferredReligion?: string | null;
    preferredCaste?: string | null;
  } | null;
};

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/profile");
        const data = await res.json();

        if (res.ok && data.success) {
          setProfile(data.profile);
        }
      } catch (error) {
        console.error("Failed to load profile:", error);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-800 border-t-transparent mb-3" />
        <p className="text-gray-600 font-semibold">Loading Profile Details...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
        <div className="text-6xl mb-4">👤</div>
        <h2 className="text-2xl font-bold text-gray-800">Profile Not Found</h2>
        <p className="text-gray-500 mt-2">You have not created or completed your profile yet.</p>
        <Link
          href="/dashboard"
          className="mt-6 rounded-full bg-red-800 px-8 py-3 text-sm font-bold text-white shadow hover:bg-red-700 transition"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const mainPhoto =
    profile.photos?.find((p) => p.isPrimary)?.imageUrl ||
    profile.photos?.[0]?.imageUrl ||
    "/default-avatar.png";

  return (
    <div className="min-h-screen bg-gray-50/70 py-10">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm border hover:bg-gray-50 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>

          <Link
            href="/profile/edit"
            className="inline-flex items-center gap-2 rounded-xl bg-red-800 px-5 py-2 text-sm font-bold text-white shadow hover:bg-red-700 transition"
          >
            <Edit className="h-4 w-4" />
            <span>Edit Profile</span>
          </Link>
        </div>

        {/* Master Profile Card */}
        <div className="rounded-3xl bg-white p-8 shadow-xl border border-gray-100 mb-8">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="relative h-64 w-64 flex-shrink-0 rounded-2xl overflow-hidden bg-gray-100 border-2 border-white shadow-lg mx-auto md:mx-0">
              <img
                src={mainPhoto}
                alt="Profile Avatar"
                className="h-full w-full object-cover"
              />
            </div>

            <div className="flex-1 space-y-3">
              <div className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-900">
                {profile.profileId}
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
                {profile.user.fullName}
              </h1>

              <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 pt-2">
                <p><strong>Mobile:</strong> {profile.user.mobile}</p>
                <p><strong>Email:</strong> {profile.user.email || "-"}</p>
                <p><strong>Gender:</strong> {profile.user.gender || "-"}</p>
                <p><strong>Marital Status:</strong> {profile.maritalStatus || "-"}</p>
                <p><strong>Religion:</strong> {profile.religion || "-"}</p>
                <p><strong>Caste:</strong> {profile.caste || "-"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Grids */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Family */}
          <div className="rounded-3xl bg-white p-6 shadow-md border border-gray-100">
            <div className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4 border-b pb-2">
              <Users2 className="h-5 w-5 text-red-800" />
              <span>Family Background</span>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>Father:</strong> {profile.family?.fatherName || "-"}</p>
              <p><strong>Mother:</strong> {profile.family?.motherName || "-"}</p>
              <p><strong>Brothers:</strong> {profile.family?.brothers ?? "-"}</p>
              <p><strong>Sisters:</strong> {profile.family?.sisters ?? "-"}</p>
              <p><strong>Family Type:</strong> {profile.family?.familyType || "-"}</p>
              <p><strong>House Status:</strong> {profile.family?.familyStatus || "-"}</p>
            </div>
          </div>

          {/* Education & Profession */}
          <div className="rounded-3xl bg-white p-6 shadow-md border border-gray-100">
            <div className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4 border-b pb-2">
              <GraduationCap className="h-5 w-5 text-red-800" />
              <span>Education & Career</span>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>Highest Qualification:</strong> {profile.education?.highestQualification || "-"}</p>
              <p><strong>College:</strong> {profile.education?.college || "-"}</p>
              <p><strong>Occupation:</strong> {profile.occupation?.profession || "-"}</p>
              <p><strong>Company:</strong> {profile.occupation?.company || "-"}</p>
              <p><strong>Annual Income:</strong> {profile.occupation?.annualIncome || "-"}</p>
            </div>
          </div>

          {/* Partner Preference */}
          <div className="rounded-3xl bg-white p-6 shadow-md border border-gray-100 md:col-span-2">
            <div className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4 border-b pb-2">
              <HeartHandshake className="h-5 w-5 text-red-800" />
              <span>Partner Preference</span>
            </div>
            <div className="grid sm:grid-cols-3 gap-4 text-sm text-gray-600">
              <p>
                <strong>Age Range:</strong>{" "}
                {profile.partnerPreference?.minAge && profile.partnerPreference?.maxAge
                  ? `${profile.partnerPreference.minAge} - ${profile.partnerPreference.maxAge} Yrs`
                  : "-"}
              </p>
              <p><strong>Preferred Religion:</strong> {profile.partnerPreference?.preferredReligion || "-"}</p>
              <p><strong>Preferred Caste:</strong> {profile.partnerPreference?.preferredCaste || "-"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}