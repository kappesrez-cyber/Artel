# Продакшен-образ: Amvera (amvera.yml, раздел «Хостинг на Amvera» в README),
# docker compose --profile app, CI. Сборке база не нужна, миграции и демо-данные
# применяются при старте контейнера (scripts/docker-start.sh).

# Базовый образ можно подменить зеркалом: --build-arg NODE_IMAGE=mirror.gcr.io/library/node:22-alpine
ARG NODE_IMAGE=node:22-alpine

FROM ${NODE_IMAGE} AS deps
WORKDIR /app
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci --no-audit --no-fund

FROM ${NODE_IMAGE} AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate && npm run build

# Всё для `prisma migrate deploy` и `prisma db seed` при старте: CLI Prisma, tsx и код сида.
FROM ${NODE_IMAGE} AS dbtools
WORKDIR /app/db
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src/generated ./src/generated
COPY package.json tsconfig.json prisma.config.ts ./
COPY prisma ./prisma
COPY src ./src
# Сборщик, линтеры и тесты при старте не нужны — образ заметно легче.
RUN rm -rf node_modules/@next/swc-* node_modules/next/dist/compiled/@vercel/og \
    node_modules/typescript node_modules/eslint* node_modules/@eslint* \
    node_modules/@typescript-eslint node_modules/vitest node_modules/@vitest \
    node_modules/vite node_modules/rolldown node_modules/@rolldown \
    node_modules/prettier node_modules/prettier-plugin-tailwindcss \
    node_modules/tailwindcss node_modules/@tailwindcss node_modules/lightningcss* \
    node_modules/@img node_modules/@types node_modules/.cache

FROM ${NODE_IMAGE} AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=dbtools /app/db ./db
COPY scripts/docker-start.sh ./docker-start.sh
USER nextjs
EXPOSE 3000
CMD ["sh", "./docker-start.sh"]
