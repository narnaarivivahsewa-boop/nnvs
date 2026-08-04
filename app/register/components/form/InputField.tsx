"use client";

import { InputHTMLAttributes } from "react";
import { FieldError, UseFormRegisterReturn } from "react-hook-form";

type InputFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: FieldError;
  registration?: UseFormRegisterReturn;
};

export default function InputField({
  label,
  error,
  registration,
  className = "",
  ...props
}: InputFieldProps) {
  return (
    <div>
      <label className="block mb-2 font-medium text-gray-700">
        {label}
        {props.required && (
          <span className="text-red-500"> *</span>
        )}
      </label>

      <input
        {...registration}
        {...props}
        className={`w-full rounded-xl border px-4 py-3 outline-none transition-all duration-200
        ${
          error
            ? "border-red-500 focus:ring-red-200 focus:border-red-500"
            : "border-gray-300 focus:border-red-700 focus:ring-2 focus:ring-red-100"
        }
        ${className}`}
      />

      {error && (
        <p className="mt-1 text-sm text-red-600">
          {error.message}
        </p>
      )}
    </div>
  );
}