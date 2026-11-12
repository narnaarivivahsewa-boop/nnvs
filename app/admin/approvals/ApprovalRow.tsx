"use client";

import { useState } from "react";
import { getAuthSession } from "@/lib/auth/session-storage";

interface ApprovalRowProps {
  profile: any;
  refresh: () => void;
  onNotify?: (message: string, type: "success" | "error") => void;
}

export default function ApprovalRow({
  profile,
  refresh,
  onNotify,
}: ApprovalRowProps) {
  const [processingAction, setProcessingAction] = useState<"APPROVE" | "REJECT" | null>(null);
  const [inlineNotice, setInlineNotice] = useState<{ text: string; type: "success" | "error" } | null>(null);

  async function updateStatus(
    action: "APPROVE" | "REJECT"
  ) {
    if (processingAction) return;
    try {
      setProcessingAction(action);
      setInlineNotice(null);

      const { token } = await getAuthSession();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(
        `/api/admin/approvals/${profile.id}`,
        {
          method: "PATCH",
          headers,
          credentials: "include",
          body: JSON.stringify({
            action,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        const msg = data.message || `Failed to ${action.toLowerCase()} profile.`;
        if (onNotify) {
          onNotify(msg, "error");
        } else {
          setInlineNotice({ text: msg, type: "error" });
        }
        return;
      }

      const msg = data.message || `Profile ${action.toLowerCase()}d successfully.`;
      if (onNotify) {
        onNotify(msg, "success");
      } else {
        setInlineNotice({ text: msg, type: "success" });
      }

      refresh();

    } catch (error) {
      console.error(error);
      const msg = "Something went wrong while updating approval status.";
      if (onNotify) {
        onNotify(msg, "error");
      } else {
        setInlineNotice({ text: msg, type: "error" });
      }
    } finally {
      setProcessingAction(null);
    }
  }

  return (
    <tr className="border-b hover:bg-gray-50">

      <td className="px-4 py-3">
        <div className="font-bold text-gray-900">{profile.profileId}</div>
        {profile.legacyProfileId && (
          <span className="inline-block mt-0.5 rounded bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-300">
            Old ID: {profile.legacyProfileId}
          </span>
        )}
        {profile.source === "GOOGLE_FORM" && (
          <span className="block text-[10px] text-gray-500 font-medium mt-0.5">
            Via Google Form
          </span>
        )}
      </td>

      <td className="px-4 py-3 font-medium">
        {profile.user?.fullName}
      </td>

      <td className="px-4 py-3">
        {profile.user?.mobile}
      </td>

      <td className="px-4 py-3">
        {profile.user?.gender}
      </td>

      <td className="px-4 py-3">
        {profile.education?.highestQualification || "-"}
      </td>

      <td className="px-4 py-3">
        {profile.occupation?.profession || "-"}
      </td>

      <td className="px-4 py-3">

        <div className="flex gap-2">

          <button
            type="button"
            disabled={processingAction !== null}
            onClick={() => updateStatus("APPROVE")}
            className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
          >
            {processingAction === "APPROVE" ? "Approving..." : "Approve"}
          </button>

          <button
            type="button"
            disabled={processingAction !== null}
            onClick={() => updateStatus("REJECT")}
            className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
          >
            {processingAction === "REJECT" ? "Rejecting..." : "Reject"}
          </button>

        </div>
        {inlineNotice && (
          <p
            className={`mt-1.5 text-xs font-semibold ${
              inlineNotice.type === "error" ? "text-red-600" : "text-emerald-700"
            }`}
          >
            {inlineNotice.text}
          </p>
        )}

      </td>

    </tr>
  );
}