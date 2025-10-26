import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { FaBuilding, FaChartLine, FaCog, FaCheckCircle, FaInfoCircle, FaPlay } from 'react-icons/fa';

const DefaultCOASetup = () => {
  const { api } = useAppContext();
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [clientName, setClientName] = useState('');
  const [loading, setLoading] = useState(false);
  const [setupStatus, setSetupStatus] = useState(null);
  const [preview, setPreview] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchTemplates();
    fetchSetupStatus();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/chart-of-accounts/templates');
      setTemplates(response.data.data.templates);
      if (response.data.data.templates.length > 0) {
        setSelectedTemplate(response.data.data.templates[0].id);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const fetchSetupStatus = async () => {
    try {
      const response = await api.get('/chart-of-accounts/setup-status');
      setSetupStatus(response.data.data);
    } catch (error) {
      console.error('Error fetching setup status:', error);
    }
  };

  const previewTemplate = async (templateId) => {
    try {
      setLoading(true);
      const response = await api.get(`/chart-of-accounts/preview/${templateId}`);
      setPreview(response.data.data);
      setShowPreview(true);
    } catch (error) {
      console.error('Error previewing template:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupDefaultCOA = async () => {
    if (!clientName.trim()) {
      alert('Please enter a client name');
      return;
    }

    if (!selectedTemplate) {
      alert('Please select a template');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/chart-of-accounts/setup-default', {
        clientName: clientName.trim(),
        template: selectedTemplate
      });

      alert(`Success! Created ${response.data.data.accountsCreated} accounts for ${clientName}`);
      setClientName('');
      fetchSetupStatus();
    } catch (error) {
      console.error('Error setting up COA:', error);
      alert(error.response?.data?.message || 'Error setting up chart of accounts');
    } finally {
      setLoading(false);
    }
  };

  const getTemplateIcon = (templateId) => {
    switch (templateId) {
      case 'ndfsp': return <FaBuilding className="text-blue-500" />;
      case 'ndfi': return <FaChartLine className="text-green-500" />;
      case 'basic': return <FaCog className="text-gray-500" />;
      default: return <FaInfoCircle className="text-gray-400" />;
    }
  };

  const getTemplateColor = (templateId) => {
    switch (templateId) {
      case 'ndfsp': return 'border-blue-200 bg-blue-50';
      case 'ndfi': return 'border-green-200 bg-green-50';
      case 'basic': return 'border-gray-200 bg-gray-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-lg">
          <h1 className="text-2xl font-bold mb-2">Default Chart of Accounts Setup</h1>
          <p className="text-blue-100">
            Automatically create standardized chart of accounts for new clients
          </p>
        </div>

        <div className="p-6">
          {/* Setup Status */}
          {setupStatus && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <FaCheckCircle className="text-green-500 mr-2" />
                Current Setup Status
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{setupStatus.totalAccounts}</div>
                  <div className="text-sm text-gray-600">Total Accounts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{setupStatus.systemAccounts}</div>
                  <div className="text-sm text-gray-600">System Accounts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{setupStatus.customAccounts}</div>
                  <div className="text-sm text-gray-600">Custom Accounts</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${setupStatus.isSetup ? 'text-green-600' : 'text-red-600'}`}>
                    {setupStatus.isSetup ? '✓' : '✗'}
                  </div>
                  <div className="text-sm text-gray-600">Setup Status</div>
                </div>
              </div>
            </div>
          )}

          {/* Template Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Choose Template</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    selectedTemplate === template.id
                      ? `${getTemplateColor(template.id)} border-blue-500`
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedTemplate(template.id)}
                >
                  <div className="flex items-center mb-2">
                    {getTemplateIcon(template.id)}
                    <h4 className="font-semibold ml-2">{template.name}</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                  <div className="text-xs text-gray-500">
                    {template.accountCount} accounts
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      previewTemplate(template.id);
                    }}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                    disabled={loading}
                  >
                    Preview →
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Setup Form */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Setup New Client</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client Name
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g., ABC Microfinance Ltd"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selected Template
                  </label>
                  <div className="px-3 py-2 bg-white border border-gray-300 rounded-md">
                    {templates.find(t => t.id === selectedTemplate)?.name || 'Select a template'}
                  </div>
                </div>
              </div>
              <button
                onClick={setupDefaultCOA}
                disabled={loading || !clientName.trim() || !selectedTemplate}
                className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Setting up...
                  </>
                ) : (
                  <>
                    <FaPlay className="mr-2" />
                    Setup Chart of Accounts
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Preview Modal */}
          {showPreview && preview && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">Template Preview: {preview.template.name}</h3>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="mb-4">
                  <p className="text-gray-600">{preview.template.description}</p>
                  <p className="text-sm text-gray-500">Total Accounts: {preview.template.totalAccounts}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">Account Types</h4>
                    <div className="space-y-1">
                      {Object.entries(preview.summary.byType).map(([type, count]) => (
                        <div key={type} className="flex justify-between text-sm">
                          <span className="capitalize">{type}</span>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Account Categories</h4>
                    <div className="space-y-1">
                      {Object.entries(preview.summary.byCategory).map(([category, count]) => (
                        <div key={category} className="flex justify-between text-sm">
                          <span className="capitalize">{category.replace(/_/g, ' ')}</span>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="font-semibold mb-2">Account Structure</h4>
                  <div className="max-h-60 overflow-y-auto border rounded p-3">
                    {Object.entries(preview.accountsByLevel).map(([level, accounts]) => (
                      <div key={level} className="mb-2">
                        <div className="font-medium text-gray-700 mb-1">Level {level}</div>
                        {accounts.map((account, index) => (
                          <div key={index} className="ml-4 text-sm text-gray-600">
                            {account.accountCode} - {account.accountName}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DefaultCOASetup;
