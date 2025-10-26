// Customer Data Transfer Objects for API responses
// These DTOs control what data is exposed to the frontend

export const customerSummaryDTO = (customer) => {
  return {
    id: customer._id,
    customerCode: customer.customerCode,
    fullName: customer.personalInfo.fullName,
    email: customer.contact.email,
    phone: customer.contact.phone,
    isActive: customer.isActive,
    deviceVerified: customer.deviceVerified,
    onboardingCompleted: customer.onboardingCompleted,
    lastLogin: customer.lastLogin,
    createdAt: customer.createdAt
  };
};

export const customerDetailsDTO = (customer) => {
  return {
    id: customer._id,
    customerCode: customer.customerCode,
    personalInfo: {
      fullName: customer.personalInfo.fullName,
      dob: customer.personalInfo.dob,
      gender: customer.personalInfo.gender,
      nationality: customer.personalInfo.nationality,
      idNumber: customer.personalInfo.idNumber
    },
    contact: {
      phone: customer.contact.phone,
      email: customer.contact.email,
      address: customer.contact.address
    },
    maritalStatus: customer.maritalStatus,
    employment: customer.employment,
    isActive: customer.isActive,
    deviceVerified: customer.deviceVerified,
    onboardingCompleted: customer.onboardingCompleted,
    lastLogin: customer.lastLogin,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt
  };
};

export const customerRegistrationDTO = (customer) => {
  return {
    id: customer._id,
    customerCode: customer.customerCode,
    fullName: customer.personalInfo.fullName,
    email: customer.contact.email,
    phone: customer.contact.phone,
    onboardingCompleted: customer.onboardingCompleted,
    deviceVerified: customer.deviceVerified,
    message: 'Registration successful. Please wait for device verification.'
  };
};

export const customerLoginDTO = (customer, token) => {
  return {
    id: customer._id,
    customerCode: customer.customerCode,
    fullName: customer.personalInfo.fullName,
    email: customer.contact.email,
    phone: customer.contact.phone,
    isActive: customer.isActive,
    deviceVerified: customer.deviceVerified,
    onboardingCompleted: customer.onboardingCompleted,
    token,
    message: 'Login successful'
  };
};

// DTO for customer list with pagination
export const customerListDTO = (customers, pagination) => {
  return {
    customers: customers.map(customerSummaryDTO),
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      pages: pagination.pages
    }
  };
};

// DTO for customer statistics
export const customerStatsDTO = (stats) => {
  return {
    totalCustomers: stats.total,
    activeCustomers: stats.active,
    verifiedCustomers: stats.verified,
    pendingVerification: stats.pendingVerification,
    newThisMonth: stats.newThisMonth
  };
};
