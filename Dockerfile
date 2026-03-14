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

# Create a non-root user for Next.js
RUN groupadd -r appuser && useradd -r -g appuser -u 1001 appuser

# Copy entrypoint script (for development hot-reload support)
COPY docker-entrypoint-frontend.sh /usr/local/bin/docker-entrypoint-frontend.sh
RUN chmod +x /usr/local/bin/docker-entrypoint-frontend.sh

# Create a wrapper script that fixes .next permissions before switching users
RUN echo '#!/bin/sh\n\
if [ -d "/app/.next" ]; then\n\
    chown -R appuser:appuser /app/.next 2>/dev/null || true\n\
fi\n\
exec gosu appuser /usr/local/bin/docker-entrypoint-frontend.sh "$@"' > /usr/local/bin/entrypoint-wrapper.sh && \
    chmod +x /usr/local/bin/entrypoint-wrapper.sh

# Install gosu for user switching
RUN apt-get update && apt-get install -y gosu && rm -rf /var/lib/apt/lists/*

# Change ownership of app directory to non-root user
RUN chown -R appuser:appuser /app

# Keep as root for entrypoint wrapper to fix permissions
# The wrapper will switch to appuser

# Expose Next.js port
EXPOSE 3000

# Use wrapper entrypoint that fixes permissions before switching users
ENTRYPOINT ["/usr/local/bin/entrypoint-wrapper.sh"]

# Start Next.js development server with Turbo mode for faster compilation
# Turbo mode significantly speeds up page compilation and hot reloading
CMD ["npm", "run", "dev"]
