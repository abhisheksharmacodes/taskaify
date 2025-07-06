"use client";

import { useState, useEffect, ReactNode } from "react";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";

export type SnackbarType = "success" | "error";

interface SnackbarProps {
  message: ReactNode;
  type?: SnackbarType;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
  position?: 'top' | 'bottom';
  direction?: 'up' | 'down';
}

const snackbarStyle = `
@keyframes snackbar-in-down {
  from { opacity: 0; transform: translateY(-32px) scale(0.95);}
  to   { opacity: 1; transform: translateY(0) scale(1);}
}
@keyframes snackbar-out-up {
  from { opacity: 1; transform: translateY(0) scale(1);}
  to   { opacity: 0; transform: translateY(-32px) scale(0.95);}
}
@keyframes snackbar-in-up {
  from { opacity: 0; transform: translateY(32px) scale(0.95);}
  to   { opacity: 1; transform: translateY(0) scale(1);}
}
@keyframes snackbar-out-down {
  from { opacity: 1; transform: translateY(0) scale(1);}
  to   { opacity: 0; transform: translateY(32px) scale(0.95);}
}
.snackbar-animate-in-down { animation: snackbar-in-down 0.3s cubic-bezier(0.22,1,0.36,1) both; }
.snackbar-animate-out-up { animation: snackbar-out-up 0.3s cubic-bezier(0.22,1,0.36,1) both; }
.snackbar-animate-in-up { animation: snackbar-in-up 0.3s cubic-bezier(0.22,1,0.36,1) both; }
.snackbar-animate-out-down { animation: snackbar-out-down 0.3s cubic-bezier(0.22,1,0.36,1) both; }
`;

const Snackbar = ({
  message,
  type = "success",
  isVisible,
  onClose,
  duration = 4000,
  position = 'bottom',
  direction = 'up',
}: SnackbarProps) => {
  const [visible, setVisible] = useState(false);
  const [animationClass, setAnimationClass] = useState('');

  useEffect(() => {
    if (isVisible) {
      setVisible(true);
      setAnimationClass(direction === 'down' ? 'snackbar-animate-in-down' : 'snackbar-animate-in-up');
    } else if (visible) {
      setAnimationClass(direction === 'down' ? 'snackbar-animate-out-up' : 'snackbar-animate-out-down');
      const timer = setTimeout(() => {
        setVisible(false);
        onClose();
      }, 300); // match animation duration
      return () => clearTimeout(timer);
    }
  }, [isVisible, direction, visible, onClose]);

  if (!visible) return null;

  const getIcon = () => {
    switch (type) {
      case "success":
        return <FaCheckCircle className="h-5 w-5 text-green-500" />;
      case "error":
        return <FaTimesCircle className="h-5 w-5 text-red-500" />;
      default:
        return <FaCheckCircle className="h-5 w-5 text-green-500" />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-200";
      case "error":
        return "bg-red-50 border-red-200";
      default:
        return "bg-green-50 border-green-200";
    }
  };

  const getTextColor = () => {
    switch (type) {
      case "success":
        return "text-green-800";
      case "error":
        return "text-red-800";
      default:
        return "text-green-800";
    }
  };

  // Positioning
  const positionClass = position === 'top'
    ? 'top-4 left-1/2 transform -translate-x-1/2'
    : 'bottom-4 left-1/2 transform -translate-x-1/2';

  return (
    <>
      <style>{snackbarStyle}</style>
      <div className={`fixed ${positionClass} z-[9999] w-full max-w-sm px-4 flex justify-center`}>
        <div
          className={`
            ${getBgColor()} 
            ${getTextColor()}
            border rounded-lg shadow-lg p-4 
            ${animationClass}
          `}
        >
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">{getIcon()}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-left">{message}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Snackbar; 