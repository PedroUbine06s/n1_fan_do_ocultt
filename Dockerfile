# Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy tsconfig and source code
COPY tsconfig.json ./
COPY src ./src

# Build the application
RUN npm run build

# Production stage
FROM node:20-slim

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy built files from the builder stage
COPY --from=builder /app/dist ./dist

# Use a non-root user for security (node user is available in slim images too)
USER node

EXPOSE 3000

# Start the application
CMD ["node", "dist/server.js"]
