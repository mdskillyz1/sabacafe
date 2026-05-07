import type { Metadata } from "next";
import { LegalPageTemplate } from "../LegalPageTemplate";
import { readLegalPage } from "@/lib/legalContentStore";

export const metadata: Metadata = { title: "Refund Policy | Saba Cafe" };

export default async function RefundPolicyPage() {
  const page = await readLegalPage("refund-policy");
  if (!page) return null;
  return <LegalPageTemplate page={page} />;
}
