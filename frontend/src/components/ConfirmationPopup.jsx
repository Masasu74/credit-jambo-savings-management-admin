// src/components/ConfirmationPopup.jsx
import React, { useState, useEffect } from "react";
import InputField from "./InputField";
import { getResponsiveModalClasses, MODAL_SIZES, MODAL_POSITIONS } from "../utils/modalUtils";
import { useScrollPosition, getScrollBasedModalClasses } from "../hooks/useScrollPosition";
import { usePopupAnimation } from "../hooks/usePopupAnimation";
import "../styles/popupAnimations.css";

const ConfirmationPopup = ({ 
  isOpen = false,
  message, 
  onConfirm, 
  onCancel, 
  inputValue, 
  onInputChange, 
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger"
}) => {
  // Use dedicated animation hook
  const { shouldRender, isVisible, isInitialRender, isAnimating } = usePopupAnimation(isOpen);

  // Get scroll position and determine optimal placement
  const { placement } = useScrollPosition();
  
  // Only apply scroll-based animations after initial render
  const shouldAnimatePosition = !isInitialRender && isVisible;
  const modalClasses = getScrollBasedModalClasses(placement, shouldAnimatePosition && isAnimating);

  // Check if message is a string or JSX element
  const isJSX = React.isValidElement(message);
  const messageStr = typeof message === 'string' ? message : '';
  const isAmount = messageStr.toLowerCase().includes("amount");

  // Determine button styles based on variant
  const getConfirmButtonStyle = () => {
    switch (variant) {
      case "secondary":
        return "px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700";
      case "success":
        return "px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700";
      case "danger":
      default:
        return "px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700";
    }
  };

  if (!shouldRender) return null;

  return (
    <div className={`${modalClasses.container} transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className={`${modalClasses.modal} popup-content transition-all duration-300 ease-out ${isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2'} ${isAnimating ? 'popup-enhanced-pulse' : ''}`}>
        <div className="p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Confirmation</h2>
        
        {/* Render message content */}
        <div className="mb-4">
          {isJSX ? message : <p className="text-gray-700 dark:text-gray-300">{messageStr}</p>}
        </div>

        {/* 👇 Input field for disbursed amount or rejection reason */}
        {onInputChange && !isJSX && (
          <div className="mb-4">
            <InputField
              label={isAmount ? "Disbursed Amount" : "Rejection Reason"}
              type={isAmount ? "number" : "text"}
              value={inputValue}
              onChange={(e) => onInputChange(e.target.value)}
              required
            />
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            className={`popup-button px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors`}
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            className={`popup-button ${getConfirmButtonStyle()}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationPopup;
