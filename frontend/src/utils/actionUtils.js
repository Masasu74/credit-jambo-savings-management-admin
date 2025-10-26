// Utility functions for handling actions with automatic refresh

/**
 * Creates an enhanced action handler that automatically refreshes data after successful actions
 * @param {Function} actionFunction - The original action function
 * @param {Function} refreshFunction - The function to call for refreshing data
 * @param {Function} onComplete - Optional callback after action completion
 * @returns {Function} Enhanced action function
 */
export const createActionWithRefresh = (actionFunction, refreshFunction, onComplete = null) => {
  return async (...args) => {
    try {
      // Execute the original action
      await actionFunction(...args);
      
      // Automatically refresh data after successful action
      if (refreshFunction) {
        console.log('🔄 Auto-refreshing after action completion');
        await refreshFunction();
      }
      
      // Call the completion callback if provided
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Action failed:', error);
      throw error; // Re-throw to let the calling component handle the error
    }
  };
};

/**
 * Creates enhanced action handlers for common loan operations
 * @param {Object} context - The context object containing action functions and refresh function
 * @returns {Object} Object containing enhanced action handlers
 */
export const createLoanActionHandlers = (context) => {
  const {
    updateLoanStatus,
    deleteLoan,
    fetchLoans,
    onActionComplete = null
  } = context;

  return {
    // Enhanced loan status update with auto-refresh
    handleLoanStatusUpdate: createActionWithRefresh(
      updateLoanStatus,
      fetchLoans,
      onActionComplete
    ),
    
    // Enhanced loan deletion with auto-refresh
    handleLoanDelete: createActionWithRefresh(
      deleteLoan,
      fetchLoans,
      onActionComplete
    ),
    
    // Enhanced loan approval with auto-refresh
    handleLoanApprove: createActionWithRefresh(
      (loanId, payload) => updateLoanStatus(loanId, { ...payload, action: 'approved' }),
      fetchLoans,
      onActionComplete
    ),
    
    // Enhanced loan rejection with auto-refresh
    handleLoanReject: createActionWithRefresh(
      (loanId, payload) => updateLoanStatus(loanId, { ...payload, action: 'rejected' }),
      fetchLoans,
      onActionComplete
    ),
    
    // Enhanced loan disbursement with auto-refresh
    handleLoanDisburse: createActionWithRefresh(
      (loanId, payload) => updateLoanStatus(loanId, { ...payload, action: 'disbursed' }),
      fetchLoans,
      onActionComplete
    ),
    
    // Enhanced loan completion with auto-refresh
    handleLoanComplete: createActionWithRefresh(
      (loanId, payload) => updateLoanStatus(loanId, { ...payload, action: 'completed' }),
      fetchLoans,
      onActionComplete
    )
  };
};

/**
 * Creates enhanced action handlers for customer operations
 * @param {Object} context - The context object containing action functions and refresh function
 * @returns {Object} Object containing enhanced action handlers
 */
export const createCustomerActionHandlers = (context) => {
  const {
    updateCustomer,
    deleteCustomer,
    fetchCustomers,
    onActionComplete = null
  } = context;

  return {
    // Enhanced customer update with auto-refresh
    handleCustomerUpdate: createActionWithRefresh(
      updateCustomer,
      fetchCustomers,
      onActionComplete
    ),
    
    // Enhanced customer deletion with auto-refresh
    handleCustomerDelete: createActionWithRefresh(
      deleteCustomer,
      fetchCustomers,
      onActionComplete
    )
  };
};

/**
 * Hook for creating action handlers with automatic refresh
 * @param {Object} context - The context object containing action functions and refresh function
 * @returns {Object} Object containing enhanced action handlers
 */
export const useActionHandlers = (context) => {
  const { entityType } = context;
  
  switch (entityType) {
    case 'loan':
      return createLoanActionHandlers(context);
    case 'customer':
      return createCustomerActionHandlers(context);
    default:
      // Generic action handlers
      return {
        handleAction: createActionWithRefresh(
          context.actionFunction,
          context.refreshFunction,
          context.onActionComplete
        )
      };
  }
};

