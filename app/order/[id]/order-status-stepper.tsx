type Step = {
  id: string;
  label: string;
};

type OrderStatusStepperProps = {
  steps: Step[];
  currentStep: number;
};

export default function OrderStatusStepper({
  steps,
  currentStep,
}: OrderStatusStepperProps) {
  return (
    <ol className="space-y-3" aria-label="Order status progression">
      {steps.map((step, index) => {
        const isComplete = index < currentStep;
        const isCurrent = index === currentStep;

        return (
          <li
            key={step.id}
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
              isCurrent
                ? "border-neutral-900 bg-neutral-50 dark:border-neutral-100 dark:bg-neutral-900"
                : "border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950"
            }`}
          >
            <span
              className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                isComplete
                  ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                  : isCurrent
                    ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                    : "border border-neutral-300 text-transparent dark:border-neutral-700"
              }`}
            >
              {isComplete ? "✓" : "•"}
            </span>
            <span
              className={`text-sm font-medium ${
                isCurrent || isComplete
                  ? "text-neutral-900 dark:text-neutral-100"
                  : "text-neutral-500 dark:text-neutral-400"
              }`}
            >
              {step.label}
            </span>
            {isCurrent ? (
              <span className="ml-auto text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                Current
              </span>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
