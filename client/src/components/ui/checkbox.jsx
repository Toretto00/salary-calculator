import * as React from "react";
import { cn } from "../../lib/utils";

const Checkbox = React.forwardRef(({ className, checked, ...props }, ref) => (
  <input
    type="checkbox"
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      className
    )}
    ref={ref}
    checked={checked}
    {...props}
  />
));
Checkbox.displayName = "Checkbox";

export { Checkbox };
