"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Profile = {
  id: string;
  profileId: string;
  firstName: string | null;
  lastName: string | null;
  dateOfBirth: string | null;
  height: number | null;

  user: {
    fullName: string;
    gender: string;
  };

  education: {
    highestQualification: string | null;
  } | null;

  occupation: {
    profession: string | null;
  } | null;

  photos: {
    imageUrl: string;
  }[];
};

function calculateAge(dob: string | null) {
  if (!dob) return "--";

  const birth = new Date(dob);

  const today = new Date();

  let age = today.getFullYear() - birth.getFullYear();

  const month =
    today.getMonth() - birth.getMonth();

  if (
    month < 0 ||
    (month === 0 &&
      today.getDate() < birth.getDate())
  ) {
    age--;
  }

  return age;
}

function convertHeight(cm: number | null) {
  if (!cm) return "--";

  const inches = cm / 2.54;

  const feet = Math.floor(inches / 12);

  const inch = Math.round(inches % 12);

  return `${feet}'${inch}"`;
}

export default function FeaturedProfilesNew() {
  const [profiles, setProfiles] = useState<Profile[]>([]);

  const [loading, setLoading] = useState(true);
    useEffect(() => {
    loadProfiles();
  }, []);

  async function loadProfiles() {
    try {
      const res = await fetch("/api/public/profiles");

      const data = await res.json();

      if (data.success) {
        setProfiles(data.profiles);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-red-900">
            Featured Profiles
          </h2>

          <p className="mt-8 text-lg text-gray-500">
            Loading profiles...
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-gray-50 py-20">

      <div className="max-w-7xl mx-auto px-6">

        <div className="text-center">

          <h2 className="text-5xl font-bold text-red-900">
            Featured Profiles
          </h2>

          <p className="mt-4 text-gray-500">
            Verified Members from NNVS Matrimony
          </p>

        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {profiles.map((profile) => (
                        <div
              key={profile.id}
              className="overflow-hidden rounded-3xl bg-white shadow-xl transition duration-300 hover:-translate-y-2 hover:shadow-2xl"
            >
              <div className="flex items-center justify-center bg-gray-100 p-8">

                {profile.photos.length > 0 ? (
                  <img
                    src={profile.photos[0].imageUrl}
                    alt={profile.user.fullName}
                    className="h-44 w-44 rounded-full object-cover border-4 border-red-700"
                  />
                ) : (
                  <div className="flex h-44 w-44 items-center justify-center rounded-full border-4 border-red-700 bg-gray-200 text-7xl">
                    👤
                  </div>
                )}

              </div>

              <div className="p-6">

                <div className="flex items-center justify-between">

                  <div>

                    <h3 className="text-2xl font-bold">
                      {profile.user.fullName}
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      {profile.profileId}
                    </p>

                  </div>

                  <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                    ✔ Verified
                  </span>

                </div>

                <div className="mt-6 space-y-2 text-gray-600">

                  <p>
                    <strong>Gender:</strong>{" "}
                    {profile.user.gender}
                  </p>

                  <p>
                    <strong>Age:</strong>{" "}
                    {calculateAge(profile.dateOfBirth)} Years
                  </p>

                  <p>
                    <strong>Height:</strong>{" "}
                    {convertHeight(profile.height)}
                  </p>

                  <p>
                    <strong>Qualification:</strong>{" "}
                    {profile.education
                      ?.highestQualification || "--"}
                  </p>

                  <p>
                    <strong>Profession:</strong>{" "}
                    {profile.occupation
                      ?.profession || "--"}
                  </p>

                </div>

                <Link
                  href={`/profile/${profile.profileId}`}
                  className="mt-8 block rounded-xl bg-red-900 py-3 text-center font-semibold text-white transition hover:bg-red-800"
                >
                  View Profile
                </Link>

              </div>

            </div>
                      ))}
        </div>

        {profiles.length === 0 && (
          <div className="mt-12 rounded-2xl bg-white p-10 text-center shadow">
            <p className="text-lg text-gray-500">
              No featured profiles available.
            </p>
          </div>
        )}

      </div>

    </section>
  );
}