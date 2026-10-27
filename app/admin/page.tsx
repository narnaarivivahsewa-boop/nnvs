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
  TrendingUp,
  Activity,
  Globe,
  BarChart3,
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
  traffic?: {
    todayStr: string;
    todayVisits: number;
    todayPageviews: number;
    trend: {
      date: string;
      label: string;
      dayName: string;
      visits: number;
      pageviews: number;
    }[];
  };
  adoption?: {
    totalRegisteredProfiles: number;
    activeUsers: number;
    pendingUsers: number;
  };
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
    {
      title: "User Adoption",
      value: `${dashboard.adoption?.activeUsers ?? 0} Active`,
      href: "/admin/activity",
      icon: Activity,
      bg: "bg-teal-50 text-teal-900 border-teal-200",
      iconBg: "bg-teal-600 text-white",
    },
    {
      title: "Today's Visitors",
      value: dashboard.traffic?.todayVisits ?? 0,
      href: "#traffic-counter",
      icon: Globe,
      bg: "bg-sky-50 text-sky-900 border-sky-200",
      iconBg: "bg-sky-600 text-white",
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

      {/* General Public Traffic & Daily Visitor Counter Card */}
      <div id="traffic-counter" className="rounded-2xl bg-white p-5 sm:p-6 border border-gray-100 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="rounded-xl p-2 bg-[#4A121A] text-white shadow-xs">
                <Globe className="h-4 w-4 text-[#DFBA73]" />
              </div>
              <h2 className="text-base sm:text-lg font-black text-gray-900 font-serif-luxury">
                General Public Traffic &amp; Daily Visitor Counter
              </h2>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Live analytics of website visitors and page impressions (excludes internal admin clicks)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-800">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Realtime Live Tracker</span>
            </span>
          </div>
        </div>

        {/* Counter Stats & Last 7 Days Trend Visual */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Today's Traffic Counters (Left 5 Cols) */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-3 sm:gap-4">
            {/* Today's Total Visits */}
            <div className="rounded-2xl bg-gradient-to-br from-[#300B11] to-[#4A121A] text-white p-4 sm:p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-[#DFBA73] font-bold uppercase tracking-wider mb-2">
                <span>Today's Visits</span>
                <Users className="h-4 w-4 opacity-80" />
              </div>
              <div className="text-3xl sm:text-4xl font-black font-mono text-white">
                {dashboard.traffic?.todayVisits ?? 0}
              </div>
              <p className="text-[11px] text-[#DFBA73]/80 mt-1">
                Unique public visitors today
              </p>
            </div>

            {/* Today's Pageviews */}
            <div className="rounded-2xl bg-[#FAF8F5] border border-[#E8DCC8] p-4 sm:p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-[#7A5835] font-bold uppercase tracking-wider mb-2">
                <span>Today's Pageviews</span>
                <TrendingUp className="h-4 w-4 text-[#C5A059]" />
              </div>
              <div className="text-3xl sm:text-4xl font-black font-mono text-[#300B11]">
                {dashboard.traffic?.todayPageviews ?? 0}
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                Total page impressions
              </p>
            </div>
          </div>

          {/* Last 7 Days Traffic Trend (Right 7 Cols) */}
          <div className="lg:col-span-7 bg-[#FAF8F5]/80 rounded-2xl p-4 sm:p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                <BarChart3 className="h-4 w-4 text-[#4A121A]" />
                <span>Last 7 Days Traffic Trend</span>
              </span>
              <span className="text-[11px] font-semibold text-gray-500">
                Daily Unique Visits &bull; General Public
              </span>
            </div>

            {/* Visual Bar Chart */}
            <div className="pt-2">
              <div className="h-28 flex items-end justify-between gap-2 sm:gap-3 px-1">
                {(dashboard.traffic?.trend || []).map((item, idx) => {
                  const maxVisits = Math.max(
                    ...(dashboard.traffic?.trend?.map((t) => t.visits) || [1]),
                    10
                  );
                  const heightPercent = Math.max(14, Math.round((item.visits / maxVisits) * 100));
                  const isToday = idx === (dashboard.traffic?.trend?.length || 1) - 1;

                  return (
                    <div
                      key={item.date}
                      className="flex-1 flex flex-col items-center h-full justify-end group relative"
                    >
                      {/* Tooltip on Hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 z-20 pointer-events-none bg-gray-900 text-white text-[10px] font-bold py-1 px-2 rounded shadow-md whitespace-nowrap">
                        {item.visits} visits ({item.pageviews} views)
                      </div>

                      {/* Bar Value */}
                      <span className={`text-[10px] font-mono font-bold mb-1 ${isToday ? "text-[#4A121A] font-extrabold" : "text-gray-500"}`}>
                        {item.visits}
                      </span>

                      {/* Bar Visual */}
                      <div className="w-full bg-gray-200/80 rounded-t-lg h-full flex items-end overflow-hidden max-w-[40px]">
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full rounded-t-lg transition-all duration-500 ${
                            isToday
                              ? "bg-gradient-to-t from-[#4A121A] to-[#DFBA73] shadow-xs"
                              : "bg-gradient-to-t from-[#7A5835] to-[#C5A059]/80 group-hover:from-[#4A121A] group-hover:to-[#DFBA73]"
                          }`}
                        />
                      </div>

                      {/* Day Label */}
                      <span className={`text-[10px] font-bold mt-2 ${isToday ? "text-[#4A121A] font-black underline underline-offset-2" : "text-gray-600"}`}>
                        {isToday ? "Today" : item.dayName}
                      </span>
                      <span className="text-[9px] text-gray-400 font-medium">
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Mobile Action Shortcuts */}
      <div className="rounded-2xl bg-white p-5 border border-gray-100 shadow-xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
          Quick Management Shortcuts
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <Link
            href="/admin/activity"
            className="flex items-center justify-between rounded-xl bg-teal-50/70 p-3 text-xs font-bold text-teal-900 border border-teal-200 hover:bg-teal-100 transition"
          >
            <span className="flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-teal-700" />
              <span>User Adoption</span>
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-teal-700" />
          </Link>

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