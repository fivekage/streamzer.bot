FROM node:lts

# Set up the application directory
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Switch to root user
USER root

# Clean npm cache and install dependencies
RUN npm cache clean --force && npm install

# Switch to non-root user
USER node

COPY --chown=node:node . .

ENV EXPRESS_PORT=8080
EXPOSE 8080

CMD [ "node", "index.js" ]