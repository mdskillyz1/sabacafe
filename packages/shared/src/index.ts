export type FulfilmentType = "PICKUP" | "DELIVERY";
export type PaymentStatus = "PENDING" | "REQUIRES_ACTION" | "PAID" | "FAILED" | "REFUNDED";
export type OrderStatus =
  | "RECEIVED"
  | "PREPARING"
  | "READY_FOR_PICKUP"
  | "OUT_FOR_DELIVERY"
  | "COMPLETED"
  | "CANCELLED";
export type BookingStatus = "PENDING" | "CONFIRMED" | "REJECTED" | "CANCELLED" | "SEATED" | "COMPLETED";

export type MenuCategory = {
  id: string;
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
};

export type MenuItemOption = {
  id: string;
  name: string;
  priceDeltaPence: number;
};

export type AddOn = {
  id: string;
  name: string;
  pricePence: number;
};

export type MenuItem = {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  pricePence: number;
  image: string;
  allergens: string[];
  spiceLevel: 0 | 1 | 2 | 3;
  halal: boolean;
  available: boolean;
  hidden?: boolean;
  popular: boolean;
  recommended: boolean;
  prepMinutes: number;
  options: MenuItemOption[];
  addOns: AddOn[];
};

export type CartLine = {
  menuItemId: string;
  name: string;
  unitPricePence: number;
  quantity: number;
  optionIds: string[];
  addOnIds: string[];
  notes?: string;
};

export type CheckoutInput = {
  customerName: string;
  email: string;
  phone: string;
  fulfilmentType: FulfilmentType;
  addressLine1?: string;
  postcode?: string;
  deliveryNotes?: string;
  scheduledFor?: string;
  promoCode?: string;
  items: CartLine[];
};

export type OperationsSettings = {
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  deliveryRadiusMiles: number;
  deliveryFeePerMilePence: number;
  originPostcode: string;
};

export type BusinessSocialLinks = {
  instagram?: string;
  tiktok?: string;
};

export type BusinessInfoSettings = {
  businessName: string;
  copyrightText: string;
  address: string;
  email: string;
  phone: string;
  openingHoursText: string;
  cookieBannerText: string;
  socialLinks: BusinessSocialLinks;
};

export type LegalPageSlug =
  | "terms-and-conditions"
  | "privacy-policy"
  | "cookie-policy"
  | "refund-policy"
  | "delivery-policy"
  | "accessibility";

export type LegalSection = {
  heading: string;
  body: string;
};

export type LegalPageContent = {
  slug: LegalPageSlug;
  title: string;
  summary: string;
  lastUpdated: string;
  sections: LegalSection[];
};

export type LegalContentStore = {
  pages: LegalPageContent[];
  updatedAt: string;
};

export type RestaurantTable = {
  id: string;
  name: string;
  capacity: number;
  active: boolean;
};

export type BookingAvailabilityRule = {
  id: string;
  dayOfWeek: number;
  open: boolean;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  bufferMinutes: number;
  maxPartySize: number;
  requiresApproval: boolean;
};

export type BlockedDate = {
  id: string;
  date: string;
  reason?: string;
};

export type BlockedTimeSlot = {
  id: string;
  date?: string;
  dayOfWeek?: number;
  startTime: string;
  endTime: string;
  reason?: string;
};

export type SpecialOpeningHours = {
  id: string;
  date: string;
  open: boolean;
  startTime?: string;
  endTime?: string;
  slotDurationMinutes?: number;
  bufferMinutes?: number;
  maxPartySize?: number;
  requiresApproval?: boolean;
  note?: string;
};

export type Booking = {
  id: string;
  tableId?: string;
  customerName: string;
  email?: string;
  phone: string;
  partySize: number;
  date: string;
  startTime: string;
  endTime: string;
  notes?: string;
  adminNotes?: string;
  status: BookingStatus;
  requiresApproval: boolean;
  createdAt: string;
  updatedAt: string;
};

export type BookingSlot = {
  date: string;
  startTime: string;
  endTime: string;
  available: boolean;
  remainingTables: number;
  tableIds: string[];
  reason?: string;
};

export type BookingStore = {
  tables: RestaurantTable[];
  availability: BookingAvailabilityRule[];
  blockedDates: BlockedDate[];
  blockedTimeSlots: BlockedTimeSlot[];
  specialOpeningHours: SpecialOpeningHours[];
  bookings: Booking[];
  managerEmail?: string;
  updatedAt: string;
};

export type PriceBreakdown = {
  subtotalPence: number;
  discountPence: number;
  deliveryFeePence: number;
  vatPence: number;
  totalPence: number;
  minimumMet: boolean;
};

export const businessInfo = {
  name: "Saba Cafe",
  category: "Cafe",
  address: {
    street: "152 Old Kent Rd",
    city: "London",
    postcode: "SE1 5TY",
    country: "GB"
  },
  deliveryOriginPostcode: "SE1 5TY",
  formattedAddress: "152 Old Kent Rd, London SE1 5TY",
  phone: "020 8050 9600",
  phoneHref: "tel:+442080509600",
  googleRating: 5.0,
  googleReviewCount: 3,
  googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Saba%20Cafe%20152%20Old%20Kent%20Rd%20London%20SE1%205TY",
  googleDirectionsUrl:
    "https://www.google.com/maps/dir/?api=1&destination=Saba%20Cafe%2C%20152%20Old%20Kent%20Rd%2C%20London%20SE1%205TY",
  googleReviewUrl:
    "https://www.google.com/search?client=safari&hs=IG8U&sca_esv=fec7a8aac00c39eb&rls=en&sxsrf=ANbL-n4ZpGeld9tw7fL0GwdAaHONdRoQhQ:1777487607874&si=AL3DRZEsmMGCryMMFSHJ3StBhOdZ2-6yYkXd_doETEE1OR-qOTzBUoRnorFKgt2f9oRkUHQ5zoBJlX7BUwByjwVTUBTNED7Tlx0H_z0b8rhzVLecMRTU5UUV5fq-K33VmgA8wJWikWnb&q=Saba+Cafe+Reviews&sa=X&ved=2ahUKEwi-l9ar2ZOUAxXtUEEAHf6bKtIQ0bkNegQIMRAF&biw=1440&bih=820&dpr=2#",
  mapsEmbedUrl:
    "https://www.google.com/maps?q=Saba%20Cafe%2C%20152%20Old%20Kent%20Rd%2C%20London%20SE1%205TY&output=embed",
  todayHoursLabel: "Open today until 10 pm"
};

export const defaultBusinessInfoSettings: BusinessInfoSettings = {
  businessName: businessInfo.name,
  copyrightText: "© 2026 Saba Cafe. All rights reserved.",
  address: businessInfo.formattedAddress,
  email: "hello@sabacafe.com",
  phone: businessInfo.phone,
  openingHoursText: businessInfo.todayHoursLabel,
  cookieBannerText:
    "We use essential cookies to keep this website working and optional cookies to understand how visitors use Saba Cafe online.",
  socialLinks: {
    instagram: "https://www.instagram.com/",
    tiktok: "https://www.tiktok.com/"
  }
};

export const money = (pence: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(pence / 100);

export const menuCategories: MenuCategory[] = [
  { id: "starters", name: "Starters", slug: "starters", description: "Small plates to begin with, from sambusa to fresh bites.", sortOrder: 1 },
  { id: "breakfast", name: "Breakfast", slug: "breakfast", description: "Somali morning favourites, tea, and light plates.", sortOrder: 2 },
  { id: "mains", name: "Mains", slug: "mains", description: "Generous Somali classics, rice dishes, pasta, and grilled plates.", sortOrder: 3 },
  { id: "sides", name: "Sides", slug: "sides", description: "Banana, salad, chapati, and extras for the table.", sortOrder: 4 },
  { id: "hot-drinks", name: "Hot Drinks", slug: "hot-drinks", description: "Shaah, coffee, and spiced warm drinks.", sortOrder: 5 },
  { id: "cold-drinks", name: "Cold Drinks", slug: "cold-drinks", description: "Fresh juices, smoothies, water, and soft drinks.", sortOrder: 6 },
  { id: "sauces", name: "Sauces", slug: "sauces", description: "Basbaas, tamarind dip, and house sauces.", sortOrder: 7 }
];

export const menuItems: MenuItem[] = [];

export const googleReviewSummary = {
  rating: businessInfo.googleRating,
  count: businessInfo.googleReviewCount,
  source: "Google"
};

export const openingHours = [
  { day: "Monday", hours: "8:00 - 22:00" },
  { day: "Tuesday", hours: "8:00 - 22:00" },
  { day: "Wednesday", hours: "8:00 - 22:00" },
  { day: "Thursday", hours: "8:00 - 22:00" },
  { day: "Friday", hours: "8:00 - 22:00" },
  { day: "Saturday", hours: "9:00 - 22:00" },
  { day: "Sunday", hours: "9:00 - 22:00" }
];

export function calculatePrice(
  lines: CartLine[],
  items: MenuItem[] = menuItems,
  fulfilmentType: FulfilmentType = "PICKUP",
  promoCode?: string,
  vatRate = 0.2,
  minimumOrderPence = 1200,
  deliveryFeePenceOverride = 0
): PriceBreakdown {
  const subtotalPence = lines.reduce((sum, line) => {
    const item = items.find((candidate) => candidate.id === line.menuItemId);
    const optionDelta = line.optionIds.reduce((optionSum, optionId) => {
      return optionSum + (item?.options.find((option) => option.id === optionId)?.priceDeltaPence ?? 0);
    }, 0);
    const addOnTotal = line.addOnIds.reduce((addOnSum, addOnId) => {
      return addOnSum + (item?.addOns.find((addOn) => addOn.id === addOnId)?.pricePence ?? 0);
    }, 0);
    return sum + (line.unitPricePence + optionDelta + addOnTotal) * line.quantity;
  }, 0);
  const discountPence = promoCode?.toUpperCase() === "SABA10" ? Math.round(subtotalPence * 0.1) : 0;
  const deliveryFeePence = fulfilmentType === "DELIVERY" ? deliveryFeePenceOverride : 0;
  const taxable = Math.max(0, subtotalPence - discountPence) + deliveryFeePence;
  const vatPence = Math.round(taxable - taxable / (1 + vatRate));
  const totalPence = taxable;
  return {
    subtotalPence,
    discountPence,
    deliveryFeePence,
    vatPence,
    totalPence,
    minimumMet: subtotalPence >= minimumOrderPence
  };
}

export function validatePostcode(postcode?: string) {
  if (!postcode) return false;
  return /^(E|N|NW|SE|SW|W|WC|EC)\d/i.test(postcode.replace(/\s+/g, ""));
}
