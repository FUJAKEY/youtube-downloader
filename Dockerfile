# Use official Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
# Using npm install because package-lock.json might not be perfectly synced in this env yet,
# but npm ci is preferred for production.
RUN npm install

# Copy the rest of the application code
COPY . .

# Rebuild sqlite3 for the specific architecture of the container
# This is often needed when moving from host to container
RUN npm rebuild sqlite3

# Expose port 3000
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
