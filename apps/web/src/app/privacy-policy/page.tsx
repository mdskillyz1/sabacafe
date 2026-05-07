import type { Metadata } from "next";
import { LegalPageTemplate } from "../LegalPageTemplate";
import { readLegalPage } from "@/lib/legalContentStore";

export const metadata: Metadata = { title: "Privacy Policy | Saba Cafe" };

export default async function PrivacyPage() {
  const page = await readLegalPage("privacy-policy");
  if (!page) return null;
  return <LegalPageTemplate page={page} />;
}
