"use client";

export default function PaymentFilter() {
  return (
    <div className="mb-6 rounded-xl bg-white p-4 shadow">

      <div className="flex flex-col gap-4 md:flex-row">

        <input
          type="text"
          placeholder="Search by Name, Mobile or Transaction ID..."
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-red-600 focus:outline-none"
        />

        <select
          className="rounded-lg border border-gray-300 px-4 py-2 focus:border-red-600 focus:outline-none"
        >
          <option value="">All Status</option>
          <option value="SUCCESS">Success</option>
          <option value="PENDING">Pending</option>
          <option value="FAILED">Failed</option>
          <option value="REFUNDED">Refunded</option>
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