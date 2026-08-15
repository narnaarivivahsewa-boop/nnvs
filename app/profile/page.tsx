"use client";

import { useEffect, useState } from "react";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const res = await fetch("/api/profile");

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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <h2 className="text-xl font-semibold">
          Loading Profile...
        </h2>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <h2 className="text-xl font-semibold text-red-600">
          Profile not found.
        </h2>
      </div>
    );
  }

  const mainPhoto =
    profile.photos?.find((p: any) => p.isPrimary)?.imageUrl ||
    profile.photos?.[0]?.imageUrl ||
    "/default-avatar.png";

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <div className="mx-auto max-w-6xl rounded-3xl bg-white p-8 shadow-xl">

        <div className="flex flex-col gap-8 md:flex-row">

          <div className="md:w-1/3">

            <img
              src={mainPhoto}
              alt="Profile"
              className="h-80 w-full rounded-2xl object-cover border"
            />

          </div>

          <div className="flex-1 space-y-4">

            <h1 className="text-4xl font-bold text-red-800">
              {profile.user.fullName}
            </h1>

            <p>
              <strong>Profile ID:</strong> {profile.profileId}
            </p>

            <p>
              <strong>Mobile:</strong> {profile.user.mobile}
            </p>

            <p>
              <strong>Email:</strong> {profile.user.email}
            </p>

            <p>
              <strong>Gender:</strong> {profile.user.gender}
            </p>

            <p>
              <strong>Religion:</strong> {profile.religion}
            </p>

            <p>
              <strong>Caste:</strong> {profile.caste}
            </p>

            <p>
              <strong>Mother Tongue:</strong> {profile.motherTongue}
            </p>

            <p>
              <strong>Marital Status:</strong> {profile.maritalStatus}
            </p>

            <button
  onClick={() => {
    window.location.href = "/profile/edit";
  }}
  className="mt-6 rounded-xl bg-red-700 px-6 py-3 text-white hover:bg-red-800"
>
  Edit Profile
</button>

          </div>

        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">

          <div className="rounded-xl border p-6">
            <h2 className="mb-4 text-2xl font-bold">
              Family Details
            </h2>

            <p>
              <strong>Father:</strong> {profile.family?.fatherName}
            </p>

            <p>
              <strong>Mother:</strong> {profile.family?.motherName}
            </p>

            <p>
              <strong>Brothers:</strong> {profile.family?.brothers}
            </p>

            <p>
              <strong>Sisters:</strong> {profile.family?.sisters}
            </p>

            <p>
              <strong>Family Type:</strong> {profile.family?.familyType}
            </p>

            <p>
              <strong>Family Status:</strong> {profile.family?.familyStatus}
            </p>

          </div>

          <div className="rounded-xl border p-6">

            <h2 className="mb-4 text-2xl font-bold">
              Education
            </h2>

            <p>
              <strong>Qualification:</strong>{" "}
              {profile.education?.highestQualification}
            </p>

            <p>
              <strong>College:</strong>{" "}
              {profile.education?.college}
            </p>

            <p>
              <strong>Field:</strong>{" "}
              {profile.education?.occupationField}
            </p>

          </div>

          <div className="rounded-xl border p-6">

            <h2 className="mb-4 text-2xl font-bold">
              Occupation
            </h2>

            <p>
              <strong>Profession:</strong>{" "}
              {profile.occupation?.profession}
            </p>

            <p>
              <strong>Company:</strong>{" "}
              {profile.occupation?.company}
            </p>

            <p>
              <strong>Income:</strong>{" "}
              {profile.occupation?.annualIncome}
            </p>

          </div>

          <div className="rounded-xl border p-6">

            <h2 className="mb-4 text-2xl font-bold">
              Partner Preference
            </h2>

            <p>
              <strong>Age:</strong>{" "}
              {profile.partnerPreference?.minAge} -
              {" "}
              {profile.partnerPreference?.maxAge}
            </p>

            <p>
              <strong>Height:</strong>{" "}
              {profile.partnerPreference?.minHeight} -
              {" "}
              {profile.partnerPreference?.maxHeight}
            </p>

            <p>
              <strong>Religion:</strong>{" "}
              {profile.partnerPreference?.preferredReligion}
            </p>

            <p>
              <strong>Caste:</strong>{" "}
              {profile.partnerPreference?.preferredCaste}
            </p>

          </div>

        </div>

      </div>
    </div>
  );
}