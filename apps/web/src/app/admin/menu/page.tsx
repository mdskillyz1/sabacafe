import { AdminMenuEditor } from "./AdminMenuEditor";
import { AdminPageShell } from "../AdminPageShell";

export default function AdminMenuPage() {
  return (
    <AdminPageShell
      eyebrow="Menu manager"
      title="Add dishes, save drafts, then publish to customers."
      description="Nothing appears on the public menu until staff press Publish. Use this screen to manage names, descriptions, prices, images, allergens, spice levels, halal labels, availability, popular badges, size options, add-ons, and prep times."
      breadcrumbs={[{ label: "Menu" }]}
      backLabel="Back to overview"
    >
      <AdminMenuEditor />
    </AdminPageShell>
  );
}
