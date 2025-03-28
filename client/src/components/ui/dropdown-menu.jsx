import React from "react";
import { cn } from "../../lib/utils";

const DropdownMenu = ({ children }) => {
  const [open, setOpen] = React.useState(false);
  
  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      {children}
    </DropdownMenuContext.Provider>
  );
};

const DropdownMenuContext = React.createContext({
  open: false,
  setOpen: () => {},
});

const useDropdownMenu = () => React.useContext(DropdownMenuContext);

const DropdownMenuTrigger = ({ asChild, children }) => {
  const { open, setOpen } = useDropdownMenu();
  
  const handleClick = (e) => {
    e.preventDefault();
    setOpen(!open);
  };
  
  if (asChild) {
    return React.cloneElement(children, {
      onClick: handleClick,
      "aria-expanded": open,
    });
  }
  
  return (
    <button onClick={handleClick} aria-expanded={open}>
      {children}
    </button>
  );
};

const DropdownMenuContent = ({ 
  children, 
  className, 
  align = "center",
  ...props 
}) => {
  const { open, setOpen } = useDropdownMenu();
  const ref = React.useRef(null);
  
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    };
    
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, setOpen]);
  
  if (!open) return null;
  
  const alignClass = {
    start: "left-0",
    center: "left-1/2 -translate-x-1/2",
    end: "right-0",
  }[align];
  
  return (
    <div
      ref={ref}
      className={cn(
        "absolute z-50 min-w-[8rem] overflow-hidden rounded-md border border-slate-200 bg-white p-1 shadow-md animate-in",
        alignClass,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

const DropdownMenuItem = ({ 
  className,
  onSelect,
  children,
  ...props 
}) => {
  const { setOpen } = useDropdownMenu();
  
  const handleClick = (e) => {
    if (onSelect) {
      onSelect(e);
    } else {
      setOpen(false);
    }
  };
  
  return (
    <button
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-slate-100 focus:text-slate-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full text-left",
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
};

const DropdownMenuLabel = ({
  className,
  ...props
}) => (
  <div
    className={cn("px-2 py-1.5 text-sm font-semibold", className)}
    {...props}
  />
);

const DropdownMenuSeparator = ({
  className,
  ...props
}) => (
  <div
    className={cn("h-px my-1 bg-slate-200", className)}
    {...props}
  />
);

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
};
