"use client";

import { useEffect, useState } from "react";

type StatsData = {
  girls: number;
  boys: number;
  total: number;
};

export default function Stats() {
  const [stats, setStats] = useState<StatsData>({
    girls: 0,
    boys: 0,
    total: 0,
  });

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/public/stats");
        const data = await res.json();

        if (data.success) {
          setStats({
            girls: data.girls,
            boys: data.boys,
            total: data.total,
          });
        }
      } catch (error) {
        console.error("Stats loading error:", error);
      }
    }

    loadStats();
  }, []);

  return (
    <section className="py-8">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-6 md:grid-cols-3">

          <div className="rounded-2xl bg-white p-8 text-center shadow-lg">
            <h2 className="text-5xl font-bold text-pink-600">
              {stats.girls}
            </h2>
            <p className="mt-2 text-gray-600">
              Girls Profiles
            </p>
          </div>

          <div className="rounded-2xl bg-white p-8 text-center shadow-lg">
            <h2 className="text-5xl font-bold text-blue-600">
              {stats.boys}
            </h2>
            <p className="mt-2 text-gray-600">
              Boys Profiles
            </p>
          </div>

          <div className="rounded-2xl bg-white p-8 text-center shadow-lg">
            <h2 className="text-5xl font-bold text-green-600">
              {stats.total}
            </h2>
            <p className="mt-2 text-gray-600">
              Total Profiles
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}