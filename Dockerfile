# Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Install OpenSSL (required for Prisma)
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy prisma schema for generating client
COPY prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Copy tsconfig and source code
COPY tsconfig.json ./
COPY src ./src

# Build the application
RUN npm run build

# Production stage
FROM node:20-slim

WORKDIR /app

# Install OpenSSL (required for Prisma migrations)
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Set production environment
ENV NODE_ENV=production

# Copy package files and install all dependencies (including prisma for migrations)
COPY package*.json ./
RUN npm install

# Copy prisma schema and migrations
COPY prisma ./prisma

# Copy built files from the builder stage
COPY --from=builder /app/dist ./dist
# Copy node_modules (inclui @prisma/client gerado no build)
COPY --from=builder /app/node_modules ./node_modules

# Copy entrypoint script
COPY docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh

# Use a non-root user for security
USER node

EXPOSE 3000

# Use entrypoint to run migrations before starting app
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]
