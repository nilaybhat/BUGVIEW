FROM node:22-alpine AS dashboard-builder
WORKDIR /build/dashboard
COPY dashboard/package.json dashboard/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY dashboard/ ./
RUN npm run build

FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
COPY server/package.json ./server/
COPY dashboard/package.json ./dashboard/
RUN npm ci --omit=dev --no-audit --no-fund
COPY server/src ./server/src
COPY --from=dashboard-builder /build/dashboard/dist ./dashboard/dist
WORKDIR /app/server
EXPOSE 8787
CMD ["node", "src/index.js"]
