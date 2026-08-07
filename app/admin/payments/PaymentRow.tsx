interface PaymentRowProps {
  payment: any;
}

export default function PaymentRow({
  payment,
}: PaymentRowProps) {
  return (
    <tr className="border-b hover:bg-gray-50">

      <td className="px-4 py-3">
        {payment.user?.fullName || "-"}
      </td>

      <td className="px-4 py-3">
        {payment.user?.mobile || "-"}
      </td>

      <td className="px-4 py-3 font-semibold">
        ₹{payment.amount}
      </td>

      <td className="px-4 py-3">
        <span
          className={`rounded-full px-3 py-1 text-sm font-medium ${
            payment.status === "SUCCESS"
              ? "bg-green-100 text-green-700"
              : payment.status === "FAILED"
              ? "bg-red-100 text-red-700"
              : payment.status === "REFUNDED"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          {payment.status}
        </span>
      </td>

      <td className="px-4 py-3">
        {payment.transactionId || "-"}
      </td>

      <td className="px-4 py-3">
        {payment.paymentGateway || "-"}
      </td>

      <td className="px-4 py-3">
        {new Date(payment.createdAt).toLocaleDateString("en-IN")}
      </td>

    </tr>
  );
}