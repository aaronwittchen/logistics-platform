# Use official Bun image
FROM oven/bun:latest

# Set working directory inside the container
WORKDIR /app

# Copy package files first for caching
COPY package.json bun.lock ./

# Install dependencies
RUN bun install

# Copy the rest of your app code
COPY . .

# Expose port if your backend has an HTTP server
EXPOSE 3000

# Default command to run your backend
CMD ["bun", "run", "dev"]