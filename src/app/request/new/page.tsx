import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export const metadata: Metadata = { title: "Новая заявка" };

export default function Page() {
  return <PlaceholderPage title="Новая заявка" />;
}
