"use client";

import { useState } from "react";

export default function ImportMembersPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleImport() {
    if (!file) {
      alert("Please select an Excel file.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message);
      }

      setMessage(
        `✅ Import Successful (${data.imported} Profiles Imported)`
      );

    } catch (error: any) {
      setMessage(error.message || "Import failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <div className="mx-auto max-w-2xl rounded-2xl bg-white p-8 shadow">

        <h1 className="mb-8 text-3xl font-bold text-red-700">
          Import NNVS Profiles
        </h1>

        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={(e) =>
            setFile(e.target.files?.[0] || null)
          }
          className="mb-6 block w-full rounded-xl border p-3"
        />

        <button
          onClick={handleImport}
          disabled={loading}
          className="w-full rounded-xl bg-red-700 py-3 font-semibold text-white hover:bg-red-800 disabled:opacity-50"
        >
          {loading ? "Importing..." : "Import Excel"}
        </button>

        {message && (
          <div className="mt-6 rounded-xl bg-green-50 p-4 text-green-700">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}