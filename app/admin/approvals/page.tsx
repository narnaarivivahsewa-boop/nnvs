"use client";

import { useEffect, useState } from "react";
import ApprovalFilter from "./ApprovalFilter";
import ApprovalTable from "./ApprovalTable";

export default function ApprovalsPage() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProfiles = async () => {
    try {
      const res = await fetch("/api/admin/approvals");

      const data = await res.json();

      if (data.success) {
        setProfiles(data.profiles);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  return (
  <div className="space-y-6">

    <div>
      <h1 className="text-4xl font-bold">
        Profile Approvals
      </h1>

      <p className="mt-2 text-gray-500">
        Approve or Reject Pending Profiles
      </p>
    </div>

    <ApprovalFilter />

    {loading ? (
      <div className="text-lg">
        Loading...
      </div>
    ) : (
      <ApprovalTable
        profiles={profiles}
        refresh={fetchProfiles}
      />
    )}

  </div>
);
}