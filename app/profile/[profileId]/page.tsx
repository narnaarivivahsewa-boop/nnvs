"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Profile = {
  id: string;
  profileId: string;
  firstName: string;
  religion?: string;
  caste?: string;
  motherTongue?: string;
  maritalStatus?: string;
  height?: number;
  dateOfBirth?: string;

  user: {
    fullName: string;
    gender: string;
  };

  photos: {
    imageUrl: string;
    isPrimary: boolean;
  }[];

  family?: {
    fatherName?: string;
    motherName?: string;
    brothers?: number;
    sisters?: number;
    familyType?: string;
    familyStatus?: string;
  };

  education?: {
    highestQualification?: string;
    college?: string;
    occupationField?: string;
  };

  occupation?: {
    profession?: string;
    company?: string;
    annualIncome?: string;
  };

  partnerPreference?: {
    minAge?: number;
    maxAge?: number;
    minHeight?: number;
    maxHeight?: number;
    preferredReligion?: string;
    preferredCaste?: string;
  };
};

export default function ProfileDetailsPage() {
  const params = useParams();

  const profileId = params.profileId as string;

  const [profile, setProfile] = useState<Profile | null>(null);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const res = await fetch(`/api/profile/${profileId}`);

      const data = await res.json();

      if (!res.ok) {
        alert(data.message);
        return;
      }

      setProfile(data.profile);

    } catch (error) {
      console.error(error);

      alert("Unable to load profile.");
    } finally {
      setLoading(false);
    }
  }
  async function sendInterest() {
  try {
    setSending(true);

    const res = await fetch("/api/interest/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        receiverProfileId: profile?.id,
      }),
    });

    const data = await res.json();

    alert(data.message);

  } catch (error) {
    console.error(error);
    alert("Unable to send interest.");
  } finally {
    setSending(false);
  }
}

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <h2 className="text-2xl font-semibold">
          Loading Profile...
        </h2>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <h2 className="text-2xl font-semibold">
          Profile Not Found
        </h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-10">

      <div className="mx-auto max-w-6xl px-4">

        <div className="overflow-hidden rounded-3xl bg-white shadow-xl">

          <img
            src={
              profile.photos[0]?.imageUrl ||
              "/default-avatar.png"
            }
            alt={profile.user.fullName}
            className="h-[450px] w-full object-cover"
          />

          <div className="p-8">
                        <h1 className="text-4xl font-bold text-gray-800">
              {profile.user.fullName}
            </h1>

            <p className="mt-2 text-gray-500">
              Profile ID : {profile.profileId}
            </p>

            <div className="mt-8 grid gap-8 md:grid-cols-2">

              {/* Personal Information */}

              <div className="rounded-2xl border p-6">

                <h2 className="mb-5 text-2xl font-semibold">
                  Personal Information
                </h2>

                <div className="space-y-3">

                  <p><strong>Gender:</strong> {profile.user.gender}</p>

                  <p><strong>Religion:</strong> {profile.religion || "-"}</p>

                  <p><strong>Caste:</strong> {profile.caste || "-"}</p>

                  <p><strong>Mother Tongue:</strong> {profile.motherTongue || "-"}</p>

                  <p><strong>Marital Status:</strong> {profile.maritalStatus || "-"}</p>

                  <p><strong>Height:</strong> {profile.height || "-"} cm</p>

                </div>

              </div>

              {/* Education */}

              <div className="rounded-2xl border p-6">

                <h2 className="mb-5 text-2xl font-semibold">
                  Education
                </h2>

                <div className="space-y-3">

                  <p>
                    <strong>Qualification:</strong>{" "}
                    {profile.education?.highestQualification || "-"}
                  </p>

                  <p>
                    <strong>College:</strong>{" "}
                    {profile.education?.college || "-"}
                  </p>

                  <p>
                    <strong>Field:</strong>{" "}
                    {profile.education?.occupationField || "-"}
                  </p>

                </div>

              </div>

              {/* Occupation */}

              <div className="rounded-2xl border p-6">

                <h2 className="mb-5 text-2xl font-semibold">
                  Occupation
                </h2>

                <div className="space-y-3">

                  <p>
                    <strong>Profession:</strong>{" "}
                    {profile.occupation?.profession || "-"}
                  </p>

                  <p>
                    <strong>Company:</strong>{" "}
                    {profile.occupation?.company || "-"}
                  </p>

                  <p>
                    <strong>Annual Income:</strong>{" "}
                    {profile.occupation?.annualIncome || "-"}
                  </p>

                </div>

              </div>

              {/* Family */}

              <div className="rounded-2xl border p-6">

                <h2 className="mb-5 text-2xl font-semibold">
                  Family
                </h2>

                <div className="space-y-3">

                  <p>
                    <strong>Father:</strong>{" "}
                    {profile.family?.fatherName || "-"}
                  </p>

                  <p>
                    <strong>Mother:</strong>{" "}
                    {profile.family?.motherName || "-"}
                  </p>

                  <p>
                    <strong>Brothers:</strong>{" "}
                    {profile.family?.brothers ?? "-"}
                  </p>

                  <p>
                    <strong>Sisters:</strong>{" "}
                    {profile.family?.sisters ?? "-"}
                  </p>

                  <p>
                    <strong>Family Type:</strong>{" "}
                    {profile.family?.familyType || "-"}
                  </p>

                </div>

              </div>

              {/* Partner Preference */}

              <div className="rounded-2xl border p-6 md:col-span-2">

                <h2 className="mb-5 text-2xl font-semibold">
                  Partner Preference
                </h2>

                <div className="grid gap-4 md:grid-cols-3">

                  <p>
                    <strong>Age:</strong>{" "}
                    {profile.partnerPreference?.minAge || "-"} -
                    {" "}
                    {profile.partnerPreference?.maxAge || "-"}
                  </p>

                  <p>
                    <strong>Religion:</strong>{" "}
                    {profile.partnerPreference?.preferredReligion || "-"}
                  </p>

                  <p>
                    <strong>Caste:</strong>{" "}
                    {profile.partnerPreference?.preferredCaste || "-"}
                  </p>

                </div>

              </div>

            </div>

            <div className="mt-10 flex flex-wrap gap-4">

              <button
  onClick={sendInterest}
  disabled={sending}
  className="rounded-xl bg-red-700 px-8 py-3 font-semibold text-white transition hover:bg-red-800 disabled:opacity-50"
>
  {sending ? "Sending..." : "❤️ Send Interest"}
</button>

              <button
                className="rounded-xl border border-red-700 px-8 py-3 font-semibold text-red-700 transition hover:bg-red-50"
              >
                ⭐ Shortlist
              </button>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
