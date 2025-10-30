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
  const { createSavingsAccount, fetchCustomers, customers, customersLoading, api } = useAppContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [showConfirmationError, setShowConfirmationError] = useState(false);
  const [accountProducts, setAccountProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);

  const [accountData, setAccountData] = useState({
    customerId: "",
    productId: "",
    accountType: "",
    minimumBalance: 0,
    interestRate: 0,
  });

  // Fetch customers and products once on mount
  useEffect(() => {
    fetchCustomers(true);
    fetchAccountProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debug: Log customer data to check structure
  useEffect(() => {
    if (customers.length > 0) {
      console.log('AddSavingsAccount - Sample customer:', customers[0]);
      console.log('AddSavingsAccount - Customer structure:', {
        personalInfo: customers[0].personalInfo,
        customerCode: customers[0].customerCode
      });
    }
  }, [customers]);

  const fetchAccountProducts = async () => {
    try {
      setProductsLoading(true);
      const { data } = await api.get('/account-products/active');
      if (data.success) {
        setAccountProducts(data.data);
      }
    } catch (error) {
      console.error('Error fetching account products:', error);
      toast.error('Failed to load account products');
    } finally {
      setProductsLoading(false);
    }
  };

  const handleProductChange = (e) => {
    const productId = e.target.value;
    const selectedProduct = accountProducts.find(p => p._id === productId);
    
    if (selectedProduct) {
      setAccountData({
        ...accountData,
        productId,
        accountType: selectedProduct.accountType,
        minimumBalance: selectedProduct.minimumBalance || 0,
        interestRate: selectedProduct.interestRate || 0,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!accountData.customerId) {
      toast.error("Please select a customer.");
      return;
    }
    
    if (!accountData.productId) {
      toast.error("Please select an account product.");
      return;
    }
    
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

  // Filter customers who don't already have a savings account
  const availableCustomers = Array.isArray(customers) ? customers.filter(customer => !customer.savingsAccount) : [];

  // Show loading state while customers or products are being fetched
  if (customersLoading || productsLoading) {
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
              options={availableCustomers.map((customer) => {
                // Try multiple possible field names for customer name
                const customerName = 
                  customer.personalInfo?.fullName || 
                  customer.fullName || 
                  customer.name || 
                  'Unknown Customer';
                return { 
                  value: customer._id, 
                  label: `${customerName} (${customer.customerCode || 'N/A'})` 
                };
              })}
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
            <h2 className="form-section-title">Account Product Selection</h2>
            <p className="form-section-subtitle">Choose the product for this savings account</p>
          </div>
          <div className="form-section-divider"></div>
          <div className="form-grid">
            {productsLoading ? (
              <div className="col-span-full flex items-center justify-center py-8">
                <Loader />
              </div>
            ) : (
              <>
                <SelectField
                  label="Select Account Product"
                  value={accountData.productId}
                  onChange={handleProductChange}
                  options={[
                    { value: "", label: "Select a product..." },
                    ...accountProducts.map((product) => ({
                      value: product._id,
                      label: `${product.productName} (${product.productCode})`
                    }))
                  ]}
                  required
                />
                {accountData.productId && (
                  <>
                    <div className="col-span-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
                        Product Details
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-blue-700 dark:text-blue-400">Product:</span>
                          <span className="ml-2 text-blue-900 dark:text-blue-200 font-medium">
                            {accountProducts.find(p => p._id === accountData.productId)?.productName}
                          </span>
                        </div>
                        <div>
                          <span className="text-blue-700 dark:text-blue-400">Type:</span>
                          <span className="ml-2 text-blue-900 dark:text-blue-200 font-medium capitalize">
                            {accountData.accountType}
                          </span>
                        </div>
                        <div>
                          <span className="text-blue-700 dark:text-blue-400">Minimum Balance:</span>
                          <span className="ml-2 text-blue-900 dark:text-blue-200 font-medium">
                            {accountData.minimumBalance.toLocaleString()} RWF
                          </span>
                        </div>
                        <div>
                          <span className="text-blue-700 dark:text-blue-400">Interest Rate:</span>
                          <span className="ml-2 text-blue-900 dark:text-blue-200 font-medium">
                            {accountData.interestRate}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
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
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Selected Product</label>
                <p className="text-gray-900 dark:text-white font-medium">
                  {accountData.productId 
                    ? accountProducts.find(p => p._id === accountData.productId)?.productName 
                    : 'Not selected'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Account Type</label>
                <p className="text-gray-900 dark:text-white font-medium capitalize">
                  {accountData.accountType || 'Not selected'}
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
            disabled={
              availableCustomers.length === 0 || 
              !Array.isArray(customers) || 
              customers.length === 0 || 
              !accountData.productId ||
              accountProducts.length === 0
            }
          >
            Create Savings Account
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddSavingsAccount;