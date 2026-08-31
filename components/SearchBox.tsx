"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Sparkles } from "lucide-react";
import { RELIGIONS, getCommunitiesForReligion } from "@/lib/constants/communities";

export default function SearchBox({ onOpenAIMatchmaker }: { onOpenAIMatchmaker?: () => void }) {
  const router = useRouter();
  const [lookingFor, setLookingFor] = useState("");
  const [ageGroup, setAgeGroup] = useState("25-30");
  const [religion, setReligion] = useState("Hindu");
  const [community, setCommunity] = useState("All Hindu Communities");
  const [location, setLocation] = useState("All Locations");

  // Dynamically compute community options based on selected religion
  const availableCommunities = useMemo(() => {
    return getCommunitiesForReligion(religion);
  }, [religion]);

  const handleReligionChange = (newReligion: string) => {
    setReligion(newReligion);
    const newCommunities = getCommunitiesForReligion(newReligion);
    setCommunity(newCommunities[0] || "All Communities");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();

    if (lookingFor) params.append("gender", lookingFor);
    if (ageGroup) params.append("age", ageGroup);
    if (religion && religion !== "All") params.append("religion", religion);
    if (
      community &&
      !community.startsWith("All ") &&
      community !== "Other / Open to All"
    ) {
      params.append("caste", community);
    }
    if (location && location !== "All Locations") params.append("state", location);

    router.push(`/profiles?${params.toString()}`);
  };

  return (
    <section className="relative -mt-10 sm:-mt-14 lg:-mt-16 z-30 px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto">
      <div className="rounded-2xl bg-[#FAF5EB] p-5 sm:p-6 lg:p-7 shadow-xl border border-[#E2D4BE]">
        {/* Header with Title + AI Matchmaker Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 sm:mb-5">
          <h2 className="font-serif-luxury font-bold text-base sm:text-lg tracking-[0.12em] text-[#2D221E] uppercase">
            FIND YOUR PERFECT MATCH
          </h2>

          {onOpenAIMatchmaker && (
            <button
              type="button"
              onClick={onOpenAIMatchmaker}
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#4A121A] to-[#7A1F2D] px-4 py-1.5 text-xs font-bold text-[#DFBA73] shadow-sm hover:shadow-md transition hover:scale-105"
            >
              <Sparkles className="h-3.5 w-3.5 animate-pulse text-[#DFBA73]" />
              <span>AI Matchmaker Bot ✨</span>
            </button>
          )}
        </div>

        {/* 5 Dropdowns + 1 Action Button Grid */}
        <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4 items-end">
          {/* 1. Looking For */}
          <div>
            <label className="block text-[11px] font-semibold text-[#5A4E48] mb-1">
              Looking For
            </label>
            <div className="relative">
              <select
                className="w-full appearance-none rounded-lg border border-[#DACBB4] bg-white px-3 py-2 text-xs sm:text-sm font-medium text-[#2D221E] outline-none transition focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] pr-7"
                value={lookingFor}
                onChange={(e) => setLookingFor(e.target.value)}
              >
                <option value="">Bride / Groom (All)</option>
                <option value="FEMALE">Bride (Female)</option>
                <option value="MALE">Groom (Male)</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8A7972]" />
            </div>
          </div>

          {/* 2. Age */}
          <div>
            <label className="block text-[11px] font-semibold text-[#5A4E48] mb-1">
              Age
            </label>
            <div className="relative">
              <select
                className="w-full appearance-none rounded-lg border border-[#DACBB4] bg-white px-3 py-2 text-xs sm:text-sm font-medium text-[#2D221E] outline-none transition focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] pr-7"
                value={ageGroup}
                onChange={(e) => setAgeGroup(e.target.value)}
              >
                <option value="25-30">25 to 30 Yrs</option>
                <option value="18-24">18 to 24 Yrs</option>
                <option value="31-35">31 to 35 Yrs</option>
                <option value="36-40">36 to 40 Yrs</option>
                <option value="41-50">41 to 50 Yrs</option>
                <option value="51+">50+ Yrs</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8A7972]" />
            </div>
          </div>

          {/* 3. Religion (Controls the community list) */}
          <div>
            <label className="block text-[11px] font-semibold text-[#5A4E48] mb-1">
              Religion
            </label>
            <div className="relative">
              <select
                className="w-full appearance-none rounded-lg border border-[#DACBB4] bg-white px-3 py-2 text-xs sm:text-sm font-medium text-[#2D221E] outline-none transition focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] pr-7"
                value={religion}
                onChange={(e) => handleReligionChange(e.target.value)}
              >
                <option value="All">All Religions</option>
                {RELIGIONS.map((rel) => (
                  <option key={rel} value={rel}>
                    {rel}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8A7972]" />
            </div>
          </div>

          {/* 4. Community / Caste (Dynamically populated based on religion) */}
          <div>
            <label className="block text-[11px] font-semibold text-[#5A4E48] mb-1">
              Community / Caste
            </label>
            <div className="relative">
              <select
                className="w-full appearance-none rounded-lg border border-[#DACBB4] bg-white px-3 py-2 text-xs sm:text-sm font-medium text-[#2D221E] outline-none transition focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] pr-7"
                value={community}
                onChange={(e) => setCommunity(e.target.value)}
              >
                {availableCommunities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8A7972]" />
            </div>
          </div>

          {/* 5. Location */}
          <div>
            <label className="block text-[11px] font-semibold text-[#5A4E48] mb-1">
              Location / State
            </label>
            <div className="relative">
              <select
                className="w-full appearance-none rounded-lg border border-[#DACBB4] bg-white px-3 py-2 text-xs sm:text-sm font-medium text-[#2D221E] outline-none transition focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] pr-7"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              >
                <option value="All Locations">All Locations</option>
                <option value="Delhi">Delhi NCR</option>
                <option value="Haryana">Haryana</option>
                <option value="Punjab">Punjab</option>
                <option value="Rajasthan">Rajasthan</option>
                <option value="Uttar Pradesh">Uttar Pradesh</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Gujarat">Gujarat</option>
                <option value="Madhya Pradesh">Madhya Pradesh</option>
                <option value="Karnataka">Karnataka</option>
                <option value="West Bengal">West Bengal</option>
                <option value="Chandigarh">Chandigarh</option>
                <option value="Himachal Pradesh">Himachal Pradesh</option>
                <option value="Uttarakhand">Uttarakhand</option>
                <option value="Other">Other State / International</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8A7972]" />
            </div>
          </div>

          {/* 6. Search Button */}
          <div>
            <button
              type="submit"
              className="w-full rounded-lg bg-[#C5A059] py-2.5 px-4 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-[#B88E4C] hover:shadow active:scale-[0.99] text-center"
            >
              Search Profiles
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}