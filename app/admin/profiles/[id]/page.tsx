"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type Profile = {
  id: string;
  profileId: string;

  firstName: string | null;
  lastName: string | null;

  dateOfBirth: string | null;

  height: number | null;

  religion: string | null;
  caste: string | null;
  motherTongue: string | null;
  maritalStatus: string | null;

  isVisible: boolean;
  paymentCompleted: boolean;

  approvalStatus: string;

  approvedAt: string | null;

  createdAt: string;

  user: {
    fullName: string | null;
    mobile: string;
    email: string | null;

    gender: string | null;

    status: string;

    mobileVerified: boolean;
    emailVerified: boolean;
  };

  photos: {
    id: string;
    imageUrl: string;
    isPrimary: boolean;
  }[];

  family: {
    fatherName: string | null;
    motherName: string | null;
    brothers: number | null;
    sisters: number | null;
    familyType: string | null;
    familyStatus: string | null;
  } | null;

  education: {
    highestQualification: string | null;
    college: string | null;
    occupationField: string | null;
  } | null;

  occupation: {
    profession: string | null;
    company: string | null;
    annualIncome: string | null;
  } | null;

  partnerPreference: {
    minAge: number | null;
    maxAge: number | null;

    minHeight: number | null;
    maxHeight: number | null;

    preferredReligion: string | null;
    preferredCaste: string | null;
  } | null;
};

export default function AdminProfileViewPage() {

  const params = useParams();

  const id = params.id as string;

  const [loading, setLoading] = useState(true);

  const [profile, setProfile] =
    useState<Profile | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {

    try {

      const res = await fetch(
        `/api/admin/profiles/${id}`
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message);
      }

      setProfile(data.profile);

    } catch (error) {

      console.error(error);

      alert("Unable to load profile.");

    } finally {

      setLoading(false);

    }

  }

  if (loading) {

    return (

      <div className="flex h-[70vh] items-center justify-center">

        <h2 className="text-3xl font-bold">

          Loading Profile...

        </h2>

      </div>

    );

  }

  if (!profile) {

    return (

      <div className="flex h-[70vh] items-center justify-center">

        <h2 className="text-3xl font-bold">

          Profile Not Found

        </h2>

      </div>

    );

  }

  return (

    <div className="space-y-8">

      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-4xl font-bold">

            {profile.user.fullName}

          </h1>

          <p className="mt-2 text-gray-500">

            {profile.profileId}

          </p>

        </div>

        <Link
          href="/admin/profiles"
          className="rounded-xl bg-gray-700 px-5 py-3 text-white hover:bg-black"
        >
          Back
        </Link>

      </div>

      <div className="grid gap-8 lg:grid-cols-3">
                {/* LEFT SIDE */}

        <div className="space-y-6">

          <div className="overflow-hidden rounded-2xl bg-white shadow">

            <img
              src={
                profile.photos[0]?.imageUrl ||
                "/default-avatar.png"
              }
              alt={profile.user.fullName || ""}
              className="h-[420px] w-full object-cover"
            />

            {profile.photos.length > 1 && (

              <div className="grid grid-cols-4 gap-2 p-4">

                {profile.photos.map((photo) => (

                  <img
                    key={photo.id}
                    src={photo.imageUrl}
                    alt=""
                    className="h-24 w-full rounded-lg object-cover"
                  />

                ))}

              </div>

            )}

          </div>

          {/* ADMIN STATUS */}

          <div className="rounded-2xl bg-white p-6 shadow">

            <h2 className="mb-5 text-xl font-bold">
              Admin Information
            </h2>

            <div className="space-y-3">

              <p>
                <strong>Approval :</strong>{" "}
                {profile.approvalStatus}
              </p>

              <p>
                <strong>Visible :</strong>{" "}
                {profile.isVisible ? "Yes" : "No"}
              </p>

              <p>
                <strong>Payment :</strong>{" "}
                {profile.paymentCompleted
                  ? "Completed"
                  : "Pending"}
              </p>

              <p>
                <strong>Approved At :</strong>{" "}
                {profile.approvedAt
                  ? new Date(
                      profile.approvedAt
                    ).toLocaleString()
                  : "-"}
              </p>

              <p>
                <strong>Created :</strong>{" "}
                {new Date(
                  profile.createdAt
                ).toLocaleDateString()}
              </p>

            </div>

          </div>

        </div>

        {/* RIGHT SIDE */}

        <div className="space-y-6 lg:col-span-2">

          {/* PERSONAL */}

          <div className="rounded-2xl bg-white p-6 shadow">

            <h2 className="mb-6 text-2xl font-bold">
              Personal Information
            </h2>

            <div className="grid gap-5 md:grid-cols-2">

              <p>
                <strong>Name</strong>
                <br />
                {profile.user.fullName}
              </p>

              <p>
                <strong>Mobile</strong>
                <br />
                {profile.user.mobile}
              </p>

              <p>
                <strong>Email</strong>
                <br />
                {profile.user.email || "-"}
              </p>

              <p>
                <strong>Gender</strong>
                <br />
                {profile.user.gender}
              </p>

              <p>
                <strong>Date of Birth</strong>
                <br />
                {profile.dateOfBirth
                  ? new Date(
                      profile.dateOfBirth
                    ).toLocaleDateString()
                  : "-"}
              </p>

              <p>
                <strong>Height</strong>
                <br />
                {profile.height || "-"} cm
              </p>

              <p>
                <strong>Religion</strong>
                <br />
                {profile.religion || "-"}
              </p>

              <p>
                <strong>Caste</strong>
                <br />
                {profile.caste || "-"}
              </p>

              <p>
                <strong>Mother Tongue</strong>
                <br />
                {profile.motherTongue || "-"}
              </p>

              <p>
                <strong>Marital Status</strong>
                <br />
                {profile.maritalStatus || "-"}
              </p>

            </div>

          </div>

          {/* FAMILY */}

          <div className="rounded-2xl bg-white p-6 shadow">

            <h2 className="mb-6 text-2xl font-bold">
              Family Information
            </h2>

            <div className="grid gap-5 md:grid-cols-2">

              <p>
                <strong>Father</strong>
                <br />
                {profile.family?.fatherName || "-"}
              </p>

              <p>
                <strong>Mother</strong>
                <br />
                {profile.family?.motherName || "-"}
              </p>

              <p>
                <strong>Brothers</strong>
                <br />
                {profile.family?.brothers ?? "-"}
              </p>

              <p>
                <strong>Sisters</strong>
                <br />
                {profile.family?.sisters ?? "-"}
              </p>

              <p>
                <strong>Family Type</strong>
                <br />
                {profile.family?.familyType || "-"}
              </p>

              <p>
                <strong>Family Status</strong>
                <br />
                {profile.family?.familyStatus || "-"}
              </p>

            </div>

          </div>

          {/* EDUCATION */}

          <div className="rounded-2xl bg-white p-6 shadow">

            <h2 className="mb-6 text-2xl font-bold">
              Education
            </h2>

            <div className="grid gap-5 md:grid-cols-2">

              <p>
                <strong>Qualification</strong>
                <br />
                {profile.education?.highestQualification || "-"}
              </p>

              <p>
                <strong>College</strong>
                <br />
                {profile.education?.college || "-"}
              </p>

              <p>
                <strong>Field</strong>
                <br />
                {profile.education?.occupationField || "-"}
              </p>

            </div>

          </div>
                    {/* OCCUPATION */}

          <div className="rounded-2xl bg-white p-6 shadow">

            <h2 className="mb-6 text-2xl font-bold">
              Occupation
            </h2>

            <div className="grid gap-5 md:grid-cols-2">

              <p>
                <strong>Profession</strong>
                <br />
                {profile.occupation?.profession || "-"}
              </p>

              <p>
                <strong>Company</strong>
                <br />
                {profile.occupation?.company || "-"}
              </p>

              <p>
                <strong>Annual Income</strong>
                <br />
                {profile.occupation?.annualIncome || "-"}
              </p>

            </div>

          </div>

          {/* PARTNER PREFERENCE */}

          <div className="rounded-2xl bg-white p-6 shadow">

            <h2 className="mb-6 text-2xl font-bold">
              Partner Preference
            </h2>

            <div className="grid gap-5 md:grid-cols-2">

              <p>
                <strong>Preferred Age</strong>
                <br />
                {profile.partnerPreference?.minAge || "-"} -
                {" "}
                {profile.partnerPreference?.maxAge || "-"}
              </p>

              <p>
                <strong>Preferred Height</strong>
                <br />
                {profile.partnerPreference?.minHeight || "-"} -
                {" "}
                {profile.partnerPreference?.maxHeight || "-"} cm
              </p>

              <p>
                <strong>Preferred Religion</strong>
                <br />
                {profile.partnerPreference?.preferredReligion || "-"}
              </p>

              <p>
                <strong>Preferred Caste</strong>
                <br />
                {profile.partnerPreference?.preferredCaste || "-"}
              </p>

            </div>

          </div>

          {/* ACTIONS */}

          <div className="rounded-2xl bg-white p-6 shadow">

            <h2 className="mb-6 text-2xl font-bold">
              Admin Actions
            </h2>

            <div className="flex flex-wrap gap-4">

              <button
                onClick={async () => {

                  const ok = confirm(
                    "Approve this profile?"
                  );

                  if (!ok) return;

                  const res = await fetch(
                    "/api/admin/profiles/approve",
                    {
                      method: "POST",
                      headers: {
                        "Content-Type":
                          "application/json",
                      },
                      body: JSON.stringify({
                        profileId: profile.id,
                      }),
                    }
                  );

                  const data = await res.json();

                  alert(data.message);

                  if (res.ok) {
                    location.reload();
                  }

                }}
                className="rounded-xl bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700"
              >
                ✅ Approve
              </button>

              <button
                onClick={async () => {

                  const ok = confirm(
                    "Reject this profile?"
                  );

                  if (!ok) return;

                  const res = await fetch(
                    "/api/admin/profiles/reject",
                    {
                      method: "POST",
                      headers: {
                        "Content-Type":
                          "application/json",
                      },
                      body: JSON.stringify({
                        profileId: profile.id,
                      }),
                    }
                  );

                  const data = await res.json();

                  alert(data.message);

                  if (res.ok) {
                    location.reload();
                  }

                }}
                className="rounded-xl bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700"
              >
                ❌ Reject
              </button>

              <Link
                href={`/profile/edit?id=${profile.id}`}
                className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
              >
                ✏️ Edit
              </Link>

              <button
                onClick={() => {
                  alert(
                    "Delete feature will be implemented next."
                  );
                }}
                className="rounded-xl bg-gray-800 px-6 py-3 font-semibold text-white hover:bg-black"
              >
                🗑 Delete
              </button>

            </div>

          </div>

        </div>

      </div>

    </div>

  );

}