import React, { useState, useEffect } from 'react';
import { 
  FaCog, 
  FaEye, 
  FaEyeSlash, 
  FaArrowsAlt, 
  FaSave, 
  FaUndo, 
  FaPalette,
  FaTh,
  FaChartBar,
  FaBell,
  FaMoneyBill,
  FaUser,
  FaShieldAlt
} from 'react-icons/fa';
import { useSystemColors } from '../../hooks/useSystemColors';
import { usePermission } from '../PermissionGuard';
import { getResponsiveModalClasses, MODAL_SIZES, MODAL_POSITIONS } from '../../utils/modalUtils';

const DashboardCustomization = () => {
  const { colors } = useSystemColors();
  const canCustomize = usePermission(['admin', 'manager']);
  const [isOpen, setIsOpen] = useState(false);
  const [widgets, setWidgets] = useState([
    { 
      id: 'quick-actions', 
      name: 'Quick Actions', 
      description: 'Common dashboard actions and shortcuts',
      enabled: true, 
      order: 1,
      icon: <FaTh size={16} />,
      category: 'actions'
    },
    { 
      id: 'performance-metrics', 
      name: 'Performance Metrics', 
      description: 'Portfolio health and performance indicators',
      enabled: true, 
      order: 2,
      icon: <FaChartBar size={16} />,
      category: 'analytics'
    },
    { 
      id: 'alerts-panel', 
      name: 'System Alerts', 
      description: 'Important system notifications and alerts',
      enabled: true, 
      order: 3,
      icon: <FaBell size={16} />,
      category: 'notifications'
    },
    { 
      id: 'upcoming-payments', 
      name: 'Upcoming Payments', 
      description: 'Payment deadlines and due dates',
      enabled: true, 
      order: 4,
      icon: <FaMoneyBill size={16} />,
      category: 'financial'
    },
    { 
      id: 'enhanced-charts', 
      name: 'Enhanced Charts', 
      description: 'Advanced analytics and visualizations',
      enabled: true, 
      order: 6,
      icon: <FaChartBar size={16} />,
      category: 'analytics'
    },
    { 
      id: 'recent-activity', 
      name: 'Recent Activity', 
      description: 'Latest loan applications and customer registrations',
      enabled: true, 
      order: 7,
      icon: <FaUser size={16} />,
      category: 'activity'
    },
    { 
      id: 'security-status', 
      name: 'Security Status', 
      description: 'System security and compliance status',
      enabled: false, 
      order: 8,
      icon: <FaShieldAlt size={16} />,
      category: 'security'
    }
  ]);

  const [layout, setLayout] = useState('grid'); // grid, list, compact
  const [theme, setTheme] = useState('default'); // default, compact, detailed
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds

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

  useEffect(() => {
    // Load saved preferences from localStorage
    const savedWidgets = localStorage.getItem('dashboard-widgets');
    const savedLayout = localStorage.getItem('dashboard-layout');
    const savedTheme = localStorage.getItem('dashboard-theme');
    const savedAutoRefresh = localStorage.getItem('dashboard-auto-refresh');
    const savedRefreshInterval = localStorage.getItem('dashboard-refresh-interval');

    if (savedWidgets) {
      setWidgets(JSON.parse(savedWidgets));
    }
    if (savedLayout) {
      setLayout(savedLayout);
    }
    if (savedTheme) {
      setTheme(savedTheme);
    }
    if (savedAutoRefresh) {
      setAutoRefresh(JSON.parse(savedAutoRefresh));
    }
    if (savedRefreshInterval) {
      setRefreshInterval(parseInt(savedRefreshInterval));
    }
  }, []);

  const savePreferences = () => {
    localStorage.setItem('dashboard-widgets', JSON.stringify(widgets));
    localStorage.setItem('dashboard-layout', layout);
    localStorage.setItem('dashboard-theme', theme);
    localStorage.setItem('dashboard-auto-refresh', JSON.stringify(autoRefresh));
    localStorage.setItem('dashboard-refresh-interval', refreshInterval.toString());
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('dashboardPreferencesUpdated', {
      detail: { widgets, layout, theme, autoRefresh, refreshInterval }
    }));
  };

  const resetToDefaults = () => {
    setWidgets([
      { id: 'quick-actions', name: 'Quick Actions', description: 'Common dashboard actions and shortcuts', enabled: true, order: 1, icon: <FaLayout size={16} />, category: 'actions' },
      { id: 'performance-metrics', name: 'Performance Metrics', description: 'Portfolio health and performance indicators', enabled: true, order: 2, icon: <FaChartBar size={16} />, category: 'analytics' },
      { id: 'alerts-panel', name: 'System Alerts', description: 'Important system notifications and alerts', enabled: true, order: 3, icon: <FaBell size={16} />, category: 'notifications' },
      { id: 'upcoming-payments', name: 'Upcoming Payments', description: 'Payment deadlines and due dates', enabled: true, order: 4, icon: <FaMoneyBill size={16} />, category: 'financial' },
      { id: 'market-conditions', name: 'Market Conditions', description: 'Economic indicators and market data', enabled: false, order: 5, icon: <FaGlobe size={16} />, category: 'market' },
      { id: 'enhanced-charts', name: 'Enhanced Charts', description: 'Advanced analytics and visualizations', enabled: true, order: 6, icon: <FaChartBar size={16} />, category: 'analytics' },
      { id: 'recent-activity', name: 'Recent Activity', description: 'Latest loan applications and customer registrations', enabled: true, order: 7, icon: <FaUser size={16} />, category: 'activity' },
      { id: 'security-status', name: 'Security Status', description: 'System security and compliance status', enabled: false, order: 8, icon: <FaShieldAlt size={16} />, category: 'security' }
    ]);
    setLayout('grid');
    setTheme('default');
    setAutoRefresh(true);
    setRefreshInterval(30);
  };

  const toggleWidget = (widgetId) => {
    setWidgets(prev => prev.map(widget => 
      widget.id === widgetId 
        ? { ...widget, enabled: !widget.enabled }
        : widget
    ));
  };

  const moveWidget = (widgetId, direction) => {
    setWidgets(prev => {
      const newWidgets = [...prev];
      const currentIndex = newWidgets.findIndex(w => w.id === widgetId);
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      
      if (newIndex >= 0 && newIndex < newWidgets.length) {
        [newWidgets[currentIndex], newWidgets[newIndex]] = [newWidgets[newIndex], newWidgets[currentIndex]];
        // Update order values
        newWidgets.forEach((widget, index) => {
          widget.order = index + 1;
        });
      }
      
      return newWidgets;
    });
  };

  const getCategoryColor = (category) => {
    const colors = {
      actions: 'text-blue-600 dark:text-blue-400',
      analytics: 'text-green-600 dark:text-green-400',
      notifications: 'text-orange-600 dark:text-orange-400',
      financial: 'text-purple-600 dark:text-purple-400',
      market: 'text-indigo-600 dark:text-indigo-400',
      activity: 'text-pink-600 dark:text-pink-400',
      security: 'text-red-600 dark:text-red-400'
    };
    return colors[category] || colors.actions;
  };

  const getCategoryBg = (category) => {
    const backgrounds = {
      actions: 'bg-blue-50 dark:bg-blue-900/20',
      analytics: 'bg-green-50 dark:bg-green-900/20',
      notifications: 'bg-orange-50 dark:bg-orange-900/20',
      financial: 'bg-purple-50 dark:bg-purple-900/20',
      market: 'bg-indigo-50 dark:bg-indigo-900/20',
      activity: 'bg-pink-50 dark:bg-pink-900/20',
      security: 'bg-red-50 dark:bg-red-900/20'
    };
    return backgrounds[category] || backgrounds.actions;
  };

  if (!canCustomize) {
    return null;
  }

  return (
    <>
      {/* Customization Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-200 z-50"
        style={{ backgroundColor: currentColors.primary }}
        title="Customize Dashboard"
      >
        <FaCog className="text-white" size={20} />
      </button>

      {/* Customization Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-8 sm:pt-16 md:pt-20 lg:pt-24 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-4rem)] overflow-y-auto mx-4 my-4 overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <FaPalette className="text-blue-600" size={24} />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Dashboard Customization</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <FaEyeSlash size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Widget Management */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Widget Management</h3>
                    <div className="space-y-3">
                      {widgets
                        .sort((a, b) => a.order - b.order)
                        .map((widget) => (
                        <div
                          key={widget.id}
                          className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                            widget.enabled
                              ? 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${getCategoryBg(widget.category)}`}>
                                <div className={getCategoryColor(widget.category)}>
                                  {widget.icon}
                                </div>
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900 dark:text-white">
                                  {widget.name}
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {widget.description}
                                </p>
                                <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full mt-1 ${getCategoryBg(widget.category)} ${getCategoryColor(widget.category)}`}>
                                  {widget.category}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => moveWidget(widget.id, 'up')}
                                disabled={widget.order === 1}
                                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Move up"
                              >
                                <FaArrowsAlt size={14} className="rotate-90" />
                              </button>
                              <button
                                onClick={() => moveWidget(widget.id, 'down')}
                                disabled={widget.order === widgets.length}
                                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Move down"
                              >
                                <FaArrowsAlt size={14} className="-rotate-90" />
                              </button>
                              <button
                                onClick={() => toggleWidget(widget.id)}
                                className={`p-2 rounded-lg transition-colors ${
                                  widget.enabled
                                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                                    : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                                }`}
                                title={widget.enabled ? 'Hide widget' : 'Show widget'}
                              >
                                {widget.enabled ? <FaEye size={16} /> : <FaEyeSlash size={16} />}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Layout & Theme Settings */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Layout & Theme</h3>
                    
                    {/* Layout Selection */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Dashboard Layout
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { id: 'grid', name: 'Grid', description: 'Card-based layout' },
                          { id: 'list', name: 'List', description: 'Vertical list layout' },
                          { id: 'compact', name: 'Compact', description: 'Dense information layout' }
                        ].map((layoutOption) => (
                          <button
                            key={layoutOption.id}
                            onClick={() => setLayout(layoutOption.id)}
                            className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                              layout === layoutOption.id
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                          >
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {layoutOption.name}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {layoutOption.description}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Theme Selection */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Dashboard Theme
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { id: 'default', name: 'Default', description: 'Standard theme' },
                          { id: 'compact', name: 'Compact', description: 'Minimal spacing' },
                          { id: 'detailed', name: 'Detailed', description: 'Rich information' }
                        ].map((themeOption) => (
                          <button
                            key={themeOption.id}
                            onClick={() => setTheme(themeOption.id)}
                            className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                              theme === themeOption.id
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                          >
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {themeOption.name}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {themeOption.description}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Auto-refresh Settings */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Auto-refresh Settings
                      </label>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={autoRefresh}
                            onChange={(e) => setAutoRefresh(e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            Enable auto-refresh
                          </span>
                        </label>
                        {autoRefresh && (
                          <div className="ml-6">
                            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                              Refresh interval (seconds)
                            </label>
                            <select
                              value={refreshInterval}
                              onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
                              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                            >
                              <option value={15}>15 seconds</option>
                              <option value={30}>30 seconds</option>
                              <option value={60}>1 minute</option>
                              <option value={300}>5 minutes</option>
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={resetToDefaults}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors flex items-center gap-2"
              >
                <FaUndo size={16} />
                Reset to Defaults
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    savePreferences();
                    setIsOpen(false);
                  }}
                  className="px-6 py-2 text-white rounded-lg transition-colors flex items-center gap-2"
                  style={{ backgroundColor: currentColors.primary }}
                >
                  <FaSave size={16} />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DashboardCustomization;
