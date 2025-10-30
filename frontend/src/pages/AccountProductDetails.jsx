import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  FaEdit, 
  FaTrash, 
  FaToggleOn, 
  FaToggleOff,
  FaArrowLeft,
  FaCheckCircle,
  FaTimesCircle,
  FaUsers,
  FaChartLine,
  FaCalendarAlt
} from 'react-icons/fa';

const AccountProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchProductDetails();
    fetchProductStats();
    fetchCustomers();
  }, [id]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/account-products/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch product details');
      }

      const data = await response.json();
      if (data.success) {
        setProduct(data.data);
      }
    } catch (err) {
      console.error('Error fetching product details:', err);
      toast.error('Failed to load product details');
      navigate('/account-products');
    } finally {
      setLoading(false);
    }
  };

  const fetchProductStats = async () => {
    try {
      const response = await fetch(`/api/account-products/${id}/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStats(data.data);
        }
      }
    } catch (err) {
      console.error('Error fetching product stats:', err);
    }
  };

  const fetchCustomers = async () => {
    try {
      setLoadingCustomers(true);
      // Fetch all savings accounts that use this product
      const response = await fetch('/api/savings-accounts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Filter accounts for this product and extract customer info
          const productAccounts = data.data.accounts
            ? data.data.accounts.filter(account => account.productId === id)
            : [];
          
          const customersList = productAccounts.map(account => ({
            id: account.customerId?._id,
            name: account.customerId?.personalInfo?.fullName || 'Unknown',
            email: account.customerId?.contact?.email || 'N/A',
            phone: account.customerId?.contact?.phone || 'N/A',
            accountNumber: account.accountNumber,
            balance: account.balance,
            createdAt: account.createdAt
          }));
          
          setCustomers(customersList);
        }
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const handleToggleStatus = async () => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/account-products/${id}/toggle-status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to toggle product status');
      }

      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        fetchProductDetails();
        fetchProductStats();
      }
    } catch (err) {
      console.error('Error toggling product status:', err);
      toast.error('Failed to toggle product status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(`/api/account-products/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete product');
      }

      toast.success('Product deleted successfully');
      navigate('/account-products');
    } catch (err) {
      console.error('Error deleting product:', err);
      toast.error(err.message || 'Failed to delete product');
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <FaTimesCircle className="text-red-500 text-5xl mx-auto mb-4" />
        <p className="text-gray-600 text-lg">Product not found</p>
        <Link
          to="/account-products"
          className="inline-block mt-4 text-blue-600 hover:text-blue-700"
        >
          Back to Products
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/account-products')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FaArrowLeft className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{product.productName}</h1>
            <p className="text-gray-600 mt-1">Product Code: {product.productCode}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleToggleStatus}
            disabled={actionLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              product.isActive 
                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {product.isActive ? <FaToggleOn className="text-xl" /> : <FaToggleOff className="text-xl" />}
            {product.isActive ? 'Active' : 'Inactive'}
          </button>
          <Link
            to={`/account-products/${id}/edit`}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <FaEdit /> Edit
          </Link>
          <button
            onClick={handleDelete}
            disabled={actionLoading}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            <FaTrash /> Delete
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Accounts</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalAccounts}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <FaUsers className="text-blue-600 text-xl" />
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Accounts</p>
                <p className="text-2xl font-bold text-green-600">{stats.accountsWithBalance}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <FaCheckCircle className="text-green-600 text-xl" />
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inactive Accounts</p>
                <p className="text-2xl font-bold text-gray-600">{stats.accountsWithoutBalance}</p>
              </div>
              <div className="bg-gray-100 p-3 rounded-full">
                <FaTimesCircle className="text-gray-600 text-xl" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Product Name</label>
              <p className="text-gray-900 mt-1">{product.productName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Product Code</label>
              <p className="text-gray-900 mt-1 font-mono">{product.productCode}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Account Type</label>
              <p className="text-gray-900 mt-1">
                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                  {product.accountType}
                </span>
              </p>
            </div>
            {product.description && (
              <div>
                <label className="text-sm font-medium text-gray-600">Description</label>
                <p className="text-gray-900 mt-1">{product.description}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-600">Status</label>
              <p className="text-gray-900 mt-1">
                {product.isActive ? (
                  <span className="flex items-center gap-2 text-green-600">
                    <FaCheckCircle /> Active
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-gray-600">
                    <FaTimesCircle /> Inactive
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Financial Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Financial Details</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Interest Rate</label>
              <p className="text-gray-900 mt-1 text-2xl font-bold">
                {product.interestRate}% 
                <span className="text-sm font-normal text-gray-600 ml-2">{product.interestFrequency}</span>
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Minimum Deposit</label>
              <p className="text-gray-900 mt-1 text-lg">{formatCurrency(product.minimumDeposit)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Minimum Balance</label>
              <p className="text-gray-900 mt-1 text-lg">{formatCurrency(product.minimumBalance)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Monthly Fee</label>
              <p className="text-gray-900 mt-1 text-lg">
                {product.monthlyFee > 0 ? formatCurrency(product.monthlyFee) : 'Free'}
              </p>
            </div>
          </div>
        </div>

        {/* Transaction Limits */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Transaction Limits</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Min Deposit Amount</label>
              <p className="text-gray-900 mt-1">{formatCurrency(product.depositLimits?.minDeposit || 0)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Max Deposit Amount</label>
              <p className="text-gray-900 mt-1">
                {product.depositLimits?.maxDeposit 
                  ? formatCurrency(product.depositLimits.maxDeposit) 
                  : 'No limit'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Min Withdrawal Amount</label>
              <p className="text-gray-900 mt-1">{formatCurrency(product.depositLimits?.minWithdrawal || 0)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Max Withdrawal Amount</label>
              <p className="text-gray-900 mt-1">
                {product.depositLimits?.maxWithdrawal 
                  ? formatCurrency(product.depositLimits.maxWithdrawal) 
                  : 'No limit'}
              </p>
            </div>
          </div>
        </div>

        {/* Eligibility & Features */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Eligibility & Features</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Age Range</label>
              <p className="text-gray-900 mt-1">
                {product.eligibility?.minAge || 18} - {product.eligibility?.maxAge || '∞'} years
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Minimum Salary</label>
              <p className="text-gray-900 mt-1">
                {product.eligibility?.minSalary > 0 
                  ? formatCurrency(product.eligibility.minSalary) 
                  : 'No requirement'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Features</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.features && product.features.length > 0 ? (
                  product.features.map((feature, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                    >
                      {feature}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500 text-sm">No features specified</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metadata */}
      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Additional Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Display Order</label>
            <p className="text-gray-900 mt-1">{product.displayOrder || 0}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Created At</label>
            <p className="text-gray-900 mt-1 flex items-center gap-2">
              <FaCalendarAlt className="text-gray-400" />
              {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : 'N/A'}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Last Updated</label>
            <p className="text-gray-900 mt-1 flex items-center gap-2">
              <FaCalendarAlt className="text-gray-400" />
              {product.updatedAt ? new Date(product.updatedAt).toLocaleDateString() : 'N/A'}
            </p>
          </div>
          {product.createdBy && (
            <div>
              <label className="text-sm font-medium text-gray-600">Created By</label>
              <p className="text-gray-900 mt-1">{product.createdBy.name || product.createdBy.email || 'N/A'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Customers Using This Product */}
      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FaUsers className="text-blue-600" />
              Customers Using This Product ({customers.length})
            </h2>
            <p className="text-gray-600 mt-1 text-sm">List of all customers with accounts for this product</p>
          </div>
        </div>

        {loadingCustomers ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-12">
            <FaUsers className="text-gray-400 text-4xl mx-auto mb-4" />
            <p className="text-gray-600">No customers using this product yet</p>
            <p className="text-gray-500 text-sm mt-2">Customers will appear here once they create an account with this product</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Account Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{customer.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{customer.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-gray-900">{customer.accountNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-green-600">
                        {formatCurrency(customer.balance)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(customer.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        to={`/customers/${customer.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <FaEye />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountProductDetails;

