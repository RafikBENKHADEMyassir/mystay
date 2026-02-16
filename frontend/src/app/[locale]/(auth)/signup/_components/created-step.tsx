import { CheckCircle2 } from "lucide-react";
import type { SignupStrings } from "../_lib/types";

type CreatedStepProps = {
  strings: SignupStrings;
  onNext: () => void;
};

export function CreatedStep({ strings, onNext }: CreatedStepProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
      <CheckCircle2 className="h-12 w-12 text-emerald-600" />
      <p className="text-xl font-semibold text-foreground">{strings.createdTitle}</p>
      <button
        type="button"
        onClick={onNext}
        className="w-full rounded-2xl bg-foreground py-3 text-sm font-semibold text-background shadow-sm"
      >
        {strings.nextStep}
      </button>
    </div>
  );
}
