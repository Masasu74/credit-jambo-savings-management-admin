import React, { useState } from 'react';
import { FaBell, FaVolumeUp, FaVolumeMute, FaCog } from 'react-icons/fa';
import notificationSounds from '../utils/notificationSounds';

const NotificationSettings = ({ isOpen, onClose }) => {
  const [soundsEnabled, setSoundsEnabled] = useState(notificationSounds.isEnabled);
  const [volume, setVolume] = useState(notificationSounds.volume);

  const handleSoundToggle = () => {
    const newState = !soundsEnabled;
    setSoundsEnabled(newState);
    notificationSounds.setEnabled(newState);
  };

  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume);
    notificationSounds.setVolume(newVolume);
  };

  const handleTestSound = () => {
    notificationSounds.play('medium');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <FaCog className="text-blue-600" size={20} />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Notification Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <FaBell size={20} />
          </button>
        </div>

        {/* Settings Content */}
        <div className="p-6 space-y-6">
          {/* Sound Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800 dark:text-white">Sound Settings</h3>
            
            {/* Enable/Disable Sounds */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {soundsEnabled ? (
                  <FaVolumeUp className="text-green-600" size={20} />
                ) : (
                  <FaVolumeMute className="text-gray-400" size={20} />
                )}
                <div>
                  <p className="font-medium text-gray-800 dark:text-white">Notification Sounds</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {soundsEnabled ? 'Sounds are enabled' : 'Sounds are disabled'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleSoundToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  soundsEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    soundsEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Volume Control */}
            {soundsEnabled && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Volume</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{Math.round(volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                />
                <button
                  onClick={handleTestSound}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                >
                  Test Sound
                </button>
              </div>
            )}
          </div>

          {/* Notification Types */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800 dark:text-white">Notification Types</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800 dark:text-white">Loan Notifications</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">New loans, approvals, disbursements</p>
                </div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800 dark:text-white">Customer Notifications</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">New customer registrations</p>
                </div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800 dark:text-white">System Alerts</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">System maintenance, security alerts</p>
                </div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Frequency Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800 dark:text-white">Update Frequency</h3>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800 dark:text-white">Real-time Updates</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Check for new notifications every 10 seconds</p>
                </div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800 dark:text-white">Count Updates</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Update notification count every 30 seconds</p>
                </div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
