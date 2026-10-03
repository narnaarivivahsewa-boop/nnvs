"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import { BUSINESS_INFO, calculateGstBreakdown } from "@/lib/gst";
import { ShieldCheck, CheckCircle2, FileText, ArrowRight, Sparkles, CreditCard, Lock } from "lucide-react";

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const profileId = searchParams.get("profileId");
  const genderParam = searchParams.get("gender")?.toUpperCase();

  const isFemale = genderParam === "FEMALE";
  const registrationType = isFemale ? "Female" : "Male";
  const baseFee = isFemale ? BUSINESS_INFO.fees.female : BUSINESS_INFO.fees.male;

  const [promoCode, setPromoCode] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoMessage, setPromoMessage] = useState("");

  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountedFee, setDiscountedFee] = useState<number>(baseFee);

  const initialTaxes = calculateGstBreakdown(baseFee);
  const [gstAmount, setGstAmount] = useState(initialTaxes.totalTax);
  const [totalAmount, setTotalAmount] = useState(initialTaxes.totalAmount);

  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  const applyPromoCode = async () => {
    const code = promoCode.trim();

    if (!code) {
      setPromoMessage("Please enter a promo code.");
      return;
    }

    if (!profileId) {
      setPromoMessage("Profile ID is missing. Please return to registration.");
      return;
    }

    try {
      setPromoLoading(true);
      setPromoMessage("");

      const res = await fetch("/api/payment/promo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          profileId,
          baseFee,
        }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        setPromoApplied(false);
        setDiscountPercent(0);
        setDiscountAmount(0);
        setDiscountedFee(baseFee);

        const normalTaxes = calculateGstBreakdown(baseFee);
        setGstAmount(normalTaxes.totalTax);
        setTotalAmount(normalTaxes.totalAmount);
        setPromoMessage(result.message || "Invalid promo code.");
        return;
      }

      const calculation = result.calculation;

      setPromoApplied(true);
      setDiscountPercent(Number(calculation.discountPercent ?? 0));
      setDiscountAmount(Number(calculation.discountAmount ?? 0));
      setDiscountedFee(Number(calculation.discountedFee ?? baseFee));
      setGstAmount(Number(calculation.gstAmount ?? 0));
      setTotalAmount(Number(calculation.totalAmount ?? 0));
      setPromoMessage("Promo code applied successfully.");
    } catch (error) {
      console.error("PROMO CODE APPLY ERROR =>", error);
      setPromoApplied(false);
      setPromoMessage("Unable to validate promo code. Please try again.");
    } finally {
      setPromoLoading(false);
    }
  };

  const removePromoCode = () => {
    setPromoCode("");
    setPromoApplied(false);
    setPromoMessage("");
    setDiscountPercent(0);
    setDiscountAmount(0);
    setDiscountedFee(baseFee);

    const normalTaxes = calculateGstBreakdown(baseFee);
    setGstAmount(normalTaxes.totalTax);
    setTotalAmount(normalTaxes.totalAmount);
  };

  const handleProcessPayment = async () => {
    if (!profileId) {
      setPaymentError("Profile ID is missing. Please return to registration.");
      return;
    }

    try {
      setPaymentProcessing(true);
      setPaymentError("");

      const res = await fetch("/api/payment/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId,
          promoCode: promoApplied ? promoCode : undefined,
          paymentMethod: "UPI_ONLINE",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setPaymentError(data.message || "Payment could not be completed.");
        return;
      }

      // Redirect to newly generated GST Tax Invoice
      router.push(data.invoiceUrl || `/invoice/${data.paymentId}`);
    } catch (err: any) {
      console.error("PAYMENT PROCESS ERROR =>", err);
      setPaymentError("Payment transaction failed. Please try again.");
    } finally {
      setPaymentProcessing(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-gray-100">
        {/* Brand Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#FAF5EB] px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#7A5835] mb-3 border border-[#E8DCC8]">
            <Sparkles className="h-3.5 w-3.5 text-[#C5A059]" />
            <span>Official Matrimonial Membership</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-[#4A121A] font-serif-luxury tracking-tight">
            Rishte<span className="text-[#C5A059]">Club</span>
          </h1>

          <p className="mt-1 text-xs text-[#7A5835] font-semibold uppercase tracking-[0.16em]">
            Managed by NNVS Matrimony
          </p>

          <p className="mt-2 text-sm text-gray-600">
            Registration Summary & GST Tax Invoice
          </p>
        </div>

        {!profileId && (
          <div className="mb-6 rounded-2xl bg-red-50 p-4 text-sm text-red-700 border border-red-200">
            Profile ID is missing. Please complete the registration process first.
          </div>
        )}

        {/* Pricing Summary Box */}
        <div className="rounded-2xl border border-[#E8DCC8] bg-[#FAF8F5] p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-[#E8DCC8]">
            <h2 className="text-lg font-bold text-gray-900">
              {registrationType} Matrimonial Registration
            </h2>
            <span className="text-xs font-mono font-bold bg-[#4A121A] text-[#DFBA73] px-2.5 py-1 rounded-md">
              SAC: {BUSINESS_INFO.sacCode}
            </span>
          </div>

          <div className="space-y-3.5 pt-4 text-sm text-gray-700">
            <div className="flex justify-between gap-4">
              <span>One-Time Membership Fee</span>
              <span className="font-semibold text-gray-900">
                ₹{baseFee.toFixed(2)}
              </span>
            </div>

            {promoApplied && (
              <>
                <div className="flex justify-between gap-4 text-emerald-700 font-medium">
                  <span>Promo Discount ({discountPercent}%)</span>
                  <span>-₹{discountAmount.toFixed(2)}</span>
                </div>

                <div className="flex justify-between gap-4">
                  <span>Net Taxable Base</span>
                  <span className="font-semibold">
                    ₹{discountedFee.toFixed(2)}
                  </span>
                </div>
              </>
            )}

            <div className="flex justify-between gap-4 text-gray-600 text-xs">
              <span>CGST (9%)</span>
              <span>₹{(gstAmount / 2).toFixed(2)}</span>
            </div>

            <div className="flex justify-between gap-4 text-gray-600 text-xs">
              <span>SGST (9%)</span>
              <span>₹{(gstAmount / 2).toFixed(2)}</span>
            </div>

            <div className="my-2 border-t border-[#E8DCC8]" />

            <div className="flex justify-between gap-4 text-xl font-black text-[#4A121A]">
              <span>Total Payable (incl. GST)</span>
              <span>₹{totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Promo Code Box */}
        <div className="mt-6 rounded-2xl border border-gray-200 p-5 bg-white">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
            Have a Promo Code?
          </h3>

          {!promoApplied ? (
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="Enter Promo Code"
                disabled={promoLoading}
                className="min-w-0 flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm uppercase outline-none focus:border-[#4A121A] focus:ring-1 focus:ring-[#4A121A]"
              />

              <button
                type="button"
                onClick={applyPromoCode}
                disabled={promoLoading || !promoCode}
                className="rounded-xl bg-[#4A121A] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#380C13] disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {promoLoading ? "..." : "Apply"}
              </button>
            </div>
          ) : (
            <div className="mt-3 flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-2.5 border border-emerald-200">
              <div>
                <p className="font-bold text-emerald-800 text-sm">
                  {promoCode} Applied
                </p>
                <p className="text-xs text-emerald-700">
                  {discountPercent}% discount applied to base fee
                </p>
              </div>

              <button
                type="button"
                onClick={removePromoCode}
                className="text-xs font-bold text-red-700 hover:underline"
              >
                Remove
              </button>
            </div>
          )}

          {promoMessage && (
            <p
              className={`mt-2.5 text-xs font-medium ${
                promoApplied ? "text-emerald-700" : "text-red-600"
              }`}
            >
              {promoMessage}
            </p>
          )}
        </div>

        {/* Official GST Legal Entity Notice */}
        <div className="mt-6 rounded-2xl bg-[#FAF5EB] p-5 text-xs text-gray-700 border border-[#DACBB4] space-y-2">
          <div className="flex items-center gap-1.5 text-[#7A5835] font-bold text-xs uppercase tracking-wider">
            <ShieldCheck className="h-4 w-4 text-[#C5A059]" />
            <span>Tax Invoice & Regulatory Details</span>
          </div>

          <p className="text-gray-700 leading-relaxed">
            Upon successful payment, an official <strong>GST Tax Invoice</strong> will be generated immediately under our registered legal entity name:
          </p>

          <div className="pt-2 border-t border-[#E8DCC8] text-[11px] text-gray-600 space-y-0.5">
            <p><strong>Legal Entity / Trade Name:</strong> {BUSINESS_INFO.tradeName}</p>
            <p><strong>Proprietor:</strong> {BUSINESS_INFO.proprietor}</p>
            <p><strong>GSTIN:</strong> <span className="font-mono font-bold text-gray-900">{BUSINESS_INFO.gstin}</span></p>
            <p><strong>Platform:</strong> {BUSINESS_INFO.brandName} (Managed by {BUSINESS_INFO.managedBy})</p>
          </div>
        </div>

        {paymentError && (
          <div className="mt-4 rounded-xl bg-red-50 p-3.5 text-xs font-semibold text-red-700 border border-red-200">
            {paymentError}
          </div>
        )}

        {/* Payment Confirmation & Invoice Generation Button */}
        <button
          type="button"
          onClick={handleProcessPayment}
          disabled={paymentProcessing || !profileId}
          className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4A121A] to-[#681925] px-8 py-4 font-bold text-white shadow-lg transition hover:from-[#3D0E15] hover:to-[#55141E] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 text-base"
        >
          {paymentProcessing ? (
            <>
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Processing Payment & Generating Invoice...</span>
            </>
          ) : (
            <>
              <CreditCard className="h-5 w-5 text-[#DFBA73]" />
              <span>Complete Payment (₹{totalAmount.toFixed(2)}) & Get GST Invoice</span>
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </button>

        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
          <Lock className="h-3.5 w-3.5 text-emerald-600" />
          <span>256-Bit SSL Encrypted &bull; 100% Secure & Compliant</span>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <main className="min-h-screen bg-[#F4EFEA] px-4 py-12">
      <Suspense
        fallback={
          <div className="text-center py-20 text-gray-500 font-semibold">
            Loading payment details...
          </div>
        }
      >
        <PaymentContent />
      </Suspense>
    </main>
  );
}