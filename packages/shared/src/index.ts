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
  optionLabels?: string[];
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
  tableToken?: string;
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
  sortOrder: number,
  options: MenuItemOption[] = []
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
  options,
  addOns: [],
  sortOrder
});

const choice = (group: string, name: string, priceDeltaPence = 0): MenuItemOption => ({
  id: `${group}-${name}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
  name: `${group}: ${name}`,
  priceDeltaPence
});

export function optionGroup(option: MenuItemOption) {
  const [group] = option.name.split(":");
  return option.name.includes(":") ? group.trim() : "";
}

export function optionDisplayName(option: MenuItemOption) {
  const [, ...rest] = option.name.split(":");
  return rest.length ? rest.join(":").trim() : option.name;
}

export function optionLabel(option: MenuItemOption) {
  const group = optionGroup(option);
  const displayName = optionDisplayName(option);
  return group ? `${group}: ${displayName}` : displayName;
}

export function requiredOptionGroups(item: MenuItem) {
  return Array.from(new Set(item.options.map(optionGroup).filter(Boolean)));
}

export function londonWeekday(date = new Date()) {
  return new Intl.DateTimeFormat("en-GB", { weekday: "long", timeZone: "Europe/London" }).format(date);
}

export function isItemOrderableToday(item: Pick<MenuItem, "id" | "available">, date = new Date()) {
  if (!item.available) return false;
  if (item.id !== "soup-of-the-day") return true;
  return ["Tuesday", "Friday"].includes(londonWeekday(date));
}

export function itemAvailabilityMessage(item: Pick<MenuItem, "id" | "available">, date = new Date()) {
  if (!item.available) return "Unavailable";
  if (item.id === "soup-of-the-day" && !isItemOrderableToday(item, date)) return "Available Tuesday and Friday only";
  return "";
}

export const menuItems: (MenuItem & { sortOrder?: number })[] = [
  sabaMenuItem("3-canjeero", "breakfast", "3 Canjeero", 150, "(Thin sourdough pancake)", 1),
  sabaMenuItem("malawax", "breakfast", "Malawax", 100, "(a thin fragrant crepe)", 2),
  sabaMenuItem("muufo", "breakfast", "Muufo", 200, "(a traditional flatbread)", 3),
  sabaMenuItem("3-bajiyo", "breakfast", "3 Bajiyo", 100, "(black-eye peas served with green chili sauce)", 4),
  sabaMenuItem("chapati-sabayad", "breakfast", "Chapati / Sabayad", 200, "(unleavened flatbread)", 5, [
    choice("Choice", "Chapati"),
    choice("Choice", "Sabayad")
  ]),
  sabaMenuItem("liver-kidney-only", "breakfast", "Liver / Kidney Only", 500, "(Pan fried liver or kidney with onions and spices)", 6, [
    choice("Main choice", "Liver"),
    choice("Main choice", "Kidney")
  ]),
  sabaMenuItem("odkac-beef-suqaar", "breakfast", "Odkac / Beef Suqaar", 600, "(small beef cubes)", 7, [
    choice("Main choice", "Odkac"),
    choice("Main choice", "Beef Suqaar")
  ]),
  sabaMenuItem("2-eggs-scrambled", "breakfast", "2 Eggs Scrambled", 350, "", 8),
  sabaMenuItem("somali-breakfast-1", "breakfast", "Somali Breakfast with Odkac / Beef Suqaar", 800, "Comes with either Canjeero / Chapati and Somali Tea.", 9, [
    choice("Meat option", "Odkac"),
    choice("Meat option", "Beef Suqaar"),
    choice("Side choice", "Canjeero"),
    choice("Side choice", "Chapati"),
    choice("Tea option", "With Somali Tea"),
    choice("Tea option", "No Tea")
  ]),
  sabaMenuItem("somali-breakfast-2", "breakfast", "Somali Breakfast with Liver / Kidney / Chicken Suqaar", 700, "Comes with either Canjeero / Chapati and Somali Tea.", 10, [
    choice("Meat option", "Liver"),
    choice("Meat option", "Kidney"),
    choice("Meat option", "Chicken Suqaar"),
    choice("Side choice", "Canjeero"),
    choice("Side choice", "Chapati"),
    choice("Tea option", "With Somali Tea"),
    choice("Tea option", "No Tea")
  ]),
  sabaMenuItem("lamb-shank", "main-dishes", "Lamb Shank", 1200, "(Slow cooked lamb shank on the bone, tender, falling off the bone and full of flavour)", 16, [
    choice("Serving option", "Lamb only"),
    choice("Serving option", "With Rice", 499),
    choice("Serving option", "With Pasta", 499),
    choice("Serving option", "With Federation", 499)
  ]),
  sabaMenuItem("saba-lamb", "main-dishes", "Saba Lamb", 900, "(Slow cooked lamb, tender and full of flavour)", 17, [
    choice("Serving option", "Only"),
    choice("Serving option", "With Rice", 499),
    choice("Serving option", "With Pasta", 499),
    choice("Serving option", "With Federation", 499)
  ]),
  sabaMenuItem("beef-suqaar", "main-dishes", "Beef Suqaar", 600, "", 20, [
    choice("Serving option", "Only"),
    choice("Serving option", "With Rice", 500),
    choice("Serving option", "With Pasta", 500),
    choice("Serving option", "With Federation", 500)
  ]),
  sabaMenuItem("beef-steak", "main-dishes", "Beef Steak", 600, "", 21, [
    choice("Serving option", "Only"),
    choice("Serving option", "With Rice", 500),
    choice("Serving option", "With Pasta", 500),
    choice("Serving option", "With Federation", 500)
  ]),
  sabaMenuItem("chicken-suqaar", "main-dishes", "Chicken Suqaar", 500, "", 24, [
    choice("Serving option", "Only"),
    choice("Serving option", "With Rice", 500),
    choice("Serving option", "With Pasta", 500),
    choice("Serving option", "With Federation", 500)
  ]),
  sabaMenuItem("chicken-steak", "main-dishes", "Chicken Steak", 500, "", 25, [
    choice("Serving option", "Only"),
    choice("Serving option", "With Rice", 500),
    choice("Serving option", "With Pasta", 500),
    choice("Serving option", "With Federation", 500)
  ]),
  sabaMenuItem("chicken-leg", "main-dishes", "Chicken Leg", 500, "", 26, [
    choice("Serving option", "Only"),
    choice("Serving option", "With Rice", 500),
    choice("Serving option", "With Pasta", 500),
    choice("Serving option", "With Federation", 500)
  ]),
  sabaMenuItem("salmon", "main-dishes", "Salmon", 700, "", 30, [
    choice("Serving option", "Only"),
    choice("Serving option", "With Rice", 500),
    choice("Serving option", "With Pasta", 500),
    choice("Serving option", "With Federation", 500)
  ]),
  sabaMenuItem("rice-portion", "main-dishes", "Rice Portion", 550, "", 32),
  sabaMenuItem("pasta-portion", "main-dishes", "Pasta Portion", 550, "", 33),
  sabaMenuItem("soor-koosto", "main-dishes", "Soor & Koosto", 200, "(stiff cornmeal with spinach / swiss chard)", 34, [
    choice("Serving option", "Koosto only"),
    choice("Serving option", "Soor only", 250),
    choice("Serving option", "Soor & Koosto", 450)
  ]),
  sabaMenuItem("soup-of-the-day", "main-dishes", "Soup of the Day", 250, "(Every Tuesday and Friday, made from fish or lamb with vegetables)", 37, [
    choice("Soup choice", "Fish"),
    choice("Soup choice", "Lamb")
  ]),
  sabaMenuItem("xulbo", "main-dishes", "Xulbo", 100, "(fenugreek)", 38),
  sabaMenuItem("sambusa", "sides-desserts", "Sambusa", 150, "(Choice of meat or chicken or fish)", 39, [
    choice("Filling", "Meat"),
    choice("Filling", "Chicken"),
    choice("Filling", "Fish")
  ]),
  sabaMenuItem("mandazi", "sides-desserts", "Mandazi", 100, "(fried bread)", 42),
  sabaMenuItem("somali-cake", "sides-desserts", "Somali Cake", 100, "(a slice)", 43),
  sabaMenuItem("saba-special-salad", "sides-desserts", "Saba Special Salad", 500, "", 44),
  sabaMenuItem("hummus-odkac-starter", "sides-desserts", "Hummus & Odkac Starter", 300, "", 45),
  sabaMenuItem("tiramisu", "sides-desserts", "Tiramisu", 600, "", 46),
  sabaMenuItem("milk-cake", "sides-desserts", "Milk Cake", 600, "(Comes in either Oreo or Lotus, made with homemade cake with a lasting sweet)", 47, [
    choice("Flavour", "Oreo"),
    choice("Flavour", "Lotus")
  ]),
  sabaMenuItem("cambuulo", "sides-desserts", "Cambuulo", 400, "(slow-cooked adzuki beans with/or wheat berries or corn)", 49),
  sabaMenuItem("saba-special-plateau", "special-plateau", "Saba Special Plateau (serves 2-3)", 3999, "Choose 1 main meat, 2 extra meats, and 3 Rice/Pasta side portions.", 50, [
    choice("Main Meat", "Lamb Shank", 300),
    choice("Main Meat", "Saba Lamb"),
    choice("Extra Meat", "Salmon"),
    choice("Extra Meat", "Beef Steak"),
    choice("Extra Meat", "Beef Suqaar"),
    choice("Extra Meat", "Chicken Suqaar"),
    choice("Extra Meat", "Chicken Steak"),
    choice("Extra Meat", "Half Beef Suqaar + Half Chicken Suqaar"),
    choice("Extra Meat", "Half Chicken Steak + Half Chicken Leg"),
    choice("Sides", "Rice"),
    choice("Sides", "Pasta")
  ]),
  sabaMenuItem("bigger-plateau", "special-plateau", "Bigger Plateau (serves 4-5)", 6499, "Choose 2 main meat portions, 3 extra meat portions, and 5 Rice/Pasta side portions.", 51, [
    choice("Main Meat", "Lamb Shank", 400),
    choice("Main Meat", "Saba Lamb"),
    choice("Extra Meat", "Salmon"),
    choice("Extra Meat", "Beef Steak"),
    choice("Extra Meat", "Beef Suqaar"),
    choice("Extra Meat", "Chicken Suqaar"),
    choice("Extra Meat", "Chicken Steak"),
    choice("Extra Meat", "Chicken Leg"),
    choice("Sides", "Rice"),
    choice("Sides", "Pasta")
  ]),
  sabaMenuItem("half-lamb-2-5kg-rice", "large-meals", "Half Lamb & 2.5Kg Rice", 17500, "(Comes with salad and chilli) 75% Deposit is required before order", 54),
  sabaMenuItem("full-lamb-5kg-rice", "large-meals", "Full Lamb & 5Kg Rice", 35000, "(Comes with salad and chilli) 75% Deposit is required before order", 55),
  sabaMenuItem("somali-tea", "hot-drinks", "Somali Tea", 150, "", 56),
  sabaMenuItem("somali-coffee", "hot-drinks", "Somali Coffee", 100, "", 57),
  sabaMenuItem("espresso", "hot-drinks", "Espresso", 180, "", 58),
  sabaMenuItem("macchiato", "hot-drinks", "Macchiato", 200, "", 59),
  sabaMenuItem("cappuccino", "hot-drinks", "Cappuccino", 250, "", 60),
  sabaMenuItem("latte", "hot-drinks", "Latte", 250, "", 61),
  sabaMenuItem("americano", "hot-drinks", "Americano", 350, "", 62),
  sabaMenuItem("mojito", "cold-drinks", "Mojito", 250, "(Strawberry or Passion or Lime or Mango or a Mix of either)", 63, [
    choice("Flavour", "Strawberry"),
    choice("Flavour", "Passion"),
    choice("Flavour", "Lime"),
    choice("Flavour", "Mango"),
    choice("Flavour", "Mix")
  ]),
  sabaMenuItem("cans", "cold-drinks", "Cans", 100, "", 68),
  sabaMenuItem("tropical", "cold-drinks", "Tropical", 130, "", 69),
  sabaMenuItem("jug-juice", "cold-drinks", "Jug Juice", 900, "", 70),
  sabaMenuItem("bottle-juice", "cold-drinks", "Bottle Juice", 400, "", 71),
  sabaMenuItem("glass-juice", "cold-drinks", "Glass Juice", 350, "", 72),
  sabaMenuItem("water", "cold-drinks", "Water", 100, "", 73)
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
