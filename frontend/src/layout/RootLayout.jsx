// RootLayout.jsx
import { useState } from "react";
import { Outlet, useLocation, Navigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useAppContext } from "../context/AppContext";
import Loader from "../components/Loader";

const RootLayout = () => {
  const { user, loading } = useAppContext();
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  if (loading) return <Loader />;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="box-border lg:flex lg:flex-row w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-screen">
      <Sidebar isCollapsed={isSidebarCollapsed} onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
      <div className={`w-full flex flex-col transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'}`}>
        <Navbar />
        <main className="flex-1 p-4 lg:p-6 min-h-screen">
          <div className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 lg:p-8 border border-gray-200/50 dark:border-gray-700/50">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default RootLayout;