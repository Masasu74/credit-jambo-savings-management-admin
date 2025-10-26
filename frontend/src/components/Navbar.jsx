// Navbar.jsx
import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import down_arrow from "../assets/down_arrow.png";
import { useAppContext } from "../context/AppContext";
import { useSystemColors } from "../hooks/useSystemColors";
import NotificationDropdown from "./NotificationDropdown";
import ThemeToggle from "./ThemeToggle";
import { FaUser } from "react-icons/fa";
import { getUploadUrl } from "../utils/apiUtils";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  const { user, logout } = useAppContext();
  const { colors } = useSystemColors();
  const navigate = useNavigate();

  // Force re-render when user data changes
  useEffect(() => {
    setForceUpdate(prev => prev + 1);
  }, [user?.fullName, user?.profilePicture]);

  // Fallback colors
  const fallbackColors = {
    primary: '#2563eb',
    secondary: '#64748b',
    accent: '#f59e0b',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  };

  const currentColors = colors || fallbackColors;

  const handleLogout = () => {
    logout();
    navigate("/login");
    setIsOpen(false);
  };

  return (
    <div className="z-50 lg:flex hidden w-full h-20 px-6 items-center justify-between bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50 shadow-lg">
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
          Welcome Back, {user?.fullName || "User"}
        </h1>
        <p className="font-medium text-sm text-gray-600 dark:text-gray-400 mt-1">
          Your essential tool for managing internal loan operations.
        </p>
      </div>

      <div className="flex items-center gap-6">
        {/* Theme Toggle */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
        
        {/* Notification Dropdown */}
        <div className="flex items-center gap-2">
          <NotificationDropdown />
        </div>
        
        <div className="relative">
          <div
            className="flex items-center justify-center gap-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-xl p-3 transition-all duration-200 hover:shadow-md"
            onClick={() => setIsOpen(!isOpen)}
          >
          <div className="flex gap-3 items-center">
            {user?.profilePicture ? (
              <img
                className="h-12 w-12 rounded-full object-cover border-3 shadow-lg"
                style={{ borderColor: `${currentColors.primary}30` }}
                src={getUploadUrl(user.profilePicture)}
                alt="User"
              />
            ) : (
              <div 
                className="h-12 w-12 rounded-full flex items-center justify-center shadow-lg"
                style={{ backgroundColor: currentColors.primary }}
              >
                <FaUser className="text-white w-6 h-6" />
              </div>
            )}
            <div className="flex flex-col">
              <h3 className="font-bold text-gray-800 dark:text-white text-base">
                {user?.fullName || "Guest User"}
              </h3>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {user?.role || "User"}
              </p>
            </div>
          </div>
          <div>
            <img
              className={`w-6 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
              src={down_arrow}
              alt="Dropdown Arrow"
            />
          </div>
        </div>

        {isOpen && (
          <div className="absolute right-0 mt-3 w-56 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm shadow-xl rounded-xl p-3 z-50 border border-gray-200/50 dark:border-gray-700/50">
            <NavLink
              to="/profile"
              className="block px-4 py-3 text-gray-700 dark:text-gray-300 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:shadow-sm font-medium"
              onClick={() => setIsOpen(false)}
            >
              Profile
            </NavLink>
            <button
              onClick={handleLogout}
              className="block w-full text-left px-4 py-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;