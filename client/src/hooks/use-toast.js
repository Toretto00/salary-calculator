import React from "react";

// Simple toast context
const ToastContext = React.createContext({
  toast: () => {},
});

// Toast provider component
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = React.useState([]);

  const toast = React.useCallback(
    ({ title, description, variant = "default", duration = 5000 }) => {
      const id = Math.random().toString(36).substring(2, 9);
      
      setToasts((prev) => [...prev, { id, title, description, variant, duration }]);
      
      // Auto-dismiss toast after duration
      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, duration);
      
      return id;
    },
    []
  );

  const dismiss = React.useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // Toast component
  const Toast = ({ toast }) => {
    // Remove 'id' from the destructured variables since it's not used
    const { title, description, variant } = toast;
    
    const bgColor = {
      default: "bg-white",
      success: "bg-green-50",
      error: "bg-red-50",
      destructive: "bg-red-50",
      warning: "bg-yellow-50",
    }[variant] || "bg-white";
    
    const borderColor = {
      default: "border-gray-200",
      success: "border-green-200",
      error: "border-red-200",
      destructive: "border-red-200",
      warning: "border-yellow-200",
    }[variant] || "border-gray-200";
    
    return (
      <div
        className={`rounded-lg border ${borderColor} ${bgColor} shadow-lg p-4 mb-2`}
        role="alert"
      >
        {title && (
          <h5 className="font-medium text-sm mb-1">{title}</h5>
        )}
        {description && (
          <div className="text-sm text-gray-700">{description}</div>
        )}
      </div>
    );
  };

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      
      {/* Toast container */}
      {toasts.length > 0 && (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-xs w-full">
          {toasts.map((t) => (
            <Toast key={t.id} toast={t} />
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
};

// Hook to use toast
export const useToast = () => {
  const context = React.useContext(ToastContext);
  
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  
  return context;
};
