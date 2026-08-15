FROM node:22-alpine AS dashboard-builder
WORKDIR /build/dashboard
COPY dashboard/package.json dashboard/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY dashboard/ ./
RUN npm run build

FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY server/package.json server/package-lock.json ./server/
RUN npm --prefix server ci --omit=dev --no-audit --no-fund
COPY server/src ./server/src
COPY --from=dashboard-builder /build/dashboard/dist ./dashboard/dist
WORKDIR /app/server
EXPOSE 8787
CMD ["node", "src/index.js"]
