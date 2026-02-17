/**
 * StepIndicator Component
 * Shows step buttons for delete/create workflow
 */

type Step = "delete" | "create";

interface StepIndicatorProps {
  readonly currentStep: Step;
  readonly completed: boolean;
  readonly onStepChange: (step: Step) => void;
}

export function StepIndicator({
  currentStep,
  completed,
  onStepChange,
}: StepIndicatorProps) {
  const handleDeleteClick = () => {
    if (!completed) {
      onStepChange("delete");
    }
  };

  const handleDeleteKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === " ") && !completed) {
      e.preventDefault();
      onStepChange("delete");
    }
  };

  const handleCreateClick = () => {
    onStepChange("create");
  };

  const handleCreateKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onStepChange("create");
    }
  };

  // A11Y-004 FIX: Calculate current step number for screen readers
  const currentStepNumber = currentStep === "delete" ? 1 : 2;
  const totalSteps = 2;

  return (
    // A11Y-004 FIX: Added role="region" and aria-label for container,
    // and aria-current for current step indication
    <nav
      className="flex gap-4"
      role="navigation"
      aria-label={`Admin account management steps, currently on step ${currentStepNumber} of ${totalSteps}`}
    >
      <button
        type="button"
        className={`flex-1 p-3 rounded-lg text-center cursor-pointer transition ${
          currentStep === "delete"
            ? "bg-primary text-white"
            : "bg-surface text-text-secondary hover:bg-surface-dark"
        }`}
        onClick={handleDeleteClick}
        onKeyDown={handleDeleteKeyDown}
        aria-label="Step 1: Delete admin account"
        aria-current={currentStep === "delete" ? "step" : undefined}
      >
        <p className="text-sm font-semibold">Step 1: Delete</p>
      </button>
      <button
        type="button"
        className={`flex-1 p-3 rounded-lg text-center cursor-pointer transition ${
          currentStep === "create"
            ? "bg-primary text-white"
            : "bg-surface text-text-secondary hover:bg-surface-dark"
        }`}
        onClick={handleCreateClick}
        onKeyDown={handleCreateKeyDown}
        aria-label="Step 2: Create admin account"
        aria-current={currentStep === "create" ? "step" : undefined}
      >
        <p className="text-sm font-semibold">Step 2: Create</p>
      </button>
    </nav>
  );
}
