// 📁 pages/CustomerDetails.jsx - Simplified to show only registration data
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAppContext } from "../context/AppContext";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaEdit,
  FaTimes,
  FaKey,
  FaCopy,
  FaCheckCircle,
  FaTimesCircle,
  FaShieldAlt,
  FaMapMarkerAlt,
  FaBuilding
} from "react-icons/fa";
import Button from "../components/Button";
import Loader from "../components/Loader";
import ConfirmationPopup from "../components/ConfirmationPopup";

const CustomerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const {
    fetchSingleCustomer,
    deleteCustomer,
    api
  } = useAppContext();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [actionType, setActionType] = useState("");
  const [showCredentials, setShowCredentials] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [showResetPasswordPopup, setShowResetPasswordPopup] = useState(false);

  useEffect(() => {
    if (id && id !== 'undefined') {
      const loadData = async () => {
        try {
          const customerData = await fetchSingleCustomer(id);
          setCustomer(customerData);
        } catch (err) {
          setError(err.message);
          toast.error(err.message || "Failed to load customer data");
        } finally {
          setLoading(false);
        }
      };
      loadData();
    } else {
      setError('Invalid customer ID');
      navigate('/customers');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Branches removed

  const handleResetPassword = async () => {
    try {
      setResettingPassword(true);
      setShowResetPasswordPopup(false);
      const { data } = await api.post(`/customers/${id}/reset-password`);
      
      if (data.success) {
        setCredentials(data.credentials);
        setShowCredentials(true);
        toast.success('Password reset successfully! Please share the new credentials with the customer.');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error(error.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setResettingPassword(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const handleConfirmAction = async () => {
    try {
      if (actionType === "delete") {
        await deleteCustomer(customer._id);
        navigate("/customers");
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message || "Failed to delete customer");
    } finally {
      setShowPopup(false);
    }
  };

  // Get branch name
  // Branches removed from platform

  if (loading) return <Loader />;
  if (error) return <div className="text-red-500 p-4">Error: {error}</div>;
  if (!customer) return <div>Customer not found</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-6 lg:p-8">
      {/* Header Section */}
      <div className="mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-900/50 p-6 md:p-8 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-4 border-white dark:border-gray-700 shadow-lg">
                  <FaUser className="text-white text-3xl" />
                </div>
                
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                    {customer.personalInfo?.fullName || customer.fullName || 'N/A'}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">Customer Code: {customer.customerCode}</p>
                  <div className="flex items-center gap-4 mt-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <FaEnvelope className="text-gray-400 dark:text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-300 text-sm">
                        {customer.contact?.email || customer.email || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaPhone className="text-gray-400 dark:text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-300 text-sm">
                        {customer.contact?.phone || customer.phone || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="primary"
                onClick={() => navigate(`/customers/edit/${customer._id}`)}
                className="flex items-center gap-2"
              >
                <FaEdit />
                Edit Customer
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowResetPasswordPopup(true)}
                disabled={resettingPassword}
                className="flex items-center gap-2"
              >
                <FaKey />
                {resettingPassword ? 'Resetting...' : 'Reset Password'}
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  setPopupMessage("Are you sure you want to delete this customer?");
                  setActionType("delete");
                  setShowPopup(true);
                }}
                className="flex items-center gap-2"
              >
                <FaTimes />
                Delete Customer
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Registration Information - Simplified to match mobile app */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Basic Information */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-900/50 p-6 md:p-8 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <FaUser className="text-blue-600 dark:text-blue-400 text-xl" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Registration Information</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <FaUser className="text-gray-400" />
                <span className="font-medium">Full Name</span>
              </div>
              <span className="text-gray-900 dark:text-white">{customer.personalInfo?.fullName || customer.fullName || 'N/A'}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <FaEnvelope className="text-gray-400" />
                <span className="font-medium">Email Address</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-900 dark:text-white">{customer.contact?.email || customer.email || 'N/A'}</span>
                {(customer.contact?.email || customer.email) && (
                  <button
                    onClick={() => copyToClipboard(customer.contact?.email || customer.email)}
                    className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                  >
                    <FaCopy size={12} />
                    Copy
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <FaPhone className="text-gray-400" />
                <span className="font-medium">Phone Number</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-900 dark:text-white">{customer.contact?.phone || customer.phone || 'N/A'}</span>
                {(customer.contact?.phone || customer.phone) && (
                  <button
                    onClick={() => copyToClipboard(customer.contact?.phone || customer.phone)}
                    className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                  >
                    <FaCopy size={12} />
                    Copy
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Account Information */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-900/50 p-6 md:p-8 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <FaKey className="text-purple-600 dark:text-purple-400 text-xl" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Account</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <FaKey className="text-gray-400" />
                <span className="font-medium">Customer Code</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-900 dark:text-white">{customer.customerCode || 'N/A'}</span>
                {customer.customerCode && (
                  <button
                    onClick={() => copyToClipboard(customer.customerCode)}
                    className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                  >
                    <FaCopy size={12} />
                    Copy
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Status Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-900/50 p-6 md:p-8 border border-gray-200 dark:border-gray-700 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <FaShieldAlt className="text-green-600 dark:text-green-400 text-xl" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Account Status</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <span className="text-gray-600 dark:text-gray-300 font-medium block mb-2">Account Status</span>
            <div className="flex items-center gap-2">
              {customer.isActive ? (
                <>
                  <FaCheckCircle className="text-green-600" />
                  <span className="text-green-600 font-semibold">Active</span>
                </>
              ) : (
                <>
                  <FaTimesCircle className="text-red-600" />
                  <span className="text-red-600 font-semibold">Inactive</span>
                </>
              )}
            </div>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <span className="text-gray-600 dark:text-gray-300 font-medium block mb-2">Device Verification</span>
            <div className="flex items-center gap-2">
              {customer.deviceVerified ? (
                <>
                  <FaCheckCircle className="text-green-600" />
                  <span className="text-green-600 font-semibold">Verified</span>
                </>
              ) : (
                <>
                  <FaTimesCircle className="text-yellow-600" />
                  <span className="text-yellow-600 font-semibold">Not Verified</span>
                </>
              )}
            </div>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <span className="text-gray-600 dark:text-gray-300 font-medium block mb-2">Registration Source</span>
            <div className="flex items-center gap-2">
              <span className={`font-semibold ${
                customer.accountCreationSource === 'staff' 
                  ? 'text-blue-600' 
                  : 'text-purple-600'
              }`}>
                {customer.accountCreationSource === 'staff' ? 'Staff Created' : 'Self Registered'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Credentials Modal */}
      {showCredentials && credentials && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaKey className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Password Reset Complete
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                New credentials have been generated. Please share these with the customer.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3 mb-6">
              {credentials.password && (
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">New Password</label>
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <p className="font-mono font-bold text-green-600">{credentials.password}</p>
                    <button
                      onClick={() => copyToClipboard(credentials.password)}
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                setShowCredentials(false);
                setCredentials(null);
              }}
              className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Reset Password Confirmation */}
      <ConfirmationPopup
        isOpen={showResetPasswordPopup}
        message="Are you sure you want to reset this customer's password? A new temporary password will be generated."
        onConfirm={handleResetPassword}
        onCancel={() => setShowResetPasswordPopup(false)}
        confirmText="Reset Password"
        cancelText="Cancel"
      />

      {/* Delete Confirmation */}
      <ConfirmationPopup
        isOpen={showPopup}
        message={popupMessage}
        onConfirm={handleConfirmAction}
        onCancel={() => setShowPopup(false)}
        confirmText="Confirm"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};

export default CustomerDetails;
