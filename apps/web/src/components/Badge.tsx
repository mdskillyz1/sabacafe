export function Badge({ children, tone = "warm" }: { children: React.ReactNode; tone?: "warm" | "green" | "dark" }) {
  const tones = {
    warm: "bg-saffron/15 text-clay",
    green: "bg-mint/12 text-mint",
    dark: "bg-date text-cream"
  };
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}
