import * as React from "react";

import { cn } from "@/lib/utils";

type SeparatorProps = React.HTMLAttributes<HTMLDivElement>;

const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("shrink-0 bg-border", className)}
    role="none"
    {...props}
  />
));
Separator.displayName = "Separator";

export { Separator };
