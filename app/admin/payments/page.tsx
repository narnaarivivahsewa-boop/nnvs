"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  CreditCard,
  CheckCircle2,
  Clock,
  FileText,
  ExternalLink,
  MessageSquare,
  AlertCircle,
  RefreshCw,
  X,
  ShieldCheck,
} from "lucide-react";

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState<"PENDING" | "CONFIRMED">("PENDING");
  const [pendingList, setPendingList] = useState<any[]>([]);
  const [confirmedList, setConfirmedList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Modal state for confirming payment
  const [selectedProfile, setSelectedProfile] = useState<any | null>(null);
  const [grossAmount, setGrossAmount] = useState("1100");
  const [paymentDate, setPaymentDate] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [isInterstate, setIsInterstate] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const loadPayments = useCallback(async (query: string = "") => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/payments?status=ALL&search=${encodeURIComponent(query)}`);
      const data = await res.json();

      if (data.success) {
        setPendingList(data.pendingProfiles || []);
        setConfirmedList(data.confirmedPayments || []);
      }
    } catch (err) {
      console.error("Error loading payments:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const res = await fetch(`/api/admin/payments?status=ALL&search=${encodeURIComponent(search)}`);
        const data = await res.json();
        if (!ignore && data.success) {
          setPendingList(data.pendingProfiles || []);
          setConfirmedList(data.confirmedPayments || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!ignore) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, [search]);

  const handleOpenConfirmModal = (profile: any) => {
    setSelectedProfile(profile);
    setGrossAmount("1100");
    setPaymentDate("2026-10-03");
    setTransactionId(`UPI_MANUAL_${profile.profileId || profile.id}`);
    setAdminNotes("");
    setIsInterstate(false);
    setSuccessMessage("");
    setErrorMessage("");
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile) return;

    try {
      setConfirming(true);
      setErrorMessage("");
      setSuccessMessage("");

      const res = await fetch("/api/admin/payments/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: selectedProfile.id,
          grossAmount: Number(grossAmount),
          paymentDate,
          transactionId: transactionId.trim(),
          adminNotes: adminNotes.trim(),
          isInterstate,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccessMessage(data.message);
        setTimeout(() => {
          setSelectedProfile(null);
          loadPayments(search);
        }, 1500);
      } else {
        setErrorMessage(data.message || "Failed to confirm payment.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setConfirming(false);
    }
  };

  // Reverse GST calculation preview
  const parsedGross = Number(grossAmount) || 0;
  const taxableCalc = (parsedGross / 1.18).toFixed(2);
  const gstTotalCalc = (parsedGross - Number(taxableCalc)).toFixed(2);
  const halfTaxCalc = (Number(gstTotalCalc) / 2).toFixed(2);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 font-serif">Payment Management</h1>
            <span className="bg-[#FAF5EB] text-[#7A5835] border border-[#DACBB4] text-xs font-semibold px-2.5 py-0.5 rounded-full">
              Trendy Traders GST
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            Verify manual offline payments, generate statutory GST invoices, and activate profiles.
          </p>
        </div>

        <button
          onClick={() => {
            setRefreshing(true);
            loadPayments(search);
          }}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 bg-white border border-gray-300 px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition active:scale-95"
        >
          <RefreshCw className={`h-4 w-4 text-[#7A5835] ${refreshing ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white p-4 rounded-2xl border border-[#EBE3D5] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="grid grid-cols-2 p-1 bg-[#FAF8F5] rounded-xl border border-gray-200 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab("PENDING")}
              className={`flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                activeTab === "PENDING"
                  ? "bg-[#4A121A] text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>Pending Payment</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-mono ${
                activeTab === "PENDING" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-900"
              }`}>
                {pendingList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("CONFIRMED")}
              className={`flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                activeTab === "CONFIRMED"
                  ? "bg-[#4A121A] text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Confirmed Payments</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-mono ${
                activeTab === "CONFIRMED" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-900"
              }`}>
                {confirmedList.length}
              </span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by RC ID, Old NNVS ID, name, mobile, UTR..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7A5835] focus:bg-white transition"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#7A5835] border-t-transparent mb-3" />
          <p className="text-gray-600 text-sm font-medium">Loading payments & registrations...</p>
        </div>
      ) : activeTab === "PENDING" ? (
        /* PENDING PAYMENTS TAB */
        <div className="space-y-4">
          {pendingList.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-gray-900">No Pending Payments</h3>
              <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                All registered candidates are either fully confirmed or verified.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingList.map((item) => {
                const candidateName = `${item.firstName || ""} ${item.lastName || ""}`.trim() || item.user?.fullName || "Candidate";
                const mobile = item.user?.mobile || item.contactNumber || "";
                const cleanPhone = mobile.replace(/[^0-9]/g, "").slice(-10);

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-[#EBE3D5] p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between gap-4"
                  >
                    <div>
                      {/* Top badges */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <span className="inline-block bg-[#FAF5EB] text-[#7A5835] border border-[#DACBB4] text-xs font-mono font-bold px-2.5 py-0.5 rounded-md">
                            {item.profileId}
                          </span>
                          {item.legacyProfileId && (
                            <span className="inline-block ml-1.5 bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-mono font-bold px-2 py-0.5 rounded-md">
                              Old: {item.legacyProfileId}
                            </span>
                          )}
                        </div>
                        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 text-xs font-bold px-2.5 py-0.5 rounded-full">
                          <Clock className="h-3 w-3" />
                          Pending
                        </span>
                      </div>

                      {/* Name & details */}
                      <h3 className="text-base font-bold text-gray-900 font-serif">
                        {candidateName}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Source: <span className="font-semibold text-gray-700">{item.source || "Website"}</span>
                        {item.createdAt && ` • ${new Date(item.createdAt).toLocaleDateString("en-IN")}`}
                      </p>

                      {/* Mobile with WhatsApp */}
                      <div className="mt-3 flex items-center justify-between p-2.5 bg-[#FAF8F5] rounded-xl border border-gray-200">
                        <div>
                          <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Registered Mobile</div>
                          <div className="text-xs font-mono font-bold text-gray-800">{mobile || "Not specified"}</div>
                        </div>
                        {cleanPhone && (
                          <a
                            href={`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
                              `Namaste ${candidateName}, regarding your RishteClub Profile (${item.profileId}): We received your registration. Please share your payment UTR/screenshot to activate your profile.`
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 bg-emerald-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-emerald-700 transition"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            <span>WhatsApp</span>
                          </a>
                        )}
                      </div>

                      {/* Expected Fee */}
                      <div className="mt-3 flex items-center justify-between text-xs text-gray-600 px-1">
                        <span>Standard Membership Fee:</span>
                        <span className="font-bold text-[#4A121A] text-sm">₹1,100 (incl. 18% GST)</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => handleOpenConfirmModal(item)}
                      className="w-full inline-flex items-center justify-center gap-2 bg-[#4A121A] text-white py-2.5 px-4 rounded-xl text-sm font-bold shadow hover:bg-[#350d13] active:scale-[0.98] transition"
                    >
                      <CreditCard className="h-4 w-4 text-[#C5A059]" />
                      <span>Confirm Offline Payment</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* CONFIRMED PAYMENTS TAB */
        <div className="space-y-4">
          {confirmedList.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-gray-900">No Confirmed Payments</h3>
              <p className="text-sm text-gray-500 mt-1">
                Payments verified by admin will appear here with GST invoice records.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Mobile Cards / Desktop Table */}
              <div className="grid grid-cols-1 md:hidden gap-3">
                {confirmedList.map((p) => {
                  const profile = p.user?.profile || {};
                  return (
                    <div
                      key={p.id}
                      className="bg-white rounded-2xl border border-[#EBE3D5] p-4 shadow-sm space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm font-serif">
                            {p.user?.fullName || "Candidate"}
                          </h4>
                          <div className="text-xs font-mono text-gray-500 mt-0.5">
                            {profile.profileId || "-"}
                            {profile.legacyProfileId && ` • Old: ${profile.legacyProfileId}`}
                          </div>
                        </div>
                        <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                          ₹{Number(p.grossAmount || p.amount).toFixed(2)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs bg-[#FAF8F5] p-2.5 rounded-xl">
                        <div>
                          <div className="text-gray-500">Invoice Number</div>
                          <div className="font-mono font-bold text-gray-800 break-all">
                            {p.invoiceNumber || "-"}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500">UTR / Ref</div>
                          <div className="font-mono text-gray-700 break-all">{p.transactionId || "-"}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Taxable + GST</div>
                          <div className="text-gray-800">
                            ₹{Number(p.taxableAmount || 0).toFixed(2)} + ₹{Number(p.gstAmount || 0).toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500">Date</div>
                          <div className="text-gray-700">
                            {new Date(p.createdAt).toLocaleDateString("en-IN")}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <Link
                          href={`/invoice/${p.id}`}
                          target="_blank"
                          className="flex-1 inline-flex items-center justify-center gap-1.5 bg-[#FAF5EB] text-[#7A5835] border border-[#DACBB4] py-2 px-3 rounded-xl text-xs font-bold hover:bg-[#F2E8D7] transition"
                        >
                          <FileText className="h-3.5 w-3.5 text-[#C5A059]" />
                          <span>View GST Invoice</span>
                          <ExternalLink className="h-3 w-3 text-gray-400" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop View */}
              <div className="hidden md:block overflow-x-auto bg-white rounded-2xl border border-[#EBE3D5] shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#4A121A] text-white text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3.5">Candidate / Profile</th>
                      <th className="px-4 py-3.5">Mobile</th>
                      <th className="px-4 py-3.5">Gross (₹)</th>
                      <th className="px-4 py-3.5">Taxable + GST (18%)</th>
                      <th className="px-4 py-3.5">UTR / Ref</th>
                      <th className="px-4 py-3.5">Invoice #</th>
                      <th className="px-4 py-3.5">Date</th>
                      <th className="px-4 py-3.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {confirmedList.map((p) => {
                      const profile = p.user?.profile || {};
                      return (
                        <tr key={p.id} className="hover:bg-[#FAF8F5] transition">
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-gray-900">{p.user?.fullName || "Candidate"}</div>
                            <div className="text-xs font-mono text-gray-500">
                              {profile.profileId || "-"}
                              {profile.legacyProfileId && (
                                <span className="ml-1 text-amber-800 font-bold">({profile.legacyProfileId})</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 font-mono text-xs text-gray-700">
                            {p.user?.mobile || "-"}
                          </td>
                          <td className="px-4 py-3.5 font-bold text-[#4A121A]">
                            ₹{Number(p.grossAmount || p.amount).toFixed(2)}
                          </td>
                          <td className="px-4 py-3.5 text-xs text-gray-600">
                            <div>₹{Number(p.taxableAmount || 0).toFixed(2)}</div>
                            <div className="text-[11px] text-gray-400">+ ₹{Number(p.gstAmount || 0).toFixed(2)} GST</div>
                          </td>
                          <td className="px-4 py-3.5 font-mono text-xs text-gray-600 break-all max-w-[150px]">
                            {p.transactionId || "-"}
                          </td>
                          <td className="px-4 py-3.5 font-mono text-xs text-[#7A5835] font-semibold">
                            {p.invoiceNumber || "-"}
                          </td>
                          <td className="px-4 py-3.5 text-xs text-gray-600 whitespace-nowrap">
                            {new Date(p.createdAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <Link
                              href={`/invoice/${p.id}`}
                              target="_blank"
                              className="inline-flex items-center gap-1.5 bg-[#FAF5EB] text-[#7A5835] border border-[#DACBB4] px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#F2E8D7] transition shadow-sm"
                            >
                              <FileText className="h-3.5 w-3.5 text-[#C5A059]" />
                              <span>Invoice</span>
                              <ExternalLink className="h-3 w-3 text-gray-400" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CONFIRM PAYMENT MODAL */}
      {selectedProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#EBE3D5] space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 font-serif">Confirm Offline Payment</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Generates statutory GST invoice and immediately activates the profile.
                </p>
              </div>
              <button
                onClick={() => setSelectedProfile(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Profile Info Summary */}
            <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-gray-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-500">Candidate Name:</span>
                <span className="font-bold text-gray-900 font-serif">
                  {`${selectedProfile.firstName || ""} ${selectedProfile.lastName || ""}`.trim() || selectedProfile.user?.fullName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">RishteClub Profile ID:</span>
                <span className="font-mono font-bold text-[#7A5835]">{selectedProfile.profileId}</span>
              </div>
              {selectedProfile.legacyProfileId && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Old NNVS ID:</span>
                  <span className="font-mono font-bold text-amber-800">{selectedProfile.legacyProfileId}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Mobile Number:</span>
                <span className="font-mono font-semibold text-gray-800">{selectedProfile.user?.mobile || selectedProfile.contactNumber || "-"}</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleConfirmPayment} className="space-y-4">
              {/* Gross Amount Input */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Gross Amount Received (₹ incl. 18% GST) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={grossAmount}
                    onChange={(e) => setGrossAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7A5835]"
                    placeholder="1100"
                  />
                </div>
              </div>

              {/* Reverse GST Preview Box */}
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs space-y-1 text-amber-900">
                <div className="font-bold flex items-center justify-between">
                  <span>Reverse GST Breakdown (18%):</span>
                  <span>Gross: ₹{parsedGross.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Taxable Base Value:</span>
                  <span className="font-mono font-semibold">₹{taxableCalc}</span>
                </div>
                {isInterstate ? (
                  <div className="flex justify-between text-gray-600">
                    <span>IGST (18%):</span>
                    <span className="font-mono font-semibold">₹{gstTotalCalc}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-gray-600">
                      <span>CGST (9%):</span>
                      <span className="font-mono font-semibold">₹{halfTaxCalc}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>SGST (9%):</span>
                      <span className="font-mono font-semibold">₹{halfTaxCalc}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Payment Date & Reference */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Payment Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#7A5835]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    UTR / Ref Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="e.g. 423987159200"
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#7A5835]"
                  />
                </div>
              </div>

              {/* Interstate Tax Toggle */}
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isInterstate}
                  onChange={(e) => setIsInterstate(e.target.checked)}
                  className="rounded text-[#7A5835] focus:ring-[#7A5835] h-4 w-4"
                />
                <span className="text-xs text-gray-700">
                  Interstate transaction (Apply IGST 18% instead of CGST + SGST)
                </span>
              </label>

              {/* Admin Notes */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Admin Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="e.g. Received via GPay from father's account"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#7A5835]"
                />
              </div>

              {/* Messages */}
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedProfile(null)}
                  disabled={confirming}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={confirming}
                  className="inline-flex items-center gap-2 bg-[#4A121A] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-[#350d13] shadow-md transition disabled:opacity-50"
                >
                  {confirming ? (
                    <>
                      <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Generating Invoice...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4 text-[#C5A059]" />
                      <span>Confirm & Generate GST Invoice</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}