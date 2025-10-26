import React, { useState } from 'react';
import SearchableSelect from './SearchableSelect';
import CustomerSelect from './CustomerSelect';
// Removed LoanSelect import - component deleted for savings management system

const SearchableSelectDemo = () => {
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedLoan, setSelectedLoan] = useState('');
  const [selectedGeneric, setSelectedGeneric] = useState('');

  // Sample data for demonstration
  const sampleCustomers = [
    {
      _id: '1',
      personalInfo: { fullName: 'John Doe', nationalId: '123456789' },
      contact: { phone: '+250788123456' },
      businessInfo: { businessName: 'Doe Enterprises' }
    },
    {
      _id: '2',
      personalInfo: { fullName: 'Jane Smith', nationalId: '987654321' },
      contact: { phone: '+250788654321' },
      businessInfo: { businessName: 'Smith & Co.' }
    },
    {
      _id: '3',
      personalInfo: { fullName: 'Bob Johnson', nationalId: '456789123' },
      contact: { phone: '+250788456789' },
      businessInfo: { businessName: 'Johnson Trading' }
    }
  ];

  const sampleLoans = [
    {
      _id: '1',
      loanCode: 'L001',
      amount: 5000000,
      duration: 24,
      status: 'disbursed',
      customer: { personalInfo: { fullName: 'John Doe' } }
    },
    {
      _id: '2',
      loanCode: 'L002',
      amount: 3000000,
      duration: 18,
      status: 'overdue',
      customer: { personalInfo: { fullName: 'Jane Smith' } }
    },
    {
      _id: '3',
      loanCode: 'L003',
      amount: 7500000,
      duration: 36,
      status: 'pending',
      customer: { personalInfo: { fullName: 'Bob Johnson' } }
    }
  ];

  const sampleOptions = [
    { value: 'option1', label: 'Option 1', subtitle: 'Description for option 1' },
    { value: 'option2', label: 'Option 2', subtitle: 'Description for option 2' },
    { value: 'option3', label: 'Option 3', subtitle: 'Description for option 3' }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">SearchableSelect Components Demo</h1>
        <p className="text-gray-600">
          These components provide a better user experience for selecting from long lists of customers, loans, or other options.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* CustomerSelect Demo */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">CustomerSelect Component</h2>
          <p className="text-sm text-gray-600 mb-4">
            Specialized component for customer selection with customer-specific formatting and search.
          </p>
          
          <CustomerSelect
            label="Select Customer"
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
            customers={sampleCustomers}
            required
          />
          
          {selectedCustomer && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Selected Customer ID:</strong> {selectedCustomer}
              </p>
            </div>
          )}
        </div>

        {/* LoanSelect Demo - Removed for savings management system */}

        {/* Generic SearchableSelect Demo */}
        <div className="bg-white p-6 rounded-lg shadow-sm border lg:col-span-2">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Generic SearchableSelect Component</h2>
          <p className="text-sm text-gray-600 mb-4">
            Base component that can be customized for any type of selection with search, pagination, and custom rendering.
          </p>
          
          <SearchableSelect
            label="Generic Selection"
            value={selectedGeneric}
            onChange={(e) => setSelectedGeneric(e.target.value)}
            options={sampleOptions}
            required
            placeholder="Search and select an option..."
          />
          
          {selectedGeneric && (
            <div className="mt-4 p-3 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-800">
                <strong>Selected Option:</strong> {selectedGeneric}
              </p>
            </div>
          )}
        </div>

        {/* Features Overview */}
        <div className="bg-white p-6 rounded-lg shadow-sm border lg:col-span-2">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Search & Filter</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Real-time search across multiple fields</li>
                <li>• Configurable search fields</li>
                <li>• Instant filtering as you type</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Pagination</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Configurable page size</li>
                <li>• Navigation between pages</li>
                <li>• Efficient handling of large datasets</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Custom Rendering</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Custom option display</li>
                <li>• Rich information display</li>
                <li>• Consistent with design system</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">User Experience</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Keyboard navigation support</li>
                <li>• Click outside to close</li>
                <li>• Loading states and error handling</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchableSelectDemo;

