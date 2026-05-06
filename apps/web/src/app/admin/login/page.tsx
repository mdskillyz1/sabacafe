import { AdminLoginForm } from "./AdminLoginForm";

export default function AdminLoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg items-center px-4 py-16 sm:px-6 lg:px-8">
      <AdminLoginForm searchParams={searchParams} />
    </main>
  );
}
