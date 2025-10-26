// components/FileUpload.jsx
import { useState } from "react";
import { 
  FaUpload, 
  FaTimes, 
  FaFileAlt, 
  FaFileImage, 
  FaFilePdf, 
  FaFileWord, 
  FaFileExcel,
  FaEye,
  FaDownload,
  FaCheckCircle,
  FaTrash
} from "react-icons/fa";

const FileUpload = ({ 
  label, 
  id, 
  required = false, 
  onFileChange, 
  onFileSelect,
  existingFile,
  existingFiles,
  multiple = false,
  accept,
  maxSize,
  uploading = false,
  uploadProgress = 0,
  onDeleteExistingFile
}) => {
  // Generate a unique ID if none provided
  const uniqueId = id || `file-upload-${Math.random().toString(36).substr(2, 9)}`;
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const hasExistingFiles = existingFile || (existingFiles && existingFiles.length > 0);

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (extension) {
      switch (extension) {
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
        case 'webp':
          return <FaFileImage className="text-blue-500 dark:text-blue-400" />;
        case 'pdf':
          return <FaFilePdf className="text-red-500 dark:text-red-400" />;
        case 'doc':
        case 'docx':
          return <FaFileWord className="text-blue-600 dark:text-blue-400" />;
        case 'xls':
        case 'xlsx':
          return <FaFileExcel className="text-green-600 dark:text-green-400" />;
        default:
          return <FaFileAlt className="text-gray-500 dark:text-gray-400" />;
      }
    }
    return <FaFileAlt className="text-gray-500 dark:text-gray-400" />;
  };

  const getFileTypeColor = (fileName) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (extension) {
      switch (extension) {
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
        case 'webp':
          return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300';
        case 'pdf':
          return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300';
        case 'doc':
        case 'docx':
          return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300';
        case 'xls':
        case 'xlsx':
          return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300';
        default:
          return 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300';
      }
    }
    return 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    // Validate file size if maxSize is provided (maxSize is in MB)
    if (maxSize) {
      const maxSizeInBytes = maxSize * 1024 * 1024; // Convert MB to bytes
      const oversizedFiles = selectedFiles.filter(file => file.size > maxSizeInBytes);
      if (oversizedFiles.length > 0) {
        alert(`File(s) too large. Maximum size is ${maxSize}MB`);
        return;
      }
    }
    
    setFiles(selectedFiles);
    if (multiple) {
      onFileChange?.(selectedFiles);
      onFileSelect?.(selectedFiles);
    } else {
      onFileChange?.(selectedFiles[0]);
      onFileSelect?.(selectedFiles[0]);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      
      // Validate file size if maxSize is provided
      if (maxSize) {
        const maxSizeInBytes = maxSize * 1024 * 1024;
        const oversizedFiles = droppedFiles.filter(file => file.size > maxSizeInBytes);
        if (oversizedFiles.length > 0) {
          alert(`File(s) too large. Maximum size is ${maxSize}MB`);
          return;
        }
      }
      
      setFiles(droppedFiles);
      if (multiple) {
        onFileChange?.(droppedFiles);
        onFileSelect?.(droppedFiles);
      } else {
        onFileChange?.(droppedFiles[0]);
        onFileSelect?.(droppedFiles[0]);
      }
    }
  };

  const removeFile = (index) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
    onFileChange?.(newFiles);
    onFileSelect?.(newFiles);
  };

  const handlePreview = (file) => {
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      window.open(url, '_blank');
    } else {
      // For non-image files, you might want to show a preview modal or download
      alert('Preview not available for this file type. Please download to view.');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label} {required && <span className="text-red-500 dark:text-red-400">*</span>}
      </label>

      {/* Existing files display */}
      {hasExistingFiles && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Current files:</p>
          
          {existingFile && (
            <div className={`p-4 rounded-lg border ${getFileTypeColor(existingFile)}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getFileIcon(existingFile)}
                  <div>
                    <p className="font-medium text-sm">{existingFile.split('/').pop()}</p>
                    <p className="text-xs opacity-75">Current file</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      const newWindow = window.open(existingFile, '_blank', 'noopener,noreferrer');
                      if (!newWindow) {
                        window.location.href = existingFile;
                      }
                    }}
                    className="p-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                    title="Preview file"
                  >
                    <FaEye size={14} />
                  </button>
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = existingFile;
                      link.download = existingFile.split('/').pop();
                      link.click();
                    }}
                    className="p-2 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-md transition-colors"
                    title="Download file"
                  >
                    <FaDownload size={14} />
                  </button>
                  {onDeleteExistingFile && (
                    <button
                      onClick={() => onDeleteExistingFile(existingFile)}
                      className="p-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
                      title="Delete file"
                    >
                      <FaTrash size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {existingFiles?.map((file, index) => (
            <div key={index} className={`p-4 rounded-lg border ${getFileTypeColor(file)}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getFileIcon(file)}
                  <div>
                    <p className="font-medium text-sm">{file.split('/').pop()}</p>
                    <p className="text-xs opacity-75">Current file</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      const newWindow = window.open(file, '_blank', 'noopener,noreferrer');
                      if (!newWindow) {
                        window.location.href = file;
                      }
                    }}
                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                    title="Preview file"
                  >
                    <FaEye size={14} />
                  </button>
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = file;
                      link.download = file.split('/').pop();
                      link.click();
                    }}
                    className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md transition-colors"
                    title="Download file"
                  >
                    <FaDownload size={14} />
                  </button>
                  {onDeleteExistingFile && (
                    <button
                      onClick={() => onDeleteExistingFile(file, index)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                      title="Delete file"
                    >
                      <FaTrash size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New files upload */}
      <div className="space-y-4">
        {/* Drag and Drop Zone */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
            dragActive 
              ? 'border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            className="hidden"
            type="file"
            id={uniqueId}
            onChange={handleFileChange}
            multiple={multiple}
            accept={accept || "*/*"}
          />
          
          <label htmlFor={uniqueId} className="cursor-pointer">
            <div className="flex flex-col items-center gap-4">
              <div className={`p-4 rounded-full ${
                dragActive ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-gray-700'
              }`}>
                <FaUpload className={`text-2xl ${
                  dragActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
                }`} />
              </div>
              
              <div>
                <p className={`text-lg font-medium ${
                  dragActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {dragActive ? 'Drop files here' : 'Click to upload or drag and drop'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {multiple ? 'Multiple files allowed' : 'Single file only'}
                  {maxSize && ` • Max size: ${maxSize}MB`}
                </p>
              </div>
            </div>
          </label>
        </div>

        {/* Upload Progress Indicator */}
        {uploading && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-blue-700 dark:text-blue-300 font-medium">Uploading files...</span>
            </div>
            <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">{uploadProgress}% complete</p>
          </div>
        )}

        {/* Selected files list */}
        {files.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">Selected files:</p>
            {files.map((file, index) => (
              <div key={index} className={`p-4 rounded-lg border ${getFileTypeColor(file.name)}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getFileIcon(file.name)}
                    <div>
                      <p className="font-medium text-sm">{file.name}</p>
                      <p className="text-xs opacity-75">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  
                                     <div className="flex items-center gap-2">
                     {file.type.startsWith('image/') && (
                       <button
                         onClick={() => handlePreview(file)}
                         className="p-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                         title="Preview file"
                       >
                         <FaEye size={14} />
                       </button>
                     )}
                     <button
                       type="button"
                       onClick={() => removeFile(index)}
                       className="p-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
                       title="Remove file"
                     >
                       <FaTimes size={14} />
                     </button>
                   </div>
                </div>
                
                {/* Progress indicator for upload */}
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full w-full"></div>
                  </div>
                  <FaCheckCircle className="text-green-500" size={14} />
                  <span className="text-xs text-green-600 font-medium">Ready to upload</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Requirement hint */}
      {!required && hasExistingFiles && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Leave empty to keep current file(s)
        </p>
      )}
    </div>
  );
};

export default FileUpload;
