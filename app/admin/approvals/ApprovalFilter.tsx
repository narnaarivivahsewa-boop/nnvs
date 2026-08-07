"use client";

export default function ApprovalFilter() {
  return (
    <div className="rounded-xl bg-white p-4 shadow">

      <div className="flex flex-col gap-4 md:flex-row">

        <input
          type="text"
          placeholder="Search by Name, Profile ID or Mobile..."
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-red-600 focus:outline-none"
        />

        <select
          className="rounded-lg border border-gray-300 px-4 py-2 focus:border-red-600 focus:outline-none"
        >
          <option value="">All Gender</option>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
        </select>

        <button
          className="rounded-lg bg-red-700 px-6 py-2 font-semibold text-white hover:bg-red-800"
        >
          Search
        </button>

      </div>

    </div>
  );
}