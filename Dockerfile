FROM node:22-alpine

WORKDIR /app

# Install bun
RUN npm install -g bun

# Create data directory
RUN mkdir -p /app/data

# Copy and install dependencies
COPY package.json bun.lock* ./
RUN bun install

# Copy prisma and generate
COPY prisma ./prisma/
RUN bunx prisma generate

# Copy source and build
COPY src ./src
COPY public ./public
COPY next.config.ts postcss.config.mjs tsconfig.json components.json tailwind.config.ts eslint.config.mjs ./
RUN bun run build

# Environment
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV DATABASE_URL=file:/app/data/trading.db

EXPOSE 3000

# Start command with explicit 0.0.0.0 binding
CMD ["sh", "-c", "bunx prisma db push --skip-generate 2>/dev/null; exec node node_modules/next/dist/bin/next start -H 0.0.0.0 -p 3000"]
