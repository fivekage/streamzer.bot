FROM node:25-alpine
# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev
RUN apk add libressl-dev
# Copy the rest of the application code
COPY . .

EXPOSE 8080

# Start the application
CMD ["node", "index.js"] 