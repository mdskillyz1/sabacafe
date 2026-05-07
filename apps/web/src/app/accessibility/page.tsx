import type { Metadata } from "next";
import { LegalPageTemplate } from "../LegalPageTemplate";
import { readLegalPage } from "@/lib/legalContentStore";

export const metadata: Metadata = { title: "Accessibility Statement | Saba Cafe" };

export default async function AccessibilityPage() {
  const page = await readLegalPage("accessibility");
  if (!page) return null;
  return <LegalPageTemplate page={page} />;
}
