interface ProgressBarProps {
  step: number;
  totalSteps: number;
}

export default function ProgressBar({
  step,
  totalSteps,
}: ProgressBarProps) {
  const progress = (step / totalSteps) * 100;

  return (
    <div className="mb-10">
      <div className="flex justify-between text-sm font-medium text-gray-600 mb-2">
        <span>
          Step {step} of {totalSteps}
        </span>

        <span>{Math.round(progress)}%</span>
      </div>

      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-red-800 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}