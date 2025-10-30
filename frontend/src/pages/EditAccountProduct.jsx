import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import InputField from '../components/InputField';
import SelectField from '../components/SelectField';
import Button from '../components/Button';

const EditAccountProduct = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const [formData, setFormData] = useState({
    productCode: '',
    productName: '',
    description: '',
    accountType: 'regular',
    minimumDeposit: 0,
    minimumBalance: 0,
    monthlyFee: 0,
    interestRate: 0,
    interestFrequency: 'monthly',
    features: '',
    eligibility: {
      minAge: 18,
      maxAge: '',
      minSalary: 0
    },
    depositLimits: {
      minDeposit: 0,
      maxDeposit: '',
      minWithdrawal: 0,
      maxWithdrawal: ''
    },
    displayOrder: 0
  });

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoadingProduct(true);
      const response = await fetch(`/api/account-products/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch product');
      }

      const data = await response.json();
      if (data.success && data.data) {
        const product = data.data;
        setFormData({
          productCode: product.productCode || '',
          productName: product.productName || '',
          description: product.description || '',
          accountType: product.accountType || 'regular',
          minimumDeposit: product.minimumDeposit || 0,
          minimumBalance: product.minimumBalance || 0,
          monthlyFee: product.monthlyFee || 0,
          interestRate: product.interestRate || 0,
          interestFrequency: product.interestFrequency || 'monthly',
          features: product.features ? product.features.join(', ') : '',
          eligibility: {
            minAge: product.eligibility?.minAge || 18,
            maxAge: product.eligibility?.maxAge || '',
            minSalary: product.eligibility?.minSalary || 0
          },
          depositLimits: {
            minDeposit: product.depositLimits?.minDeposit || 0,
            maxDeposit: product.depositLimits?.maxDeposit || '',
            minWithdrawal: product.depositLimits?.minWithdrawal || 0,
            maxWithdrawal: product.depositLimits?.maxWithdrawal || ''
          },
          displayOrder: product.displayOrder || 0
        });
      }
    } catch (err) {
      console.error('Error fetching product:', err);
      toast.error('Failed to load product');
      navigate('/account-products');
    } finally {
      setLoadingProduct(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested fields
    if (name.startsWith('eligibility.') || name.startsWith('depositLimits.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isConfirmed) {
      toast.error('Please confirm that the information provided is correct');
      return;
    }

    // Validate required fields
    if (!formData.productName) {
      toast.error('Product name is required');
      return;
    }

    // Parse features from comma-separated string
    const features = formData.features ? 
      formData.features.split(',').map(f => f.trim()).filter(f => f) : [];

    setLoading(true);

    try {
      const response = await fetch(`/api/account-products/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          features,
          minimumDeposit: parseFloat(formData.minimumDeposit) || 0,
          minimumBalance: parseFloat(formData.minimumBalance) || 0,
          monthlyFee: parseFloat(formData.monthlyFee) || 0,
          interestRate: parseFloat(formData.interestRate) || 0,
          eligibility: {
            ...formData.eligibility,
            minAge: parseInt(formData.eligibility.minAge) || 18,
            maxAge: formData.eligibility.maxAge ? parseInt(formData.eligibility.maxAge) : null,
            minSalary: parseFloat(formData.eligibility.minSalary) || 0
          },
          depositLimits: {
            minDeposit: parseFloat(formData.depositLimits.minDeposit) || 0,
            maxDeposit: formData.depositLimits.maxDeposit ? parseFloat(formData.depositLimits.maxDeposit) : null,
            minWithdrawal: parseFloat(formData.depositLimits.minWithdrawal) || 0,
            maxWithdrawal: formData.depositLimits.maxWithdrawal ? parseFloat(formData.depositLimits.maxWithdrawal) : null
          },
          displayOrder: parseInt(formData.displayOrder) || 0
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Product updated successfully');
        navigate(`/account-products/${id}`);
      } else {
        toast.error(data.message || 'Failed to update product');
      }
    } catch (err) {
      console.error('Error updating product:', err);
      toast.error('Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  if (loadingProduct) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="form-page-container">
      <div className="form-page-header">
        <h1 className="form-page-title">Edit Account Product</h1>
        <p className="form-page-subtitle">Update product information</p>
      </div>

      <form onSubmit={handleSubmit} className="form-container">
        {/* Basic Information */}
        <section className="form-section">
          <div className="form-section-header">
            <h2 className="form-section-title">Basic Information</h2>
          </div>
          <div className="form-section-divider"></div>

          <div className="form-grid">
            <InputField
              label="Product Code"
              name="productCode"
              value={formData.productCode}
              onChange={handleChange}
              required
              placeholder="e.g., BASIC_SAV"
              helpText="Unique identifier for this product (cannot be changed)"
              disabled
            />

            <InputField
              label="Product Name"
              name="productName"
              value={formData.productName}
              onChange={handleChange}
              required
              placeholder="e.g., Basic Savings"
            />

            <SelectField
              label="Account Type"
              name="accountType"
              value={formData.accountType}
              onChange={handleChange}
              options={[
                { value: 'regular', label: 'Regular' },
                { value: 'premium', label: 'Premium' },
                { value: 'fixed', label: 'Fixed Deposit' },
                { value: 'youth', label: 'Youth' },
                { value: 'senior', label: 'Senior' },
                { value: 'business', label: 'Business' }
              ]}
            />

            <InputField
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Brief description of the product"
              multiline
              rows={2}
            />
          </div>
        </section>

        {/* Financial Details */}
        <section className="form-section">
          <div className="form-section-header">
            <h2 className="form-section-title">Financial Details</h2>
          </div>
          <div className="form-section-divider"></div>

          <div className="form-grid">
            <InputField
              label="Minimum Deposit (RWF)"
              name="minimumDeposit"
              type="number"
              value={formData.minimumDeposit}
              onChange={handleChange}
              required
              min={0}
              placeholder="0"
            />

            <InputField
              label="Minimum Balance (RWF)"
              name="minimumBalance"
              type="number"
              value={formData.minimumBalance}
              onChange={handleChange}
              required
              min={0}
              placeholder="0"
            />

            <InputField
              label="Monthly Fee (RWF)"
              name="monthlyFee"
              type="number"
              value={formData.monthlyFee}
              onChange={handleChange}
              min={0}
              placeholder="0"
            />

            <InputField
              label="Interest Rate (%)"
              name="interestRate"
              type="number"
              value={formData.interestRate}
              onChange={handleChange}
              required
              min={0}
              max={100}
              step="0.01"
              placeholder="0"
            />

            <SelectField
              label="Interest Frequency"
              name="interestFrequency"
              value={formData.interestFrequency}
              onChange={handleChange}
              options={[
                { value: 'monthly', label: 'Monthly' },
                { value: 'quarterly', label: 'Quarterly' },
                { value: 'annually', label: 'Annually' }
              ]}
            />
          </div>
        </section>

        {/* Eligibility Requirements */}
        <section className="form-section">
          <div className="form-section-header">
            <h2 className="form-section-title">Eligibility Requirements</h2>
          </div>
          <div className="form-section-divider"></div>

          <div className="form-grid">
            <InputField
              label="Minimum Age"
              name="eligibility.minAge"
              type="number"
              value={formData.eligibility.minAge}
              onChange={handleChange}
              min={0}
              placeholder="18"
            />

            <InputField
              label="Maximum Age (leave empty for no limit)"
              name="eligibility.maxAge"
              type="number"
              value={formData.eligibility.maxAge}
              onChange={handleChange}
              placeholder=""
            />

            <InputField
              label="Minimum Salary (RWF)"
              name="eligibility.minSalary"
              type="number"
              value={formData.eligibility.minSalary}
              onChange={handleChange}
              min={0}
              placeholder="0"
            />
          </div>
        </section>

        {/* Deposit Limits */}
        <section className="form-section">
          <div className="form-section-header">
            <h2 className="form-section-title">Transaction Limits</h2>
          </div>
          <div className="form-section-divider"></div>

          <div className="form-grid">
            <InputField
              label="Min Deposit Amount (RWF)"
              name="depositLimits.minDeposit"
              type="number"
              value={formData.depositLimits.minDeposit}
              onChange={handleChange}
              min={0}
              placeholder="0"
            />

            <InputField
              label="Max Deposit Amount (RWF, leave empty for no limit)"
              name="depositLimits.maxDeposit"
              type="number"
              value={formData.depositLimits.maxDeposit}
              onChange={handleChange}
              placeholder=""
            />

            <InputField
              label="Min Withdrawal Amount (RWF)"
              name="depositLimits.minWithdrawal"
              type="number"
              value={formData.depositLimits.minWithdrawal}
              onChange={handleChange}
              min={0}
              placeholder="0"
            />

            <InputField
              label="Max Withdrawal Amount (RWF, leave empty for no limit)"
              name="depositLimits.maxWithdrawal"
              type="number"
              value={formData.depositLimits.maxWithdrawal}
              onChange={handleChange}
              placeholder=""
            />
          </div>
        </section>

        {/* Features */}
        <section className="form-section">
          <div className="form-section-header">
            <h2 className="form-section-title">Product Features</h2>
          </div>
          <div className="form-section-divider"></div>

          <div className="form-grid">
            <div className="col-span-2">
              <InputField
                label="Features (comma-separated)"
                name="features"
                value={formData.features}
                onChange={handleChange}
                placeholder="ATM access, Mobile banking, Online transfers"
                helpText="Enter features separated by commas"
              />
            </div>

            <InputField
              label="Display Order"
              name="displayOrder"
              type="number"
              value={formData.displayOrder}
              onChange={handleChange}
              min={0}
              placeholder="0"
              helpText="Lower numbers appear first"
            />
          </div>
        </section>

        {/* Confirmation */}
        <section className="form-section">
          <div className="form-section-header">
            <h2 className="form-section-title">Confirmation</h2>
          </div>
          <div className="form-section-divider"></div>
          <div className="flex items-center gap-3">
            <input
              id="confirm-info"
              type="checkbox"
              checked={isConfirmed}
              onChange={() => setIsConfirmed(!isConfirmed)}
            />
            <label htmlFor="confirm-info" className="text-sm text-gray-700 dark:text-gray-300">
              I confirm that the information provided is correct
            </label>
          </div>
        </section>

        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={() => navigate(`/account-products/${id}`)}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Update Product
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditAccountProduct;

