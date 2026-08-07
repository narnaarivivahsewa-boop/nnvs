import PaymentRow from "./PaymentRow";

interface PaymentTableProps {
  payments: any[];
}

export default function PaymentTable({
  payments,
}: PaymentTableProps) {
  return (
    <div className="mt-6 overflow-x-auto rounded-xl bg-white shadow">

      <table className="min-w-full">

        <thead className="bg-red-700 text-white">

          <tr>

            <th className="px-4 py-3 text-left">
              User
            </th>

            <th className="px-4 py-3 text-left">
              Mobile
            </th>

            <th className="px-4 py-3 text-left">
              Amount
            </th>

            <th className="px-4 py-3 text-left">
              Status
            </th>

            <th className="px-4 py-3 text-left">
              Transaction ID
            </th>

            <th className="px-4 py-3 text-left">
              Gateway
            </th>

            <th className="px-4 py-3 text-left">
              Date
            </th>

          </tr>

        </thead>

        <tbody>

          {payments.length === 0 ? (

            <tr>

              <td
                colSpan={7}
                className="p-8 text-center text-gray-500"
              >
                No Payments Found
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