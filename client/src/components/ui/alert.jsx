import React from "react";
import { cn } from "../../lib/utils";

const Alert = React.forwardRef(({
  className,
  variant = "default",
  children,
  ...props
}, ref) => {
  const variantStyles = {
    default: "bg-slate-50 text-slate-900 border-slate-200",
    destructive: "bg-red-50 text-red-900 border-red-200",
  };

  return (
    <div
      ref={ref}
      className={cn(
        "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef(({
  className,
  children,
  ...props
}, ref) => {
  if (!children) {
    return null;
  }
  
  return (
    <h5
      ref={ref}
      className={cn("mb-1 font-medium leading-none tracking-tight", className)}
      {...props}
    >
      {children}
    </h5>
  );
});
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef(({
  className,
  ...props
}, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
