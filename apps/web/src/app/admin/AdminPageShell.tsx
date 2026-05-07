import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { AdminBackButton } from "./AdminBackButton";

type AdminBreadcrumb = {
  label: string;
  href?: string;
};

type AdminPageShellProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  breadcrumbs?: AdminBreadcrumb[];
  backHref?: string;
  backLabel?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  maxWidthClassName?: string;
};

export function AdminPageShell({
  eyebrow,
  title,
  description,
  breadcrumbs = [],
  backHref = "/admin",
  backLabel = "Back",
  actions,
  children,
  maxWidthClassName = "max-w-7xl"
}: AdminPageShellProps) {
  const trail = [{ label: "Overview", href: "/admin" }, ...breadcrumbs];

  return (
    <main className={`mx-auto ${maxWidthClassName} px-4 py-8 sm:px-6 sm:py-12 lg:px-8`}>
      <div className="mb-6 flex flex-col gap-4 rounded-lg border border-date/10 bg-white/85 p-4 shadow-sm backdrop-blur sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <AdminBackButton fallbackHref={backHref} label={backLabel} />
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm text-date/60">
          {trail.map((crumb, index) => {
            const isLast = index === trail.length - 1;
            return (
              <span key={`${crumb.label}-${index}`} className="inline-flex items-center gap-1">
                {crumb.href && !isLast ? (
                  <Link className="rounded-full px-2 py-1 font-semibold text-date/70 transition hover:bg-cream hover:text-date" href={crumb.href}>
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="rounded-full px-2 py-1 font-semibold text-date">{crumb.label}</span>
                )}
                {!isLast ? <ChevronRight size={14} className="text-date/35" /> : null}
              </span>
            );
          })}
        </nav>
        <div>
          {eyebrow ? <p className="text-sm font-semibold uppercase tracking-[0.18em] text-clay">{eyebrow}</p> : null}
          <h1 className="mt-2 font-display text-3xl font-semibold leading-tight text-date sm:text-5xl">{title}</h1>
          {description ? <p className="mt-4 max-w-3xl leading-7 text-date/70">{description}</p> : null}
        </div>
      </div>
      {children}
    </main>
  );
}
