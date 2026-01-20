import * as React from "react";

import { cn } from "@/lib/utils";

type AvatarProps = React.HTMLAttributes<HTMLDivElement> & {
  src?: string;
  alt?: string;
};

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(({ className, src, alt, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted", className)}
      {...props}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="aspect-square h-full w-full" src={src} alt={alt ?? "Avatar"} />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">{alt?.slice(0, 2) ?? "MS"}</div>
      )}
    </div>
  );
});
Avatar.displayName = "Avatar";

export { Avatar };
