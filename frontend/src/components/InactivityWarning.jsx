import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { getResponsiveModalClasses, MODAL_SIZES, MODAL_POSITIONS } from '../utils/modalUtils';

const InactivityWarning = () => {
  const { user, updateActivity } = useAppContext();
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes warning
  const WARNING_TIME = 5 * 60; // 5 minutes in seconds
  const INACTIVITY_TIMEOUT = 6 * 60 * 60; // 6 hours in seconds

  useEffect(() => {
    if (!user) return;

    let warningTimer;
    let countdownTimer;

    const checkInactivity = () => {
      const now = Date.now();
      const lastActivity = localStorage.getItem('lastActivity') || now;
      const timeSinceLastActivity = (now - lastActivity) / 1000; // Convert to seconds
      
      const timeUntilLogout = INACTIVITY_TIMEOUT - timeSinceLastActivity;
      
      if (timeUntilLogout <= WARNING_TIME && timeUntilLogout > 0) {
        setShowWarning(true);
        setTimeLeft(Math.floor(timeUntilLogout));
        
        // Start countdown
        countdownTimer = setInterval(() => {
          setTimeLeft(prev => {
            if (prev <= 1) {
              setShowWarning(false);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setShowWarning(false);
      }
    };

    // Check every 30 seconds
    warningTimer = setInterval(checkInactivity, 30000);
    
    // Initial check
    checkInactivity();

    return () => {
      clearInterval(warningTimer);
      clearInterval(countdownTimer);
    };
  }, [user]);

  const handleStayActive = () => {
    updateActivity();
    setShowWarning(false);
    setTimeLeft(WARNING_TIME);
  };

  if (!showWarning || !user) return null;

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const modalClasses = getResponsiveModalClasses({
    size: MODAL_SIZES.MEDIUM,
    position: MODAL_POSITIONS.AUTO,
    scrollable: true
  });

  return (
    <div className={modalClasses.container}>
      <div className={`${modalClasses.modal} p-6 shadow-xl`}>
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Session Timeout Warning
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            You have been inactive for a while. You will be logged out in:
          </p>
          <div className="text-2xl font-bold text-red-600 mb-6">
            {formatTime(timeLeft)}
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleStayActive}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Stay Active
            </button>
            <button
              onClick={() => setShowWarning(false)}
              className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InactivityWarning; 