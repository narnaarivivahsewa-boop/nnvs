"use client";

import { useEffect, useState } from "react";
import ApprovalFilter from "./ApprovalFilter";
import ApprovalTable from "./ApprovalTable";

export default function ApprovalsPage() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadApprovals() {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/approvals");
        const data = await res.json();

        if (data.success && Array.isArray(data.profiles)) {
          setProfiles(data.profiles);
        }
      } catch (error) {
        console.error("Error loading approvals:", error);
      } finally {
        setLoading(false);
      }
    }

    loadApprovals();
  }, []);

  const refresh = async () => {
    try {
      const res = await fetch("/api/admin/approvals");
      const data = await res.json();

      if (data.success && Array.isArray(data.profiles)) {
        setProfiles(data.profiles);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold">Profile Approvals</h1>
        <p className="mt-2 text-gray-500">Approve or Reject Pending Profiles</p>
      </div>

      <ApprovalFilter />

      {loading ? (
        <div className="text-lg">Loading...</div>
      ) : (
        <ApprovalTable profiles={profiles} refresh={refresh} />
      )}
    </div>
  );
}