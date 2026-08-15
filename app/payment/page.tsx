"use client";

import { useSearchParams } from "next/navigation";

const GST_RATE = 0.18;

const FEES = {
  MALE: 799,
  FEMALE: 399,
};

export default function PaymentPage() {
  const searchParams = useSearchParams();

  const gender = searchParams.get("gender")?.toUpperCase();

  const baseFee =
    gender === "FEMALE"
      ? FEES.FEMALE
      : FEES.MALE;

  const gstAmount = Number(
    (baseFee * GST_RATE).toFixed(2)
  );

  const totalAmount = Number(
    (baseFee + gstAmount).toFixed(2)
  );

  const registrationType =
    gender === "FEMALE" ? "Female" : "Male";

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-12">

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

          <div className="rounded-2xl border border-gray-200 p-6">

            <h2 className="mb-5 text-xl font-semibold text-gray-800">
              {registrationType} Registration
            </h2>

            <div className="space-y-4 text-gray-700">

              <div className="flex justify-between">
                <span>One-Time Registration Fee</span>
                <span className="font-semibold">
                  ₹{baseFee.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between">
                <span>GST @ 18%</span>
                <span className="font-semibold">
                  ₹{gstAmount.toFixed(2)}
                </span>
              </div>

              <div className="my-4 border-t" />

              <div className="flex justify-between text-lg font-bold text-gray-900">
                <span>Total Payable</span>
                <span>
                  ₹{totalAmount.toFixed(2)}
                </span>
              </div>

            </div>

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
            className="mt-8 w-full rounded-xl bg-gray-400 px-8 py-4 font-semibold text-white cursor-not-allowed"
          >
            Payment Gateway Coming Soon
          </button>

          <p className="mt-4 text-center text-xs text-gray-500">
            Online payment will be enabled after the
            payment gateway is activated.
          </p>

        </div>

      </div>

    </main>
  );
}