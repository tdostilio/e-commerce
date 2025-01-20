FROM node:20-slim as development

# Install OpenSSL and other dependencies
RUN apt-get update && apt-get install -y openssl

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./
COPY yarn.lock ./

# Install dependencies
RUN yarn install

# Copy prisma schema
COPY prisma ./prisma/

# Generate Prisma client
RUN yarn prisma generate

# Copy source code
COPY . .

# Build the application
RUN yarn build

# Expose ports
EXPOSE 3000
EXPOSE 9229

# Use development command by default
CMD ["yarn", "start:debug"] 