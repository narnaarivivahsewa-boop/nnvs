"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";

import { RegisterFormData } from "@/types/register";

import PhotosForm from "./components/PhotosForm";
import PersonalForm from "./components/PersonalForm";
import FamilyForm from "./components/FamilyForm";
import EducationForm from "./components/EducationForm";
import OccupationForm from "./components/OccupationForm";
import PartnerPreferenceForm from "./components/PartnerPreferenceForm";
import SaveButton from "./components/SaveButton";

export default function EditProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RegisterFormData>();

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/profile");
        const data = await res.json();

        if (!res.ok || !data.success) {
          return;
        }

        const profile = data.profile;

        if (Array.isArray(profile.photos)) {
          setPhotos(profile.photos.map((p: any) => p.imageUrl));
        }

        reset({
          fullName: profile.user?.fullName || "",
          gender: profile.user?.gender || "",
          dateOfBirth: profile.dateOfBirth
            ? profile.dateOfBirth.substring(0, 10)
            : "",
          height: profile.height ? String(profile.height) : "",
          maritalStatus: profile.maritalStatus || "",
          religion: profile.religion || "",
          caste: profile.caste || "",
          motherTongue: profile.motherTongue || "",
          fatherName: profile.family?.fatherName || "",
          motherName: profile.family?.motherName || "",
          brothers: profile.family?.brothers ? String(profile.family.brothers) : "",
          sisters: profile.family?.sisters ? String(profile.family.sisters) : "",
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
        });
      } catch (error) {
        console.error("Failed to load profile:", error);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [reset]);

  async function onSubmit(data: RegisterFormData) {
    try {
      setSaving(true);

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          photos,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        alert(result.message || "Failed to update profile.");
        return;
      }

      alert("Profile updated successfully ✅");
      router.push("/profile");
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
        <h1 className="mb-8 text-3xl font-bold text-red-800">
          Edit Biodata & Preferences
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
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