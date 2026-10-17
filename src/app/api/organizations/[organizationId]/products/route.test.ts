import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError } from "@/server/errors";

const createProduct = vi.fn();
vi.mock("@/server/catalog/products", () => ({
  createProduct: (...args: unknown[]) => createProduct(...args),
  listOrganizationProducts: async () => [],
}));

const authorizeOrganization = vi.fn();
vi.mock("@/server/auth/access", () => ({
  authorizeOrganization: (...args: unknown[]) => authorizeOrganization(...args),
}));

const { POST } = await import("./route");

const ctx = { params: Promise.resolve({ organizationId: "org1" }) };
const post = (body: unknown) =>
  POST(
    new Request("http://localhost/api/organizations/org1/products", {
      method: "POST",
      body: JSON.stringify(body),
    }),
    ctx,
  );

const allowed = { user: { id: "u1" } };
const denied = (status: number) => ({ denied: Response.json({}, { status }) });

describe("POST /api/organizations/{id}/products", () => {
  beforeEach(() => {
    createProduct.mockReset();
    authorizeOrganization.mockReset();
  });

  it("проверяет доступ к предприятию из адреса в режиме продавца", async () => {
    authorizeOrganization.mockResolvedValue(allowed);
    createProduct.mockResolvedValue({ id: "p1" });
    await post({ name: "Деталь" });
    expect(authorizeOrganization).toHaveBeenCalledWith("org1", { seller: true });
  });

  it("без входа — 401, чужое предприятие — 403, позиция не создаётся", async () => {
    authorizeOrganization.mockResolvedValueOnce(denied(401));
    expect((await post({})).status).toBe(401);
    authorizeOrganization.mockResolvedValueOnce(denied(403));
    expect((await post({})).status).toBe(403);
    expect(createProduct).not.toHaveBeenCalled();
  });

  it("создаёт позицию в организации из адреса", async () => {
    authorizeOrganization.mockResolvedValue(allowed);
    createProduct.mockResolvedValue({ id: "p1" });
    const res = await post({ name: "Деталь" });
    expect(res.status).toBe(201);
    expect(createProduct).toHaveBeenCalledWith("org1", { name: "Деталь" });
  });

  it("несуществующая организация — 404", async () => {
    authorizeOrganization.mockResolvedValue(allowed);
    createProduct.mockRejectedValue(new NotFoundError("Организация не найдена"));
    expect((await post({})).status).toBe(404);
  });
});
