    "use client";

import { useEffect, useState } from "react";

export default function FeaturedProfiles() {
  const [profiles, setProfiles] = useState<any[]>([]);

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
  } catch (err) {
    console.error(err);
  }
}

  return (
    <section className="bg-white py-24">

      <div className="max-w-7xl mx-auto px-6">

        <h2 className="text-5xl font-bold text-center text-red-900">
          Featured Profiles
        </h2>

        <p className="text-center text-gray-500 mt-4">
          Verified Members from NNVS Matrimony
        </p>

        <div className="grid md:grid-cols-3 gap-10 mt-16">

          {profiles.map((profile) => (

            <div
              key={profile.id}
              className="bg-white rounded-3xl shadow-xl overflow-hidden hover:-translate-y-2 hover:shadow-2xl duration-300"
            >

              <div className="relative">

                <img
                  src={profile.image}
                  alt={profile.name}
                  className="w-full h-80 object-cover"
                />

                {profile.online && (
                  <span className="absolute top-4 left-4 bg-green-600 text-white text-xs px-3 py-1 rounded-full">
                    🟢 Online
                  </span>
                )}

                <span className="absolute top-4 right-4 bg-white rounded-full p-2 shadow">
                  ❤️
                </span>

              </div>

              <div className="p-6">

                <div className="flex items-center justify-between">

                  <h3 className="text-2xl font-bold">
                    {profile.name}
                  </h3>

                  {profile.verified && (
                    <span className="text-green-600 font-semibold">
                      ✔ Verified
                    </span>
                  )}

                </div>

                <div className="mt-5 space-y-2 text-gray-600">

                  <p><strong>Gender:</strong> {profile.gender}</p>

                  <p><strong>Age:</strong> {profile.age} Years</p>

                  <p><strong>Height:</strong> {profile.height}</p>

                  <p><strong>Education:</strong> {profile.education}</p>

                  <p><strong>Occupation:</strong> {profile.occupation}</p>

                  <p><strong>Religion:</strong> {profile.religion}</p>

                  <p><strong>City:</strong> {profile.city}</p>

                </div>

                <button className="mt-8 w-full bg-red-900 hover:bg-red-800 text-white py-3 rounded-xl">
                  View Full Profile
                </button>

              </div>

            </div>

          ))}

        </div>

      </div>

    </section>
  );
}