# Docker Setup Guide - Credit Jambo Savings Management Admin System

This guide will help you set up and run the Credit Jambo Savings Management Admin system using Docker and Docker Compose.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Development Workflow](#development-workflow)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)
- [Performance Optimization](#performance-optimization)
- [Scaling](#scaling)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Docker**: Version 20.10 or higher
  - [Install Docker](https://docs.docker.com/get-docker/)
- **Docker Compose**: Version 2.0 or higher
  - Usually included with Docker Desktop
  - Verify: `docker-compose --version`
- **Git**: For cloning the repository

### System Requirements

**Minimum:**
- 4GB RAM
- 20GB free disk space
- 2 CPU cores

**Recommended:**
- 8GB RAM or more
- 50GB free disk space
- 4 CPU cores

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ndfis-management-system
```

### 2. Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit the .env file with your configuration
nano .env  # or use your preferred editor
```

**Important:** Change the following default values:
- `MONGO_PASSWORD`: Set a strong password
- `JWT_SECRET`: Use a random 32+ character string
- `CLOUDINARY_*`: Add your Cloudinary credentials (if using)

### 3. Start the Application

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check service status
docker-compose ps
```

### 4. Access the Application

- **Frontend**: http://localhost:80
- **Backend API**: http://localhost:4000
- **API Health Check**: http://localhost:4000/api/health
- **MongoDB**: localhost:27017
- **Redis**: localhost:6379

### 5. Stop the Application

```bash
# Stop services
docker-compose down

# Stop and remove volumes (WARNING: Deletes all data)
docker-compose down -v
```

## Configuration

### Environment Variables

The `.env` file contains all configuration options. Key settings:

#### Database Configuration
```env
MONGO_USER=admin
MONGO_PASSWORD=your_secure_password
MONGO_DB=anchorfinance
```

#### Redis Cache
```env
REDIS_ENABLED=true
REDIS_HOST=redis
REDIS_PORT=6379
```

#### Application Settings
```env
NODE_ENV=production
BACKEND_PORT=4000
FRONTEND_PORT=80
```

#### Cloudinary (Optional)
```env
ENABLE_CLOUDINARY=true
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Port Customization

To change default ports, update the `.env` file:

```env
BACKEND_PORT=5000
FRONTEND_PORT=8080
MONGO_PORT=27018
REDIS_PORT=6380
```

## Development Workflow

### Local Development with Docker

#### Option 1: Full Docker Stack

```bash
# Start all services
docker-compose up -d

# Watch logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Rebuild after code changes
docker-compose up -d --build backend
docker-compose up -d --build frontend
```

#### Option 2: Hybrid (Database in Docker, Code Local)

```bash
# Start only database services
docker-compose up -d mongodb redis

# Run backend locally
cd backend
npm install
npm run server

# Run frontend locally
cd frontend
npm install
npm run dev
```

### Running Commands Inside Containers

```bash
# Backend shell
docker-compose exec backend sh

# Install new npm packages
docker-compose exec backend npm install <package-name>

# Run database migrations/scripts
docker-compose exec backend node scripts/migrate.js

# MongoDB shell
docker-compose exec mongodb mongosh -u admin -p changeme
```

### Development Best Practices

1. **Hot Reload**: For active development, run code locally
2. **Database**: Use Docker for consistent database environment
3. **Testing**: Test in Docker before deploying to production

## Production Deployment

### 1. Prepare for Production

```bash
# Set production environment
echo "NODE_ENV=production" >> .env

# Update security settings
nano .env
# - Change all default passwords
# - Use strong JWT secrets
# - Configure HTTPS/SSL
```

### 2. Build Production Images

```bash
# Build optimized production images
docker-compose build --no-cache

# Tag images for registry
docker tag ndfis-backend:latest your-registry/ndfis-backend:v1.0.0
docker tag ndfis-frontend:latest your-registry/ndfis-frontend:v1.0.0
```

### 3. Deploy to Server

```bash
# On production server
git clone <repository-url>
cd ndfis-management-system

# Configure production environment
cp .env.example .env
nano .env  # Set production values

# Start services
docker-compose up -d

# Verify health
docker-compose ps
curl http://localhost:4000/api/health
```

### 4. Enable Automatic Backups

```bash
# Set up cron job for database backups
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /path/to/ndfis-management-system && docker-compose exec -T backend node scripts/backup.js
```

## Troubleshooting

### Common Issues

#### Services Won't Start

```bash
# Check logs
docker-compose logs

# Check specific service
docker-compose logs backend

# Rebuild from scratch
docker-compose down -v
docker-compose up -d --build
```

#### Database Connection Issues

```bash
# Verify MongoDB is running
docker-compose ps mongodb

# Check MongoDB logs
docker-compose logs mongodb

# Test connection
docker-compose exec mongodb mongosh -u admin -p <password>

# Restart MongoDB
docker-compose restart mongodb
```

#### Redis Connection Issues

```bash
# Check Redis health
docker-compose exec redis redis-cli ping

# View Redis logs
docker-compose logs redis

# Restart Redis
docker-compose restart redis
```

#### Port Conflicts

```bash
# Error: "port is already allocated"

# Option 1: Stop conflicting service
lsof -i :<port>  # Find process
kill <PID>       # Stop process

# Option 2: Change port in .env
BACKEND_PORT=5000
```

#### Out of Memory

```bash
# Increase Docker memory limit
# Docker Desktop: Settings > Resources > Memory

# Or reduce service memory limits in docker-compose.yml
```

### Health Checks

```bash
# Check all services
docker-compose ps

# API health check
curl http://localhost:4000/api/health

# Frontend health check
curl http://localhost/health

# MongoDB health
docker-compose exec mongodb mongosh --eval "db.runCommand({ping: 1})"

# Redis health
docker-compose exec redis redis-cli ping
```

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend

# Since specific time
docker-compose logs --since 2024-01-01T00:00:00 backend
```

## Performance Optimization

### Database Optimization

```bash
# MongoDB indexes are automatically created
# Check index status:
docker-compose exec mongodb mongosh -u admin -p <password> anchorfinance --eval "db.loans.getIndexes()"

# Monitor performance:
curl http://localhost:4000/api/performance/metrics
```

### Redis Cache Statistics

```bash
# View cache stats
curl http://localhost:4000/api/cache/stats

# Clear cache
curl -X POST http://localhost:4000/api/cache/clear/all

# Clear specific entity cache
curl -X POST http://localhost:4000/api/cache/clear/loan
```

### Resource Monitoring

```bash
# Container resource usage
docker stats

# Specific service stats
docker stats ndfis-backend

# Database size
docker-compose exec mongodb mongosh -u admin -p <password> --eval "db.stats()"
```

## Scaling

### Horizontal Scaling

```bash
# Scale backend to 3 instances
docker-compose up -d --scale backend=3

# Add load balancer (nginx)
# See docker-compose.scale.yml for example
```

### Vertical Scaling

Edit `docker-compose.yml`:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 2G    # Increase from 1G
          cpus: '2'     # Increase from 1
        reservations:
          memory: 1G
          cpus: '1'
```

### Database Scaling

```yaml
services:
  mongodb:
    command: --wiredTigerCacheSizeGB 3.0  # Increase cache
```

## Maintenance

### Backup Database

```bash
# Manual backup
docker-compose exec mongodb mongodump -u admin -p <password> --out /backups/manual-backup

# Automated backup (already configured via cron)
docker-compose exec backend node scripts/backup.js
```

### Restore Database

```bash
# Restore from backup
docker-compose exec mongodb mongorestore -u admin -p <password> /backups/<backup-folder>
```

### Update Application

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose down
docker-compose up -d --build

# Or rolling update (zero downtime)
docker-compose up -d --no-deps --build backend
docker-compose up -d --no-deps --build frontend
```

### Clean Up

```bash
# Remove unused containers
docker system prune

# Remove unused volumes (WARNING: Data loss)
docker volume prune

# Remove unused images
docker image prune -a
```

## Security Best Practices

1. **Change Default Passwords**: Update all passwords in `.env`
2. **Use Strong Secrets**: JWT secret should be 32+ characters
3. **Enable HTTPS**: Use reverse proxy (nginx) with SSL certificates
4. **Firewall Rules**: Restrict database ports to localhost only
5. **Regular Updates**: Keep Docker images updated
6. **Backup Strategy**: Regular automated backups with off-site storage
7. **Monitor Logs**: Set up log aggregation and monitoring
8. **Rate Limiting**: Already enabled in the application
9. **Network Isolation**: Services communicate via internal Docker network

## Support

For issues or questions:
- Check logs: `docker-compose logs`
- Review this documentation
- Check application health: http://localhost:4000/api/health
- Contact system administrator

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [MongoDB Docker](https://hub.docker.com/_/mongo)
- [Redis Docker](https://hub.docker.com/_/redis)
- [Nginx Docker](https://hub.docker.com/_/nginx)

