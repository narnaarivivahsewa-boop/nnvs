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
  Phone,
  Lock,
  LogIn,
  MessageCircle,
  Sparkles,
  Moon,
  Sun,
  HelpCircle,
  Send,
} from "lucide-react";
import MatrimonyAvatar from "@/components/MatrimonyAvatar";

type Profile = {
  id: string;
  profileId: string;
  legacyProfileId?: string | null;
  firstName: string;
  lastName?: string | null;
  religion?: string;
  caste?: string;
  motherTongue?: string;
  maritalStatus?: string;
  height?: string;
  dateOfBirth?: string;
  birthPlace?: string | null;
  birthTime?: string | null;
  diet?: string | null;
  manglik?: string | null;
  contactPerson?: string | null;

  isContactUnlocked?: boolean;

  user: {
    fullName: string;
    gender: string;
    mobile?: string | null;
    email?: string | null;
  };

  photos: {
    imageUrl: string;
    isPrimary: boolean;
  }[];

  family?: {
    fatherName?: string;
    fatherOccupation?: string;
    motherName?: string;
    motherOccupation?: string;
    brothers?: number;
    sisters?: number;
    familyType?: string;
    familyStatus?: string;
    propertyDetails?: string;
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

  phoneNumbers?: {
    phone: string;
    isPrimary: boolean;
  }[];
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

  // Astrological Q&A state
  const [astroQuestion, setAstroQuestion] = useState("");
  const [astroAnswer, setAstroAnswer] = useState<string | null>(null);
  const [askingAstro, setAskingAstro] = useState(false);

  const handleAskAstro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!astroQuestion.trim() || !profile) return;

    setAskingAstro(true);
    try {
      const res = await fetch("/api/ai/astrology", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "qa",
          candidateProfileId: profile.id,
          question: astroQuestion.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAstroAnswer(data.answer);
      } else {
        setAstroAnswer(data.message || "Failed to analyze astrological compatibility.");
      }
    } catch {
      setAstroAnswer("Unable to reach AI Astrologer. Please try again.");
    } finally {
      setAskingAstro(false);
    }
  };

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
        const primary =
          data.profile.photos?.find((p: { isPrimary: boolean; imageUrl: string }) => p.isPrimary)?.imageUrl ||
          data.profile.photos?.[0]?.imageUrl ||
          "";
        setActivePhoto(primary);

        const shortlistRes = await fetch(`/api/shortlist?shortlistedProfileId=${data.profile.id}`);
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
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#4A121A] border-t-transparent mb-4" />
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
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#4A121A] px-8 py-3 text-sm font-bold text-white shadow hover:bg-[#380D13] transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Profiles</span>
        </Link>
      </div>
    );
  }

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
            <Share2 className="h-4 w-4 text-[#4A121A]" />
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
                <MatrimonyAvatar
                  imageUrl={activePhoto}
                  fullName={profile.user.fullName}
                  gender={profile.user.gender}
                  size="hero"
                  badge={true}
                  className="h-full w-full rounded-2xl"
                />

                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                  <div className="rounded-full bg-black/70 backdrop-blur-md px-3 py-1 text-xs font-semibold text-[#DFBA73] shadow">
                    <span>RishteClub ID: </span>
                    <span className="font-mono font-bold text-white">{profile.profileId}</span>
                  </div>
                  {profile.legacyProfileId && (
                    <div className="rounded-full bg-[#4A121A]/85 backdrop-blur-md px-3 py-0.5 text-[11px] font-semibold text-[#DFBA73] border border-[#C5A059]/40 shadow">
                      <span>Old NNVS ID: </span>
                      <span className="font-mono font-bold text-white">{profile.legacyProfileId}</span>
                    </div>
                  )}
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
                        activePhoto === p.imageUrl ? "border-[#4A121A] scale-105" : "border-gray-200 opacity-70"
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
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="rounded-lg bg-[#FAF0DC] px-3 py-1 text-xs font-bold text-[#4A121A] border border-[#E2D4BE]">
                    RishteClub Profile ID: <strong className="font-mono">{profile.profileId}</strong>
                  </span>
                  {profile.legacyProfileId && (
                    <span className="rounded-lg bg-[#FDE8EC] px-3 py-1 text-xs font-bold text-[#7A1F2D] border border-[#F5C2CB]">
                      Old NNVS Profile ID: <strong className="font-mono">{profile.legacyProfileId}</strong>
                    </span>
                  )}
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
                    <Briefcase className="h-4 w-4 text-[#4A121A]" />
                    <span>{profile.occupation.profession}</span>
                    {profile.occupation.company && <span className="text-gray-400">at {profile.occupation.company}</span>}
                  </div>
                )}

                {profile.education?.highestQualification && (
                  <div className="mt-2 flex items-center gap-2 text-gray-700 font-medium">
                    <GraduationCap className="h-4 w-4 text-[#4A121A]" />
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
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#4A121A] to-[#6A1A26] px-8 py-3.5 font-bold text-white shadow-lg transition duration-200 hover:from-[#380D13] hover:to-[#50131C] hover:shadow-xl disabled:opacity-60"
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
            {/* Contact Information & Privacy Section */}
            <div className="rounded-2xl border border-[#E2D4BE] bg-[#FAF5EB] p-6 shadow-xs">
              <div className="flex items-center gap-2.5 text-lg font-bold text-[#4A121A] mb-3">
                <Phone className="h-5 w-5 text-[#C5A059]" />
                <span>Contact Details & Verification</span>
              </div>

              {profile.isContactUnlocked ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    {profile.user.mobile && (
                      <div>
                        <p className="text-xs text-[#8A7972] uppercase font-bold">Registered Mobile</p>
                        <p className="font-semibold text-gray-900 mt-0.5">{profile.user.mobile}</p>
                      </div>
                    )}
                    {profile.contactPerson && (
                      <div>
                        <p className="text-xs text-[#8A7972] uppercase font-bold">Contact Person</p>
                        <p className="font-semibold text-gray-900 mt-0.5">{profile.contactPerson}</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[#E8DCC8] flex flex-wrap items-center justify-between gap-4">
                    <div className="text-xs font-semibold text-emerald-800 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span>WhatsApp Only – Do Not Call</span>
                    </div>

                    {profile.user.mobile && (
                      <a
                        href={`https://wa.me/91${profile.user.mobile.replace(/\D/g, "").slice(-10)}?text=${encodeURIComponent(
                          `Namaste! I saw the matrimonial profile of ${profile.user.fullName} (${profile.profileId}) on RishteClub.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span>Chat on WhatsApp</span>
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-white border border-[#DACBB4]">
                  <div className="flex items-center gap-3 text-center sm:text-left">
                    <Lock className="h-8 w-8 text-[#C5A059] shrink-0" />
                    <div>
                      <p className="font-bold text-gray-900 text-sm">Contact Information Protected</p>
                      <p className="text-xs text-gray-500">Please login with your registered mobile number using OTP to view contact details.</p>
                    </div>
                  </div>

                  <Link
                    href={`/login?redirect=/profile/${profile.profileId}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#4A121A] px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#380D13] transition shrink-0"
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    <span>Login with Mobile OTP</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Personal Details */}
            <div>
              <div className="flex items-center gap-2.5 text-xl font-bold text-gray-900 mb-5 border-b border-gray-100 pb-3">
                <User className="h-5 w-5 text-[#4A121A]" />
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
                    {profile.dateOfBirth
                      ? new Date(profile.dateOfBirth).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "-"}
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
                  <p className="text-gray-400">Community / Caste</p>
                  <p className="font-semibold text-gray-800 mt-1">{profile.caste || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-400">Diet</p>
                  <p className="font-semibold text-gray-800 mt-1">{profile.diet || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-400">Manglik</p>
                  <p className="font-semibold text-gray-800 mt-1">{profile.manglik || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-400">Mother Tongue</p>
                  <p className="font-semibold text-gray-800 mt-1">{profile.motherTongue || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-400">Birth Place</p>
                  <p className="font-semibold text-gray-800 mt-1">{profile.birthPlace || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-400">Birth Time</p>
                  <p className="font-semibold text-gray-800 mt-1">{profile.birthTime || "-"}</p>
                </div>
              </div>
            </div>

            {/* AI Vedic Astrology & Direct Kundli Q&A Box */}
            <div className="rounded-3xl border border-[#C5A059]/40 bg-gradient-to-br from-[#FAF5EB] via-white to-[#FAF0DC]/50 p-6 lg:p-8 shadow-md space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8DCC8] pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-[#4A121A] text-[#DFBA73] flex items-center justify-center shadow-sm">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-serif-luxury text-xl font-bold text-[#4A121A] flex items-center gap-2">
                      <span>Vedic Astrology & Kundli Compatibility</span>
                      <span className="text-xs bg-[#DFBA73]/30 text-[#4A121A] font-sans font-bold px-2.5 py-0.5 rounded-full border border-[#C5A059]">
                        AI Powered
                      </span>
                    </h3>
                    <p className="text-xs text-[#5A4E48]">
                      Verify horoscope compatibility and ask astrological questions directly on the website without phoning
                    </p>
                  </div>
                </div>

                <Link
                  href={`/astrology`}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#4A121A] px-5 py-2.5 text-xs font-bold text-[#DFBA73] hover:bg-[#380D13] transition shadow-xs shrink-0"
                >
                  <Moon className="h-3.5 w-3.5" />
                  <span>Full 36 Guna Milan Hub →</span>
                </Link>
              </div>

              {/* Astro Quick Summary Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="rounded-2xl bg-white border border-[#DACBB4] p-3">
                  <span className="text-[11px] text-gray-500 font-bold uppercase block">Manglik Status</span>
                  <span className="font-serif-luxury font-bold text-sm text-[#4A121A]">
                    {profile.manglik || "Non-Manglik"}
                  </span>
                </div>
                <div className="rounded-2xl bg-white border border-[#DACBB4] p-3">
                  <span className="text-[11px] text-gray-500 font-bold uppercase block">Birth Place</span>
                  <span className="font-semibold text-xs text-gray-800 truncate block">
                    {profile.birthPlace || "Recorded in Biodata"}
                  </span>
                </div>
                <div className="rounded-2xl bg-white border border-[#DACBB4] p-3">
                  <span className="text-[11px] text-gray-500 font-bold uppercase block">Birth Time</span>
                  <span className="font-semibold text-xs text-gray-800 block">
                    {profile.birthTime || "Standard Chart"}
                  </span>
                </div>
                <div className="rounded-2xl bg-white border border-[#DACBB4] p-3">
                  <span className="text-[11px] text-gray-500 font-bold uppercase block">Horoscope Status</span>
                  <span className="font-semibold text-xs text-emerald-700 block">
                    ✓ Verified Chart
                  </span>
                </div>
              </div>

              {/* Direct Astrology Q&A Form */}
              <div className="rounded-2xl bg-white border border-[#E2D4BE] p-4 sm:p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#4A121A]">
                  <HelpCircle className="h-4 w-4 text-[#C5A059]" />
                  <span>Ask an Astrological Question About {profile.user.fullName}:</span>
                </div>

                {/* Predefined Quick Questions */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Kya hamara Manglik match favorable hai?",
                    "Guna Milan aur planetary balance kaisa hai?",
                    "Is profile ka exact birth details verify karein",
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setAstroQuestion(chip)}
                      className="rounded-full bg-[#FAF5EB] border border-[#DACBB4] px-3 py-1 text-[11px] font-semibold text-[#4A121A] hover:bg-[#FAF0DC] transition"
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleAskAstro} className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={astroQuestion}
                    onChange={(e) => setAstroQuestion(e.target.value)}
                    placeholder={`e.g. Manglik compatibility ya Guna Milan kaisa rahega?`}
                    className="flex-1 rounded-xl border border-[#D9C8B0] bg-[#FAF8F5] px-3.5 py-2 text-xs text-gray-900 focus:border-[#4A121A] focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={askingAstro || !astroQuestion.trim()}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#4A121A] px-5 py-2 text-xs font-bold text-white hover:bg-[#380D13] transition disabled:opacity-50"
                  >
                    <Send className="h-3 w-3 text-[#DFBA73]" />
                    <span>{askingAstro ? "Calculating..." : "Ask AI"}</span>
                  </button>
                </form>

                {astroAnswer && (
                  <div className="rounded-xl bg-[#FAF0DC]/80 border border-[#DACBB4] p-3.5 text-xs text-[#380D13] leading-relaxed animate-fadeIn">
                    <span className="font-bold text-[#4A121A] block mb-1">
                      ✨ AI Astrologer Response:
                    </span>
                    {astroAnswer}
                  </div>
                )}
              </div>
            </div>

            {/* Education & Career */}
            <div>
              <div className="flex items-center gap-2.5 text-xl font-bold text-gray-900 mb-5 border-b border-gray-100 pb-3">
                <GraduationCap className="h-5 w-5 text-[#4A121A]" />
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
                <Users2 className="h-5 w-5 text-[#4A121A]" />
                <span>Family Background</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm">
                <div>
                  <p className="text-gray-400">Father&apos;s Name</p>
                  <p className="font-semibold text-gray-800 mt-1">{profile.family?.fatherName || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-400">Father&apos;s Occupation</p>
                  <p className="font-semibold text-gray-800 mt-1">{profile.family?.fatherOccupation || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-400">Mother&apos;s Name</p>
                  <p className="font-semibold text-gray-800 mt-1">{profile.family?.motherName || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-400">Mother&apos;s Occupation</p>
                  <p className="font-semibold text-gray-800 mt-1">{profile.family?.motherOccupation || "-"}</p>
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
                <HeartHandshake className="h-5 w-5 text-[#4A121A]" />
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