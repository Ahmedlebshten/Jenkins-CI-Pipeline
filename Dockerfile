# Dockerfile for URL Shortener
FROM node:18-alpine

# Install build dependencies for native modules (sqlite3)
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Remove build dependencies to reduce image size
RUN apk del python3 make g++

# Copy application files
COPY . .

# Create directory for SQLite database
RUN mkdir -p /app/data

# Expose port
EXPOSE 3000

# Set environment variable for database path
ENV DB_PATH=/app/data/urls.db

# BASE_URL should be set at deployment time (e.g., http://your-ec2-ip:3000)
ENV BASE_URL=http://13.217.229.180:2020

# Start the application
CMD ["node", "server.js"]