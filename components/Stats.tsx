"use client";

import { useEffect, useState } from "react";
import { UserCheck } from "lucide-react";

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
            girls: data.girls || 0,
            boys: data.boys || 0,
            total: data.total || 0,
          });
        }
      } catch (error) {
        console.error("Stats loading error:", error);
      }
    }

    loadStats();
  }, []);

  return (
    <section className="py-12 bg-transparent">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Brides Card */}
          <div className="relative overflow-hidden rounded-2xl bg-[#FAF5EB] border border-[#DACBB4] p-6 sm:p-7 shadow-xs transition-all duration-300 hover:shadow-md hover:border-[#C5A059] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#A13A4B]">
                  Brides (Girls)
                </p>
                <h3 className="mt-2 text-3xl sm:text-4xl font-extrabold text-[#2D221E] font-serif-luxury">
                  {stats.girls}
                </h3>
                <p className="mt-1 text-xs text-[#5A4E48] font-medium">
                  Verified Bride Profiles
                </p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FAF0DC] text-[#4A121A] border border-[#E2D4BE] shadow-xs">
                <span className="text-2xl">👩</span>
              </div>
            </div>
            <div className="mt-5 h-1 w-full bg-[#E8DCC8] rounded-full overflow-hidden">
              <div className="h-full bg-[#A13A4B] rounded-full w-full" />
            </div>
          </div>

          {/* Grooms Card */}
          <div className="relative overflow-hidden rounded-2xl bg-[#FAF5EB] border border-[#DACBB4] p-6 sm:p-7 shadow-xs transition-all duration-300 hover:shadow-md hover:border-[#C5A059] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#4A121A]">
                  Grooms (Boys)
                </p>
                <h3 className="mt-2 text-3xl sm:text-4xl font-extrabold text-[#2D221E] font-serif-luxury">
                  {stats.boys}
                </h3>
                <p className="mt-1 text-xs text-[#5A4E48] font-medium">
                  Verified Groom Profiles
                </p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FAF0DC] text-[#4A121A] border border-[#E2D4BE] shadow-xs">
                <span className="text-2xl">👨</span>
              </div>
            </div>
            <div className="mt-5 h-1 w-full bg-[#E8DCC8] rounded-full overflow-hidden">
              <div className="h-full bg-[#4A121A] rounded-full w-full" />
            </div>
          </div>

          {/* Total Community Matches */}
          <div className="relative overflow-hidden rounded-2xl bg-[#FAF5EB] border border-[#DACBB4] p-6 sm:p-7 shadow-xs transition-all duration-300 hover:shadow-md hover:border-[#C5A059] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#C5A059]">
                  Total Active Members
                </p>
                <h3 className="mt-2 text-3xl sm:text-4xl font-extrabold text-[#2D221E] font-serif-luxury">
                  {stats.total}
                </h3>
                <p className="mt-1 text-xs text-[#5A4E48] font-medium">
                  Verified Matrimonial Profiles
                </p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FAF0DC] text-[#C5A059] border border-[#E2D4BE] shadow-xs">
                <UserCheck className="h-7 w-7 text-[#C5A059]" />
              </div>
            </div>
            <div className="mt-5 h-1 w-full bg-[#E8DCC8] rounded-full overflow-hidden">
              <div className="h-full bg-[#C5A059] rounded-full w-full" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}