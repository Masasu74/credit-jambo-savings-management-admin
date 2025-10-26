/**
 * Query Optimizer Utility
 * Provides utilities for optimizing database queries with pagination, field projection, and caching
 */

export class QueryOptimizer {
  /**
   * Paginate query results
   * @param {Model} model - Mongoose model
   * @param {Object} query - Query filter
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>} Paginated results
   */
  static async paginate(model, query = {}, options = {}) {
    const {
      page = 1,
      limit = 50,
      sort = { createdAt: -1 },
      populate = '',
      select = '',
      lean = false
    } = options;

    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page));
    const pageSize = Math.min(1000, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * pageSize;

    try {
      // Execute count and data queries in parallel for better performance
      const [total, data] = await Promise.all([
        model.countDocuments(query),
        model
          .find(query)
          .select(select)
          .populate(populate)
          .sort(sort)
          .skip(skip)
          .limit(pageSize)
          .lean(lean)
      ]);

      const totalPages = Math.ceil(total / pageSize);

      return {
        data,
        pagination: {
          total,
          page: pageNum,
          pageSize,
          totalPages,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        }
      };
    } catch (error) {
      console.error('Pagination error:', error);
      throw error;
    }
  }

  /**
   * Optimize query by selecting only required fields
   * @param {Object} model - Mongoose model
   * @param {Object} query - Query filter
   * @param {Array|String} fields - Fields to select
   * @param {Object} options - Additional options
   * @returns {Promise<Array>} Query results
   */
  static async selectFields(model, query = {}, fields = [], options = {}) {
    try {
      const { sort = { createdAt: -1 }, limit: maxResults = 100 } = options;
      
      return await model
        .find(query)
        .select(fields.join(' '))
        .sort(sort)
        .limit(maxResults)
        .lean(true); // Use lean for better performance
    } catch (error) {
      console.error('Field selection error:', error);
      throw error;
    }
  }

  /**
   * Get aggregated statistics
   * @param {Model} model - Mongoose model
   * @param {Array} pipeline - Aggregation pipeline
   * @returns {Promise<Array>} Aggregated results
   */
  static async aggregate(model, pipeline = []) {
    try {
      return await model.aggregate(pipeline);
    } catch (error) {
      console.error('Aggregation error:', error);
      throw error;
    }
  }

  /**
   * Execute query with timeout
   * @param {Promise} queryPromise - Query promise
   * @param {Number} timeoutMs - Timeout in milliseconds
   * @returns {Promise} Query result or timeout error
   */
  static async withTimeout(queryPromise, timeoutMs = 5000) {
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Query timeout')), timeoutMs)
    );
    return Promise.race([queryPromise, timeout]);
  }

  /**
   * Batch process large result sets
   * @param {Function} queryFn - Function that returns a query cursor
   * @param {Function} processorFn - Function to process each batch
   * @param {Number} batchSize - Size of each batch
   * @returns {Promise<void>}
   */
  static async batchProcess(queryFn, processorFn, batchSize = 100) {
    const cursor = await queryFn();
    let batch = [];
    
    for await (const doc of cursor) {
      batch.push(doc);
      
      if (batch.length >= batchSize) {
        await processorFn(batch);
        batch = [];
      }
    }
    
    // Process remaining documents
    if (batch.length > 0) {
      await processorFn(batch);
    }
  }

  /**
   * Create index hint for query optimization
   * @param {String} indexName - Name of the index to hint
   * @returns {Object} Query hint
   */
  static hint(indexName) {
    return { hint: indexName };
  }

  /**
   * Build efficient date range query
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {String} fieldName - Date field name (default: 'createdAt')
   * @returns {Object} Date range query
   */
  static dateRange(startDate, endDate, fieldName = 'createdAt') {
    const query = {};
    
    if (startDate) {
      query[fieldName] = { $gte: new Date(startDate) };
    }
    
    if (endDate) {
      query[fieldName] = {
        ...query[fieldName],
        $lte: new Date(endDate)
      };
    }
    
    return query;
  }

  /**
   * Create text search query
   * @param {String} searchTerm - Search term
   * @param {Array} fields - Fields to search in
   * @returns {Object} Text search query
   */
  static textSearch(searchTerm, fields = []) {
    if (!searchTerm) return {};
    
    // If specific fields provided, use $or with regex
    if (fields.length > 0) {
      return {
        $or: fields.map(field => ({
          [field]: { $regex: searchTerm, $options: 'i' }
        }))
      };
    }
    
    // Default to text index search if available
    return { $text: { $search: searchTerm } };
  }

  /**
   * Project only essential fields for common queries
   */
  static FIELDS = {
    LOAN_LIST: '_id loanId customer amount status createdAt disbursementDate',
    LOAN_DETAIL: '_id loanId customer amount status purpose createdAt disbursementDate maturityDate',
    CUSTOMER_LIST: '_id customerCode personalInfo.fullName personalInfo.email personalInfo.phone status',
    CUSTOMER_DETAIL: '_id customerCode personalInfo status createdAt',
    USER_LIST: '_id fullName email role branch isActive',
    ACTIVITY_LIST: '_id user action entityType entityId createdAt',
    NOTIFICATION_LIST: '_id title message read createdAt'
  };
}

export default QueryOptimizer;
