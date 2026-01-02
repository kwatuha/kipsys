# API Dockerfile for Kiplombe Medical Centre HMIS
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Expose API port
EXPOSE 3001

# Start the application
# Use 'dev' for development with nodemon, 'start' for production
CMD ["npm", "run", "dev"]
