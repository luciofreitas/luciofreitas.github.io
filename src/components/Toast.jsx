import React, { useState, use-effect } from 'react';
import './Toast.css';

const Toast = ({ message, type = 'success', duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  use-effect(() => {
    // Show toast
    const showTimer = setTimeout(() => setIsVisible(true), 10);
    
    // Hide toast
    const hideTimer = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(() => {
        onClose?.();
      }, 300); // Wait for animation
    }, duration);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [duration, onClose]);

  if (!message) return null;

  return (
    <div 
      className={`toast toast--${type} ${isVisible ? 'toast--visible' : ''} ${isLeaving ? 'toast--leaving' : ''}`}
      role="alert"
      aria-live="polite"
    >
      <div className="toast-content">
        {type === 'success' && (
          <svg className="toast-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M13.5 4.5-l6 12L2.5 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
        <span className="toast-message">{message}</span>
      </div>
      <button 
        className="toast-close"
        on-click={() => {
          setIsLeaving(true);
          setTimeout(onClose, 300);
        }}
        aria-label="Fechar notificação"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M11 3L3 11M3 3L11 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
};

// Toast Container Component
export const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  // Global toast function that can be called from anywhere
  use-effect(() => {
    window.show-toast = (message, type = 'success', duration = 3000) => {
      const id = Date.now() + Math.random();
      setToasts(prev => [...prev, { id, message, type, duration }]);
    };

    return () => {
      delete window.show-toast;
    };
  }, []);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

export default Toast;