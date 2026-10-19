"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { BUSINESS_INFO, calculateGstBreakdown } from "@/lib/gst";
import { ShieldCheck, ArrowRight, Sparkles, Tag, CheckCircle2 } from "lucide-react";

function ReviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const profileId = searchParams.get("profileId") || "";
  const genderParam = searchParams.get("gender")?.toUpperCase();

  const isFemale = genderParam === "FEMALE";
  const registrationType = isFemale ? "Female" : "Male";
  const baseFee = isFemale ? BUSINESS_INFO.fees.female : BUSINESS_INFO.fees.male;

  const initialCoupon = searchParams.get("coupon") || "";
  const [couponInput, setCouponInput] = useState(initialCoupon);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    message: string;
    calculation: {
      baseFee: number;
      discountAmount: number;
      cgstAmount: number;
      sgstAmount: number;
      totalAmount: number;
    };
  } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");

  const handleApplyCoupon = async (codeToApply?: string) => {
    const rawCode = (codeToApply !== undefined ? codeToApply : couponInput).trim();
    if (!rawCode) {
      setCouponError("Please enter a coupon code.");
      return;
    }

    setCouponLoading(true);
    setCouponError("");
    setCouponSuccess("");

    try {
      const res = await fetch("/api/payment/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: rawCode,
          profileId,
          baseFee,
          gender: genderParam || "MALE",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setCouponError(data.message || "Invalid coupon code.");
        setAppliedCoupon(null);
        return;
      }

      setAppliedCoupon({
        code: data.promoCode.code,
        message: data.message,
        calculation: data.calculation,
      });
      setCouponSuccess(data.message || "Coupon applied successfully!");
      setCouponError("");
    } catch (err: any) {
      console.error("Coupon apply error:", err);
      setCouponError("Failed to apply coupon. Please try again.");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponSuccess("");
    setCouponError("");
  };

  useEffect(() => {
    if (initialCoupon && !appliedCoupon) {
      handleApplyCoupon(initialCoupon);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCoupon]);

  const defaultTaxes = calculateGstBreakdown(baseFee);
  const displayBaseFee = appliedCoupon ? appliedCoupon.calculation.baseFee : baseFee;
  const displayCgst = appliedCoupon ? appliedCoupon.calculation.cgstAmount : defaultTaxes.cgstAmount;
  const displaySgst = appliedCoupon ? appliedCoupon.calculation.sgstAmount : defaultTaxes.sgstAmount;
  const totalAmount = appliedCoupon ? appliedCoupon.calculation.totalAmount : defaultTaxes.totalAmount;

  const handleProceed = () => {
    if (!profileId) {
      router.push("/register");
      return;
    }
    const couponQuery = appliedCoupon ? `&coupon=${encodeURIComponent(appliedCoupon.code)}` : "";
    router.push(`/payment?profileId=${encodeURIComponent(profileId)}&gender=${encodeURIComponent(genderParam || "MALE")}${couponQuery}`);
  };

  return (
    <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-gray-100">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#FAF5EB] px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#7A5835] mb-2 border border-[#E8DCC8]">
          <Sparkles className="h-3.5 w-3.5 text-[#C5A059]" />
          <span>Registration Review & Checkout</span>
        </div>
        <h1 className="text-3xl font-black text-[#4A121A] font-serif-luxury">
          Rishte<span className="text-[#C5A059]">Club</span>
        </h1>
        <p className="text-xs font-semibold text-[#7A5835] uppercase tracking-wider mt-0.5">
          Managed by NNVS Matrimony
        </p>
        <p className="text-xs text-gray-500 mt-1.5">
          Verify your registration details and apply any discount coupon
        </p>
      </div>

      <div className="space-y-3.5 rounded-2xl bg-[#FAF8F5] p-5 border border-[#E8DCC8] text-xs sm:text-sm text-gray-700">
        {profileId && (
          <div className="flex justify-between pb-2.5 border-b border-[#E8DCC8]">
            <span className="text-gray-500">Candidate Profile ID</span>
            <span className="font-mono font-bold text-gray-900">{profileId}</span>
          </div>
        )}

        <div className="flex justify-between">
          <span>Profile Type</span>
          <span className="font-bold text-gray-900">{registrationType} Registration</span>
        </div>

        <div className="flex justify-between">
          <span>Registration Fee</span>
          <span className="font-semibold text-gray-900">₹{displayBaseFee.toFixed(2)}</span>
        </div>

        {appliedCoupon && appliedCoupon.calculation.discountAmount > 0 && (
          <div className="flex justify-between text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-1.5 rounded-lg border border-emerald-200">
            <span>Coupon Discount ({appliedCoupon.code})</span>
            <span>-₹{appliedCoupon.calculation.discountAmount.toFixed(2)}</span>
          </div>
        )}

        <div className="flex justify-between text-xs text-gray-600">
          <span>CGST (9%)</span>
          <span>₹{displayCgst.toFixed(2)}</span>
        </div>

        <div className="flex justify-between text-xs text-gray-600">
          <span>SGST (9%)</span>
          <span>₹{displaySgst.toFixed(2)}</span>
        </div>

        <div className="border-t border-[#E8DCC8] pt-2.5 flex justify-between text-base sm:text-lg font-black text-[#4A121A]">
          <span>Total Payable (incl. 18% GST)</span>
          <span>₹{totalAmount.toFixed(2)}</span>
        </div>
      </div>

      {/* Coupon Box in Review Screen */}
      <div className="mt-4 rounded-2xl border border-[#DACBB4] bg-white p-3.5">
        <div className="flex items-center justify-between mb-2">
          <label
            htmlFor="review-coupon-input"
            className="text-xs font-bold text-[#4A121A] uppercase tracking-wide flex items-center gap-1.5"
          >
            <Tag className="h-3.5 w-3.5 text-[#C5A059]" />
            <span>Have a Coupon Code?</span>
          </label>
          {appliedCoupon && (
            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Active
            </span>
          )}
        </div>

        {appliedCoupon ? (
          <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-300 p-2.5 text-xs">
            <div>
              <p className="font-mono font-bold text-emerald-900 flex items-center gap-1">
                <span>{appliedCoupon.code}</span>
                <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 rounded font-sans font-semibold">
                  Applied
                </span>
              </p>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                {appliedCoupon.message}
              </p>
            </div>
            <button
              type="button"
              onClick={handleRemoveCoupon}
              className="text-xs font-bold text-red-600 hover:text-red-800 underline px-2 py-1"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              id="review-coupon-input"
              type="text"
              value={couponInput}
              onChange={(e) => {
                setCouponInput(e.target.value.toUpperCase());
                setCouponError("");
              }}
              placeholder="Enter Coupon Code"
              className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-xs font-mono font-semibold uppercase tracking-wider text-gray-900 focus:border-[#4A121A] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => handleApplyCoupon()}
              disabled={couponLoading || !couponInput.trim()}
              className="rounded-xl bg-[#4A121A] px-3.5 py-2 text-xs font-bold text-[#DFBA73] hover:bg-[#380e14] transition disabled:opacity-50"
            >
              {couponLoading ? "Applying..." : "Apply"}
            </button>
          </div>
        )}

        {couponError && (
          <p className="mt-2 text-xs font-semibold text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
            {couponError}
          </p>
        )}

        {couponSuccess && !couponError && (
          <p className="mt-2 text-xs font-semibold text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
            ✓ {couponSuccess}
          </p>
        )}
      </div>

      <div className="mt-4 rounded-2xl bg-[#FAF5EB] p-3.5 text-xs text-gray-700 border border-[#DACBB4] space-y-1">
        <div className="flex items-center gap-1.5 text-[#7A5835] font-bold">
          <ShieldCheck className="h-4 w-4 text-[#C5A059]" />
          <span>GST Compliance & Official Invoicing</span>
        </div>
        <p className="text-[11px] text-gray-600">
          Official GST Tax Invoice will be issued by <strong>{BUSINESS_INFO.tradeName}</strong> (GSTIN: {BUSINESS_INFO.gstin}) immediately upon payment.
        </p>
      </div>

      <button
        onClick={handleProceed}
        className="mt-5 w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4A121A] to-[#681925] py-3.5 text-white font-bold shadow-lg hover:from-[#3D0E15] hover:to-[#55141E] transition text-sm sm:text-base cursor-pointer"
      >
        <span>Proceed to Payment (₹{totalAmount.toFixed(2)})</span>
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