"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Profile = {
  id: string;
  profileId: string;

  firstName: string | null;
  lastName: string | null;

  isVisible: boolean;
  paymentCompleted: boolean;
  approvalStatus: string;

  createdAt: string;

  user: {
    fullName: string | null;
    mobile: string;
    gender: string | null;
    status: string;
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

  const [search, setSearch] = useState("");

  const [status, setStatus] = useState("");

  useEffect(() => {
    loadProfiles();
  }, [search, status]);
  async function approveProfile(profileId: string) {
  const ok = confirm("Approve this profile?");

  if (!ok) return;

  try {
    const res = await fetch("/api/admin/profiles/approve", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        profileId,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message);
    }

    alert(data.message);

    loadProfiles();

  } catch (error: any) {
    alert(error.message);
  }
}

async function rejectProfile(profileId: string) {
  const ok = confirm("Reject this profile?");

  if (!ok) return;

  try {
    const res = await fetch("/api/admin/profiles/reject", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        profileId,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message);
    }

    alert(data.message);

    loadProfiles();

  } catch (error: any) {
    alert(error.message);
  }
}

  async function loadProfiles() {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      if (search) {
        params.append("search", search);
      }

      if (status) {
        params.append("status", status);
      }

      const res = await fetch(
        `/api/admin/profiles?${params.toString()}`
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message);
      }

      setProfiles(data.profiles);

    } catch (error) {
      console.error(error);

      alert("Unable to load profiles.");

    } finally {
      setLoading(false);
    }
  }

  function badgeColor(status: string) {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-700";

      case "REJECTED":
        return "bg-red-100 text-red-700";

      case "UNDER_REVIEW":
        return "bg-yellow-100 text-yellow-700";

      case "PAYMENT_PENDING":
        return "bg-orange-100 text-orange-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  }

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">

        <h2 className="text-3xl font-bold">
          Loading Members...
        </h2>

      </div>
    );
  }

  return (
    <div className="space-y-6">

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div>

          <h1 className="text-4xl font-bold">
            Members
          </h1>

          <p className="mt-2 text-gray-500">
            Total Members : {profiles.length}
          </p>

        </div>

        <div className="flex flex-wrap gap-3">

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Name / Mobile / Profile ID"
            className="rounded-xl border px-4 py-3 outline-none focus:border-red-600"
          />

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border px-4 py-3"
          >
            <option value="">
              All Status
            </option>

            <option value="APPROVED">
              Approved
            </option>

            <option value="UNDER_REVIEW">
              Under Review
            </option>

            <option value="PAYMENT_PENDING">
              Payment Pending
            </option>

            <option value="REJECTED">
              Rejected
            </option>

          </select>

        </div>

      </div>

      <div className="overflow-auto rounded-2xl bg-white shadow">

        <table className="min-w-full">
                      <thead className="bg-gray-100">

            <tr>

              <th className="px-5 py-4 text-left">
                Photo
              </th>

              <th className="px-5 py-4 text-left">
                Member
              </th>

              <th className="px-5 py-4 text-left">
                Mobile
              </th>

              <th className="px-5 py-4 text-left">
                Profession
              </th>

              <th className="px-5 py-4 text-left">
                Status
              </th>

              <th className="px-5 py-4 text-left">
                Payment
              </th>

              <th className="px-5 py-4 text-left">
                Visibility
              </th>

              <th className="px-5 py-4 text-left">
                Actions
              </th>

            </tr>

          </thead>

          <tbody>

            {profiles.length === 0 && (

              <tr>

                <td
                  colSpan={8}
                  className="py-10 text-center text-gray-500"
                >
                  No Members Found
                </td>

              </tr>

            )}

            {profiles.map((profile) => (

              <tr
                key={profile.id}
                className="border-t hover:bg-gray-50"
              >

                <td className="px-5 py-4">

                  <img
                    src={
                      profile.photos[0]?.imageUrl ||
                      "/default-avatar.png"
                    }
                    alt={profile.user.fullName || ""}
                    className="h-14 w-14 rounded-full object-cover"
                  />

                </td>

                <td className="px-5 py-4">

                  <div className="font-semibold">
                    {profile.user.fullName}
                  </div>

                  <div className="text-sm text-gray-500">
                    {profile.profileId}
                  </div>

                </td>

                <td className="px-5 py-4">
                  {profile.user.mobile}
                </td>

                <td className="px-5 py-4">
                  {profile.occupation?.profession || "-"}
                </td>

                <td className="px-5 py-4">

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeColor(
                      profile.approvalStatus
                    )}`}
                  >
                    {profile.approvalStatus.replaceAll(
                      "_",
                      " "
                    )}
                  </span>

                </td>

                <td className="px-5 py-4">

                  {profile.paymentCompleted ? (

                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                      Paid
                    </span>

                  ) : (

                    <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                      Pending
                    </span>

                  )}

                </td>

                <td className="px-5 py-4">

                  {profile.isVisible ? (

                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                      Visible
                    </span>

                  ) : (

                    <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-700">
                      Hidden
                    </span>

                  )}

                </td>

                <td className="px-5 py-4">

                  <div className="flex flex-wrap gap-2">

                    <Link
                      href={`/profile/${profile.profileId}`}
                      className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
                    >
                      View
                    </Link>

                    <Link
                      href={`/admin/profiles/${profile.id}`}
                      className="rounded-lg bg-yellow-500 px-3 py-2 text-sm text-white hover:bg-yellow-600"
                    >
                      Edit
                    </Link>

                    <button
  onClick={() => approveProfile(profile.id)}
  className="rounded-lg bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700"
>
  Approve
</button>

                    <button
  onClick={() => rejectProfile(profile.id)}
  className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700"
>
  Reject
</button>

                  </div>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}