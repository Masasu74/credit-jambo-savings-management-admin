import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaCheckCircle, 
  FaTimesCircle,
  FaClock,
  FaEye,
  FaMobile,
  FaDesktop,
  FaArrowLeft
} from 'react-icons/fa';

const DeviceVerifications = () => {
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchVerifications();
  }, []);

  const fetchVerifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/device-verifications', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch verifications');
      }
      
      const data = await response.json();
      // The backend returns data in this format: { success: true, data: { verifications: [...], pagination: {...} } }
      const verificationsData = data.success && data.data?.verifications ? data.data.verifications : [];
      setVerifications(verificationsData);
    } catch (err) {
      setError(err.message);
      setVerifications([]); // Set to empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (verificationId, action) => {
    try {
      const response = await fetch(`/api/device-verifications/${verificationId}/${action}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to ${action} verification`);
      }
      
      // Refresh the list
      await fetchVerifications();
    } catch (err) {
      setError(err.message);
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'verified') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <FaCheckCircle className="w-3 h-3 mr-1" />
          Verified
        </span>
      );
    } else if (status === 'rejected') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <FaTimesCircle className="w-3 h-3 mr-1" />
          Rejected
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <FaClock className="w-3 h-3 mr-1" />
          Pending
        </span>
      );
    }
  };

  const getDeviceIcon = (userAgent) => {
    const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
    return isMobile ? (
      <FaMobile className="h-5 w-5 text-gray-400" />
    ) : (
      <FaDesktop className="h-5 w-5 text-gray-400" />
    );
  };

  const filteredVerifications = (verifications || []).filter(verification => {
    if (filter === 'all') return true;
    if (filter === 'verified') return verification.status === 'verified';
    if (filter === 'pending') return verification.status === 'pending';
    if (filter === 'rejected') return verification.status === 'rejected';
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2" style={{borderColor: '#00b050'}}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <FaTimesCircle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Device Verifications
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage and verify customer device registrations
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-md" style={{backgroundColor: '#00b050'}}>
                  <FaMobile className="w-5 h-5 text-white m-1.5" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Devices</dt>
                  <dd className="text-lg font-medium text-gray-900">{verifications.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-md bg-green-500">
                  <FaCheckCircle className="w-5 h-5 text-white m-1.5" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Verified</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {(verifications || []).filter(v => v.status === 'verified').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-md bg-yellow-500">
                  <FaClock className="w-5 h-5 text-white m-1.5" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {(verifications || []).filter(v => v.status === 'pending').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-md bg-red-500">
                  <FaTimesCircle className="w-5 h-5 text-white m-1.5" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Rejected</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {(verifications || []).filter(v => v.status === 'rejected').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white px-4 py-3 shadow rounded-lg">
        <div className="flex items-center space-x-4">
          <div className="flex space-x-2">
            {['all', 'pending', 'verified', 'rejected'].map((filterType) => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  filter === filterType
                    ? 'text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                style={filter === filterType ? {backgroundColor: '#00b050'} : {}}
              >
                {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Verifications Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Device Verification Requests</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Review and approve customer device registrations
          </p>
        </div>
        
        {filteredVerifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <FaMobile className="h-12 w-12" />
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No verifications</h3>
            <p className="mt-1 text-sm text-gray-500">No device verification requests found.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {(filteredVerifications || []).map((verification) => (
              <li key={verification.id}>
                <div className="px-4 py-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full flex items-center justify-center bg-gray-100">
                        {getDeviceIcon(verification.userAgent)}
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900">
                          {verification.deviceName || 'Unknown Device'}
                        </p>
                        {getStatusBadge(verification.status)}
                      </div>
                      <div className="flex items-center mt-1">
                        <p className="text-sm text-gray-500">
                          Device ID: {verification.deviceId}
                        </p>
                        <span className="mx-2">•</span>
                        <p className="text-sm text-gray-500">
                          IP: {verification.ipAddress}
                        </p>
                        <span className="mx-2">•</span>
                        <p className="text-sm text-gray-500">
                          {new Date(verification.requestedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        Customer: {verification.customerId?.fullName || 'Unknown'}
                      </p>
                      {verification.verifiedAt && (
                        <p className="text-xs text-gray-500">
                          Verified: {new Date(verification.verifiedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Link
                        to={`/device-verifications/${verification.id}`}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <FaEye className="h-5 w-5" />
                      </Link>
                      {verification.status === 'pending' && (
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleVerification(verification.id, 'approve')}
                            className="text-green-600 hover:text-green-800"
                            title="Approve"
                          >
                            <FaCheckCircle className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleVerification(verification.id, 'reject')}
                            className="text-red-600 hover:text-red-800"
                            title="Reject"
                          >
                            <FaTimesCircle className="h-5 w-5" />
                          </button>
                        </div>
                      )}
                      {verification.status === 'rejected' && (
                        <button
                          onClick={() => handleVerification(verification.id, 'revert')}
                          className="text-blue-600 hover:text-blue-800"
                          title="Revert to Pending"
                        >
                          <FaArrowLeft className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default DeviceVerifications;
