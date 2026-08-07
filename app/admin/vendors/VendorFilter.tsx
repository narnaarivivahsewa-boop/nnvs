"use client";

export default function VendorFilter() {
  return (
    <div className="rounded-xl bg-white p-4 shadow">

      <div className="flex flex-col gap-4 md:flex-row">

        <input
          type="text"
          placeholder="Search Vendor..."
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-red-600 focus:outline-none"
        />

        <select
          className="rounded-lg border border-gray-300 px-4 py-2 focus:border-red-600 focus:outline-none"
        >
          <option value="">All Categories</option>
          <option value="Photographer">
            Photographer
          </option>
          <option value="Catering">
            Catering
          </option>
          <option value="Decoration">
            Decoration
          </option>
          <option value="Pandit">
            Pandit
          </option>
          <option value="Marriage Palace">
            Marriage Palace
          </option>
          <option value="Band">
            Band
          </option>
          <option value="Beauty Parlour">
            Beauty Parlour
          </option>
        </select>

        <select
          className="rounded-lg border border-gray-300 px-4 py-2 focus:border-red-600 focus:outline-none"
        >
          <option value="">All Status</option>
          <option value="APPROVED">
            Approved
          </option>
          <option value="PENDING">
            Pending
          </option>
          <option value="REJECTED">
            Rejected
          </option>
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