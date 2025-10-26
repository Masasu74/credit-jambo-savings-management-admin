// Transaction Data Transfer Objects for API responses

export const transactionSummaryDTO = (transaction) => {
  return {
    id: transaction._id,
    transactionId: transaction.transactionId,
    type: transaction.type,
    amount: transaction.amount,
    balanceAfter: transaction.balanceAfter,
    description: transaction.description,
    status: transaction.status,
    createdAt: transaction.createdAt
  };
};

export const transactionDetailsDTO = (transaction) => {
  return {
    id: transaction._id,
    transactionId: transaction.transactionId,
    type: transaction.type,
    amount: transaction.amount,
    balanceBefore: transaction.balanceBefore,
    balanceAfter: transaction.balanceAfter,
    description: transaction.description,
    reference: transaction.reference,
    status: transaction.status,
    processedBy: transaction.processedBy,
    createdAt: transaction.createdAt,
    updatedAt: transaction.updatedAt
  };
};

export const transactionWithAccountDTO = (transaction, account) => {
  return {
    id: transaction._id,
    transactionId: transaction.transactionId,
    type: transaction.type,
    amount: transaction.amount,
    balanceAfter: transaction.balanceAfter,
    description: transaction.description,
    status: transaction.status,
    account: {
      id: account._id,
      accountNumber: account.accountNumber,
      accountType: account.accountType
    },
    createdAt: transaction.createdAt
  };
};

export const transactionListDTO = (transactions, pagination) => {
  return {
    transactions: transactions.map(transactionSummaryDTO),
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      pages: pagination.pages
    }
  };
};

export const transactionStatsDTO = (stats) => {
  return {
    totalTransactions: stats.totalTransactions,
    totalAmount: stats.totalAmount,
    summary: stats.summary,
    period: stats.period
  };
};

export const dailyTransactionReportDTO = (report) => {
  return {
    date: report.date,
    transactions: report.transactions.map(transactionSummaryDTO),
    summary: report.summary,
    totalTransactions: report.totalTransactions
  };
};

// DTO for transaction history with account info
export const transactionHistoryDTO = (history) => {
  return {
    transactions: history.transactions.map(transactionSummaryDTO),
    pagination: history.pagination
  };
};
