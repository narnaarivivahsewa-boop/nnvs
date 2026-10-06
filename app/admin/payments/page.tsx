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
  Pencil,
  RotateCcw,
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
  const [isPaymentExempt, setIsPaymentExempt] = useState(false);
  const [exemptionReason, setExemptionReason] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [isInterstate, setIsInterstate] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Modal state for editing existing confirmed payment
  const [selectedPaymentForEdit, setSelectedPaymentForEdit] = useState<any | null>(null);
  const [editGrossAmount, setEditGrossAmount] = useState("");
  const [editIsPaymentExempt, setEditIsPaymentExempt] = useState(false);
  const [editReason, setEditReason] = useState("");
  const [editTransactionId, setEditTransactionId] = useState("");
  const [editPaymentDate, setEditPaymentDate] = useState("");
  const [editAdminNotes, setEditAdminNotes] = useState("");
  const [editIsInterstate, setEditIsInterstate] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editSuccessMessage, setEditSuccessMessage] = useState("");
  const [editErrorMessage, setEditErrorMessage] = useState("");

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
    setIsPaymentExempt(false);
    setExemptionReason("");
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setTransactionId(`UPI_MANUAL_${profile.profileId || profile.id}`);
    setAdminNotes("");
    setIsInterstate(false);
    setSuccessMessage("");
    setErrorMessage("");
  };

  const handleOpenEditModal = (payment: any) => {
    setSelectedPaymentForEdit(payment);
    const isExempt = payment.paymentGateway === "PAYMENT_EXEMPT" || Number(payment.grossAmount || payment.amount || 0) === 0;
    setEditIsPaymentExempt(isExempt);
    const currGross = isExempt ? "0" : String(payment.grossAmount || payment.amount || 1100);
    setEditGrossAmount(currGross);
    setEditReason("");
    setEditTransactionId(payment.transactionId || "");
    const dateStr = payment.paymentDate ? new Date(payment.paymentDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
    setEditPaymentDate(dateStr);
    setEditAdminNotes(payment.adminNotes || "");
    setEditIsInterstate(Boolean(payment.igstAmount && Number(payment.igstAmount) > 0));
    setEditSuccessMessage("");
    setEditErrorMessage("");
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile) return;

    if (isPaymentExempt && (!exemptionReason.trim() || exemptionReason.trim().length < 3)) {
      setErrorMessage("Please provide a reason for marking this profile as Payment-Exempt.");
      return;
    }

    if (!isPaymentExempt && (Number(grossAmount) <= 0 || isNaN(Number(grossAmount)))) {
      setErrorMessage("Gross amount must be greater than ₹0 for a paid confirmation.");
      return;
    }

    try {
      setConfirming(true);
      setErrorMessage("");
      setSuccessMessage("");

      const res = await fetch("/api/admin/payments/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: selectedProfile.id,
          grossAmount: isPaymentExempt ? 0 : Number(grossAmount),
          isPaymentExempt,
          exemptionReason: exemptionReason.trim(),
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

  const handleSavePaymentEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaymentForEdit) return;

    if (!editReason.trim() || editReason.trim().length < 3) {
      setEditErrorMessage("Please provide a reason for editing this payment (mandatory for statutory audit log).");
      return;
    }

    if (!editIsPaymentExempt && (Number(editGrossAmount) <= 0 || isNaN(Number(editGrossAmount)))) {
      setEditErrorMessage("Gross amount must be greater than ₹0 for a paid transaction.");
      return;
    }

    try {
      setSavingEdit(true);
      setEditErrorMessage("");
      setEditSuccessMessage("");

      const res = await fetch("/api/admin/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: selectedPaymentForEdit.id,
          grossAmount: editIsPaymentExempt ? 0 : Number(editGrossAmount),
          isPaymentExempt: editIsPaymentExempt,
          reason: editReason.trim(),
          transactionId: editTransactionId.trim(),
          paymentDate: editPaymentDate,
          adminNotes: editAdminNotes.trim(),
          isInterstate: editIsInterstate,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setEditSuccessMessage(data.message);
        setTimeout(() => {
          setSelectedPaymentForEdit(null);
          loadPayments(search);
        }, 1500);
      } else {
        setEditErrorMessage(data.message || "Failed to update payment.");
      }
    } catch (err: any) {
      setEditErrorMessage(err.message || "An unexpected error occurred while updating payment.");
    } finally {
      setSavingEdit(false);
    }
  };

  // Reverse GST calculation preview for Confirm Modal
  const parsedGross = isPaymentExempt ? 0 : Number(grossAmount) || 0;
  const taxableCalc = isPaymentExempt ? "0.00" : (parsedGross / 1.18).toFixed(2);
  const gstTotalCalc = isPaymentExempt ? "0.00" : (parsedGross - Number(taxableCalc)).toFixed(2);
  const halfTaxCalc = isPaymentExempt ? "0.00" : (Number(gstTotalCalc) / 2).toFixed(2);

  // Reverse GST calculation preview for Edit Modal
  const parsedEditGross = editIsPaymentExempt ? 0 : Number(editGrossAmount) || 0;
  const editTaxableCalc = editIsPaymentExempt ? "0.00" : (parsedEditGross / 1.18).toFixed(2);
  const editGstTotalCalc = editIsPaymentExempt ? "0.00" : (parsedEditGross - Number(editTaxableCalc)).toFixed(2);
  const editHalfTaxCalc = editIsPaymentExempt ? "0.00" : (Number(editGstTotalCalc) / 2).toFixed(2);

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
                        {p.paymentGateway === "PAYMENT_EXEMPT" || Number(p.grossAmount || p.amount || 0) === 0 ? (
                          <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
                            ₹0.00 • EXEMPT
                          </span>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                            ₹{Number(p.grossAmount || p.amount).toFixed(2)} • PAID
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs bg-[#FAF8F5] p-2.5 rounded-xl">
                        <div>
                          <div className="text-gray-500">Invoice Number</div>
                          <div className="font-mono font-bold text-gray-800 break-all">
                            {p.invoiceNumber || <span className="text-gray-400 italic">None (Exempt)</span>}
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
                        <button
                          onClick={() => handleOpenEditModal(p)}
                          className="inline-flex items-center justify-center gap-1.5 bg-white text-gray-700 border border-gray-300 py-2 px-3 rounded-xl text-xs font-bold hover:bg-gray-50 transition shadow-sm"
                        >
                          <Pencil className="h-3.5 w-3.5 text-[#7A5835]" />
                          <span>Edit Amount</span>
                        </button>
                        {p.invoiceNumber ? (
                          <Link
                            href={`/invoice/${p.id}`}
                            target="_blank"
                            className="flex-1 inline-flex items-center justify-center gap-1.5 bg-[#FAF5EB] text-[#7A5835] border border-[#DACBB4] py-2 px-3 rounded-xl text-xs font-bold hover:bg-[#F2E8D7] transition"
                          >
                            <FileText className="h-3.5 w-3.5 text-[#C5A059]" />
                            <span>View GST Invoice</span>
                            <ExternalLink className="h-3 w-3 text-gray-400" />
                          </Link>
                        ) : (
                          <div className="flex-1 text-center text-xs text-gray-400 italic py-2 bg-gray-50 border border-gray-200 rounded-xl">
                            No Invoice (Exempt)
                          </div>
                        )}
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
                      const isExempt = p.paymentGateway === "PAYMENT_EXEMPT" || Number(p.grossAmount || p.amount || 0) === 0;
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
                          <td className="px-4 py-3.5">
                            {isExempt ? (
                              <div>
                                <div className="font-bold text-amber-900">₹0.00</div>
                                <span className="inline-block bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold px-1.5 py-0.5 rounded">
                                  PAYMENT EXEMPT
                                </span>
                              </div>
                            ) : (
                              <div>
                                <div className="font-bold text-[#4A121A]">₹{Number(p.grossAmount || p.amount).toFixed(2)}</div>
                                <span className="inline-block bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                                  PAID
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-xs text-gray-600">
                            <div>₹{Number(p.taxableAmount || 0).toFixed(2)}</div>
                            <div className="text-[11px] text-gray-400">+ ₹{Number(p.gstAmount || 0).toFixed(2)} GST</div>
                          </td>
                          <td className="px-4 py-3.5 font-mono text-xs text-gray-600 break-all max-w-[150px]">
                            {p.transactionId || "-"}
                          </td>
                          <td className="px-4 py-3.5 font-mono text-xs text-[#7A5835] font-semibold">
                            {p.invoiceNumber || <span className="text-gray-400 italic">None (Exempt)</span>}
                          </td>
                          <td className="px-4 py-3.5 text-xs text-gray-600 whitespace-nowrap">
                            {new Date(p.createdAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleOpenEditModal(p)}
                                className="inline-flex items-center gap-1 bg-white text-gray-700 border border-gray-300 px-2.5 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-50 transition shadow-sm"
                                title="Edit recorded payment amount"
                              >
                                <Pencil className="h-3.5 w-3.5 text-[#7A5835]" />
                                <span>Edit Amount</span>
                              </button>
                              {p.invoiceNumber ? (
                                <Link
                                  href={`/invoice/${p.id}`}
                                  target="_blank"
                                  className="inline-flex items-center gap-1.5 bg-[#FAF5EB] text-[#7A5835] border border-[#DACBB4] px-2.5 py-1.5 rounded-lg text-xs font-bold hover:bg-[#F2E8D7] transition shadow-sm"
                                >
                                  <FileText className="h-3.5 w-3.5 text-[#C5A059]" />
                                  <span>Invoice</span>
                                  <ExternalLink className="h-3 w-3 text-gray-400" />
                                </Link>
                              ) : null}
                            </div>
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
              {/* Payment-Exempt Checkbox */}
              <div className="p-3 bg-[#FAF5EB] border border-[#DACBB4] rounded-xl">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPaymentExempt}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setIsPaymentExempt(checked);
                      if (checked) {
                        setGrossAmount("0");
                        if (!transactionId) setTransactionId("EXEMPT");
                      } else {
                        setGrossAmount("1100");
                        if (transactionId === "EXEMPT") setTransactionId("");
                      }
                    }}
                    className="mt-0.5 rounded text-[#7A5835] focus:ring-[#7A5835] h-4 w-4"
                  />
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">
                      Mark as "No Payment / Payment Exempt (₹0)"
                    </span>
                    <span className="text-[11px] text-gray-600 block mt-0.5">
                      For legacy profiles, complimentary approvals, or imported accounts without monetary transactions.
                    </span>
                  </div>
                </label>
              </div>

              {isPaymentExempt ? (
                /* Payment-Exempt Information & Reason */
                <div className="space-y-3">
                  <div className="p-3 bg-amber-50 border border-amber-300 text-amber-900 text-xs rounded-xl space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-amber-950">
                      <AlertCircle className="h-4 w-4 text-amber-700" />
                      <span>Payment Exemption Notice</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-amber-900">
                      ₹0 means no payment was received. This profile will be marked as <strong>Payment-Exempt</strong>. No GST invoice will be generated.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Exemption Reason (Required) *
                    </label>
                    <select
                      value={exemptionReason}
                      onChange={(e) => setExemptionReason(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#7A5835] mb-2"
                    >
                      <option value="">Select standard exemption reason...</option>
                      <option value="Old legacy NNVS record without payment">Old legacy NNVS record without payment</option>
                      <option value="Complimentary approval">Complimentary approval</option>
                      <option value="Imported legacy profile">Imported legacy profile</option>
                      <option value="Other admin-approved reason">Other admin-approved reason</option>
                    </select>

                    <input
                      type="text"
                      value={exemptionReason}
                      onChange={(e) => setExemptionReason(e.target.value)}
                      placeholder="Or type custom exemption reason..."
                      required
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#7A5835]"
                    />
                  </div>
                </div>
              ) : (
                /* Normal Paid Payment Form Elements */
                <>
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
                </>
              )}

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
                    {isPaymentExempt ? "Reference Note (Optional)" : "UTR / Ref Number *"}
                  </label>
                  <input
                    type="text"
                    required={!isPaymentExempt}
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder={isPaymentExempt ? "e.g. EXEMPT / LEGACY" : "e.g. 423987159200"}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#7A5835]"
                  />
                </div>
              </div>

              {!isPaymentExempt && (
                /* Interstate Tax Toggle */
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
              )}

              {/* Admin Notes */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Admin Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder={isPaymentExempt ? "Additional notes on this exemption" : "e.g. Received via GPay from father's account"}
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
                      <span>{isPaymentExempt ? "Confirming Exemption..." : "Generating Invoice..."}</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4 text-[#C5A059]" />
                      <span>{isPaymentExempt ? "Confirm Payment Exemption" : "Confirm & Generate GST Invoice"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PAYMENT MODAL */}
      {selectedPaymentForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#EBE3D5] space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-gray-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-gray-900 font-serif">Edit Payment Amount</h3>
                  <span className="bg-amber-100 text-amber-900 text-xs font-bold px-2 py-0.5 rounded-full">
                    Admin Only
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Update the recorded gross amount received or mark profile as Payment-Exempt.
                </p>
              </div>
              <button
                onClick={() => setSelectedPaymentForEdit(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Payment & Candidate Summary */}
            <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-gray-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-500">Candidate:</span>
                <span className="font-bold text-gray-900 font-serif">
                  {selectedPaymentForEdit.user?.fullName || "Candidate"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Profile ID:</span>
                <span className="font-mono font-bold text-[#7A5835]">
                  {selectedPaymentForEdit.user?.profile?.profileId || selectedPaymentForEdit.profileId || "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Invoice Number:</span>
                <span className="font-mono font-bold text-gray-800">
                  {selectedPaymentForEdit.invoiceNumber || <span className="text-gray-400 italic">None (Exempt)</span>}
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-1.5 mt-1.5">
                <span className="text-gray-600 font-semibold">Currently Recorded Gross:</span>
                <span className="font-mono font-bold text-[#4A121A]">
                  ₹{Number(selectedPaymentForEdit.grossAmount || selectedPaymentForEdit.amount || 0).toFixed(2)}
                  {selectedPaymentForEdit.paymentGateway === "PAYMENT_EXEMPT" && " (EXEMPT)"}
                </span>
              </div>
            </div>

            {/* Edit Form */}
            <form onSubmit={handleSavePaymentEdit} className="space-y-4">
              {/* Payment-Exempt Toggle */}
              <div className="p-3 bg-[#FAF5EB] border border-[#DACBB4] rounded-xl">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editIsPaymentExempt}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setEditIsPaymentExempt(checked);
                      if (checked) {
                        setEditGrossAmount("0");
                      } else {
                        setEditGrossAmount(String(selectedPaymentForEdit?.grossAmount || selectedPaymentForEdit?.amount || 799));
                      }
                    }}
                    className="mt-0.5 rounded text-[#7A5835] focus:ring-[#7A5835] h-4 w-4"
                  />
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">
                      Mark as "No Payment / Payment Exempt (₹0)"
                    </span>
                    <span className="text-[11px] text-gray-600 block mt-0.5">
                      Converts this record to Payment-Exempt (₹0 received).
                    </span>
                  </div>
                </label>
              </div>

              {/* Invoice Preservation Alert if invoice exists and user checks exempt */}
              {editIsPaymentExempt && selectedPaymentForEdit.invoiceNumber && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs space-y-1 text-blue-900">
                  <div className="font-bold flex items-center gap-1.5 text-blue-950">
                    <AlertCircle className="h-4 w-4 text-blue-700" />
                    <span>Statutory Invoice Preservation</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-blue-800">
                    An existing GST invoice (<span className="font-mono font-bold">{selectedPaymentForEdit.invoiceNumber}</span>) is recorded. In accordance with statutory rules, historical invoice references are permanently preserved and will not be erased. Complete audit trail will be logged.
                  </p>
                </div>
              )}

              {editIsPaymentExempt ? (
                /* Payment-Exempt Summary */
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1 text-amber-900">
                  <div className="font-bold flex items-center justify-between">
                    <span>Payment-Exempt Breakdown:</span>
                    <span>Gross: ₹0.00</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Taxable Amount:</span>
                    <span className="font-mono">₹0.00</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>GST (18%):</span>
                    <span className="font-mono">₹0.00</span>
                  </div>
                </div>
              ) : (
                /* Normal Paid Amount Edit */
                <>
                  {/* New Gross Amount Input */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      New Amount Received (Including GST) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        min="1"
                        required
                        value={editGrossAmount}
                        onChange={(e) => setEditGrossAmount(e.target.value)}
                        className="w-full pl-8 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7A5835]"
                        placeholder="799"
                      />
                    </div>
                  </div>

                  {/* Live Reverse GST Preview Box */}
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs space-y-1 text-amber-900">
                    <div className="font-bold flex items-center justify-between">
                      <span>Recalculated Reverse GST (18%):</span>
                      <span>Gross: ₹{parsedEditGross.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Taxable Base Value:</span>
                      <span className="font-mono font-semibold">₹{editTaxableCalc}</span>
                    </div>
                    {editIsInterstate ? (
                      <div className="flex justify-between text-gray-600">
                        <span>IGST (18%):</span>
                        <span className="font-mono font-semibold">₹{editGstTotalCalc}</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between text-gray-600">
                          <span>CGST (9%):</span>
                          <span className="font-mono font-semibold">₹{editHalfTaxCalc}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                          <span>SGST (9%):</span>
                          <span className="font-mono font-semibold">₹{editHalfTaxCalc}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between border-t border-amber-200 pt-1 text-amber-950 font-bold">
                      <span>Total GST Tax:</span>
                      <span className="font-mono">₹{editGstTotalCalc}</span>
                    </div>
                  </div>
                </>
              )}

              {/* Mandatory Reason Input */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Reason for Change (Audit Trail Required) *
                </label>
                {editIsPaymentExempt && (
                  <select
                    onChange={(e) => setEditReason(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#7A5835] mb-2"
                  >
                    <option value="">Select standard exemption reason or type below...</option>
                    <option value="Old legacy NNVS record without payment">Old legacy NNVS record without payment</option>
                    <option value="Complimentary approval">Complimentary approval</option>
                    <option value="Imported legacy profile">Imported legacy profile</option>
                    <option value="Other admin-approved reason">Other admin-approved reason</option>
                  </select>
                )}
                <textarea
                  rows={2}
                  required
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder={editIsPaymentExempt ? "e.g. Converted to legacy exemption - profile imported from old NNVS records" : "e.g. Corrected to Male member fee of ₹799 as per customer payment screenshot"}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#7A5835]"
                />
              </div>

              {/* Payment Date & Reference (Optional edits) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    value={editPaymentDate}
                    onChange={(e) => setEditPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#7A5835]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    UTR / Ref Number
                  </label>
                  <input
                    type="text"
                    value={editTransactionId}
                    onChange={(e) => setEditTransactionId(e.target.value)}
                    placeholder={editIsPaymentExempt ? "EXEMPT" : "e.g. 423987159200"}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#7A5835]"
                  />
                </div>
              </div>

              {!editIsPaymentExempt && (
                /* Interstate Tax Toggle */
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={editIsInterstate}
                    onChange={(e) => setEditIsInterstate(e.target.checked)}
                    className="rounded text-[#7A5835] focus:ring-[#7A5835] h-4 w-4"
                  />
                  <span className="text-xs text-gray-700">
                    Interstate transaction (Apply IGST 18%)
                  </span>
                </label>
              )}

              {/* Admin Notes */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Admin Remarks / Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={editAdminNotes}
                  onChange={(e) => setEditAdminNotes(e.target.value)}
                  placeholder="Additional remarks"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#7A5835]"
                />
              </div>

              {/* Messages */}
              {editErrorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{editErrorMessage}</span>
                </div>
              )}

              {editSuccessMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                  <span>{editSuccessMessage}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedPaymentForEdit(null)}
                  disabled={savingEdit}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="inline-flex items-center gap-2 bg-[#4A121A] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-[#350d13] shadow-md transition disabled:opacity-50"
                >
                  {savingEdit ? (
                    <>
                      <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4 text-[#C5A059]" />
                      <span>{editIsPaymentExempt ? "Save Payment Exemption" : "Save & Recalculate GST"}</span>
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