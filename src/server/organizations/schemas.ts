import "server-only";
import { z } from "zod";

export const organizationInputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  inn: z
    .string()
    .trim()
    .regex(/^(\d{10}|\d{12})$/, "ИНН: 10 или 12 цифр")
    .nullish(),
  city: z.string().trim().min(1).max(100).nullish(),
});

export type OrganizationInput = z.input<typeof organizationInputSchema>;
export type OrganizationData = z.output<typeof organizationInputSchema>;

export const organizationUpdateSchema = organizationInputSchema.partial();
export type OrganizationUpdate = z.output<typeof organizationUpdateSchema>;
