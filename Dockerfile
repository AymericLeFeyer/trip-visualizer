# --- Build ---
FROM node:24-bookworm AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- Runtime ---
FROM node:24-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
ENV DATABASE_PATH=/app/data/trips.db

# node_modules (dont better-sqlite3 compilé et tsx) + build + sources serveur
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/server ./server
COPY --from=build /app/shared ./shared
COPY --from=build /app/tsconfig*.json ./

RUN mkdir -p /app/data
VOLUME ["/app/data"]
EXPOSE 3001

CMD ["npm", "start"]
