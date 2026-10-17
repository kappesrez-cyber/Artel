// Демо-данные каталога: `npm run db:seed`. Повторный запуск ничего не дублирует.
// Позиции создаются тем же слоем данных, что и через API продавца.
import "dotenv/config";
import { createProduct, listOrganizationProducts, updateProduct } from "@/server/catalog/products";
import { db } from "@/server/db";
import { createOrganization } from "@/server/organizations/organizations";

const organization = { name: "ООО Обнал", city: "Анкоридж" };

const products = [
  {
    name: "Деталь",
    price: "1000000",
    leadTimeDays: 7, // 1 неделя
    city: "Анкоридж",
    status: "PUBLISHED",
  },
] as const;

async function main() {
  const existing = await db().organization.findFirst({
    where: { name: organization.name },
    select: { id: true },
  });
  const { id: organizationId } = existing ?? (await createOrganization(organization));

  const current = await listOrganizationProducts(organizationId);
  for (const product of products) {
    const found = current.find((p) => p.name === product.name);
    if (found) await updateProduct(organizationId, found.id, product);
    else await createProduct(organizationId, product);
  }
  console.log(`Сид: «${organization.name}», позиций: ${products.length}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db().$disconnect());
