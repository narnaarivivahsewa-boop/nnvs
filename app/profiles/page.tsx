"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Profile = {
  id: string;
  profileId: string;
  religion: string;
  caste: string;
  height: string;
  user: {
    fullName: string;
    gender: string;
  };
  occupation?: {
    profession?: string;
  };
  photos: {
    imageUrl: string;
  }[];
};

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfiles();
  }, []);

  async function loadProfiles() {
    try {
      const res = await fetch("/api/public/profiles");

      const data = await res.json();

      if (!res.ok) {
        alert(data.message);
        return;
      }

      setProfiles(data.profiles);
    } catch (error) {
      console.error(error);
      alert("Unable to load profiles.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <h2 className="text-xl font-semibold">
          Loading Profiles...
        </h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-10">

      <div className="mx-auto max-w-7xl px-4">

        <h1 className="mb-8 text-4xl font-bold text-red-800">
          Browse Profiles
        </h1>

        {profiles.length === 0 ? (
          <div className="rounded-xl bg-white p-10 text-center shadow">
            <h2 className="text-2xl font-semibold">
              No Profiles Found
            </h2>

            <p className="mt-3 text-gray-500">
              New members will appear here.
            </p>
          </div>
        ) : (

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {profiles.map((profile) => (
              <div
                key={profile.id}
                className="overflow-hidden rounded-2xl bg-white shadow transition hover:shadow-lg"
              >
                <img
                  src={
                    profile.photos[0]?.imageUrl ||
                    "/default-avatar.png"
                  }
                  alt={profile.user.fullName}
                  className="h-72 w-full object-cover"
                />

                <div className="space-y-2 p-5">

                  <h2 className="text-2xl font-bold text-gray-800">
                    {profile.user.fullName}
                  </h2>

                  <p>
                    <strong>Profile ID:</strong>{" "}
                    {profile.profileId}
                  </p>

                  <p>
                    <strong>Gender:</strong>{" "}
                    {profile.user.gender}
                  </p>

                  <p>
                    <strong>Religion:</strong>{" "}
                    {profile.religion || "-"}
                  </p>

                  <p>
                    <strong>Caste:</strong>{" "}
                    {profile.caste || "-"}
                  </p>

                  <p>
                    <strong>Height:</strong>{" "}
                    {profile.height || "-"}
                  </p>

                  <p>
                    <strong>Profession:</strong>{" "}
                    {profile.occupation?.profession || "-"}
                  </p>

                  <Link
                    href={`/profile/${profile.profileId}`}
                    className="mt-5 block rounded-xl bg-red-700 py-3 text-center font-semibold text-white transition hover:bg-red-800"
                  >
                    View Profile
                  </Link>

                </div>
              </div>
            ))}

          </div>

        )}

      </div>

    </div>
  );
}