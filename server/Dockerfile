FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
ENV NODE_OPTIONS="--max-old-space-size=512"
RUN npm ci --only=production

# Copy source code
COPY . .

# Create directories for volumes
RUN mkdir -p /app/payslips
RUN mkdir -p /app/payslip-template

# Set production environment
ENV NODE_ENV=production

# Expose port
EXPOSE 5000

# Start the application
CMD ["node", "index.js"] 