type Step = { id: string; label: string };
type OrderStatusStepperProps = { steps: Step[]; currentStep: number };

export default function OrderStatusStepper({
  steps,
  currentStep,
}: OrderStatusStepperProps) {
  return (
    <>
      <style>{`
        .oss-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .oss-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 20px;
          border: 1px solid rgba(242,232,213,0.09);
          background: rgba(242,232,213,0.02);
          position: relative;
          transition: border-color 0.2s;
        }
        .oss-item-complete {
          border-color: rgba(191,90,40,0.2);
          background: rgba(191,90,40,0.04);
        }
        .oss-item-current {
          border-color: rgba(192,137,42,0.4);
          background: rgba(192,137,42,0.07);
        }

        /* Connector line between steps */
        .oss-item:not(:last-child)::after {
          content: '';
          position: absolute;
          left: 27px;
          bottom: -2px;
          width: 1px;
          height: 2px;
          background: rgba(242,232,213,0.09);
          z-index: 1;
        }

        .oss-indicator {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 500;
          border: 1px solid rgba(242,232,213,0.12);
          color: transparent;
          background: transparent;
          transition: all 0.2s;
        }
        .oss-indicator-complete {
          background: var(--terra, #BF5A28);
          border-color: var(--terra, #BF5A28);
          color: var(--cream, #F2E8D5);
        }
        .oss-indicator-current {
          background: var(--gold, #C0892A);
          border-color: var(--gold, #C0892A);
          color: var(--espresso, #0A0704);
        }

        .oss-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 400;
          color: rgba(242,232,213,0.25);
          letter-spacing: 0.04em;
          flex: 1;
        }
        .oss-label-done { color: var(--sand, #C9B99A); }
        .oss-label-current { color: var(--cream, #F2E8D5); font-weight: 500; }

        .oss-badge {
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--gold, #C0892A);
          border: 1px solid rgba(192,137,42,0.35);
          background: rgba(192,137,42,0.08);
          padding: 3px 10px;
          flex-shrink: 0;
        }
        .oss-check {
          font-size: 9px;
          color: var(--terra, #BF5A28);
          flex-shrink: 0;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
      `}</style>

      <ol className="oss-list" aria-label="Order status progression">
        {steps.map((step, index) => {
          const isLastStep = index === steps.length - 1;
          const isFinalCompleted = currentStep === steps.length - 1;

          // Treat earlier steps as complete when their index is less than currentStep.
          // If we're on the final step, treat the final step as complete (so it shows "Done").
          const isComplete =
            index < currentStep || (isLastStep && isFinalCompleted);

          // Show "current" only for non-final steps that match currentStep.
          const isCurrent =
            index === currentStep && !(isLastStep && isFinalCompleted);

          return (
            <li
              key={step.id}
              className={`oss-item${isComplete ? " oss-item-complete" : ""}${isCurrent ? " oss-item-current" : ""}`}
            >
              <span
                className={`oss-indicator${isComplete ? " oss-indicator-complete" : ""}${isCurrent ? " oss-indicator-current" : ""}`}
                aria-hidden="true"
              >
                {isComplete ? "✓" : isCurrent ? "●" : ""}
              </span>

              <span
                className={`oss-label${isComplete ? " oss-label-done" : ""}${isCurrent ? " oss-label-current" : ""}`}
              >
                {step.label}
              </span>

              {isCurrent && <span className="oss-badge">In progress</span>}
              {isComplete && <span className="oss-check">Done</span>}
            </li>
          );
        })}
      </ol>
    </>
  );
}
