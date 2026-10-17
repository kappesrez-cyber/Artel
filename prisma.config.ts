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
    url: process.env["DATABASE_URL"],
    // Нужен только для `prisma migrate dev` с локальной базой `npm run db:start`.
    shadowDatabaseUrl: process.env["SHADOW_DATABASE_URL"],
  },
});
