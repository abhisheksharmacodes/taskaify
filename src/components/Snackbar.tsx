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
}

const Snackbar = ({
  message,
  type = "success",
  isVisible,
  onClose,
  duration = 4000,
}: SnackbarProps) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);

      // Auto-dismiss after duration
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setTimeout(() => {
          onClose();
        }, 300); // Wait for slide-down animation to complete
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

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

  return (
    <div className="fixed bottom-4 left-4 z-[9999] max-w-sm w-full px-4">
      <div
        className={`
          ${getBgColor()} 
          ${getTextColor()}
          border rounded-lg shadow-lg p-4 
          transform transition-all duration-300 ease-out
          ${isAnimating ? "translate-x-0 opacity-100 scale-100" : "-translate-x-full opacity-0 scale-95"}
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
  );
};

export default Snackbar; 