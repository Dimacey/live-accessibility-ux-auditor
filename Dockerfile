# Production Dockerfile for Live Accessibility & UX Auditor
FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies
COPY package.json ./
RUN npm install

# Copy application source code
COPY . .

# Build production client bundle
RUN npm run build

# Expose web server port
EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

# Start Express + Vite production server
CMD ["npm", "run", "start"]
