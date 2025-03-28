// Simple toast notification utility
const toast = {
  success: (message) => {
    showToast(message, 'success');
  },
  error: (message) => {
    showToast(message, 'error');
  },
  info: (message) => {
    showToast(message, 'info');
  },
  warning: (message) => {
    showToast(message, 'warning');
  }
};

// Helper function to show toast
function showToast(message, type = 'info') {
  // For now, we'll just use console.log for debugging
  console.log(`[${type.toUpperCase()}] ${message}`);
  
  // Create toast element
  const toastContainer = document.getElementById('toast-container') || createToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-message">${message}</div>
  `;
  
  // Add to container
  toastContainer.appendChild(toast);
  
  // Auto remove after 3 seconds
  setTimeout(() => {
    toast.classList.add('toast-fade-out');
    setTimeout(() => {
      toastContainer.removeChild(toast);
      // Remove container if empty
      if (toastContainer.children.length === 0) {
        document.body.removeChild(toastContainer);
      }
    }, 300);
  }, 3000);
}

// Create toast container if it doesn't exist
function createToastContainer() {
  const container = document.createElement('div');
  container.id = 'toast-container';
  container.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
  `;
  document.body.appendChild(container);
  
  // Add toast styles
  if (!document.getElementById('toast-styles')) {
    const styles = document.createElement('style');
    styles.id = 'toast-styles';
    styles.innerHTML = `
      .toast {
        margin-bottom: 10px;
        padding: 15px 20px;
        border-radius: 4px;
        color: white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        opacity: 0.9;
        transition: opacity 0.3s;
      }
      .toast:hover {
        opacity: 1;
      }
      .toast-success {
        background-color: #48bb78;
      }
      .toast-error {
        background-color: #f56565;
      }
      .toast-warning {
        background-color: #ed8936;
      }
      .toast-info {
        background-color: #4299e1;
      }
      .toast-fade-out {
        opacity: 0;
      }
    `;
    document.head.appendChild(styles);
  }
  
  return container;
}

export { toast };
