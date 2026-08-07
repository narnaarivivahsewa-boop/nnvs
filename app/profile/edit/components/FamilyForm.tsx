"use client";

import { FieldErrors, UseFormRegister } from "react-hook-form";

import InputField from "@/app/register/components/form/InputField";
import SelectField from "@/app/register/components/form/SelectField";

import {
  FAMILY_TYPES,
  FAMILY_VALUES,
} from "@/app/register/constants";

import { RegisterFormData } from "@/types/register";

type Props = {
  register: UseFormRegister<RegisterFormData>;
  errors: FieldErrors<RegisterFormData>;
};

export default function FamilyForm({
  register,
  errors,
}: Props) {
  return (
    <div className="space-y-6">

      <h2 className="text-2xl font-semibold text-gray-800">
        Family Details
      </h2>

      <div className="grid gap-6 md:grid-cols-2">

        <InputField
          label="Father's Name"
          placeholder="Enter Father's Name"
          registration={register("fatherName")}
          error={errors.fatherName}
        />

        <InputField
          label="Mother's Name"
          placeholder="Enter Mother's Name"
          registration={register("motherName")}
          error={errors.motherName}
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

      </div>

    </div>
  );
}