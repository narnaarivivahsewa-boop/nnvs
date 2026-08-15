"use client";

import { useSearchParams, useRouter } from "next/navigation";

const GST_RATE = 0.18;

const FEES = {
  MALE: 799,
  FEMALE: 399,
};

export default function ReviewPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const profileId = searchParams.get("profileId");
  const gender = searchParams.get("gender")?.toUpperCase();

  const isFemale = gender === "FEMALE";

  const registrationType = isFemale ? "Female" : "Male";
  const baseFee = isFemale ? FEES.FEMALE : FEES.MALE;

  const gstAmount = Number(
    (baseFee * GST_RATE).toFixed(2)
  );

  const totalAmount = Number(
    (baseFee + gstAmount).toFixed(2)
  );

  function proceedToPayment() {
    if (!profileId) {
      alert("Profile ID is missing.");
      return;
    }

    router.push(
      `/payment?profileId=${encodeURIComponent(
        profileId
      )}&gender=${encodeURIComponent(
        registrationType
      )}`
    );
  }

  if (!profileId) {
    return (
      <main className="min-h-screen bg-gray-100 px-4 py-12">

        <div className="mx-auto max-w-lg rounded-3xl bg-white p-8 text-center shadow-xl">

          <h1 className="text-2xl font-bold text-red-700">
            Registration Error
          </h1>

          <p className="mt-4 text-gray-600">
            Profile ID is missing. Please complete the
            registration process again.
          </p>

        </div>

      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-12">

      <div className="mx-auto max-w-lg">

        <div className="rounded-3xl bg-white p-8 shadow-xl">

          <div className="mb-8 text-center">

            <h1 className="text-3xl font-bold text-red-700">
              NNVS MATRIMONY
            </h1>

            <p className="mt-2 text-gray-600">
              Registration Summary
            </p>

          </div>

          <div className="mb-6 rounded-2xl bg-gray-50 p-5">

            <div className="flex justify-between gap-4">
              <span className="text-gray-600">
                Profile ID
              </span>

              <span className="font-semibold text-gray-900">
                {profileId}
              </span>
            </div>

            <div className="mt-3 flex justify-between">
              <span className="text-gray-600">
                Profile Type
              </span>

              <span className="font-semibold text-gray-900">
                {registrationType}
              </span>
            </div>

          </div>

          <div className="rounded-2xl border border-gray-200 p-6">

            <h2 className="mb-5 text-xl font-semibold text-gray-800">
              Registration Fee
            </h2>

            <div className="space-y-4 text-gray-700">

              <div className="flex justify-between">
                <span>
                  One-Time Registration Fee
                </span>

                <span className="font-semibold">
                  ₹{baseFee.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between">
                <span>
                  GST @ 18%
                </span>

                <span className="font-semibold">
                  ₹{gstAmount.toFixed(2)}
                </span>
              </div>

              <div className="my-4 border-t" />

              <div className="flex justify-between text-lg font-bold text-gray-900">
                <span>
                  Total Payable
                </span>

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
            onClick={proceedToPayment}
            className="mt-8 w-full rounded-xl bg-red-700 px-8 py-4 font-semibold text-white transition hover:bg-red-800"
          >
            Proceed To Payment
          </button>

        </div>

      </div>

    </main>
  );
}