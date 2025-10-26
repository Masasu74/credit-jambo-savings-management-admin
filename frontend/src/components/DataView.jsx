// Enhanced DataView styling and responsiveness with Tailwind CSS
import React, { useState, useEffect } from "react";
import {
  FaFilter,
  FaFilePdf,
  FaFileExcel,
  FaPrint,
  FaSearch,
  FaTimes,
  FaSyncAlt,
} from "react-icons/fa";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { toast } from "react-toastify";
// Removed ConfirmationPopup import as it's no longer neede
import { TableSkeleton } from "./Skeleton";
import { useSystemColors } from "../hooks/useSystemColors";
import { useSystemSettings } from "../context/SystemSettingsContext";
import { getUploadUrl } from "../utils/apiUtils";
import { useAppContext } from "../context/AppContext";
// Removed loanTypeUtils import - no longer needed for savings management
import NoDataLoadingView from "./NoDataLoadingView";
import { usePageInfo } from "../hooks/usePageInfo";

// Helper function to load image for PDF
const loadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

// Helper function to convert hex to RGB
const hexToRgb = (hex) => {
  if (!hex) return [37, 99, 235]; // Default blue
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [37, 99, 235];
};

const DataView = ({
  title,
  description,
  columns,
  data,
  filters,
  onAddNew,
  renderActions,
  loading = false,
  pagination: initialPagination = { pageSize: 10, currentPage: 1 },
  onRefresh,
  onActionComplete, // New prop for handling action completion
  showNoDataInitially = false, // New prop to show no data view initially
  preloadLoading = false, // New prop for preload loading state
}) => {
  // Debug logging for DataView
  const { colors } = useSystemColors();
  const { settings } = useSystemSettings();
  const { user, api } = useAppContext();
  const { page, pageTitle } = usePageInfo();
  
  // Fallback colors
  const fallbackColors = {
    primary: '#2563eb',
    secondary: '#64748b',
    accent: '#f59e0b',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  };
  
  const currentColors = colors || fallbackColors;

  const [toggleFilter, setToggleFilter] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilters, setSelectedFilters] = useState({});
  const [filteredData, setFilteredData] = useState(Array.isArray(data) ? data : []);
  // Removed selectedItems state as checkboxes are no longer needed
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [pagination, setPagination] = useState({
    pageSize: initialPagination.pageSize,
    currentPage: initialPagination.currentPage,
  });

  useEffect(() => {
    if (import.meta.env.MODE === 'development') {
      console.log('DataView received data:', Array.isArray(data) ? `${data?.length || 0} items` : typeof data);
    }
    let result = Array.isArray(data) ? data : [];

    if (searchTerm) {
      result = result.filter((item) =>
        columns.some((column) => {
          const value = column.render
            ? column.render(item)
            : item[column.key];
          return String(value).toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    Object.entries(selectedFilters).forEach(([filterKey, filterValue]) => {
      if (filterValue) {
        result = result.filter((item) => {
          const value = item[filterKey];
          return String(value).toLowerCase() === filterValue.toLowerCase();
        });
      }
    });

    // Sort data based on sortConfig
    result = result.sort((a, b) => {
      let aValue, bValue;
      
      if (sortConfig.key === 'createdAt' || sortConfig.key === 'created_at') {
        aValue = new Date(a.createdAt || a.created_at || 0);
        bValue = new Date(b.createdAt || b.created_at || 0);
      } else {
        // Handle nested properties
        aValue = sortConfig.key.includes('.') 
          ? sortConfig.key.split('.').reduce((obj, key) => obj?.[key], a)
          : a[sortConfig.key];
        bValue = sortConfig.key.includes('.') 
          ? sortConfig.key.split('.').reduce((obj, key) => obj?.[key], b)
          : b[sortConfig.key];
      }
      
      // Handle different data types
      if (aValue instanceof Date && bValue instanceof Date) {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      } else if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      } else {
        // Fallback to string comparison
        const aStr = String(aValue || '');
        const bStr = String(bValue || '');
        return sortConfig.direction === 'asc' 
          ? aStr.localeCompare(bStr)
          : bStr.localeCompare(aStr);
      }
    });

    setFilteredData(result);
    
    // Only reset to page 1 if the data length has changed significantly
    // or if we're on a page that no longer exists
    const maxPage = Math.ceil(result.length / pagination.pageSize);
    if (pagination.currentPage > maxPage && maxPage > 0) {
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
    } else if (result.length === 0) {
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
    }
  }, [data, selectedFilters, searchTerm, pagination.pageSize, sortConfig]);

  const handleFilterChange = (filterKey, value) => {
    setSelectedFilters((prev) => ({ ...prev, [filterKey]: value }));
    // Reset to page 1 when filters change
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleSortChange = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
    // Reset to page 1 when sorting changes
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  // Enhanced action handler functionality is now handled by actionUtils.js

  const handlePageSizeChange = (size) => {
    setPagination((prev) => ({ ...prev, pageSize: size, currentPage: 1 }));
  };

  const handlePageChange = (page) => {
    const maxPage = Math.ceil(filteredData.length / pagination.pageSize);
    if (page >= 1 && page <= maxPage) {
      setPagination((prev) => ({ ...prev, currentPage: page }));
    }
  };

  // Calculate pagination data first
  const startIndex = Math.max(0, (pagination.currentPage - 1) * pagination.pageSize);
  const endIndex = startIndex + pagination.pageSize;
  const paginatedData = filteredData.slice(startIndex, endIndex);
  const totalPages = Math.max(1, Math.ceil(filteredData.length / pagination.pageSize));

  // Removed checkbox-related functions as they are no longer needed
  
  // Debug logging for pagination (development only)
  if (import.meta.env.MODE === 'development') {
    console.log("🔍 DataView Pagination Debug:", {
      title,
      filteredDataLength: filteredData.length,
      pagination,
      startIndex,
      endIndex,
      totalPages,
      paginatedDataLength: paginatedData.length
    });
  }

  const exportToExcel = async () => {
    try {
    // Get company information from system settings
    const companyName = settings?.companyName || 'Credit Jambo Ltd';
    
    // Try to load company logo from system settings
    let logoImage = null;
    try {
      if (settings?.logo && settings.logo !== getUploadUrl('logo.png')) {
        logoImage = await loadImage(settings.logo);
      }
    } catch {
      console.log('Logo not found, using text logo');
    }
    
    console.log('Exporting to Excel for:', companyName, logoImage ? 'with logo' : 'without logo');
    
    const worksheetData = filteredData.map((item) => {
      const row = {};
      columns.forEach((column) => {
        let value;
  
        if (column.render) {
          // For loan data and other complex renders, extract the actual data values
          const key = column.key;
          
          // Handle loan-specific fields
          if (key === 'loanCode') {
            value = item.loanCode || 'N/A';
          } else if (key === 'customer') {
            value = item.customer?.personalInfo?.fullName || item.customer?.fullName || 'N/A';
          } else if (key === 'customerCode') {
            value = item.customer?.customerCode || 'N/A';
          } else if (key === 'customerName') {
            value = item.customer?.personalInfo?.fullName || item.customer?.fullName || 'N/A';
          } else if (key === 'amount') {
            value = item.amount || 0;
          } else if (key === 'disbursedAmount') {
            value = item.disbursedAmount || 0;
          } else if (key === 'outstandingBalance') {
            value = item.outstandingBalance || 0;
          } else if (key === 'status') {
            value = item.status || 'N/A';
          } else if (key === 'loanType') {
            // Use product name if available, otherwise fallback to loanType
            if (item.product?.name) {
              value = item.product.name;
            } else if (item.loanType) {
              value = item.loanType;
            } else {
              value = 'N/A';
            }
          } else if (key === 'interestRate') {
            // Use product interest rate if available, otherwise fallback to loan interest rate
            if (item.product?.interestRate?.rate) {
              value = item.product.interestRate.rate;
            } else {
              value = item.interestRate || 0;
            }
          } else if (key === 'durationMonths') {
            value = item.durationMonths || 0;
          } else if (key === 'branch') {
            value = item.branch?.name || item.branch?.alias || 'N/A';
          } else if (key === 'responsibleOfficer') {
            value = item.responsibleOfficer?.fullName || 'N/A';
          } else if (key === 'completedBy') {
            // Try multiple ways to get the completed by information
            if (item.completedBy?.fullName) {
              value = item.completedBy.fullName;
            } else if (item.completedBy?.username) {
              value = item.completedBy.username;
            } else if (item.approvedBy?.fullName) {
              value = item.approvedBy.fullName; // Sometimes completion is done by the same person who approved
            } else if (item.approvedBy?.username) {
              value = item.approvedBy.username;
            } else {
              value = 'N/A';
            }
          } else if (key === 'purpose') {
            value = item.purpose || 'N/A';
          } else if (key === 'collateralType') {
            value = item.collateralType || 'N/A';
          } else if (key === 'collateralValue') {
            value = item.collateral?.value || 0;
          } else if (key === 'collateralType') {
            value = item.collateral?.type || 'N/A';
          } else if (key === 'collateralDescription') {
            value = item.collateral?.description || 'N/A';
          } else if (key === 'totalPenalties') {
            value = item.totalPenalties || 0;
          } else if (key === 'totalPenaltiesPaid') {
            value = item.totalPenaltiesPaid || 0;
          } else if (key === 'penaltyRate') {
            value = item.penaltyRate || 0;
          } else if (key === 'classification') {
            value = item.classification?.status || 'normal';
          } else if (key === 'daysInArrears') {
            value = item.classification?.daysInArrears || 0;
          } else if (key === 'provisionAmount') {
            value = item.classification?.provisionAmount || 0;
          } else if (key === 'completionDate') {
            if (item.status === 'completed') {
              // Prioritize completionDate (set when status was changed to completed)
              if (item.completionDate) {
                value = new Date(item.completionDate).toLocaleDateString();
              } 
              // Fallback to updatedAt only if completionDate is not available
              else if (item.updatedAt) {
                value = new Date(item.updatedAt).toLocaleDateString() + " (estimated)";
              } else {
                value = 'N/A';
              }
            } else {
              value = 'N/A';
            }
          } else if (key === 'approvedBy') {
            value = item.approvedBy?.fullName || item.approvedBy?.username || 'N/A';
          } else if (key === 'createdBy') {
            value = item.createdBy?.fullName || item.createdBy?.username || 'N/A';
          } else if (key === 'rejectedBy') {
            value = item.rejectedBy?.fullName || item.rejectedBy?.username || 'N/A';
          } else if (key === 'rejectionReason') {
            value = item.rejectionReason || 'N/A';
          } else if (key === 'rejectionDate') {
            value = item.rejectionDate ? new Date(item.rejectionDate).toLocaleDateString() : 'N/A';
          } else if (key === 'disbursedBy') {
            value = item.disbursedBy?.fullName || item.disbursedBy?.username || 'N/A';
          } else if (key === 'endDate') {
            // Calculate maturity date from startDate and durationMonths
            if (item.startDate && item.durationMonths) {
              const startDate = new Date(item.startDate);
              const maturityDate = new Date(startDate);
              maturityDate.setMonth(maturityDate.getMonth() + item.durationMonths);
              value = maturityDate.toLocaleDateString();
            } else if (item.endDate) {
              value = new Date(item.endDate).toLocaleDateString();
            } else {
              value = 'N/A';
            }
          } else if (key === 'maturityDate') {
            // Calculate maturity date from startDate and durationMonths
            if (item.startDate && item.durationMonths) {
              const startDate = new Date(item.startDate);
              const maturityDate = new Date(startDate);
              maturityDate.setMonth(maturityDate.getMonth() + item.durationMonths);
              value = maturityDate.toLocaleDateString();
            } else if (item.endDate) {
              value = new Date(item.endDate).toLocaleDateString();
            } else {
              value = 'N/A';
            }
          } else if (key === 'overdueDays') {
            // Calculate overdue days
            if (item.startDate && item.durationMonths) {
              const startDate = new Date(item.startDate);
              const maturityDate = new Date(startDate);
              maturityDate.setMonth(maturityDate.getMonth() + item.durationMonths);
              const today = new Date();
              const daysOverdue = Math.ceil((today - maturityDate) / (1000 * 60 * 60 * 24));
              value = daysOverdue > 0 ? daysOverdue : 0;
            } else {
              value = 0;
            }
          } else if (key === 'outstandingAmount') {
            // Use outstanding balance or calculate from disbursed amount
            value = item.outstandingBalance || item.disbursedAmount || item.amount || 0;
          } else if (key === 'createdAt') {
            value = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A';
          } else if (key === 'approvalDate') {
            value = item.approvalDate ? new Date(item.approvalDate).toLocaleDateString() : 'N/A';
          } else if (key === 'disbursementDate') {
            value = item.disbursementDate ? new Date(item.disbursementDate).toLocaleDateString() : 'N/A';
          } else if (key === 'maturityDate') {
            // Calculate maturity date from startDate and durationMonths
            if (item.startDate && item.durationMonths) {
              const startDate = new Date(item.startDate);
              const maturityDate = new Date(startDate);
              maturityDate.setMonth(maturityDate.getMonth() + item.durationMonths);
              value = maturityDate.toLocaleDateString();
            } else if (item.endDate) {
              value = new Date(item.endDate).toLocaleDateString();
            } else {
              value = 'N/A';
            }
          } else if (key === 'interestEarned') {
            // Calculate interest earned using product data if available
            if (item.approvalDate && item.amount) {
              const approvalDate = new Date(item.approvalDate);
              const currentDate = new Date();
              const monthsElapsed = Math.max(0, (currentDate - approvalDate) / (1000 * 60 * 60 * 24 * 30));
              
              // Use product data if available, otherwise fallback to loan data
              const product = item.product;
              let interestRate;
              if (product && product.interestRate) {
                interestRate = product.interestRate.rate;
              } else {
                interestRate = item.interestRate || 4.5;
              }
              
              const interestEarned = item.amount * (interestRate / 100) * monthsElapsed;
              value = interestEarned;
            } else {
              value = 0;
            }
          } else if (key === 'totalAmountDue') {
            // Calculate total amount due
            if (item.disbursedAmount && item.durationMonths) {
              // Use product data if available, otherwise fallback to loan data
              const product = item.product;
              
              if (product && product.interestRate && product.fees) {
                // Use product-based calculations
                // Simple calculation for savings management
                const calculation = {
                  totalAmount: item.disbursedAmount || 0,
                  monthlyPayment: 0,
                  totalInterest: 0
                };
                value = calculation.totalAmount;
              } else {
                // Fallback to old calculation method
                const totalInterest = item.disbursedAmount * ((item.interestRate || 4.5) / 100) * item.durationMonths;
                const totalFees = item.disbursedAmount * 0.03; // 3% default
                value = item.disbursedAmount + totalInterest + totalFees;
              }
            } else {
              value = 0;
            }
          } else if (key === 'daysToMaturity') {
            // Calculate days to maturity
            if (item.startDate && item.durationMonths) {
              const startDate = new Date(item.startDate);
              const maturityDate = new Date(startDate);
              maturityDate.setMonth(maturityDate.getMonth() + item.durationMonths);
              const today = new Date();
              const daysRemaining = Math.ceil((maturityDate - today) / (1000 * 60 * 60 * 24));
              value = daysRemaining;
            } else {
              value = 'N/A';
            }
          } else if (key === 'accountCode' || key === 'accountName' || key === 'category') {
            value = item[key] || item.account || item.category || 'N/A';
          } else if (key === 'accountType') {
            value = (item[key] || 'asset').charAt(0).toUpperCase() + (item[key] || 'asset').slice(1);
          } else if (key === 'totalDebit' || key === 'totalCredit' || key === 'balance' || 
                     key === 'currentPeriod' || key === 'previousPeriod' || 
                     key === 'change') {
            value = item[key] || 0;
          } else if (key === 'percentage') {
            value = (item[key] || 0).toFixed(2);
          } else {
            value = item[key] || '';
          }
        } else {
          // Handle nested object paths for Excel export too
          if (column.key.includes('.')) {
            const keys = column.key.split('.');
            value = keys.reduce((obj, key) => obj?.[key], item) || '';
        } else {
          value = item[column.key] || '';
          }
        }
  
        row[column.header] = value;
      });
      return row;
    });
  
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    
    // Add some basic formatting for financial statements
    if (title && (title.includes('Balance') || title.includes('Profit') || title.includes('Trial'))) {
      // Set column widths for better readability
      const columnWidths = [];
      columns.forEach((column) => {
        if (column.key === 'accountCode' || column.key === 'accountName' || column.key === 'category') {
          columnWidths.push({ wch: 25 });
        } else if (column.key === 'accountType') {
          columnWidths.push({ wch: 15 });
        } else if (column.key === 'totalDebit' || column.key === 'totalCredit' || column.key === 'balance' || 
                   column.key === 'amount' || column.key === 'currentPeriod' || column.key === 'previousPeriod' || 
                   column.key === 'change') {
          columnWidths.push({ wch: 20 });
        } else if (column.key === 'percentage') {
          columnWidths.push({ wch: 12 });
        } else {
          columnWidths.push({ wch: 15 });
        }
      });
      worksheet['!cols'] = columnWidths;
    }
    
    const workbook = XLSX.utils.book_new();
    
    // Add metadata sheet with generation information
    const metadataSheet = XLSX.utils.aoa_to_sheet([
      ['Document Information'],
      ['Company Name', companyName],
      ['Report Title', title || 'Financial Statement'],
      ['Generated Date', new Date().toLocaleDateString()],
      ['Generated Time', new Date().toLocaleTimeString()],
      ['Generated by', user?.fullName || 'System User'],
      ['User Role', user?.role || 'N/A'],
      ['Total Records', filteredData.length],
      ['Generated At', new Date().toISOString()]
    ]);
    
    XLSX.utils.book_append_sheet(workbook, metadataSheet, "Document Info");
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    
    // Log the Excel generation activity
    try {
      await api.post('/activity/log', {
        action: 'excel_document_generated',
        entityType: 'system',
        details: {
          documentType: title,
          recordCount: filteredData.length,
          generatedAt: new Date().toISOString(),
          fileName: `${title || 'financial-statement'}.xlsx`,
          page: page,
          pageTitle: pageTitle
        }
      });
    } catch (error) {
      console.error('Failed to log Excel generation activity:', error);
    }
    
    XLSX.writeFile(workbook, `${title || 'financial-statement'}.xlsx`);
    toast.success('Excel file exported successfully!');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Failed to export Excel file. Please try again.');
    }
  };
  
  

  const exportToPDF = async () => {
    try {
    // Get company information from system settings
    const companyName = settings?.companyName || 'Credit Jambo Ltd';
    const companySlogan = settings?.companySlogan || 'Transforming Finance, Empowering Growth';
    const primaryColor = hexToRgb(settings?.primaryColor || '#2563eb');
    const secondaryColor = hexToRgb(settings?.secondaryColor || '#64748b');
    const textColor = [31, 41, 55]; // Hardcoded dark gray, could be dynamic

    // Try to load company logo from system settings
    let logoImage = null;
    try {
      if (settings?.logo && settings.logo !== getUploadUrl('logo.png')) {
        logoImage = await loadImage(settings.logo);
      }
    } catch {
      console.log('Logo not found, using text logo');
    }
    
    console.log('Exporting to PDF for:', companyName, 'with colors:', { primaryColor, secondaryColor, textColor });

    // Use landscape orientation for better table fit
    const doc = new jsPDF('landscape', 'mm', 'a4');
    // Create shorter, more readable headers for PDF
    const headers = columns.map((column) => {
      const header = column.header;
      // Create shorter versions of headers for better PDF display
      const headerMap = {
        'CONTRACT REF NO': 'Contract No',
        'CUSTOMER NAME': 'Customer',
        'CUSTOMER': 'Customer',
        'DISBURSED AMOUNT (FRW)': 'Disbursed',
        'OUTSTANDING BALANCE (FRW)': 'Balance',
        'LOAN STATUS': 'Status',
        'STATUS': 'Status',
        'DISBURSEMENT DATE': 'Disb Date',
        'MATURITY DATE': 'Maturity',
        'APPLICATION DATE': 'App Date',
        'APPROVAL DATE': 'Approval',
        'REJECTION DATE': 'Rejected',
        'COMPLETION DATE': 'Completed',
        'LOAN TYPE': 'Type',
        'TYPE': 'Type',
        'DAYS TO MATURITY': 'Days',
        'OVERDUE DAYS': 'Overdue',
        'INTEREST EARNED SO FAR': 'Interest',
        'TOTAL INTEREST': 'Interest',
        'PENALTY AMOUNT': 'Penalty',
        'RESPONSIBLE OFFICER': 'Officer',
        'LOAN OFFICER': 'Officer',
        'OFFICER': 'Officer',
        'BRANCH CODE': 'Branch',
        'BRANCH': 'Branch',
        'CUSTOMER NO': 'Cust No',
        'AMOUNT': 'Amount',
        'LOAN AMOUNT': 'Amount',
        'APPROVED AMOUNT': 'Approved',
        'REQUESTED AMOUNT': 'Requested',
        'INTEREST RATE': 'Rate %',
        'TENOR IN DAYS': 'Tenor',
        'TENOR': 'Tenor',
        'COLLATERAL': 'Collateral',
        'COLLATERAL TYPE': 'Collateral',
        'GUARANTOR': 'Guarantor',
        'REPAYMENT SCHEDULE': 'Schedule',
        'NEXT PAYMENT DATE': 'Next Payment',
        'LAST PAYMENT DATE': 'Last Payment',
        'PAYMENT AMOUNT': 'Payment',
        'MARITAL STATUS': 'Marital',
        'GENDER': 'Gender',
        'AGE': 'Age',
        'OCCUPATION': 'Occupation',
        'MONTHLY INCOME': 'Income',
        'PHONE NUMBER': 'Phone',
        'EMAIL': 'Email',
        'ADDRESS': 'Address',
        'ACCOUNT CODE': 'Account',
        'ACCOUNT NAME': 'Account Name',
        'ACCOUNT TYPE': 'Type',
        'TOTAL DEBIT': 'Debit',
        'TOTAL CREDIT': 'Credit',
        'BALANCE': 'Balance',
        'CURRENT PERIOD': 'Current',
        'PREVIOUS PERIOD': 'Previous',
        'CHANGE': 'Change',
        'PERCENTAGE': '%'
      };
      
      return headerMap[header.toUpperCase()] || header;
    });
    
    const rows = filteredData.map((item) =>
      columns.map((column) => {
        let value;
        if (column.render) {
          // For loan data and other complex renders, extract the actual data values
          const key = column.key;
          
          // Handle loan-specific fields
          if (key === 'loanCode') {
            value = item.loanCode || 'N/A';
          } else if (key === 'customer') {
            value = item.customer?.personalInfo?.fullName || item.customer?.fullName || 'N/A';
          } else if (key === 'customerCode') {
            value = item.customer?.customerCode || 'N/A';
          } else if (key === 'customerName') {
            value = item.customer?.personalInfo?.fullName || item.customer?.fullName || 'N/A';
          } else if (key === 'amount') {
            const numValue = item.amount || 0;
            // Format currency more compactly for PDF
            if (numValue >= 1000000) {
              value = `${(numValue / 1000000).toFixed(1)}M`;
            } else if (numValue >= 1000) {
              value = `${(numValue / 1000).toFixed(0)}K`;
            } else {
              value = numValue.toLocaleString();
            }
          } else if (key === 'disbursedAmount') {
            const numValue = item.disbursedAmount || 0;
            // Format currency more compactly for PDF
            if (numValue >= 1000000) {
              value = `${(numValue / 1000000).toFixed(1)}M`;
            } else if (numValue >= 1000) {
              value = `${(numValue / 1000).toFixed(0)}K`;
            } else {
              value = numValue.toLocaleString();
            }
          } else if (key === 'outstandingBalance') {
            const numValue = item.outstandingBalance || 0;
            // Format currency more compactly for PDF
            if (numValue >= 1000000) {
              value = `${(numValue / 1000000).toFixed(1)}M`;
            } else if (numValue >= 1000) {
              value = `${(numValue / 1000).toFixed(0)}K`;
            } else {
              value = numValue.toLocaleString();
            }
          } else if (key === 'status') {
            value = item.status || 'N/A';
          } else if (key === 'loanType') {
            // Use product name if available, otherwise fallback to loanType
            if (item.product?.name) {
              value = item.product.name;
            } else if (item.loanType) {
              value = item.loanType;
            } else {
              value = 'N/A';
            }
          } else if (key === 'interestRate') {
            // Use product interest rate if available, otherwise fallback to loan interest rate
            const rate = item.product?.interestRate?.rate || item.interestRate || 0;
            value = `${rate.toFixed(1)}%`;
          } else if (key === 'durationMonths') {
            value = item.durationMonths || 0;
          } else if (key === 'branch') {
            value = item.branch?.name || item.branch?.alias || 'N/A';
          } else if (key === 'responsibleOfficer') {
            value = item.responsibleOfficer?.fullName || 'N/A';
          } else if (key === 'completedBy') {
            // Try multiple ways to get the completed by information
            if (item.completedBy?.fullName) {
              value = item.completedBy.fullName;
            } else if (item.completedBy?.username) {
              value = item.completedBy.username;
            } else if (item.approvedBy?.fullName) {
              value = item.approvedBy.fullName; // Sometimes completion is done by the same person who approved
            } else if (item.approvedBy?.username) {
              value = item.approvedBy.username;
            } else {
              value = 'N/A';
            }
          } else if (key === 'purpose') {
            value = item.purpose || 'N/A';
          } else if (key === 'collateralType') {
            value = item.collateralType || 'N/A';
          } else if (key === 'collateralValue') {
            value = item.collateral?.value || 0;
          } else if (key === 'collateralType') {
            value = item.collateral?.type || 'N/A';
          } else if (key === 'collateralDescription') {
            value = item.collateral?.description || 'N/A';
          } else if (key === 'totalPenalties') {
            value = item.totalPenalties || 0;
          } else if (key === 'totalPenaltiesPaid') {
            value = item.totalPenaltiesPaid || 0;
          } else if (key === 'penaltyRate') {
            value = item.penaltyRate || 0;
          } else if (key === 'classification') {
            value = item.classification?.status || 'normal';
          } else if (key === 'daysInArrears') {
            value = item.classification?.daysInArrears || 0;
          } else if (key === 'provisionAmount') {
            value = item.classification?.provisionAmount || 0;
          } else if (key === 'completionDate') {
            if (item.status === 'completed') {
              // Prioritize completionDate (set when status was changed to completed)
              if (item.completionDate) {
                value = new Date(item.completionDate).toLocaleDateString();
              } 
              // Fallback to updatedAt only if completionDate is not available
              else if (item.updatedAt) {
                value = new Date(item.updatedAt).toLocaleDateString() + " (estimated)";
              } else {
                value = 'N/A';
              }
            } else {
              value = 'N/A';
            }
          } else if (key === 'approvedBy') {
            value = item.approvedBy?.fullName || item.approvedBy?.username || 'N/A';
          } else if (key === 'createdBy') {
            value = item.createdBy?.fullName || item.createdBy?.username || 'N/A';
          } else if (key === 'rejectedBy') {
            value = item.rejectedBy?.fullName || item.rejectedBy?.username || 'N/A';
          } else if (key === 'rejectionReason') {
            value = item.rejectionReason || 'N/A';
          } else if (key === 'rejectionDate') {
            value = item.rejectionDate ? new Date(item.rejectionDate).toLocaleDateString() : 'N/A';
          } else if (key === 'disbursedBy') {
            value = item.disbursedBy?.fullName || item.disbursedBy?.username || 'N/A';
          } else if (key === 'endDate') {
            // Calculate maturity date from startDate and durationMonths
            if (item.startDate && item.durationMonths) {
              const startDate = new Date(item.startDate);
              const maturityDate = new Date(startDate);
              maturityDate.setMonth(maturityDate.getMonth() + item.durationMonths);
              value = maturityDate.toLocaleDateString();
            } else if (item.endDate) {
              value = new Date(item.endDate).toLocaleDateString();
            } else {
              value = 'N/A';
            }
          } else if (key === 'maturityDate') {
            // Calculate maturity date from startDate and durationMonths
            if (item.startDate && item.durationMonths) {
              const startDate = new Date(item.startDate);
              const maturityDate = new Date(startDate);
              maturityDate.setMonth(maturityDate.getMonth() + item.durationMonths);
              value = maturityDate.toLocaleDateString();
            } else if (item.endDate) {
              value = new Date(item.endDate).toLocaleDateString();
            } else {
              value = 'N/A';
            }
          } else if (key === 'overdueDays') {
            // Calculate overdue days
            if (item.startDate && item.durationMonths) {
              const startDate = new Date(item.startDate);
              const maturityDate = new Date(startDate);
              maturityDate.setMonth(maturityDate.getMonth() + item.durationMonths);
              const today = new Date();
              const daysOverdue = Math.ceil((today - maturityDate) / (1000 * 60 * 60 * 24));
              value = daysOverdue > 0 ? daysOverdue : 0;
            } else {
              value = 0;
            }
          } else if (key === 'outstandingAmount') {
            // Use outstanding balance or calculate from disbursed amount
            value = item.outstandingBalance || item.disbursedAmount || item.amount || 0;
          } else if (key === 'createdAt') {
            value = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A';
          } else if (key === 'approvalDate') {
            value = item.approvalDate ? new Date(item.approvalDate).toLocaleDateString() : 'N/A';
          } else if (key === 'disbursementDate') {
            value = item.disbursementDate ? new Date(item.disbursementDate).toLocaleDateString() : 'N/A';
          } else if (key === 'maturityDate') {
            // Calculate maturity date from startDate and durationMonths
            if (item.startDate && item.durationMonths) {
              const startDate = new Date(item.startDate);
              const maturityDate = new Date(startDate);
              maturityDate.setMonth(maturityDate.getMonth() + item.durationMonths);
              value = maturityDate.toLocaleDateString();
            } else if (item.endDate) {
              value = new Date(item.endDate).toLocaleDateString();
            } else {
              value = 'N/A';
            }
          } else if (key === 'interestEarned') {
            // Calculate interest earned
            if (item.approvalDate && item.amount && item.interestRate) {
              const approvalDate = new Date(item.approvalDate);
              const currentDate = new Date();
              const monthsElapsed = Math.max(0, (currentDate - approvalDate) / (1000 * 60 * 60 * 24 * 30));
              const interestEarned = item.amount * (item.interestRate / 100) * monthsElapsed;
              const numValue = interestEarned;
              // Format currency more compactly for PDF
              if (numValue >= 1000000) {
                value = `${(numValue / 1000000).toFixed(1)}M`;
              } else if (numValue >= 1000) {
                value = `${(numValue / 1000).toFixed(0)}K`;
              } else {
                value = numValue.toLocaleString();
              }
            } else {
              value = '0';
            }
          } else if (key === 'totalAmountDue') {
            // Calculate total amount due
            if (item.disbursedAmount && item.durationMonths) {
              // Use product data if available, otherwise fallback to loan data
              const product = item.product;
              
              let totalAmount;
              if (product && product.interestRate && product.fees) {
                // Use product-based calculations
                // Simple calculation for savings management
                const calculation = {
                  totalAmount: item.disbursedAmount || 0,
                  monthlyPayment: 0,
                  totalInterest: 0
                };
                totalAmount = calculation.totalAmount;
              } else {
                // Fallback to old calculation method
                const totalInterest = item.disbursedAmount * ((item.interestRate || 4.5) / 100) * item.durationMonths;
                const totalFees = item.disbursedAmount * 0.03; // 3% default
                totalAmount = item.disbursedAmount + totalInterest + totalFees;
              }
              const numValue = totalAmount;
              // Format currency more compactly for PDF
              if (numValue >= 1000000) {
                value = `${(numValue / 1000000).toFixed(1)}M`;
              } else if (numValue >= 1000) {
                value = `${(numValue / 1000).toFixed(0)}K`;
              } else {
                value = numValue.toLocaleString();
              }
            } else {
              value = '0';
            }
          } else if (key === 'daysToMaturity') {
            // Calculate days to maturity
            if (item.startDate && item.durationMonths) {
              const startDate = new Date(item.startDate);
              const maturityDate = new Date(startDate);
              maturityDate.setMonth(maturityDate.getMonth() + item.durationMonths);
              const today = new Date();
              const daysRemaining = Math.ceil((maturityDate - today) / (1000 * 60 * 60 * 24));
              value = daysRemaining.toString();
            } else {
              value = 'N/A';
            }
          } else if (key === 'accountCode' || key === 'accountName' || key === 'category') {
            value = item[key] || item.account || item.category || 'N/A';
          } else if (key === 'accountType') {
            value = (item[key] || 'asset').charAt(0).toUpperCase() + (item[key] || 'asset').slice(1);
          } else if (key === 'totalDebit' || key === 'totalCredit' || key === 'balance' || 
                     key === 'currentPeriod' || key === 'previousPeriod' || 
                     key === 'change') {
            const numValue = item[key] || 0;
            // Format currency more compactly for PDF
            if (numValue >= 1000000) {
              value = `${(numValue / 1000000).toFixed(1)}M`;
            } else if (numValue >= 1000) {
              value = `${(numValue / 1000).toFixed(0)}K`;
            } else {
              value = numValue.toLocaleString();
            }
          } else if (key === 'sessionId') {
            value = item.sessionId || 'N/A';
          } else if (key === 'user') {
            value = item.user?.fullName || 'N/A';
          } else if (key === 'email') {
            value = item.user?.email || 'N/A';
          } else if (key === 'role') {
            value = item.user?.role || 'N/A';
          } else if (key === 'branch') {
            value = item.branch?.name || item.user?.branch?.name || 'N/A';
          } else if (key === 'ipAddress') {
            value = item.loginInfo?.ipAddress || 'N/A';
          } else if (key === 'userAgent') {
            value = item.loginInfo?.userAgent || 'N/A';
          } else if (key === 'device') {
            value = item.loginInfo?.deviceInfo?.device || 'N/A';
          } else if (key === 'browser') {
            value = item.loginInfo?.deviceInfo?.browser || 'N/A';
          } else if (key === 'os') {
            value = item.loginInfo?.deviceInfo?.os || 'N/A';
          } else if (key === 'loginTime') {
            value = item.loginInfo?.timestamp ? new Date(item.loginInfo.timestamp).toLocaleString() : 'N/A';
          } else if (key === 'lastActivity') {
            value = item.lastActivity ? new Date(item.lastActivity).toLocaleString() : 'N/A';
          } else if (key === 'status') {
            value = item.status || 'N/A';
          } else if (key === 'security') {
            value = item.security?.riskLevel || 'low';
          } else if (key === 'actions') {
            value = 'View Details';
          } else if (key === 'auditId' || key === '_id') {
            value = item._id || item.id || 'N/A';
          } else if (key === 'auditUser' || key === 'user') {
            value = item.user?.fullName || item.user?.username || 'System';
          } else if (key === 'auditAction' || key === 'action') {
            value = item.action || 'N/A';
          } else if (key === 'entityType') {
            value = item.entityType || 'N/A';
          } else if (key === 'entityId') {
            value = item.entityId || 'N/A';
          } else if (key === 'auditDetails' || key === 'details') {
            // Handle details object - show summary or key info
            if (typeof item.details === 'object' && item.details !== null) {
              const detailKeys = Object.keys(item.details);
              if (detailKeys.length > 0) {
                value = `${detailKeys.length} field(s) changed`;
              } else {
                value = 'No details';
              }
            } else {
              value = item.details || 'N/A';
            }
          } else if (key === 'requestInfo') {
            // Handle request info object
            if (typeof item.requestInfo === 'object' && item.requestInfo !== null) {
              const method = item.requestInfo.method || '';
              const url = item.requestInfo.url || '';
              value = `${method} ${url}`.trim() || 'N/A';
            } else {
              value = item.requestInfo || 'N/A';
            }
          } else if (key === 'ipAddress') {
            value = item.requestInfo?.ipAddress || item.details?.ipAddress || 'N/A';
          } else if (key === 'userAgent') {
            value = item.requestInfo?.userAgent || item.details?.userAgent || 'N/A';
          } else if (key === 'changes') {
            // Handle changes object
            if (typeof item.changes === 'object' && item.changes !== null) {
              const fieldsChanged = item.changes.fieldsChanged || [];
              if (fieldsChanged.length > 0) {
                value = `${fieldsChanged.length} field(s): ${fieldsChanged.join(', ')}`;
              } else {
                value = 'No changes';
              }
            } else {
              value = item.changes || 'N/A';
            }
          } else if (key === 'riskLevel' || key === 'security') {
            value = item.security?.riskLevel || item.details?.riskLevel || 'low';
          } else if (key === 'suspiciousActivity') {
            value = item.security?.suspiciousActivity ? 'Yes' : 'No';
          } else if (key === 'flags') {
            const flags = item.security?.flags || [];
            value = flags.length > 0 ? flags.join(', ') : 'None';
          } else if (key === 'duration') {
            value = item.metadata?.duration ? `${item.metadata.duration}ms` : 'N/A';
          } else if (key === 'success') {
            value = item.metadata?.success !== false ? 'Yes' : 'No';
          } else if (key === 'errorMessage') {
            value = item.metadata?.errorMessage || 'N/A';
          } else if (key === 'timestamp' || key === 'createdAt') {
            value = item.timestamp ? new Date(item.timestamp).toLocaleString() : 'N/A';
          } else if (key === 'branch') {
            value = item.branch?.name || item.user?.branch?.name || 'N/A';
          } else if (key === 'sessionId') {
            value = item.sessionId || 'N/A';
          } else if (key === 'page' || key === 'pageTitle') {
            value = item.requestInfo?.page || item.requestInfo?.pageTitle || 'N/A';
          } else if (key === 'method') {
            value = item.requestInfo?.method || 'N/A';
          } else if (key === 'url') {
            value = item.requestInfo?.url || 'N/A';
          } else if (key === 'percentage') {
            value = `${(item[key] || 0).toFixed(1)}%`;
          } else if (key === 'createdAt') {
            // Format dates more compactly
            const date = new Date(item[key]);
            if (!isNaN(date.getTime())) {
              value = date.toLocaleDateString('en-GB', { 
                day: '2-digit', 
                month: '2-digit', 
                year: '2-digit' 
              });
        } else {
              value = item[key] || '';
            }
          } else if (key === 'customerName' || key === 'loanOfficer') {
            // Truncate long names if necessary
            const name = item[key] || '';
            value = name.length > 20 ? `${name.substring(0, 17)}...` : name;
          } else if (key === 'personalInfo.fullName') {
            // Handle customer full name specifically
            const fullName = item.personalInfo?.fullName || '';
            value = fullName.length > 20 ? `${fullName.substring(0, 17)}...` : fullName;
          } else if (key === 'contact.email') {
            // Handle customer email specifically
            value = item.contact?.email || '';
          } else if (key === 'employment.status') {
            // Handle employment status specifically
            value = item.employment?.status || '';
          } else if (key === 'branch.name') {
            // Handle branch name specifically
            value = item.branch?.name || '';
          } else if (key === 'createdBy.fullName') {
            // Handle created by name specifically
            value = item.createdBy?.fullName || '';
          } else {
            // Handle nested object paths for other fields
            if (key.includes('.')) {
              const keys = key.split('.');
              value = keys.reduce((obj, k) => obj?.[k], item) || '';
            } else {
              value = item[key] || '';
            }
          }
        } else {
          // Handle direct column access and prevent [object Object]
          let rawValue;
          
          // Handle nested object paths (e.g., "personalInfo.fullName", "contact.email")
          if (column.key.includes('.')) {
            const keys = column.key.split('.');
            rawValue = keys.reduce((obj, key) => obj?.[key], item);
          } else {
            rawValue = item[column.key];
          }
          
          // Special handling for customer and loan officer columns
          if ((column.key === 'customer' || column.key === 'customerName' || column.key === 'loanOfficer' || 
               column.key === 'responsibleOfficer' || column.key === 'officer') && 
               typeof rawValue === 'object' && rawValue !== null) {
            // Try multiple possible name fields for customers and officers
            if (rawValue.customerName) {
              value = rawValue.customerName;
            } else if (rawValue.name) {
              value = rawValue.name;
            } else if (rawValue.firstName && rawValue.lastName) {
              value = `${rawValue.firstName} ${rawValue.lastName}`;
            } else if (rawValue.firstName) {
              value = rawValue.firstName;
            } else if (rawValue.lastName) {
              value = rawValue.lastName;
            } else if (rawValue.fullName) {
              value = rawValue.fullName;
            } else if (rawValue.officerName) {
              value = rawValue.officerName;
            } else if (rawValue.username) {
              value = rawValue.username;
            } else if (rawValue.email) {
              value = rawValue.email;
            } else {
              // Show available properties for debugging
              const keys = Object.keys(rawValue);
              value = keys.length > 0 ? `[${keys.join(', ')}]` : 'N/A';
            }
          } else if (rawValue === null || rawValue === undefined) {
            value = '';
          } else if (typeof rawValue === 'object' && rawValue !== null) {
            // Handle object values - extract meaningful information
            if (rawValue.name) {
              value = rawValue.name;
            } else if (rawValue.firstName && rawValue.lastName) {
              value = `${rawValue.firstName} ${rawValue.lastName}`;
            } else if (rawValue.firstName) {
              value = rawValue.firstName;
            } else if (rawValue.lastName) {
              value = rawValue.lastName;
            } else if (rawValue.fullName) {
              value = rawValue.fullName;
            } else if (rawValue.customerName) {
              value = rawValue.customerName;
            } else if (rawValue.officerName) {
              value = rawValue.officerName;
            } else if (rawValue.branchName) {
              value = rawValue.branchName;
            } else if (rawValue.productName) {
              value = rawValue.productName;
            } else if (rawValue.loanType) {
              value = rawValue.loanType;
            } else if (rawValue.status) {
              value = rawValue.status;
            } else if (rawValue.code) {
              value = rawValue.code;
            } else if (rawValue.contractNo) {
              value = rawValue.contractNo;
            } else if (rawValue.id) {
              value = rawValue.id;
            } else if (rawValue.email) {
              value = rawValue.email;
            } else if (rawValue.phone) {
              value = rawValue.phone;
            } else if (rawValue.loanOfficer) {
              // Handle nested loan officer object
              if (typeof rawValue.loanOfficer === 'object') {
                value = rawValue.loanOfficer.name || rawValue.loanOfficer.firstName || 'Officer';
              } else {
                value = rawValue.loanOfficer;
              }
            } else if (rawValue.customer) {
              // Handle nested customer object
              if (typeof rawValue.customer === 'object') {
                value = rawValue.customer.name || rawValue.customer.firstName || 'Customer';
              } else {
                value = rawValue.customer;
              }
            } else if (Array.isArray(rawValue) && rawValue.length > 0) {
              // Handle arrays - take first item
              value = rawValue[0].name || rawValue[0].firstName || rawValue[0];
            } else {
              // More comprehensive object property search
              const allProps = Object.entries(rawValue);
              const stringProps = allProps.filter(([key, val]) => typeof val === 'string' && val.length > 0);
              
              if (stringProps.length > 0) {
                // Prioritize name-like properties
                const nameProps = stringProps.filter(([key]) => 
                  key.toLowerCase().includes('name') || 
                  key.toLowerCase().includes('first') || 
                  key.toLowerCase().includes('last')
                );
                
                if (nameProps.length > 0) {
                  value = nameProps[0][1];
                } else {
                  value = stringProps[0][1];
                }
              } else {
                // Last resort - show object keys for debugging
                const keys = Object.keys(rawValue);
                value = keys.length > 0 ? `[${keys.join(', ')}]` : 'N/A';
              }
            }
          } else {
            value = rawValue;
          }
        }
        
        // Ensure value is a string and handle null/undefined
        const stringValue = String(value || '').trim();
        
        // Additional formatting for specific fields
        if (column.key === 'maturityDate' && stringValue.includes('T')) {
          // Handle ISO date strings
          const date = new Date(stringValue);
          if (!isNaN(date.getTime())) {
            return date.toLocaleDateString('en-GB', { 
              day: '2-digit', 
              month: '2-digit', 
              year: '2-digit' 
            });
          }
        }
        
        return stringValue;
      })
    );

    // Set document properties
    doc.setProperties({
      title: `${title} - ${companyName}`,
      subject: 'Data Report',
      author: `${companyName} System`,
      creator: companyName
    });

    // Add company header (landscape: 297mm width x 210mm height)
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 297, 40, 'F');

    // Add logo or logo placeholder with white background
    if (logoImage) {
      // Add white background circle for logo
      doc.setFillColor(255, 255, 255);
      doc.circle(25, 20, 10, 'F');
      
      // Calculate logo dimensions to maintain aspect ratio
      const maxSize = 14; // Maximum size within the circle
      const logoWidth = logoImage.width;
      const logoHeight = logoImage.height;
      const aspectRatio = logoWidth / logoHeight;
      
      let finalWidth, finalHeight;
      if (aspectRatio > 1) {
        // Logo is wider than tall
        finalWidth = maxSize;
        finalHeight = maxSize / aspectRatio;
      } else {
        // Logo is taller than wide or square
        finalHeight = maxSize;
        finalWidth = maxSize * aspectRatio;
      }
      
      // Center the logo within the white circle
      const x = 25 - (finalWidth / 2);
      const y = 20 - (finalHeight / 2);
      
      // Add actual logo image with proper aspect ratio
      doc.addImage(logoImage, 'PNG', x, y, finalWidth, finalHeight);
    } else {
      // Add logo placeholder with white background
      doc.setFillColor(255, 255, 255);
      doc.circle(25, 20, 10, 'F');
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('AF', 25, 24, { align: 'center' });
    }

    // Company name and tagline
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(companyName, 45, 20);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(companySlogan, 45, 28);

    // Report title (centered for landscape)
    doc.setTextColor(...textColor);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 148, 60, { align: 'center' }); // 297/2 = 148.5

    // Report description
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128); // Gray
    doc.text(description, 148, 70, { align: 'center' });

    // Report metadata (adjusted for landscape)
    doc.setFontSize(10);
    doc.setTextColor(...textColor);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 85);
    doc.text(`Generated at: ${new Date().toLocaleTimeString()}`, 20, 90);
    doc.text(`Total Records: ${filteredData.length}`, 200, 85);
    doc.text(`Page 1 of 1`, 200, 90);

    // Add decorative line (landscape width)
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.line(20, 95, 277, 95); // 297 - 20 margin = 277

    // Calculate optimal column widths for A4 landscape
    const availableWidth = 257; // Total available width (297 - 40 margins)
    const numColumns = columns.length;
    const columnWidths = {};
    
    // More compact width allocation for A4 fit
    columns.forEach((col, index) => {
      let width;
      const header = col.header.toUpperCase();
      
      // Optimized widths for A4 landscape - loan management specific
      if (header.includes('CONTRACT') || header.includes('CUSTOMER NO') || header.includes('ACCOUNT CODE') ||
          header.includes('CUST NO')) {
        width = 20; // Contract numbers and codes
      } else if (header.includes('AMOUNT') || header.includes('BALANCE') || header.includes('DEBIT') || 
                 header.includes('CREDIT') || header.includes('CURRENT') || header.includes('PREVIOUS') || 
                 header.includes('CHANGE') || header.includes('INTEREST') || header.includes('PENALTY') ||
                 header.includes('DISBURSED') || header.includes('APPROVED') || header.includes('REQUESTED') ||
                 header.includes('PAYMENT') || header.includes('INCOME')) {
        width = 25; // Currency and financial columns
      } else if (header.includes('CUSTOMER NAME') || header.includes('CUSTOMER') || header.includes('ACCOUNT NAME') || 
                 header.includes('RESPONSIBLE OFFICER') || header.includes('LOAN OFFICER') || header.includes('OFFICER') ||
                 header.includes('GUARANTOR') || header.includes('OCCUPATION')) {
        width = 30; // Names - can be wider in landscape
      } else if (header.includes('BRANCH') || header.includes('STATUS') || header.includes('TYPE') || 
                 header.includes('LOAN TYPE') || header.includes('MARITAL') || header.includes('GENDER') ||
                 header.includes('COLLATERAL') || header.includes('SCHEDULE')) {
        width = 18; // Status/type fields
      } else if (header.includes('DATE') || header.includes('MATURITY') || header.includes('DISBURSEMENT') ||
                 header.includes('DISB DATE') || header.includes('APP DATE') || header.includes('APPROVAL') ||
                 header.includes('REJECTED') || header.includes('COMPLETED') || header.includes('NEXT PAYMENT') ||
                 header.includes('LAST PAYMENT')) {
        width = 18; // Date columns
      } else if (header.includes('DAYS') || header.includes('TENOR') || header.includes('AGE') ||
                 header.includes('OVERDUE')) {
        width = 15; // Numeric fields
      } else if (header.includes('RATE') || header.includes('PERCENTAGE')) {
        width = 16; // Percentage fields
      } else if (header.includes('PHONE') || header.includes('EMAIL') || header.includes('ADDRESS')) {
        width = 25; // Contact information
      } else {
        width = Math.max(15, availableWidth / numColumns); // Default with better minimum width
      }
      
      columnWidths[index] = { 
        cellWidth: width,
        halign: (header.includes('AMOUNT') || header.includes('BALANCE') || header.includes('DEBIT') || 
                 header.includes('CREDIT') || header.includes('CURRENT') || header.includes('PREVIOUS') || 
                 header.includes('CHANGE') || header.includes('PERCENTAGE') || header.includes('RATE') ||
                 header.includes('DAYS') || header.includes('INTEREST')) ? 'right' : 'left'
      };
    });

    doc.autoTable({
      head: [headers],
      body: rows,
      startY: 110,
      margin: { top: 10, right: 20, bottom: 20, left: 20 },
      tableWidth: 'auto',
      styles: {
        fontSize: 8, // Reduced font size for better fit
        cellPadding: 3,
        lineColor: [229, 231, 235], // Light gray borders
        lineWidth: 0.1,
        textColor: textColor,
        font: 'helvetica',
        overflow: 'linebreak', // Enable text wrapping
        cellWidth: 'wrap'
      },
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'center',
        cellPadding: 3
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251] // Very light gray for alternating rows
      },
      columnStyles: columnWidths,
      didDrawPage: function (data) {
        // Add footer on each page
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(107, 114, 128); // Hardcoded gray, could be dynamic
        doc.text(
          `${companyName} - ${title} - Page ${data.pageNumber} of ${pageCount}`,
          data.settings.margin.left,
          doc.internal.pageSize.height - 10
        );
      }
    });

    // Add summary section if there's data
    if (filteredData.length > 0) {
      const finalY = doc.lastAutoTable.finalY || 110;
      
      // Add summary box (landscape width)
      doc.setFillColor(249, 250, 251);
      doc.rect(20, finalY + 10, 257, 30, 'F');
      doc.setDrawColor(...primaryColor);
      doc.setLineWidth(0.5);
      doc.rect(20, finalY + 10, 257, 30, 'S');
      
      doc.setTextColor(...textColor);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary', 25, finalY + 20);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Records: ${filteredData.length}`, 25, finalY + 28);
      doc.text(`Report Type: ${title}`, 25, finalY + 33);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 100, finalY + 28);
      doc.text(`Time: ${new Date().toLocaleTimeString()}`, 100, finalY + 33);
      doc.text(`Generated by: ${user?.fullName || 'System User'}`, 200, finalY + 28);
      doc.text(`User Role: ${user?.role || 'N/A'}`, 200, finalY + 33);
    }

    // Log the PDF generation activity
    try {
      await api.post('/activity/log', {
        action: 'pdf_document_generated',
        entityType: 'system',
        details: {
          documentType: title,
          recordCount: filteredData.length,
          generatedAt: new Date().toISOString(),
          fileName: `${title.replace(/\s+/g, '-')}-${companyName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`
        }
      });
    } catch (error) {
      console.error('Failed to log PDF generation activity:', error);
    }

    doc.save(`${title.replace(/\s+/g, '-')}-${companyName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF file exported successfully!');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      toast.error('Failed to export PDF file. Please try again.');
    }
  };

  const printTable = () => {
    // Get company information from system settings
    const companyName = settings?.companyName || 'Credit Jambo Ltd';
    const companySlogan = settings?.companySlogan || 'Transforming Finance, Empowering Growth';
    const primaryColor = settings?.primaryColor || '#2563eb';
    
    // Create a print-friendly version
    const printWindow = window.open('', '_blank');
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title} - ${companyName}</title>
          <style>
            @media print {
              body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
              .header { background: ${primaryColor}; color: white; padding: 20px; margin-bottom: 20px; }
              .company-name { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
              .tagline { font-size: 14px; opacity: 0.9; }
              .report-title { text-align: center; font-size: 28px; font-weight: bold; margin: 20px 0; }
              .report-description { text-align: center; font-size: 16px; color: #666; margin-bottom: 20px; }
              .metadata { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 12px; color: #666; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
              th { background: ${primaryColor}; color: white; padding: 12px 8px; text-align: left; font-weight: bold; }
              td { padding: 8px; border-bottom: 1px solid #eee; }
              tr:nth-child(even) { background: #f9fafb; }
              .summary { background: #f9fafb; border: 1px solid ${primaryColor}; padding: 15px; margin-top: 20px; }
              .summary h3 { margin: 0 0 10px 0; color: ${primaryColor}; }
              .footer { text-align: center; font-size: 10px; color: #666; margin-top: 20px; }
              @page { margin: 1in; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">${companyName}</div>
            <div class="tagline">${companySlogan}</div>
          </div>
          
          <div class="report-title">${title}</div>
          <div class="report-description">${description}</div>
          
          <div class="metadata">
            <div>Generated on: ${new Date().toLocaleDateString()}</div>
            <div>Generated at: ${new Date().toLocaleTimeString()}</div>
            <div>Total Records: ${filteredData.length}</div>
          </div>
          
          <table>
            <thead>
              <tr>
                ${columns.map(col => `<th>${col.header}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${filteredData.map(item => `
                <tr>
                  ${columns.map(col => {
                    let value;
                    if (col.render) {
                      // For financial statements, extract the text content from the rendered component
                      const key = col.key;
                      if (key === 'accountCode' || key === 'accountName' || key === 'category') {
                        value = item[key] || item.account || item.category || 'N/A';
                      } else if (key === 'accountType') {
                        value = (item[key] || 'asset').charAt(0).toUpperCase() + (item[key] || 'asset').slice(1);
                      } else if (key === 'totalDebit' || key === 'totalCredit' || key === 'balance' || 
                                 key === 'amount' || key === 'currentPeriod' || key === 'previousPeriod' || 
                                 key === 'change') {
                        value = new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'RWF',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        }).format(item[key] || 0);
                      } else if (key === 'percentage') {
                        value = `${(item[key] || 0).toFixed(2)}%`;
                      } else {
                        value = item[key] || '';
                      }
                    } else {
                      // Handle nested object paths for print too
                      if (col.key.includes('.')) {
                        const keys = col.key.split('.');
                        value = keys.reduce((obj, key) => obj?.[key], item) || '';
                      } else {
                        value = item[col.key] || '';
                      }
                    }
                    return `<td>${value}</td>`;
                  }).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="summary">
            <h3>Summary</h3>
            <p><strong>Total Records:</strong> ${filteredData.length}</p>
            <p><strong>Report Type:</strong> ${title}</p>
            <p><strong>Generated:</strong> ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          </div>
          
          <div class="footer">
            ${companyName} - ${title} - Generated on ${new Date().toLocaleDateString()}
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  // Show no data loading view when preloading
  if (showNoDataInitially && preloadLoading) {
    if (import.meta.env.MODE === 'development') {
      console.log("🔄 DataView showing no data loading view for:", title);
    }
    return (
      <NoDataLoadingView 
        title={title}
        description={description}
        showSpinner={true}
        icon="📋"
      />
    );
  }

  // Show skeleton when loading (traditional loading)
  if (loading && !showNoDataInitially) {
    if (import.meta.env.MODE === 'development') {
      console.log("🔄 DataView showing skeleton for:", title);
    }
    return (
      <div className="p-4 md:p-6 lg:p-10 gap-6 flex flex-col w-full">
        <div className="flex flex-col md:flex-row w-full justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
          </div>
          {onAddNew && (
            <button
              onClick={onAddNew}
              className="text-white px-4 py-2 font-medium text-sm rounded transition"
              style={{
                backgroundColor: currentColors.primary,
                '--hover-bg-color': `${currentColors.primary}dd`
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = `${currentColors.primary}dd`;
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = currentColors.primary;
              }}
            >
              + Add New
            </button>
          )}
        </div>
        <TableSkeleton rows={8} columns={columns.length} />
      </div>
    );
  }

  // Show empty state when no data
  if (!loading && (!data || data.length === 0)) {
    return (
      <div className="p-4 md:p-6 lg:p-10 gap-6 flex flex-col w-full">
        <div className="flex flex-col md:flex-row w-full justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
          </div>
          {onAddNew && (
            <button
              onClick={onAddNew}
              className="text-white px-4 py-2 font-medium text-sm rounded transition"
              style={{
                backgroundColor: currentColors.primary,
                '--hover-bg-color': `${currentColors.primary}dd`
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = `${currentColors.primary}dd`;
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = currentColors.primary;
              }}
            >
              + Add New
            </button>
          )}
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm p-8 text-center">
          <div className="text-gray-400 dark:text-gray-500 text-4xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No Data Available</h3>
          <p className="text-gray-500 dark:text-gray-400">There are no items to display at the moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-10 gap-4 md:gap-6 flex flex-col w-full bg-transparent dark:bg-gray-900">
      <div className="flex flex-col md:flex-row w-full justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
        </div>
        {onAddNew && (
          <button
            onClick={onAddNew}
            className="text-white px-4 py-2 font-medium text-sm rounded transition w-full md:w-auto"
            style={{
              backgroundColor: currentColors.primary,
              '--hover-bg-color': `${currentColors.primary}dd`
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = `${currentColors.primary}dd`;
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = currentColors.primary;
            }}
          >
            + Add New
          </button>
        )}
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="text-white px-4 py-2 font-medium text-sm rounded transition w-full md:w-auto ml-2"
            style={{
              backgroundColor: currentColors.secondary,
              '--hover-bg-color': `${currentColors.secondary}dd`
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = `${currentColors.secondary}dd`;
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = currentColors.secondary;
            }}
            title="Refresh Data"
          >
            <FaSyncAlt size={14} className="inline mr-1" />
            Refresh
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm p-4 space-y-4 backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row gap-4 justify-between">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setToggleFilter(!toggleFilter)}
              className="p-2 rounded-md text-white hidden md:flex transition hover:opacity-80"
              style={{
                backgroundColor: currentColors.primary,
                '--hover-bg-color': `${currentColors.primary}dd`
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = `${currentColors.primary}dd`;
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = currentColors.primary;
              }}
            >
              {toggleFilter ? <FaTimes size={18} /> : <FaFilter size={18} />}
            </button>
            <div className="flex items-center gap-2 border border-gray-300 dark:border-gray-600 p-1 rounded-md flex-1 min-w-0 bg-white dark:bg-gray-700 shadow-sm">
              <FaSearch className="text-gray-400 dark:text-gray-500 flex-shrink-0" size={14} />
              <input
                type="text"
                placeholder="Search"
                className="outline-none text-sm flex-1 min-w-0 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2 md:gap-3 items-center flex-shrink-0">
            <FaFilePdf
              size={20}
              className="text-red-600 dark:text-red-400 cursor-pointer hover:text-red-900 dark:hover:text-red-300 transition-colors"
              onClick={exportToPDF}
            />
            <FaFileExcel
              size={20}
              className="text-green-500 dark:text-green-400 cursor-pointer hover:text-green-900 dark:hover:text-green-300 transition-colors"
              onClick={exportToExcel}
            />
            <FaPrint
              size={20}
              className="text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-900 dark:hover:text-gray-300 transition-colors"
              onClick={printTable}
            />
          </div>
        </div>

        {toggleFilter && (
          <div className="flex flex-wrap gap-4">
            {/* Sort Control */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort by:</label>
              <select
                className="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 outline-none transition-colors"
                value={`${sortConfig.key}-${sortConfig.direction}`}
                onChange={(e) => {
                  const [key, direction] = e.target.value.split('-');
                  setSortConfig({ key, direction });
                }}
              >
                <option value="createdAt-desc" className="bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300">Latest First</option>
                <option value="createdAt-asc" className="bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300">Oldest First</option>
                {columns.map((column) => (
                  <React.Fragment key={column.key}>
                    <option value={`${column.key}-desc`} className="bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                      {column.header} (Z-A)
                    </option>
                    <option value={`${column.key}-asc`} className="bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                      {column.header} (A-Z)
                    </option>
                  </React.Fragment>
                ))}
              </select>
            </div>
            
            {/* Filter Controls */}
            {filters && filters.map((filter) => (
              <select
                key={filter.key}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 outline-none transition-colors"
                onChange={(e) => handleFilterChange(filter.key, e.target.value)}
              >
                <option value="" className="bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300">{filter.placeholder}</option>
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value} className="bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    {option.label}
                  </option>
                ))}
              </select>
            ))}
          </div>
        )}

        <div className="overflow-x-auto rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <table className="min-w-full text-sm text-center">
            <thead className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                {columns.map((column) => (
                  <th 
                    key={column.key} 
                    className="p-3 font-semibold whitespace-nowrap text-gray-900 dark:text-white cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors select-none"
                    onClick={() => handleSortChange(column.key)}
                    title={`Sort by ${column.header}`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      {column.header}
                      {sortConfig.key === column.key && (
                        <span className="text-xs">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
                {renderActions && <th className="p-3 font-semibold whitespace-nowrap text-gray-900 dark:text-white">Actions</th>}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedData.map((item, index) => (
                <tr key={item._id || item.id || `row-${index}`} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  {columns.map((column, colIndex) => {
                    // Get the value for this column
                    let value;
                    if (column.key.includes('.')) {
                      // Handle nested object paths (e.g., "user.fullName")
                      const keys = column.key.split('.');
                      value = keys.reduce((obj, key) => obj?.[key], item);
                    } else {
                      value = item[column.key];
                    }
                    
                    // Safety check: ensure we don't render objects directly
                    const renderValue = () => {
                      if (column.render) {
                        try {
                          // For render functions, pass the full item object, not the extracted value
                          return column.render(item, item, index);
                        } catch (error) {
                          console.error('Error rendering column:', column.key, error);
                          return 'Error';
                        }
                      }
                      
                      // Default rendering with safety checks
                      if (value === null || value === undefined) return '-';
                      if (typeof value === 'object') {
                        try {
                          return JSON.stringify(value);
                        } catch {
                          return 'Object';
                        }
                      }
                      return String(value);
                    };
                    
                    return (
                      <td key={`${item._id || item.id || index}-${column.key}-${colIndex}`} className="p-3 text-gray-900 dark:text-gray-100">
                        {renderValue()}
                      </td>
                    );
                  })}
                  {renderActions && (
                    <td className="p-3 text-gray-900 dark:text-gray-100">
                      <div className="flex justify-center gap-2">
                        {renderActions(item)}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bulk Actions Bar removed - no longer needed without checkboxes */}

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex items-center gap-2">
            <span className="whitespace-nowrap text-gray-700 dark:text-gray-300">Show per page:</span>
            <select
              className="border border-gray-300 dark:border-gray-600 rounded p-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 outline-none transition-colors"
              value={pagination.pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            >
              {[10, 20, 30].map((size) => (
                <option key={size} value={size} className="bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300">{size}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 items-center">
            <span className="whitespace-nowrap text-gray-700 dark:text-gray-300">
              {filteredData.length > 0 ? 
                `${Math.max(0, startIndex) + 1}-${Math.min(endIndex || 0, filteredData.length)} of ${filteredData.length}` : 
                '0 of 0'
              }
            </span>
            <button
              className="px-3 py-1 rounded text-white disabled:opacity-50 transition hover:opacity-80 disabled:hover:opacity-50"
              style={{
                backgroundColor: currentColors.primary,
                '--hover-bg-color': `${currentColors.primary}dd`
              }}
              onMouseEnter={(e) => {
                if (!e.target.disabled) {
                  e.target.style.backgroundColor = `${currentColors.primary}dd`;
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = currentColors.primary;
              }}
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
            >
              Previous
            </button>
            <button
              className="px-3 py-1 rounded text-white disabled:opacity-50 transition hover:opacity-80 disabled:hover:opacity-50"
              style={{
                backgroundColor: currentColors.primary,
                '--hover-bg-color': `${currentColors.primary}dd`
              }}
              onMouseEnter={(e) => {
                if (!e.target.disabled) {
                  e.target.style.backgroundColor = `${currentColors.primary}dd`;
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = currentColors.primary;
              }}
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataView;
