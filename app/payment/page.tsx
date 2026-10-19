"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { BUSINESS_INFO, calculateGstBreakdown } from "@/lib/gst";
import RazorpayCheckoutButton from "@/components/RazorpayCheckoutButton";
import {
  ShieldCheck,
  Sparkles,
  ArrowLeft,
  Lock,
  Zap,
  FileText,
  BadgeCheck,
  Tag,
} from "lucide-react";

function PaymentContent() {
  const searchParams = useSearchParams();
  const profileId = searchParams.get("profileId") || "";
  const nameParam = searchParams.get("name") || "";
  const genderParam = searchParams.get("gender")?.toUpperCase();

  const [gender, setGender] = useState<string>(genderParam || "MALE");
  const isFemale = gender === "FEMALE";
  const applicableFee = isFemale ? BUSINESS_INFO.fees.female : BUSINESS_INFO.fees.male;

  const initialCoupon = searchParams.get("coupon") || "";
  const [couponInput, setCouponInput] = useState(initialCoupon);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    message: string;
    calculation: {
      originalBaseFee?: number;
      originalTotalAmount?: number;
      baseFee: number;
      discountAmount: number;
      discountedFee: number;
      gstAmount: number;
      cgstAmount: number;
      sgstAmount: number;
      totalAmount: number;
    };
  } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");

  const [settings, setSettings] = useState<{
    registrationFee: number;
    gstPercentage: number;
    tradeName: string;
    gstin: string;
  }>({
    registrationFee: applicableFee,
    gstPercentage: 18,
    tradeName: BUSINESS_INFO.tradeName,
    gstin: BUSINESS_INFO.gstin,
  });

  useEffect(() => {
    async function loadProfileAndSettings() {
      if (profileId) {
        try {
          const pRes = await fetch(`/api/profile?profileId=${encodeURIComponent(profileId)}`);
          if (pRes.ok) {
            const pData = await pRes.json();
            const pGender = (pData?.profile?.user?.gender || pData?.profile?.gender || "").toUpperCase();
            if (pGender === "FEMALE" || pGender === "MALE") {
              setGender(pGender);
            }
          }
        } catch (e) {
          console.error("Could not fetch profile gender:", e);
        }
      }
    }
    loadProfileAndSettings();
  }, [profileId]);

  useEffect(() => {
    setSettings((prev) => ({
      ...prev,
      registrationFee: isFemale ? BUSINESS_INFO.fees.female : BUSINESS_INFO.fees.male,
    }));
  }, [isFemale]);

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
          baseFee: isFemale ? BUSINESS_INFO.fees.female : BUSINESS_INFO.fees.male,
          gender,
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

  const [activatingFree, setActivatingFree] = useState(false);

  const handleFreeActivation = async () => {
    if (!appliedCoupon) return;
    try {
      setActivatingFree(true);
      const res = await fetch("/api/payment/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId,
          promoCode: appliedCoupon.code,
          paymentMethod: "PROMO_100_PERCENT_FREE",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.message || "Failed to activate free membership.");
        return;
      }

      alert("🎉 100% Discount Applied! Your membership has been activated successfully.");
      window.location.href = `/dashboard?payment=success&profileId=${encodeURIComponent(profileId)}`;
    } catch (err: any) {
      console.error("Free activation error:", err);
      alert("Failed to activate free membership. Please try again.");
    } finally {
      setActivatingFree(false);
    }
  };

  // Auto-apply coupon from query param if available
  useEffect(() => {
    if (initialCoupon && !appliedCoupon) {
      handleApplyCoupon(initialCoupon);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCoupon, gender]);

  const defaultTaxes = calculateGstBreakdown(applicableFee);
  const totalAmount = appliedCoupon
    ? appliedCoupon.calculation.totalAmount
    : defaultTaxes.totalAmount;
  const displayBaseFee = appliedCoupon
    ? appliedCoupon.calculation.baseFee
    : settings.registrationFee;
  const displayCgst = appliedCoupon
    ? appliedCoupon.calculation.cgstAmount
    : defaultTaxes.cgstAmount;
  const displaySgst = appliedCoupon
    ? appliedCoupon.calculation.sgstAmount
    : defaultTaxes.sgstAmount;

  return (
    <div className="mx-auto max-w-xl">
      <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-[#DACBB4]">
        {/* Brand Header */}
        <div className="mb-6 text-center">
          <Link href="/" className="inline-block mb-3">
            <img
              src="/nnvs-logo.png"
              alt="RishteClub Matrimony"
              className="h-14 w-auto mx-auto object-contain"
            />
          </Link>

          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#FAF5EB] px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#7A5835] mb-2.5 border border-[#E8DCC8]">
            <Sparkles className="h-3.5 w-3.5 text-[#C5A059]" />
            <span>Official Membership Checkout</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#4A121A] font-serif-luxury tracking-tight">
            Online Registration Fee
          </h1>

          <p className="mt-1 text-xs text-[#7A5835] font-semibold">
            Fast, secure and automated payment via Razorpay Gateway
          </p>
        </div>

        {/* Profile Details Tag */}
        {profileId && (
          <div className="mb-6 flex items-center justify-between rounded-2xl bg-[#FAF6EF] px-5 py-3 border border-[#E8DCC8] text-xs">
            <span className="text-gray-600 font-medium">Candidate Profile ID:</span>
            <span className="font-mono font-bold text-[#4A121A] text-sm">{profileId}</span>
          </div>
        )}

        {/* Amount & GST Card */}
        <div className="rounded-2xl border border-[#E8DCC8] bg-[#FAF8F5] p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#E8DCC8]">
            <h2 className="text-xs sm:text-sm font-bold text-gray-900 uppercase tracking-wide">
              Applicable Membership Fee
            </h2>
            <span className="text-[11px] font-mono font-bold bg-[#4A121A] text-[#DFBA73] px-2.5 py-0.5 rounded-md">
              SAC: {BUSINESS_INFO.sacCode}
            </span>
          </div>

          <div className="space-y-2.5 pt-3 text-sm text-gray-700">
            <div className="flex justify-between">
              <span>Registration Service Fee</span>
              <span className="font-semibold text-gray-900">
                ₹{displayBaseFee.toFixed(2)}
              </span>
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

            <div className="border-t border-[#E8DCC8] pt-2.5 flex justify-between text-lg font-black text-[#4A121A]">
              <span>Total Amount (incl. 18% GST)</span>
              <span>₹{totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Coupon Code Input Box */}
        <div className="mt-5 rounded-2xl border border-[#DACBB4] bg-white p-4">
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="coupon-code-input"
              className="text-xs font-bold text-[#4A121A] uppercase tracking-wide flex items-center gap-1.5"
            >
              <Tag className="h-3.5 w-3.5 text-[#C5A059]" />
              <span>Have a Coupon / Promo Code?</span>
            </label>
            {appliedCoupon && (
              <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Active
              </span>
            )}
          </div>

          {appliedCoupon ? (
            <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-300 p-3 text-xs">
              <div>
                <p className="font-mono font-bold text-emerald-900 flex items-center gap-1">
                  <span>{appliedCoupon.code}</span>
                  <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded font-sans font-semibold">
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
                id="coupon-code-input"
                type="text"
                value={couponInput}
                onChange={(e) => {
                  setCouponInput(e.target.value.toUpperCase());
                  setCouponError("");
                }}
                placeholder="Enter Coupon Code"
                className="flex-1 rounded-xl border border-gray-300 px-3.5 py-2.5 text-xs font-mono font-semibold uppercase tracking-wider text-gray-900 focus:border-[#4A121A] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleApplyCoupon()}
                disabled={couponLoading || !couponInput.trim()}
                className="rounded-xl bg-[#4A121A] px-4 py-2.5 text-xs font-bold text-[#DFBA73] hover:bg-[#380e14] transition disabled:opacity-50 flex items-center gap-1"
              >
                {couponLoading ? "Applying..." : "Apply"}
              </button>
            </div>
          )}

          {couponError && (
            <p className="mt-2 text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
              {couponError}
            </p>
          )}

          {couponSuccess && !couponError && (
            <p className="mt-2 text-xs font-semibold text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
              ✓ {couponSuccess}
            </p>
          )}
        </div>

        {/* Instant Online Checkout Action Box */}
        <div className="mt-6 rounded-2xl border-2 border-[#4A121A] bg-[#FAF5EB] p-6 shadow-md space-y-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-bold text-[#4A121A] border border-[#DACBB4]">
            <Zap className="h-3.5 w-3.5 text-[#C5A059]" />
            <span>Instant Auto-Activation</span>
          </div>

          <div>
            <h3 className="text-base font-bold text-[#4A121A]">
              {totalAmount <= 0 ? "100% Free Registration" : `Pay ₹${totalAmount.toFixed(2)} Online`}
            </h3>
            <p className="text-xs text-gray-600 mt-1">
              {totalAmount <= 0
                ? "No online payment required. Click below to activate immediately."
                : "Supports UPI (GPay, PhonePe, Paytm), Debit/Credit Cards & Net Banking"}
            </p>
          </div>

          {totalAmount <= 0 ? (
            <div className="space-y-3 pt-2">
              <div className="rounded-xl bg-emerald-100/80 border border-emerald-300 p-3 text-xs text-emerald-900 font-semibold text-center">
                🎉 100% Discount Applied! Your registration is completely free.
              </div>
              <button
                type="button"
                onClick={handleFreeActivation}
                disabled={activatingFree}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-700 py-3.5 px-4 text-white font-bold shadow-lg hover:from-emerald-700 hover:to-green-800 transition disabled:opacity-50 text-sm"
              >
                {activatingFree ? (
                  <>
                    <Sparkles className="h-4 w-4 animate-spin" />
                    <span>Activating Free Membership...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Activate Free Membership Now (₹0.00)</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <RazorpayCheckoutButton
              amountInRupees={totalAmount}
              profileId={profileId}
              promoCode={appliedCoupon ? appliedCoupon.code : undefined}
              name={nameParam}
              description="RishteClub Matrimonial Membership Fee"
              buttonText={`Pay ₹${totalAmount.toFixed(2)} with Razorpay`}
            />
          )}

          {/* Supported Methods Icons/Labels */}
          <div className="pt-2 border-t border-[#E8DCC8] flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] font-semibold text-gray-600">
            <span className="flex items-center gap-1">
              <BadgeCheck className="h-3.5 w-3.5 text-[#C5A059]" /> Google Pay / PhonePe / Paytm
            </span>
            <span className="flex items-center gap-1">
              <BadgeCheck className="h-3.5 w-3.5 text-[#C5A059]" /> Visa / Mastercard / RuPay
            </span>
            <span className="flex items-center gap-1">
              <BadgeCheck className="h-3.5 w-3.5 text-[#C5A059]" /> Net Banking
            </span>
          </div>
        </div>

        {/* Features / Benefits */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="flex items-start gap-2.5 rounded-xl bg-white p-3.5 border border-[#E8DCC8]">
            <Lock className="h-4 w-4 text-emerald-700 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-gray-900">256-bit Bank Encryption</p>
              <p className="text-gray-500 text-[11px]">PCI-DSS Compliant Secure Gateway</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-xl bg-white p-3.5 border border-[#E8DCC8]">
            <FileText className="h-4 w-4 text-[#4A121A] flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-gray-900">Instant GST Invoice</p>
              <p className="text-gray-500 text-[11px]">Auto-generated tax invoice on completion</p>
            </div>
          </div>
        </div>

        {/* Navigation Action Buttons */}
        <div className="mt-6">
          <Link
            href="/dashboard"
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white py-3 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Dashboard</span>
          </Link>
        </div>

        {/* GST Billing Entity Notice */}
        <div className="mt-6 rounded-2xl bg-[#FAF5EB] p-4 text-[11px] text-gray-600 border border-[#DACBB4] space-y-1">
          <div className="flex items-center gap-1.5 text-[#7A5835] font-bold">
            <ShieldCheck className="h-4 w-4 text-[#C5A059]" />
            <span>GST Compliance & Official Billing</span>
          </div>
          <p>
            Official GST Tax Invoice will be issued under trade name <strong>{settings.tradeName}</strong> (GSTIN: <span className="font-mono">{settings.gstin}</span>) upon successful payment.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <main className="min-h-screen bg-[#FAF6EF] px-4 py-12 flex items-center justify-center">
      <Suspense
        fallback={
          <div className="text-center py-20 text-gray-500 font-semibold">
            Loading payment options...
          </div>
        }
      >
        <PaymentContent />
      </Suspense>
    </main>
  );
}