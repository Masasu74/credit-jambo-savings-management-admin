import { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAppContext } from "../context/AppContext";
import { useSystemSettings } from "../context/SystemSettingsContext";
import logo from "../assets/logo.png";
import login_background from "../assets/login-background.png";
import Loader from "../components/Loader";

const Login = () => {
  const { user, login, loading, error, retryAuth } = useAppContext();
  const { settings } = useSystemSettings();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get colors from settings with fallback
  const getColors = () => {
    if (settings) {
      return {
        primary: settings.primaryColor || '#00b050',
        secondary: settings.secondaryColor || '#008238',
        accent: settings.accentColor || '#6bc96b',
        success: settings.successColor || '#00b050',
        warning: settings.warningColor || '#f59e0b',
        error: settings.errorColor || '#ef4444'
      };
    }
    return {
      primary: '#00b050',
      secondary: '#008238',
      accent: '#6bc96b',
      success: '#00b050',
      warning: '#f59e0b',
      error: '#ef4444'
    };
  };

  const currentColors = getColors();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Clear any existing toast notifications
      toast.dismiss();

      const result = await login(email, password);
      if (result.success) {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Login error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (loading) return <Loader />;
  return (
    <div className="p-4 lg:h-screen lg:w-full lg:flex lg:justify-between lg:p-0">
      <div className="flex flex-col items-center gap-4 lg:gap-11 lg:justify-center lg:px-20 xl:px-40">
        <div>
          <img 
            className="w-32 sm:w-36 lg:w-40" 
            src={settings?.logo || logo} 
            alt={settings?.companyName || "Logo"} 
          />
        </div>

        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black">Admin Login</h1>
          <p className="font-light text-gray-600 text-sm sm:text-base">
            {settings?.companySlogan || "Credit Jambo Ltd - Savings Management System"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-xs">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              <div className="flex items-center justify-between">
                <p className="text-red-700 text-sm">{error}</p>
                {error.includes("Authentication check failed") && (
                  <button
                    type="button"
                    onClick={retryAuth}
                    className="text-red-600 hover:text-red-800 text-sm font-medium underline ml-2"
                  >
                    Retry
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label htmlFor="email">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              className="border border-gray-300 rounded-md h-10 w-full p-2 outline-none placeholder:text-sm"
              style={{ 
                borderColor: currentColors.primary,
                outline: 'none'
              }}
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your Email address"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              className="border border-gray-300 rounded-md h-10 w-full p-2 outline-none placeholder:text-sm"
              style={{ 
                borderColor: currentColors.primary,
                outline: 'none'
              }}
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your Password"
              required
            />
          </div>

          <button 
            type="submit"
            className="h-10 w-full p-2 rounded text-white font-semibold focus:outline-none transition disabled:opacity-50"
            style={{ 
              backgroundColor: currentColors.primary,
              borderColor: currentColors.primary
            }}
            disabled={isSubmitting || loading}
          >
            {isSubmitting || loading ? "Logging in..." : "Login"}
          </button>

          <div className="text-center text-sm mt-2">
            <p className="text-gray-600">
              Credit Jambo Ltd - Savings Management System
            </p>
          </div>
        </form>
      </div>

      <div className="hidden lg:block lg:flex-1" style={{ backgroundColor: currentColors.primary }}>
        <img 
          className="h-full w-full object-cover opacity-25" 
          src={login_background} 
          alt="Background decoration" 
        />
      </div>
    </div>
  );
};

export default Login;