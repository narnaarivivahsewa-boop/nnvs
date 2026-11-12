"use client";

import { useState } from "react";
import ApprovalRow from "./ApprovalRow";

interface ApprovalTableProps {
  profiles: any[];
  refresh: () => void;
  onNotify?: (message: string, type: "success" | "error") => void;
}

export default function ApprovalTable({
  profiles,
  refresh,
  onNotify,
}: ApprovalTableProps) {
  const [notice, setNotice] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const handleNotify = (message: string, type: "success" | "error") => {
    if (onNotify) {
      onNotify(message, type);
      return;
    }
    setNotice({ message, type });
    setTimeout(() => {
      setNotice((prev) => (prev?.message === message ? null : prev));
    }, 5000);
  };

  return (
    <div className="space-y-3">
      {notice && (
        <div
          role="alert"
          className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
            notice.type === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          {notice.message}
        </div>
      )}
    <div className="overflow-x-auto rounded-xl bg-white shadow">

      <table className="min-w-full">

        <thead className="bg-red-700 text-white">

          <tr>

            <th className="px-4 py-3 text-left">
              Profile ID
            </th>

            <th className="px-4 py-3 text-left">
              Name
            </th>

            <th className="px-4 py-3 text-left">
              Mobile
            </th>

            <th className="px-4 py-3 text-left">
              Gender
            </th>

            <th className="px-4 py-3 text-left">
              Qualification
            </th>

            <th className="px-4 py-3 text-left">
              Profession
            </th>

            <th className="px-4 py-3 text-left">
              Action
            </th>

          </tr>

        </thead>

        <tbody>

          {profiles.length === 0 ? (

            <tr>

              <td
                colSpan={7}
                className="py-10 text-center text-gray-500"
              >
                No Pending Profiles
              </td>

            </tr>

          ) : (

            profiles.map((profile: any) => (

              <ApprovalRow
                key={profile.id}
                profile={profile}
                refresh={refresh}
                onNotify={handleNotify}
              />

            ))

          )}

        </tbody>

      </table>

    </div>
    </div>
  );
}