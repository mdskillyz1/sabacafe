export function FoodImage({ label, className = "" }: { label: string; className?: string }) {
  return (
    <div
      role="img"
      aria-label={`${label} food photography placeholder`}
      className={`food-photo relative overflow-hidden ${className}`}
    >
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-date/70 to-transparent p-5 text-cream">
        <p className="font-display text-xl font-semibold">{label}</p>
      </div>
    </div>
  );
}
