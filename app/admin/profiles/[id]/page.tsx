"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  CreditCard,
  FileText,
  ExternalLink,
  MessageSquare,
  AlertTriangle,
  GraduationCap,
  Users,
  Heart,
  FileSpreadsheet,
  ShieldCheck,
  X,
} from "lucide-react";
import MatrimonyAvatar from "@/components/MatrimonyAvatar";

export default function AdminProfileViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any | null>(null);
  const [activePhoto, setActivePhoto] = useState<string>("");
  const [actionLoading, setActionLoading] = useState(false);

  // Payment Confirmation Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [grossAmount, setGrossAmount] = useState("1100");
  const [paymentDate, setPaymentDate] = useState("2026-10-03");
  const [transactionId, setTransactionId] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [isInterstate, setIsInterstate] = useState(false);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [modalSuccess, setModalSuccess] = useState("");
  const [modalError, setModalError] = useState("");

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/profiles/${id}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to load profile.");
      }

      setProfile(data.profile);
      if (data.profile?.photos?.length > 0) {
        setActivePhoto(data.profile.photos[0].imageUrl);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const res = await fetch(`/api/admin/profiles/${id}`);
        const data = await res.json();
        if (!ignore && data.success && data.profile) {
          setProfile(data.profile);
          if (data.profile.photos?.length > 0) {
            setActivePhoto(data.profile.photos[0].imageUrl);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, [id]);

  // Actions
  const handleToggleVisibility = async () => {
    if (!profile) return;
    try {
      setActionLoading(true);
      const res = await fetch("/api/admin/profiles/toggle-visibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: profile.id,
          isVisible: !profile.isVisible,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setProfile((prev: any) => ({ ...prev, isVisible: !prev.isVisible }));
      } else {
        alert(data.message || "Failed to update visibility");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating visibility");
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!profile || !confirm("Are you sure you want to approve this profile?")) return;
    try {
      setActionLoading(true);
      const res = await fetch("/api/admin/profiles/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId: profile.id }),
      });
      const data = await res.json();
      if (data.success) {
        setProfile((prev: any) => ({
          ...prev,
          approvalStatus: "APPROVED",
          isVisible: true,
          approvedAt: new Date().toISOString(),
        }));
      } else {
        alert(data.message || "Failed to approve profile");
      }
    } catch (err) {
      console.error(err);
      alert("Error approving profile");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!profile || !confirm("Are you sure you want to reject this profile?")) return;
    try {
      setActionLoading(true);
      const res = await fetch("/api/admin/profiles/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId: profile.id }),
      });
      const data = await res.json();
      if (data.success) {
        setProfile((prev: any) => ({
          ...prev,
          approvalStatus: "REJECTED",
          isVisible: false,
        }));
      } else {
        alert(data.message || "Failed to reject profile");
      }
    } catch (err) {
      console.error(err);
      alert("Error rejecting profile");
    } finally {
      setActionLoading(false);
    }
  };

  const openPaymentModal = () => {
    if (!profile) return;
    const defaultFee = profile.user?.gender === "FEMALE" ? "399" : "799";
    setGrossAmount(defaultFee);
    setPaymentDate("2026-10-03");
    setTransactionId(`UPI_MANUAL_${profile.profileId || profile.id}`);
    setAdminNotes("");
    setIsInterstate(false);
    setModalSuccess("");
    setModalError("");
    setPaymentModalOpen(true);
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    try {
      setConfirmingPayment(true);
      setModalError("");
      setModalSuccess("");

      const res = await fetch("/api/admin/payments/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: profile.id,
          grossAmount: Number(grossAmount),
          paymentDate,
          transactionId: transactionId.trim(),
          adminNotes: adminNotes.trim(),
          isInterstate,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setModalSuccess(data.message);
        setTimeout(() => {
          setPaymentModalOpen(false);
          loadProfile();
        }, 1500);
      } else {
        setModalError(data.message || "Failed to confirm payment.");
      }
    } catch (err: any) {
      setModalError(err.message || "Error confirming payment.");
    } finally {
      setConfirmingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#4A121A] border-t-transparent" />
        <p className="text-sm font-semibold text-gray-600">Loading Candidate Profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 font-serif">Profile Not Found</h2>
        <p className="text-sm text-gray-600">
          The requested profile record could not be found or has been removed.
        </p>
        <Link
          href="/admin/profiles"
          className="inline-flex items-center gap-2 rounded-xl bg-[#4A121A] px-5 py-2.5 text-sm font-bold text-white shadow hover:bg-[#350d13]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Profiles Directory</span>
        </Link>
      </div>
    );
  }

  const candidateName =
    `${profile.firstName || ""} ${profile.lastName || ""}`.trim() ||
    profile.user?.fullName ||
    "Candidate";
  const mobile = profile.user?.mobile || profile.contactNumber || "";
  const cleanPhone = mobile.replace(/[^0-9]/g, "").slice(-10);

  // Reverse GST Preview calculations
  const parsedGross = Number(grossAmount) || 0;
  const taxableCalc = (parsedGross / 1.18).toFixed(2);
  const gstTotalCalc = (parsedGross - Number(taxableCalc)).toFixed(2);
  const halfTaxCalc = (Number(gstTotalCalc) / 2).toFixed(2);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/profiles"
            className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm transition active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-bold text-[#7A5835] bg-[#FAF5EB] px-2.5 py-0.5 rounded-lg border border-[#DACBB4]">
                {profile.profileId}
              </span>
              {profile.legacyProfileId && (
                <span className="font-mono text-xs font-bold text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-300">
                  Old NNVS ID: {profile.legacyProfileId}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 font-serif mt-1">
              {candidateName}
            </h1>
          </div>
        </div>

        {/* Quick Action Badges */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full ${
              profile.isVisible
                ? "bg-emerald-100 text-emerald-800"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {profile.isVisible ? "● Live on Website" : "○ Hidden"}
          </span>

          <span
            className={`text-xs font-bold px-3 py-1 rounded-full ${
              profile.paymentCompleted
                ? "bg-emerald-100 text-emerald-800"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {profile.paymentCompleted ? "Paid (GST Invoice Issued)" : "Payment Pending"}
          </span>

          <span
            className={`text-xs font-bold px-3 py-1 rounded-full ${
              profile.approvalStatus === "APPROVED"
                ? "bg-emerald-100 text-emerald-800"
                : profile.approvalStatus === "REJECTED"
                ? "bg-red-100 text-red-800"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {profile.approvalStatus}
          </span>
        </div>
      </div>

      {/* Duplicate Alert Banner if flagged */}
      {profile.isDuplicateFlagged && (
        <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl flex items-start justify-between gap-3 text-xs text-amber-900 shadow-sm">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-sm font-bold">Duplicate Flagged for Admin Review</strong>
              <p className="mt-0.5 font-medium">{profile.duplicateNotes || "Similarity detected with existing profile."}</p>
            </div>
          </div>
          <Link
            href="/admin/duplicates"
            className="bg-[#4A121A] text-white px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap hover:bg-[#350d13]"
          >
            Manage Duplicates
          </Link>
        </div>
      )}

      {/* ADMIN ACTIONS TOOLBAR (Mobile-First Touch Grid) */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#EBE3D5] shadow-sm">
        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
          Admin Operations & Communication
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {/* 1. Public Profile Link */}
          <Link
            href={`/profile/${profile.profileId}`}
            target="_blank"
            className="flex items-center justify-center gap-2 bg-[#FAF8F5] border border-gray-200 py-2.5 px-3 rounded-xl text-xs font-bold text-gray-800 hover:bg-[#F2ECE1] transition"
          >
            <Eye className="h-4 w-4 text-[#7A5835]" />
            <span>Public View</span>
            <ExternalLink className="h-3 w-3 text-gray-400" />
          </Link>

          {/* 2. Direct WhatsApp */}
          {cleanPhone ? (
            <a
              href={`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
                `Namaste ${candidateName}, regarding your RishteClub profile (${profile.profileId}): How can we assist you today?`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 bg-emerald-600 text-white py-2.5 px-3 rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-sm transition"
            >
              <MessageSquare className="h-4 w-4" />
              <span>WhatsApp</span>
            </a>
          ) : (
            <div className="flex items-center justify-center gap-2 bg-gray-100 text-gray-400 py-2.5 px-3 rounded-xl text-xs font-bold">
              <span>No Mobile</span>
            </div>
          )}

          {/* 3. Toggle Visibility (Live / Hide) */}
          <button
            onClick={handleToggleVisibility}
            disabled={actionLoading}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition shadow-sm ${
              profile.isVisible
                ? "bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200"
                : "bg-emerald-700 text-white hover:bg-emerald-800"
            }`}
          >
            {profile.isVisible ? (
              <>
                <EyeOff className="h-4 w-4" />
                <span>Make Hidden</span>
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                <span>Make Live</span>
              </>
            )}
          </button>

          {/* 4. Approve / Reject */}
          {profile.approvalStatus !== "APPROVED" ? (
            <button
              onClick={handleApprove}
              disabled={actionLoading}
              className="flex items-center justify-center gap-2 bg-emerald-600 text-white py-2.5 px-3 rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-sm transition"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Approve Profile</span>
            </button>
          ) : (
            <button
              onClick={handleReject}
              disabled={actionLoading}
              className="flex items-center justify-center gap-2 bg-red-50 text-red-700 border border-red-200 py-2.5 px-3 rounded-xl text-xs font-bold hover:bg-red-100 transition"
            >
              <XCircle className="h-4 w-4" />
              <span>Reject Profile</span>
            </button>
          )}

          {/* 5. Confirm Payment Button */}
          <button
            onClick={openPaymentModal}
            className="flex items-center justify-center gap-2 bg-[#4A121A] text-white py-2.5 px-3 rounded-xl text-xs font-bold hover:bg-[#350d13] shadow-sm transition"
          >
            <CreditCard className="h-4 w-4 text-[#C5A059]" />
            <span>Confirm Pay</span>
          </button>

          {/* 6. Invoice Link */}
          {profile.paymentCompleted ? (
            <Link
              href={`/invoice/${profile.user?.payments?.[0]?.id || profile.profileId}`}
              target="_blank"
              className="flex items-center justify-center gap-2 bg-[#FAF5EB] text-[#7A5835] border border-[#DACBB4] py-2.5 px-3 rounded-xl text-xs font-bold hover:bg-[#F2E8D7] transition shadow-sm"
            >
              <FileText className="h-4 w-4 text-[#C5A059]" />
              <span>GST Invoice</span>
              <ExternalLink className="h-3 w-3 text-gray-400" />
            </Link>
          ) : (
            <div className="flex items-center justify-center gap-2 bg-gray-100 text-gray-400 py-2.5 px-3 rounded-xl text-xs font-bold">
              <FileText className="h-4 w-4" />
              <span>No Invoice</span>
            </div>
          )}
        </div>
      </div>

      {/* MAIN PROFILE DETAILS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Photos & Summary Card */}
        <div className="lg:col-span-4 space-y-6">
          {/* Photo Gallery Card */}
          <div className="bg-white rounded-2xl border border-[#EBE3D5] p-4 shadow-sm space-y-3">
            <div className="relative h-[340px] w-full rounded-xl overflow-hidden flex items-center justify-center">
              <MatrimonyAvatar
                imageUrl={activePhoto}
                fullName={candidateName}
                gender={profile.user?.gender}
                size="hero"
                badge={true}
                className="h-full w-full rounded-xl"
              />
            </div>

            {/* Photo Thumbnails */}
            {profile.photos && profile.photos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {profile.photos.map((photo: any) => (
                  <button
                    key={photo.id}
                    onClick={() => setActivePhoto(photo.imageUrl)}
                    className={`relative h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition ${
                      activePhoto === photo.imageUrl
                        ? "border-[#4A121A] scale-105"
                        : "border-gray-200 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={photo.imageUrl} alt="Thumbnail" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Contact & Registration Meta Card */}
          <div className="bg-white rounded-2xl border border-[#EBE3D5] p-5 shadow-sm space-y-3 text-xs">
            <h3 className="text-sm font-bold text-gray-900 font-serif border-b border-gray-100 pb-2">
              Registration & Contact
            </h3>
            <div className="space-y-2 text-gray-700">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Registered Mobile:</span>
                <span className="font-mono font-bold text-gray-900">{mobile || "Not specified"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Email:</span>
                <span className="text-gray-800 break-all">{profile.user?.email || "Not specified"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Contact Person:</span>
                <span className="font-semibold text-gray-800">{profile.contactPerson || "Self / Family"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Registration Source:</span>
                <span className="font-semibold text-gray-800">{profile.source || "Website"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Created Date:</span>
                <span>{new Date(profile.createdAt).toLocaleDateString("en-IN")}</span>
              </div>
              {profile.approvedAt && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Approved Date:</span>
                  <span>{new Date(profile.approvedAt).toLocaleDateString("en-IN")}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Sections */}
        <div className="lg:col-span-8 space-y-6">
          {/* Section 1: Personal & Horoscope */}
          <div className="bg-white rounded-2xl border border-[#EBE3D5] p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <Users className="h-5 w-5 text-[#7A5835]" />
              <h3 className="text-base font-bold text-gray-900 font-serif">Personal & Horoscope Details</h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-gray-500 block">Gender</span>
                <strong className="text-gray-900 text-sm font-semibold">{profile.user?.gender || "MALE"}</strong>
              </div>
              <div>
                <span className="text-gray-500 block">Date of Birth</span>
                <strong className="text-gray-900 text-sm font-semibold">
                  {profile.dateOfBirth
                    ? new Date(profile.dateOfBirth).toLocaleDateString("en-IN")
                    : "Not specified"}
                </strong>
              </div>
              <div>
                <span className="text-gray-500 block">Height</span>
                <strong className="text-gray-900 text-sm font-semibold">{profile.height || "Not specified"}</strong>
              </div>
              <div>
                <span className="text-gray-500 block">Marital Status</span>
                <strong className="text-gray-900 text-sm font-semibold">{profile.maritalStatus || "Never Married"}</strong>
              </div>
              <div>
                <span className="text-gray-500 block">Religion & Caste</span>
                <strong className="text-gray-900 text-sm font-semibold">
                  {profile.religion || "Hindu"} {profile.caste ? `(${profile.caste})` : ""}
                </strong>
              </div>
              <div>
                <span className="text-gray-500 block">Mother Tongue</span>
                <strong className="text-gray-900 text-sm font-semibold">{profile.motherTongue || "Hindi"}</strong>
              </div>
              <div>
                <span className="text-gray-500 block">Diet</span>
                <strong className="text-gray-900 text-sm font-semibold">{profile.diet || "Vegetarian"}</strong>
              </div>
              <div>
                <span className="text-gray-500 block">Manglik</span>
                <strong className="text-gray-900 text-sm font-semibold">{profile.manglik || "Non-Manglik"}</strong>
              </div>
              <div>
                <span className="text-gray-500 block">Birth Place & Time</span>
                <strong className="text-gray-900 text-sm font-semibold">
                  {profile.birthPlace || "Not specified"} {profile.birthTime ? `at ${profile.birthTime}` : ""}
                </strong>
              </div>
            </div>
          </div>

          {/* Section 2: Education & Career */}
          <div className="bg-white rounded-2xl border border-[#EBE3D5] p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <GraduationCap className="h-5 w-5 text-[#7A5835]" />
              <h3 className="text-base font-bold text-gray-900 font-serif">Education & Career</h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-gray-500 block">Highest Qualification</span>
                <strong className="text-gray-900 text-sm font-semibold">
                  {profile.education?.highestQualification || "Not specified"}
                </strong>
              </div>
              <div>
                <span className="text-gray-500 block">College / University</span>
                <strong className="text-gray-900 text-sm font-semibold">
                  {profile.education?.college || "Not specified"}
                </strong>
              </div>
              <div>
                <span className="text-gray-500 block">Occupation / Profession</span>
                <strong className="text-gray-900 text-sm font-semibold">
                  {profile.occupation?.profession || "Not specified"}
                </strong>
              </div>
              <div>
                <span className="text-gray-500 block">Company / Business</span>
                <strong className="text-gray-900 text-sm font-semibold">
                  {profile.occupation?.company || "Not specified"}
                </strong>
              </div>
              <div>
                <span className="text-gray-500 block">Annual Income</span>
                <strong className="text-gray-900 text-sm font-semibold text-[#4A121A]">
                  {profile.occupation?.annualIncome || "Not specified"}
                </strong>
              </div>
            </div>
          </div>

          {/* Section 3: Family Details */}
          <div className="bg-white rounded-2xl border border-[#EBE3D5] p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <Users className="h-5 w-5 text-[#7A5835]" />
              <h3 className="text-base font-bold text-gray-900 font-serif">Family Background</h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-gray-500 block">Father&apos;s Name</span>
                <strong className="text-gray-900 text-sm font-semibold">
                  {profile.family?.fatherName || "Not specified"}
                </strong>
              </div>
              <div>
                <span className="text-gray-500 block">Father&apos;s Profession</span>
                <strong className="text-gray-900 text-sm font-semibold">
                  {profile.family?.fatherOccupation || "Not specified"}
                </strong>
              </div>
              <div>
                <span className="text-gray-500 block">Mother&apos;s Name</span>
                <strong className="text-gray-900 text-sm font-semibold">
                  {profile.family?.motherName || "Not specified"}
                </strong>
              </div>
              <div>
                <span className="text-gray-500 block">Mother&apos;s Profession</span>
                <strong className="text-gray-900 text-sm font-semibold">
                  {profile.family?.motherOccupation || "Not specified"}
                </strong>
              </div>
              <div>
                <span className="text-gray-500 block">Siblings</span>
                <strong className="text-gray-900 text-sm font-semibold">
                  {profile.family?.brothers ?? 0} Brother(s) • {profile.family?.sisters ?? 0} Sister(s)
                </strong>
              </div>
              <div>
                <span className="text-gray-500 block">Family Type & Status</span>
                <strong className="text-gray-900 text-sm font-semibold">
                  {profile.family?.familyType || "Nuclear"} • {profile.family?.familyStatus || "Middle Class"}
                </strong>
              </div>
              {profile.family?.propertyDetails && (
                <div className="col-span-2 sm:col-span-3">
                  <span className="text-gray-500 block">Property & Residence</span>
                  <strong className="text-gray-900 font-medium">{profile.family.propertyDetails}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Partner Preferences */}
          {profile.partnerPreference && (
            <div className="bg-white rounded-2xl border border-[#EBE3D5] p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <Heart className="h-5 w-5 text-[#7A5835]" />
                <h3 className="text-base font-bold text-gray-900 font-serif">Partner Preferences</h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-gray-500 block">Preferred Age Range</span>
                  <strong className="text-gray-900 text-sm font-semibold">
                    {profile.partnerPreference.minAge || "20"} - {profile.partnerPreference.maxAge || "35"} Years
                  </strong>
                </div>
                <div>
                  <span className="text-gray-500 block">Preferred Height</span>
                  <strong className="text-gray-900 text-sm font-semibold">
                    {profile.partnerPreference.minHeight || "5'0\""} - {profile.partnerPreference.maxHeight || "6'2\""}
                  </strong>
                </div>
                <div>
                  <span className="text-gray-500 block">Preferred Religion</span>
                  <strong className="text-gray-900 text-sm font-semibold">
                    {profile.partnerPreference.preferredReligion || "Any"}
                  </strong>
                </div>
                <div>
                  <span className="text-gray-500 block">Preferred Caste</span>
                  <strong className="text-gray-900 text-sm font-semibold">
                    {profile.partnerPreference.preferredCaste || "Any"}
                  </strong>
                </div>
              </div>
            </div>
          )}

          {/* Section 5: Google Form & Additional Info */}
          {(profile.notes || profile.paymentRemark || profile.otherMatrimonyInfo) && (
            <div className="bg-[#FAF8F5] rounded-2xl border border-[#EBE3D5] p-5 shadow-sm space-y-3 text-xs">
              <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
                <FileSpreadsheet className="h-4 w-4 text-[#7A5835]" />
                <h4 className="font-bold text-gray-900 font-serif">Additional Google Form / Admin Notes</h4>
              </div>

              {profile.notes && (
                <div>
                  <span className="text-gray-500 block">Candidate Notes:</span>
                  <p className="text-gray-800 mt-0.5">{profile.notes}</p>
                </div>
              )}

              {profile.paymentRemark && (
                <div>
                  <span className="text-gray-500 block">Payment Remarks from Form:</span>
                  <p className="font-mono text-gray-800 mt-0.5">{profile.paymentRemark}</p>
                </div>
              )}

              {profile.otherMatrimonyInfo && (
                <div>
                  <span className="text-gray-500 block">Other Matrimony Information (Col AE):</span>
                  <p className="text-gray-800 mt-0.5">{profile.otherMatrimonyInfo}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CONFIRM OFFLINE PAYMENT MODAL */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#EBE3D5] space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 font-serif">Confirm Offline Payment</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Generates statutory GST invoice and marks profile as LIVE.
                </p>
              </div>
              <button
                onClick={() => setPaymentModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Profile Info Summary */}
            <div className="bg-[#FAF8F5] p-3 rounded-2xl border border-gray-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Candidate:</span>
                <span className="font-bold text-gray-900 font-serif">{candidateName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">RishteClub ID:</span>
                <span className="font-mono font-bold text-[#7A5835]">{profile.profileId}</span>
              </div>
              {profile.legacyProfileId && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Old NNVS ID:</span>
                  <span className="font-mono font-bold text-amber-800">{profile.legacyProfileId}</span>
                </div>
              )}
            </div>

            <form onSubmit={handleConfirmPayment} className="space-y-4">
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

              {/* Reverse GST Preview */}
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs space-y-1 text-amber-900">
                <div className="font-bold flex items-center justify-between">
                  <span>Reverse GST Breakdown (18%):</span>
                  <span>Gross: ₹{parsedGross.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Taxable Base:</span>
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
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#7A5835]"
                  />
                </div>
              </div>

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

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Admin Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="e.g. Verified from Bank statement"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#7A5835]"
                />
              </div>

              {modalError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {modalSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                  <span>{modalSuccess}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  disabled={confirmingPayment}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={confirmingPayment}
                  className="inline-flex items-center gap-2 bg-[#4A121A] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-[#350d13] shadow transition disabled:opacity-50"
                >
                  {confirmingPayment ? (
                    <>
                      <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Generating Invoice...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4 text-[#C5A059]" />
                      <span>Confirm & Issue GST Invoice</span>
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