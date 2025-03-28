import React from "react";
import { cn } from "../../lib/utils";

const Dialog = ({ open, onOpenChange, children }) => {
  const [isOpen, setIsOpen] = React.useState(open || false);
  
  React.useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open);
      if (onOpenChange) onOpenChange(open);
    }
  }, [open, onOpenChange]);

  const handleOpenChange = (newState) => {
    setIsOpen(newState);
    if (onOpenChange) onOpenChange(newState);
  };

  return (
    <DialogContext.Provider value={{ open: isOpen, onOpenChange: handleOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
};

const DialogContext = React.createContext({
  open: false,
  onOpenChange: () => {},
});

const useDialog = () => React.useContext(DialogContext);

const DialogTrigger = ({ asChild, children }) => {
  const { onOpenChange } = useDialog();
  
  const handleClick = (e) => {
    e.preventDefault();
    onOpenChange(true);
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

const DialogContent = ({ children, className, ...props }) => {
  const { open, onOpenChange } = useDialog();
  
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
        <button
          className="absolute top-4 right-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          onClick={() => onOpenChange(false)}
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
  );
};

const DialogHeader = ({
  className,
  ...props
}) => (
  <div
    className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}
    {...props}
  />
);

const DialogFooter = ({
  className,
  ...props
}) => (
  <div
    className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4", className)}
    {...props}
  />
);

const DialogTitle = ({
  className,
  ...props
}) => (
  <h3
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
);

const DialogDescription = ({
  className,
  ...props
}) => (
  <p
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
);

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
