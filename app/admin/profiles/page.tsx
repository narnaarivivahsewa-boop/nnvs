"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  CreditCard,
  FileText,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  MessageCircle,
  Filter,
} from "lucide-react";
import MatrimonyAvatar from "@/components/MatrimonyAvatar";

type Profile = {
  id: string;
  profileId: string;
  legacyProfileId: string | null;
  source: string | null;
  firstName: string | null;
  lastName: string | null;

  isVisible: boolean;
  paymentCompleted: boolean;
  approvalStatus: string;
  isDuplicateFlagged: boolean | null;
  duplicateNotes: string | null;

  createdAt: string;

  user: {
    id: string;
    fullName: string | null;
    mobile: string;
    email: string | null;
    gender: string | null;
    status: string;
    payments?: {
      id: string;
      amount: number;
      grossAmount: number | null;
      invoiceNumber: string | null;
      transactionId: string | null;
      createdAt: string;
    }[];
  };

  occupation: {
    profession: string | null;
  } | null;

  photos: {
    imageUrl: string;
  }[];
};

export default function AdminProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [gender, setGender] = useState("");
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");
  const [payment, setPayment] = useState("");
  const [visibility, setVisibility] = useState("");
  const [duplicate, setDuplicate] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Payment Confirmation Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [grossAmount, setGrossAmount] = useState("1100");
  const [isPaymentExempt, setIsPaymentExempt] = useState(false);
  const [exemptionReason, setExemptionReason] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [transactionId, setTransactionId] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [confirmingPayment, setConfirmingPayment] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        const params = new URLSearchParams();
        if (search) params.append("search", search);
        if (gender) params.append("gender", gender);
        if (status) params.append("status", status);
        if (source) params.append("source", source);
        if (payment) params.append("payment", payment);
        if (visibility) params.append("visibility", visibility);
        if (duplicate) params.append("duplicate", duplicate);

        const res = await fetch(`/api/admin/profiles?${params.toString()}`);
        const data = await res.json();

        if (res.ok && data.success) {
          setProfiles(data.profiles);
        }
      } catch (error) {
        console.error("Error loading profiles:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [search, gender, status, source, payment, visibility, duplicate, refreshTrigger]);

  const refreshList = () => setRefreshTrigger((prev) => prev + 1);

  const openPaymentModal = (profile: Profile) => {
    setSelectedProfile(profile);
    const defaultFee = profile.user.gender === "FEMALE" ? "399" : "799";
    setGrossAmount(defaultFee);
    setIsPaymentExempt(false);
    setExemptionReason("");
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setTransactionId("");
    setAdminNotes(`Payment recorded by admin for ${profile.user.fullName || profile.profileId}`);
    setPaymentModalOpen(true);
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile) return;

    if (isPaymentExempt && !exemptionReason.trim()) {
      alert("Exemption reason is mandatory for Payment-Exempt records.");
      return;
    }

    try {
      setConfirmingPayment(true);
      const res = await fetch("/api/admin/payments/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: selectedProfile.id,
          grossAmount: isPaymentExempt ? 0 : parseFloat(grossAmount),
          isPaymentExempt,
          exemptionReason: isPaymentExempt ? exemptionReason.trim() : undefined,
          paymentDate,
          transactionId: transactionId.trim() || (isPaymentExempt ? "EXEMPT" : undefined),
          adminNotes: adminNotes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.message || "Failed to confirm payment.");
        return;
      }

      alert(data.message);
      setPaymentModalOpen(false);
      setSelectedProfile(null);
      refreshList();
    } catch (err: any) {
      console.error(err);
      alert("Error confirming payment.");
    } finally {
      setConfirmingPayment(false);
    }
  };

  const toggleVisibility = async (profile: Profile) => {
    const nextState = !profile.isVisible;
    const confirmText = nextState
      ? `Make profile ${profile.profileId} LIVE on the website?`
      : `Hide profile ${profile.profileId} from the website?`;

    if (!confirm(confirmText)) return;

    try {
      const res = await fetch("/api/admin/profiles/toggle-visibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: profile.id,
          isVisible: nextState,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      alert(data.message);
      refreshList();
    } catch (error: any) {
      alert(error.message);
    }
  };

  async function approveProfile(profileId: string) {
    const ok = confirm("Approve this profile and make it live?");
    if (!ok) return;

    try {
      const res = await fetch("/api/admin/profiles/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      alert(data.message);
      refreshList();
    } catch (error: any) {
      alert(error.message);
    }
  }

  async function rejectProfile(profileId: string) {
    const ok = confirm("Reject this profile and hide it from listings?");
    if (!ok) return;

    try {
      const res = await fetch("/api/admin/profiles/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      alert(data.message);
      refreshList();
    } catch (error: any) {
      alert(error.message);
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 font-serif-luxury">
            Profiles Directory
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Total Displayed Profiles: <span className="font-bold text-gray-900">{profiles.length}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="sm:hidden inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-bold text-gray-700 border border-gray-200 shadow-xs"
          >
            <Filter className="h-3.5 w-3.5" />
            <span>Filters</span>
          </button>

          <button
            onClick={refreshList}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-gray-700 border border-gray-200 shadow-xs hover:bg-gray-50 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Bar (Responsive on desktop, collapsible on mobile) */}
      <div
        className={`rounded-2xl bg-white p-4 shadow-sm border border-gray-100 ${
          mobileFilterOpen ? "block" : "hidden sm:block"
        }`}
      >
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-7 text-xs">
          <div className="sm:col-span-2 relative">
            <Search className="absolute left-3.5 top-3 h-3.5 w-3.5 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Name / Mobile / RC ID / Old ID"
              className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2 text-xs outline-none focus:border-[#4A121A]"
            />
          </div>

          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="rounded-xl border border-gray-200 px-2.5 py-2 text-xs outline-none focus:border-[#4A121A]"
          >
            <option value="">All Genders</option>
            <option value="MALE">Male (Grooms)</option>
            <option value="FEMALE">Female (Brides)</option>
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border border-gray-200 px-2.5 py-2 text-xs outline-none focus:border-[#4A121A]"
          >
            <option value="">All Approvals</option>
            <option value="APPROVED">Approved</option>
            <option value="PENDING">Pending Approval</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="rounded-xl border border-gray-200 px-2.5 py-2 text-xs outline-none focus:border-[#4A121A]"
          >
            <option value="">All Sources</option>
            <option value="GOOGLE_FORM">Google Form Imported</option>
            <option value="WEBSITE">Website Direct</option>
          </select>

          <select
            value={payment}
            onChange={(e) => setPayment(e.target.value)}
            className="rounded-xl border border-gray-200 px-2.5 py-2 text-xs outline-none focus:border-[#4A121A]"
          >
            <option value="">All Payments</option>
            <option value="PAID">Paid / Confirmed</option>
            <option value="PENDING">Payment Pending</option>
          </select>

          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            className="rounded-xl border border-gray-200 px-2.5 py-2 text-xs outline-none focus:border-[#4A121A]"
          >
            <option value="">All Visibility</option>
            <option value="LIVE">Live (Visible)</option>
            <option value="HIDDEN">Hidden</option>
          </select>

          <select
            value={duplicate}
            onChange={(e) => setDuplicate(e.target.value)}
            className="rounded-xl border border-gray-200 px-2.5 py-2 text-xs outline-none focus:border-[#4A121A]"
          >
            <option value="">All Duplicates</option>
            <option value="FLAGGED">Duplicate Flagged</option>
          </select>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="rounded-2xl bg-white p-12 text-center text-gray-500 font-medium">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#4A121A] border-t-transparent mx-auto mb-2" />
          <p className="text-xs">Loading Profiles Directory...</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && profiles.length === 0 && (
        <div className="rounded-2xl bg-white p-12 text-center text-gray-500 border border-gray-100">
          <p className="font-bold text-gray-800">No matching profiles found.</p>
          <p className="text-xs text-gray-500 mt-1">Try resetting your search query or filters.</p>
        </div>
      )}

      {/* MOBILE CARD VIEW (Rendered on phones / screens < lg) */}
      {!loading && profiles.length > 0 && (
        <div className="lg:hidden space-y-3.5">
          {profiles.map((profile) => {
            const isFormImport = profile.source === "GOOGLE_FORM";
            const latestPayment = profile.user?.payments?.[0];
            const candidateMobile = profile.user.mobile.replace(/\D/g, "").slice(-10);
            const whatsappMsg = encodeURIComponent(
              `Namaste ${profile.user.fullName || profile.firstName}! This is regarding your matrimonial profile (${profile.profileId}) on RishteClub.`
            );

            return (
              <div
                key={profile.id}
                className="rounded-2xl bg-white p-4 shadow-xs border border-gray-200 space-y-3"
              >
                {/* Top Row: Avatar + Name + IDs */}
                <div className="flex items-start gap-3">
                  <div className="h-14 w-14 shrink-0">
                    <MatrimonyAvatar
                      imageUrl={profile.photos?.[0]?.imageUrl}
                      fullName={profile.user.fullName || profile.firstName}
                      gender={profile.user.gender}
                      size="sm"
                      badge={false}
                      className="h-14 w-14 rounded-xl"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="font-bold text-gray-900 text-sm truncate">
                        {profile.user.fullName || profile.firstName || "Member"}
                      </h3>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          profile.isVisible
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {profile.isVisible ? "Live" : "Hidden"}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[11px]">
                      <span className="font-mono text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded font-bold">
                        {profile.profileId}
                      </span>
                      {profile.legacyProfileId && (
                        <span className="font-mono font-bold text-[#7A5835] bg-[#FAF5EB] px-1.5 py-0.5 rounded border border-[#DACBB4]">
                          Old: {profile.legacyProfileId}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-500 font-mono mt-1">
                      {profile.user.mobile}
                    </p>
                  </div>
                </div>

                {/* Badges Row */}
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] pt-1 border-t border-gray-100">
                  <span
                    className={`px-2 py-0.5 rounded-md font-bold ${
                      profile.user.gender === "FEMALE"
                        ? "bg-pink-100 text-pink-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {profile.user.gender || "Gender N/A"}
                  </span>

                  <span
                    className={`px-2 py-0.5 rounded-md font-bold ${
                      isFormImport
                        ? "bg-purple-100 text-purple-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {isFormImport ? "Google Form" : "Website Direct"}
                  </span>

                  {/* Payment Status Badge */}
                  {latestPayment?.id ? (
                    latestPayment.grossAmount === 0 || latestPayment.amount === 0 ? (
                      <span className="px-2 py-0.5 rounded-md font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        ₹0.00 • Exempt
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md font-bold bg-emerald-100 text-emerald-800">
                        ₹{Number(latestPayment.grossAmount || latestPayment.amount).toFixed(0)} • Paid
                      </span>
                    )
                  ) : (
                    <span className="px-2 py-0.5 rounded-md font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      Unrecorded
                    </span>
                  )}

                  {profile.isDuplicateFlagged && (
                    <span className="px-2 py-0.5 rounded-md font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Duplicate
                    </span>
                  )}
                </div>

                {/* Touch-Friendly Action Buttons Row */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                  <Link
                    href={`/profile/${profile.profileId}`}
                    target="_blank"
                    className="flex items-center justify-center gap-1 rounded-xl bg-gray-100 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-200 transition"
                  >
                    <span>View Profile</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>

                  <a
                    href={`https://wa.me/91${candidateMobile}?text=${whatsappMsg}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1 rounded-xl bg-[#25D366] py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#1EBE5D] transition"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>WhatsApp</span>
                  </a>

                  {!latestPayment?.id ? (
                    <button
                      type="button"
                      onClick={() => openPaymentModal(profile)}
                      className="col-span-2 flex items-center justify-center gap-1 rounded-xl bg-[#4A121A] py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#350d13] transition"
                    >
                      <CreditCard className="h-3.5 w-3.5 text-[#C5A059]" />
                      <span>Record / Confirm Payment</span>
                    </button>
                  ) : (
                    <div className="col-span-2 flex items-center gap-2">
                      <Link
                        href="/admin/payments"
                        className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-gray-100 py-2 text-xs font-bold text-gray-700 border border-gray-300 hover:bg-gray-200 transition"
                      >
                        <CreditCard className="h-3.5 w-3.5 text-[#7A5835]" />
                        <span>Edit Amount</span>
                      </Link>
                      {latestPayment.invoiceNumber && (
                        <Link
                          href={`/invoice/${latestPayment.id}`}
                          target="_blank"
                          className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-[#FAF5EB] py-2 text-xs font-bold text-[#7A5835] border border-[#DACBB4] hover:bg-[#F2E8D7] transition"
                        >
                          <FileText className="h-3.5 w-3.5 text-[#C5A059]" />
                          <span>Invoice</span>
                        </Link>
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => toggleVisibility(profile)}
                    className="flex items-center justify-center gap-1 rounded-xl border border-gray-300 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
                  >
                    {profile.isVisible ? (
                      <>
                        <EyeOff className="h-3.5 w-3.5" /> <span>Hide Profile</span>
                      </>
                    ) : (
                      <>
                        <Eye className="h-3.5 w-3.5 text-emerald-600" /> <span>Make Live</span>
                      </>
                    )}
                  </button>

                  {profile.approvalStatus !== "APPROVED" ? (
                    <button
                      type="button"
                      onClick={() => approveProfile(profile.id)}
                      className="flex items-center justify-center gap-1 rounded-xl bg-blue-600 py-2 text-xs font-bold text-white hover:bg-blue-700 transition"
                    >
                      <span>Approve</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => rejectProfile(profile.id)}
                      className="flex items-center justify-center gap-1 rounded-xl bg-red-600 py-2 text-xs font-bold text-white hover:bg-red-700 transition"
                    >
                      <span>Reject</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DESKTOP TABLE VIEW (Rendered on screens >= lg) */}
      {!loading && profiles.length > 0 && (
        <div className="hidden lg:block overflow-x-auto rounded-2xl bg-white shadow border border-gray-100">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#4A121A] text-white text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Photo</th>
                <th className="px-4 py-3.5">Member Details</th>
                <th className="px-4 py-3.5">Mobile</th>
                <th className="px-4 py-3.5">Source</th>
                <th className="px-4 py-3.5">Approval</th>
                <th className="px-4 py-3.5">Payment</th>
                <th className="px-4 py-3.5">Visibility</th>
                <th className="px-4 py-3.5 text-center">Admin Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {profiles.map((profile) => {
                const isFormImport = profile.source === "GOOGLE_FORM";
                const latestPayment = profile.user?.payments?.[0];
                const candidateMobile = profile.user.mobile.replace(/\D/g, "").slice(-10);
                const whatsappMsg = encodeURIComponent(
                  `Namaste ${profile.user.fullName || profile.firstName}! This is regarding your matrimonial profile (${profile.profileId}) on RishteClub.`
                );

                return (
                  <tr key={profile.id} className="hover:bg-[#FAF8F5] transition-colors">
                    <td className="px-4 py-3.5">
                      <img
                        src={profile.photos[0]?.imageUrl || "/default-avatar.png"}
                        alt=""
                        className="h-12 w-12 rounded-full object-cover border border-gray-200"
                      />
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-bold text-gray-900">{profile.user.fullName || profile.firstName || "-"}</div>
                      <div className="font-mono text-xs text-gray-600 font-bold">{profile.profileId}</div>
                      {profile.legacyProfileId && (
                        <div className="text-[11px] font-mono font-bold text-[#7A5835]">
                          Old ID: {profile.legacyProfileId}
                        </div>
                      )}
                      {profile.isDuplicateFlagged && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 mt-0.5">
                          <AlertTriangle className="h-3 w-3" /> Duplicate Flagged
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 font-mono text-xs text-gray-700">
                      {profile.user.mobile}
                    </td>

                    <td className="px-4 py-3.5 text-xs">
                      {isFormImport ? (
                        <span className="inline-block rounded-md bg-purple-100 px-2.5 py-1 font-semibold text-purple-800">
                          Google Form
                        </span>
                      ) : (
                        <span className="inline-block rounded-md bg-blue-100 px-2.5 py-1 font-semibold text-blue-800">
                          Website
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-xs">
                      <span
                        className={`inline-block rounded-full px-2.5 py-1 font-bold ${
                          profile.approvalStatus === "APPROVED"
                            ? "bg-emerald-100 text-emerald-800"
                            : profile.approvalStatus === "REJECTED"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {profile.approvalStatus.replace("_", " ")}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-xs">
                      {latestPayment?.id ? (
                        latestPayment.grossAmount === 0 || latestPayment.amount === 0 ? (
                          <div>
                            <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900 border border-amber-300">
                              ₹0.00 • Exempt
                            </span>
                          </div>
                        ) : (
                          <div>
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                              <CheckCircle className="h-3 w-3" /> Paid
                            </span>
                            <div className="text-[11px] font-bold text-gray-700 mt-0.5">
                              ₹{Number(latestPayment.grossAmount || latestPayment.amount).toFixed(2)}
                            </div>
                          </div>
                        )
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-800 border border-amber-200">
                          Unrecorded
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-xs">
                      {profile.isVisible ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 font-bold text-emerald-800">
                          <Eye className="h-3 w-3" /> Live
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-200 px-2.5 py-1 font-bold text-gray-700">
                          <EyeOff className="h-3 w-3" /> Hidden
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <div className="flex flex-wrap items-center justify-center gap-1.5">
                        <Link
                          href={`/profile/${profile.profileId}`}
                          target="_blank"
                          className="rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-200 transition"
                          title="View Public Profile"
                        >
                          View
                        </Link>

                        <a
                          href={`https://wa.me/91${candidateMobile}?text=${whatsappMsg}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg bg-[#25D366] px-2.5 py-1.5 text-xs font-bold text-white hover:bg-[#1EBE5D] transition"
                          title="Message on WhatsApp"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          <span>WhatsApp</span>
                        </a>

                        {!latestPayment?.id ? (
                          <button
                            type="button"
                            onClick={() => openPaymentModal(profile)}
                            className="inline-flex items-center gap-1 rounded-lg bg-[#4A121A] px-2.5 py-1.5 text-xs font-bold text-white hover:bg-[#350d13] transition shadow-xs"
                            title="Record Payment / Exemption"
                          >
                            <CreditCard className="h-3.5 w-3.5 text-[#C5A059]" />
                            <span>Record Pay</span>
                          </button>
                        ) : (
                          <Link
                            href="/admin/payments"
                            className="inline-flex items-center gap-1 rounded-lg bg-white border border-gray-300 px-2.5 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50 transition shadow-xs"
                            title="Edit Payment Amount"
                          >
                            <span>Edit Amount</span>
                          </Link>
                        )}

                        {latestPayment?.invoiceNumber && (
                          <Link
                            href={`/invoice/${latestPayment.id}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 rounded-lg bg-[#FAF5EB] px-2.5 py-1.5 text-xs font-bold text-[#7A5835] border border-[#DACBB4] hover:bg-[#F2E8D7] transition"
                            title="Download GST Tax Invoice"
                          >
                            <FileText className="h-3.5 w-3.5 text-[#C5A059]" />
                            <span>Invoice</span>
                            <ExternalLink className="h-2.5 w-2.5" />
                          </Link>
                        )}

                        <button
                          type="button"
                          onClick={() => toggleVisibility(profile)}
                          className="rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-200 transition"
                          title="Toggle Live / Hidden"
                        >
                          {profile.isVisible ? "Hide" : "Make Live"}
                        </button>

                        {profile.approvalStatus !== "APPROVED" && (
                          <button
                            type="button"
                            onClick={() => approveProfile(profile.id)}
                            className="rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition"
                          >
                            Approve
                          </button>
                        )}

                        {profile.approvalStatus !== "REJECTED" && (
                          <button
                            type="button"
                            onClick={() => rejectProfile(profile.id)}
                            className="rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-red-700 transition"
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Manual Payment Confirmation Modal */}
      {paymentModalOpen && selectedProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-black text-[#4A121A] font-serif-luxury">
              Record Profile Payment
            </h2>
            <p className="mt-1 text-xs text-gray-600">
              Candidate: <strong>{selectedProfile.user.fullName || selectedProfile.profileId}</strong> (Mobile: {selectedProfile.user.mobile})
            </p>

            <form onSubmit={handleConfirmPayment} className="space-y-4 text-xs">
              {/* Payment-Exempt Toggle */}
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
                        const defaultFee = selectedProfile.user.gender === "FEMALE" ? "399" : "799";
                        setGrossAmount(defaultFee);
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
                      For legacy profiles, complimentary approvals, or accounts without monetary transactions.
                    </span>
                  </div>
                </label>
              </div>

              {isPaymentExempt ? (
                <div className="space-y-3">
                  <div className="p-3 bg-amber-50 border border-amber-300 text-amber-900 text-xs rounded-xl space-y-1">
                    <p className="text-[11px] leading-relaxed text-amber-900 font-semibold">
                      ₹0 means no payment was received. This profile will be marked as Payment-Exempt. No GST invoice will be generated.
                    </p>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
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
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Gross Amount Received (₹ INCLUDING 18% GST) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={grossAmount}
                    onChange={(e) => setGrossAmount(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 p-3 font-mono font-bold text-gray-900 outline-none focus:border-[#4A121A]"
                    placeholder="e.g. 799.00"
                  />
                  <p className="mt-1 text-[11px] text-gray-500">
                    Taxable base value and 18% GST will be reverse calculated from this gross amount.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Payment Date *</label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 p-2.5 outline-none focus:border-[#4A121A]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    {isPaymentExempt ? "Reference Note (Optional)" : "UPI / UTR Ref ID *"}
                  </label>
                  <input
                    type="text"
                    required={!isPaymentExempt}
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder={isPaymentExempt ? "EXEMPT" : "e.g. 423871928371"}
                    className="w-full rounded-xl border border-gray-300 p-2.5 font-mono outline-none focus:border-[#4A121A]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Admin Remarks / Notes</label>
                <textarea
                  rows={2}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 p-2.5 outline-none focus:border-[#4A121A]"
                  placeholder={isPaymentExempt ? "Exemption remarks..." : "Payment verified via WhatsApp screenshot / UPI statement..."}
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="rounded-xl border border-gray-300 px-4 py-2.5 font-bold text-gray-700 hover:bg-gray-50 transition"
                  disabled={confirmingPayment}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={confirmingPayment}
                  className="rounded-xl bg-[#4A121A] px-6 py-2.5 font-bold text-white shadow hover:bg-[#380C13] transition disabled:opacity-50"
                >
                  {confirmingPayment
                    ? "Saving..."
                    : isPaymentExempt
                    ? "Confirm Payment Exemption"
                    : "Confirm & Generate GST Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}