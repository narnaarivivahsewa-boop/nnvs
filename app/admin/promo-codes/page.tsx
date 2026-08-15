"use client";

import { useState } from "react";

export default function PromoCodesPage() {
  const [discount, setDiscount] = useState("20");
  const [profileId, setProfileId] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const [loading, setLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");

  async function generatePromoCode() {
    try {
      setLoading(true);
      setGeneratedCode("");

      const res = await fetch("/api/admin/promo-codes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          discount: Number(discount),
          profileId: profileId.trim() || undefined,
          email: email.trim() || undefined,
          mobile: mobile.trim() || undefined,
          expiresAt: expiresAt || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Unable to generate promo code.");
        return;
      }

      setGeneratedCode(data.promoCode.code);

      alert("Promo code generated successfully.");

      setProfileId("");
      setEmail("");
      setMobile("");
      setExpiresAt("");

    } catch (error) {
      console.error(error);
      alert("Unable to generate promo code.");
    } finally {
      setLoading(false);
    }
  }

  function copyCode() {
    if (!generatedCode) return;

    navigator.clipboard.writeText(generatedCode);

    alert("Promo code copied.");
  }

  return (
    <div className="p-6 md:p-10">

      <h1 className="text-3xl font-bold text-gray-800">
        Promo Codes
      </h1>

      <p className="mt-2 text-gray-500">
        Create secure, one-time promotional codes for members.
      </p>

      <div className="mt-8 max-w-2xl rounded-2xl bg-white p-6 shadow">

        <h2 className="mb-6 text-xl font-semibold">
          Create Promo Code
        </h2>

        <div className="space-y-5">

          <div>
            <label className="mb-2 block font-medium">
              Discount
            </label>

            <select
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className="w-full rounded-xl border p-3"
            >
              <option value="20">20% OFF</option>
              <option value="50">50% OFF</option>
              <option value="100">100% OFF</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Profile ID
            </label>

            <input
              value={profileId}
              onChange={(e) => setProfileId(e.target.value)}
              placeholder="Example: NNVS1786629308968"
              className="w-full rounded-xl border p-3"
            />

            <p className="mt-1 text-xs text-gray-500">
              Enter the Profile ID to assign this coupon to a specific
              member.
            </p>
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Email (Optional)
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="member@example.com"
              className="w-full rounded-xl border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Mobile (Optional)
            </label>

            <input
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="Mobile number"
              className="w-full rounded-xl border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Expiry Date (Optional)
            </label>

            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full rounded-xl border p-3"
            />
          </div>

          <button
            type="button"
            onClick={generatePromoCode}
            disabled={loading}
            className="w-full rounded-xl bg-red-700 px-6 py-3 font-semibold text-white transition hover:bg-red-800 disabled:opacity-50"
          >
            {loading
              ? "Generating..."
              : "Generate Secure Promo Code"}
          </button>

        </div>

      </div>

      {generatedCode && (
        <div className="mt-8 max-w-2xl rounded-2xl border-2 border-green-500 bg-green-50 p-6">

          <h2 className="text-xl font-bold text-green-800">
            Promo Code Generated
          </h2>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">

            <input
              value={generatedCode}
              readOnly
              className="flex-1 rounded-xl border bg-white p-3 font-mono font-bold"
            />

            <button
              type="button"
              onClick={copyCode}
              className="rounded-xl bg-green-700 px-6 py-3 font-semibold text-white hover:bg-green-800"
            >
              Copy Code
            </button>

          </div>

          <p className="mt-4 text-sm text-green-800">
            This promo code is unique and can be used only according
            to its assigned member and validity rules.
          </p>

        </div>
      )}

    </div>
  );
}