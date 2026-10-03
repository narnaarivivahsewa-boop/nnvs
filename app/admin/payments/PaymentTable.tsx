import PaymentRow from "./PaymentRow";

interface PaymentTableProps {
  payments: any[];
}

export default function PaymentTable({
  payments,
}: PaymentTableProps) {
  return (
    <div className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-lg border border-gray-100">
      <table className="min-w-full">
        <thead className="bg-[#4A121A] text-white text-xs uppercase tracking-wider">
          <tr>
            <th className="px-4 py-3.5 text-left">User</th>
            <th className="px-4 py-3.5 text-left">Mobile</th>
            <th className="px-4 py-3.5 text-left">Amount</th>
            <th className="px-4 py-3.5 text-left">Status</th>
            <th className="px-4 py-3.5 text-left">Transaction ID</th>
            <th className="px-4 py-3.5 text-left">Gateway</th>
            <th className="px-4 py-3.5 text-left">Date</th>
            <th className="px-4 py-3.5 text-center">GST Invoice</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100 text-sm">
          {payments.length === 0 ? (
            <tr>
              <td
                colSpan={8}
                className="p-12 text-center text-gray-500 font-medium"
              >
                No Payments Recorded Yet
              </td>
            </tr>
          ) : (
            payments.map((payment: any) => (
              <PaymentRow
                key={payment.id}
                payment={payment}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}