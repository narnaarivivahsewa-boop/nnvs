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
    <div className="flex justify-between mt-10">
      {/* Previous Button */}
      <button
        type="button"
        onClick={onPrevious}
        disabled={step === 1}
        className={`px-6 py-3 rounded-xl font-medium transition ${
          step === 1
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : "bg-gray-200 hover:bg-gray-300 text-gray-800"
        }`}
      >
        Previous
      </button>

      {/* Next / Submit Button */}
      <button
        type="button"
        onClick={onNext}
        className="px-6 py-3 rounded-xl bg-red-800 hover:bg-red-900 text-white font-medium transition"
      >
        {step === totalSteps ? "Submit" : "Next"}
      </button>
    </div>
  );
}