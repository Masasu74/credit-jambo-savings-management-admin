# Credit Jambo Savings Management - Backend API
# Multi-stage build for optimized production image

FROM node:18-alpine AS base

# Install necessary packages for bcrypt and other native dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Development stage
FROM base AS development
RUN npm install
COPY . .
EXPOSE 4000
CMD ["npm", "run", "server"]

# Production stage
FROM base AS production

# Copy application code
COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

# Create necessary directories with proper permissions
RUN mkdir -p /app/uploads /app/logs /app/backups && \
    chown -R nodejs:nodejs /app/uploads /app/logs /app/backups

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start the application
CMD ["sh", "-c", "node server.js"]

