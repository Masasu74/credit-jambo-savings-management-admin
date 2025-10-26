// 📁 context/AppContext.js
import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import PropTypes from 'prop-types';
import axios from "axios";
import { ClipLoader } from "react-spinners";
import { toast } from 'react-toastify';
import { handlePermissionError } from '../utils/permissionErrorHandler.js';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loans, setLoans] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loanProducts, setLoanProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Boot sequencing: ensure priority data (customers, loans) load first
  const [priorityDataReady, setPriorityDataReady] = useState(false);
  const [shouldLoadPriority, setShouldLoadPriority] = useState(false);
  
  // Individual loading states for better UX
  const [customersLoading, setCustomersLoading] = useState(false);
  const [loansLoading, setLoansLoading] = useState(false);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  // Auto-logout functionality
  const [lastActivity, setLastActivity] = useState(Date.now());
  const INACTIVITY_TIMEOUT = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
  


  const api = useMemo(() => {
    // Dynamic API URL based on current domain
    const getApiBaseUrl = () => {
      if (import.meta.env.MODE === "development") {
        return "http://localhost:4000/api";
      }
      
      // Use environment variable if available
      if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
      }
      
      // For production, use the Render backend URL
      return "/api";
    };

    const axiosInstance = axios.create({
      baseURL: getApiBaseUrl(),
    });

    // Debug logging for API configuration (development only)
    if (import.meta.env.MODE === 'development') {
      console.log('🔧 API Configuration:', {
        mode: import.meta.env.MODE,
        viteApiUrl: import.meta.env.VITE_API_URL,
        baseURL: getApiBaseUrl(),
        userAgent: navigator.userAgent,
        location: window.location.href
      });
    }

    axiosInstance.interceptors.request.use(
      (config) => {
        // Only add staff token if this is NOT a customer API call
        const isCustomerAPI = config.url?.includes('/customer-auth/') || 
                             config.url?.includes('/customer-portal/');
        
        if (!isCustomerAPI) {
          const token = localStorage.getItem("token");
          if (token) config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Debug API requests (development only)
        if (import.meta.env.MODE === 'development') {
          console.log('🔧 API Request:', {
            method: config.method,
            originalUrl: config.url,
            baseURL: config.baseURL,
            fullUrl: `${config.baseURL}${config.url}`,
            isCustomerAPI: isCustomerAPI
          });
        }
        
        return config;
      },
      (error) => Promise.reject(error)
    );

    axiosInstance.interceptors.response.use(
      (res) => res,
      (error) => {
        // Debug error response (development only)
        if (import.meta.env.MODE === 'development') {
          console.error('🔧 API Error:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            config: {
              method: error.config?.method,
              url: error.config?.url,
              baseURL: error.config?.baseURL
            }
          });
        }
        
        // Handle authentication and permission errors globally
        const status = error.response?.status;
        
        if (status === 401) {
          // Check if this is a customer API call - don't interfere with customer authentication
          const isCustomerAPI = error.config?.url?.includes('/customer-auth/') || 
                               error.config?.url?.includes('/customer-portal/');
          
          if (!isCustomerAPI) {
            // Only handle staff authentication errors
            localStorage.removeItem("token");
            setUser(null);
            toast.error("Session expired. Please log in again.");
            // Don't redirect immediately, let individual components handle it
          }
          // For customer API calls, let the customer components handle the error
        } else if (status === 403) {
          // Permission denied - let individual components handle with specific context
          // Don't show toast here as it will be handled by handlePermissionError
        } else if (!error.response) {
          // Network error or server not responding
          console.error('Network error:', error.message);
          toast.error("Network error. Please check your connection.");
        }
        
        return Promise.reject(error);
      }
    );

    return axiosInstance;
  }, []); // Empty dependency array - only create once



  // Activity tracking functions
  const updateActivity = () => {
    const now = Date.now();
    setLastActivity(now);
    localStorage.setItem('lastActivity', now.toString());
  };

  const checkInactivity = useCallback(() => {
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivity;
    
    // Don't check inactivity if user is on customer portal pages
    const isCustomerPage = window.location.pathname.includes('/customer-');
    
    if (timeSinceLastActivity >= INACTIVITY_TIMEOUT && user && !isCustomerPage) {
      logout();
      toast.warning("You have been logged out due to inactivity (6 hours). Please log in again.");
    }
  }, [INACTIVITY_TIMEOUT, lastActivity, user]);

  // Set up activity listeners
  useEffect(() => {
    if (!user) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      updateActivity();
    };

    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Check for inactivity every minute
    const inactivityInterval = setInterval(checkInactivity, 60000);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      clearInterval(inactivityInterval);
    };
  }, [user, lastActivity, checkInactivity]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const { data } = await api.get("/user/me");
          setUser(data.user);
          const now = Date.now();
          setLastActivity(now); // Set initial activity time
          localStorage.setItem('lastActivity', now.toString());
          // Signal a secondary effect to load priority data
          setShouldLoadPriority(true);
        }
      } catch (error) {
        localStorage.removeItem("token");
        setUser(null);
        setError(error.response?.data?.message || "Authentication failed");
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [api]);

  const sendNotification = async ({ customerId, types, message, purpose, loanId }) => {
    try {
      const { data } = await api.post("/notifications/send", {
        customerId,
        types,
        purpose,
        message,
        loanId,
      });
      toast.success("Notification sent successfully!");
      return { success: true, data: data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to send notification";
      toast.error(errorMessage);
      return {
        success: false,
        message: errorMessage,
      };
    }
  };

  const sendBulkNotification = async ({ customerIds, types, message, purpose, loanSpecific }) => {
    try {
      const { data } = await api.post("/notifications/send-bulk", {
        customerIds,
        types,
        purpose,
        message,
        loanSpecific,
      });
      return { success: true, data: data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to send bulk notifications";
      return {
        success: false,
        message: errorMessage,
      };
    }
  };
  
 const fetchNotifications = useCallback(async () => {
  // Don't fetch if user is not authenticated
  if (!user) {
    return;
  }

  try {
    setNotificationsLoading(true);
    const { data } = await api.get("/notifications/list");
    setNotifications(data.data || []);
  } catch (error) {
    console.error("AppContext: fetchNotifications error:", error.response?.data || error.message);
    setNotifications([]);
    setError(error.message || "Failed to fetch notifications");
  } finally {
    setNotificationsLoading(false);
  }
}, [user, api]);

  

  

  const deleteNotification = useCallback(async (id) => {
    // Don't proceed if user is not authenticated
    if (!user) {
      return;
    }

    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      toast.success("Notification deleted successfully!");
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Delete failed";
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user, api]);

  const register = async (userData) => {
    try {
      const { data } = await api.post("/user/register", userData);
      toast.success("User registered successfully!");
      return { success: true, data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Registration failed";
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const login = async (email, password) => {
    try {
      const { data } = await api.post("/user/login", { email, password });
      localStorage.setItem("token", data.token);
      setUser(data.user);
      const now = Date.now();
      setLastActivity(now); // Set initial activity time on login
      localStorage.setItem('lastActivity', now.toString());
      toast.success("Login successful! Welcome back.");
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Login failed";
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setLastActivity(Date.now()); // Reset activity time on logout
    // Clear notifications and other data on logout
    setNotifications([]);
    setError(null);
    toast.info("You have been logged out successfully.");
  };

  const fetchUsers = async (forceRefresh = false) => {
    try {
      setUsersLoading(true);
      // Add cache-busting parameter when force refresh is requested
      const url = forceRefresh ? `/user/list?nocache=true&t=${Date.now()}` : "/user/list";
      const { data } = await api.get(url);
      setUsers(data.data || []);
    } catch (error) {
      setUsers([]);
      setError(error.message);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const { data } = await api.get("/user/responsible-officers");
      return data.data || [];
    } catch (error) {
      console.error("Fetch staff error:", error);
      return [];
    }
  };

  const fetchCustomers = useCallback(async (forceRefresh = false) => {
    try {
      setCustomersLoading(true);
      // Add cache-busting parameter when force refresh is requested
      const url = forceRefresh ? `/customer/list?nocache=true&t=${Date.now()}` : "/customer/list";
      const { data } = await api.get(url);
      
      if (data && data.success) {
        setCustomers(data.data || []);
      } else {
        console.error("❌ fetchCustomers error: Invalid response", data);
        setError(data?.message || 'Failed to fetch customers');
        setCustomers([]);
      }
    } catch (error) {
      console.error("❌ fetchCustomers error:", error);
      setError(error.message);
      setCustomers([]);
    } finally {
      setCustomersLoading(false);
    }
  }, [api]);

  const createCustomer = async (formData) => {
    try {
      const { data } = await api.post("/customer/add", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      // Force refresh customers data immediately to ensure consistency
      await fetchCustomers(true);
      
      toast.success("Customer created successfully!");
      return { success: true, data: data.data };
    } catch (error) {
      return handlePermissionError(error, "create customers");
    }
  };

  const fetchSingleCustomer = async (id) => {
    try {
      const { data } = await api.get(`/customer/${id}`);
      return data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to fetch customer");
    }
  };

  const updateCustomer = async (id, formData) => {
    try {
      const { data } = await api.put(`/customer/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setCustomers((prev) => prev.map((c) => (c._id === id ? data.data : c)));
      // Refresh customers data to ensure consistency
      await fetchCustomers(true);
      toast.success("Customer updated successfully!");
      return { success: true, data: data.data };
    } catch (error) {
      return handlePermissionError(error, "update customers");
    }
  };

  const deleteCustomer = async (id, forceDelete = false) => {
    try {
      // First, get deletion preview to show financial impact
      const previewResponse = await api.get(`/customer/${id}/deletion-preview`);
      const { preview, validation } = previewResponse.data;
      
      // If deletion is not safe and not forced, show detailed confirmation
      if (!validation.isSafe && !forceDelete) {
        const confirmed = window.confirm(
          `⚠️ WARNING: This customer has significant financial data that will be deleted:\n\n` +
          `• ${preview.transactions.length} financial transactions (${preview.totalAmount.toLocaleString()} RWF)\n` +
          `• ${preview.taxRecords.length} tax records\n\n` +
          `Impact Level: ${preview.estimatedImpact.toUpperCase()}\n\n` +
          `Warnings:\n${validation.warnings.join('\n')}\n\n` +
          `Recommendations:\n${validation.recommendations.join('\n')}\n\n` +
          `Are you sure you want to proceed with deletion? This action cannot be undone.`
        );
        
        if (!confirmed) {
          return { cancelled: true };
        }
      }
      
      // Proceed with deletion
      const response = await api.delete(`/customer/${id}`, { 
        data: { forceDelete } 
      });
      
      setCustomers((prev) => prev.filter((c) => c._id !== id));
      
      // Show detailed success message with cleanup summary
      if (response.data.financialCleanup) {
        const cleanup = response.data.financialCleanup;
        toast.success(
          `Customer deleted successfully! Also removed ${cleanup.deletedTransactions} financial transactions and ${cleanup.deletedTaxRecords} tax records.`,
          { duration: 5000 }
        );
      } else {
        toast.success("Customer deleted successfully!");
      }
      
      return { success: true, financialCleanup: response.data.financialCleanup };
    } catch (error) {
      if (error.response?.data?.requiresConfirmation) {
        // Handle case where backend requires additional confirmation
        const { validation } = error.response.data;
        const forceConfirmed = window.confirm(
          `⚠️ CRITICAL WARNING: This deletion has significant financial implications:\n\n` +
          `Warnings:\n${validation.warnings.join('\n')}\n\n` +
          `Errors:\n${validation.errors.join('\n')}\n\n` +
          `Recommendations:\n${validation.recommendations.join('\n')}\n\n` +
          `Do you want to FORCE DELETE despite these warnings? This action cannot be undone.`
        );
        
        if (forceConfirmed) {
          return await deleteCustomer(id, true); // Retry with force delete
        } else {
          return { cancelled: true };
        }
      }
      
      const result = handlePermissionError(error, "delete customers");
      throw new Error(result.message);
    }
  };

  const fetchLoans = useCallback(async (getAll = false, forceRefresh = false) => {
    console.log('🔄 fetchLoans: Starting fetch, getAll:', getAll, 'forceRefresh:', forceRefresh);
    try {
      setLoansLoading(true);
      setError(null);
      
      // Add cache-busting parameter when force refresh is requested
      let url = getAll ? '/loan/list?all=true' : '/loan/list';
      if (forceRefresh) {
        url += (url.includes('?') ? '&' : '?') + `nocache=true&t=${Date.now()}`;
      }
      console.log('🌐 fetchLoans: Fetching from URL:', url);
      
      const { data } = await api.get(url);
      console.log('📥 fetchLoans: Received response:', data);
      
      if (data && data.success) {
        console.log('✅ fetchLoans: Setting loans data, count:', data.data?.length || 0);
        setLoans(data.data || []);
      } else {
        throw new Error(data?.message || 'Failed to fetch loans');
      }
    } catch (error) {
      console.error("❌ fetchLoans error:", error);
      setError(error.response?.data?.message || error.message || "Failed to fetch loans");
      setLoans([]);
    } finally {
      setLoansLoading(false);
      console.log('🏁 fetchLoans: Fetch completed');
    }
  }, [api]);

  // Priority boot loader: customers first, then loans
  const loadPriorityData = useCallback(async () => {
    if (priorityDataReady) return; // already loaded
    // Customers before loans to populate denormalized fields
    await fetchCustomers(true);
    await fetchLoans(true, true);
    setPriorityDataReady(true);
  }, [priorityDataReady, fetchCustomers, fetchLoans]);

  // Trigger priority load when flagged after auth
  useEffect(() => {
    if (!shouldLoadPriority) return;
    let cancelled = false;
    (async () => {
      try {
        await loadPriorityData();
      } catch (e) {
        console.warn('Priority data load failed:', e?.message || e);
      } finally {
        if (!cancelled) setShouldLoadPriority(false);
      }
    })();
    return () => { cancelled = true; };
  }, [shouldLoadPriority, loadPriorityData]);

  const fetchSingleLoan = useCallback(async (id) => {
    try {
      const { data } = await api.get(`/loan/${id}`);
      return data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to fetch loan");
    }
  }, [api]);

  const createLoan = async (loanData, files) => {
    // Decide whether to send multipart or JSON
    const requirementEntries = files?.requirements
      ? Object.entries(files.requirements).filter(([, f]) => !!f)
      : [];
    const hasFiles = requirementEntries.length > 0;

    try {
      if (!hasFiles) {
        // Send JSON when there are no files to avoid multipart parsing issues
        const { data } = await api.post("/loan/add", loanData);
        
        // Force refresh loans data immediately to ensure consistency
        await fetchLoans(false, true);
        
        toast.success("Loan created successfully!");
        return { success: true, data: data.data };
      }

      // Build multipart only when needed
      const formData = new FormData();
      
      // Handle simple fields directly
      Object.entries(loanData).forEach(([k, v]) => {
        if (typeof v === "object" && v !== null && !(v instanceof File)) {
          // For nested objects like collateral, stringify them
          formData.append(k, JSON.stringify(v));
        } else {
          formData.append(k, v);
        }
      });
      
      requirementEntries.forEach(([, file]) => {
        formData.append("requirements", file);
      });

      const { data } = await api.post("/loan/add", formData);
      
      // Force refresh loans data immediately to ensure consistency
      await fetchLoans(false, true);
      
      toast.success("Loan created successfully!");
      return { success: true, data: data.data };
    } catch (error) {
      return handlePermissionError(error, "create loans");
    }
  };

  const updateLoan = async (id, formData) => {
    try {
      const { data } = await api.patch(`/loan/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setLoans((prev) => prev.map((loan) => (loan._id === id ? data.data : loan)));
      // Refresh loans data to ensure consistency
      await fetchLoans();
      toast.success("Loan updated successfully!");
      return { success: true, data: data.data };
    } catch (error) {
      return handlePermissionError(error, "update loans");
    }
  };

  const updateLoanStatus = async (loanId, actionOrPayload, extras) => {
    try {
      let payload = {};
      if (typeof actionOrPayload === 'string') {
        payload = { action: actionOrPayload, ...(extras || {}) };
      } else if (typeof actionOrPayload === 'object' && actionOrPayload !== null) {
        payload = actionOrPayload;
      }

      const { data } = await api.patch(`/loan/status/${loanId}`, payload);
      setLoans((prev) => prev.map((loan) => (loan._id === loanId ? data.data : loan)));
      // Refresh loans data to ensure consistency
      await fetchLoans();
      toast.success("Loan status updated successfully!");
      return { success: true, data: data.data };
    } catch (error) {
      return handlePermissionError(error, "update loan status");
    }
  };

  const deleteLoan = async (loanId, forceDelete = false) => {
    try {
      // First, get deletion preview to show financial impact
      const previewResponse = await api.get(`/loan/${loanId}/deletion-preview`);
      const { preview, validation } = previewResponse.data;
      
      // If deletion is not safe and not forced, show detailed confirmation
      if (!validation.isSafe && !forceDelete) {
        const confirmed = window.confirm(
          `⚠️ WARNING: This loan has significant financial data that will be deleted:\n\n` +
          `• ${preview.transactions.length} financial transactions (${preview.totalAmount.toLocaleString()} RWF)\n` +
          `• ${preview.taxRecords.length} tax records\n\n` +
          `Impact Level: ${preview.estimatedImpact.toUpperCase()}\n\n` +
          `Warnings:\n${validation.warnings.join('\n')}\n\n` +
          `Recommendations:\n${validation.recommendations.join('\n')}\n\n` +
          `Are you sure you want to proceed with deletion? This action cannot be undone.`
        );
        
        if (!confirmed) {
          return { cancelled: true };
        }
      }
      
      // Proceed with deletion
      const response = await api.delete(`/loan/${loanId}`, { 
        data: { forceDelete } 
      });
      
      setLoans((prev) => prev.filter((loan) => loan._id !== loanId));
      
      // Show detailed success message with cleanup summary
      if (response.data.financialCleanup) {
        const cleanup = response.data.financialCleanup;
        toast.success(
          `Loan deleted successfully! Also removed ${cleanup.deletedTransactions} financial transactions and ${cleanup.deletedTaxRecords} tax records.`,
          { duration: 5000 }
        );
      } else {
        toast.success("Loan deleted successfully!");
      }
      
      return { success: true, financialCleanup: response.data.financialCleanup };
    } catch (error) {
      if (error.response?.data?.requiresConfirmation) {
        // Handle case where backend requires additional confirmation
        const { validation } = error.response.data;
        const forceConfirmed = window.confirm(
          `⚠️ CRITICAL WARNING: This deletion has significant financial implications:\n\n` +
          `Warnings:\n${validation.warnings.join('\n')}\n\n` +
          `Errors:\n${validation.errors.join('\n')}\n\n` +
          `Recommendations:\n${validation.recommendations.join('\n')}\n\n` +
          `Do you want to FORCE DELETE despite these warnings? This action cannot be undone.`
        );
        
        if (forceConfirmed) {
          return await deleteLoan(loanId, true); // Retry with force delete
        } else {
          return { cancelled: true };
        }
      }
      
      const result = handlePermissionError(error, "delete loans");
      throw new Error(result.message);
    }
  };

  const fetchBranches = async (forceRefresh = false) => {
    try {
      setBranchesLoading(true);
      // Add cache-busting parameter when force refresh is requested
      const url = forceRefresh ? `/branch/list?nocache=true&t=${Date.now()}` : "/branch/list";
      const { data } = await api.get(url);
      setBranches(data.data || []);
    } catch (error) {
      setBranches([]);
      setError(error.message);
    } finally {
      setBranchesLoading(false);
    }
  };

  const createBranch = async (branchData) => {
    try {
      const { data } = await api.post("/branch/add", branchData);
      setBranches((prev) => [...prev, data.data]);
      toast.success("Branch created successfully!");
      return { success: true, data: data.data };
    } catch (error) {
      return handlePermissionError(error, "create branches");
    }
  };

  const updateBranch = async (id, data) => {
    try {
      const res = await api.put(`/branch/${id}`, data);
      setBranches((prev) => prev.map((b) => (b._id === id ? res.data.data : b)));
      toast.success("Branch updated successfully!");
      return { success: true, data: res.data.data };
    } catch (error) {
      return handlePermissionError(error, "update branches");
    }
  };

  const deleteBranch = async (id) => {
    try {
      await api.delete(`/branch/${id}`);
      setBranches((prev) => prev.filter((b) => b._id !== id));
      toast.success("Branch deleted successfully!");
      return { success: true };
    } catch (error) {
      return handlePermissionError(error, "delete branches");
    }
  };

  const getBranchById = async (id) => {
    try {
      const { data } = await api.get(`/branch/${id}`);
      return { success: true, data: data.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || "Failed to get branch" };
    }
  };

  const logActivity = async (action, entityType, entityId, details = {}) => {
    try {
      await api.post("/activity/log", { action, entityType, entityId, details });
    } catch (error) {
      console.error("Activity log failed:", error);
    }
  };

  const updateProfile = async (formData) => {
    try {
      const response = await api.put("/user/profile", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data.success) {
        // Update user state with new data
        setUser(response.data.user);
        
        // Force a re-fetch of user data to ensure consistency
        try {
          const { data } = await api.get("/user/me");
          setUser(data.user);
        } catch (refreshError) {
          console.warn("Failed to refresh user data:", refreshError);
        }
        
        toast.success("Profile updated successfully");
      }
      
      return response.data;
    } catch (error) {
      console.error("Profile update error:", error);
      const message = error.response?.data?.message || "Failed to update profile";
      toast.error(message);
      throw error;
    }
  };

  const deleteProfilePicture = async () => {
    try {
      const response = await api.delete("/user/profile/picture");
      
      if (response.data.success) {
        // Update user state with new data
        setUser(response.data.user);
        
        // Force a re-fetch of user data to ensure consistency
        try {
          const { data } = await api.get("/user/me");
          setUser(data.user);
        } catch (refreshError) {
          console.warn("Failed to refresh user data:", refreshError);
        }
        
        toast.success("Profile picture deleted successfully");
      }
      
      return response.data;
    } catch (error) {
      console.error("Delete profile picture error:", error);
      const message = error.response?.data?.message || "Failed to delete profile picture";
      toast.error(message);
      throw error;
    }
  };

  const changeUserPassword = async (userId, newPassword) => {
    try {
      const response = await api.put(`/user/${userId}/password`, {
        newPassword
      });
      
      if (response.data.success) {
        toast.success(response.data.message);
      }
      
      return response.data;
    } catch (error) {
      console.error("Password change error:", error);
      const message = error.response?.data?.message || "Failed to change password";
      toast.error(message);
      throw error;
    }
  };

  // Loan Product Functions
  const fetchLoanProducts = async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters);
      const { data } = await api.get(`/loan-products?${params}`);
      const products = data.data || [];
      setLoanProducts(products);
      return products;
    } catch (error) {
      console.error("Fetch loan products error:", error);
      setLoanProducts([]);
      return [];
    }
  };

  const fetchActiveLoanProducts = async (branchId = null) => {
    try {
      const params = branchId ? `?branchId=${branchId}` : '';
      const { data } = await api.get(`/loan-products/active${params}`);
      return data.data || [];
    } catch (error) {
      console.error("Fetch active loan products error:", error);
      return [];
    }
  };

  const getLoanProduct = async (id) => {
    try {
      const { data } = await api.get(`/loan-products/${id}`);
      return data.data;
    } catch (error) {
      console.error("Get loan product error:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch loan product");
    }
  };

  const createLoanProduct = async (productData) => {
    try {
      const { data } = await api.post("/loan-products", productData);
      toast.success("Loan product created successfully");
      // Refresh loan products list
      await fetchLoanProducts();
      return data.data;
    } catch (error) {
      const message = error.response?.data?.message || "Failed to create loan product";
      toast.error(message);
      throw error;
    }
  };

  const updateLoanProduct = async (id, productData) => {
    try {
      const { data } = await api.put(`/loan-products/${id}`, productData);
      toast.success("Loan product updated successfully");
      // Refresh loan products list
      await fetchLoanProducts();
      return data.data;
    } catch (error) {
      const message = error.response?.data?.message || "Failed to update loan product";
      toast.error(message);
      throw error
    }
  };

  const deleteLoanProduct = async (id) => {
    try {
      await api.delete(`/loan-products/${id}`);
      toast.success("Loan product deleted successfully");
      // Refresh loan products list
      await fetchLoanProducts();
    } catch (error) {
      const message = error.response?.data?.message || "Failed to delete loan product";
      toast.error(message);
      throw error;
    }
  };

  const calculateLoanDetails = async (productId, amount, duration) => {
    try {
      const { data } = await api.post(`/loan-products/${productId}/calculate`, {
        productId,
        amount,
        duration
      });
      return data.data;
    } catch (error) {
      const message = error.response?.data?.message || "Failed to calculate loan details";
      toast.error(message);
      throw error;
    }
  };

  return (
    <AppContext.Provider
              value={{
          user,
          loans,
          customers,
          branches,
          users,
          notifications,
          loanProducts,
          loading,
          error,
        customersLoading,
        loansLoading,
        branchesLoading,
        usersLoading,
        notificationsLoading,
        api,
        register,
        login,
        logout,
        updateActivity, // Add activity tracking function
        fetchUsers,
        fetchStaff,
        fetchCustomers,
        createCustomer,
        fetchSingleCustomer,
        updateCustomer,
        deleteCustomer,
        fetchLoans,
        createLoan,
        fetchSingleLoan,
        updateLoan,
        updateLoanStatus,
        deleteLoan,
        fetchBranches,
        createBranch,
        updateBranch,
        deleteBranch,
        getBranchById,
        sendNotification,
        sendBulkNotification,
        fetchNotifications,
        deleteNotification,
        logActivity,
        updateProfile,
        deleteProfilePicture,
        changeUserPassword,
        fetchLoanProducts,
        fetchActiveLoanProducts,
        getLoanProduct,
        createLoanProduct,
        updateLoanProduct,
        deleteLoanProduct,
        calculateLoanDetails,
      }}
    >
      {loading ? (
        <div className="w-full h-screen flex justify-center items-center">
          <ClipLoader color="#215891" size={40} />
        </div>
      ) : (
        children
      )}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);

AppProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
