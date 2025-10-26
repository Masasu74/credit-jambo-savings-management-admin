// 📁 pages/AddCustomer.js
import { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import InputField from "../components/InputField";
import SelectField from "../components/SelectField";
import FileUpload from "../components/FileUpload";
import AddressForm from "../components/AddressForm";
import EmploymentDetails from "../components/EmploymentDetails";
import MaritalStatusSection from "../components/MaritalStatusSection";
import Button from "../components/Button";
import Loader from "../components/Loader";
import countries from '../assets/countries.js';

const AddCustomer = () => {
  const { createCustomer, fetchBranches, branches } = useAppContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showCredentials, setShowCredentials] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [showConfirmationError, setShowConfirmationError] = useState(false);

  const [branchId, setBranchId] = useState("");

  const [personalInfo, setPersonalInfo] = useState({
    fullName: "",
    dob: "",
    gender: "",
    placeOfBirth: "",
    nationality: "",
    idNumber: "",
    idFile: null,
    photo: null,
  });

  const [address, setAddress] = useState({
    province: "",
    district: "",
    sector: "",
    cell: "",
    village: "",
    phone: "",
    email: "",
  });

  const [maritalStatus, setMaritalStatus] = useState({
    status: "",
    spouseIdFile: null,
    marriageCertFile: null,
    singleCertFile: null,
  });

  const [employment, setEmployment] = useState({
    status: "",
    jobTitle: "",
    employerName: "",
    employerAddress: "",
    employerContact: "",
    salary: "",
    contractCertificate: null,
    stampedPaySlips: null,
    businessName: "",
    businessType: "",
    businessCertificate: null,
    monthlyRevenue: "",
  });

  // Fetch branches once on mount to avoid effect loops
  useEffect(() => {
    fetchBranches(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Compute the latest allowed DOB (must be at least 18 years old)
  const maxDob = useMemo(() => {
    const now = new Date();
    const eighteenYearsAgo = new Date(
      now.getFullYear() - 18,
      now.getMonth(),
      now.getDate()
    );
    return eighteenYearsAgo.toISOString().split("T")[0];
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isConfirmed) {
      setShowConfirmationError(true);
      toast.error("Please confirm that the information provided is correct.");
      return;
    }
    setShowConfirmationError(false);
    
    setLoading(true);
    setUploadProgress(0);

    try {
      // Age validation: ensure DOB makes the customer at least 18
      if (personalInfo.dob) {
        const dobDate = new Date(personalInfo.dob);
        const maxAllowed = new Date(maxDob);
        if (dobDate > maxAllowed) {
          setLoading(false);
          toast.error("Customer must be at least 18 years old.");
          return;
        }
      }

      const formData = new FormData();
      formData.append("branchId", branchId);

      Object.entries(personalInfo).forEach(([key, value]) => {
        if (!["idFile", "photo"].includes(key)) formData.append(`personalInfo[${key}]`, value);
      });
      if (personalInfo.idFile) formData.append("idFile", personalInfo.idFile);
      if (personalInfo.photo) formData.append("photo", personalInfo.photo);

      formData.append("contact[phone]", address.phone);
formData.append("contact[email]", address.email);

["province", "district", "sector", "cell", "village"].forEach((key) => {
  formData.append(`contact[address][${key}]`, address[key]);
});


      Object.entries(maritalStatus).forEach(([key, value]) => {
        if (!["spouseIdFile", "marriageCertFile", "singleCertFile"].includes(key)) {
          formData.append(`maritalStatus[${key}]`, value);
        }
      });
      if (maritalStatus.spouseIdFile) formData.append("spouseIdFile", maritalStatus.spouseIdFile);
      if (maritalStatus.marriageCertFile) formData.append("marriageCertFile", maritalStatus.marriageCertFile);
      if (maritalStatus.singleCertFile) formData.append("singleCertFile", maritalStatus.singleCertFile);

      Object.entries(employment).forEach(([key, value]) => {
        if (!["contractCertificate", "stampedPaySlips", "businessCertificate"].includes(key)) {
          formData.append(`employment[${key}]`, value);
        }
      });
      if (employment.contractCertificate) formData.append("contractCertificate", employment.contractCertificate);
      if (employment.businessCertificate) formData.append("businessCertificate", employment.businessCertificate);
      if (employment.stampedPaySlips) {
        const files = Array.isArray(employment.stampedPaySlips)
          ? employment.stampedPaySlips
          : [employment.stampedPaySlips];
        files.forEach(file => formData.append("stampedPaySlips", file));
      }

      // Handle additional files
      if (personalInfo.additionalFiles) {
        const files = Array.isArray(personalInfo.additionalFiles)
          ? personalInfo.additionalFiles
          : [personalInfo.additionalFiles];
        files.forEach(file => formData.append("additionalFiles", file));
      }

      // Simulate upload progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 15;
        });
      }, 200);

      const result = await createCustomer(formData);
      
      // Complete the progress
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (result.success) {
        // Show credentials if they were generated
        if (result.credentials) {
          setCredentials(result.credentials);
          setShowCredentials(true);
        } else {
          // Small delay to show completion
          setTimeout(() => {
            navigate("/customers");
          }, 500);
        }
      }
    } catch (err) {
      console.error("Customer creation error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Copy to clipboard function
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

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
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Temporary Password</label>
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
          <p className="form-page-subtitle">Create new customer profile</p>
        </div>

      <form
        onSubmit={handleSubmit}
        className="form-container"
      >
        <section className="form-section">
          <div className="form-section-header">
            <h2 className="form-section-title">Branch Assignment</h2>
            <p className="form-section-subtitle">Assign customer to branch</p>
          </div>
          <SelectField
            label="Select Branch"
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            options={branches.map((b) => ({ value: b._id, label: b.name }))}
            required
          />
        </section>

        <section className="form-section">
          <div className="form-section-header">
            <h2 className="form-section-title">Personal Details</h2>
            <p className="form-section-subtitle">Customer's personal information</p>
          </div>
          <div className="form-section-divider"></div>
          <div className="form-grid">
            <InputField label="Full Name" value={personalInfo.fullName} onChange={(e) => setPersonalInfo({ ...personalInfo, fullName: e.target.value })} required />
            <InputField label="Date of Birth" type="date" value={personalInfo.dob} onChange={(e) => setPersonalInfo({ ...personalInfo, dob: e.target.value })} min="1900-01-01" max={maxDob} required />
            <SelectField label="Gender" value={personalInfo.gender} onChange={(e) => setPersonalInfo({ ...personalInfo, gender: e.target.value })} options={["Male", "Female"].map((opt) => ({ value: opt, label: opt }))} required />
            <SelectField label="Place of Birth" value={personalInfo.placeOfBirth} onChange={(e) => setPersonalInfo({ ...personalInfo, placeOfBirth: e.target.value })} options={countries} required />
            <SelectField label="Nationality" value={personalInfo.nationality} onChange={(e) => setPersonalInfo({ ...personalInfo, nationality: e.target.value })} options={countries} required />
            <InputField label="ID/Passport Number" value={personalInfo.idNumber} onChange={(e) => setPersonalInfo({ ...personalInfo, idNumber: e.target.value })} required />
            <FileUpload 
              label="ID/Passport File" 
              id="idFile" 
              onFileChange={(file) => setPersonalInfo({ ...personalInfo, idFile: file })} 
              required 
              uploading={loading}
              uploadProgress={uploadProgress}
            />
            <FileUpload 
              label="Customer Photo (Optional)" 
              id="photo" 
              onFileChange={(file) => setPersonalInfo({ ...personalInfo, photo: file })} 
              accept="image/*" 
              uploading={loading}
              uploadProgress={uploadProgress}
            />
            <MaritalStatusSection 
              maritalStatus={maritalStatus} 
              setMaritalStatus={setMaritalStatus} 
              uploading={loading}
              uploadProgress={uploadProgress}
            />
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-md md:text-2xl font-bold">Address Details</h2>
          <hr />
          <AddressForm address={address} setAddress={setAddress} />
          <div className="flex gap-3 flex-wrap">
            <InputField label="Phone Number" value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} required />
            <InputField label="Email Address" value={address.email} onChange={(e) => setAddress({ ...address, email: e.target.value })} required />
          </div>
        </section>

        <section className="form-section">
          <div className="form-section-header">
            <h2 className="form-section-title">Employment Details</h2>
            <p className="form-section-subtitle">Customer's employment information</p>
          </div>
          <div className="form-section-divider"></div>
          <EmploymentDetails 
            employment={employment} 
            setEmployment={setEmployment} 
            uploading={loading}
            uploadProgress={uploadProgress}
          />
        </section>

        <section className="form-section">
          <div className="form-section-header">
            <h2 className="form-section-title">Additional Documents</h2>
            <p className="form-section-subtitle">Upload any additional supporting documents</p>
          </div>
          <div className="form-section-divider"></div>
          <div className="space-y-4">
            <FileUpload 
              label="Additional Files (Optional)" 
              id="additionalFiles" 
              onFileChange={(files) => setPersonalInfo({ ...personalInfo, additionalFiles: files })}
              multiple={true}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
              maxSize={10}
              uploading={loading}
              uploadProgress={uploadProgress}
            />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Supported formats: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX (Max 10MB per file)
            </p>
          </div>
        </section>

        <div className={`confirmation-section ${
          showConfirmationError 
            ? 'confirmation-section-error' 
            : 'confirmation-section-default'
        }`}>
          <div className="flex items-center gap-3">
            <div 
              className={`custom-checkbox ${
                isConfirmed 
                  ? 'custom-checkbox-checked' 
                  : 'custom-checkbox-unchecked'
              } ${showConfirmationError ? 'custom-checkbox-error' : ''}`}
              onClick={() => {
                console.log('Custom checkbox clicked');
                setIsConfirmed(!isConfirmed);
                if (!isConfirmed) {
                  setShowConfirmationError(false);
                }
              }}
            >
              {isConfirmed && (
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <span 
              className={`confirmation-text ${
                showConfirmationError ? 'confirmation-text-error' : 'confirmation-text-default'
              }`}
              onClick={() => {
                console.log('Label clicked');
                setIsConfirmed(!isConfirmed);
                if (!isConfirmed) {
                  setShowConfirmationError(false);
                }
              }}
            >
              I confirm that the information provided is correct
            </span>
          </div>
          {showConfirmationError && (
            <p className="confirmation-error-message">
              Please check this box to confirm your information
            </p>
          )}
        </div>

        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={() => navigate("/customers")}>Cancel</Button>
          <Button type="submit" variant="primary" loading={loading}>
            Submit
          </Button>
        </div>
      </form>
      </div>
    </>
  );
};

export default AddCustomer;
