// 📁 pages/EditCustomer.jsx - Simplified to match mobile app registration fields
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-toastify";
import InputField from "../components/InputField";
import SelectField from "../components/SelectField";
import Button from "../components/Button";
import Loader from "../components/Loader";

const EditCustomer = () => {
  const { id } = useParams();
  const { fetchSingleCustomer, updateCustomer } = useAppContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  // Form state matching mobile app registration (no branches/tenant)
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: ""
  });

  useEffect(() => {
    const loadCustomer = async () => {
      if (id && id !== 'undefined') {
        try {
          setInitialLoad(true);
          const customerData = await fetchSingleCustomer(id);
          
          // Populate form with customer data
          setFormData({
            fullName: customerData.personalInfo?.fullName || customerData.fullName || "",
            email: customerData.contact?.email || customerData.email || "",
            phone: customerData.contact?.phone || customerData.phone || ""
          });
        } catch (err) {
          toast.error("Failed to load customer data");
          navigate("/customers");
      } finally {
        setInitialLoad(false);
        }
      }
    };
    loadCustomer();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.fullName || !formData.email || !formData.phone) {
      toast.error("Please fill in all required fields.");
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    // Validate phone (basic validation)
    if (formData.phone.length < 10) {
      toast.error("Please enter a valid phone number.");
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();
      
      // Add personal info
      formDataToSend.append("personalInfo[fullName]", formData.fullName);
      
      // Add contact info
      formDataToSend.append("contact[email]", formData.email);
      formDataToSend.append("contact[phone]", formData.phone);
      
      // No branch/tenant in savings platform

      const result = await updateCustomer(id, formDataToSend);
      
      if (result.success) {
        toast.success("Customer updated successfully!");
        setTimeout(() => {
          navigate(`/customers/${id}`);
        }, 500);
      } else {
        toast.error(result.message || "Failed to update customer");
      }
    } catch (err) {
      console.error("Customer update error:", err);
      toast.error(err.message || "Failed to update customer. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // No branch options

  if (initialLoad) return <Loader />;

  return (
    <div className="form-page-container">
      <div className="form-page-header">
        <h1 className="form-page-title">Edit Customer</h1>
        <p className="form-page-subtitle">Update customer registration information</p>
      </div>

      <form onSubmit={handleSubmit} className="form-container">
        <section className="form-section">
          <div className="form-section-header">
            <h2 className="form-section-title">Customer Information</h2>
            <p className="form-section-subtitle">Update the customer's registration details</p>
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
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="customer@example.com"
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
            
            
          </div>
        </section>

        <div className="form-actions">
          <Button 
            type="button" 
            variant="secondary" 
            onClick={() => navigate(`/customers/${id}`)}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Update Customer
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditCustomer;
