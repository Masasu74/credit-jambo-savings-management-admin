// Savings Account Data Transfer Objects for API responses

export const savingsAccountSummaryDTO = (account) => {
  return {
    id: account._id,
    accountNumber: account.accountNumber,
    accountType: account.accountType,
    balance: account.balance,
    status: account.status,
    isVerified: account.isVerified,
    lastTransactionDate: account.lastTransactionDate,
    createdAt: account.createdAt
  };
};

export const savingsAccountDetailsDTO = (account) => {
  return {
    id: account._id,
    accountNumber: account.accountNumber,
    accountType: account.accountType,
    balance: account.balance,
    minimumBalance: account.minimumBalance,
    interestRate: account.interestRate,
    status: account.status,
    isVerified: account.isVerified,
    lastTransactionDate: account.lastTransactionDate,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt
  };
};

export const savingsAccountWithCustomerDTO = (account, customer) => {
  return {
    id: account._id,
    accountNumber: account.accountNumber,
    accountType: account.accountType,
    balance: account.balance,
    status: account.status,
    isVerified: account.isVerified,
    customer: {
      id: customer._id,
      customerCode: customer.customerCode,
      fullName: customer.personalInfo.fullName,
      email: customer.contact.email,
      phone: customer.contact.phone
    },
    lastTransactionDate: account.lastTransactionDate,
    createdAt: account.createdAt
  };
};

export const savingsAccountListDTO = (accounts, pagination) => {
  return {
    accounts: accounts.map(savingsAccountSummaryDTO),
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      pages: pagination.pages
    }
  };
};

export const savingsAccountStatsDTO = (stats) => {
  return {
    totalAccounts: stats.total,
    activeAccounts: stats.active,
    totalBalance: stats.totalBalance,
    averageBalance: stats.averageBalance,
    lowBalanceAccounts: stats.lowBalanceAccounts,
    verifiedAccounts: stats.verified
  };
};

export const accountSummaryDTO = (summary) => {
  return {
    accounts: summary.accounts.map(savingsAccountSummaryDTO),
    totalBalance: summary.totalBalance,
    accountCount: summary.accountCount
  };
};
