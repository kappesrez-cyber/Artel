import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError } from "@/server/errors";

const TOKEN = "test-seller-token-0123456789";

const createProduct = vi.fn();
vi.mock("@/server/catalog/products", () => ({
  createProduct: (...args: unknown[]) => createProduct(...args),
  listOrganizationProducts: async () => [],
}));

const { POST } = await import("./route");

const ctx = { params: Promise.resolve({ organizationId: "org1" }) };
const post = (body: unknown, token?: string) =>
  POST(
    new Request("http://localhost/api/organizations/org1/products", {
      method: "POST",
      headers: token ? { authorization: `Bearer ${token}` } : {},
      body: JSON.stringify(body),
    }),
    ctx,
  );

describe("POST /api/organizations/{id}/products", () => {
  beforeEach(() => {
    vi.stubEnv("DATABASE_URL", "postgresql://localhost:5432/db");
    vi.stubEnv("SELLER_API_TOKEN", TOKEN);
    createProduct.mockReset();
  });

  it("без ключа продавца — 401", async () => {
    expect((await post({})).status).toBe(401);
    expect((await post({}, "wrong")).status).toBe(401);
    expect(createProduct).not.toHaveBeenCalled();
  });

  it("создаёт позицию в организации из адреса", async () => {
    createProduct.mockResolvedValue({ id: "p1" });
    const res = await post({ name: "Деталь" }, TOKEN);
    expect(res.status).toBe(201);
    expect(createProduct).toHaveBeenCalledWith("org1", { name: "Деталь" });
  });

  it("несуществующая организация — 404", async () => {
    createProduct.mockRejectedValue(new NotFoundError("Организация не найдена"));
    expect((await post({}, TOKEN)).status).toBe(404);
  });
});
