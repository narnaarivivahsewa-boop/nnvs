"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, User, Sparkles } from "lucide-react";
import MandalaPattern from "./MandalaPattern";

type PublicProfile = {
  id: string;
  profileId: string;
  user: {
    fullName: string;
    gender: string;
  };
  dateOfBirth?: string | null;
  caste?: string | null;
  education?: {
    highestQualification?: string | null;
  } | null;
  occupation?: {
    profession?: string | null;
  } | null;
  contactDetails?: {
    city?: string | null;
    state?: string | null;
  } | null;
  photos: {
    imageUrl: string;
    isPrimary?: boolean;
  }[];
};

function calculateAge(dobString?: string | null): string {
  if (!dobString) return "";
  const dob = new Date(dobString);
  if (isNaN(dob.getTime())) return "";
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age > 0 ? `${age} Yrs` : "";
}

export default function FeaturedProfiles() {
  const [profiles, setProfiles] = useState<PublicProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfiles() {
      try {
        const res = await fetch("/api/public/profiles");
        const data = await res.json();

        if (data.success && Array.isArray(data.profiles)) {
          setProfiles(data.profiles);
        }
      } catch (err) {
        console.error("Error loading profiles:", err);
      } finally {
        setLoading(false);
      }
    }

    loadProfiles();
  }, []);

  return (
    <section className="relative py-16 sm:py-20 bg-[#FAF6EF] overflow-hidden">
      {/* Decorative Traditional Mandala Watermarks */}
      <div className="absolute -top-12 -left-20 pointer-events-none opacity-20 z-0">
        <MandalaPattern className="w-80 h-80 text-[#C5A059]" />
      </div>
      <div className="absolute -bottom-16 -right-20 pointer-events-none opacity-20 z-0">
        <MandalaPattern className="w-80 h-80 text-[#C5A059]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-12">
          <div className="inline-block font-serif-luxury tracking-[0.2em] uppercase text-xs font-bold text-[#C5A059] mb-2">
            COMMUNITY DIRECTORY
          </div>
          <h2 className="font-serif-luxury text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[#2D221E]">
            EXPLORE VERIFIED PROFILES
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-[#5A4E48] max-w-lg mx-auto">
            Genuine alliances verified with community trust and transparency.
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl bg-[#FAF5EB] border border-[#DACBB4] p-5 h-44"
              />
            ))}
          </div>
        )}

        {/* Real Profiles Grid */}
        {!loading && profiles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {profiles.map((profile) => {
              const photo = profile.photos?.[0]?.imageUrl;
              const age = calculateAge(profile.dateOfBirth);
              const edu =
                profile.education?.highestQualification ||
                profile.occupation?.profession ||
                profile.user.gender;
              const loc =
                profile.contactDetails?.city ||
                profile.contactDetails?.state ||
                profile.caste ||
                "Verified Member";

              return (
                <div
                  key={profile.id}
                  className="relative rounded-2xl bg-[#FAF5EB] border border-[#DACBB4] p-4 sm:p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-[#C5A059] flex flex-col justify-between pt-6"
                >
                  {/* Top Verified Badge */}
                  <div className="absolute -top-3.5 right-6 flex items-center gap-1.5 rounded-md bg-[#C5A059] px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm tracking-wide">
                    <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white/25">
                      <Check className="h-2.5 w-2.5 stroke-[3] text-white" />
                    </span>
                    <span>VERIFIED</span>
                  </div>

                  {/* Card Split: Photo / Avatar on Left + Details on Right */}
                  <div className="flex items-center gap-4 sm:gap-5 mt-1">
                    {/* Left Photo or Avatar Icon */}
                    <div className="h-28 w-24 sm:h-32 sm:w-28 flex-shrink-0 overflow-hidden rounded-xl bg-[#FAF0DC] border border-[#DACBB4] flex items-center justify-center">
                      {photo ? (
                        <img
                          src={photo}
                          alt={profile.user.fullName}
                          className="h-full w-full object-cover object-top"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-[#7A5835]">
                          <User className="h-10 w-10 stroke-[1.5] text-[#C5A059]" />
                          <span className="text-[10px] font-semibold mt-1">
                            {profile.user.gender === "FEMALE" ? "Bride" : "Groom"}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Right Details & CTA */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#C5A059]">
                          {profile.profileId}
                        </span>
                        <h3 className="font-serif-luxury text-base sm:text-lg font-bold text-[#2D221E] truncate leading-snug">
                          {profile.user.fullName}
                        </h3>
                        <p className="mt-0.5 text-xs sm:text-sm font-medium text-[#5A4E48] truncate">
                          {age ? `${age}, ` : ""}
                          {edu}
                        </p>
                        <p className="text-xs sm:text-sm font-medium text-[#5A4E48] truncate">
                          {loc}
                        </p>
                      </div>

                      {/* Golden View Profile Button */}
                      <div className="mt-3">
                        <Link
                          href={`/profile/${profile.profileId}`}
                          className="inline-block rounded-md bg-[#C5A059] px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#B88E4C] hover:shadow text-center"
                        >
                          View Profile
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State when no profiles are registered yet */}
        {!loading && profiles.length === 0 && (
          <div className="rounded-3xl border border-[#DACBB4] bg-[#FAF5EB] p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FAF0DC] text-[#4A121A] border border-[#E2D4BE] shadow-xs mb-4">
              <Sparkles className="h-8 w-8 text-[#C5A059]" />
            </div>
            <h3 className="font-serif-luxury text-xl sm:text-2xl font-bold text-[#2D221E]">
              Verified Profiles Showcase
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-[#5A4E48] leading-relaxed">
              New verified bride and groom profiles will appear here as members register. Register today to be among the first verified profiles on NNVS Matrimony!
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/register"
                className="rounded-lg bg-[#C5A059] px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#B88E4C] transition"
              >
                Register Your Profile
              </Link>
              <Link
                href="/profiles"
                className="rounded-lg border border-[#4A121A] px-6 py-2.5 text-sm font-bold text-[#4A121A] hover:bg-[#FAF0DC] transition"
              >
                Browse Directory
              </Link>
            </div>
          </div>
        )}

        {/* View All Link */}
        <div className="mt-10 text-center">
          <Link
            href="/profiles"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#4A121A] hover:text-[#7A1F2D] transition-colors border-b border-[#4A121A] pb-0.5"
          >
            <span>View All Profiles in Directory</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}