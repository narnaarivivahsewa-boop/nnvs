import Link from "next/link";
import { FileText, ExternalLink } from "lucide-react";

interface PaymentRowProps {
  payment: any;
}

export default function PaymentRow({
  payment,
}: PaymentRowProps) {
  return (
    <tr className="border-b hover:bg-[#FAF8F5] transition-colors">
      <td className="px-4 py-3.5 font-medium text-gray-900">
        {payment.user?.fullName || "-"}
      </td>

      <td className="px-4 py-3.5 font-mono text-gray-600 text-xs">
        {payment.user?.mobile || "-"}
      </td>

      <td className="px-4 py-3.5 font-bold text-[#4A121A]">
        ₹{Number(payment.amount).toFixed(2)}
      </td>

      <td className="px-4 py-3.5">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${
            payment.status === "SUCCESS"
              ? "bg-emerald-100 text-emerald-800"
              : payment.status === "FAILED"
              ? "bg-red-100 text-red-700"
              : payment.status === "REFUNDED"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          {payment.status}
        </span>
      </td>

      <td className="px-4 py-3.5 font-mono text-xs text-gray-600 break-all">
        {payment.transactionId || "-"}
      </td>

      <td className="px-4 py-3.5 text-xs text-gray-600">
        {payment.paymentGateway || "Online"}
      </td>

      <td className="px-4 py-3.5 text-xs text-gray-600 whitespace-nowrap">
        {new Date(payment.createdAt).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}
      </td>

      <td className="px-4 py-3.5 text-center">
        <Link
          href={`/invoice/${payment.id}`}
          target="_blank"
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#FAF5EB] px-3 py-1.5 text-xs font-bold text-[#7A5835] border border-[#DACBB4] hover:bg-[#F2E8D7] transition shadow-sm"
        >
          <FileText className="h-3.5 w-3.5 text-[#C5A059]" />
          <span>GST Invoice</span>
          <ExternalLink className="h-3 w-3 text-gray-400" />
        </Link>
      </td>
    </tr>
  );
}