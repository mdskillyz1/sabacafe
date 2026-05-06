import { calculatePrice, type CheckoutInput } from "@saba/shared";
import { quoteDelivery } from "./delivery";
import { getPublishedMenu } from "./menuStore";
import { readOperationsSettings } from "./operationsSettings";

type StoredOrder = {
  id: string;
  orderNumber: string;
  status: "RECEIVED" | "PREPARING" | "READY_FOR_PICKUP" | "OUT_FOR_DELIVERY" | "COMPLETED" | "CANCELLED";
  paymentStatus: "PENDING" | "REQUIRES_ACTION" | "PAID" | "FAILED" | "REFUNDED";
  checkout: CheckoutInput;
  totals: ReturnType<typeof calculatePrice>;
  createdAt: string;
};

const memoryOrders = new Map<string, StoredOrder>();

export async function getMenu() {
  return getPublishedMenu();
}

export async function createDemoOrder(input: CheckoutInput) {
  const id = crypto.randomUUID();
  const orderNumber = `SABA-${Math.floor(10000 + Math.random() * 89999)}`;
  const menu = await getPublishedMenu();
  const settings = await readOperationsSettings();
  const deliveryQuote =
    input.fulfilmentType === "DELIVERY" ? await quoteDelivery(input.postcode ?? "", settings) : { deliveryFeePence: 0 };
  const totals = calculatePrice(input.items, menu.items, input.fulfilmentType, input.promoCode, 0.2, 1200, deliveryQuote.deliveryFeePence ?? 0);
  const order: StoredOrder = {
    id,
    orderNumber,
    status: "RECEIVED",
    paymentStatus: "PENDING",
    checkout: input,
    totals,
    createdAt: new Date().toISOString()
  };
  memoryOrders.set(id, order);
  return order;
}

export async function getDemoOrders() {
  return Array.from(memoryOrders.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getDemoOrder(id: string) {
  return memoryOrders.get(id);
}

export async function updateDemoOrderStatus(id: string, status: StoredOrder["status"]) {
  const order = memoryOrders.get(id);
  if (!order) return undefined;
  const updated = { ...order, status };
  memoryOrders.set(id, updated);
  return updated;
}

export async function markDemoPayment(id: string, paymentStatus: StoredOrder["paymentStatus"]) {
  const order = memoryOrders.get(id);
  if (!order) return undefined;
  const updated = { ...order, paymentStatus };
  memoryOrders.set(id, updated);
  return updated;
}
