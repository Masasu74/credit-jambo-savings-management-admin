// 📁 pages/AddSavingsAccount.jsx
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import InputField from "../components/InputField";
import SelectField from "../components/SelectField";
import Button from "../components/Button";
import Loader from "../components/Loader";

const AddSavingsAccount = () => {
  const { createSavingsAccount, fetchCustomers, customers, customersLoading } = useAppContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [showConfirmationError, setShowConfirmationError] = useState(false);

  const [accountData, setAccountData] = useState({
    customerId: "",
    accountType: "regular",
    minimumBalance: 0,
    interestRate: 2.5,
  });

  // Fetch customers once on mount
  useEffect(() => {
    fetchCustomers(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isConfirmed) {
      setShowConfirmationError(true);
      toast.error("Please confirm that the information provided is correct.");
      return;
    }
    setShowConfirmationError(false);
    
    setLoading(true);

    try {
      const result = await createSavingsAccount(accountData);
      
      if (result.success) {
        // Small delay to show completion
        setTimeout(() => {
          navigate("/savings-accounts");
        }, 500);
      }
    } catch (err) {
      console.error("Savings account creation error:", err);
    } finally {
      setLoading(false);
    }
  };

  const accountTypeOptions = [
    { value: "regular", label: "Regular Savings" },
    { value: "premium", label: "Premium Savings" },
    { value: "fixed", label: "Fixed Deposit" }
  ];

  // Filter customers who don't already have a savings account
  const availableCustomers = Array.isArray(customers) ? customers.filter(customer => !customer.savingsAccount) : [];

  // Show loading state while customers are being fetched
  if (customersLoading) {
    return <Loader />;
  }

  return (
    <div className="form-page-container">
      <div className="form-page-header">
        <h1 className="form-page-title">Add Savings Account</h1>
        <p className="form-page-subtitle">Create new savings account for a customer</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="form-container"
      >
        <section className="form-section">
          <div className="form-section-header">
            <h2 className="form-section-title">Customer Selection</h2>
            <p className="form-section-subtitle">Select the customer for this savings account</p>
          </div>
          <div className="form-section-divider"></div>
          <div className="form-grid">
            <SelectField
              label="Select Customer"
              value={accountData.customerId}
              onChange={(e) => setAccountData({ ...accountData, customerId: e.target.value })}
              options={availableCustomers.map((customer) => ({ 
                value: customer._id, 
                label: `${customer.personalInfo?.fullName || 'Unknown Customer'} (${customer.customerCode || 'N/A'})` 
              }))}
              required
            />
            {availableCustomers.length === 0 && Array.isArray(customers) && customers.length > 0 && (
              <div className="col-span-full">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 text-sm">
                    <strong>No available customers:</strong> All customers already have savings accounts. 
                    <a href="/customers/add" className="text-blue-600 hover:text-blue-800 underline ml-1">
                      Add a new customer first
                    </a>
                  </p>
                </div>
              </div>
            )}
            {(!Array.isArray(customers) || customers.length === 0) && (
              <div className="col-span-full">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 text-sm">
                    <strong>No customers found:</strong> You need to add customers before creating savings accounts. 
                    <a href="/customers/add" className="text-blue-600 hover:text-blue-800 underline ml-1">
                      Add a customer first
                    </a>
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="form-section">
          <div className="form-section-header">
            <h2 className="form-section-title">Account Configuration</h2>
            <p className="form-section-subtitle">Set up the savings account parameters</p>
          </div>
          <div className="form-section-divider"></div>
          <div className="form-grid">
            <SelectField
              label="Account Type"
              value={accountData.accountType}
              onChange={(e) => setAccountData({ ...accountData, accountType: e.target.value })}
              options={accountTypeOptions}
              required
            />
            <InputField
              label="Minimum Balance (RWF)"
              type="number"
              value={accountData.minimumBalance}
              onChange={(e) => setAccountData({ ...accountData, minimumBalance: parseFloat(e.target.value) || 0 })}
              min="0"
              step="100"
              required
            />
            <InputField
              label="Interest Rate (%)"
              type="number"
              value={accountData.interestRate}
              onChange={(e) => setAccountData({ ...accountData, interestRate: parseFloat(e.target.value) || 0 })}
              min="0"
              max="100"
              step="0.1"
              required
            />
          </div>
        </section>

        <section className="form-section">
          <div className="form-section-header">
            <h2 className="form-section-title">Account Information</h2>
            <p className="form-section-subtitle">Review the account details</p>
          </div>
          <div className="form-section-divider"></div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Account Type</label>
                <p className="text-gray-900 dark:text-white font-medium">
                  {accountTypeOptions.find(opt => opt.value === accountData.accountType)?.label || accountData.accountType}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Minimum Balance</label>
                <p className="text-gray-900 dark:text-white font-medium">
                  {accountData.minimumBalance.toLocaleString()} RWF
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Interest Rate</label>
                <p className="text-gray-900 dark:text-white font-medium">
                  {accountData.interestRate}% per annum
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Initial Balance</label>
                <p className="text-gray-900 dark:text-white font-medium">
                  0 RWF
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className={`confirmation-section ${
          showConfirmationError 
            ? 'confirmation-section-error' 
            : 'confirmation-section-default'
        }`}>
          <div className="flex items-center gap-3">
            <div 
              className={`custom-checkbox ${
                isConfirmed 
                  ? 'custom-checkbox-checked' 
                  : 'custom-checkbox-unchecked'
              } ${showConfirmationError ? 'custom-checkbox-error' : ''}`}
              onClick={() => {
                setIsConfirmed(!isConfirmed);
                if (!isConfirmed) {
                  setShowConfirmationError(false);
                }
              }}
            >
              {isConfirmed && (
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <span 
              className={`confirmation-text ${
                showConfirmationError ? 'confirmation-text-error' : 'confirmation-text-default'
              }`}
              onClick={() => {
                setIsConfirmed(!isConfirmed);
                if (!isConfirmed) {
                  setShowConfirmationError(false);
                }
              }}
            >
              I confirm that the information provided is correct
            </span>
          </div>
          {showConfirmationError && (
            <p className="confirmation-error-message">
              Please check this box to confirm your information
            </p>
          )}
        </div>

        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={() => navigate("/savings-accounts")}>Cancel</Button>
          <Button 
            type="submit" 
            variant="primary" 
            loading={loading}
            disabled={availableCustomers.length === 0 || !Array.isArray(customers) || customers.length === 0}
          >
            Create Savings Account
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddSavingsAccount;