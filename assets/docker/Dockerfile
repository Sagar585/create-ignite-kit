# This is a multi-stage Dockerfile for a production-ready React app.

# --- Stage 1: Build ---
# Use a Node.js image to build the application
FROM node:22-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application source code
COPY . .

# Build the application for production
# The 'dist' folder will be created with the production build
RUN npm run build

# --- Stage 2: Production ---
# Use a lightweight Nginx image to serve the static files
FROM nginx:stable-alpine

# Copy the build output from the 'builder' stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80 to the outside world
EXPOSE 80

# The default Nginx command will start the server
CMD ["nginx", "-g", "daemon off;"]