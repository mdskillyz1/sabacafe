import type { Metadata } from "next";
import { LegalPageTemplate } from "../LegalPageTemplate";
import { readLegalPage } from "@/lib/legalContentStore";

export const metadata: Metadata = { title: "Cookie Policy | Saba Cafe" };

export default async function CookiePolicyPage() {
  const page = await readLegalPage("cookie-policy");
  if (!page) return null;
  return <LegalPageTemplate page={page} />;
}
