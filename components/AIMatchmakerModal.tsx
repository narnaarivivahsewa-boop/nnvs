"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Sparkles,
  X,
  ChevronRight,
  ChevronLeft,
  Bot,
  CheckCircle2,
  User,
  RotateCcw,
} from "lucide-react";
import { RELIGIONS, getCommunitiesForReligion } from "@/lib/constants/communities";

type MatchResult = {
  id: string;
  profileId: string;
  fullName: string;
  gender: string;
  age: string;
  caste: string;
  qualification: string;
  profession: string;
  location: string;
  photoUrl: string | null;
  matchScore: number;
  matchReasons: string[];
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function AIMatchmakerModal({ isOpen, onClose }: Props) {
  const [step, setStep] = useState(1);
  const totalSteps = 5;

  // Bot Answers State
  const [lookingFor, setLookingFor] = useState("Bride");
  const [minAge, setMinAge] = useState(23);
  const [maxAge, setMaxAge] = useState(30);
  const [diet, setDiet] = useState("Strict Vegetarian");
  const [dressing, setDressing] = useState("Traditional & Elegant");
  const [lifestyle, setLifestyle] = useState("Traditional");
  const [educationLevel, setEducationLevel] = useState("Open to All");
  const [religionPreference, setReligionPreference] = useState("Open to All");
  const [communityPreference, setCommunityPreference] = useState("Open to All");

  // Dynamic community options for AI matchmaker
  const dynamicAIMatchCommunities = useMemo(() => {
    return getCommunitiesForReligion(
      religionPreference === "Open to All" ? undefined : religionPreference
    ).filter((c) => !c.startsWith("All "));
  }, [religionPreference]);

  // Results & Loading State
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<MatchResult[] | null>(null);

  if (!isOpen) return null;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      executeScrutiny();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const executeScrutiny = async () => {
    setLoading(true);
    setResults(null);
    try {
      const res = await fetch("/api/ai/matchmaker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lookingFor,
          minAge,
          maxAge,
          diet,
          lifestyle,
          dressing,
          educationLevel,
          religionPreference,
          communityPreference,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setResults(data.recommendations);
      }
    } catch (err) {
      console.error("AI Matchmaker scrutiny failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const resetBot = () => {
    setStep(1);
    setResults(null);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/65 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl sm:rounded-3xl bg-[#FAF5EB] border border-[#DACBB4] shadow-2xl transition-all">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-[#4A121A] via-[#5C1924] to-[#7A1F2D] px-4 sm:px-6 py-3.5 sm:py-4 text-white">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl sm:rounded-2xl bg-[#FAF0DC] text-[#4A121A] shadow-inner flex-shrink-0">
              <Bot className="h-5 w-5 sm:h-6 sm:w-6 text-[#4A121A]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-serif-luxury text-sm sm:text-lg font-bold text-white tracking-wide">
                  RishteClub AI Matchmaker Bot
                </h3>
                <span className="rounded-full bg-[#DFBA73] px-1.5 py-0.2 sm:px-2 sm:py-0.5 text-[9px] sm:text-[10px] font-extrabold text-[#4A121A]">
                  AI 2.0
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-[#E2D2BC]">
                Smart Scrutiny & Compatibility Assistant
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-white/80 hover:bg-white/10 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-8 max-h-[85vh] sm:max-h-[80vh] overflow-y-auto">
          {/* 1. Questionnaire Flow */}
          {!results && !loading && (
            <div>
              {/* Step indicator */}
              <div className="mb-6 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#C5A059]">
                  Step {step} of {totalSteps}
                </span>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`h-1.5 w-6 rounded-full transition-all ${
                        i <= step ? "bg-[#C5A059]" : "bg-[#E8DCC8]"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Bot Message Bubble */}
              <div className="mb-6 flex items-start gap-3 rounded-2xl bg-white p-4 border border-[#E2D4BE] shadow-xs">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-[#FAF0DC] text-[#4A121A]">
                  <Sparkles className="h-4 w-4 text-[#C5A059]" />
                </div>
                <div className="text-xs sm:text-sm text-[#2D221E] font-medium leading-relaxed">
                  {step === 1 &&
                    "Namaste! 🙏 मैं आपका AI Matchmaker Bot हूँ। चलिए आपकी पसंद और प्राथमिकताओं को समझते हैं ताकि हम सबसे उपयुक्त प्रोफाइल्स को स्क्रूटिनाइज कर सकें। आप किसके लिए रिश्ता देख रहे हैं?"}
                  {step === 2 &&
                    "खान-पान (Food Habits & Diet): आपकी और आपके परिवार की भोजन शैली कैसी है?"}
                  {step === 3 &&
                    "पहनावा और लाइफस्टाइल (Dressing & Personal Style): आप कैसा पहनावा और जीवनशैली पसंद करते हैं?"}
                  {step === 4 &&
                    "पारिवारिक मूल्य (Family Values): आपके परिवार के संस्कार और सोच किस प्रकार के हैं?"}
                  {step === 5 &&
                    "शिक्षा, करियर और समाज (Career & Community Preferences): पार्टनर के प्रोफेशन और कम्युनिटी को लेकर आपकी क्या उम्मीदें हैं?"}
                </div>
              </div>

              {/* Step 1: Who are you looking for? */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#2D221E] mb-2">
                      Looking For (वर / वधू):
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {["Bride", "Groom"].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setLookingFor(opt)}
                          className={`rounded-xl border p-3.5 text-xs sm:text-sm font-semibold transition ${
                            lookingFor === opt
                              ? "border-[#4A121A] bg-[#FAF0DC] text-[#4A121A] shadow-xs"
                              : "border-[#DACBB4] bg-white text-[#5A4E48] hover:bg-[#FAF5EB]"
                          }`}
                        >
                          {opt === "Bride" ? "👰 Bride (वधू)" : "🤵 Groom (वर)"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="block text-xs font-bold text-[#2D221E] mb-2">
                      Preferred Age Range: {minAge} Yrs to {maxAge} Yrs
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[11px] text-[#5A4E48]">Min Age:</span>
                        <input
                          type="number"
                          min={18}
                          max={60}
                          value={minAge}
                          onChange={(e) => setMinAge(Number(e.target.value))}
                          className="w-full mt-1 rounded-xl border border-[#DACBB4] bg-white p-2.5 text-xs font-semibold text-[#2D221E]"
                        />
                      </div>
                      <div>
                        <span className="text-[11px] text-[#5A4E48]">Max Age:</span>
                        <input
                          type="number"
                          min={18}
                          max={70}
                          value={maxAge}
                          onChange={(e) => setMaxAge(Number(e.target.value))}
                          className="w-full mt-1 rounded-xl border border-[#DACBB4] bg-white p-2.5 text-xs font-semibold text-[#2D221E]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Food Habits & Diet */}
              {step === 2 && (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-[#2D221E]">
                    Select Diet & Food Habit Preference:
                  </label>
                  {[
                    { title: "Strict Pure Vegetarian", desc: "शुद्ध शाकाहारी (No Onion/Garlic option if required)" },
                    { title: "Jain Vegetarian", desc: "जैन भोजन (Strict Root-free pure vegetarian)" },
                    { title: "Eggetarian", desc: "शाकाहारी + अंडा (Egg only)" },
                    { title: "Non-Vegetarian", desc: "मांसाहारी भी मान्य (Non-Veg acceptable)" },
                  ].map((item) => (
                    <button
                      key={item.title}
                      type="button"
                      onClick={() => setDiet(item.title)}
                      className={`w-full text-left rounded-2xl border p-4 transition ${
                        diet === item.title
                          ? "border-[#4A121A] bg-[#FAF0DC] text-[#4A121A] shadow-xs"
                          : "border-[#DACBB4] bg-white text-[#5A4E48] hover:bg-[#FAF5EB]"
                      }`}
                    >
                      <p className="text-xs sm:text-sm font-bold text-[#2D221E]">{item.title}</p>
                      <p className="text-[11px] text-[#5A4E48] mt-0.5">{item.desc}</p>
                    </button>
                  ))}
                </div>
              )}

              {/* Step 3: Dressing & Personal Style */}
              {step === 3 && (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-[#2D221E]">
                    Select Dressing & Lifestyle Preference:
                  </label>
                  {[
                    { title: "Traditional & Elegant", desc: "पारंपरिक और शालीन पहनावा (Kurti, Saree, Simple Indian wear)" },
                    { title: "Modern & Contemporary", desc: "मॉडर्न और स्टाइलिश (Western + Indo-Western)" },
                    { title: "Simple & Decent Casuals", desc: "साधारण, व्यावहारिक और सहज पहनावा" },
                    { title: "Open to Personal Choice", desc: "व्यक्तिगत पसंद पर कोई पाबंदी नहीं" },
                  ].map((item) => (
                    <button
                      key={item.title}
                      type="button"
                      onClick={() => setDressing(item.title)}
                      className={`w-full text-left rounded-2xl border p-4 transition ${
                        dressing === item.title
                          ? "border-[#4A121A] bg-[#FAF0DC] text-[#4A121A] shadow-xs"
                          : "border-[#DACBB4] bg-white text-[#5A4E48] hover:bg-[#FAF5EB]"
                      }`}
                    >
                      <p className="text-xs sm:text-sm font-bold text-[#2D221E]">{item.title}</p>
                      <p className="text-[11px] text-[#5A4E48] mt-0.5">{item.desc}</p>
                    </button>
                  ))}
                </div>
              )}

              {/* Step 4: Family Values */}
              {step === 4 && (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-[#2D221E]">
                    Select Core Family Values:
                  </label>
                  {[
                    { title: "Traditional", desc: "रीति-रिवाजों और संयुक्त परिवार को महत्व देने वाले संस्कारी विचार" },
                    { title: "Moderate", desc: "परंपरा और आधुनिकता का संतुलित समन्वय (Balanced family)" },
                    { title: "Liberal & Progressive", desc: "प्रगतिशील, खुले विचार और आत्मनिर्भरता को प्राथमिकता" },
                  ].map((item) => (
                    <button
                      key={item.title}
                      type="button"
                      onClick={() => setLifestyle(item.title)}
                      className={`w-full text-left rounded-2xl border p-4 transition ${
                        lifestyle === item.title
                          ? "border-[#4A121A] bg-[#FAF0DC] text-[#4A121A] shadow-xs"
                          : "border-[#DACBB4] bg-white text-[#5A4E48] hover:bg-[#FAF5EB]"
                      }`}
                    >
                      <p className="text-xs sm:text-sm font-bold text-[#2D221E]">{item.title}</p>
                      <p className="text-[11px] text-[#5A4E48] mt-0.5">{item.desc}</p>
                    </button>
                  ))}
                </div>
              )}

              {/* Step 5: Education & Community */}
              {step === 5 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#2D221E] mb-1.5">
                      Career / Education Preference:
                    </label>
                    <select
                      value={educationLevel}
                      onChange={(e) => setEducationLevel(e.target.value)}
                      className="w-full rounded-xl border border-[#DACBB4] bg-white p-3 text-xs sm:text-sm font-medium text-[#2D221E] outline-none focus:border-[#C5A059]"
                    >
                      <option value="Open to All">Open to All Professions</option>
                      <option value="Engineer / IT / Tech">Engineers / IT & Software</option>
                      <option value="Doctor / Medical">Doctors / Medical & Healthcare</option>
                      <option value="CA / CS / Finance">CA / CS / Banking & Finance</option>
                      <option value="MBA / Management">MBA / Corporate Management</option>
                      <option value="Government / PSU">Government Official / PSU</option>
                      <option value="Business / Entrepreneur">Business / Entrepreneur</option>
                    </select>
                  </div>

                  {/* Religion Preference */}
                  <div>
                    <label className="block text-xs font-bold text-[#2D221E] mb-1.5">
                      Religion Preference (धर्म):
                    </label>
                    <select
                      value={religionPreference}
                      onChange={(e) => {
                        setReligionPreference(e.target.value);
                        setCommunityPreference("Open to All");
                      }}
                      className="w-full rounded-xl border border-[#DACBB4] bg-white p-3 text-xs sm:text-sm font-medium text-[#2D221E] outline-none focus:border-[#C5A059]"
                    >
                      <option value="Open to All">Open to All Religions</option>
                      {RELIGIONS.map((rel) => (
                        <option key={rel} value={rel}>
                          {rel}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Community / Caste Preference mapped dynamically to religion */}
                  <div>
                    <label className="block text-xs font-bold text-[#2D221E] mb-1.5">
                      Community / Caste Preference {religionPreference !== "Open to All" ? `(${religionPreference})` : ""}:
                    </label>
                    <select
                      value={communityPreference}
                      onChange={(e) => setCommunityPreference(e.target.value)}
                      className="w-full rounded-xl border border-[#DACBB4] bg-white p-3 text-xs sm:text-sm font-medium text-[#2D221E] outline-none focus:border-[#C5A059]"
                    >
                      <option value="Open to All">Open to All Communities / Castes</option>
                      {dynamicAIMatchCommunities.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Navigation Controls */}
              <div className="mt-8 flex items-center justify-between pt-4 border-t border-[#E8DCC8]">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex items-center gap-1 text-xs sm:text-sm font-semibold text-[#5A4E48] hover:text-[#2D221E] transition"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Back</span>
                  </button>
                ) : (
                  <div />
                )}

                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-2 rounded-xl bg-[#4A121A] px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-[#3A0C13] transition active:scale-[0.99]"
                >
                  <span>{step === totalSteps ? "Scrutinize & Find Matches ✨" : "Continue"}</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* 2. Loading State Animation */}
          {loading && (
            <div className="py-16 text-center space-y-4">
              <div className="relative mx-auto h-16 w-16">
                <div className="absolute inset-0 animate-ping rounded-full bg-[#DFBA73] opacity-30" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[#4A121A] text-[#DFBA73] shadow-lg">
                  <Bot className="h-8 w-8 animate-pulse" />
                </div>
              </div>

              <div>
                <h4 className="font-serif-luxury text-lg font-bold text-[#2D221E]">
                  AI Scrutiny in Progress...
                </h4>
                <p className="text-xs text-[#5A4E48] max-w-sm mx-auto mt-1">
                  Comparing your preferences across verified database profiles for lifestyle, diet, career, and family compatibility.
                </p>
              </div>
            </div>
          )}

          {/* 3. Scrutinized Results Display */}
          {results && !loading && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>AI Scrutiny Complete ({results.length} Matches Found)</span>
                  </div>
                  <h4 className="font-serif-luxury text-lg font-bold text-[#2D221E] mt-1">
                    Recommended High-Compatibility Profiles
                  </h4>
                </div>

                <button
                  type="button"
                  onClick={resetBot}
                  className="flex items-center gap-1 text-xs font-semibold text-[#4A121A] hover:underline"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Restart AI</span>
                </button>
              </div>

              {results.length === 0 ? (
                <div className="rounded-2xl bg-white p-8 text-center border border-[#DACBB4]">
                  <p className="text-sm font-semibold text-[#2D221E]">
                    No exact profile matches found with these exact filters yet.
                  </p>
                  <p className="text-xs text-[#5A4E48] mt-1">
                    Try broadening your age or community preference to see more members.
                  </p>
                  <button
                    type="button"
                    onClick={resetBot}
                    className="mt-4 rounded-xl bg-[#C5A059] px-6 py-2 text-xs font-bold text-white shadow"
                  >
                    Adjust Preferences
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {results.map((profile) => (
                    <div
                      key={profile.id}
                      className="rounded-2xl bg-white p-4 sm:p-5 border border-[#DACBB4] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition hover:shadow-md hover:border-[#C5A059]"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-xl bg-[#FAF0DC] border border-[#DACBB4] overflow-hidden flex items-center justify-center flex-shrink-0">
                          {profile.photoUrl ? (
                            <img
                              src={profile.photoUrl}
                              alt={profile.fullName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <User className="h-8 w-8 text-[#C5A059]" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="font-serif-luxury text-base font-bold text-[#2D221E]">
                              {profile.fullName}
                            </h5>
                            <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5">
                              {profile.matchScore}% Match
                            </span>
                          </div>
                          <p className="text-xs text-[#5A4E48] mt-0.5">
                            {profile.age} • {profile.caste} • {profile.location}
                          </p>
                          <p className="text-xs font-medium text-[#4A121A]">
                            {profile.profession} ({profile.qualification})
                          </p>
                          {/* Match Reasons Tags */}
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {profile.matchReasons.slice(0, 2).map((reason, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] bg-[#FAF5EB] text-[#7A5835] px-2 py-0.5 rounded-md border border-[#E2D4BE]"
                              >
                                ✨ {reason}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <Link
                        href={`/profile/${profile.profileId}`}
                        onClick={onClose}
                        className="w-full sm:w-auto text-center rounded-xl bg-[#4A121A] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#3A0C13] transition flex-shrink-0"
                      >
                        View Profile
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
