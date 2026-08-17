# ---- Builder ----
FROM node:20-alpine AS builder

# Install pnpm globally
RUN npm install -g pnpm

WORKDIR /app

# Copy package files (pnpm uses pnpm-lock.yaml)
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (including dev dependencies needed for building)
RUN pnpm install --frozen-lockfile

# Copy Prisma schema and generate client (if using Prisma)
COPY prisma ./prisma
RUN pnpm prisma generate

# Copy source code
COPY . .

# Build TypeScript
RUN pnpm run build

# ---- Production ----
FROM node:20-alpine

# Install pnpm in production image too (for running the app)
RUN npm install -g pnpm

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

# Use pnpm to start (or can use npm start)
CMD ["./entrypoint.sh"]