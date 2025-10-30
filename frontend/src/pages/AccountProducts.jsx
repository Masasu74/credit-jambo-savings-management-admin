import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  FaPlus, 
  FaEye, 
  FaEdit, 
  FaToggleOn, 
  FaToggleOff,
  FaTrash,
  FaChartLine,
  FaCheckCircle,
  FaTimesCircle
} from 'react-icons/fa';

const AccountProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, active, inactive

  useEffect(() => {
    fetchProducts();
  }, [filter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/account-products', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      
      if (data.success) {
        // Filter products based on status
        let filteredProducts = data.data || [];
        if (filter === 'active') {
          filteredProducts = filteredProducts.filter(p => p.isActive);
        } else if (filter === 'inactive') {
          filteredProducts = filteredProducts.filter(p => !p.isActive);
        }
        
        // Fetch stats for each product
        const productsWithStats = await Promise.all(
          filteredProducts.map(async (product) => {
            try {
              const statsResponse = await fetch(`/api/account-products/${product._id}/stats`, {
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
              });
              if (statsResponse.ok) {
                const statsData = await statsResponse.json();
                if (statsData.success) {
                  return { ...product, totalAccounts: statsData.data.totalAccounts || 0 };
                }
              }
            } catch (error) {
              console.error(`Error fetching stats for product ${product._id}:`, error);
            }
            return { ...product, totalAccounts: 0 };
          })
        );
        
        setProducts(productsWithStats);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      toast.error('Failed to load account products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (productId) => {
    try {
      const response = await fetch(`/api/account-products/${productId}/toggle-status`, {
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
        fetchProducts();
      }
    } catch (err) {
      console.error('Error toggling product status:', err);
      toast.error('Failed to toggle product status');
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      const response = await fetch(`/api/account-products/${productId}`, {
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
      fetchProducts();
    } catch (err) {
      console.error('Error deleting product:', err);
      toast.error(err.message || 'Failed to delete product');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const filteredProducts = products;
  const activeCount = products.filter(p => p.isActive).length;
  const totalCount = products.length;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Account Products</h1>
          <p className="text-gray-600 mt-1">Manage savings account products and offerings</p>
        </div>
        <Link
          to="/account-products/add"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <FaPlus /> Add Product
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <FaChartLine className="text-blue-600 text-xl" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Products</p>
              <p className="text-2xl font-bold text-green-600">{activeCount}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <FaCheckCircle className="text-green-600 text-xl" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Inactive Products</p>
              <p className="text-2xl font-bold text-gray-600">{totalCount - activeCount}</p>
            </div>
            <div className="bg-gray-100 p-3 rounded-full">
              <FaTimesCircle className="text-gray-600 text-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Products
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'active' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Active Only
          </button>
          <button
            onClick={() => setFilter('inactive')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'inactive' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Inactive Only
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <FaChartLine className="text-gray-400 text-5xl mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No account products found</p>
            <p className="text-gray-500 mt-2">Create your first product to get started</p>
            <Link
              to="/account-products/add"
              className="inline-block mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Add Product
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Interest Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Min Deposit/Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Features
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Clients
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{product.productName}</div>
                        <div className="text-sm text-gray-500">Code: {product.productCode}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {product.accountType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.interestRate}% {product.interestFrequency}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>Deposit: {product.minimumDeposit?.toLocaleString() || 0} RWF</div>
                      <div>Balance: {product.minimumBalance?.toLocaleString() || 0} RWF</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {product.features?.slice(0, 2).join(', ') || 'N/A'}
                        {product.features?.length > 2 && '...'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="bg-blue-100 px-3 py-1 rounded-full">
                          <span className="text-sm font-semibold text-blue-700">{product.totalAccounts || 0}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(product._id)}
                        className={`flex items-center gap-2 text-sm ${
                          product.isActive ? 'text-green-600' : 'text-gray-400'
                        }`}
                      >
                        {product.isActive ? (
                          <>
                            <FaToggleOn className="text-xl" />
                            Active
                          </>
                        ) : (
                          <>
                            <FaToggleOff className="text-xl" />
                            Inactive
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/account-products/${product._id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <FaEye />
                        </Link>
                        <Link
                          to={`/account-products/${product._id}/edit`}
                          className="text-yellow-600 hover:text-yellow-900"
                        >
                          <FaEdit />
                        </Link>
                        <button
                          onClick={() => handleDelete(product._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FaTrash />
                        </button>
                      </div>
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

export default AccountProducts;

