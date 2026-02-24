"use client";

import { AlertCircle, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

type ScheduleEntry = {
  day: string;
  mode: "all-day" | "range" | "unavailable";
  from?: string;
  to?: string;
  highlighted?: boolean;
};

type AvailabilityAccordionProps = {
  title: string;
  fromLabel: string;
  toLabel: string;
  openingFrom: string;
  openingTo: string;
  allDayLabel: string;
  unavailableLabel: string;
  rows: ScheduleEntry[];
  expanded: boolean;
  onToggle: () => void;
  openAriaLabel: string;
  closeAriaLabel: string;
};

export function AvailabilityAccordion({
  title,
  fromLabel,
  toLabel,
  openingFrom,
  openingTo,
  allDayLabel,
  unavailableLabel,
  rows,
  expanded,
  onToggle,
  openAriaLabel,
  closeAriaLabel,
}: AvailabilityAccordionProps) {
  return (
    <div className="rounded-md px-2">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-label={expanded ? closeAriaLabel : openAriaLabel}
        className="flex w-full items-center justify-between gap-3 rounded-md py-2 text-left"
      >
        <span className="text-[15px] font-medium text-black/50">{title}</span>

        <span className="flex items-center gap-1.5">
          <span className="text-[15px] text-black">{fromLabel}</span>
          <span className="rounded-[5px] border border-black/10 px-1.5 py-0.5 text-[15px] text-black">
            {openingFrom}
          </span>
          <span className="text-[15px] text-black">{toLabel}</span>
          <span className="rounded-[5px] border border-black/10 px-1.5 py-0.5 text-[15px] text-black">
            {openingTo}
          </span>
          <ChevronDown className={cn("h-4 w-4 text-black/70 transition-transform", expanded && "rotate-180")} />
        </span>
      </button>

      {expanded ? (
        <div className="space-y-2 pb-1 pt-2">
          <p className="text-[15px] font-medium text-black/70">{title}</p>

          {rows.map((row) => (
            <div key={row.day} className="flex items-center gap-2 text-[15px]">
              <span className={cn("w-[60px] text-black/50", row.highlighted && "font-medium text-black")}>{row.day}</span>

              {row.mode === "all-day" ? (
                <span className="rounded-[5px] border border-black/10 px-1.5 py-0.5 text-black/50">
                  {allDayLabel}
                </span>
              ) : null}

              {row.mode === "range" ? (
                <span className="flex items-center gap-1.5">
                  <span className={cn("text-black/50", row.highlighted && "text-black")}>{fromLabel}</span>
                  <span className="rounded-[5px] border border-black/10 px-1.5 py-0.5 text-black/50">
                    {row.from}
                  </span>
                  <span className={cn("text-black/50", row.highlighted && "text-black")}>{toLabel}</span>
                  <span className="rounded-[5px] border border-black/10 px-1.5 py-0.5 text-black/50">
                    {row.to}
                  </span>
                </span>
              ) : null}

              {row.mode === "unavailable" ? (
                <span className="inline-flex items-center gap-1 rounded-[5px] border border-[#b709261a] bg-[#b709261a] px-1.5 py-0.5 text-[#b70926]">
                  <AlertCircle className="h-4 w-4" />
                  {unavailableLabel}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
