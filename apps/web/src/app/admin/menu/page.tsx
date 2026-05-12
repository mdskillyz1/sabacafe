import { AdminMenuEditor } from "./AdminMenuEditor";
import { AdminPageShell } from "../AdminPageShell";

export default function AdminMenuPage() {
  return (
    <AdminPageShell
      eyebrow="Menu manager"
      title="Manage the Saba Cafe menu."
      description="Nothing appears on the public menu until staff press Publish. Use this screen to manage dish names, descriptions, prices, images, allergens, optional spice levels, availability, popular badges, size options, add-ons, and prep times."
      breadcrumbs={[{ label: "Menu" }]}
      backLabel="Back to overview"
    >
      <AdminMenuEditor />
    </AdminPageShell>
  );
}
