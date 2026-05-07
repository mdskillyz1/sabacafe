import type { Metadata } from "next";
import { LegalPageTemplate } from "../LegalPageTemplate";
import { readLegalPage } from "@/lib/legalContentStore";

export const metadata: Metadata = { title: "Terms & Conditions | Saba Cafe" };

export default async function TermsPage() {
  const page = await readLegalPage("terms-and-conditions");
  if (!page) return null;
  return <LegalPageTemplate page={page} />;
}
