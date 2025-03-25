import * as React from "react";
import { cn } from "../../lib/utils";

const Select = React.forwardRef(({ className, ...props }, ref) => (
  <select
    className={cn(
      "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    ref={ref}
    {...props}
  />
));
Select.displayName = "Select";

const SelectGroup = React.forwardRef(({ className, ...props }, ref) => (
  <optgroup className={cn("", className)} ref={ref} {...props} />
));
SelectGroup.displayName = "SelectGroup";

const SelectOption = React.forwardRef(({ className, ...props }, ref) => (
  <option className={cn("", className)} ref={ref} {...props} />
));
SelectOption.displayName = "SelectOption";

export { Select, SelectGroup, SelectOption };
