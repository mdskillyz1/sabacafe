import { businessInfo, googleReviewSummary } from "@saba/shared";
import { Star } from "lucide-react";

export default function ReviewsPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-display text-5xl font-semibold text-date">Reviews</h1>
      <p className="mt-4 max-w-3xl text-date/70">
        Saba Cafe currently shows a verified {googleReviewSummary.rating.toFixed(1)} Google rating.
        Individual review text is loaded from Google once official API credentials are connected.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <a href={businessInfo.googleReviewUrl} className="rounded-full bg-mint px-5 py-3 font-semibold text-white">Leave a Google Review</a>
        <a href={businessInfo.googleMapsUrl} className="rounded-full border border-date/15 px-5 py-3 font-semibold text-date">View on Google</a>
      </div>
      <div className="mt-8 rounded-lg border border-date/10 bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-cream text-4xl font-bold text-date">
            {googleReviewSummary.rating.toFixed(1)}
          </div>
          <div>
            <div className="flex gap-1 text-saffron">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star key={index} className="fill-current" size={22} />
              ))}
            </div>
            <h2 className="mt-3 font-display text-3xl font-semibold text-date">{googleReviewSummary.rating.toFixed(1)} Google rating</h2>
            <p className="mt-2 max-w-2xl text-date/65">
              We only show real review text when it comes from Google or approved customer submissions. Use the Google link to
              read the current reviews.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
