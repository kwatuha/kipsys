# Frontend Dockerfile for Kiplombe Medical Centre HMIS (Next.js)
# Using regular node image instead of alpine for SWC binary compatibility
FROM node:18

# Set working directory
WORKDIR /app

# Install dependencies first (better caching)
# Copy only package files first for better layer caching
COPY package*.json ./

# Clean npm cache and install dependencies
RUN npm cache clean --force && \
    npm install --legacy-peer-deps

# Copy application code
COPY . .

# Copy entrypoint script (for development hot-reload support)
COPY docker-entrypoint-frontend.sh /usr/local/bin/docker-entrypoint-frontend.sh
RUN chmod +x /usr/local/bin/docker-entrypoint-frontend.sh

# Expose Next.js port
EXPOSE 3000

# Use entrypoint for development (handles volume mounts gracefully)
# For production, dependencies are already installed above
ENTRYPOINT ["/usr/local/bin/docker-entrypoint-frontend.sh"]

# Start Next.js development server (using legacy mode to avoid Turbopack font issues in Docker)
# The server will compile on first access, but subsequent requests will be fast
CMD ["npm", "run", "dev:legacy"]
