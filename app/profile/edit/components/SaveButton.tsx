"use client";

type SaveButtonProps = {
  loading?: boolean;
  uploading?: boolean;
};

export default function SaveButton({
  loading = false,
  uploading = false,
}: SaveButtonProps) {
  return (
    <div className="flex justify-end pt-8">

      <button
        type="submit"
        disabled={loading || uploading}
        className="rounded-xl bg-red-700 px-8 py-3 font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {uploading
          ? "Uploading Photo..."
          : loading
          ? "Saving Changes..."
          : "Save Changes"}
      </button>

    </div>
  );
}