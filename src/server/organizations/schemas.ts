import "server-only";
import { z } from "zod";

/** Необязательное текстовое поле: пустая строка из формы — это «не заполнено». */
const optionalText = (max: number) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z.string().trim().max(max).nullish(),
  );

const digits = (pattern: RegExp, message: string) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z.string().trim().regex(pattern, message).nullish(),
  );

export const organizationInputSchema = z.object({
  name: z.string().trim().min(1, "Укажите название").max(200),
  inn: digits(/^(\d{10}|\d{12})$/, "ИНН: 10 или 12 цифр"),
  ogrn: digits(/^(\d{13}|\d{15})$/, "ОГРН: 13 цифр, ОГРНИП: 15"),
  city: optionalText(100),
  legalAddress: optionalText(500),
  description: optionalText(5000),
  website: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z
      .string()
      .trim()
      .transform((v) => (/^https?:\/\//i.test(v) ? v : `https://${v}`))
      .pipe(z.url({ protocol: /^https?$/, error: "Проверьте адрес сайта" }).max(300))
      .nullish(),
  ),
  phone: optionalText(50),
  email: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z.email("Проверьте email").max(200).nullish(),
  ),
  foundedYear: z.preprocess(
    (value) => (value === "" ? null : typeof value === "string" ? Number(value) : value),
    z.number().int().min(1700, "Проверьте год").max(2100, "Проверьте год").nullish(),
  ),
  isSeller: z.boolean().optional(),
  isBuyer: z.boolean().optional(),
});

export type OrganizationInput = z.input<typeof organizationInputSchema>;
export type OrganizationData = z.output<typeof organizationInputSchema>;

export const organizationUpdateSchema = organizationInputSchema
  .partial()
  .refine((data) => !(data.isSeller === false && data.isBuyer === false), {
    message: "Предприятие должно продавать, покупать или и то и другое",
    path: ["isSeller"],
  });
export type OrganizationUpdate = z.output<typeof organizationUpdateSchema>;
