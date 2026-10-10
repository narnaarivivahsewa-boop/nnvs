"use client";

import { Dispatch, SetStateAction } from "react";
import { FieldErrors, UseFormRegister } from "react-hook-form";

import InputField from "../form/InputField";
import SelectField from "../form/SelectField";
import TextareaField from "../form/TextareaField";

import {
  FAMILY_TYPES,
  FAMILY_VALUES,
} from "../../constants";

import { RegisterFormData } from "@/types/register";

type Props = {
  register: UseFormRegister<RegisterFormData>;
  errors: FieldErrors<RegisterFormData>;

  photos: string[];
  setPhotos: Dispatch<SetStateAction<string[]>>;

  uploading: boolean;
  setUploading: Dispatch<SetStateAction<boolean>>;
};

export default function Step5Family({
  register,
  errors,

  photos,
  setPhotos,

  uploading,
  setUploading,
}: Props) {

  const uploadImages = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;

    if (!files) return;

    if (photos.length + files.length > 3) {
      alert("Maximum 3 photos allowed.");
      return;
    }

    setUploading(true);

    try {
      const uploaded: string[] = [];

      for (const file of Array.from(files)) {
        const formData = new FormData();

        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          alert(data.message);
          continue;
        }

        uploaded.push(data.url);
      }

      setPhotos((prev) => [...prev, ...uploaded]);
    } catch (error) {
      console.error(error);
      alert("Image upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) =>
      prev.filter((_, i) => i !== index)
    );
  };

  return (
    <div className="space-y-6">

      <h2 className="text-2xl font-semibold text-gray-800">
        Family & Profile
      </h2>

      <div className="grid gap-6 md:grid-cols-2">

        <InputField
          label="Father's Name"
          placeholder="Enter father's name"
          registration={register("fatherName")}
          error={errors.fatherName}
        />

        <InputField
          label="Mother's Name"
          placeholder="Enter mother's name"
          registration={register("motherName")}
          error={errors.motherName}
        />

        <SelectField
          label="Family Type"
          options={FAMILY_TYPES}
          registration={register("familyType")}
          error={errors.familyType}
        />

        <SelectField
          label="Family Values"
          options={FAMILY_VALUES}
          registration={register("familyStatus")}
          error={errors.familyStatus}
        />

        <InputField
          label="Number of Brothers"
          type="number"
          min={0}
          registration={register("brothers")}
          error={errors.brothers}
        />

        <InputField
          label="Number of Sisters"
          type="number"
          min={0}
          registration={register("sisters")}
          error={errors.sisters}
        />

      </div>

      <TextareaField
        label="About Yourself"
        placeholder="Tell us something about yourself..."
        rows={5}
      />
      <div className="rounded-2xl border-2 border-red-100 bg-rose-50/30 p-5 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <label className="block text-base font-bold text-gray-900">
            Profile Photos <span className="text-red-700">*</span>
          </label>
          <span className="rounded-full bg-red-100 px-3 py-0.5 text-xs font-bold text-red-900">
            {photos.length} / 3 Selected
          </span>
        </div>

        <input
          type="file"
          accept="image/*"
          multiple
          onChange={uploadImages}
          disabled={uploading || photos.length >= 3}
          className="w-full rounded-xl border border-red-200 bg-white px-4 py-3 outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100 file:mr-4 file:rounded-lg file:border-0 file:bg-red-800 file:px-4 file:py-2 file:text-xs file:font-bold file:text-white hover:file:bg-red-700 cursor-pointer"
        />

        <p className="mt-2 text-xs font-medium text-gray-600">
          Upload 1 to 3 clear portrait or biodata photos. High-quality photos get 4x more responses.
        </p>

        {uploading && (
          <p className="mt-3 text-sm text-red-700 font-bold animate-pulse">
            ⏳ Uploading photos to secure cloud storage...
          </p>
        )}

        {photos.length > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">

            {photos.map((photo, index) => (

              <div
                key={photo}
                className="relative overflow-hidden rounded-xl border"
              >

                <img
  src={photo}
  alt={`Profile Photo ${index + 1}`}
  loading="lazy"
  className="h-40 w-full rounded-lg object-cover"
/>

                {index === 0 && (
                  <span className="absolute left-2 top-2 rounded bg-green-600 px-2 py-1 text-xs text-white">
                    Main Photo
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute right-2 top-2 rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
                >
                  Remove
                </button>

              </div>

            ))}

          </div>
        )}

      </div>

    </div>
  );
}