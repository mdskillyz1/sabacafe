import { InviteAcceptForm } from "./InviteAcceptForm";

export default async function StaffInvitePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const params = await searchParams;
  const token = params.token ?? "";
  return (
    <main className="min-h-screen bg-cream px-4 py-12">
      {token ? (
        <InviteAcceptForm token={token} />
      ) : (
        <div className="mx-auto mt-10 max-w-md rounded-lg border border-date/10 bg-white p-6 text-date shadow-soft">
          <h1 className="font-display text-4xl font-semibold">Invite link missing</h1>
          <p className="mt-3 text-date/65">Ask the owner to send you a fresh staff invitation.</p>
        </div>
      )}
    </main>
  );
}
