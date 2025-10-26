import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Square, 
  BarChart3, 
  Users, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Activity,
  Zap
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const LoadTestingPanel = () => {
  const { api } = useAppContext();
  const [isRunning, setIsRunning] = useState(false);
  const [testConfig, setTestConfig] = useState({
    concurrentUsers: 10,
    duration: 60,
    rampUpTime: 10,
    testType: 'gradual'
  });
  const [currentTest, setCurrentTest] = useState(null);
  const [testResults, setTestResults] = useState(null);
  const [testHistory, setTestHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch test history on component mount
  useEffect(() => {
    fetchTestHistory();
  }, []);

  // Poll for test status if test is running
  useEffect(() => {
    let interval;
    if (isRunning && currentTest?.testId) {
      interval = setInterval(() => {
        fetchTestStatus(currentTest.testId);
      }, 2000); // Poll every 2 seconds
    }
    return () => clearInterval(interval);
  }, [isRunning, currentTest]);

  const fetchTestHistory = async () => {
    try {
      const response = await api.get('/load-testing/list');
      setTestHistory(response.data.data.tests);
    } catch (error) {
      console.error('Error fetching test history:', error);
    }
  };

  const startLoadTest = async () => {
    setLoading(true);
    try {
      const response = await api.post('/load-testing/start', testConfig);
      setCurrentTest(response.data.data);
      setIsRunning(true);
      setTestResults(null);
    } catch (error) {
      console.error('Error starting load test:', error);
      alert('Failed to start load test');
    } finally {
      setLoading(false);
    }
  };

  const stopLoadTest = async () => {
    if (!currentTest?.testId) return;
    
    setLoading(true);
    try {
      await api.post(`/load-testing/stop/${currentTest.testId}`);
      setIsRunning(false);
      fetchTestResults(currentTest.testId);
    } catch (error) {
      console.error('Error stopping load test:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTestStatus = async (testId) => {
    try {
      const response = await api.get(`/load-testing/status/${testId}`);
      const status = response.data.data;
      
      if (status.status === 'completed' || status.status === 'stopped') {
        setIsRunning(false);
        fetchTestResults(testId);
      }
    } catch (error) {
      console.error('Error fetching test status:', error);
    }
  };

  const fetchTestResults = async (testId) => {
    try {
      const response = await api.get(`/load-testing/results/${testId}`);
      setTestResults(response.data.data);
      fetchTestHistory(); // Refresh history
    } catch (error) {
      console.error('Error fetching test results:', error);
    }
  };

  const getTestTypeColor = (type) => {
    switch (type) {
      case 'gradual': return 'bg-blue-100 text-blue-800';
      case 'spike': return 'bg-red-100 text-red-800';
      case 'sustained': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'running': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'stopped': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Load Testing</h3>
        <div className="flex items-center space-x-2">
          {isRunning ? (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-red-600">Test Running</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <span className="text-sm text-gray-600">Ready</span>
            </div>
          )}
        </div>
      </div>

      {/* Test Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Concurrent Users
          </label>
          <input
            type="number"
            value={testConfig.concurrentUsers}
            onChange={(e) => setTestConfig({...testConfig, concurrentUsers: parseInt(e.target.value)})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min="1"
            max="100"
            disabled={isRunning}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Duration (seconds)
          </label>
          <input
            type="number"
            value={testConfig.duration}
            onChange={(e) => setTestConfig({...testConfig, duration: parseInt(e.target.value)})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min="10"
            max="600"
            disabled={isRunning}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ramp Up (seconds)
          </label>
          <input
            type="number"
            value={testConfig.rampUpTime}
            onChange={(e) => setTestConfig({...testConfig, rampUpTime: parseInt(e.target.value)})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min="1"
            max="60"
            disabled={isRunning}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Test Type
          </label>
          <select
            value={testConfig.testType}
            onChange={(e) => setTestConfig({...testConfig, testType: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isRunning}
          >
            <option value="gradual">Gradual</option>
            <option value="spike">Spike</option>
            <option value="sustained">Sustained</option>
          </select>
        </div>
      </div>

      {/* Test Controls */}
      <div className="flex items-center space-x-4 mb-6">
        {!isRunning ? (
          <button
            onClick={startLoadTest}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            <span>Start Test</span>
          </button>
        ) : (
          <button
            onClick={stopLoadTest}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            <Square className="w-4 h-4" />
            <span>Stop Test</span>
          </button>
        )}
      </div>

      {/* Current Test Status */}
      {currentTest && isRunning && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-blue-900">Test in Progress</h4>
            <span className="text-sm text-blue-700">ID: {currentTest.testId}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{testConfig.concurrentUsers}</div>
              <div className="text-sm text-blue-700">Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{testConfig.duration}s</div>
              <div className="text-sm text-blue-700">Duration</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{testConfig.testType}</div>
              <div className="text-sm text-blue-700">Type</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                <Clock className="w-6 h-6 mx-auto animate-spin" />
              </div>
              <div className="text-sm text-blue-700">Running</div>
            </div>
          </div>
        </div>
      )}

      {/* Test Results */}
      {testResults && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-gray-900 mb-4">Test Results</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{testResults.metrics.totalRequests}</div>
              <div className="text-sm text-gray-700">Total Requests</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{testResults.metrics.averageResponseTime?.toFixed(0)}ms</div>
              <div className="text-sm text-gray-700">Avg Response</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{testResults.metrics.throughput?.toFixed(1)}</div>
              <div className="text-sm text-gray-700">Requests/sec</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{(testResults.metrics.errorRate * 100)?.toFixed(1)}%</div>
              <div className="text-sm text-gray-700">Error Rate</div>
            </div>
          </div>
          
          {/* Recommendations */}
          {testResults.recommendations && testResults.recommendations.length > 0 && (
            <div className="mt-4">
              <h5 className="font-medium text-gray-900 mb-2">Recommendations</h5>
              <div className="space-y-2">
                {testResults.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{rec.message}</div>
                      <div className="text-sm text-gray-600">{rec.recommendation}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Test History */}
      <div>
        <h4 className="font-medium text-gray-900 mb-4">Test History</h4>
        <div className="space-y-2">
          {testHistory.slice(0, 5).map((test) => (
            <div key={test.testId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getTestTypeColor(test.testType)}`}>
                  {test.testType}
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(test.status)}`}>
                  {test.status}
                </div>
                <span className="text-sm text-gray-600">{test.concurrentUsers} users</span>
              </div>
              <div className="text-sm text-gray-500">
                {new Date(test.startTime).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoadTestingPanel;
