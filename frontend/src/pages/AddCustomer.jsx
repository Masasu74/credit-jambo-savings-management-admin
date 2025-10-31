// 📁 pages/AddCustomer.jsx - Simplified to match mobile app registration
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import InputField from "../components/InputField";
import SelectField from "../components/SelectField";
import Button from "../components/Button";
import CustomCheckbox from "../components/CustomCheckbox";

const AddCustomer = () => {
  const { api } = useAppContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [credentials, setCredentials] = useState(null);

  // Form state matching mobile app registration (with optional profile fields)
  const [formData, setFormData] = useState({
    // Required basics
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    // Optional profile fields
    dob: "",
    gender: "",
    employmentStatus: "",
    jobTitle: "",
    salary: "",
    businessName: "",
    monthlyRevenue: ""
  });
  const [isConfirmed, setIsConfirmed] = useState(false);

  // No branches/tenant needed for this form
  useEffect(() => {}, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    
    // Validate age if DOB is provided BEFORE updating form state
    if (value) {
      const today = new Date();
      const birthDate = new Date(value);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      if (age < 18) {
        toast.error("Customer must be at least 18 years old.");
        return; // Don't update the form state if age is invalid
      }
    }
    
    // Only update form state if validation passed
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.fullName || !formData.email || !formData.password || !formData.phone) {
      toast.error("Please fill in all required fields.");
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    // Validate password
    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }
    if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    // Validate phone (basic validation)
    if (formData.phone.length < 10) {
      toast.error("Please enter a valid phone number.");
      return;
    }

    // Employment-specific validation (optional fields)
    if (formData.employmentStatus === 'employed' && !formData.jobTitle) {
      toast.error("Please provide job title for employed status.");
      return;
    }
    if (formData.employmentStatus === 'self-employed' && !formData.businessName) {
      toast.error("Please provide business name for self-employed status.");
      return;
    }

    if (!isConfirmed) {
      toast.error("Please confirm that the information provided is correct.");
      return;
    }

    setLoading(true);

    try {
      // Only send required fields that backend expects
      const response = await api.post("/customer-auth/register", {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone
      });

      if (response.data.success) {
        // Show credentials if provided
        if (response.data.credentials) {
          setCredentials(response.data.credentials);
          setShowCredentials(true);
          toast.success("Customer registered successfully!");
        } else {
          toast.success("Customer registered successfully!");
          setTimeout(() => {
            navigate("/customers");
          }, 1500);
        }
      } else {
        toast.error(response.data.message || "Failed to register customer");
      }
    } catch (err) {
      console.error("Customer registration error:", err);
      const errorMessage = err.response?.data?.message || "Failed to register customer. Please try again.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Copy to clipboard function
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  // Branch/Tenant removed

  return (
    <>
      {/* Credentials Modal */}
      {showCredentials && credentials && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Customer Account Created!
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Customer portal credentials have been generated. Please share these with the customer.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3 mb-6">
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Customer Code</label>
                <div className="flex items-center justify-between gap-2 mt-1">
                  <p className="font-mono font-bold text-gray-900 dark:text-white">{credentials.customerCode}</p>
                  <button
                    onClick={() => copyToClipboard(credentials.customerCode)}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Email</label>
                <div className="flex items-center justify-between gap-2 mt-1">
                  <p className="font-mono text-gray-900 dark:text-white">{credentials.email}</p>
                  <button
                    onClick={() => copyToClipboard(credentials.email)}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Password</label>
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
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-6">
              <p className="text-xs text-yellow-800 dark:text-yellow-200">
                ⚠️ <strong>Important:</strong> Please save these credentials securely and share them with the customer. They can change their password after first login.
              </p>
            </div>

            <button
              onClick={() => {
                setShowCredentials(false);
                navigate("/customers");
              }}
              className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              Done
            </button>
          </div>
        </div>
      )}

      <div className="form-page-container">
        <div className="form-page-header">
          <h1 className="form-page-title">Add Customer</h1>
          <p className="form-page-subtitle">Register a new customer to the system</p>
        </div>

        <form onSubmit={handleSubmit} className="form-container">
          <section className="form-section">
            <div className="form-section-header">
              <h2 className="form-section-title">Customer Registration</h2>
              <p className="form-section-subtitle">Enter the basic information to register a new customer</p>
            </div>
            <div className="form-section-divider"></div>
            
            <div className="form-grid">
              <InputField
                label="Full Name"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                placeholder="Enter customer's full name"
              />

              <InputField
                label="Date of Birth"
                name="dob"
                type="date"
                value={formData.dob}
                onChange={handleDateChange}
                placeholder="Select date of birth"
                helpText="Customer must be at least 18 years old"
                max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
              />

              <SelectField
                label="Gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                options={[
                  { value: "Male", label: "Male" },
                  { value: "Female", label: "Female" },
                ]}
              />

              <InputField
                label="Phone Number"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                required
                placeholder="+250 7XX XXX XXX"
              />

              <InputField
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="customer@example.com"
              />

              <SelectField
                label="Employment Status"
                name="employmentStatus"
                value={formData.employmentStatus}
                onChange={handleChange}
                options={[
                  { value: "employed", label: "Employed" },
                  { value: "self-employed", label: "Self-Employed" },
                  { value: "unemployed", label: "Unemployed" },
                  { value: "student", label: "Student" },
                  { value: "retired", label: "Retired" },
                ]}
              />

              {formData.employmentStatus === 'employed' && (
                <>
                  <InputField
                    label="Job Title"
                    name="jobTitle"
                    value={formData.jobTitle}
                    onChange={handleChange}
                    placeholder="Job Title"
                  />
                  <InputField
                    label="Monthly Salary (RWF)"
                    name="salary"
                    type="number"
                    value={formData.salary}
                    onChange={handleChange}
                    placeholder="e.g. 350000"
                  />
                </>
              )}

              {formData.employmentStatus === 'self-employed' && (
                <>
                  <InputField
                    label="Business Name"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleChange}
                    placeholder="Business Name"
                  />
                  <InputField
                    label="Monthly Revenue (RWF)"
                    name="monthlyRevenue"
                    type="number"
                    value={formData.monthlyRevenue}
                    onChange={handleChange}
                    placeholder="e.g. 800000"
                  />
                </>
              )}

              <InputField
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Minimum 8 characters"
              />

              <InputField
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter password"
              />

              
            </div>
          </section>

          <section className="form-section">
            <div className="form-section-header">
              <h2 className="form-section-title">Confirmation</h2>
              <p className="form-section-subtitle">Please confirm the information is correct</p>
            </div>
            <div className="form-section-divider"></div>
            <CustomCheckbox
              id="confirm-info"
              name="confirmInfo"
              checked={isConfirmed}
              onChange={(val) => setIsConfirmed(val)}
              label="I confirm that the information provided is correct"
              size="md"
              color="blue"
              containerClassName="bg-transparent p-0"
              labelClassName="text-sm text-gray-700 dark:text-gray-300"
            />
          </section>

          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => navigate("/customers")}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={loading}>
              Register Customer
            </Button>
          </div>
        </form>
      </div>
    </>
  );
};

export default AddCustomer;
