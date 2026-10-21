import { describe, expect, it, vi } from "vitest";

let dbAvailable = true;

vi.mock("next/server", () => ({ connection: async () => {} }));
vi.mock("@/server/db", () => ({
  db: () => ({
    $queryRaw: async () => {
      if (!dbAvailable) throw new Error("connection refused");
      return [{ "?column?": 1 }];
    },
  }),
}));

const { GET } = await import("./route");

describe("GET /api/health", () => {
  it("возвращает ok, когда БД доступна", async () => {
    dbAvailable = true;
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok", db: "ok" });
  });

  it("возвращает 503, когда БД недоступна", async () => {
    dbAvailable = false;
    vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await GET();
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ status: "error", db: "unavailable" });
  });
});
