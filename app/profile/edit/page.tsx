"use client";

import { useEffect, useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Users, User, ArrowLeft, CheckCircle2, Key } from "lucide-react";

import { RegisterFormData } from "@/types/register";

import PhotosForm from "./components/PhotosForm";
import PersonalForm from "./components/PersonalForm";
import FamilyForm from "./components/FamilyForm";
import EducationForm from "./components/EducationForm";
import OccupationForm from "./components/OccupationForm";
import PartnerPreferenceForm from "./components/PartnerPreferenceForm";
import SaveButton from "./components/SaveButton";

interface ProfileSummary {
  id: string;
  profileId: string;
  firstName?: string | null;
  lastName?: string | null;
}

function EditProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryProfileId = searchParams.get("profileId");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [activeProfile, setActiveProfile] = useState<ProfileSummary | null>(null);
  const [allProfiles, setAllProfiles] = useState<ProfileSummary[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RegisterFormData>();

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        // 1. Load account profiles for switcher
        const meRes = await fetch("/api/auth/me", { cache: "no-store", credentials: "include" });
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.success && meData.user?.profiles) {
            setAllProfiles(
              meData.user.profiles.map((p: any) => ({
                id: p.id,
                profileId: p.profileId,
                firstName: p.firstName,
                lastName: p.lastName,
              }))
            );
          }
        }

        // 2. Load target profile
        const targetUrl = queryProfileId
          ? `/api/profile?profileId=${encodeURIComponent(queryProfileId)}`
          : "/api/profile";

        const res = await fetch(targetUrl, { cache: "no-store", credentials: "include" });
        const data = await res.json();

        if (!res.ok || !data.success) {
          return;
        }

        const profile = data.profile;
        setActiveProfile({
          id: profile.id,
          profileId: profile.profileId,
          firstName: profile.firstName,
          lastName: profile.lastName,
        });

        if (Array.isArray(profile.photos)) {
          setPhotos(profile.photos.map((p: any) => p.imageUrl));
        }

        const rawGender = profile.user?.gender ? String(profile.user.gender).toUpperCase() : "";
        const formattedGender = rawGender === "MALE" ? "Male" : rawGender === "FEMALE" ? "Female" : profile.user?.gender || "";

        // Extract Gotra if previously stored in notes
        const gotraMatch = profile.notes?.match(/Gotra:\s*([^;\n]+)/i);
        const savedGotra = gotraMatch ? gotraMatch[1].trim() : "";

        reset({
          fullName: profile.user?.fullName || "",
          mobile: profile.user?.mobile || "",
          email: profile.user?.email || "",
          password: "",
          confirmPassword: "",
          profileType: formattedGender === "Female" ? "Female" : "Male",
          lookingFor: formattedGender === "Female" ? "Groom" : "Bride",
          gender: formattedGender,
          dateOfBirth: profile.dateOfBirth
            ? profile.dateOfBirth.substring(0, 10)
            : "",
          birthTime: profile.birthTime || "",
          birthPlace: profile.birthPlace || "",
          gotra: savedGotra,
          manglik: profile.manglik || "",
          diet: profile.diet || "",
          height: profile.height ? String(profile.height) : "",
          maritalStatus: profile.maritalStatus || "",
          religion: profile.religion || "",
          caste: profile.caste || "",
          motherTongue: profile.motherTongue || "",
          city: profile.birthPlace || "",
          state: "",
          country: "India",
          postalCode: "",
          fatherName: profile.family?.fatherName || "",
          fatherOccupation: profile.family?.fatherOccupation || "",
          motherName: profile.family?.motherName || "",
          motherOccupation: profile.family?.motherOccupation || "",
          brothers: profile.family?.brothers !== null && profile.family?.brothers !== undefined ? String(profile.family.brothers) : "",
          sisters: profile.family?.sisters !== null && profile.family?.sisters !== undefined ? String(profile.family.sisters) : "",
          familyType: profile.family?.familyType || "",
          familyStatus: profile.family?.familyStatus || "",
          highestQualification: profile.education?.highestQualification || "",
          college: profile.education?.college || "",
          occupationField: profile.education?.occupationField || "",
          profession: profile.occupation?.profession || "",
          company: profile.occupation?.company || "",
          annualIncome: profile.occupation?.annualIncome || "",
          minAge: profile.partnerPreference?.minAge
            ? String(profile.partnerPreference.minAge)
            : "",
          maxAge: profile.partnerPreference?.maxAge
            ? String(profile.partnerPreference.maxAge)
            : "",
          minHeight: profile.partnerPreference?.minHeight
            ? String(profile.partnerPreference.minHeight)
            : "",
          maxHeight: profile.partnerPreference?.maxHeight
            ? String(profile.partnerPreference.maxHeight)
            : "",
          preferredReligion: profile.partnerPreference?.preferredReligion || "",
          preferredCaste: profile.partnerPreference?.preferredCaste || "",
          dietPreference: profile.partnerPreference?.dietPreference || "",
          about: profile.notes || "",
        });
      } catch (error) {
        console.error("Failed to load profile:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [reset, queryProfileId]);

  async function handleSwitchProfileToEdit(newProfileId: string) {
    try {
      await fetch("/api/auth/select-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ profileId: newProfileId }),
      });
      window.dispatchEvent(
        new CustomEvent("nnvs:profile-switched", { detail: { profileId: newProfileId } })
      );
      router.push(`/profile/edit?profileId=${encodeURIComponent(newProfileId)}`);
    } catch (e) {
      console.error("Failed to switch profile to edit:", e);
    }
  }

  const onFormError = (formErrors: any) => {
    console.warn("Form validation errors:", formErrors);
    const errorKeys = Object.keys(formErrors);
    if (errorKeys.length > 0) {
      const firstKey = errorKeys[0];
      const err = formErrors[firstKey];
      alert(`Please review form inputs: ${err?.message || `Please verify "${firstKey}"`}`);
    }
  };

  async function onSubmit(data: RegisterFormData) {
    if (!photos || photos.length < 1) {
      alert("At least 1 photo is mandatory to create/update profile");
      return;
    }
    if (photos.length > 3) {
      alert("Maximum 3 photos allowed.");
      return;
    }

    try {
      setSaving(true);

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          ...data,
          profileId: activeProfile?.profileId || activeProfile?.id,
          photos,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        alert(result.message || "Failed to update profile.");
        return;
      }

      alert("Profile updated successfully ✅");
      router.push(activeProfile?.profileId ? `/profile/${activeProfile.profileId}` : "/dashboard");
    } catch (error) {
      console.error(error);
      alert("Unable to update profile.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-800 border-t-transparent mb-3" />
        <h2 className="text-lg font-bold text-gray-700 ml-3">Loading Biodata...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <div className="mx-auto max-w-6xl rounded-3xl bg-white p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 pb-6 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-red-800 transition"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Dashboard</span>
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-red-800">
              Edit Biodata & Preferences
            </h1>
            {activeProfile && (
              <p className="mt-1 text-xs sm:text-sm text-gray-600">
                Currently editing profile for:{" "}
                <span className="font-bold text-gray-900">
                  {activeProfile.firstName || activeProfile.profileId}
                </span>{" "}
                (<span className="font-mono text-red-900">{activeProfile.profileId}</span>)
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* If user owns multiple profiles, allow switching which one to edit */}
            {allProfiles.length > 1 && (
              <div className="flex items-center gap-2 rounded-2xl bg-[#FAF5EB] border-2 border-[#4A121A] px-3.5 py-2 shadow-sm">
                <Users className="h-4 w-4 text-[#C5A059]" />
                <span className="text-xs font-bold text-gray-700 whitespace-nowrap">Edit Profile:</span>
                <select
                  value={activeProfile?.id || activeProfile?.profileId || ""}
                  onChange={(e) => handleSwitchProfileToEdit(e.target.value)}
                  className="bg-transparent text-xs font-bold text-[#4A121A] focus:outline-none cursor-pointer"
                >
                  {allProfiles.map((p, idx) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName ? `${p.firstName} (${p.profileId})` : `Profile #${idx + 1} (${p.profileId})`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <Link
              href="/profile/change-password"
              className="inline-flex items-center gap-2 rounded-2xl border border-[#DACBB4] bg-[#FAF5EB] px-4 py-2.5 text-xs font-bold text-[#4A121A] hover:bg-[#F2E8D7] transition shadow-xs"
              title="Change your account password"
            >
              <Key className="h-4 w-4 text-[#C5A059]" />
              <span>Change Password</span>
            </Link>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit, onFormError)} className="space-y-10">
          <PhotosForm
            photos={photos}
            setPhotos={setPhotos}
            uploading={uploading}
            setUploading={setUploading}
          />
          <PersonalForm register={register} errors={errors} />
          <FamilyForm register={register} errors={errors} />
          <EducationForm register={register} errors={errors} />
          <OccupationForm register={register} errors={errors} />
          <PartnerPreferenceForm register={register} errors={errors} />
          <SaveButton loading={saving} />
        </form>
      </div>
    </div>
  );
}

export default function EditProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[70vh] items-center justify-center bg-gray-50">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-800 border-t-transparent mb-3" />
          <h2 className="text-lg font-bold text-gray-700 ml-3">Loading Biodata...</h2>
        </div>
      }
    >
      <EditProfileContent />
    </Suspense>
  );
}