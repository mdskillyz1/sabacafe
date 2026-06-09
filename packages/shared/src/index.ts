export type FulfilmentType = "PICKUP" | "DELIVERY";
export type OrderType = "DINE_IN" | "COLLECTION" | "DELIVERY";
export type PaymentMethod = "STRIPE_ONLINE" | "PAY_IN_STORE" | "CASH_ON_COLLECTION" | "CASH_ON_DELIVERY";
export type PaymentStatus = "PENDING" | "PENDING_PAYMENT" | "REQUIRES_ACTION" | "PAID" | "FAILED" | "REFUNDED" | "PAY_IN_STORE";
export type OrderStatus =
  | "RECEIVED"
  | "ACCEPTED"
  | "PREPARING"
  | "READY"
  | "READY_FOR_PICKUP"
  | "SERVED"
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
  orderType?: OrderType;
  paymentMethod?: PaymentMethod;
  tableId?: string;
  tableNumber?: string;
  addressLine1?: string;
  addressLine2?: string;
  postcode?: string;
  deliveryNotes?: string;
  scheduledFor?: string;
  promoCode?: string;
  items: CartLine[];
};

export type OperationsSettings = {
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  dineInEnabled?: boolean;
  stripeEnabled?: boolean;
  payInStoreEnabled?: boolean;
  cashOnCollectionEnabled?: boolean;
  cashOnDeliveryEnabled?: boolean;
  enableOnlinePayments?: boolean;
  enableDelivery?: boolean;
  enableCollection?: boolean;
  enableDineInQR?: boolean;
  deliveryRadiusMiles: number;
  deliveryFeePerMilePence: number;
  originPostcode: string;
  minimumOrderPence?: number;
  prepTimeMinutes?: number;
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
  qrCodeUrl?: string;
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
  googleReviewUrl: "https://g.page/r/CaphpFnncQ9OEAE/review",
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
  { id: "breakfast", name: "Breakfast", slug: "breakfast", description: "Breakfast dishes from the Saba Cafe menu.", sortOrder: 1 },
  { id: "main-dishes", name: "Main Dishes", slug: "main-dishes", description: "Main dishes from the Saba Cafe menu.", sortOrder: 2 },
  { id: "sides-desserts", name: "Sides & Desserts", slug: "sides-desserts", description: "Sides and desserts from the Saba Cafe menu.", sortOrder: 3 },
  { id: "special-plateau", name: "Saba Special Plateau", slug: "saba-special-plateau", description: "Saba special plateau dishes.", sortOrder: 4 },
  { id: "large-meals", name: "Saba Large Meals", slug: "saba-large-meals", description: "Saba large meals.", sortOrder: 5 },
  { id: "hot-drinks", name: "Hot Drinks", slug: "hot-drinks", description: "Hot drinks from the Saba Cafe menu.", sortOrder: 6 },
  { id: "cold-drinks", name: "Cold Drinks", slug: "cold-drinks", description: "Cold drinks from the Saba Cafe menu.", sortOrder: 7 }
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
  prepMinutes: 0,
  options: [],
  addOns: [],
  sortOrder
});

export const menuItems: (MenuItem & { sortOrder?: number })[] = [
  sabaMenuItem("3-canjeero", "breakfast", "3 Canjeero", 150, "(Thin sourdough pancake)", 1),
  sabaMenuItem("malawax", "breakfast", "Malawax", 100, "(a thin fragrant crepe)", 2),
  sabaMenuItem("muufo", "breakfast", "Muufo", 200, "(a traditional flatbread)", 3),
  sabaMenuItem("3-bajiyo", "breakfast", "3 Bajiyo", 100, "(Black-eye peas served with green chili sauce)", 4),
  sabaMenuItem("chapati-sabayad", "breakfast", "Chapati / Sabayad", 200, "(unleavened flatbread)", 5),
  sabaMenuItem("liver-only", "breakfast", "Liver Only", 500, "(Pan fried liver with onions and spices)", 6),
  sabaMenuItem("kidney-only", "breakfast", "Kidney Only", 500, "(Pan fried kidney with onions and spices)", 7),
  sabaMenuItem("odkac", "breakfast", "Odkac", 600, "(small beef cubes)", 8),
  sabaMenuItem("beef-suqaar-breakfast", "breakfast", "Beef Suqaar", 600, "(small beef cubes)", 9),
  sabaMenuItem("2-eggs-scrambled", "breakfast", "2 Eggs Scrambled", 350, "", 10),
  sabaMenuItem("somali-breakfast-with-odkac", "breakfast", "Somali Breakfast with Odkac", 800, "(Comes with either Canjeero / Chapati and Somali Tea)", 11),
  sabaMenuItem("somali-breakfast-with-beef-suqaar", "breakfast", "Somali Breakfast with Beef Suqaar", 800, "(Comes with either Canjeero / Chapati and Somali Tea)", 12),
  sabaMenuItem("somali-breakfast-with-liver", "breakfast", "Somali Breakfast with Liver", 700, "(Comes with either Canjeero / Chapati and Somali Tea)", 13),
  sabaMenuItem("somali-breakfast-with-kidney", "breakfast", "Somali Breakfast with Kidney", 700, "(Comes with either Canjeero / Chapati and Somali Tea)", 14),
  sabaMenuItem("somali-breakfast-with-chicken-suqaar", "breakfast", "Somali Breakfast with Chicken Suqaar", 700, "(Comes with either Canjeero / Chapati and Somali Tea)", 15),
  sabaMenuItem("lamb-shank", "main-dishes", "Lamb Shank", 1700, "(Slow cooked lamb shank on the bone, tender, falling off the bone and full of flavour - comes with either rice / pasta)", 16),
  sabaMenuItem("saba-lamb", "main-dishes", "Saba Lamb", 1399, "(Slow cooked lamb, tender and full of flavour - comes with either rice / pasta)", 17),
  sabaMenuItem("lamb-shank-only", "main-dishes", "Lamb Shank Only", 1200, "", 18),
  sabaMenuItem("saba-lamb-only", "main-dishes", "Saba Lamb Only", 900, "", 19),
  sabaMenuItem("beef-suqaar", "main-dishes", "Beef Suqaar", 1100, "(Comes with either rice / pasta)", 20),
  sabaMenuItem("beef-steak", "main-dishes", "Beef Steak", 1100, "(Comes with either rice / pasta)", 21),
  sabaMenuItem("beef-suqaar-only", "main-dishes", "Beef Suqaar Only", 600, "", 22),
  sabaMenuItem("beef-steak-only", "main-dishes", "Beef Steak Only", 600, "", 23),
  sabaMenuItem("chicken-suqaar", "main-dishes", "Chicken Suqaar", 1000, "(Comes with either rice / pasta)", 24),
  sabaMenuItem("chicken-steak", "main-dishes", "Chicken Steak", 1000, "(Comes with either rice / pasta)", 25),
  sabaMenuItem("chicken-leg", "main-dishes", "Chicken Leg", 1000, "(Comes with either rice / pasta)", 26),
  sabaMenuItem("chicken-suqaar-only", "main-dishes", "Chicken Suqaar Only", 500, "", 27),
  sabaMenuItem("chicken-steak-only", "main-dishes", "Chicken Steak Only", 500, "", 28),
  sabaMenuItem("chicken-leg-only", "main-dishes", "Chicken Leg Only", 500, "", 29),
  sabaMenuItem("salmon", "main-dishes", "Salmon", 1200, "(Comes with either rice / pasta)", 30),
  sabaMenuItem("salmon-only", "main-dishes", "Salmon Only", 700, "", 31),
  sabaMenuItem("rice-portion", "main-dishes", "Rice Portion", 550, "", 32),
  sabaMenuItem("pasta-portion", "main-dishes", "Pasta Portion", 550, "", 33),
  sabaMenuItem("soor-koosto", "main-dishes", "Soor & Koosto", 650, "(stiff cornmeal with spinach / swiss chard)", 34),
  sabaMenuItem("soor-only", "main-dishes", "Soor Only", 450, "(cornmeal)", 35),
  sabaMenuItem("koosto", "main-dishes", "Koosto", 200, "(spinach or swiss chard)", 36),
  sabaMenuItem("soup-of-the-day", "main-dishes", "Soup of the Day", 250, "(Every Tuesday and Friday, made from fish or lamb with vegetables)", 37),
  sabaMenuItem("xulbo", "main-dishes", "Xulbo", 100, "(fenugreek)", 38),
  sabaMenuItem("sambuus-meat", "sides-desserts", "Sambuus Meat", 150, "(Choice of meat or chicken or fish)", 39),
  sabaMenuItem("sambuus-chicken", "sides-desserts", "Sambuus Chicken", 150, "(Choice of meat or chicken or fish)", 40),
  sabaMenuItem("sambuus-fish", "sides-desserts", "Sambuus Fish", 150, "(Choice of meat or chicken or fish)", 41),
  sabaMenuItem("mandazi", "sides-desserts", "Mandazi", 100, "(fried bread)", 42),
  sabaMenuItem("somali-cake", "sides-desserts", "Somali Cake", 100, "(a slice)", 43),
  sabaMenuItem("saba-special-salad", "sides-desserts", "Saba Special Salad", 500, "", 44),
  sabaMenuItem("hummus-odkac-starter", "sides-desserts", "Hummus & Odkac Starter", 300, "", 45),
  sabaMenuItem("tiramisu", "sides-desserts", "Tiramisu", 600, "", 46),
  sabaMenuItem("milk-cake", "sides-desserts", "Milk Cake", 600, "(Comes in either Oreo or Lotus, made with homemade cake with a lasting sweet)", 47),
  sabaMenuItem("cambuulo", "sides-desserts", "Cambuulo", 400, "(slow-cooked adzuki beans with/or wheat berries or corn)", 48),
  sabaMenuItem("special-plateau-lamb-shank", "special-plateau", "Special Plateau with Lamb Shank", 4300, "(serves 2 - 3) (Comes with 3 portions of either rice/pasta, 1 portion of Lamb Shank, 1 portion salmon, with small portion of beef suqaar and chicken suqaar)", 49),
  sabaMenuItem("special-plateau-saba-lamb", "special-plateau", "Special Plateau with Saba Lamb", 3999, "(serves 2 - 3) (Comes with 3 portions of either rice/pasta, 1 portion of Saba Lamb, 1 portion salmon, with small portion of beef suqaar and chicken suqaar)", 50),
  sabaMenuItem("bigger-plateau-lamb-shank", "special-plateau", "Bigger Plateau with Lamb Shank", 7300, "(serves 4 - 5) (Comes with 5 portions of either rice/pasta, 2 portions of Lamb Shank and 1 portion salmon, with generous portion of beef suqaar and chicken suqaar)", 51),
  sabaMenuItem("bigger-plateau-saba-lamb", "special-plateau", "Bigger Plateau with Saba Lamb", 6500, "(serves 4 - 5) (Comes with 5 portions of either rice/pasta, 2 portions of Saba Lamb and 1 portion salmon, with generous portion of beef suqaar and chicken suqaar)", 52),
  sabaMenuItem("half-lamb-2-5kg-rice", "large-meals", "Half Lamb & 2.5Kg Rice", 17500, "(Comes with salad and chilli) 75% Deposit is required before order", 53),
  sabaMenuItem("full-lamb-5kg-rice", "large-meals", "Full Lamb & 5Kg Rice", 35000, "(Comes with salad and chilli) 75% Deposit is required before order", 54),
  sabaMenuItem("somali-tea", "hot-drinks", "Somali Tea", 150, "", 55),
  sabaMenuItem("somali-coffee", "hot-drinks", "Somali Coffee", 100, "", 56),
  sabaMenuItem("espresso", "hot-drinks", "Espresso", 180, "", 57),
  sabaMenuItem("macchiato", "hot-drinks", "Macchiato", 200, "", 58),
  sabaMenuItem("cappuccino", "hot-drinks", "Cappuccino", 250, "", 59),
  sabaMenuItem("latte", "hot-drinks", "Latte", 250, "", 60),
  sabaMenuItem("americano", "hot-drinks", "Americano", 350, "", 61),
  sabaMenuItem("mojito", "cold-drinks", "Mojito", 250, "(Strawberry or Passion or Lime or Mango or a Mix of either)", 62),
  sabaMenuItem("cans", "cold-drinks", "Cans", 100, "", 63),
  sabaMenuItem("tropical", "cold-drinks", "Tropical", 130, "", 64),
  sabaMenuItem("jug-juice", "cold-drinks", "Jug Juice", 900, "", 65),
  sabaMenuItem("bottle-juice", "cold-drinks", "Bottle Juice", 400, "", 66),
  sabaMenuItem("glass-juice", "cold-drinks", "Glass Juice", 350, "", 67),
  sabaMenuItem("water", "cold-drinks", "Water", 100, "", 68)
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
