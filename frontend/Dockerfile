# Build stage
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci && npm cache clean --force

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Fix permissions
RUN chown -R nginx:nginx /usr/share/nginx/html &&     chown -R nginx:nginx /var/cache/nginx &&     chown -R nginx:nginx /var/log/nginx &&     chown -R nginx:nginx /etc/nginx/conf.d

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
