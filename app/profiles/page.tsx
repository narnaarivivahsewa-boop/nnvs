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
  const initialQuery = searchParams.get("q") || "";

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(24);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userGender, setUserGender] = useState<string | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState(initialQuery);
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
    setCurrentPage(1);
  };

  // Check auth state and load profiles
  useEffect(() => {
    let isCancelled = false;

    async function fetchProfilesData() {
      try {
        setLoading(true);

        // Try authenticated endpoint first
        let authSuccess = false;
        try {
          const authRes = await fetch("/api/profiles");
          if (authRes.ok) {
            const authData = await authRes.json();
            if (authData.authenticated && authData.success && Array.isArray(authData.profiles)) {
              authSuccess = true;
              if (!isCancelled) {
                setIsAuthenticated(true);
                if (authData.userGender) {
                  setUserGender(authData.userGender);
                }
              }
            }
          }
        } catch {
          authSuccess = false;
        }

        if (!authSuccess && !isCancelled) {
          setIsAuthenticated(false);
        }

        // Fetch from paginated public profiles endpoint
        const params = new URLSearchParams();
        params.set("page", String(currentPage));
        params.set("limit", String(pageSize));
        if (selectedGender) params.set("gender", selectedGender);
        if (selectedReligion && selectedReligion !== "All") params.set("religion", selectedReligion);
        if (selectedCommunity && !selectedCommunity.startsWith("All ") && selectedCommunity !== "Other / Open to All") {
          params.set("caste", selectedCommunity);
        }
        if (searchQuery.trim()) params.set("q", searchQuery.trim());

        const publicRes = await fetch(`/api/public/profiles?${params.toString()}`);
        if (publicRes.ok) {
          const publicData = await publicRes.json();
          if (publicData.success && Array.isArray(publicData.profiles)) {
            if (!isCancelled) {
              setProfiles(publicData.profiles);
              setTotalCount(publicData.total || publicData.profiles.length);
              setTotalPages(publicData.totalPages || 1);
            }
          }
        }
      } catch (error) {
        console.error("Failed to load profiles:", error);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    fetchProfilesData();

    return () => {
      isCancelled = true;
    };
  }, [currentPage, pageSize, selectedGender, selectedReligion, selectedCommunity, searchQuery]);

  // Client-side supplementary filters (Age & Profession)
  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      // Age Group Filter
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

      // Profession Filter
      if (selectedProfession) {
        const prof = (p.occupation?.profession || "").toLowerCase();
        if (!prof.includes(selectedProfession.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }, [profiles, selectedAgeGroup, selectedProfession]);

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedGender("");
    setSelectedAgeGroup("");
    setSelectedReligion("");
    setSelectedCommunity("");
    setSelectedProfession("");
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6EF] py-10 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        {/* Guest Banner if not logged in */}
        {!isAuthenticated && (
          <div className="mb-8 rounded-2xl bg-gradient-to-r from-[#FAF0DC] via-white to-[#FAF0DC] border border-[#E2D4BE] p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="h-10 w-10 rounded-full bg-[#4A121A] text-white flex items-center justify-center shrink-0 shadow">
                <Lock className="h-5 w-5 text-[#DFBA73]" />
              </div>
              <div>
                <h4 className="font-bold text-[#2D221E] text-sm sm:text-base">
                  Viewing Public Matrimonial Directory ({totalCount} Profiles)
                </h4>
                <p className="text-xs text-[#5A4E48] mt-0.5">
                  Login with your registered mobile OTP to view contact numbers and WhatsApp chat links.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
              <Link
                href="/login?redirect=/profiles"
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-[#4A121A] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#380D13] transition"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Login with OTP</span>
              </Link>

              <Link
                href="/register"
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-[#C5A059] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#B88E4C] transition"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Register Profile</span>
              </Link>
            </div>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#FAF0DC] px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#4A121A] mb-2 border border-[#E2D4BE]">
              <Sparkles className="h-3.5 w-3.5 text-[#C5A059]" />
              <span>
                {userGender === "MALE"
                  ? "Recommended Brides"
                  : userGender === "FEMALE"
                  ? "Recommended Grooms"
                  : "Verified Community Directory"}
              </span>
            </div>
            <h1 className="font-serif-luxury text-3xl sm:text-4xl font-extrabold text-[#2D221E] tracking-tight">
              Browse Matrimonial Profiles
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-[#5A4E48]">
              {userGender === "MALE"
                ? "Showing verified brides matching your profile."
                : userGender === "FEMALE"
                ? "Showing verified grooms matching your profile."
                : "Explore genuine matrimonial alliances across communities."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs sm:text-sm font-semibold text-[#5A4E48] bg-[#FAF5EB] px-4 py-2 rounded-xl border border-[#DACBB4] shadow-xs">
              Showing <strong className="text-[#4A121A] font-bold">
                {totalCount > 0 ? (currentPage - 1) * pageSize + 1 : 0}
              </strong> - <strong className="text-[#4A121A] font-bold">
                {Math.min(currentPage * pageSize, totalCount)}
              </strong> of <strong className="text-[#4A121A] font-bold">{totalCount}</strong> Profiles
            </span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="rounded-3xl bg-[#FAF5EB] p-5 sm:p-6 shadow-sm border border-[#DACBB4] mb-8 space-y-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A7972]" />
              <input
                type="text"
                placeholder="Search by Name, Profile ID, or Caste (e.g. Jat, Gujjar, Yadav, Brahmin...)"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-2xl border border-[#DACBB4] bg-white py-3 pl-11 pr-4 text-xs sm:text-sm font-medium text-[#2D221E] outline-none transition focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059]"
              />
            </div>

            {/* Gender Toggle Filter */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedGender(selectedGender === "FEMALE" ? "" : "FEMALE");
                  setCurrentPage(1);
                }}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 border ${
                  selectedGender === "FEMALE"
                    ? "bg-[#4A121A] text-white border-[#4A121A] shadow-xs"
                    : "bg-white text-[#5A4E48] border-[#DACBB4] hover:bg-[#FAF0DC]"
                }`}
              >
                <span>👩</span>
                <span>Brides</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedGender(selectedGender === "MALE" ? "" : "MALE");
                  setCurrentPage(1);
                }}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 border ${
                  selectedGender === "MALE"
                    ? "bg-[#4A121A] text-white border-[#4A121A] shadow-xs"
                    : "bg-white text-[#5A4E48] border-[#DACBB4] hover:bg-[#FAF0DC]"
                }`}
              >
                <span>👨</span>
                <span>Grooms</span>
              </button>
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
              onChange={(e) => {
                setSelectedCommunity(e.target.value);
                setCurrentPage(1);
              }}
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
            <p className="text-xs text-[#5A4E48] mt-1">Fetching verified profiles from database.</p>
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
          <>
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#DACBB4] pt-6">
                <div className="text-xs sm:text-sm text-[#5A4E48]">
                  Page <strong className="text-[#4A121A] font-bold">{currentPage}</strong> of{" "}
                  <strong className="text-[#4A121A] font-bold">{totalPages}</strong> ({totalCount} Total Profiles)
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="rounded-xl border border-[#DACBB4] bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-[#5A4E48] shadow-xs hover:bg-[#FAF0DC] transition disabled:opacity-40 disabled:pointer-events-none"
                  >
                    ← Previous
                  </button>

                  {/* Numeric Page Buttons */}
                  <div className="hidden sm:flex items-center gap-1.5">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((page) => {
                        return (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 2 && page <= currentPage + 2)
                        );
                      })
                      .map((page, idx, arr) => {
                        const showEllipsis = idx > 0 && page - arr[idx - 1] > 1;
                        return (
                          <div key={page} className="flex items-center gap-1.5">
                            {showEllipsis && <span className="text-xs text-[#8A7972] px-1">...</span>}
                            <button
                              type="button"
                              onClick={() => handlePageChange(page)}
                              className={`h-9 w-9 rounded-xl text-xs font-bold transition ${
                                currentPage === page
                                  ? "bg-[#4A121A] text-white shadow-xs"
                                  : "border border-[#DACBB4] bg-white text-[#5A4E48] hover:bg-[#FAF0DC]"
                              }`}
                            >
                              {page}
                            </button>
                          </div>
                        );
                      })}
                  </div>

                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="rounded-xl border border-[#DACBB4] bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-[#5A4E48] shadow-xs hover:bg-[#FAF0DC] transition disabled:opacity-40 disabled:pointer-events-none"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
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