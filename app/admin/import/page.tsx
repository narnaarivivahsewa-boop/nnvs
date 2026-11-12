"use client";

import { useState } from "react";
import { getAuthSession } from "@/lib/auth/session-storage";

export default function ImportMembersPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusNotice, setStatusNotice] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  async function handleImport() {
    if (loading) return;
    if (!file) {
      setStatusNotice({ text: "Please select an Excel or CSV file first.", type: "error" });
      return;
    }

    try {
      setLoading(true);
      setStatusNotice(null);

      const { token } = await getAuthSession();
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/import", {
        method: "POST",
        headers,
        credentials: "include",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Import failed.");
      }

      setStatusNotice({
        text: `Import Successful (${data.imported} Profiles Imported)`,
        type: "success",
      });

    } catch (error: any) {
      setStatusNotice({
        text: error?.message || "Import failed.",
        type: "error",
      });
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
          onChange={(e) => {
            setFile(e.target.files?.[0] || null);
            setStatusNotice(null);
          }}
          className="mb-6 block w-full rounded-xl border p-3"
        />

        <button
          type="button"
          onClick={handleImport}
          disabled={loading}
          className="w-full rounded-xl bg-red-700 py-3 font-semibold text-white hover:bg-red-800 disabled:opacity-50"
        >
          {loading ? "Importing..." : "Import Excel"}
        </button>

        {statusNotice && (
          <div
            role="alert"
            className={`mt-6 rounded-xl border p-4 text-sm font-semibold ${
              statusNotice.type === "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-800"
            }`}
          >
            {statusNotice.text}
          </div>
        )}
      </div>
    </div>
  );
}