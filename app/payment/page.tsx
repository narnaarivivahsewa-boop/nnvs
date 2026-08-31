"use client";

import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

const GST_RATE = 0.18;

const FEES = {
  MALE: 799,
  FEMALE: 399,
};

function PaymentContent() {
  const searchParams = useSearchParams();

  const profileId = searchParams.get("profileId");
  const gender = searchParams.get("gender")?.toUpperCase();

  const registrationType =
    gender === "FEMALE" ? "Female" : "Male";

  const baseFee =
    gender === "FEMALE"
      ? FEES.FEMALE
      : FEES.MALE;

  const [promoCode, setPromoCode] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoMessage, setPromoMessage] = useState("");

  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountedFee, setDiscountedFee] =
    useState(baseFee);

  const [gstAmount, setGstAmount] = useState(
    Number((baseFee * GST_RATE).toFixed(2))
  );

  const [totalAmount, setTotalAmount] = useState(
    Number((baseFee * (1 + GST_RATE)).toFixed(2))
  );

  const applyPromoCode = async () => {
    const code = promoCode.trim();

    if (!code) {
      setPromoMessage("Please enter a promo code.");
      return;
    }

    if (!profileId) {
      setPromoMessage(
        "Profile ID is missing. Please return to registration."
      );
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

        const normalGst = Number(
          (baseFee * GST_RATE).toFixed(2)
        );

        setGstAmount(normalGst);
        setTotalAmount(
          Number((baseFee + normalGst).toFixed(2))
        );

        setPromoMessage(
          result.message || "Invalid promo code."
        );

        return;
      }

      const calculation = result.calculation;

      setPromoApplied(true);
      setDiscountPercent(
        Number(calculation.discountPercent ?? 0)
      );
      setDiscountAmount(
        Number(calculation.discountAmount ?? 0)
      );
      setDiscountedFee(
        Number(calculation.discountedFee ?? baseFee)
      );
      setGstAmount(
        Number(calculation.gstAmount ?? 0)
      );
      setTotalAmount(
        Number(calculation.totalAmount ?? 0)
      );

      setPromoMessage(
        "Promo code applied successfully."
      );
    } catch (error) {
      console.error(
        "PROMO CODE APPLY ERROR =>",
        error
      );

      setPromoApplied(false);
      setPromoMessage(
        "Unable to validate promo code. Please try again."
      );
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

    const normalGst = Number(
      (baseFee * GST_RATE).toFixed(2)
    );

    setGstAmount(normalGst);
    setTotalAmount(
      Number((baseFee + normalGst).toFixed(2))
    );
  };

  return (
    <div className="mx-auto max-w-lg">
      <div className="rounded-3xl bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-red-700">
            NNVS MATRIMONY
          </h1>

          <p className="mt-2 text-gray-600">
            Registration Payment
          </p>
        </div>

        {!profileId && (
          <div className="mb-6 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
            Profile ID is missing. Please complete the
            registration process again.
          </div>
        )}

        <div className="rounded-2xl border border-gray-200 p-6">
          <h2 className="mb-5 text-xl font-semibold text-gray-800">
            {registrationType} Registration
          </h2>

          <div className="space-y-4 text-gray-700">
            <div className="flex justify-between gap-4">
              <span>
                One-Time Registration Fee
              </span>

              <span className="font-semibold">
                ₹{baseFee.toFixed(2)}
              </span>
            </div>

            {promoApplied && (
              <>
                <div className="flex justify-between gap-4 text-green-700">
                  <span>
                    Promo Discount ({discountPercent}%)
                  </span>

                  <span className="font-semibold">
                    -₹{discountAmount.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span>
                    Registration Fee After Discount
                  </span>

                  <span className="font-semibold">
                    ₹{discountedFee.toFixed(2)}
                  </span>
                </div>
              </>
            )}

            <div className="flex justify-between gap-4">
              <span>
                GST @ 18%
              </span>

              <span className="font-semibold">
                ₹{gstAmount.toFixed(2)}
              </span>
            </div>

            <div className="my-4 border-t" />

            <div className="flex justify-between gap-4 text-lg font-bold text-gray-900">
              <span>
                Total Payable
              </span>

              <span>
                ₹{totalAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* ==========================
            PROMO CODE
        ========================== */}
        <div className="mt-6 rounded-2xl border border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-gray-800">
            Have a Promo Code?
          </h3>

          {!promoApplied ? (
            <div className="mt-4 flex gap-2">
              <input
                type="text"
                value={promoCode}
                onChange={(e) =>
                  setPromoCode(
                    e.target.value.toUpperCase()
                  )
                }
                placeholder="Enter promo code"
                disabled={promoLoading}
                className="min-w-0 flex-1 rounded-xl border border-gray-300 px-4 py-3 uppercase outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
              />

              <button
                type="button"
                onClick={applyPromoCode}
                disabled={promoLoading}
                className="rounded-xl bg-red-700 px-5 py-3 font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {promoLoading
                  ? "Checking..."
                  : "Apply"}
              </button>
            </div>
          ) : (
            <div className="mt-4 flex items-center justify-between rounded-xl bg-green-50 px-4 py-3">
              <div>
                <p className="font-semibold text-green-800">
                  {promoCode}
                </p>

                <p className="text-sm text-green-700">
                  {discountPercent}% discount applied
                </p>
              </div>

              <button
                type="button"
                onClick={removePromoCode}
                className="text-sm font-semibold text-red-700 hover:underline"
              >
                Remove
              </button>
            </div>
          )}

          {promoMessage && (
            <p
              className={`mt-3 text-sm ${
                promoApplied
                  ? "text-green-700"
                  : "text-red-600"
              }`}
            >
              {promoMessage}
            </p>
          )}
        </div>

        <div className="mt-6 rounded-2xl bg-red-50 p-5 text-sm leading-6 text-gray-700">
          <p className="font-semibold text-red-800">
            One-Time Registration Fee
          </p>

          <p className="mt-2">
            This is a one-time registration fee for
            registration with NNVS MATRIMONY. It is not
            a monthly, quarterly or annual subscription fee.
          </p>
        </div>

        <button
          type="button"
          disabled
          className="mt-8 w-full cursor-not-allowed rounded-xl bg-gray-400 px-8 py-4 font-semibold text-white"
        >
          Payment Gateway Coming Soon
        </button>

        <p className="mt-4 text-center text-xs text-gray-500">
          Online payment will be enabled after the
          payment gateway is activated.
        </p>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <main className="min-h-screen bg-gray-100 px-4 py-12">
      <Suspense fallback={<div className="text-center py-20 text-gray-500">Loading payment details...</div>}>
        <PaymentContent />
      </Suspense>
    </main>
  );
}