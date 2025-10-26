import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const connectionOptions = {
      // Enhanced Connection Pooling for Scale
      maxPoolSize: 100, // Optimized for high concurrency
      minPoolSize: 10,  // Maintain ready connections for better performance
      
      // Advanced Timeout Settings
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      
      // Enhanced Retry Settings
      retryWrites: true,
      retryReads: true,
      maxIdleTimeMS: 30000, // Close connections after 30s of inactivity
      
      // Write Concern for Performance vs Durability
      w: 'majority',
      journal: false, // Disable journaling for better write performance
      
      // Read Preferences for Load Balancing
      readPreference: 'secondaryPreferred', // Read from secondary when possible
      
      // SSL for production
      ssl: true,
      
      // Auto Index Management
      autoIndex: false, // Disable auto-indexing in production
    };

    // Production Database
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Attempting to connect to production database...');
      }
      await mongoose.connect(
        process.env.MONGO_URI || 'mongodb+srv://masasu74:salomon123!@creditjambo.fad5qrn.mongodb.net/creditjambo_savings?retryWrites=true&w=majority&appName=creditjambo',
        connectionOptions
      );
      console.log("✅ Production DB CONNECTED");
      
      // Set up connection event handlers
      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err);
      });
      
      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️ MongoDB disconnected');
      });
      
      mongoose.connection.on('reconnected', () => {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 MongoDB reconnected');
        }
      });
      
      mongoose.connection.on('connected', () => {
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ MongoDB connected');
        }
      });
      
      // Monitor connection pool (only in development)
      if (process.env.NODE_ENV === 'development') {
        setInterval(async () => {
          try {
            const poolStatus = await mongoose.connection.db.admin().command({ serverStatus: 1 });
            console.log('📊 Connection pool status:', poolStatus);
          } catch (error) {
            console.log('📊 Connection monitoring error:', error.message);
          }
        }, 300000); // Every 5 minutes
      }
      
    } catch (error) {
      console.error('❌ Production DB connection failed:', error.message);
      console.error('⚠️ Connection string or credentials issue');
      console.error('📋 Please check:');
      console.error('   1. Database password is correct');
      console.error('   2. Network connectivity');
      console.error('   3. MongoDB Atlas cluster status');
      
      // Enable mock mode for development
      console.warn('⚠️ Starting in MOCK MODE - using in-memory data');
      global.MOCK_MODE = true;
      return;
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    // Enable mock mode for development
    console.warn('⚠️ Starting in MOCK MODE - using in-memory data');
    global.MOCK_MODE = true;
  }
};

// Function to check database health
export const checkDBHealth = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      // Test the connection with a simple query
      await mongoose.connection.db.admin().ping();
      return { healthy: true, status: 'connected' };
    } else {
      return { healthy: false, status: mongoose.connection.readyState };
    }
  } catch (error) {
    console.error('Database health check failed:', error);
    return { healthy: false, status: 'error', error: error.message };
  }
};

// Function to reconnect to database
export const reconnectDB = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      console.log('🔄 Attempting to reconnect to database...');
      await mongoose.connection.close();
      await connectDB();
      return true;
    }
    return true;
  } catch (error) {
    console.error('❌ Database reconnection failed:', error);
    return false;
  }
}; 