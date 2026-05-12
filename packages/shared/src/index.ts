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
  published?: boolean;
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
  { id: "breakfast", name: "Breakfast", slug: "breakfast", description: "Somali breakfast favourites, tea, and fresh morning plates.", sortOrder: 1 },
  { id: "main-dishes", name: "Main Dishes", slug: "main-dishes", description: "Generous Somali classics, rice, pasta, meat, fish, and traditional sides.", sortOrder: 2 },
  { id: "drinks", name: "Drinks", slug: "drinks", description: "Somali tea, coffee, soft drinks, water, and fresh juices.", sortOrder: 3 },
  { id: "special-platters", name: "Special Platters", slug: "special-platters", description: "Sharing platters for families and groups.", sortOrder: 4 },
  { id: "large-meals", name: "Large Meals", slug: "large-meals", description: "Large lamb and rice meals for gatherings and special occasions.", sortOrder: 5 }
];

const sabaMenuItem = (
  id: string,
  categoryId: string,
  name: string,
  pricePence: number,
  description: string,
  sortOrder: number
): MenuItem & { sortOrder?: number } => ({
  id,
  categoryId,
  name,
  slug: id,
  description,
  pricePence,
  image: "",
  allergens: [],
  spiceLevel: 0,
  halal: true,
  available: true,
  published: true,
  hidden: false,
  popular: false,
  recommended: false,
  prepMinutes: 15,
  options: [],
  addOns: [],
  sortOrder
});

export const menuItems: (MenuItem & { sortOrder?: number })[] = [
  sabaMenuItem("2-cajeero-or-1-malawax", "breakfast", "2 Cajeero or 1 Malawax", 100, "Soft Somali pancakes, lightly spiced.", 1),
  sabaMenuItem("mufo", "breakfast", "Mufo", 200, "Soft and fluffy Somali flatbread.", 2),
  sabaMenuItem("3-baajiyo", "breakfast", "3 Baajiyo", 100, "Fried dough balls, crispy outside and soft inside.", 3),
  sabaMenuItem("liver-or-kidney", "breakfast", "Liver or Kidney", 500, "Pan-fried liver or kidney with onions and spices.", 4),
  sabaMenuItem("odkac", "breakfast", "Odkac", 600, "Small pieces of meat, pan-fried with onions and spices.", 5),
  sabaMenuItem("2-eggs-scrambled", "breakfast", "2 Eggs Scrambled", 350, "Scrambled eggs, simple and tasty.", 6),
  sabaMenuItem("sambuus", "breakfast", "Sambuus", 100, "Choice of meat or chicken.", 7),
  sabaMenuItem("mandazi", "breakfast", "Mandazi", 100, "Sweet fried dough.", 8),
  sabaMenuItem("chapati-sabayad", "breakfast", "Chapati (Sabayad)", 150, "Layered flatbread, soft and flaky.", 9),
  sabaMenuItem("quraac-somali-with-odkac-beef-suqaar", "breakfast", "Quraac Somali with Odkac / Beef Suqaar", 750, "Comes with canjeero/chapati and Somali tea.", 10),
  sabaMenuItem("quraac-somali-with-liver-kidney-chicken-suqaar", "breakfast", "Quraac Somali with Liver/Kidney/Chicken Suqaar", 650, "Comes with canjeero/chapati and Somali tea.", 11),
  sabaMenuItem("lamb-shank", "main-dishes", "Lamb Shank", 1300, "Slow cooked meat (haniid) on the bone.", 12),
  sabaMenuItem("soup-or-xulbo", "main-dishes", "Soup or Xulbo", 50, "Vegetable soup or xulbo.", 13),
  sabaMenuItem("beef-suqaar-or-steak", "main-dishes", "Beef Suqaar or Steak", 600, "Beef suqaar or steak.", 14),
  sabaMenuItem("chicken-suqaar-or-steak-or-leg", "main-dishes", "Chicken Suqaar or Steak or Leg", 500, "Chicken options.", 15),
  sabaMenuItem("salmon", "main-dishes", "Salmon", 1200, "Fresh salmon dish.", 16),
  sabaMenuItem("rize-pasta-soor", "main-dishes", "Rize / Pasta / Soor", 550, "Choice of rice, pasta or traditional soor.", 17),
  sabaMenuItem("lamb-shank-only", "main-dishes", "Lamb Shank Only", 900, "Lamb shank on its own.", 18),
  sabaMenuItem("cagaar", "main-dishes", "Cagaar", 100, "Baby spinach cooked with onions and spices.", 19),
  sabaMenuItem("soor-iyo-cagaar", "main-dishes", "Soor iyo Cagaar", 600, "Traditional soor with spinach.", 20),
  sabaMenuItem("milk-cake", "main-dishes", "Milk Cake", 600, "Homemade milk cake with lotus or oreo.", 21),
  sabaMenuItem("cambuulo", "main-dishes", "Cambuulo", 400, "Traditional Somali dish.", 22),
  sabaMenuItem("shaah", "drinks", "Shaah", 100, "Somali tea with milk and suqaat.", 23),
  sabaMenuItem("qaxwo", "drinks", "Qaxwo", 100, "Somali black coffee.", 24),
  sabaMenuItem("espresso", "drinks", "Espresso", 150, "Strong and rich coffee.", 25),
  sabaMenuItem("latte", "drinks", "Latte", 280, "Smooth and creamy coffee.", 26),
  sabaMenuItem("americano", "drinks", "Americano", 250, "Classic black coffee.", 27),
  sabaMenuItem("cappuccino", "drinks", "Cappuccino", 250, "Smooth coffee with steamed milk.", 28),
  sabaMenuItem("macchiatto", "drinks", "Macchiatto", 180, "Coffee with a dash of milk.", 29),
  sabaMenuItem("coke-pepsi-rio-7up", "drinks", "Coke / Pepsi / Rio / 7Up", 100, "Canned soft drinks.", 30),
  sabaMenuItem("tropical-bottle", "drinks", "Tropical (Bottle)", 130, "Exotic fruit drink.", 31),
  sabaMenuItem("jug-juice", "drinks", "Jug Juice", 800, "Fresh juice (large jug).", 32),
  sabaMenuItem("glass-juice", "drinks", "Glass Juice", 200, "Fresh juice (glass).", 33),
  sabaMenuItem("water", "drinks", "Water", 100, "Still bottled water.", 34),
  sabaMenuItem("special-plateau-serves-2-3", "special-platters", "Special Plateau (Serves 2-3)", 3900, "Rice/pasta with meat and fish selections.", 35),
  sabaMenuItem("bigger-plateau-serves-4-5", "special-platters", "Bigger Plateau (Serves 4-5)", 6500, "Large sharing platter.", 36),
  sabaMenuItem("half-lamb-2-5kg-rice", "large-meals", "Half Lamb + 2.5kg Rice", 17500, "Comes with salad and chilli.", 37),
  sabaMenuItem("full-lamb-5kg-rice", "large-meals", "Full Lamb + 5Kg Rice", 35000, "Comes with salad and chilli.", 38)
];

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
