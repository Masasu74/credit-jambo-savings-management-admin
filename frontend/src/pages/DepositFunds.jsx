import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { 
  FaArrowDown,
  FaCheckCircle,
  FaTimesCircle
} from 'react-icons/fa';
import { toast } from 'react-toastify';

const DepositFunds = () => {
  const { api } = useAppContext();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    accountId: '',
    amount: '',
    description: ''
  });
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchAccounts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAccounts = async () => {
    try {
      const { data } = await api.get('/savings-accounts');
      // The backend returns data in this format: { success: true, data: { accounts: [...], pagination: {...} } }
      const accountsData = data.success && data.data?.accounts ? data.data.accounts : [];
      setAccounts(accountsData);
    } catch (err) {
      console.error('Error fetching accounts:', err);
      setError(err.message);
      setAccounts([]); // Ensure accounts is always an array
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data } = await api.post('/transactions/deposit', formData);

      // Handle successful deposit - the backend returns the transaction data
      if (data && data.success !== false) {
        toast.success('Deposit processed successfully');
        setSuccess(true);
        setTimeout(() => {
          navigate('/transactions');
        }, 1500);
      } else {
        const msg = data?.message || 'Deposit failed';
        toast.error(msg);
        setError(null);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Deposit failed';
      toast.error(errorMessage);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <FaCheckCircle className="mx-auto h-16 w-16 text-green-500" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Deposit Successful!
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Your deposit has been processed successfully.
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Redirecting to transactions...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{backgroundColor: '#00b050'}}>
            <FaArrowDown className="h-6 w-6 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Deposit Funds
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Add money to a customer's savings account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Errors are shown via toast to reduce on-page noise */}

            <div>
              <label htmlFor="accountId" className="block text-sm font-medium text-gray-700">
                Select Account
              </label>
              <select
                id="accountId"
                name="accountId"
                value={formData.accountId}
                onChange={handleChange}
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:text-sm"
                style={{focusRingColor: '#00b050'}}
              >
                <option value="">Choose an account...</option>
                {(accounts || []).map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.accountNumber} - {account.customer?.fullName || account.customerId?.fullName || 'Unknown Customer'} 
                    ({account.balance?.toLocaleString() || 0} RWF)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                Amount (RWF)
              </label>
              <input
                id="amount"
                name="amount"
                type="number"
                min="1"
                step="0.01"
                value={formData.amount}
                onChange={handleChange}
                required
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:text-sm"
                placeholder="Enter amount to deposit"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description (Optional)
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:text-sm"
                placeholder="Enter a description for this deposit"
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => navigate('/transactions')}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                style={{backgroundColor: '#00b050'}}
              >
                {loading ? 'Processing...' : 'Deposit Funds'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DepositFunds;
