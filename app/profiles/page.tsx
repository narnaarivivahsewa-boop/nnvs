"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, Sparkles, ArrowRight, UserCheck, Heart, RotateCcw, Lock, LogIn, UserPlus } from "lucide-react";
import { RELIGIONS, getCommunitiesForReligion } from "@/lib/constants/communities";

type Profile = {
  id: string;
  profileId: string;
  legacyProfileId?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  religion?: string | null;
  caste?: string | null;
  height?: string | number | null;
  dateOfBirth?: string | null;
  user: {
    fullName: string;
    gender: string;
  };
  occupation?: {
    profession?: string | null;
    company?: string | null;
    annualIncome?: string | null;
  } | null;
  education?: {
    highestQualification?: string | null;
  } | null;
  photos: {
    imageUrl: string;
  }[];
};

function calculateAge(dob?: string | null): number | null {
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

function ProfilesContent() {
  const searchParams = useSearchParams();
  const initialGender = searchParams.get("gender") || "";
  const initialAge = searchParams.get("age") || "";
  const initialCaste = searchParams.get("caste") || "";
  const initialReligion = searchParams.get("religion") || "";

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userGender, setUserGender] = useState<string | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGender, setSelectedGender] = useState(initialGender);
  const [selectedAgeGroup, setSelectedAgeGroup] = useState(initialAge);
  const [selectedReligion, setSelectedReligion] = useState(initialReligion);
  const [selectedCommunity, setSelectedCommunity] = useState(initialCaste);
  const [selectedProfession, setSelectedProfession] = useState("");

  // Dynamically compute available communities based on chosen religion
  const availableCommunities = useMemo(() => {
    return getCommunitiesForReligion(selectedReligion);
  }, [selectedReligion]);

  const handleReligionChange = (newRel: string) => {
    setSelectedReligion(newRel);
    setSelectedCommunity("");
  };

  useEffect(() => {
    async function loadProfiles() {
      try {
        setLoading(true);
        const res = await fetch("/api/profiles");
        const data = await res.json();

        if (res.status === 401 || data.authenticated === false) {
          setIsAuthenticated(false);
          setProfiles([]);
          return;
        }

        setIsAuthenticated(true);
        if (data.userGender) {
          setUserGender(data.userGender);
        }
        if (data.success && Array.isArray(data.profiles)) {
          setProfiles(data.profiles);
        }
      } catch (error) {
        console.error("Failed to load profiles:", error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    }

    loadProfiles();
  }, []);

  // Filtered Profiles Logic
  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      // 1. Gender Filter (if manually selected)
      if (selectedGender) {
        if (p.user.gender?.toUpperCase() !== selectedGender.toUpperCase()) {
          return false;
        }
      }

      // 2. Search query (Name or Profile ID or Caste)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const fullName = (p.user?.fullName || "").toLowerCase();
        const pId = (p.profileId || "").toLowerCase();
        const legacyId = (p.legacyProfileId || "").toLowerCase();
        const caste = (p.caste || "").toLowerCase();
        if (!fullName.includes(q) && !pId.includes(q) && !legacyId.includes(q) && !caste.includes(q)) {
          return false;
        }
      }

      // 3. Age Group Filter
      if (selectedAgeGroup) {
        const age = calculateAge(p.dateOfBirth);
        if (age === null) return true;

        if (selectedAgeGroup === "18-24" && (age < 18 || age > 24)) return false;
        if (selectedAgeGroup === "25-30" && (age < 25 || age > 30)) return false;
        if (selectedAgeGroup === "31-35" && (age < 31 || age > 35)) return false;
        if (selectedAgeGroup === "36-40" && (age < 36 || age > 40)) return false;
        if (selectedAgeGroup === "41-50" && (age < 41 || age > 50)) return false;
        if (selectedAgeGroup === "51+" && age < 51) return false;
      }

      // 4. Religion Filter
      if (selectedReligion && selectedReligion !== "All" && p.religion) {
        if (p.religion.toLowerCase() !== selectedReligion.toLowerCase()) {
          return false;
        }
      }

      // 5. Community / Caste Filter
      if (
        selectedCommunity &&
        !selectedCommunity.startsWith("All ") &&
        selectedCommunity !== "Other / Open to All" &&
        p.caste
      ) {
        const cleanSelected = selectedCommunity.toLowerCase().replace(" (all)", "");
        if (!p.caste.toLowerCase().includes(cleanSelected)) {
          return false;
        }
      }

      // 6. Profession Filter
      if (selectedProfession) {
        const prof = (p.occupation?.profession || "").toLowerCase();
        if (!prof.includes(selectedProfession.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }, [profiles, selectedGender, searchQuery, selectedAgeGroup, selectedReligion, selectedCommunity, selectedProfession]);

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedGender("");
    setSelectedAgeGroup("");
    setSelectedReligion("");
    setSelectedCommunity("");
    setSelectedProfession("");
  };

  // Unauthenticated Screen
  if (!loading && isAuthenticated === false) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-[#FAF6EF] px-4 py-16">
        <div className="mx-auto max-w-xl text-center rounded-3xl bg-white p-8 sm:p-12 shadow-xl border border-[#DACBB4]">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#FAF0DC] text-[#4A121A] mb-6 shadow-inner border border-[#E2D4BE]">
            <Lock className="h-10 w-10 text-[#C5A059]" />
          </div>

          <div className="inline-flex items-center gap-2 rounded-full bg-[#FAF0DC] px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#4A121A] mb-4 border border-[#E2D4BE]">
            <Sparkles className="h-3.5 w-3.5 text-[#C5A059]" />
            <span>Member Access Only</span>
          </div>

          <h1 className="font-serif-luxury text-2xl sm:text-3xl font-extrabold text-[#2D221E] tracking-tight">
            Login Required to View Profiles
          </h1>

          <p className="mt-3 text-sm sm:text-base text-[#5A4E48] leading-relaxed">
            Please login with your registered mobile number using OTP to view matrimonial profiles.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login?redirect=/profiles"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#4A121A] px-8 py-3.5 text-sm font-bold text-white shadow-md hover:bg-[#380D13] transition"
            >
              <LogIn className="h-4 w-4" />
              <span>Login with Mobile OTP</span>
            </Link>

            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#C5A059] px-8 py-3.5 text-sm font-bold text-white shadow-md hover:bg-[#B88E4C] transition"
            >
              <UserPlus className="h-4 w-4" />
              <span>Register Free Profile</span>
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-[#EFE4D2] text-xs text-[#8A7972]">
            <span>Privacy Notice: Matrimonial biodatas are accessible exclusively to verified members.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6EF] py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#FAF0DC] px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#4A121A] mb-2 border border-[#E2D4BE]">
              <Sparkles className="h-3.5 w-3.5 text-[#C5A059]" />
              <span>
                {userGender === "MALE"
                  ? "Recommended Brides"
                  : userGender === "FEMALE"
                  ? "Recommended Grooms"
                  : "Community Directory"}
              </span>
            </div>
            <h1 className="font-serif-luxury text-3xl sm:text-4xl font-extrabold text-[#2D221E] tracking-tight">
              Browse Matrimonial Profiles
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-[#5A4E48]">
              {userGender === "MALE"
                ? "Showing verified brides matching your profile."
                : userGender === "FEMALE"
                ? "Showing verified grooms matching your profile."
                : "Showing verified profiles looking for suitable life partners."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-semibold text-[#5A4E48] bg-[#FAF5EB] px-4 py-2 rounded-xl border border-[#DACBB4] shadow-xs">
              <strong className="text-[#4A121A] font-bold">{filteredProfiles.length}</strong> Profiles Found
            </span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="rounded-3xl bg-[#FAF5EB] p-6 shadow-sm border border-[#DACBB4] mb-10 space-y-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A7972]" />
              <input
                type="text"
                placeholder="Search by Name, Profile ID, or Caste (e.g. Jat, Gujjar, Yadav, Brahmin...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-[#DACBB4] bg-white py-3 pl-11 pr-4 text-xs sm:text-sm font-medium text-[#2D221E] outline-none transition focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059]"
              />
            </div>
          </div>

          {/* Secondary Dropdown Filters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#E8DCC8]">
            {/* Age Filter */}
            <select
              value={selectedAgeGroup}
              onChange={(e) => setSelectedAgeGroup(e.target.value)}
              className="rounded-xl border border-[#DACBB4] bg-white p-2.5 text-xs sm:text-sm font-medium text-[#2D221E] outline-none focus:border-[#C5A059]"
            >
              <option value="">Any Age</option>
              <option value="18-24">18 - 24 Years</option>
              <option value="25-30">25 - 30 Years</option>
              <option value="31-35">31 - 35 Years</option>
              <option value="36-40">36 - 40 Years</option>
              <option value="41-50">41 - 50 Years</option>
              <option value="51+">51+ Years</option>
            </select>

            {/* Religion Filter */}
            <select
              value={selectedReligion}
              onChange={(e) => handleReligionChange(e.target.value)}
              className="rounded-xl border border-[#DACBB4] bg-white p-2.5 text-xs sm:text-sm font-medium text-[#2D221E] outline-none focus:border-[#C5A059]"
            >
              <option value="">All Religions</option>
              {RELIGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            {/* Community / Caste Filter */}
            <select
              value={selectedCommunity}
              onChange={(e) => setSelectedCommunity(e.target.value)}
              className="rounded-xl border border-[#DACBB4] bg-white p-2.5 text-xs sm:text-sm font-medium text-[#2D221E] outline-none focus:border-[#C5A059]"
            >
              <option value="">
                {selectedReligion ? `All ${selectedReligion} Communities` : "All Communities / Castes"}
              </option>
              {availableCommunities
                .filter((c) => !c.startsWith("All "))
                .map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
            </select>

            {/* Reset Filters Button */}
            <button
              type="button"
              onClick={resetFilters}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-[#DACBB4] bg-white px-3 py-2.5 text-xs sm:text-sm font-semibold text-[#5A4E48] hover:bg-[#FAF0DC] transition"
            >
              <RotateCcw className="h-3.5 w-3.5 text-[#C5A059]" />
              <span>Reset Filters</span>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-20 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#C5A059] border-t-transparent mx-auto mb-4" />
            <h3 className="text-lg font-bold text-[#2D221E]">Loading Profiles...</h3>
            <p className="text-xs text-[#5A4E48] mt-1">Fetching verified members.</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredProfiles.length === 0 && (
          <div className="rounded-3xl border border-[#DACBB4] bg-[#FAF5EB] p-12 text-center shadow-xs max-w-lg mx-auto my-12">
            <div className="text-5xl mb-3">🔍</div>
            <h2 className="font-serif-luxury text-xl sm:text-2xl font-bold text-[#2D221E]">
              No Profiles Match Selected Criteria
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[#5A4E48]">
              Try adjusting or resetting your search filters or browse across all communities.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-6 rounded-full bg-[#C5A059] px-8 py-2.5 text-xs sm:text-sm font-bold text-white shadow hover:bg-[#B88E4C] transition"
            >
              Clear All Filters
            </button>
          </div>
        )}

        {/* Profile Grid Cards */}
        {!loading && filteredProfiles.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProfiles.map((profile) => {
              const isFemale = profile.user.gender?.toUpperCase() === "FEMALE";
              const age = calculateAge(profile.dateOfBirth);

              return (
                <div
                  key={profile.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-[#FAF5EB] border border-[#DACBB4] shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:shadow-md hover:border-[#C5A059]"
                >
                  {/* Card Header & Photo */}
                  <div className="relative h-60 w-full bg-gradient-to-br from-[#4A121A] via-[#5C1924] to-[#7A1F2D] overflow-hidden flex items-center justify-center">
                    {profile.photos.length > 0 ? (
                      <img
                        src={profile.photos[0].imageUrl}
                        alt={profile.user.fullName}
                        className="h-40 w-40 rounded-full object-cover border-4 border-[#DFBA73] shadow-lg transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-40 w-40 flex-col items-center justify-center rounded-full border-4 border-[#DFBA73] bg-[#FAF5EB] shadow-lg">
                        <span className="text-5xl">{isFemale ? "👩" : "👨"}</span>
                        <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[#4A121A]">
                          {isFemale ? "Bride Profile" : "Groom Profile"}
                        </span>
                      </div>
                    )}

                    {/* Verification Badge */}
                    <div className="absolute top-4 right-4 flex items-center gap-1 rounded-full bg-white/95 backdrop-blur-md px-3 py-1 text-[11px] font-bold text-[#4A121A] shadow">
                      <UserCheck className="h-3.5 w-3.5 text-[#C5A059]" />
                      <span>Verified</span>
                    </div>

                    {/* ID Tag */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1 items-start">
                      <div className="rounded-full bg-black/60 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-semibold text-[#DFBA73]">
                        {profile.profileId}
                      </div>
                      {profile.legacyProfileId && (
                        <div className="rounded-full bg-[#4A121A]/85 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-bold text-white border border-[#DFBA73]/30">
                          Old: {profile.legacyProfileId}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Profile Details Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-serif-luxury text-xl font-bold text-[#2D221E] group-hover:text-[#4A121A] transition-colors">
                            {profile.user.fullName}
                          </h3>
                          <p className="text-xs font-medium text-[#5A4E48] mt-0.5">
                            {age ? `${age} Yrs` : "Age N/A"} • {profile.height ? String(profile.height) : "Height N/A"}
                          </p>
                        </div>
                        <div className="rounded-full bg-[#FAF0DC] p-2 text-[#C5A059]">
                          <Heart className="h-4 w-4" />
                        </div>
                      </div>

                      <div className="mt-4 space-y-1.5 text-xs text-[#5A4E48]">
                        <div className="flex items-center justify-between border-b border-[#E8DCC8] pb-1.5">
                          <span className="text-[#8A7972]">Gender</span>
                          <span className="font-semibold text-[#2D221E]">{profile.user.gender}</span>
                        </div>

                        {profile.caste && (
                          <div className="flex items-center justify-between border-b border-[#E8DCC8] pb-1.5">
                            <span className="text-[#8A7972]">Community / Caste</span>
                            <span className="font-semibold text-[#4A121A]">{profile.caste}</span>
                          </div>
                        )}

                        {profile.education?.highestQualification && (
                          <div className="flex items-center justify-between border-b border-[#E8DCC8] pb-1.5">
                            <span className="text-[#8A7972]">Education</span>
                            <span className="font-semibold text-[#2D221E] truncate max-w-[180px]">
                              {profile.education.highestQualification}
                            </span>
                          </div>
                        )}

                        {profile.occupation?.profession && (
                          <div className="flex items-center justify-between border-b border-[#E8DCC8] pb-1.5">
                            <span className="text-[#8A7972]">Profession</span>
                            <span className="font-semibold text-[#2D221E] truncate max-w-[180px]">
                              {profile.occupation.profession}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <Link
                      href={`/profile/${profile.profileId}`}
                      className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-[#C5A059] py-2.5 px-4 text-xs sm:text-sm font-bold text-white shadow-xs transition duration-200 hover:bg-[#B88E4C] hover:shadow-md"
                    >
                      <span>View Full Profile</span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProfilesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FAF6EF]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#C5A059] border-t-transparent" />
        </div>
      }
    >
      <ProfilesContent />
    </Suspense>
  );
}