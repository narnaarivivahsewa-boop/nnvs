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
            <div>

        <label className="mb-2 block font-medium text-gray-700">
          Profile Photos
        </label>

        <input
          type="file"
          accept="image/*"
          multiple
          onChange={uploadImages}
          disabled={uploading || photos.length >= 3}
          className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100"
        />

        <p className="mt-2 text-sm text-gray-500">
          Upload minimum 1 and maximum 3 photos.
        </p>

        {uploading && (
          <p className="mt-3 text-blue-600 font-medium">
            Uploading photos...
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