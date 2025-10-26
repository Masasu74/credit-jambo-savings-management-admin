// components/MaritalStatusSection.jsx
import FileUpload from "./FileUpload";
import SelectField from "./SelectField";

const MaritalStatusSection = ({ 
  maritalStatus, 
  setMaritalStatus,
  isEditMode = false,
  existingFiles = {},
  uploading = false,
  uploadProgress = 0
}) => {
  return (
    <div className="flex flex-col gap-4 w-full">
      <SelectField
  label="Marital Status"
  value={maritalStatus.status}
  onChange={(e) => setMaritalStatus({ 
    ...maritalStatus, 
    status: e.target.value // Should be single value
  })}
  options={['Single', 'Married', 'Divorced', 'Widowed']}
  required
/>

      {maritalStatus.status === "Married" && (
        <>
          <FileUpload
            label="Spouse ID/Passport File"
            id="spouseId"
            required={!isEditMode}
            onFileChange={(file) => setMaritalStatus({ ...maritalStatus, spouseIdFile: file })}
            existingFile={existingFiles.spouseIdFile}
            uploading={uploading}
            uploadProgress={uploadProgress}
          />
          <FileUpload
            label="Marriage Certificate"
            id="marriageCert"
            required={!isEditMode}
            onFileChange={(file) => setMaritalStatus({ ...maritalStatus, marriageCertFile: file })}
            existingFile={existingFiles.marriageCertFile}
            uploading={uploading}
            uploadProgress={uploadProgress}
          />
        </>
      )}

      {(maritalStatus.status === "Single" || maritalStatus.status === "Divorced" || maritalStatus.status === "Widowed") && (
        <FileUpload
          label="Status Certificate"
          id="singleCert"
          required={!isEditMode}
          onFileChange={(file) => setMaritalStatus({ ...maritalStatus, singleCertFile: file })}
          existingFile={existingFiles.singleCertFile}
          uploading={uploading}
          uploadProgress={uploadProgress}
        />
      )}
    </div>
  );
};

export default MaritalStatusSection;