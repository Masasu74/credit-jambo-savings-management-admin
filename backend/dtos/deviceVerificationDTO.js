// Device Verification Data Transfer Objects for API responses

export const deviceVerificationSummaryDTO = (verification) => {
  return {
    id: verification._id,
    deviceId: verification.deviceId,
    status: verification.status,
    deviceInfo: {
      platform: verification.deviceInfo.platform,
      browser: verification.deviceInfo.browser,
      os: verification.deviceInfo.os
    },
    ipAddress: verification.ipAddress,
    verifiedAt: verification.verifiedAt,
    lastLoginAt: verification.lastLoginAt,
    loginCount: verification.loginCount,
    isActive: verification.isActive,
    // When the query populates customerId, include a concise customer summary
    // This enables frontend lists to show names without an extra request
    ...(verification.customerId || verification.customer
      ? {
          customer: {
            id: (verification.customerId && verification.customerId._id) ||
                (verification.customer && verification.customer.id) ||
                (verification.customer && verification.customer._id),
            customerCode:
              (verification.customerId && verification.customerId.customerCode) ||
              (verification.customer && verification.customer.customerCode),
            fullName:
              (verification.customerId &&
                (verification.customerId.personalInfo && verification.customerId.personalInfo.fullName)) ||
              (verification.customer && (verification.customer.fullName || (verification.customer.personalInfo && verification.customer.personalInfo.fullName))),
            email:
              (verification.customerId &&
                (verification.customerId.contact && verification.customerId.contact.email)) ||
              (verification.customer && (verification.customer.email || (verification.customer.contact && verification.customer.contact.email))),
            phone:
              (verification.customerId &&
                (verification.customerId.contact && verification.customerId.contact.phone)) ||
              (verification.customer && (verification.customer.phone || (verification.customer.contact && verification.customer.contact.phone)))
          }
        }
      : {}),
    createdAt: verification.createdAt
  };
};

export const deviceVerificationDetailsDTO = (verification) => {
  return {
    id: verification._id,
    deviceId: verification.deviceId,
    deviceInfo: verification.deviceInfo,
    ipAddress: verification.ipAddress,
    location: verification.location,
    status: verification.status,
    verificationCode: verification.verificationCode,
    verificationExpiry: verification.verificationExpiry,
    verifiedAt: verification.verifiedAt,
    verifiedBy: verification.verifiedBy,
    rejectionReason: verification.rejectionReason,
    lastLoginAt: verification.lastLoginAt,
    loginCount: verification.loginCount,
    isActive: verification.isActive,
    createdAt: verification.createdAt,
    updatedAt: verification.updatedAt
  };
};

export const deviceVerificationWithCustomerDTO = (verification, customer) => {
  return {
    id: verification._id,
    deviceId: verification.deviceId,
    status: verification.status,
    deviceInfo: {
      platform: verification.deviceInfo.platform,
      browser: verification.deviceInfo.browser,
      os: verification.deviceInfo.os,
      userAgent: verification.deviceInfo.userAgent
    },
    ipAddress: verification.ipAddress,
    location: verification.location,
    customer: {
      id: customer._id,
      customerCode: customer.customerCode,
      fullName: customer.personalInfo.fullName,
      email: customer.contact.email,
      phone: customer.contact.phone
    },
    verifiedAt: verification.verifiedAt,
    lastLoginAt: verification.lastLoginAt,
    loginCount: verification.loginCount,
    isActive: verification.isActive,
    createdAt: verification.createdAt
  };
};

export const deviceVerificationListDTO = (verifications, pagination) => {
  return {
    verifications: verifications.map(deviceVerificationSummaryDTO),
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      pages: pagination.pages
    }
  };
};

export const deviceVerificationStatsDTO = (stats) => {
  return {
    total: stats.total,
    pending: stats.pending,
    verified: stats.verified,
    rejected: stats.rejected,
    suspended: stats.suspended
  };
};

export const customerDevicesDTO = (devices) => {
  return devices.map(deviceVerificationSummaryDTO);
};

// DTO for pending verifications (admin interface)
export const pendingVerificationDTO = (verification) => {
  return {
    id: verification._id,
    deviceId: verification.deviceId,
    deviceInfo: {
      platform: verification.deviceInfo.platform,
      browser: verification.deviceInfo.browser,
      os: verification.deviceInfo.os,
      userAgent: verification.deviceInfo.userAgent
    },
    ipAddress: verification.ipAddress,
    location: verification.location,
    customer: {
      id: verification.customerId._id,
      customerCode: verification.customerId.customerCode,
      fullName: verification.customerId.personalInfo.fullName,
      email: verification.customerId.contact.email,
      phone: verification.customerId.contact.phone
    },
    verificationCode: verification.verificationCode,
    verificationExpiry: verification.verificationExpiry,
    createdAt: verification.createdAt
  };
};
