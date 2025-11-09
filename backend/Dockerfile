# Daritana Backend Dockerfile
FROM node:20-alpine AS production

RUN apk add --no-cache dumb-init
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production && npx prisma generate

COPY . .

USER nodejs
EXPOSE 7001

HEALTHCHECK --interval=30s --timeout=3s CMD node -e "require('http').get('http://localhost:7001/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/server.js"]
