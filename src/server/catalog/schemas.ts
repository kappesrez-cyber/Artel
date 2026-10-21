import "server-only";
import { z } from "zod";

const text = (max: number) => z.string().trim().min(1).max(max);

/** Цена в рублях: число или строка «1000000.50», не больше 2 знаков после запятой. */
const price = z
  .union([z.number(), z.string().trim()])
  .transform((v) => String(v).replace(",", "."))
  .pipe(
    z
      .string()
      .regex(/^\d{1,12}(\.\d{1,2})?$/, "Цена: положительное число, не больше 2 знаков после точки"),
  );

export const productStatusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

/** Что производитель заполняет в карточке позиции. */
export const productInputSchema = z.object({
  name: text(200),
  description: z.string().trim().max(5000).nullish(),
  /** Артикул или модель производителя. */
  article: z.string().trim().max(100).nullish(),
  /** Импортные аналоги, которые заменяет позиция: «SKF 6205-2RSH, FAG 6205-2RSR». */
  analogs: z.string().trim().max(1000).nullish(),
  price,
  /** Срок производства в календарных днях (неделя = 7). */
  leadTimeDays: z.number().int().min(0).max(3650),
  city: text(100),
  status: productStatusSchema.default("DRAFT"),
});

export type ProductInput = z.input<typeof productInputSchema>;
export type ProductData = z.output<typeof productInputSchema>;

/** Правка позиции: любые поля по отдельности. */
export const productUpdateSchema = productInputSchema
  .extend({ status: productStatusSchema })
  .partial();

export type ProductUpdate = z.output<typeof productUpdateSchema>;

export const searchQuerySchema = z.object({
  q: z.string().max(200).default(""),
  limit: z.coerce.number().int().min(1).max(100).default(48),
});
