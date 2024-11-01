FROM node:20-alpine
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

# Generate Prisma client (important if you're connecting to a live database)
RUN npx prisma generate

# Start the application
CMD ["node", "index.js"] 


# FROM node:lts-alpine

# # Set up the application directory
# RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
# WORKDIR /home/node/app

# # Copy package.json and package-lock.json
# COPY package*.json ./

# # Switch to root user
# USER root

# # Clean npm cache and install dependencies
# RUN npm cache clean --force && npm install
# RUN npx prisma generate
# # Switch to non-root user
# USER node

# COPY --chown=node:node . .

# ENV EXPRESS_PORT=8080
# EXPOSE 8080

# CMD [ "node", "index.js" ]