import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export const metadata: Metadata = { title: "О нас" };

export default function Page() {
  return <PlaceholderPage title="О нас" />;
}
