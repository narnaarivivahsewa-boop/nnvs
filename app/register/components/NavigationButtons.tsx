interface NavigationButtonsProps {
  step: number;
  totalSteps: number;
  isSubmitting?: boolean;
  onNext: () => void;
  onPrevious: () => void;
}

export default function NavigationButtons({
  step,
  totalSteps,
  isSubmitting = false,
  onNext,
  onPrevious,
}: NavigationButtonsProps) {
  return (
    <div className="mt-10 flex justify-between">
      {/* Previous */}
      <button
        type="button"
        onClick={onPrevious}
        disabled={step === 1 || isSubmitting}
        className={`rounded-xl px-6 py-3 font-medium transition ${
          step === 1 || isSubmitting
            ? "cursor-not-allowed bg-gray-200 text-gray-400"
            : "bg-gray-200 text-gray-800 hover:bg-gray-300 cursor-pointer"
        }`}
      >
        Previous
      </button>

      {/* Next / Submit */}
      {step < totalSteps ? (
        <button
          type="button"
          onClick={onNext}
          className="rounded-xl bg-red-800 px-6 py-3 font-medium text-white transition hover:bg-red-900 cursor-pointer"
        >
          Next
        </button>
      ) : (
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-green-700 px-6 py-3 font-medium text-white transition hover:bg-green-800 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer inline-flex items-center gap-2"
        >
          {isSubmitting ? "Submitting..." : "Submit"}
        </button>
      )}
    </div>
  );
}