import { Suspense, lazy } from 'react';
import { createBrowserRouter, createRoutesFromElements, Route, Navigate, RouterProvider, Outlet } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Context Providers
import { AppProvider, useAppContext } from './context/AppContext';
import { SystemSettingsProvider } from './context/SystemSettingsContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import ScrollToTop from './components/ScrollToTop';
import InactivityWarning from './components/InactivityWarning';
import DynamicFavicon from './components/DynamicFavicon';
import DynamicTitle from './components/DynamicTitle';

// Loading component for Suspense fallback
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2" style={{borderColor: '#00b050'}}></div>
  </div>
);

// 🚀 Lazy loaded pages for better performance
// Core pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CustomerList = lazy(() => import('./pages/CustomerList'));
const CustomerDetails = lazy(() => import('./pages/CustomerDetails'));
const AddCustomer = lazy(() => import('./pages/AddCustomer'));
const EditCustomer = lazy(() => import('./pages/EditCustomer'));

// Savings Management pages
const SavingsAccounts = lazy(() => import('./pages/SavingsAccounts'));
const SavingsAccountDetails = lazy(() => import('./pages/SavingsAccountDetails'));
const AddSavingsAccount = lazy(() => import('./pages/AddSavingsAccount'));
const EditSavingsAccount = lazy(() => import('./pages/EditSavingsAccount'));
const Transactions = lazy(() => import('./pages/Transactions'));
const TransactionDetails = lazy(() => import('./pages/TransactionDetails'));
const DepositFunds = lazy(() => import('./pages/DepositFunds'));
const WithdrawFunds = lazy(() => import('./pages/WithdrawFunds'));
const DeviceVerifications = lazy(() => import('./pages/DeviceVerifications'));
const DeviceVerificationDetails = lazy(() => import('./pages/DeviceVerificationDetails'));

// Core admin features only - aligned with practical test requirements

// Import RootLayout
import RootLayout from './layout/RootLayout';

// Import Login page (not lazy loaded for faster initial load)
import Login from './pages/Login';

// Protected Route Component with Suspense
const ProtectedRoute = () => {
  const { user } = useAppContext();
  return user ? (
    <RootLayout>
      <ScrollToTop />
      <Suspense fallback={<LoadingFallback />}>
        <Outlet />
      </Suspense>
    </RootLayout>
  ) : (
    <Navigate to="/login" replace />
  );
};

// Main App Component
const App = () => {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route>
        <Route path="/login" element={<><ScrollToTop /><Login /></>} />
        
        <Route
          path="/*"
          element={<ProtectedRoute />}
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          
          {/* Customer Management Routes */}
          <Route path="customers" element={<CustomerList />} />
          <Route path="customers/add" element={<AddCustomer />} />
          <Route path="customers/:id" element={<CustomerDetails />} />
          <Route path="customers/edit/:id" element={<EditCustomer />} />
          
          {/* Savings Management Routes */}
          <Route path="savings-accounts" element={<SavingsAccounts />} />
          <Route path="savings-accounts/add" element={<AddSavingsAccount />} />
          <Route path="savings-accounts/:id" element={<SavingsAccountDetails />} />
          <Route path="savings-accounts/edit/:id" element={<EditSavingsAccount />} />
          
          {/* Transaction Management Routes */}
          <Route path="transactions" element={<Transactions />} />
          <Route path="transactions/:id" element={<TransactionDetails />} />
          <Route path="deposit-funds" element={<DepositFunds />} />
          <Route path="withdraw-funds" element={<WithdrawFunds />} />
          
          {/* Device Verification Routes */}
          <Route path="device-verifications" element={<DeviceVerifications />} />
          <Route path="device-verifications/:id" element={<DeviceVerificationDetails />} />
          
          {/* Core admin features only - aligned with practical test requirements */}
        </Route>
      </Route>
    )
  );

  return (
    <AppProvider>
      <SystemSettingsProvider>
        <ThemeProvider>
        <NotificationProvider>
            <div className="App">
          <DynamicFavicon />
          <DynamicTitle />
          <InactivityWarning />
              <RouterProvider router={router} />
              <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
              />
            </div>
        </NotificationProvider>
        </ThemeProvider>
      </SystemSettingsProvider>
    </AppProvider>
  );
};

export default App;