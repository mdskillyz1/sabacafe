import { AdminBusinessInfoSettings } from "./AdminBusinessInfoSettings";
import { AdminLegalContentSettings } from "./AdminLegalContentSettings";
import { AdminPageShell } from "../AdminPageShell";

export default function AdminWebsiteSettingsPage() {
  return (
    <AdminPageShell
      eyebrow="Website settings"
      title="Business info, footer, and legal controls."
      description="Manage contact details, cookie banner text, legal pages, and footer links shown to customers."
      breadcrumbs={[{ label: "Website Settings" }]}
      backLabel="Back to overview"
    >
      <AdminBusinessInfoSettings />
      <AdminLegalContentSettings />
    </AdminPageShell>
  );
}
