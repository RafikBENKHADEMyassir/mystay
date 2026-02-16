import { Handshake } from "lucide-react";
import type { LinkedStay, SignupStrings } from "../_lib/types";

type WelcomeStepProps = {
  strings: SignupStrings;
  linkedStay: LinkedStay | null;
  onCheckIn: () => void;
};

export function WelcomeStep({ strings, linkedStay, onCheckIn }: WelcomeStepProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
      <Handshake className="h-12 w-12 text-foreground" />
      <div className="space-y-2">
        <p className="text-xl font-semibold text-foreground">{strings.welcomeTitle}</p>
        <p className="text-sm text-muted-foreground">{strings.welcomeSubtitle}</p>
        {linkedStay ? (
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{linkedStay.hotelName}</span> ·{" "}
            <span className="font-mono">{linkedStay.confirmationNumber}</span>
          </p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onCheckIn}
        className="w-full rounded-2xl bg-foreground py-3 text-sm font-semibold text-background shadow-sm"
      >
        {strings.doCheckIn}
      </button>
    </div>
  );
}
