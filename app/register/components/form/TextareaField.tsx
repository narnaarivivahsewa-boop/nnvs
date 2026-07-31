"use client";

import { TextareaHTMLAttributes } from "react";
import { FieldError } from "react-hook-form";

type TextareaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: FieldError;
};

export default function TextareaField({
  label,
  error,
  className = "",
  ...props
}: TextareaFieldProps) {
  return (
    <div>
      <label className="block mb-2 font-medium text-gray-700">
        {label}
        {props.required && (
          <span className="text-red-500"> *</span>
        )}
      </label>

      <textarea
        {...props}
        className={`w-full rounded-xl border px-4 py-3 resize-none outline-none transition-all duration-200
        ${
          error
            ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200"
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