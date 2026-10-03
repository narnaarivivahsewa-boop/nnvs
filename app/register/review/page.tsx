"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { BUSINESS_INFO, calculateGstBreakdown } from "@/lib/gst";
import { ShieldCheck, ArrowRight, Sparkles } from "lucide-react";

function ReviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const profileId = searchParams.get("profileId");
  const genderParam = searchParams.get("gender")?.toUpperCase();

  const isFemale = genderParam === "FEMALE";
  const registrationType = isFemale ? "Female" : "Male";
  const baseFee = isFemale ? BUSINESS_INFO.fees.female : BUSINESS_INFO.fees.male;

  const taxes = calculateGstBreakdown(baseFee);

  const handleProceed = () => {
    if (!profileId) {
      router.push("/register");
      return;
    }
    router.push(`/payment?profileId=${encodeURIComponent(profileId)}&gender=${encodeURIComponent(genderParam || "MALE")}`);
  };

  return (
    <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#FAF5EB] px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#7A5835] mb-2 border border-[#E8DCC8]">
          <Sparkles className="h-3.5 w-3.5 text-[#C5A059]" />
          <span>Registration Review</span>
        </div>
        <h1 className="text-3xl font-black text-[#4A121A] font-serif-luxury">
          Rishte<span className="text-[#C5A059]">Club</span>
        </h1>
        <p className="text-xs font-semibold text-[#7A5835] uppercase tracking-wider mt-0.5">
          Managed by NNVS Matrimony
        </p>
        <p className="text-sm text-gray-600 mt-2">
          Verify your registration details before proceeding to payment
        </p>
      </div>

      <div className="space-y-4 rounded-2xl bg-[#FAF8F5] p-6 border border-[#E8DCC8] text-sm text-gray-700">
        {profileId && (
          <div className="flex justify-between pb-3 border-b border-[#E8DCC8]">
            <span className="text-gray-500">Profile ID</span>
            <span className="font-mono font-bold text-gray-900">{profileId}</span>
          </div>
        )}

        <div className="flex justify-between">
          <span>Profile Type</span>
          <span className="font-bold text-gray-900">{registrationType} Registration</span>
        </div>

        <div className="flex justify-between">
          <span>One-Time Membership Fee</span>
          <span className="font-semibold text-gray-900">₹{baseFee.toFixed(2)}</span>
        </div>

        <div className="flex justify-between text-xs text-gray-600">
          <span>CGST (9%)</span>
          <span>₹{taxes.cgstAmount.toFixed(2)}</span>
        </div>

        <div className="flex justify-between text-xs text-gray-600">
          <span>SGST (9%)</span>
          <span>₹{taxes.sgstAmount.toFixed(2)}</span>
        </div>

        <div className="border-t border-[#E8DCC8] pt-3 flex justify-between text-lg font-black text-[#4A121A]">
          <span>Total Payable</span>
          <span>₹{taxes.totalAmount.toFixed(2)}</span>
        </div>
      </div>

      <div className="mt-5 rounded-2xl bg-[#FAF5EB] p-4 text-xs text-gray-700 border border-[#DACBB4] space-y-1">
        <div className="flex items-center gap-1.5 text-[#7A5835] font-bold">
          <ShieldCheck className="h-4 w-4 text-[#C5A059]" />
          <span>GST Compliance & Invoicing</span>
        </div>
        <p className="text-gray-600">
          Official GST Tax Invoice will be issued by <strong>{BUSINESS_INFO.tradeName}</strong> (GSTIN: {BUSINESS_INFO.gstin}) immediately after payment.
        </p>
      </div>

      <button
        onClick={handleProceed}
        className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4A121A] to-[#681925] py-4 text-white font-bold shadow-lg hover:from-[#3D0E15] hover:to-[#55141E] transition text-base"
      >
        <span>Proceed to Payment & Invoice</span>
        <ArrowRight className="h-5 w-5" />
      </button>
    </div>
  );
}

export default function ReviewPage() {
  return (
    <div className="min-h-screen bg-[#F4EFEA] flex items-center justify-center p-4 sm:p-6">
      <Suspense fallback={<div className="text-center py-20 text-gray-500 font-semibold">Loading registration summary...</div>}>
        <ReviewContent />
      </Suspense>
    </div>
  );
}