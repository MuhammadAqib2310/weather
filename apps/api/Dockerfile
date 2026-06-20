FROM node:20-alpine

WORKDIR /app

# Copy root package files for workspace setup
COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/

RUN npm install --workspace apps/api --ignore-scripts

COPY apps/api ./apps/api

RUN npm run build --workspace apps/api

EXPOSE 4000

CMD ["node", "apps/api/dist/server.js"]
