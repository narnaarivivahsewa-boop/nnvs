"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  UserCheck,
  Clock3,
  XCircle,
  FileSpreadsheet,
  Heart,
  IndianRupee,
  Store,
} from "lucide-react";

type DashboardData = {
  totalMembers: number;
  maleMembers: number;
  femaleMembers: number;
  approvedProfiles: number;
  pendingProfiles: number;
  rejectedProfiles: number;
  totalPayments: number;
  totalVendors: number;
  totalInterests: number;
  todayRegistrations: number;
};

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);

  const [dashboard, setDashboard] = useState<DashboardData>({
  totalMembers: 0,
  maleMembers: 0,
  femaleMembers: 0,
  approvedProfiles: 0,
  pendingProfiles: 0,
  rejectedProfiles: 0,
  totalPayments: 0,
  totalVendors: 0,
  totalInterests: 0,
  todayRegistrations: 0,
});

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const res = await fetch("/api/admin/dashboard");

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message);
      }

      setDashboard(data.dashboard);

    } catch (error) {
      console.error(error);
      alert("Unable to load dashboard.");
    } finally {
      setLoading(false);
    }
  }

  const cards = [
    {
  title: "Male Members",
  value: dashboard.maleMembers,
  color: "bg-indigo-500",
  icon: Users,
},
{
  title: "Female Members",
  value: dashboard.femaleMembers,
  color: "bg-pink-500",
  icon: Users,
},
    {
      title: "Total Members",
      value: dashboard.totalMembers,
      color: "bg-blue-500",
      icon: Users,
    },
    {
      title: "Approved",
      value: dashboard.approvedProfiles,
      color: "bg-green-500",
      icon: UserCheck,
    },
    {
      title: "Pending",
      value: dashboard.pendingProfiles,
      color: "bg-yellow-500",
      icon: Clock3,
    },
    {
      title: "Rejected",
      value: dashboard.rejectedProfiles,
      color: "bg-red-500",
      icon: XCircle,
    },
    {
      title: "Payments",
      value: dashboard.totalPayments,
      color: "bg-purple-500",
      icon: IndianRupee,
    },
    {
      title: "Interests",
      value: dashboard.totalInterests,
      color: "bg-pink-500",
      icon: Heart,
    },
    {
      title: "Vendors",
      value: dashboard.totalVendors,
      color: "bg-orange-500",
      icon: Store,
    },
    {
      title: "Today's Registrations",
      value: dashboard.todayRegistrations,
      color: "bg-cyan-500",
      icon: Users,
    },
  ];

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <h2 className="text-3xl font-bold">
          Loading Dashboard...
        </h2>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      <div className="flex items-center justify-between">

        <div>
          <h1 className="text-4xl font-bold text-gray-800">
            Admin Dashboard
          </h1>

          <p className="mt-2 text-gray-500">
            Welcome to NNVS Matrimony Admin Panel
          </p>
        </div>

        <Link
          href="/admin/import"
          className="rounded-xl bg-red-700 px-6 py-3 font-semibold text-white hover:bg-red-800"
        >
          Import Excel
        </Link>

      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className="rounded-2xl bg-white p-6 shadow transition hover:shadow-lg"
            >
              <div className="flex items-center justify-between">

                <div>

                  <p className="text-gray-500">
                    {card.title}
                  </p>

                  <h2 className="mt-3 text-4xl font-bold">
                    {card.value}
                  </h2>

                </div>

                <div
                  className={`${card.color} rounded-2xl p-4 text-white`}
                >
                  <Icon size={34} />
                </div>

              </div>
            </div>
          );
        })}

      </div>

      <div className="rounded-2xl bg-white p-8 shadow">

        <h2 className="mb-6 text-2xl font-bold">
          Quick Actions
        </h2>

        <div className="flex flex-wrap gap-4">

          <Link
            href="/admin/profiles"
            className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
          >
            View Members
          </Link>

          <Link
            href="/admin/import"
            className="rounded-xl bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700"
          >
            Import Excel
          </Link>

          <Link
            href="/admin/settings"
            className="rounded-xl bg-gray-700 px-6 py-3 font-semibold text-white hover:bg-black"
          >
            Settings
          </Link>

        </div>

      </div>

    </div>
  );
}