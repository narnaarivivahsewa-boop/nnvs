"use client";

import { FieldErrors, UseFormRegister } from "react-hook-form";

import InputField from "@/app/register/components/form/InputField";
import SelectField from "@/app/register/components/form/SelectField";

import {
  GENDERS,
  MARITAL_STATUS,
  HEIGHTS,
  MANGLIK_OPTIONS,
  DIET_OPTIONS,
} from "@/app/register/constants";

import { RegisterFormData } from "@/types/register";

type Props = {
  register: UseFormRegister<RegisterFormData>;
  errors: FieldErrors<RegisterFormData>;
};

export default function PersonalForm({
  register,
  errors,
}: Props) {
  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
        <h2 className="text-2xl font-bold text-gray-800">
          Personal & Astro Information
        </h2>
        <span className="text-xs text-gray-500">
          * Marked fields are primary biodata identifiers
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-2">

        <div>
          <InputField
            label="Full Name"
            placeholder="Enter Full Name"
            registration={register("fullName")}
            error={errors.fullName}
          />
          <p className="mt-1 text-[11px] text-gray-500">
            Note: Legal name changes are verified by RishteClub admin for trust & safety.
          </p>
        </div>

        <SelectField
          label="Gender"
          options={GENDERS}
          registration={register("gender")}
          error={errors.gender}
        />

        <InputField
          label="Date of Birth"
          type="date"
          registration={register("dateOfBirth")}
          error={errors.dateOfBirth}
        />

        <InputField
          label="Birth Time (Kundali / Horoscope)"
          type="text"
          placeholder="e.g. 10:30 AM or 02:45 PM"
          registration={register("birthTime")}
          error={errors.birthTime}
        />

        <InputField
          label="Birth Place (City / State)"
          placeholder="e.g. Delhi, New Delhi or Jaipur, Rajasthan"
          registration={register("birthPlace")}
          error={errors.birthPlace}
        />

        <SelectField
          label="Height"
          options={HEIGHTS}
          registration={register("height")}
          error={errors.height}
        />

        <InputField
          label="Weight (kg)"
          type="number"
          placeholder="Enter Weight in kg"
          registration={register("weight")}
          error={errors.weight}
        />

        <SelectField
          label="Marital Status"
          options={MARITAL_STATUS}
          registration={register("maritalStatus")}
          error={errors.maritalStatus}
        />

        <InputField
          label="Religion"
          placeholder="e.g. Hindu, Jain, Sikh"
          registration={register("religion")}
          error={errors.religion}
        />

        <InputField
          label="Caste / Community"
          placeholder="e.g. Agarwal, Brahmin, Gupta, Khatri"
          registration={register("caste")}
          error={errors.caste}
        />

        <InputField
          label="Gotra / Clan"
          placeholder="e.g. Garg, Bansal, Mittal, Bharadwaj, Kashyap"
          registration={register("gotra")}
          error={errors.gotra}
        />

        <SelectField
          label="Manglik Status"
          options={MANGLIK_OPTIONS}
          registration={register("manglik")}
          error={errors.manglik}
        />

        <SelectField
          label="Diet"
          options={DIET_OPTIONS}
          registration={register("diet")}
          error={errors.diet}
        />

        <InputField
          label="Mother Tongue"
          placeholder="e.g. Hindi, English, Punjabi"
          registration={register("motherTongue")}
          error={errors.motherTongue}
        />

        <InputField
          label="City of Residence"
          placeholder="e.g. Delhi NCR, Mumbai, Bengaluru"
          registration={register("city")}
          error={errors.city}
        />

        <InputField
          label="State / Province"
          placeholder="e.g. Delhi, Haryana, Uttar Pradesh"
          registration={register("state")}
          error={errors.state}
        />

        <InputField
          label="Country"
          placeholder="e.g. India"
          registration={register("country")}
          error={errors.country}
        />

        <InputField
          label="Postal / Zip Code"
          placeholder="e.g. 110001"
          registration={register("postalCode")}
          error={errors.postalCode}
        />

      </div>

    </div>
  );
}