FROM node:alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install && npm cache clean --force

COPY . ./

RUN npm run build

# Production stage
FROM node:alpine

WORKDIR /app

EXPOSE 5555

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Copy .env file if it exists (will be overridden by docker-compose env_file)
COPY .env* ./

CMD [ "npm", "start" ]