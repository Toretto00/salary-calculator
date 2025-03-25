import * as React from "react";
import { cn } from "../../lib/utils";

const Sheet = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 opacity-100 data-[state=closed]:opacity-0 transition-opacity",
      className
    )}
    {...props}
  >
    {children}
  </div>
));
Sheet.displayName = "Sheet";

const SheetContent = React.forwardRef(
  ({ className, children, position = "right", ...props }, ref) => {
    const positionClasses = {
      top: "inset-x-0 top-0 border-b",
      bottom: "inset-x-0 bottom-0 border-t",
      left: "inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
      right: "inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "fixed z-50 bg-background shadow-lg transform animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          position === "left" &&
            "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
          position === "right" &&
            "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
          position === "top" &&
            "data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
          position === "bottom" &&
            "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
          positionClasses[position],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
SheetContent.displayName = "SheetContent";

const SheetHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-2 p-6", className)}
    {...props}
  />
));
SheetHeader.displayName = "SheetHeader";

const SheetTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-lg font-semibold text-foreground", className)}
    {...props}
  />
));
SheetTitle.displayName = "SheetTitle";

const SheetDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
SheetDescription.displayName = "SheetDescription";

const SheetFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
));
SheetFooter.displayName = "SheetFooter";

export {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
