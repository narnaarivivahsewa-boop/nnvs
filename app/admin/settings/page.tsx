"use client";

import { useEffect, useState } from "react";
import { Save, ShieldCheck, CheckCircle2 } from "lucide-react";
import { BUSINESS_INFO } from "@/lib/gst";

interface AdminSettingsForm {
  registrationFee: string;
  gstPercentage: string;
  qrCodeUrl: string;
  qrUpiId: string;
  registrationEnabled: boolean;
  autoApproveProfiles: boolean;
  maintenanceMode: boolean;
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [form, setForm] = useState<AdminSettingsForm>({
    registrationFee: "1100",
    gstPercentage: "18",
    qrCodeUrl: String(BUSINESS_INFO.qrCodeUrl),
    qrUpiId: String(BUSINESS_INFO.upiId),
    registrationEnabled: true,
    autoApproveProfiles: false,
    maintenanceMode: false,
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/settings");
        const data = await res.json();
        if (data.success && data.settings) {
          setForm({
            registrationFee: String(data.settings.registrationFee || "1100"),
            gstPercentage: String(data.settings.gstPercentage || "18"),
            qrCodeUrl: data.settings.qrCodeUrl || BUSINESS_INFO.qrCodeUrl,
            qrUpiId: data.settings.qrUpiId || BUSINESS_INFO.upiId,
            registrationEnabled: Boolean(data.settings.registrationEnabled),
            autoApproveProfiles: Boolean(data.settings.autoApproveProfiles),
            maintenanceMode: Boolean(data.settings.maintenanceMode),
          });
        }
      } catch (err) {
        console.error("Error loading settings:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSuccessMessage("");
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.message || "Failed to save settings");
        return;
      }
      setSuccessMessage("Business & Payment settings saved successfully!");
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err: any) {
      console.error("Save settings error:", err);
      alert("Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-10 text-gray-500 font-semibold">Loading Business Settings...</div>;
  }

  return (
    <div className="p-6 sm:p-10 max-w-4xl">
      <h1 className="text-3xl font-black text-gray-900 font-serif-luxury">
        Business & Payment Settings
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Configure registration fees, GST calculation rates, QR payment UPI details, and platform controls.
      </p>

      {successMessage && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-sm font-bold text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        {/* Pricing & GST */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 space-y-4">
          <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide">
            Pricing & GST Configuration
          </h2>

          <div className="grid sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-gray-700 mb-1.5">
                Default Registration Fee (₹ Taxable Base)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={form.registrationFee}
                onChange={(e) => setForm({ ...form, registrationFee: e.target.value })}
                className="w-full rounded-xl border border-gray-300 p-3 font-mono font-bold text-gray-900 outline-none focus:border-[#4A121A]"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1.5">
                Configured GST Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={form.gstPercentage}
                onChange={(e) => setForm({ ...form, gstPercentage: e.target.value })}
                className="w-full rounded-xl border border-gray-300 p-3 font-mono font-bold text-gray-900 outline-none focus:border-[#4A121A]"
              />
            </div>
          </div>
        </div>

        {/* QR Code & UPI Details */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 space-y-4">
          <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide">
            Manual Payment QR & UPI Configuration
          </h2>

          <div className="grid sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-gray-700 mb-1.5">
                Primary UPI ID for Payments
              </label>
              <input
                type="text"
                required
                value={form.qrUpiId}
                onChange={(e) => setForm({ ...form, qrUpiId: e.target.value })}
                className="w-full rounded-xl border border-gray-300 p-3 font-mono font-bold text-gray-900 outline-none focus:border-[#4A121A]"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1.5">
                QR Code Image URL / Path
              </label>
              <input
                type="text"
                required
                value={form.qrCodeUrl}
                onChange={(e) => setForm({ ...form, qrCodeUrl: e.target.value })}
                className="w-full rounded-xl border border-gray-300 p-3 font-mono text-gray-900 outline-none focus:border-[#4A121A]"
              />
            </div>
          </div>
        </div>

        {/* Registered GST Entity Information (Read-only reference) */}
        <div className="rounded-2xl bg-[#FAF6EF] p-6 border border-[#E8DCC8] space-y-2 text-xs text-gray-700">
          <div className="flex items-center gap-1.5 text-[#7A5835] font-bold uppercase tracking-wider">
            <ShieldCheck className="h-4 w-4 text-[#C5A059]" />
            <span>Registered Legal Entity (As per GST Certificate)</span>
          </div>
          <div className="grid sm:grid-cols-3 gap-3 pt-2 text-xs">
            <div>
              <span className="text-gray-500 block">Trade Name:</span>
              <strong className="text-gray-900">{BUSINESS_INFO.tradeName}</strong>
            </div>
            <div>
              <span className="text-gray-500 block">Proprietor:</span>
              <strong className="text-gray-900">{BUSINESS_INFO.proprietor}</strong>
            </div>
            <div>
              <span className="text-gray-500 block">GSTIN:</span>
              <strong className="text-gray-900 font-mono">{BUSINESS_INFO.gstin}</strong>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-[#4A121A] px-8 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-[#380C13] transition disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? "Saving Settings..." : "Save Settings"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}