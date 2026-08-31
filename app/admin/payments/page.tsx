"use client";

import { useEffect, useState } from "react";
import PaymentFilter from "./PaymentFilter";
import PaymentTable from "./PaymentTable";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPayments() {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/payments");
        const data = await res.json();

        if (data.success && Array.isArray(data.payments)) {
          setPayments(data.payments);
        }
      } catch (err) {
        console.error("Error loading payments:", err);
      } finally {
        setLoading(false);
      }
    }

    loadPayments();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Payments</h1>

      <PaymentFilter />

      {loading ? (
        <div className="mt-6 text-lg">Loading Payments...</div>
      ) : (
        <PaymentTable payments={payments} />
      )}
    </div>
  );
}