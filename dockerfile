# ---- Builder ----
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies (including dev dependencies needed for building)
RUN npm ci

# Copy Prisma schema and generate client (if using Prisma)
COPY prisma ./prisma
RUN npx prisma generate

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# ---- Production ----
FROM node:20-alpine

WORKDIR /app

# Copy only production artifacts
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma   
COPY --from=builder /app/package.json ./package.json


# Copy and prepare entrypoint
COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh


# Expose port
ENV PORT=5000
EXPOSE $PORT

# Health check (optional)
HEALTHCHECK --interval=30s --timeout=3s \
    CMD node -e "require('http').get('http://localhost:5000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Use npm to start
CMD ["./entrypoint.sh"]