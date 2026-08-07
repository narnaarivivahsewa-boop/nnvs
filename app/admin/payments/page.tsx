"use client";

import { useEffect, useState } from "react";
import PaymentFilter from "./PaymentFilter";
import PaymentTable from "./PaymentTable";

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = async () => {
    try {
      const res = await fetch("/api/admin/payments");

      const data = await res.json();

      if (data.success) {
        setPayments(data.payments);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  return (
    <div className="p-8">

      <h1 className="text-3xl font-bold mb-6">
        Payments
      </h1>

      <PaymentFilter />

      {loading ? (
        <div className="mt-6 text-lg">
          Loading Payments...
        </div>
      ) : (
        <PaymentTable payments={payments} />
      )}

    </div>
  );
}