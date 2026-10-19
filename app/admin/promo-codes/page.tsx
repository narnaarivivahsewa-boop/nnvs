"use client";

import { useState, useEffect } from "react";
import {
  Tag,
  Copy,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Plus,
  ShieldCheck,
  Search,
} from "lucide-react";

interface PromoCodeItem {
  id: string;
  code: string;
  discountType: string;
  discountValue: number | string;
  assignedProfileId: string | null;
  assignedEmail: string | null;
  assignedMobile: string | null;
  status: string;
  expiresAt: string | null;
  usedAt: string | null;
  usedPaymentId: string | null;
  createdAt: string;
  assignedProfile?: {
    id: string;
    profileId: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
}

export default function PromoCodesPage() {
  const [customCode, setCustomCode] = useState("");
  const [discount, setDiscount] = useState("20");
  const [profileId, setProfileId] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const [loading, setLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [copiedCode, setCopiedCode] = useState("");

  // Promo Codes List
  const [promoCodes, setPromoCodes] = useState<PromoCodeItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listSearch, setListSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchPromoCodes = async () => {
    try {
      setLoadingList(true);
      const res = await fetch("/api/admin/promo-codes");
      const data = await res.json();
      if (res.ok && data.success) {
        setPromoCodes(data.promoCodes || []);
      }
    } catch (e) {
      console.error("Error fetching promo codes:", e);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  async function handleCreatePromoCode(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      setGeneratedCode("");

      const res = await fetch("/api/admin/promo-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customCode: customCode.trim() || undefined,
          discount: Number(discount),
          profileId: profileId.trim() || undefined,
          email: email.trim() || undefined,
          mobile: mobile.trim() || undefined,
          expiresAt: expiresAt || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.message || "Unable to generate promo code.");
        return;
      }

      setGeneratedCode(data.promoCode.code);
      setCustomCode("");
      setProfileId("");
      setEmail("");
      setMobile("");
      setExpiresAt("");

      // Refresh list
      fetchPromoCodes();
    } catch (error) {
      console.error(error);
      alert("Unable to generate promo code.");
    } finally {
      setLoading(false);
    }
  }

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(""), 2000);
  };

  const handleDeleteCode = async (id: string, code: string) => {
    if (!confirm(`Are you sure you want to permanently delete coupon '${code}'?`)) {
      return;
    }

    try {
      setDeletingId(id);
      const res = await fetch(`/api/admin/promo-codes?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.message || "Failed to delete promo code.");
        return;
      }
      setPromoCodes((prev) => prev.filter((p) => p.id !== id));
      if (generatedCode === code) setGeneratedCode("");
    } catch (err: any) {
      console.error(err);
      alert("Error deleting promo code.");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredCodes = promoCodes.filter((c) => {
    if (!listSearch.trim()) return true;
    const q = listSearch.toLowerCase();
    return (
      c.code.toLowerCase().includes(q) ||
      (c.assignedProfile?.profileId && c.assignedProfile.profileId.toLowerCase().includes(q)) ||
      (c.assignedMobile && c.assignedMobile.includes(q)) ||
      (c.assignedEmail && c.assignedEmail.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-4 sm:p-6 md:p-10 space-y-8">
      {/* Page Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#FAF5EB] px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#7A5835] mb-2 border border-[#E8DCC8]">
          <Tag className="h-3.5 w-3.5 text-[#C5A059]" />
          <span>Discount & Coupon Management</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 font-serif-luxury">
          Promo Codes & Coupons
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-gray-500">
          Create, issue, and manage universal or candidate-specific discount coupons.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Create Coupon Form */}
        <div className="lg:col-span-5">
          <div className="rounded-3xl bg-white p-6 sm:p-7 shadow-xl border border-[#DACBB4]">
            <div className="flex items-center gap-2 mb-5 pb-3 border-b border-gray-100">
              <Plus className="h-5 w-5 text-[#4A121A]" />
              <h2 className="text-lg font-bold text-[#4A121A] font-serif-luxury">
                Create New Coupon
              </h2>
            </div>

            <form onSubmit={handleCreatePromoCode} className="space-y-4 text-xs">
              {/* Custom Code Input */}
              <div>
                <label className="block font-bold text-gray-700 uppercase tracking-wide mb-1">
                  Custom Code Name (Optional)
                </label>
                <input
                  type="text"
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                  placeholder="e.g. SAMIKSHA251, WELCOME50, FESTIVE"
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 font-mono font-bold text-gray-900 uppercase focus:border-[#4A121A] focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-gray-500">
                  Leave blank to automatically generate a secure code (e.g. NNVS-20-A1B2C3).
                </p>
              </div>

              {/* Discount Percentage */}
              <div>
                <label className="block font-bold text-gray-700 uppercase tracking-wide mb-1">
                  Discount Percentage (%) *
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {["20", "50", "75", "100"].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setDiscount(val)}
                      className={`py-2 rounded-xl text-xs font-bold transition border ${
                        discount === val
                          ? "bg-[#4A121A] text-white border-[#4A121A]"
                          : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      {val}% {val === "100" && "FREE"}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-3.5 py-2 font-bold text-gray-900 focus:border-[#4A121A] focus:outline-none text-xs"
                    placeholder="Custom % (1-100)"
                  />
                  <span className="text-gray-500 font-bold">% OFF</span>
                </div>
              </div>

              {/* Assignment Restrictions (Optional) */}
              <div className="pt-2 border-t border-gray-100">
                <span className="block font-bold text-gray-700 uppercase tracking-wide mb-1">
                  Member Assignment (Optional)
                </span>
                <p className="text-[11px] text-gray-500 mb-2.5">
                  Leave empty to make this coupon <strong>Universal</strong> (usable by any candidate).
                </p>

                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">
                      Restrict to Profile ID
                    </label>
                    <input
                      type="text"
                      value={profileId}
                      onChange={(e) => setProfileId(e.target.value)}
                      placeholder="e.g. NNVS1786629308968"
                      className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs font-mono focus:border-[#4A121A] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">
                      Restrict to Mobile Number
                    </label>
                    <input
                      type="text"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs font-mono focus:border-[#4A121A] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">
                      Restrict to Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="member@example.com"
                      className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-[#4A121A] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Expiry Date */}
              <div>
                <label className="block font-bold text-gray-700 uppercase tracking-wide mb-1">
                  Expiry Date (Optional)
                </label>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-[#4A121A] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4A121A] to-[#6B1A26] px-6 py-3.5 text-xs font-bold text-[#DFBA73] shadow-lg hover:from-[#380e14] hover:to-[#52131d] transition disabled:opacity-50 mt-4"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Creating Promo Code...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-[#C5A059]" />
                    <span>Create Promo Code</span>
                  </>
                )}
              </button>
            </form>

            {/* Generated Code Alert */}
            {generatedCode && (
              <div className="mt-5 rounded-2xl border-2 border-emerald-500 bg-emerald-50 p-4 animate-fadeIn">
                <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs mb-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Coupon Created Successfully!</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    value={generatedCode}
                    readOnly
                    className="flex-1 rounded-xl border border-emerald-300 bg-white px-3 py-2 font-mono font-black text-sm text-emerald-900 tracking-wider"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(generatedCode)}
                    className="flex items-center gap-1 rounded-xl bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-800 transition"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span>{copiedCode === generatedCode ? "Copied!" : "Copy"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Existing Promo Codes Table */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-3xl bg-white p-6 shadow-xl border border-[#E8DCC8]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900 font-serif-luxury">
                  Active & Issued Coupons
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Total {promoCodes.length} coupons registered in database
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    value={listSearch}
                    onChange={(e) => setListSearch(e.target.value)}
                    placeholder="Search coupon code..."
                    className="rounded-xl border border-gray-300 pl-8 pr-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-[#4A121A] w-44 sm:w-52"
                  />
                </div>
                <button
                  type="button"
                  onClick={fetchPromoCodes}
                  disabled={loadingList}
                  className="rounded-xl border border-gray-300 p-2 text-gray-600 hover:bg-gray-100 transition"
                  title="Refresh list"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingList ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            {loadingList ? (
              <div className="py-12 text-center text-gray-500 text-xs font-semibold flex items-center justify-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-[#4A121A]" />
                <span>Loading coupons...</span>
              </div>
            ) : filteredCodes.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-xs font-semibold space-y-1">
                <Tag className="h-8 w-8 mx-auto text-gray-300" />
                <p>No coupons found matching your query.</p>
              </div>
            ) : (
              <div className="space-y-3 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      <th className="pb-2.5">Code</th>
                      <th className="pb-2.5">Discount</th>
                      <th className="pb-2.5">Target</th>
                      <th className="pb-2.5">Status</th>
                      <th className="pb-2.5">Expiry</th>
                      <th className="pb-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredCodes.map((item) => {
                      const isExpired = item.expiresAt && new Date(item.expiresAt).getTime() < Date.now();
                      const statusDisplay = item.status === "USED" ? "USED" : isExpired ? "EXPIRED" : item.status;

                      return (
                        <tr key={item.id} className="hover:bg-gray-50/70 transition">
                          <td className="py-3 font-mono font-bold text-gray-900">
                            <div className="flex items-center gap-1.5">
                              <span>{item.code}</span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(item.code)}
                                className="text-gray-400 hover:text-[#4A121A] transition"
                                title="Copy code"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            {copiedCode === item.code && (
                              <span className="text-[10px] text-emerald-600 font-bold block">✓ Copied</span>
                            )}
                          </td>

                          <td className="py-3 font-bold text-emerald-700">
                            {Number(item.discountValue)}% OFF
                          </td>

                          <td className="py-3 text-gray-600">
                            {item.assignedProfile ? (
                              <div>
                                <span className="font-mono font-semibold text-gray-900 block">
                                  {item.assignedProfile.profileId}
                                </span>
                                <span className="text-[10px] text-gray-500">
                                  {item.assignedProfile.firstName || ""} {item.assignedProfile.lastName || ""}
                                </span>
                              </div>
                            ) : item.assignedMobile ? (
                              <span className="font-mono text-gray-900">{item.assignedMobile}</span>
                            ) : item.assignedEmail ? (
                              <span className="text-gray-900">{item.assignedEmail}</span>
                            ) : (
                              <span className="inline-block rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                                Universal (All)
                              </span>
                            )}
                          </td>

                          <td className="py-3">
                            {statusDisplay === "ACTIVE" ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                Active
                              </span>
                            ) : statusDisplay === "USED" ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-bold text-gray-600 border border-gray-200">
                                Used
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-bold text-red-600 border border-red-200">
                                Expired
                              </span>
                            )}
                          </td>

                          <td className="py-3 text-gray-500 text-[11px]">
                            {item.expiresAt ? (
                              new Date(item.expiresAt).toLocaleDateString("en-IN")
                            ) : (
                              <span className="text-gray-400">No Expiry</span>
                            )}
                          </td>

                          <td className="py-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteCode(item.id, item.code)}
                              disabled={deletingId === item.id}
                              className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                              title="Delete Coupon"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}