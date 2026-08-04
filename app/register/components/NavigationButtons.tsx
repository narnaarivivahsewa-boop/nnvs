interface NavigationButtonsProps {
  step: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
}

export default function NavigationButtons({
  step,
  totalSteps,
  onNext,
  onPrevious,
}: NavigationButtonsProps) {
  return (
    <div className="mt-10 flex justify-between">
      {/* Previous */}
      <button
        type="button"
        onClick={onPrevious}
        disabled={step === 1}
        className={`rounded-xl px-6 py-3 font-medium transition ${
          step === 1
            ? "cursor-not-allowed bg-gray-200 text-gray-400"
            : "bg-gray-200 text-gray-800 hover:bg-gray-300"
        }`}
      >
        Previous
      </button>

      {/* Next / Submit */}
      {step < totalSteps ? (
        <button
          type="button"
          onClick={onNext}
          className="rounded-xl bg-red-800 px-6 py-3 font-medium text-white transition hover:bg-red-900"
        >
          Next
        </button>
      ) : (
        <button
          type="submit"
          className="rounded-xl bg-green-700 px-6 py-3 font-medium text-white transition hover:bg-green-800"
        >
          Submit
        </button>
      )}
    </div>
  );
}