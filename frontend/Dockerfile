# Frontend Dockerfile for Aqua-AI (Vite)
# Multi-stage build for optimized production image

# Stage 1: Build the React application
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Set environment variables during build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
ENV CI=false

# Build the application
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy custom nginx configuration
COPY <<EOF /etc/nginx/conf.d/default.conf
server {
    listen 3000;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Cache static assets (Vite)
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing - serve index.html for all routes
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # API proxy (optional - if backend is separate)
    location /api/ {
        proxy_pass http://backend:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Copy built files from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:3000 || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
