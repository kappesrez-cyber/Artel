import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    // `server-only` под условием react-server — пустой модуль, поэтому сид может
    // пользоваться серверным слоем данных из src/server.
    seed: "tsx --conditions=react-server prisma/seed.ts",
  },
  datasource: {
    // Миграции идут напрямую к базе. У Neon (онлайн-превью на Vercel) прямой адрес лежит
    // в DATABASE_URL_UNPOOLED, а DATABASE_URL ведёт через пул соединений для приложения.
    url: process.env["DATABASE_URL_UNPOOLED"] ?? process.env["DATABASE_URL"],
    // Нужен только для `prisma migrate dev` с локальной базой `npm run db:start`.
    shadowDatabaseUrl: process.env["SHADOW_DATABASE_URL"],
  },
});
