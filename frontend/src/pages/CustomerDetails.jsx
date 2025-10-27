import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAppContext } from "../context/AppContext";
import { getUploadUrl } from "../utils/apiUtils";
import { useScrollPosition, getScrollBasedModalClasses } from "../hooks/useScrollPosition";
import { usePopupAnimation } from "../hooks/usePopupAnimation";
import {
  FaUser,
  FaIdCard,
  FaBriefcase,
  FaFilePdf,
  FaDownload,
  FaEye,
  FaEyeSlash,
  FaEdit,
  FaCheckCircle,
  FaTimesCircle,
  FaPause,
  FaTimes,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaFileAlt,
  FaHeart,
  FaUserTie,
  FaStore,
  FaFileContract,
  FaCertificate,
  FaTrash,
  FaKey,
  FaCopy
} from "react-icons/fa";
import DataView from "../components/DataView";
import Button from "../components/Button";
import Loader from "../components/Loader";
import ConfirmationPopup from "../components/ConfirmationPopup";

const CustomerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    api,
    fetchSingleCustomer,
    deleteCustomer,
  } = useAppContext();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [actionType, setActionType] = useState("");
  const [loans, setLoans] = useState([]);
  const [showCredentials, setShowCredentials] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [showResetPasswordPopup, setShowResetPasswordPopup] = useState(false);

  useEffect(() => {
    if (id && id !== 'undefined') {
      const loadData = async () => {
        try {
          const [customerData, loansData] = await Promise.all([
            fetchSingleCustomer(id),
            api.get(`/customer/${id}/loans`),
          ]);

          setCustomer(customerData);
          setLoans(loansData.data.data);
        } catch (err) {
          setError(err.message);
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

  const handleResetPassword = async () => {
    try {
      setResettingPassword(true);
      setShowResetPasswordPopup(false);
      const { data } = await api.post(`/customer/${id}/reset-password`);
      
      if (data.success) {
        setCredentials(data.credentials);
        setShowCredentials(true);
        toast.success('Password reset successfully! Please share the new credentials with the customer.');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error('Failed to reset password. Please try again.');
    } finally {
      setResettingPassword(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const handleDownload = async (filename) => {
    try {
      const fileUrl = getUploadUrl(filename);
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(`Download failed: ${err.message}`);
    }
  };

  const handlePreview = (filename) => {
    const fileUrl = getUploadUrl(filename);
    // Open in new tab to prevent page refresh
    const newWindow = window.open(fileUrl, "_blank", "noopener,noreferrer");
    if (!newWindow) {
      // Fallback if popup is blocked
      window.location.href = fileUrl;
    }
  };

  const handleDeleteFile = async (fieldName, documentType) => {
    const confirmed = window.confirm(`Are you sure you want to delete the ${documentType}? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      const response = await api.put(`/customers/${id}`, {
        [fieldName]: null
      });
      
      if (response.success) {
        toast.success(`${documentType} deleted successfully`);
        // Refresh the customer data
        const customerData = await fetchSingleCustomer(id);
        setCustomer(customerData);
      } else {
        throw new Error(response.message || 'Failed to delete document');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error(error.message || 'Failed to delete document');
    }
  };

  const handleDeleteAdditionalFile = async (index, fileName) => {
    const confirmed = window.confirm(`Are you sure you want to delete "${fileName}"? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      const updatedFiles = customer.additionalFiles.filter((_, i) => i !== index);
      const response = await api.put(`/customers/${id}`, {
        additionalFiles: updatedFiles
      });
      
      if (response.success) {
        toast.success('Document deleted successfully');
        // Refresh the customer data
        const customerData = await fetchSingleCustomer(id);
        setCustomer(customerData);
      } else {
        throw new Error(response.message || 'Failed to delete document');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error(error.message || 'Failed to delete document');
    }
  };

  const calculateRemainingMonths = (loan) => {
    if (loan.status === "ongoing" && loan.approvalDate) {
      const startDate = new Date(loan.approvalDate);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + loan.durationMonths);
      const today = new Date();
      return Math.max(
        Math.ceil((endDate - today) / (1000 * 60 * 60 * 24 * 30)),
        0
      );
    }
    return "-";
  };

  const handleConfirmAction = async () => {
    try {
      if (actionType === "delete") {
        await deleteCustomer(customer._id);
        navigate("/customers");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setShowPopup(false);
    }
  };

  const handleLoanAction = async (loanId, action) => {
    try {
      const { data } = await api.put(`/loans/${loanId}/status`, { status: action });
      if (data.success) {
        setLoans((prev) =>
          prev.map((loan) =>
            loan._id === loanId ? { ...loan, status: action } : loan
          )
        );
        toast.success(`Loan ${action} successfully`);
      }
    } catch (err) {
      setError(err.message || "Action failed");
      toast.error(err.message || "Failed to update loan status");
    }
  };

  const getEmploymentStatusColor = (status) => {
    switch (status) {
      case 'Employed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Self-Employed': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Unemployed': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getEmploymentStatusIcon = (status) => {
    switch (status) {
      case 'Employed': return <FaUserTie className="text-emerald-600" />;
      case 'Self-Employed': return <FaStore className="text-blue-600" />;
      case 'Unemployed': return <FaUser className="text-red-600" />;
      default: return <FaUser className="text-gray-600" />;
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'Frw 0';
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) return <Loader />;
  if (error) return <div className="text-red-500 p-4">Error: {error}</div>;
  if (!customer) return <div>Customer not found</div>;

  const columns = [
    { 
      key: "product", 
      header: "Loan Product",
      render: (item) => {
        if (item.product?.name) {
          return item.product.name;
        }
        if (item.loanType) {
          return `${item.loanType} (Legacy)`;
        }
        return 'N/A';
      }
    },
    {
      key: "amount",
      header: "Loan Amount (FRW)",
      render: (item) => formatCurrency(item.amount),
    },
    { key: "durationMonths", header: "Duration (Months)" },
    {
      key: "status",
      header: "Loan Status",
      render: (item) => {
        const statusColors = {
          pending: "bg-yellow-100 text-yellow-800",
          approved: "bg-green-100 text-green-800",
          rejected: "bg-red-100 text-red-800",
          ongoing: "bg-blue-100 text-blue-800",
          completed: "bg-gray-100 text-gray-800",
        };

        return (
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              statusColors[item.status]
            }`}
          >
            {item.status}
          </span>
        );
      },
    },
    {
      key: "remainingMonths",
      header: "Remaining Months",
      render: (item) => calculateRemainingMonths(item),
    },
  ];

  const renderActions = (loan) => (
    <div className="flex gap-3">
      <FaEye
        className="text-blue-600 cursor-pointer hover:text-blue-800"
        title="View Details"
        onClick={() => navigate(`/loans/${loan._id}`)}
      />
      {loan.status === "ongoing" && (
        <>
          <FaPause
            className="text-yellow-600 cursor-pointer hover:text-yellow-800"
            title="Pause Loan"
            onClick={() => handleLoanAction(loan._id, "pause")}
          />
          <FaTimes
            className="text-red-600 cursor-pointer hover:text-red-800"
            title="Cancel Loan"
            onClick={() => handleLoanAction(loan._id, "cancel")}
          />
        </>
      )}
      {loan.status === "pending" && (
        <>
          <FaCheckCircle
            className="text-green-600 cursor-pointer hover:text-green-800"
            title="Approve Loan"
            onClick={() => handleLoanAction(loan._id, "approve")}
          />
          <FaTimesCircle
            className="text-red-600 cursor-pointer hover:text-red-800"
            title="Reject Loan"
            onClick={() => handleLoanAction(loan._id, "reject")}
          />
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-6 lg:p-8">
            {/* Header Section */}
      <div className="mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-900/50 p-6 md:p-8 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                {/* Customer Photo */}
                {customer.personalInfo?.photo ? (
                  <div className="relative">
                    <img
                      src={getUploadUrl(customer.personalInfo.photo)}
                      alt="Customer Photo"
                      className="w-20 h-20 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-lg"
                    />
                    <button
                      onClick={() => handlePreview(customer.personalInfo.photo)}
                      className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-2 hover:bg-blue-600 transition-colors"
                      title="View Full Size"
                    >
                      <FaEye size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center border-4 border-white dark:border-gray-700 shadow-lg">
                    <FaUser className="text-gray-400 dark:text-gray-500 text-2xl" />
                  </div>
                )}
                
        <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            {customer.fullName || customer.personalInfo?.fullName}
          </h1>
                  <p className="text-gray-600 dark:text-gray-300">Customer ID: {customer._id}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-2">
                      <FaCalendarAlt className="text-gray-400 dark:text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-300">
                        {new Date(customer.personalInfo?.dob).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaIdCard className="text-gray-400 dark:text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-300">{customer.personalInfo?.idNumber}</span>
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
            Edit Profile
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

      {/* Customer Portal Credentials Section */}
      <div className="mb-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-900/50 p-6 md:p-8 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <FaKey className="text-purple-600 dark:text-purple-400 text-xl" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Customer Portal Access</h2>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 dark:text-gray-300 font-medium block">Email</span>
              <button
                onClick={() => copyToClipboard(customer.email || customer.contact?.email)}
                className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
              >
                <FaCopy size={12} />
                Copy
              </button>
            </div>
            <span className="text-gray-900 dark:text-white font-semibold font-mono text-sm">{customer.email || customer.contact?.email}</span>
          </div>
          
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 dark:text-gray-300 font-medium block">Customer Code</span>
              <button
                onClick={() => copyToClipboard(customer.customerCode)}
                className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
              >
                <FaCopy size={12} />
                Copy
              </button>
            </div>
            <span className="text-gray-900 dark:text-white font-semibold font-mono text-sm">{customer.customerCode}</span>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <span className="text-gray-600 dark:text-gray-300 font-medium block mb-2">Account Status</span>
            <div className="flex items-center gap-2">
              {customer.onboardingCompleted ? (
                <>
                  <FaCheckCircle className="text-green-600" />
                  <span className="text-green-600 font-semibold">Profile Complete</span>
                </>
              ) : (
                <>
                  <FaTimesCircle className="text-yellow-600" />
                  <span className="text-yellow-600 font-semibold">Profile Incomplete</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <FaKey className="text-blue-600" size={14} />
              <span className="text-sm font-semibold text-blue-800 dark:text-blue-200">Password Status</span>
            </div>
            <p className="text-xs text-blue-800 dark:text-blue-200">
              {customer.accountCreationSource === 'self-registration' ? (
                <>✅ Customer set their own password during registration</>
              ) : (
                <>🔐 Password was generated by staff. Click &quot;Reset Password&quot; to generate a new one.</>
              )}
            </p>
          </div>

          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <FaCalendarAlt className="text-purple-600" size={14} />
              <span className="text-sm font-semibold text-purple-800 dark:text-purple-200">Last Login</span>
            </div>
            <p className="text-xs text-purple-800 dark:text-purple-200">
              {customer.lastLogin ? (
                new Date(customer.lastLogin).toLocaleString()
              ) : (
                'Never logged in'
              )}
            </p>
          </div>
        </div>

        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-xs text-yellow-800 dark:text-yellow-200">
            <strong>🔒 Security Note:</strong> Passwords are encrypted and cannot be viewed. Use the &quot;Reset Password&quot; button above to generate new credentials if the customer needs access.
          </p>
        </div>
      </div>

      {/* Credentials Modal */}
      <CredentialsModal 
        isOpen={showCredentials}
        credentials={credentials}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        copyToClipboard={copyToClipboard}
        onClose={() => {
          setShowCredentials(false);
          setShowPassword(false);
        }}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        {/* Personal Information Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-900/50 p-6 md:p-8 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <FaUser className="text-blue-600 dark:text-blue-400 text-xl" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Personal Information</h2>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-gray-600 dark:text-gray-300 font-medium block mb-1">Full Name</span>
                <span className="text-gray-900 dark:text-white font-semibold">{customer.personalInfo?.fullName}</span>
              </div>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-gray-600 dark:text-gray-300 font-medium block mb-1">Date of Birth</span>
                <span className="text-gray-900 dark:text-white font-semibold">
                  {new Date(customer.personalInfo?.dob).toLocaleDateString()}
                </span>
              </div>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-gray-600 dark:text-gray-300 font-medium block mb-1">Gender</span>
                <span className="text-gray-900 dark:text-white font-semibold">{customer.personalInfo?.gender}</span>
              </div>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-gray-600 dark:text-gray-300 font-medium block mb-1">Nationality</span>
                <span className="text-gray-900 dark:text-white font-semibold">{customer.personalInfo?.nationality}</span>
              </div>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-gray-600 dark:text-gray-300 font-medium block mb-1">Place of Birth</span>
                <span className="text-gray-900 dark:text-white font-semibold">{customer.personalInfo?.placeOfBirth}</span>
              </div>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-gray-600 dark:text-gray-300 font-medium block mb-1">ID Number</span>
                <span className="text-gray-900 dark:text-white font-semibold">{customer.personalInfo?.idNumber}</span>
              </div>
            </div>
            
            {/* Marital Status */}
            <div className="p-4 bg-pink-50 rounded-lg border border-pink-200">
              <div className="flex items-center gap-2 mb-3">
                <FaHeart className="text-pink-600" />
                <span className="font-medium text-pink-800">Marital Status</span>
              </div>
              <span className="text-pink-900 font-semibold">{customer.maritalStatus?.status}</span>
            </div>
          </div>
        </div>

        {/* Contact Information Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <FaIdCard className="text-green-600 text-xl" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Contact Information</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <FaPhone className="text-gray-400" />
              <div>
                <span className="text-gray-600 font-medium block">Phone</span>
                <span className="text-gray-900 font-semibold">{customer.contact?.phone}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <FaEnvelope className="text-gray-400" />
              <div>
                <span className="text-gray-600 font-medium block">Email</span>
                <span className="text-gray-900 font-semibold">{customer.contact?.email || 'N/A'}</span>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
              <FaMapMarkerAlt className="text-gray-400 mt-1" />
              <div>
                <span className="text-gray-600 font-medium block">Address</span>
                <span className="text-gray-900 font-semibold">
              {[
                customer.contact?.address?.province,
                customer.contact?.address?.district,
                customer.contact?.address?.sector,
                customer.contact?.address?.cell,
                customer.contact?.address?.village,
              ]
                .filter(Boolean)
                .join(", ")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Employment Details Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FaBriefcase className="text-purple-600 text-xl" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Employment Details</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              {getEmploymentStatusIcon(customer.employment?.status)}
              <div className="flex-1">
                <span className="text-gray-600 font-medium block">Status</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getEmploymentStatusColor(customer.employment?.status)}`}>
                {customer.employment?.status || "N/A"}
              </span>
              </div>
            </div>
            
            {customer.employment?.status === "Employed" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <span className="text-gray-600 font-medium block mb-1">Job Title</span>
                    <span className="text-gray-900 font-semibold">{customer.employment?.jobTitle}</span>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <span className="text-gray-600 font-medium block mb-1">Employer</span>
                    <span className="text-gray-900 font-semibold">{customer.employment?.employerName}</span>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <span className="text-gray-600 font-medium block mb-1">Salary</span>
                    <span className="text-gray-900 font-semibold">{formatCurrency(customer.employment?.salary)}</span>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <span className="text-gray-600 font-medium block mb-1">Contact</span>
                    <span className="text-gray-900 font-semibold">{customer.employment?.employerContact}</span>
                  </div>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <span className="text-gray-600 font-medium block mb-1">Employer Address</span>
                  <span className="text-gray-900 font-semibold">{customer.employment?.employerAddress}</span>
                </div>
              </>
            )}
            
            {customer.employment?.status === "Self-Employed" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <span className="text-gray-600 font-medium block mb-1">Business Name</span>
                  <span className="text-gray-900 font-semibold">{customer.employment?.businessName}</span>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <span className="text-gray-600 font-medium block mb-1">Business Type</span>
                  <span className="text-gray-900 font-semibold">{customer.employment?.businessType}</span>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg md:col-span-2">
                  <span className="text-gray-600 font-medium block mb-1">Monthly Revenue</span>
                  <span className="text-gray-900 font-semibold">{formatCurrency(customer.employment?.monthlyRevenue)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Uploaded Documents Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-orange-100 rounded-lg">
              <FaFilePdf className="text-orange-600 text-xl" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Uploaded Documents</h2>
          </div>
          
          <div className="space-y-4">
            {/* ID Documents */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <FaIdCard className="text-blue-600" />
                <span className="font-medium text-blue-800">Identity Documents</span>
              </div>
              
              {customer.personalInfo?.idFile && (
                <div className="flex items-center justify-between p-3 bg-white rounded-md mb-2">
                  <span className="text-sm font-medium text-gray-700">ID/Passport</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePreview(customer.personalInfo.idFile)}
                      className="p-1 text-blue-600 hover:text-blue-800"
                      title="Preview document"
                    >
                      <FaEye size={14} />
                    </button>
                    <button
                      onClick={() => handleDownload(customer.personalInfo.idFile)}
                      className="p-1 text-green-600 hover:text-green-800"
                      title="Download document"
                    >
                      <FaDownload size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteFile('idFile', 'ID/Passport document')}
                      className="p-1 text-red-600 hover:text-red-800"
                      title="Delete document"
                    >
                      <FaTrash size={14} />
                    </button>
                  </div>
                </div>
              )}
              
              {customer.maritalStatus?.status === "Married" && customer.maritalStatus?.spouseIdFile && (
                <div className="flex items-center justify-between p-3 bg-white rounded-md mb-2">
                  <span className="text-sm font-medium text-gray-700">Spouse ID</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePreview(customer.maritalStatus.spouseIdFile)}
                      className="p-1 text-blue-600 hover:text-blue-800"
                      title="Preview document"
                    >
                      <FaEye size={14} />
                    </button>
                    <button
                      onClick={() => handleDownload(customer.maritalStatus.spouseIdFile)}
                      className="p-1 text-green-600 hover:text-green-800"
                      title="Download document"
                    >
                      <FaDownload size={14} />
                    </button>
                  </div>
                </div>
              )}
              
              {customer.maritalStatus?.status === "Married" && customer.maritalStatus?.marriageCertFile && (
                <div className="flex items-center justify-between p-3 bg-white rounded-md">
                  <span className="text-sm font-medium text-gray-700">Marriage Certificate</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePreview(customer.maritalStatus.marriageCertFile)}
                      className="p-1 text-blue-600 hover:text-blue-800"
                      title="Preview document"
                    >
                      <FaEye size={14} />
                    </button>
                    <button
                      onClick={() => handleDownload(customer.maritalStatus.marriageCertFile)}
                      className="p-1 text-green-600 hover:text-green-800"
                      title="Download document"
                    >
                      <FaDownload size={14} />
                    </button>
                  </div>
                </div>
              )}
              
              {(customer.maritalStatus?.status === "Single" || customer.maritalStatus?.status === "Divorced" || customer.maritalStatus?.status === "Widowed") && customer.maritalStatus?.singleCertFile && (
                <div className="flex items-center justify-between p-3 bg-white rounded-md">
                  <span className="text-sm font-medium text-gray-700">Single Certificate</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePreview(customer.maritalStatus.singleCertFile)}
                      className="p-1 text-blue-600 hover:text-blue-800"
                      title="Preview document"
                    >
                      <FaEye size={14} />
                    </button>
                    <button
                      onClick={() => handleDownload(customer.maritalStatus.singleCertFile)}
                      className="p-1 text-green-600 hover:text-green-800"
                      title="Download document"
                    >
                      <FaDownload size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Employment Documents */}
            {customer.employment?.status === "Employed" && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-3">
                  <FaFileContract className="text-green-600" />
                  <span className="font-medium text-green-800">Employment Documents</span>
                </div>
                
                  {customer.employment?.contractCertificate && (
                  <div className="flex items-center justify-between p-3 bg-white rounded-md mb-2">
                    <span className="text-sm font-medium text-gray-700">Job Contract</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePreview(customer.employment.contractCertificate)}
                        className="p-1 text-blue-600 hover:text-blue-800"
                        title="Preview document"
                      >
                        <FaEye size={14} />
                      </button>
                      <button
                        onClick={() => handleDownload(customer.employment.contractCertificate)}
                        className="p-1 text-green-600 hover:text-green-800"
                        title="Download document"
                      >
                        <FaDownload size={14} />
                      </button>
                    </div>
                  </div>
                )}
                
                {customer.employment?.stampedPaySlips && customer.employment.stampedPaySlips.length > 0 && (
                  <div className="space-y-2">
                    {customer.employment.stampedPaySlips.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white rounded-md">
                        <span className="text-sm font-medium text-gray-700">Payslip {index + 1}</span>
                        <div className="flex gap-2">
                      <button
                        onClick={() => handlePreview(file)}
                            className="p-1 text-blue-600 hover:text-blue-800"
                        title="Preview document"
                      >
                            <FaEye size={14} />
                      </button>
                      <button
                        onClick={() => handleDownload(file)}
                            className="p-1 text-green-600 hover:text-green-800"
                            title="Download document"
                      >
                            <FaDownload size={14} />
                      </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {customer.employment?.status === "Self-Employed" && customer.employment?.businessCertificate && (
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 mb-3">
                  <FaCertificate className="text-purple-600" />
                  <span className="font-medium text-purple-800">Business Documents</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-white rounded-md">
                  <span className="text-sm font-medium text-gray-700">Business Certificate</span>
                  <div className="flex gap-2">
                  <button
                      onClick={() => handlePreview(customer.employment.businessCertificate)}
                      className="p-1 text-blue-600 hover:text-blue-800"
                    title="Preview document"
                  >
                      <FaEye size={14} />
                  </button>
                  <button
                      onClick={() => handleDownload(customer.employment.businessCertificate)}
                      className="p-1 text-green-600 hover:text-green-800"
                      title="Download document"
                    >
                      <FaDownload size={14} />
                  </button>
                  </div>
                </div>
              </div>
              )}
              
              {/* Additional Documents */}
              {customer.additionalFiles && customer.additionalFiles.length > 0 && (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <FaFileAlt className="text-gray-600" />
                    <span className="font-medium text-gray-800">Additional Documents</span>
                  </div>
                  
                  <div className="space-y-2">
                    {customer.additionalFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white rounded-md">
                        <span className="text-sm font-medium text-gray-700">
                          {file.name || `Document ${index + 1}`}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handlePreview(file.fileUrl || file)}
                            className="p-1 text-blue-600 hover:text-blue-800"
                            title="Preview document"
                          >
                            <FaEye size={14} />
                          </button>
                          <button
                            onClick={() => handleDownload(file.fileUrl || file)}
                            className="p-1 text-green-600 hover:text-green-800"
                            title="Download document"
                          >
                            <FaDownload size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteAdditionalFile(index, file.name || `Document ${index + 1}`)}
                            className="p-1 text-red-600 hover:text-red-800"
                            title="Delete document"
                          >
                            <FaTrash size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Loan History Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <FaFileAlt className="text-indigo-600 text-xl" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Loan History</h2>
        </div>
        
          <DataView
            columns={columns}
            data={loans}
            renderActions={renderActions}
          />
        </div>

      <ConfirmationPopup
        isOpen={showPopup}
        message={popupMessage}
        onConfirm={handleConfirmAction}
        onCancel={() => setShowPopup(false)}
      />

      {/* Reset Password Confirmation Popup */}
      <ConfirmationPopup
        isOpen={showResetPasswordPopup}
        message="Are you sure you want to reset the password for this customer? A new password will be generated and the old one will no longer work."
        onConfirm={handleResetPassword}
        onCancel={() => setShowResetPasswordPopup(false)}
        confirmText="Reset Password"
        cancelText="Cancel"
        variant="secondary"
      />
    </div>
  );
};

/* eslint-disable react/prop-types */
// Credentials Modal Component with scroll-based positioning
const CredentialsModal = ({ isOpen, credentials, showPassword, setShowPassword, copyToClipboard, onClose }) => {
  // Use the same hooks as ConfirmationPopup for consistent positioning
  const { shouldRender, isVisible } = usePopupAnimation(isOpen);
  const { placement } = useScrollPosition();
  const modalClasses = getScrollBasedModalClasses(placement, false);

  if (!shouldRender || !credentials) return null;

  const handleCopyCode = () => copyToClipboard(credentials.customerCode);
  const handleCopyEmail = () => copyToClipboard(credentials.email);
  const handleCopyPassword = () => copyToClipboard(credentials.password);

  return (
    <div className={`${modalClasses.container} backdrop-blur-sm transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className={`${modalClasses.modal} transition-all duration-300 ease-out ${isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2'}`}>
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaKey className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              New Password Generated!
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Please share these credentials with the customer.
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3 mb-6">
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Customer Code</label>
              <div className="flex items-center justify-between gap-2 mt-1">
                <p className="font-mono font-bold text-gray-900 dark:text-white">{credentials.customerCode}</p>
                <button
                  onClick={handleCopyCode}
                  className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                  aria-label="Copy customer code"
                >
                  <FaCopy size={12} />
                  Copy
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Email</label>
              <div className="flex items-center justify-between gap-2 mt-1">
                <p className="font-mono text-gray-900 dark:text-white">{credentials.email}</p>
                <button
                  onClick={handleCopyEmail}
                  className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                  aria-label="Copy email"
                >
                  <FaCopy size={12} />
                  Copy
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">New Password</label>
              <div className="flex items-center justify-between gap-2 mt-1">
                <div className="flex items-center gap-2 flex-1">
                  <p className="font-mono font-bold text-green-600">
                    {showPassword ? credentials.password : '••••••••••••••••'}
                  </p>
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-600 hover:text-gray-700"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                  </button>
                </div>
                <button
                  onClick={handleCopyPassword}
                  className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                  aria-label="Copy password"
                >
                  <FaCopy size={12} />
                  Copy
                </button>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-6">
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              ⚠️ <strong>Important:</strong> Please save these credentials securely and share them with the customer. The old password will no longer work.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
/* eslint-enable react/prop-types */

export default CustomerDetails;
