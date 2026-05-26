import type { CheckoutInput } from "@saba/shared";
import { getPublishedMenu } from "./menuStore";
import {
  createOrder,
  getOrder,
  getOrders,
  updateOrderPaymentStatus,
  updateOrderStatus,
  type StoredOrder
} from "./orderStore";

export async function getMenu() {
  return getPublishedMenu();
}

export async function createDemoOrder(input: CheckoutInput) {
  return createOrder(input);
}

export async function getDemoOrders() {
  return getOrders();
}

export async function getDemoOrder(id: string) {
  return getOrder(id);
}

export async function updateDemoOrderStatus(id: string, status: StoredOrder["status"]) {
  return updateOrderStatus(id, status);
}

export async function markDemoPayment(id: string, paymentStatus: StoredOrder["paymentStatus"]) {
  return updateOrderPaymentStatus(id, paymentStatus);
}
