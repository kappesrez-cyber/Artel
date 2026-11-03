#!/bin/sh
# Старт контейнера: миграции, демо-данные, затем сервер Next.js.
# MIGRATE_ON_START=0 и SEED_ON_START=0 отключают соответствующий шаг.
set -e

# CLI Prisma и tsx (для сида) лежат в db/node_modules.
PATH="$(pwd)/db/node_modules/.bin:$PATH"
export PATH

if [ -z "$DATABASE_URL" ]; then
  echo "Не задана переменная DATABASE_URL (строка подключения к PostgreSQL)." >&2
  exit 1
fi

if [ "${MIGRATE_ON_START:-1}" = "1" ]; then
  echo "→ prisma migrate deploy"
  (cd db && prisma migrate deploy)
fi

if [ "${SEED_ON_START:-1}" = "1" ]; then
  echo "→ prisma db seed (повторный запуск безопасен)"
  (cd db && prisma db seed)
fi

echo "→ next start :${PORT:-3000}"
exec node server.js
