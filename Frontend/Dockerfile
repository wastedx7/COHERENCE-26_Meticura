# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install serve to run the app
RUN npm install -g serve

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Copy public assets if any
COPY public ./public 2>/dev/null || true

# Expose port
EXPOSE 3000 5173

# Environment variables
ENV NODE_ENV=production
ARG VITE_API_BASE_URL=http://localhost:8000/api
ARG VITE_CLERK_PUBLISHABLE_KEY=
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY

# Start the application
CMD ["npm", "run", "dev"]
