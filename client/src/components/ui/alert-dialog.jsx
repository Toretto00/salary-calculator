import React from "react";
import { cn } from "../../lib/utils";

const AlertDialog = ({ children }) => {
  const [open, setOpen] = React.useState(false);
  
  return (
    <AlertDialogContext.Provider value={{ open, setOpen }}>
      {children}
    </AlertDialogContext.Provider>
  );
};

const AlertDialogContext = React.createContext({
  open: false,
  setOpen: () => {},
});

const useAlertDialog = () => React.useContext(AlertDialogContext);

const AlertDialogTrigger = ({ asChild, children }) => {
  const { setOpen } = useAlertDialog();
  
  const handleClick = (e) => {
    e.preventDefault();
    setOpen(true);
  };
  
  if (asChild) {
    return React.cloneElement(children, {
      onClick: handleClick,
    });
  }
  
  return (
    <button onClick={handleClick}>
      {children}
    </button>
  );
};

const AlertDialogContent = ({ children, className, ...props }) => {
  const { open } = useAlertDialog();
  
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div
        className={cn(
          "bg-background rounded-lg shadow-lg p-6 max-w-md w-full max-h-[85vh] overflow-auto animate-in",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </div>
  );
};

const AlertDialogHeader = ({
  className,
  ...props
}) => (
  <div
    className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}
    {...props}
  />
);

const AlertDialogFooter = ({
  className,
  ...props
}) => (
  <div
    className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4", className)}
    {...props}
  />
);

const AlertDialogTitle = ({
  className,
  children,
  ...props
}) => {
  if (!children) {
    return null;
  }
  
  return (
    <h3
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
      {...props}
    >
      {children}
    </h3>
  );
};

const AlertDialogDescription = ({
  className,
  ...props
}) => (
  <p
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
);

const AlertDialogAction = ({ 
  className,
  onClick,
  children,
  ...props 
}) => {
  const { setOpen } = useAlertDialog();
  
  const handleClick = (e) => {
    if (onClick) onClick(e);
    setOpen(false);
  };
  
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4",
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
};

const AlertDialogCancel = ({ 
  className, 
  children,
  ...props 
}) => {
  const { setOpen } = useAlertDialog();
  
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 py-2 px-4",
        className
      )}
      onClick={() => setOpen(false)}
      {...props}
    >
      {children || "Cancel"}
    </button>
  );
};

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};
