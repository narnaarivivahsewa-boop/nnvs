"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Heart,
  Star,
  CheckCircle2,
  GraduationCap,
  Briefcase,
  Users2,
  HeartHandshake,
  User,
  ArrowLeft,
  Share2,
} from "lucide-react";

type Profile = {
  id: string;
  profileId: string;
  firstName: string;
  religion?: string;
  caste?: string;
  motherTongue?: string;
  maritalStatus?: string;
  height?: string;
  dateOfBirth?: string;

  user: {
    fullName: string;
    gender: string;
  };

  photos: {
    imageUrl: string;
    isPrimary: boolean;
  }[];

  family?: {
    fatherName?: string;
    motherName?: string;
    brothers?: number;
    sisters?: number;
    familyType?: string;
    familyStatus?: string;
  };

  education?: {
    highestQualification?: string;
    college?: string;
    occupationField?: string;
  };

  occupation?: {
    profession?: string;
    company?: string;
    annualIncome?: string;
  };

  partnerPreference?: {
    minAge?: number;
    maxAge?: number;
    minHeight?: string;
    maxHeight?: string;
    preferredReligion?: string;
    preferredCaste?: string;
  };
};

function calculateAge(dob?: string): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const month = today.getMonth() - birth.getMonth();
  if (month < 0 || (month === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return isNaN(age) || age <= 0 ? null : age;
}

export default function ProfileDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const profileId = params.profileId as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState<string>("");
  const [sending, setSending] = useState(false);
  const [shortlisting, setShortlisting] = useState(false);
  const [isShortlisted, setIsShortlisted] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch(`/api/profile/${profileId}`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          setProfile(null);
          return;
        }

        setProfile(data.profile);
        const primary = data.profile.photos?.find((p: { isPrimary: boolean; imageUrl: string }) => p.isPrimary)?.imageUrl || data.profile.photos?.[0]?.imageUrl || "";
        setActivePhoto(primary);

        const shortlistRes = await fetch(
          `/api/shortlist?shortlistedProfileId=${data.profile.id}`
        );

        if (shortlistRes.ok) {
          const shortlistData = await shortlistRes.json();
          setIsShortlisted(shortlistData.shortlisted);
        }
      } catch (error) {
        console.error("Failed to load profile details:", error);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [profileId]);

  const toggleShortlist = async () => {
    if (!profile) return;

    try {
      setShortlisting(true);
      setMessage(null);

      const res = await fetch("/api/shortlist", {
        method: isShortlisted ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shortlistedProfileId: profile.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ text: data.message || "Failed to update shortlist.", type: "error" });
        return;
      }

      setIsShortlisted(data.shortlisted);
      setMessage({ text: data.message, type: "success" });
    } catch {
      setMessage({ text: "Unable to update shortlist.", type: "error" });
    } finally {
      setShortlisting(false);
    }
  };

  const sendInterest = async () => {
    if (!profile) return;

    try {
      setSending(true);
      setMessage(null);

      const res = await fetch("/api/interest/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          receiverProfileId: profile.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ text: data.message || "Failed to send interest.", type: "error" });
        return;
      }

      setMessage({ text: data.message || "Interest sent successfully!", type: "success" });
    } catch {
      setMessage({ text: "Unable to send interest.", type: "error" });
    } finally {
      setSending(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${profile?.user.fullName} | RishteClub Matrimony Profile`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Profile link copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-gray-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-red-800 border-t-transparent mb-4" />
        <h2 className="text-xl font-bold text-gray-800">Loading Profile...</h2>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
        <div className="text-6xl mb-4">👤</div>
        <h2 className="text-3xl font-bold text-gray-900">Profile Not Found</h2>
        <p className="mt-2 text-gray-500 max-w-md">
          The requested profile does not exist or may have been updated.
        </p>
        <Link
          href="/profiles"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-red-800 px-8 py-3 text-sm font-bold text-white shadow hover:bg-red-700 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Profiles</span>
        </Link>
      </div>
    );
  }

  const isFemale = profile.user.gender?.toUpperCase() === "FEMALE";
  const age = calculateAge(profile.dateOfBirth);

  return (
    <div className="min-h-screen bg-gray-50/70 py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Navigation & Share Row */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm border border-gray-200 hover:bg-gray-50 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm border border-gray-200 hover:bg-gray-50 transition"
          >
            <Share2 className="h-4 w-4 text-red-800" />
            <span>Share Profile</span>
          </button>
        </div>

        {/* Message Banner */}
        {message && (
          <div
            className={`mb-6 rounded-2xl p-4 text-sm font-semibold shadow-sm flex items-center justify-between ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            <span>{message.text}</span>
            <button
              onClick={() => setMessage(null)}
              className="text-xs uppercase font-bold tracking-wider underline ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Profile Master Card */}
        <div className="overflow-hidden rounded-3xl bg-white shadow-xl border border-gray-100 mb-10">
          {/* Top Hero Section */}
          <div className="grid lg:grid-cols-12 gap-8 p-6 lg:p-10 border-b border-gray-100 bg-gradient-to-br from-red-950/5 via-rose-50/20 to-white">
            {/* Photos Column */}
            <div className="lg:col-span-5 space-y-4">
              <div className="relative h-[380px] w-full rounded-2xl overflow-hidden bg-gray-100 border-2 border-white shadow-lg flex items-center justify-center">
                {activePhoto ? (
                  <img
                    src={activePhoto}
                    alt={profile.user.fullName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-6">
                    <span className="text-7xl mb-2">{isFemale ? "👩" : "👨"}</span>
                    <span className="text-sm font-bold uppercase tracking-wider text-red-900">
                      {isFemale ? "Bride Profile" : "Groom Profile"}
                    </span>
                  </div>
                )}

                <div className="absolute top-3 left-3 rounded-full bg-black/60 backdrop-blur-md px-3 py-1 text-xs font-semibold text-white">
                  {profile.profileId}
                </div>

                <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Verified</span>
                </div>
              </div>

              {/* Thumbnails if multiple photos */}
              {profile.photos && profile.photos.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {profile.photos.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActivePhoto(p.imageUrl)}
                      className={`relative h-18 w-18 rounded-xl overflow-hidden border-2 transition ${
                        activePhoto === p.imageUrl ? "border-red-800 scale-105" : "border-gray-200 opacity-70"
                      }`}
                    >
                      <img src={p.imageUrl} alt="Thumbnail" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Profile Overview Column */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-900">
                    {profile.user.gender}
                  </span>
                  {profile.maritalStatus && (
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                      {profile.maritalStatus}
                    </span>
                  )}
                  {profile.religion && (
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
                      {profile.religion}
                    </span>
                  )}
                </div>

                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
                  {profile.user.fullName}
                </h1>

                <p className="mt-2 text-lg text-gray-600 font-medium">
                  {age ? `${age} Years Old` : "Age N/A"} • {profile.height ? String(profile.height) : "Height N/A"}
                </p>

                {profile.occupation?.profession && (
                  <div className="mt-4 flex items-center gap-2 text-gray-700 font-medium">
                    <Briefcase className="h-4 w-4 text-red-800" />
                    <span>{profile.occupation.profession}</span>
                    {profile.occupation.company && <span className="text-gray-400">at {profile.occupation.company}</span>}
                  </div>
                )}

                {profile.education?.highestQualification && (
                  <div className="mt-2 flex items-center gap-2 text-gray-700 font-medium">
                    <GraduationCap className="h-4 w-4 text-red-800" />
                    <span>{profile.education.highestQualification}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons Bar */}
              <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={sendInterest}
                  disabled={sending}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-800 to-red-900 px-8 py-3.5 font-bold text-white shadow-lg transition duration-200 hover:from-red-700 hover:to-red-800 hover:shadow-xl disabled:opacity-60"
                >
                  <Heart className="h-5 w-5 fill-white" />
                  <span>{sending ? "Sending Interest..." : "Send Interest"}</span>
                </button>

                <button
                  type="button"
                  onClick={toggleShortlist}
                  disabled={shortlisting}
                  className={`inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 font-bold border-2 transition ${
                    isShortlisted
                      ? "border-amber-500 bg-amber-50 text-amber-800"
                      : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Star className={`h-5 w-5 ${isShortlisted ? "fill-amber-500 text-amber-500" : ""}`} />
                  <span>{shortlisting ? "..." : isShortlisted ? "Shortlisted" : "Shortlist"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Details Section Grids */}
          <div className="p-6 lg:p-10 space-y-10">
            {/* Personal Details */}
            <div>
              <div className="flex items-center gap-2.5 text-xl font-bold text-gray-900 mb-5 border-b border-gray-100 pb-3">
                <User className="h-5 w-5 text-red-800" />
                <span>Personal & Social Information</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm">
                <div>
                  <p className="text-gray-400">Gender</p>
                  <p className="font-semibold text-gray-800 mt-1">{profile.user.gender || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-400">Date of Birth</p>
                  <p className="font-semibold text-gray-800 mt-1">
                    {profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Height</p>
                  <p className="font-semibold text-gray-800 mt-1">{profile.height ? String(profile.height) : "-"}</p>
                </div>
                <div>
                  <p className="text-gray-400">Marital Status</p>
                  <p className="font-semibold text-gray-800 mt-1">{profile.maritalStatus || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-400">Religion</p>
                  <p className="font-semibold text-gray-800 mt-1">{profile.religion || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-400">Caste / Gotra</p>
                  <p className="font-semibold text-gray-800 mt-1">{profile.caste || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-400">Mother Tongue</p>
                  <p className="font-semibold text-gray-800 mt-1">{profile.motherTongue || "-"}</p>
                </div>
              </div>
            </div>

            {/* Education & Career */}
            <div>
              <div className="flex items-center gap-2.5 text-xl font-bold text-gray-900 mb-5 border-b border-gray-100 pb-3">
                <GraduationCap className="h-5 w-5 text-red-800" />
                <span>Education & Occupation</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm">
                <div>
                  <p className="text-gray-400">Highest Qualification</p>
                  <p className="font-semibold text-gray-800 mt-1">{profile.education?.highestQualification || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-400">College / Institute</p>
                  <p className="font-semibold text-gray-800 mt-1">{profile.education?.college || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-400">Field of Study</p>
                  <p className="font-semibold text-gray-800 mt-1">{profile.education?.occupationField || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-400">Profession</p>
                  <p className="font-semibold text-gray-800 mt-1">{profile.occupation?.profession || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-400">Company / Organization</p>
                  <p className="font-semibold text-gray-800 mt-1">{profile.occupation?.company || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-400">Annual Income</p>
                  <p className="font-semibold text-gray-800 mt-1">{profile.occupation?.annualIncome || "-"}</p>
                </div>
              </div>
            </div>

            {/* Family Background */}
            <div>
              <div className="flex items-center gap-2.5 text-xl font-bold text-gray-900 mb-5 border-b border-gray-100 pb-3">
                <Users2 className="h-5 w-5 text-red-800" />
                <span>Family Background</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm">
                <div>
                  <p className="text-gray-400">Father&apos;s Name</p>
                  <p className="font-semibold text-gray-800 mt-1">{profile.family?.fatherName || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-400">Mother&apos;s Name</p>
                  <p className="font-semibold text-gray-800 mt-1">{profile.family?.motherName || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-400">Brothers</p>
                  <p className="font-semibold text-gray-800 mt-1">{profile.family?.brothers ?? "-"}</p>
                </div>
                <div>
                  <p className="text-gray-400">Sisters</p>
                  <p className="font-semibold text-gray-800 mt-1">{profile.family?.sisters ?? "-"}</p>
                </div>
                <div>
                  <p className="text-gray-400">Family Type</p>
                  <p className="font-semibold text-gray-800 mt-1">{profile.family?.familyType || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-400">Family Status / House</p>
                  <p className="font-semibold text-gray-800 mt-1">{profile.family?.familyStatus || "-"}</p>
                </div>
              </div>
            </div>

            {/* Partner Preferences */}
            <div>
              <div className="flex items-center gap-2.5 text-xl font-bold text-gray-900 mb-5 border-b border-gray-100 pb-3">
                <HeartHandshake className="h-5 w-5 text-red-800" />
                <span>Partner Preference</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm">
                <div>
                  <p className="text-gray-400">Preferred Age Range</p>
                  <p className="font-semibold text-gray-800 mt-1">
                    {profile.partnerPreference?.minAge && profile.partnerPreference?.maxAge
                      ? `${profile.partnerPreference.minAge} - ${profile.partnerPreference.maxAge} Years`
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Preferred Religion</p>
                  <p className="font-semibold text-gray-800 mt-1">
                    {profile.partnerPreference?.preferredReligion || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Preferred Caste</p>
                  <p className="font-semibold text-gray-800 mt-1">
                    {profile.partnerPreference?.preferredCaste || "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}