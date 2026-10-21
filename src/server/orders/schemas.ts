import "server-only";
import { z } from "zod";

const empty = (value: unknown) => (typeof value === "string" && value.trim() === "" ? null : value);
const optionalText = (max: number) => z.preprocess(empty, z.string().trim().max(max).nullish());

/** Поля заказа из формы «Размещение карточки на заказ». */
export const orderInputSchema = z
  .object({
    title: z.string().trim().min(3, "Коротко: что нужно изготовить или поставить").max(200),
    description: z
      .string({ error: "Опишите, для чего нужна позиция" })
      .trim()
      .min(10, "Опишите, для чего нужна позиция")
      .max(5000),
    specification: optionalText(20_000),
    quantity: z.preprocess(
      empty,
      z.coerce.number({ error: "Укажите число" }).int().min(1, "Количество: от 1").nullish(),
    ),
    unit: z.preprocess(empty, z.string().trim().max(20).nullish()),
    budget: z.preprocess(
      (v) => (typeof v === "string" ? empty(v.replace(/\s/g, "").replace(",", ".")) : v),
      z.coerce
        .number({ error: "Бюджет — число в рублях" })
        .positive("Бюджет больше нуля")
        .max(1e12)
        .nullish(),
    ),
    deadline: z.preprocess(empty, z.coerce.date({ error: "Проверьте дату" }).nullish()),
    city: optionalText(100),
    // Опросник из панели «+» строки поиска и формы заказа.
    needKind: z.preprocess(
      empty,
      z.enum(["IMPORT_REPLACEMENT", "MANUFACTURE", "SUPPLY"]).nullish(),
    ),
    originalBrand: optionalText(100),
    originalArticle: optionalText(100),
    application: optionalText(500),
    industry: optionalText(100),
    analogAllowed: z.preprocess(
      (v) => (v === "yes" ? true : v === "no" ? false : empty(v)),
      z.boolean().nullish(),
    ),
    recurrence: z.preprocess(empty, z.enum(["ONCE", "MONTHLY", "QUARTERLY", "YEARLY"]).nullish()),
    requiredDocuments: z
      .array(z.string().trim().min(1).max(100))
      .max(10)
      .default([])
      .transform((list) => [...new Set(list)]),
    contactName: z.string().trim().min(2, "Кому звонить или писать").max(200),
    contactPhone: optionalText(50),
    contactEmail: z.preprocess(empty, z.email("Проверьте email").nullish()),
    /** Сколько звёзд вложить сразу при размещении. */
    stars: z.preprocess(
      empty,
      z.coerce.number({ error: "Укажите число звёзд" }).int().min(0).max(100).nullish(),
    ),
  })
  .refine((o) => o.contactPhone || o.contactEmail, {
    message: "Оставьте телефон или email",
    path: ["contactPhone"],
  });

export type OrderInput = z.infer<typeof orderInputSchema>;

const needKindText = {
  IMPORT_REPLACEMENT: "Ищем отечественную замену импортной позиции",
  MANUFACTURE: "Нужно изготовить по чертежам или ТЗ",
  SUPPLY: "Нужны регулярные поставки",
} as const;

/**
 * Описание заказа, если заказчик заполнил опросник, но не написал своими словами:
 * собираем его из ответов, чтобы на рынке у заказа был понятный абзац «Информация».
 */
export function fillDescription(raw: Record<string, unknown>): Record<string, unknown> {
  const text = (key: string) => (typeof raw[key] === "string" ? (raw[key] as string).trim() : "");
  if (text("description")) return raw;
  const original = [text("originalBrand"), text("originalArticle")].filter(Boolean).join(" ");
  const kind = needKindText[text("needKind") as keyof typeof needKindText];
  const parts = [
    kind && original ? `${kind}: ${original}.` : kind ? `${kind}.` : "",
    !kind && original ? `Оригинал: ${original}.` : "",
    text("application") && `Применение: ${text("application")}.`,
    text("industry") && `Отрасль: ${text("industry")}.`,
  ].filter(Boolean);
  return parts.length ? { ...raw, description: parts.join(" ") } : raw;
}

/** Файлы храним в базе, поэтому держим их маленькими: так заказ укладывается в один запрос. */
export const MAX_ATTACHMENTS_BYTES = 4 * 1024 * 1024;
export const MAX_ATTACHMENTS = 10;

export type AttachmentKind = "SPECIFICATION" | "TECHNICAL";

export type IncomingFile = { kind: AttachmentKind; file: File };

/** Пустые поля выбора файла браузер присылает как файл без имени и размера — отбрасываем их. */
export function validateAttachments(files: IncomingFile[]): IncomingFile[] {
  const real = files.filter(({ file }) => file.size > 0 && file.name);
  if (real.length > MAX_ATTACHMENTS) {
    throw new z.ZodError([
      {
        code: "custom",
        path: ["files"],
        message: `Не больше ${MAX_ATTACHMENTS} файлов`,
        input: real,
      },
    ]);
  }
  const total = real.reduce((sum, { file }) => sum + file.size, 0);
  if (total > MAX_ATTACHMENTS_BYTES) {
    throw new z.ZodError([
      {
        code: "custom",
        path: ["files"],
        message:
          "Файлы вместе — не больше 4 МБ. Большие чертежи загрузите в облако и дайте ссылку в ТЗ",
        input: total,
      },
    ]);
  }
  return real;
}

/** Что можно открыть прямо в браузере; остальное только скачивается (HTML и SVG — никогда). */
export function isInlineSafe(mimeType: string): boolean {
  return /^(application\/pdf|image\/(png|jpeg|gif|webp))$/.test(mimeType);
}
