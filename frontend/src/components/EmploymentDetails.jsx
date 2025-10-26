import FileUpload from "./FileUpload";
import InputField from "./InputField";
import SelectField from "./SelectField";

const EmploymentDetails = ({ 
  employment, 
  setEmployment, 
  isEditMode = false,
  existingFiles = {},
  uploading = false,
  uploadProgress = 0
}) => {
  const handlePaySlipsChange = (files) => {
    setEmployment({
      ...employment,
      stampedPaySlips: Array.from(files) // Ensure it's an array
    });
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <SelectField
        label="Employment Status"
        value={employment.status || ""} // Fallback to empty string
        onChange={(e) => setEmployment({ 
          ...employment, 
          status: e.target.value 
        })}
        options={['Employed', 'Self-Employed']}
        required
      />

      {employment.status === "Employed" && (
        <div className="flex gap-3 flex-wrap">
          <InputField
            label="Job Title"
            value={employment.jobTitle || ""}
            onChange={(e) => setEmployment({ ...employment, jobTitle: e.target.value })}
            required
          />
          <InputField
            label="Employer Name"
            value={employment.employerName || ""}
            onChange={(e) => setEmployment({ ...employment, employerName: e.target.value })}
            required
          />
          <InputField
            label="Employer Address"
            value={employment.employerAddress || ""}
            onChange={(e) => setEmployment({ ...employment, employerAddress: e.target.value })}
            required
          />
          <InputField
            label="Employer Contact"
            value={employment.employerContact || ""}
            onChange={(e) => setEmployment({ ...employment, employerContact: e.target.value })}
            required
          />
          <InputField
            label="Monthly Salary (FRW)"
            type="number"
            value={employment.salary || ""}
            onChange={(e) => setEmployment({ ...employment, salary: e.target.value })}
            required
          />
          <FileUpload
            label="Employment Contract"
            id="jobContract"
            required={!isEditMode}
            onFileChange={(file) => setEmployment({ ...employment, contractCertificate: file })}
            existingFile={existingFiles.contractCertificate}
            uploading={uploading}
            uploadProgress={uploadProgress}
          />
          <FileUpload
            label="Stamped Pay Slips (3 months)"
            id="paySlips"
            multiple
            required={!isEditMode}
            onFileChange={handlePaySlipsChange}
            existingFiles={existingFiles.stampedPaySlips}
            uploading={uploading}
            uploadProgress={uploadProgress}
          />
        </div>
      )}

      {employment.status === "Self-Employed" && (
        <div className="flex gap-3 flex-wrap">
          <InputField
            label="Business Name"
            value={employment.businessName || ""}
            onChange={(e) => setEmployment({ ...employment, businessName: e.target.value })}
            required
          />
          <InputField
            label="Business Type"
            value={employment.businessType || ""}
            onChange={(e) => setEmployment({ ...employment, businessType: e.target.value })}
            required
          />
          <InputField
            label="Monthly Revenue (FRW)"
            type="number"
            value={employment.monthlyRevenue || ""}
            onChange={(e) => setEmployment({ ...employment, monthlyRevenue: e.target.value })}
            required
          />
          <FileUpload
            label="Business Certificate"
            id="businessCert"
            required={!isEditMode}
            onFileChange={(file) => setEmployment({ ...employment, businessCertificate: file })}
            existingFile={existingFiles.businessCertificate}
            uploading={uploading}
            uploadProgress={uploadProgress}
          />
        </div>
      )}
    </div>
  );
};

export default EmploymentDetails;