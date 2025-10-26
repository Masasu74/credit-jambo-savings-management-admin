import { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import {
  FaHome,
  FaUser,
  FaMoneyBill,
  FaSignOutAlt,
  FaBars,
  FaEllipsisV,
  FaClipboardList,
  FaShieldAlt
} from "react-icons/fa";
import { useAppContext } from "../context/AppContext";
import { useSystemSettings } from "../context/SystemSettingsContext";
import { useSystemColors } from "../hooks/useSystemColors";
import logo from "../assets/logo.png";

const Sidebar = ({ isCollapsed = false, onToggle }) => {
  const [activeMenu, setActiveMenu] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const { logout, user } = useAppContext();
  const { settings } = useSystemSettings();
  const { colors } = useSystemColors();
  const navigate = useNavigate();
  const location = useLocation();

  // Fallback colors
  const fallbackColors = {
    primary: '#00b050',
    secondary: '#64748b',
    accent: '#f59e0b',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  };

  const currentColors = colors || fallbackColors;

  // Auto-expand menu based on current location
  useEffect(() => {
    const pathname = location.pathname;
    
    // Auto-expand menus based on current path
    if (pathname.startsWith('/customers')) {
      setActiveMenu('Customers');
    }
    else if (pathname.startsWith('/savings-accounts')) {
      setActiveMenu('Savings Accounts');
    }
    else if (pathname.startsWith('/transactions') || pathname.startsWith('/deposit-funds') || pathname.startsWith('/withdraw-funds')) {
      setActiveMenu('Transactions');
    }
    else if (pathname.startsWith('/device-verifications')) {
      setActiveMenu('Device Verifications');
    }
    // Removed references to deleted pages - keeping only core admin features
    else {
      setActiveMenu(null);
    }
  }, [location.pathname]);

  const toggleSubmenu = (menu) => {
    setActiveMenu(prev => (prev === menu ? null : menu));
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
    setIsProfileMenuOpen(false);
  };

  const isAdminOrManager = user?.role === "admin" || user?.role === "manager";

  // Organized menu structure for Credit Jambo Savings Management System
  const menuItems = [
    // ===== MAIN NAVIGATION =====
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: <FaHome size={20} style={{ color: currentColors.primary }} />
    },

    // ===== CORE SAVINGS OPERATIONS =====
    {
      name: "Customers",
      icon: <FaUser size={20} style={{ color: currentColors.primary }} />,
      submenus: [
        { name: "View all Customers", path: "/customers" }
      ]
    },
    {
      name: "Savings Accounts",
      icon: <FaMoneyBill size={20} style={{ color: currentColors.primary }} />,
      submenus: [
        { name: "All Accounts", path: "/savings-accounts" },
        { name: "Add Account", path: "/savings-accounts/add" }
      ]
    },
    {
      name: "Transactions",
      icon: <FaClipboardList size={20} style={{ color: currentColors.primary }} />,
      submenus: [
        { name: "All Transactions", path: "/transactions" },
        { name: "Deposit Funds", path: "/deposit-funds" },
        { name: "Withdraw Funds", path: "/withdraw-funds" }
      ]
    },
    {
      name: "Device Verifications",
      icon: <FaShieldAlt size={20} style={{ color: currentColors.primary }} />,
      submenus: [
        { name: "All Verifications", path: "/device-verifications" }
      ]
    },

    // ===== CORE ADMIN FEATURES ONLY =====
    // Aligned with practical test requirements - no extra features
  ];

  return (
    <div className={`lg:fixed lg:left-0 lg:top-0 lg:h-screen transition-all duration-300 ${isCollapsed ? 'lg:w-16' : 'lg:w-64'} w-full bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm shadow-2xl border-r border-gray-200/50 dark:border-gray-700/50 flex flex-col z-50 sticky top-0 lg:static`}>
      {/* Header */}
      <div className="sticky top-0 lg:static z-50 p-6 flex items-center justify-between lg:justify-center border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-gray-50/50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-700/50 backdrop-blur-sm">
        <FaBars
          className="lg:hidden cursor-pointer transition-colors"
          size={24}
          style={{ color: currentColors.primary }}
          onMouseEnter={(e) => e.target.style.color = `${currentColors.primary}dd`}
          onMouseLeave={(e) => e.target.style.color = currentColors.primary}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />
        
        {/* Desktop Toggle Button */}
        <FaBars
          className="hidden lg:block cursor-pointer transition-colors absolute left-2 top-6"
          size={20}
          style={{ color: currentColors.primary }}
          onMouseEnter={(e) => e.target.style.color = `${currentColors.primary}dd`}
          onMouseLeave={(e) => e.target.style.color = currentColors.primary}
          onClick={onToggle}
        />
        
        <img
          src={settings?.logo || logo}
          alt={settings?.companyName || "Logo"}
          className={`cursor-pointer transform hover:scale-110 transition-all duration-200 hover:shadow-lg ${isCollapsed ? 'lg:hidden' : 'h-5'}`}
          onClick={() => navigate("/")}
        />
        <div className="relative lg:hidden">
          <FaEllipsisV
            className="cursor-pointer transition-colors"
            size={24}
            style={{ color: currentColors.primary }}
            onMouseEnter={(e) => e.target.style.color = `${currentColors.primary}dd`}
            onMouseLeave={(e) => e.target.style.color = currentColors.primary}
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
          />
          {isProfileMenuOpen && (
            <div className="absolute right-0 top-12 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-2 w-48 border border-gray-100 dark:border-gray-700">
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className={`lg:block flex-grow overflow-y-auto transition-all duration-300 ${isMobileMenuOpen ? "max-h-screen" : "max-h-0 lg:max-h-full"}`}>
        <div className={`${isCollapsed ? 'p-2' : 'p-6'} space-y-1`}>
          {menuItems.map((item, index) => (
            <div key={item.name}>
              {/* Add visual separator for grouped sections */}
              {!isCollapsed && index > 0 && (
                (item.name === "Notifications" || 
                 item.name === "Financial Management" || 
                 item.name === "Reports" || 
                 item.name === "Branches" || 
                 item.name === "Audit & Security" || 
                 item.name === "Profile") && (
                  <div className="my-4 border-t border-gray-200 dark:border-gray-600"></div>
                )
                            )}
              {item.path ? (
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center ${isCollapsed ? 'justify-center p-3' : 'p-4'} rounded-xl transition-all duration-200 font-medium text-sm
                     ${isActive
                       ? 'border-l-4 shadow-lg'
                       : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:shadow-md'}`
                  }
                  style={({ isActive }) => ({
                    backgroundColor: isActive ? `${currentColors.primary}15` : 'transparent',
                    color: isActive ? currentColors.primary : undefined,
                    borderLeftColor: isActive ? currentColors.primary : 'transparent'
                  })}
                  onClick={() => setIsMobileMenuOpen(false)}
                  title={isCollapsed ? item.name : undefined}
                >
                  {item.icon}
                  {!isCollapsed && <span className="ml-4">{item.name}</span>}
                </NavLink>
              ) : (
                <>
                  <button
                    onClick={() => toggleSubmenu(item.name)}
                    className={`flex items-center w-full ${isCollapsed ? 'justify-center p-3' : 'p-4'} rounded-xl transition-all duration-200 font-medium text-sm
                      ${activeMenu === item.name ? 'text-gray-900 dark:text-white shadow-lg' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:shadow-md'}`}
                    style={{
                      backgroundColor: activeMenu === item.name ? `${currentColors.primary}15` : 'transparent'
                    }}
                    title={isCollapsed ? item.name : undefined}
                  >
                    {item.icon}
                    {!isCollapsed && <span className="ml-4 flex-1 text-left">{item.name}</span>}
                    {!isCollapsed && (
                      <svg
                        className={`w-4 h-4 transform transition-transform ${activeMenu === item.name ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </button>

                  {!isCollapsed && (
                    <div className={`overflow-hidden transition-all duration-300 ${activeMenu === item.name ? 'max-h-screen' : 'max-h-0'}`}>
                      <div className={`ml-8 pl-4 space-y-2 border-l-2 border-gray-300 dark:border-gray-600 mt-2 overflow-y-auto sidebar-submenu-scrollbar ${item.name === 'Loans' ? 'loans-submenu' : 'max-h-80'}`}>
                        {item.submenus?.map((sub) => (
                          <NavLink
                            key={sub.name}
                            to={sub.path}
                            className={({ isActive }) =>
                              `block p-3 text-xs rounded-lg transition-all duration-200 font-medium
                              ${isActive
                                ? 'font-bold shadow-md'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:shadow-sm'}`
                            }
                            style={({ isActive }) => ({
                              backgroundColor: isActive ? `${currentColors.primary}15` : 'transparent',
                              color: isActive ? currentColors.primary : undefined
                            })}
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            {sub.name}
                          </NavLink>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className={`${isCollapsed ? 'p-2' : 'p-6'} border-t border-gray-200/50 dark:border-gray-700/50 hidden lg:block bg-gradient-to-r from-gray-50/50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-700/50`}>
        <NavLink
          to="/login"
          onClick={handleLogout}
          className={({ isActive }) =>
            `flex items-center w-full ${isCollapsed ? 'justify-center p-3' : 'p-4'} rounded-xl font-medium text-sm transition-all duration-200
            ${isActive
              ? 'border-l-4 shadow-lg'
              : 'text-gray-600 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600 hover:shadow-md'}`
          }
          style={({ isActive }) => ({
            backgroundColor: isActive ? `${currentColors.primary}15` : 'transparent',
            color: isActive ? currentColors.primary : undefined,
            borderLeftColor: isActive ? currentColors.primary : 'transparent'
          })}
          title={isCollapsed ? 'Logout' : undefined}
        >
          <FaSignOutAlt className="text-red-500 group-hover:text-red-600" size={20} />
          {!isCollapsed && <span className="ml-4">Logout</span>}
        </NavLink>
      </div>
    </div>
  );
};

Sidebar.propTypes = {
  isCollapsed: PropTypes.bool,
  onToggle: PropTypes.func
};

export default Sidebar;
