import { type OperationsSettings } from "@saba/shared";

type PostcodeResult = {
  result?: {
    latitude: number;
    longitude: number;
  };
};

export type DeliveryQuote = {
  allowed: boolean;
  distanceMiles?: number;
  deliveryFeePence?: number;
  reason?: string;
};

async function lookupPostcode(postcode: string) {
  const response = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`, {
    cache: "force-cache"
  });
  if (!response.ok) return null;
  const data = (await response.json()) as PostcodeResult;
  if (!data.result) return null;
  return data.result;
}

function distanceMiles(origin: { latitude: number; longitude: number }, destination: { latitude: number; longitude: number }) {
  const earthRadiusMiles = 3958.8;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const dLat = toRadians(destination.latitude - origin.latitude);
  const dLon = toRadians(destination.longitude - origin.longitude);
  const lat1 = toRadians(origin.latitude);
  const lat2 = toRadians(destination.latitude);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return earthRadiusMiles * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function quoteDelivery(postcode: string, settings: OperationsSettings): Promise<DeliveryQuote> {
  if (!settings.deliveryEnabled) {
    return { allowed: false, reason: "Delivery is currently switched off." };
  }
  if (!postcode) {
    return { allowed: false, reason: "Enter a delivery postcode." };
  }

  const [origin, destination] = await Promise.all([
    lookupPostcode(settings.originPostcode),
    lookupPostcode(postcode)
  ]);

  if (!origin || !destination) {
    return { allowed: false, reason: "We could not validate that postcode for delivery." };
  }

  const miles = distanceMiles(origin, destination);
  if (miles > settings.deliveryRadiusMiles) {
    return {
      allowed: false,
      distanceMiles: Number(miles.toFixed(2)),
      reason: `This address is ${miles.toFixed(1)} miles away, outside our ${settings.deliveryRadiusMiles}-mile delivery radius.`
    };
  }

  return {
    allowed: true,
    distanceMiles: Number(miles.toFixed(2)),
    deliveryFeePence: Math.ceil(miles) * settings.deliveryFeePerMilePence
  };
}
