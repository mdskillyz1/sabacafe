export function FoodImage({ label, src, className = "" }: { label: string; src?: string; className?: string }) {
  return (
    <div
      role="img"
      aria-label={src ? `${label} food photography` : `${label} food photography placeholder`}
      className={`food-photo relative overflow-hidden ${className}`}
    >
      {src ? <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" /> : null}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-date/70 to-transparent p-5 text-cream">
        <p className="font-display text-xl font-semibold">{label}</p>
      </div>
    </div>
  );
}
