import type { Metadata } from "next";
import { LegalPageTemplate } from "../LegalPageTemplate";
import { readLegalPage } from "@/lib/legalContentStore";

export const metadata: Metadata = { title: "Delivery Policy | Saba Cafe" };

export default async function DeliveryPolicyPage() {
  const page = await readLegalPage("delivery-policy");
  if (!page) return null;
  return <LegalPageTemplate page={page} />;
}
