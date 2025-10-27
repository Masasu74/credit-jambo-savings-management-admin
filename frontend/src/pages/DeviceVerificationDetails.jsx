import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  FaMobile, 
  FaDesktop, 
  FaCalendarAlt, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaArrowLeft,
  FaUser,
  FaShieldAlt,
  FaClock,
  FaMapMarkerAlt,
  FaEye,
  FaBan,
  FaCheck,
  FaExclamationTriangle,
  FaGlobe,
  FaCog
} from 'react-icons/fa';
import Loader from '../components/Loader';
import Button from '../components/Button';
import ConfirmationPopup from '../components/ConfirmationPopup';

const DeviceVerificationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [actionType, setActionType] = useState('');

  useEffect(() => {
    if (id && id !== 'undefined') {
      fetchVerificationDetails();
    } else {
      setError('Invalid verification ID');
      navigate('/device-verifications');
    }
  }, [id, navigate]);

  const fetchVerificationDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/device-verifications/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch verification details');
      }
      
      const data = await response.json();
      if (data.success) {
        setVerification(data.data);
      } else {
        throw new Error(data.message || 'Verification not found');
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationAction = async (action) => {
    try {
      setActionLoading(true);
      
      const response = await fetch(`/api/device-verifications/${id}/verify`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${action} verification`);
      }
      
      toast.success(`Device ${action}ed successfully`);
      await fetchVerificationDetails(); // Refresh data
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading(false);
      setShowPopup(false);
    }
  };

  const handleSuspendDevice = async () => {
    try {
      setActionLoading(true);
      
      const response = await fetch(`/api/device-verifications/${id}/suspend`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: 'Suspended by admin' })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to suspend device');
      }
      
      toast.success('Device suspended successfully');
      await fetchVerificationDetails(); // Refresh data
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading(false);
      setShowPopup(false);
    }
  };

  const handleRevertRejected = async () => {
    try {
      setActionLoading(true);
      
      const response = await fetch(`/api/device-verifications/${id}/revert`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to revert verification');
      }
      
      toast.success('Verification reverted to pending successfully');
      await fetchVerificationDetails(); // Refresh data
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading(false);
      setShowPopup(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'verified': { color: 'bg-green-100 text-green-800', icon: FaCheckCircle },
      'pending': { color: 'bg-yellow-100 text-yellow-800', icon: FaClock },
      'rejected': { color: 'bg-red-100 text-red-800', icon: FaTimesCircle },
      'suspended': { color: 'bg-gray-100 text-gray-800', icon: FaBan }
    };
    
    const config = statusConfig[status] || statusConfig['pending'];
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="w-4 h-4 mr-1" />
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  const getDeviceIcon = (userAgent) => {
    if (!userAgent) return <FaMobile className="h-8 w-8 text-gray-500" />;
    
    const agent = userAgent.toLowerCase();
    if (agent.includes('mobile') || agent.includes('android') || agent.includes('iphone')) {
      return <FaMobile className="h-8 w-8 text-blue-500" />;
    } else if (agent.includes('desktop') || agent.includes('windows') || agent.includes('mac')) {
      return <FaDesktop className="h-8 w-8 text-green-500" />;
    }
    return <FaMobile className="h-8 w-8 text-gray-500" />;
  };

  const getDeviceType = (userAgent) => {
    if (!userAgent) return 'Unknown Device';
    
    const agent = userAgent.toLowerCase();
    if (agent.includes('mobile') || agent.includes('android') || agent.includes('iphone')) {
      return 'Mobile Device';
    } else if (agent.includes('desktop') || agent.includes('windows') || agent.includes('mac')) {
      return 'Desktop Computer';
    } else if (agent.includes('tablet') || agent.includes('ipad')) {
      return 'Tablet';
    }
    return 'Unknown Device';
  };

  const handleConfirmAction = async () => {
    switch (actionType) {
      case 'verify':
        await handleVerificationAction('verify');
        break;
      case 'reject':
        await handleVerificationAction('reject');
        break;
      case 'suspend':
        await handleSuspendDevice();
        break;
      case 'reactivate':
        await handleReactivateDevice();
        break;
      case 'revert':
        await handleRevertRejected();
        break;
      default:
        break;
    }
  };

  if (loading) return <Loader />;
  if (error) return <div className="text-red-500 p-4">Error: {error}</div>;
  if (!verification) return <div>Verification not found</div>;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-6 lg:p-8">
      {/* Header Section */}
      <div className="mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-900/50 p-6 md:p-8 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <button
                  onClick={() => navigate('/device-verifications')}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <FaArrowLeft className="text-gray-600 dark:text-gray-400" />
                </button>
                
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  {getDeviceIcon(verification.deviceInfo?.userAgent)}
                </div>
                
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                    {verification.deviceId || 'Unknown Device'}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300">
                    {getDeviceType(verification.deviceInfo?.userAgent)}
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    {getStatusBadge(verification.status)}
                    <span className="text-sm text-gray-500">
                      Requested: {new Date(verification.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {verification.status === 'pending' && (
                <>
                  <Button
                    variant="primary"
                    onClick={() => {
                      setPopupMessage('Are you sure you want to verify this device?');
                      setActionType('verify');
                      setShowPopup(true);
                    }}
                    loading={actionLoading}
                    className="flex items-center gap-2"
                  >
                    <FaCheck />
                    Verify Device
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => {
                      setPopupMessage('Are you sure you want to reject this device verification?');
                      setActionType('reject');
                      setShowPopup(true);
                    }}
                    loading={actionLoading}
                    className="flex items-center gap-2"
                  >
                    <FaTimesCircle />
                    Reject
                  </Button>
                </>
              )}
              
              {verification.status === 'verified' && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setPopupMessage('Are you sure you want to suspend this device?');
                    setActionType('suspend');
                    setShowPopup(true);
                  }}
                  loading={actionLoading}
                  className="flex items-center gap-2"
                >
                  <FaBan />
                  Suspend Device
                </Button>
              )}
              
              {verification.status === 'rejected' && (
                <Button
                  variant="primary"
                  onClick={() => {
                    setPopupMessage('Are you sure you want to revert this rejected verification back to pending?');
                    setActionType('revert');
                    setShowPopup(true);
                  }}
                  loading={actionLoading}
                  className="flex items-center gap-2"
                >
                  <FaArrowLeft />
                  Revert to Pending
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Verification Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-900/50 p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <FaMobile className="text-blue-600 dark:text-blue-400 text-xl" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Device ID</h3>
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-white font-mono">
            {verification.deviceId || 'N/A'}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-900/50 p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <FaShieldAlt className="text-green-600 dark:text-green-400 text-xl" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Status</h3>
          </div>
          <div className="mt-2">
            {getStatusBadge(verification.status)}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-900/50 p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <FaCalendarAlt className="text-purple-600 dark:text-purple-400 text-xl" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Request Date</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {new Date(verification.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-900/50 p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <FaGlobe className="text-orange-600 dark:text-orange-400 text-xl" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">IP Address</h3>
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-white font-mono">
            {verification.ipAddress || 'N/A'}
          </p>
        </div>
      </div>
      
      {/* Device Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Device Details */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-900/50 p-6 md:p-8 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <FaCog className="text-blue-600 dark:text-blue-400 text-xl" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Device Information</h2>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-600 dark:text-gray-300 font-medium block mb-1">Device ID</span>
              <span className="text-gray-900 dark:text-white font-semibold font-mono">{verification.deviceId}</span>
            </div>
            
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-600 dark:text-gray-300 font-medium block mb-1">Device Type</span>
              <span className="text-gray-900 dark:text-white font-semibold">
                {getDeviceType(verification.deviceInfo?.userAgent)}
              </span>
            </div>
            
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-600 dark:text-gray-300 font-medium block mb-1">User Agent</span>
              <span className="text-gray-900 dark:text-white font-semibold text-sm break-all">
                {verification.deviceInfo?.userAgent || 'N/A'}
              </span>
            </div>
            
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-600 dark:text-gray-300 font-medium block mb-1">IP Address</span>
              <span className="text-gray-900 dark:text-white font-semibold font-mono">
                {verification.ipAddress || 'N/A'}
              </span>
            </div>
            
            {verification.location && (
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-gray-600 dark:text-gray-300 font-medium block mb-1">Location</span>
                <span className="text-gray-900 dark:text-white font-semibold">
                  {verification.location}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Customer Information */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-900/50 p-6 md:p-8 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <FaUser className="text-green-600 dark:text-green-400 text-xl" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Customer Information</h2>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-600 dark:text-gray-300 font-medium block mb-1">Customer Name</span>
              <span className="text-gray-900 dark:text-white font-semibold">
                {verification.customerId?.fullName || verification.customer?.fullName || 'Unknown Customer'}
              </span>
            </div>
            
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-600 dark:text-gray-300 font-medium block mb-1">Customer Code</span>
              <span className="text-gray-900 dark:text-white font-semibold font-mono">
                {verification.customerId?.customerCode || verification.customer?.customerCode || 'N/A'}
              </span>
            </div>
            
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-600 dark:text-gray-300 font-medium block mb-1">Email</span>
              <span className="text-gray-900 dark:text-white font-semibold">
                {verification.customerId?.email || verification.customer?.email || 'N/A'}
              </span>
            </div>
            
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-600 dark:text-gray-300 font-medium block mb-1">Phone</span>
              <span className="text-gray-900 dark:text-white font-semibold">
                {verification.customerId?.phone || verification.customer?.phone || 'N/A'}
              </span>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => navigate(`/customers/${verification.customerId?._id || verification.customer?.id}`)}
                className="flex items-center gap-2"
              >
                <FaEye />
                View Customer
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Timeline */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-900/50 p-6 md:p-8 border border-gray-200 dark:border-gray-700 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
            <FaClock className="text-indigo-600 dark:text-indigo-400 text-xl" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Verification Timeline</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <FaClock className="text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white">Verification Requested</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {new Date(verification.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
          
          {verification.verifiedAt && (
            <div className="flex items-center gap-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <FaCheckCircle className="text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">Device Verified</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(verification.verifiedAt).toLocaleString()}
                </p>
                {verification.verifiedBy && (
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Verified by: {verification.verifiedBy.fullName || 'Admin'}
                  </p>
                )}
              </div>
            </div>
          )}
          
          {verification.rejectedAt && (
            <div className="flex items-center gap-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <FaTimesCircle className="text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">Device Rejected</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(verification.rejectedAt).toLocaleString()}
                </p>
                {verification.rejectedBy && (
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Rejected by: {verification.rejectedBy.fullName || 'Admin'}
                  </p>
                )}
                {verification.rejectionReason && (
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Reason: {verification.rejectionReason}
                  </p>
                )}
              </div>
            </div>
          )}
          
          {verification.suspendedAt && (
            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-600 flex items-center justify-center">
                <FaBan className="text-gray-600 dark:text-gray-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">Device Suspended</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(verification.suspendedAt).toLocaleString()}
                </p>
                {verification.suspendedBy && (
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Suspended by: {verification.suspendedBy.fullName || 'Admin'}
                  </p>
                )}
                {verification.suspensionReason && (
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Reason: {verification.suspensionReason}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Technical Details */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-900/50 p-6 md:p-8 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <FaCog className="text-gray-600 dark:text-gray-400 text-xl" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Technical Details</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <span className="text-gray-600 dark:text-gray-300 font-medium block mb-1">Verification ID</span>
            <span className="text-gray-900 dark:text-white font-semibold font-mono text-sm">
              {verification.id}
            </span>
          </div>
          
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <span className="text-gray-600 dark:text-gray-300 font-medium block mb-1">Created At</span>
            <span className="text-gray-900 dark:text-white font-semibold">
              {new Date(verification.createdAt).toLocaleString()}
            </span>
          </div>
          
          {verification.updatedAt && (
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-600 dark:text-gray-300 font-medium block mb-1">Updated At</span>
              <span className="text-gray-900 dark:text-white font-semibold">
                {new Date(verification.updatedAt).toLocaleString()}
              </span>
            </div>
          )}
          
          {verification.lastLoginAt && (
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-600 dark:text-gray-300 font-medium block mb-1">Last Login</span>
              <span className="text-gray-900 dark:text-white font-semibold">
                {new Date(verification.lastLoginAt).toLocaleString()}
              </span>
            </div>
          )}
          
          {verification.loginCount && (
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-600 dark:text-gray-300 font-medium block mb-1">Login Count</span>
              <span className="text-gray-900 dark:text-white font-semibold">
                {verification.loginCount}
              </span>
            </div>
          )}
          
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <span className="text-gray-600 dark:text-gray-300 font-medium block mb-1">Is Active</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              verification.isActive 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {verification.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      {/* Confirmation Popup */}
      <ConfirmationPopup
        isOpen={showPopup}
        message={popupMessage}
        onConfirm={handleConfirmAction}
        onCancel={() => setShowPopup(false)}
        confirmText={actionType === 'verify' ? 'Verify' : actionType === 'reject' ? 'Reject' : actionType === 'suspend' ? 'Suspend' : actionType === 'revert' ? 'Revert' : 'Reactivate'}
        cancelText="Cancel"
        variant={actionType === 'reject' || actionType === 'suspend' ? 'danger' : 'primary'}
      />
    </div>
  );
};

export default DeviceVerificationDetails;