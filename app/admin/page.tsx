"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Eye,
  EyeOff,
  UserCheck,
  CreditCard,
  FileText,
  Copy,
  Clock,
  RefreshCw,
  FileSpreadsheet,
  ArrowRight,
  Sparkles,
} from "lucide-react";

type DashboardData = {
  totalProfiles: number;
  liveProfiles: number;
  hiddenProfiles: number;
  todayRegistrations: number;
  pendingPayments: number;
  confirmedPayments: number;
  pendingApprovals: number;
  duplicateFlags: number;
  invoicesGenerated: number;
  googleFormImports: number;
  recentProfiles: {
    id: string;
    profileId: string;
    legacyProfileId: string | null;
    source: string | null;
    isVisible: boolean;
    approvalStatus: string;
    createdAt: string;
    user: {
      fullName: string | null;
      mobile: string;
      gender: string | null;
    };
  }[];
  recentPayments: {
    id: string;
    amount: number;
    grossAmount: number | null;
    invoiceNumber: string | null;
    transactionId: string | null;
    createdAt: string;
    user: {
      fullName: string | null;
      mobile: string;
    };
  }[];
};

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [dashboard, setDashboard] = useState<DashboardData>({
    totalProfiles: 0,
    liveProfiles: 0,
    hiddenProfiles: 0,
    todayRegistrations: 0,
    pendingPayments: 0,
    confirmedPayments: 0,
    pendingApprovals: 0,
    duplicateFlags: 0,
    invoicesGenerated: 0,
    googleFormImports: 0,
    recentProfiles: [],
    recentPayments: [],
  });

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/dashboard");
        const data = await res.json();

        if (res.ok && data.success) {
          setDashboard(data.dashboard);
        }
      } catch (error) {
        console.error("Dashboard load error:", error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [refreshTrigger]);

  const cards = [
    {
      title: "Total Profiles",
      value: dashboard.totalProfiles,
      href: "/admin/profiles",
      icon: Users,
      bg: "bg-blue-50 text-blue-800 border-blue-200",
      iconBg: "bg-blue-600 text-white",
    },
    {
      title: "Live Profiles",
      value: dashboard.liveProfiles,
      href: "/admin/profiles?visibility=LIVE",
      icon: Eye,
      bg: "bg-emerald-50 text-emerald-800 border-emerald-200",
      iconBg: "bg-emerald-600 text-white",
    },
    {
      title: "Hidden Profiles",
      value: dashboard.hiddenProfiles,
      href: "/admin/profiles?visibility=HIDDEN",
      icon: EyeOff,
      bg: "bg-gray-50 text-gray-800 border-gray-200",
      iconBg: "bg-gray-600 text-white",
    },
    {
      title: "New Today",
      value: dashboard.todayRegistrations,
      href: "/admin/profiles",
      icon: Sparkles,
      bg: "bg-amber-50 text-amber-900 border-amber-200",
      iconBg: "bg-amber-600 text-white",
    },
    {
      title: "Pending Approvals",
      value: dashboard.pendingApprovals,
      href: "/admin/approvals",
      icon: UserCheck,
      bg: "bg-orange-50 text-orange-900 border-orange-200",
      iconBg: "bg-orange-600 text-white",
    },
    {
      title: "Pending Payments",
      value: dashboard.pendingPayments,
      href: "/admin/payments?status=PENDING",
      icon: Clock,
      bg: "bg-red-50 text-red-900 border-red-200",
      iconBg: "bg-red-600 text-white",
    },
    {
      title: "Confirmed Payments",
      value: dashboard.confirmedPayments,
      href: "/admin/payments?status=SUCCESS",
      icon: CreditCard,
      bg: "bg-emerald-50 text-emerald-900 border-emerald-200",
      iconBg: "bg-emerald-700 text-white",
    },
    {
      title: "GST Invoices",
      value: dashboard.invoicesGenerated,
      href: "/admin/invoices",
      icon: FileText,
      bg: "bg-purple-50 text-purple-900 border-purple-200",
      iconBg: "bg-purple-600 text-white",
    },
    {
      title: "Duplicate Flags",
      value: dashboard.duplicateFlags,
      href: "/admin/duplicates",
      icon: Copy,
      bg: "bg-yellow-50 text-yellow-900 border-yellow-200",
      iconBg: "bg-yellow-600 text-white",
    },
    {
      title: "Form Imports",
      value: dashboard.googleFormImports,
      href: "/admin/google-forms",
      icon: FileSpreadsheet,
      bg: "bg-indigo-50 text-indigo-900 border-indigo-200",
      iconBg: "bg-indigo-600 text-white",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 font-serif-luxury">
            Dashboard Overview
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Real-time Matrimonial Operations & Bull; Trendy Traders
          </p>
        </div>

        <button
          type="button"
          onClick={() => setRefreshTrigger((prev) => prev + 1)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-gray-700 border border-gray-200 shadow-xs hover:bg-gray-50 transition"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Summary Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <Link
              key={card.title}
              href={card.href}
              className={`rounded-2xl border p-4 shadow-xs transition hover:scale-[1.02] hover:shadow-md flex flex-col justify-between ${card.bg}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider opacity-80">
                  {card.title}
                </span>
                <div className={`rounded-xl p-2 ${card.iconBg}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>

              <div className="text-2xl sm:text-3xl font-black font-mono">
                {card.value}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Mobile Action Shortcuts */}
      <div className="rounded-2xl bg-white p-5 border border-gray-100 shadow-xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
          Quick Management Shortcuts
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <Link
            href="/admin/profiles"
            className="flex items-center justify-between rounded-xl bg-[#FAF6EF] p-3 text-xs font-bold text-[#4A121A] border border-[#E8DCC8] hover:bg-[#F2E8D7] transition"
          >
            <span>All Profiles</span>
            <ArrowRight className="h-3.5 w-3.5 text-[#C5A059]" />
          </Link>

          <Link
            href="/admin/payments"
            className="flex items-center justify-between rounded-xl bg-[#FAF6EF] p-3 text-xs font-bold text-[#4A121A] border border-[#E8DCC8] hover:bg-[#F2E8D7] transition"
          >
            <span>Confirm Payment</span>
            <ArrowRight className="h-3.5 w-3.5 text-[#C5A059]" />
          </Link>

          <Link
            href="/admin/approvals"
            className="flex items-center justify-between rounded-xl bg-[#FAF6EF] p-3 text-xs font-bold text-[#4A121A] border border-[#E8DCC8] hover:bg-[#F2E8D7] transition"
          >
            <span>Pending Approvals</span>
            <ArrowRight className="h-3.5 w-3.5 text-[#C5A059]" />
          </Link>

          <Link
            href="/admin/invoices"
            className="flex items-center justify-between rounded-xl bg-[#FAF6EF] p-3 text-xs font-bold text-[#4A121A] border border-[#E8DCC8] hover:bg-[#F2E8D7] transition"
          >
            <span>GST Tax Invoices</span>
            <ArrowRight className="h-3.5 w-3.5 text-[#C5A059]" />
          </Link>
        </div>
      </div>

      {/* Two Column Section: Recent Profiles & Recent Payments */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Registrations & Imports */}
        <div className="rounded-2xl bg-white p-5 border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-[#4A121A]" />
              <span>Latest Profiles</span>
            </h3>
            <Link
              href="/admin/profiles"
              className="text-xs font-bold text-[#4A121A] hover:underline"
            >
              View All &rarr;
            </Link>
          </div>

          <div className="space-y-2.5">
            {dashboard.recentProfiles.length === 0 ? (
              <p className="text-xs text-gray-500 py-4 text-center">No profiles found.</p>
            ) : (
              dashboard.recentProfiles.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F5] border border-gray-100 text-xs"
                >
                  <div className="space-y-0.5">
                    <p className="font-bold text-gray-900">{p.user.fullName || p.profileId}</p>
                    <div className="flex items-center gap-2 text-[11px] text-gray-500">
                      <span className="font-mono">{p.profileId}</span>
                      {p.legacyProfileId && (
                        <span className="text-[#7A5835] font-semibold">({p.legacyProfileId})</span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.isVisible
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {p.isVisible ? "Live" : "Hidden"}
                    </span>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {new Date(p.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Confirmed Payments */}
        <div className="rounded-2xl bg-white p-5 border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-emerald-700" />
              <span>Latest Confirmed Payments</span>
            </h3>
            <Link
              href="/admin/payments"
              className="text-xs font-bold text-[#4A121A] hover:underline"
            >
              View All &rarr;
            </Link>
          </div>

          <div className="space-y-2.5">
            {dashboard.recentPayments.length === 0 ? (
              <p className="text-xs text-gray-500 py-4 text-center">No payments confirmed yet.</p>
            ) : (
              dashboard.recentPayments.map((pay) => (
                <div
                  key={pay.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 text-xs"
                >
                  <div className="space-y-0.5">
                    <p className="font-bold text-gray-900">{pay.user.fullName || "Member"}</p>
                    <p className="font-mono text-[11px] text-gray-500">{pay.user.mobile}</p>
                  </div>

                  <div className="text-right">
                    <p className="font-black text-emerald-800 font-mono">
                      ₹{Number(pay.grossAmount || pay.amount).toFixed(2)}
                    </p>
                    {pay.invoiceNumber ? (
                      <Link
                        href={`/invoice/${pay.id}`}
                        target="_blank"
                        className="text-[10px] font-bold text-[#7A5835] hover:underline block"
                      >
                        {pay.invoiceNumber}
                      </Link>
                    ) : (
                      <span className="text-[10px] text-gray-400">Paid</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}