// 📁 controllers/customerController.js
import Customer from "../models/customerModel.js";
import Branch from "../models/branchModel.js";
import fs from "fs";
import { logActivity } from "../utils/logActivity.js";
import { generateCustomId } from "../utils/generateCustomId.js";
import { uploadsDir } from '../config/uploadsConfig.js';
import cloudinaryService from "../services/cloudinaryService.js";
import path from 'path';
import { clearEntityCache, clearAllRelatedCache } from "../middleware/cache.js";
import { createCustomerNotification } from "../utils/notificationHelper.js";
import { formatApplicationError } from "../utils/errorFormatter.js";
import crypto from 'crypto';
import QueryOptimizer from "../utils/queryOptimizer.js";

// Helper function to check if all required fields are filled
const isProfileComplete = (customer) => {
  // Check required personal info
  const hasPersonalInfo = 
    customer.personalInfo?.fullName &&
    customer.personalInfo?.dob &&
    customer.personalInfo?.gender &&
    customer.personalInfo?.placeOfBirth &&
    customer.personalInfo?.nationality &&
    customer.personalInfo?.idNumber &&
    customer.personalInfo?.idFile;

  // Check required address
  const hasAddress = 
    customer.contact?.address?.province &&
    customer.contact?.address?.district &&
    customer.contact?.address?.sector &&
    customer.contact?.address?.cell &&
    customer.contact?.address?.village;

  // Check required contact
  const hasContact = 
    customer.contact?.phone &&
    customer.contact?.email;

  return hasPersonalInfo && hasAddress && hasContact;
};

// Reset customer password (admin only)
const resetCustomerPassword = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Not authorized" });
    }

    const { customerId } = req.params;
    
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    // Generate new random password
    const newPassword = crypto.randomBytes(8).toString('hex');
    
    // Update customer password
    customer.password = newPassword;
    await customer.save();

    // Log activity
    await logActivity({
      userId: req.user._id,
      action: "customer_password_reset",
      entityType: "customer",
      entityId: customer._id,
      details: {
        fullName: customer.personalInfo.fullName,
        customerCode: customer.customerCode,
        resetBy: req.user.fullName
      }
    });

    res.status(200).json({
      success: true,
      message: "Password reset successfully",
      credentials: {
        email: customer.contact.email,
        password: newPassword,
        customerCode: customer.customerCode
      }
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to reset password. Please try again." 
    });
  }
};

const addCustomer = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Not authorized" });

    const { personalInfo, contact, maritalStatus, employment, branchId } = req.body;
    const branch = await Branch.findById(branchId);
    if (!branch) return res.status(404).json({ success: false, message: "Branch not found" });

const customerCode = await generateCustomId("customer", branch.code, "CUST");

    // Map Cloudinary results to file fields. Prefer fieldName for accuracy; fall back to originalName heuristics
    const cloudinaryResults = req.cloudinaryResults || [];
    const byField = (field) => cloudinaryResults.find(r => r.fieldName === field)?.url;
    const byName = (substrs = []) => cloudinaryResults.find(r => substrs.some(s => r.originalName?.toLowerCase().includes(s)))?.url;
    const byNamesMany = (substrs = []) => cloudinaryResults
      .filter(r => substrs.some(s => r.originalName?.toLowerCase().includes(s)))
      .map(r => r.url);

    const fileMappings = {
      idFile: byField('idFile') || byName(['id', 'passport']),
      photo: byField('photo') || byName(['photo', 'image', 'pic']),
      spouseIdFile: byField('spouseIdFile') || byName(['spouse']),
      marriageCertFile: byField('marriageCertFile') || byName(['marriage']),
      singleCertFile: byField('singleCertFile') || byName(['single']),
      contractCertificate: byField('contractCertificate') || byName(['contract']),
      stampedPaySlips: (cloudinaryResults.some(r => r.fieldName === 'stampedPaySlips')
        ? cloudinaryResults.filter(r => r.fieldName === 'stampedPaySlips').map(r => r.url)
        : byNamesMany(['payslip', 'pay slip', 'salary slip'])),
      businessCertificate: byField('businessCertificate') || byName(['business']),
    };

    // Process additional files from Cloudinary uploads
    let additionalFiles = [];
    if (cloudinaryResults && Array.isArray(cloudinaryResults)) {
      additionalFiles = cloudinaryResults
        .filter(file => file.fieldName === 'additionalFiles')
        .map(file => ({
          name: file.originalName || 'Additional Document',
          description: 'Additional document uploaded',
          fileUrl: file.url,
          fileType: file.format || 'pdf',
          category: 'other',
          uploadedBy: req.user.id,
          isPublic: true
        }));
    }

    // Generate a random password for customer portal access
    const generatedPassword = crypto.randomBytes(8).toString('hex');
    
    const customerData = {
      customerCode,
      branch: branch._id,
      createdBy: req.user.id,
      personalInfo: {
        ...personalInfo,
        idFile: fileMappings.idFile,
        photo: fileMappings.photo,
      },
      contact: {
        ...contact,
        address: contact.address || {},
      },
      maritalStatus: {
        ...maritalStatus,
        spouseIdFile: fileMappings.spouseIdFile,
        marriageCertFile: fileMappings.marriageCertFile,
        singleCertFile: fileMappings.singleCertFile,
      },
      employment: {
        ...employment,
        contractCertificate: fileMappings.contractCertificate,
        stampedPaySlips: fileMappings.stampedPaySlips,
        businessCertificate: fileMappings.businessCertificate,
      },
      additionalFiles: additionalFiles,
      // Add customer portal credentials
      password: generatedPassword,
      accountCreationSource: 'staff',
      onboardingCompleted: true, // Admin-created customers have complete profiles
      isActive: true
    };

    const customer = await Customer.create(customerData);
    
    // Store the plain password temporarily to send in response (will be hashed by model)
    const customerResponse = customer.toObject();
    customerResponse.temporaryPassword = generatedPassword;

    await logActivity({
      userId: req.user._id,
      action: "customer_created",
      entityType: "customer",
      entityId: customer._id,
      details: {
        fullName: personalInfo.fullName,
        customerCode,
      },
    });

    // Create notification for new customer
    await createCustomerNotification('added', customer, req.user);

    // Clear customer cache to ensure fresh data is fetched
    clearEntityCache('customer');
    // Also clear any related cache that might be affected
    clearAllRelatedCache();

    res.status(201).json({ 
      success: true, 
      message: "Customer added successfully. Customer portal credentials have been generated.", 
      data: customerResponse,
      credentials: {
        email: contact.email,
        password: generatedPassword,
        customerCode: customerCode
      }
    });
  } catch (error) {
    console.error("Add Error:", error);
    const userFriendlyMessage = formatApplicationError(error, "create customer");
    res.status(400).json({ success: false, message: userFriendlyMessage });
  }
};

const listCustomers = async (req, res) => {
  try {
    // Build filter
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.branch) filter.branch = req.query.branch;

    // RBAC filtering for branch managers
    if (req.user?.role === 'branch-manager' && req.user?.branch) {
      const branchId = req.user.branch._id || req.user.branch;
      filter.branch = branchId;
    }

    // Fetch ALL customers - client wants complete data
    const customers = await Customer.find(filter)
      .populate("createdBy", "fullName email")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: customers });
  } catch (error) {
    console.error("❌ Customer listing error:", error);
    res.status(500).json({ success: false, message: "Error Fetching Customers" });
  }
};

const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id)
      .populate("createdBy", "fullName email");
    if (!customer) return res.status(404).json({ success: false, message: "Customer not found" });
    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateCustomer = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Not authorized" });

    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: "Customer not found" });


    // Map Cloudinary results to file fields
    const cloudinaryResults = req.cloudinaryResults || [];
    const byField = (field) => cloudinaryResults.find(r => r.fieldName === field)?.url;
    const byName = (substrs = []) => cloudinaryResults.find(r => substrs.some(s => r.originalName?.toLowerCase().includes(s)))?.url;
    const byNamesMany = (substrs = []) => cloudinaryResults
      .filter(r => substrs.some(s => r.originalName?.toLowerCase().includes(s)))
      .map(r => r.url);
    const byFieldMany = (field) => cloudinaryResults
      .filter(r => r.fieldName === field)
      .map(r => ({
        name: r.originalName || 'Additional Document',
        description: 'Additional document uploaded',
        fileUrl: r.url,
        fileType: r.format || 'pdf',
        category: 'other',
        uploadedBy: req.user.id,
        isPublic: true
      }));

    const fileMappings = {
      idFile: byField('idFile') || byName(['id', 'passport']) || customer.personalInfo.idFile,
      photo: byField('photo') || byName(['photo', 'picture', 'image']) || customer.personalInfo.photo,
      spouseIdFile: byField('spouseIdFile') || byName(['spouse', 'id']) || customer.maritalStatus.spouseIdFile,
      marriageCertFile: byField('marriageCertFile') || byName(['marriage', 'cert']) || customer.maritalStatus.marriageCertFile,
      singleCertFile: byField('singleCertFile') || byName(['single', 'cert']) || customer.maritalStatus.singleCertFile,
      contractCertificate: byField('contractCertificate') || byName(['contract', 'cert']) || customer.employment.contractCertificate,
      businessCertificate: byField('businessCertificate') || byName(['business', 'cert']) || customer.employment.businessCertificate,
      stampedPaySlips: byNamesMany(['payslip', 'salary', 'stamped']) || customer.employment.stampedPaySlips,
      additionalFiles: [...(customer.additionalFiles || []), ...byFieldMany('additionalFiles')],
    };

    const updatedData = {
      personalInfo: {
        ...customer.personalInfo,
        fullName: req.body["personalInfo.fullName"],
        dob: req.body["personalInfo.dob"],
        gender: req.body["personalInfo.gender"],
        placeOfBirth: req.body["personalInfo.placeOfBirth"],
        nationality: req.body["personalInfo.nationality"],
        idNumber: req.body["personalInfo.idNumber"],
        idFile: fileMappings.idFile,
        photo: fileMappings.photo,
      },
      contact: {
        phone: req.body.contactPhone,
        email: req.body.contactEmail,
        address: {
          province: req.body.contactAddressProvince,
          district: req.body.contactAddressDistrict,
          sector: req.body.contactAddressSector,
          cell: req.body.contactAddressCell,
          village: req.body.contactAddressVillage,
        },
      },
      maritalStatus: {
        status: req.body.maritalStatus?.status || customer.maritalStatus?.status,
        spouseIdFile: fileMappings.spouseIdFile,
        marriageCertFile: fileMappings.marriageCertFile,
        singleCertFile: fileMappings.singleCertFile,
      },
      employment: {
        ...customer.employment,
        ...req.body.employment,
        contractCertificate: fileMappings.contractCertificate,
        businessCertificate: fileMappings.businessCertificate,
        stampedPaySlips: fileMappings.stampedPaySlips,
      },
      additionalFiles: fileMappings.additionalFiles,
      updatedAt: new Date(),
    };

    const updated = await Customer.findByIdAndUpdate(req.params.id, updatedData, { new: true });

    // Auto-complete profile if all required fields are filled
    if (!updated.onboardingCompleted && isProfileComplete(updated)) {
      updated.onboardingCompleted = true;
      await updated.save();
      console.log(`✅ Auto-completed profile for customer: ${updated.customerCode}`);
    }
    
    // Log activity for customer update
    await logActivity({
      userId: req.user._id,
      action: "customer_updated",
      entityType: "customer",
      entityId: updated._id,
      details: {
        fullName: updated.personalInfo.fullName,
        customerCode: updated.customerCode,
      },
    });

    // Create notification for customer update
    await createCustomerNotification('updated', updated, req.user);
    
    // Clear customer cache to ensure fresh data is fetched
    clearEntityCache('customer');
    
    res.json({ success: true, message: "Customer updated", data: updated });
  } catch (error) {
    console.error("Update Error:", error);
    const userFriendlyMessage = formatApplicationError(error, "update customer");
    res.status(400).json({ success: false, message: userFriendlyMessage });
  }
};


const removeCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { forceDelete = false } = req.body; // Allow force deletion for admin users
    
    const customer = await Customer.findById(id);
    if (!customer) return res.status(404).json({ success: false, message: "Customer not found" });

    // Import FinancialCleanupService
    const FinancialCleanupService = (await import('../services/financialCleanupService.js')).default;

    // Validate deletion safety unless force delete is requested
    if (!forceDelete) {
      const validation = await FinancialCleanupService.validateDeletionSafety('customer', id);
      
      if (!validation.isSafe) {
        return res.status(400).json({
          success: false,
          message: "Deletion not safe due to financial dependencies",
          validation,
          requiresConfirmation: true
        });
      }
    }

    console.log(`🗑️ Starting deletion of customer: ${customer.customerCode}`);

    // 1. Clean up financial data first
    let financialCleanupSummary = null;
    try {
      financialCleanupSummary = await FinancialCleanupService.cleanupCustomerFinancialData(customer, req.user._id);
      console.log(`✅ Financial cleanup completed: ${financialCleanupSummary.deletedTransactions} transactions deleted`);
    } catch (error) {
      console.error(`❌ Financial cleanup failed for customer ${customer.customerCode}:`, error);
      // Continue with deletion but log the error
    }

    // 2. Delete uploaded files
    const files = [
      customer.personalInfo.idFile,
      customer.personalInfo.photo,
      customer.maritalStatus.spouseIdFile,
      customer.maritalStatus.marriageCertFile,
      ...customer.employment.stampedPaySlips,
      customer.employment.contractCertificate,
      customer.employment.businessCertificate,
    ].filter(Boolean);

    const deletedFiles = [];
    files.forEach((f) => {
      const filePath = path.join(uploadsDir, f);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        deletedFiles.push(f);
      }
    });

    // Delete additional files
    if (customer.additionalFiles && customer.additionalFiles.length > 0) {
      customer.additionalFiles.forEach((file) => {
        if (file.fileUrl) {
          // Note: Cloudinary files would need special handling
          console.log(`📁 Additional file to delete: ${file.fileUrl}`);
        }
      });
    }

    // 3. Delete the customer record (this will cascade delete loans via pre-hook)
    await Customer.findByIdAndDelete(id);

    // 4. Log comprehensive activity
    await logActivity({
      userId: req.user._id,
      action: "customer_deleted",
      entityType: "customer",
      entityId: customer._id,
      details: {
        fullName: customer.personalInfo.fullName,
        customerCode: customer.customerCode,
        deletedFiles,
        financialCleanup: financialCleanupSummary ? {
          deletedTransactions: financialCleanupSummary.deletedTransactions,
          deletedTaxRecords: financialCleanupSummary.deletedTaxRecords,
          totalAmount: financialCleanupSummary.totalAmount,
          errors: financialCleanupSummary.errors
        } : null,
        forceDelete
      },
    });

    // 5. Create notification for customer deletion
    await createCustomerNotification('deleted', customer, req.user);

    // 6. Clear customer cache to ensure fresh data is fetched
    clearEntityCache('customer');

    const responseMessage = financialCleanupSummary 
      ? `Customer deleted successfully. ${financialCleanupSummary.deletedTransactions} financial transactions and ${financialCleanupSummary.deletedTaxRecords} tax records were also removed.`
      : "Customer deleted successfully.";

    res.json({ 
      success: true, 
      message: responseMessage,
      financialCleanup: financialCleanupSummary
    });
  } catch (error) {
    console.error("Error deleting customer:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCustomerDeletionPreview = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Import FinancialCleanupService
    const FinancialCleanupService = (await import('../services/financialCleanupService.js')).default;
    
    // Get deletion preview
    const preview = await FinancialCleanupService.getCleanupPreview('customer', id);
    
    // Validate deletion safety
    const validation = await FinancialCleanupService.validateDeletionSafety('customer', id);
    
    res.json({
      success: true,
      preview,
      validation
    });
  } catch (error) {
    console.error("Error getting customer deletion preview:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add additional files to customer
const addAdditionalFiles = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { name, description, category, isPublic } = req.body;

    if (!customerId || !name) {
      return res.status(400).json({
        success: false,
        message: "Customer ID and file name are required"
      });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    // Process uploaded files
    let newFiles = [];
    if (req.cloudinaryResults && Array.isArray(req.cloudinaryResults)) {
      newFiles = req.cloudinaryResults
        .filter(file => file.fieldName && file.fieldName.startsWith('additionalFile'))
        .map(file => ({
          name: name || file.originalName || 'Additional Document',
          description: description || 'Additional document uploaded',
          fileUrl: file.url,
          fileType: file.format || 'pdf',
          category: category || 'other',
          uploadedBy: req.user.id,
          isPublic: isPublic !== 'false'
        }));
    }

    if (newFiles.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files were uploaded"
      });
    }

    // Add new files to the customer
    customer.additionalFiles.push(...newFiles);
    await customer.save();

    // Log activity
    await logActivity({
      userId: req.user._id,
      action: "additional_files_added",
      entityType: "customer",
      entityId: customer._id,
      details: { 
        customerCode: customer.customerCode,
        filesAdded: newFiles.length 
      }
    });

    // Clear cache
    clearEntityCache('customer');

    res.status(200).json({
      success: true,
      message: `${newFiles.length} file(s) added successfully`,
      data: newFiles
    });
  } catch (error) {
    console.error("Add Additional Files Error:", error);
    res.status(500).json({
      success: false,
      message: "Error adding additional files"
    });
  }
};

// Remove additional file from customer
const removeAdditionalFile = async (req, res) => {
  try {
    const { customerId, fileId } = req.params;

    if (!customerId || !fileId) {
      return res.status(400).json({
        success: false,
        message: "Customer ID and file ID are required"
      });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    // Find and remove the file
    const fileIndex = customer.additionalFiles.findIndex(
      file => file._id.toString() === fileId
    );

    if (fileIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "File not found"
      });
    }

    const removedFile = customer.additionalFiles[fileIndex];
    customer.additionalFiles.splice(fileIndex, 1);
    await customer.save();

    // Log activity
    await logActivity({
      userId: req.user._id,
      action: "additional_file_removed",
      entityType: "customer",
      entityId: customer._id,
      details: { 
        customerCode: customer.customerCode,
        fileName: removedFile.name 
      }
    });

    // Clear cache
    clearEntityCache('customer');

    res.status(200).json({
      success: true,
      message: "File removed successfully",
      data: removedFile
    });
  } catch (error) {
    console.error("Remove Additional File Error:", error);
    res.status(500).json({
      success: false,
      message: "Error removing file"
    });
  }
};

export {
  addCustomer,
  listCustomers,
  getCustomerById,
  updateCustomer,
  removeCustomer,
  getCustomerDeletionPreview,
  addAdditionalFiles,
  removeAdditionalFile,
  resetCustomerPassword,
};
