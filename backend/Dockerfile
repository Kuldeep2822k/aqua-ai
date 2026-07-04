# Backend Dockerfile for Aqua-AI
FROM node:20-bookworm-slim

# Create app directory and set ownership
RUN mkdir -p /app && chown -R node:node /app

# Set working directory
WORKDIR /app

# Switch to non-root user early
USER node

# Copy package files and install only production dependencies
COPY --chown=node:node package*.json ./
RUN npm ci --omit=dev --ignore-scripts && \
  npm cache clean --force

# Copy source code
COPY --chown=node:node . .

# Expose port
EXPOSE 5000

# Set environment to production
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["npm", "start"]
