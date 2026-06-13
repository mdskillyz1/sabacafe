import { prisma } from "@saba/database";
import { calculatePrice, isItemOrderableToday, optionDisplayName, optionGroup, requiredOptionGroups, type CartLine, type CheckoutInput, type MenuItemOption, type OrderStatus, type OrderType, type PaymentMethod, type PaymentStatus } from "@saba/shared";
import { quoteDelivery } from "./delivery";
import { getPublishedMenu } from "./menuStore";
import { readOperationsSettings } from "./operationsSettings";

const db = prisma as any;

export type StoredOrder = {
  id: string;
  orderNumber: string;
  trackingCode: string;
  orderType: OrderType;
  tableId?: string | null;
  tableNumber?: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  deliveryAddress?: {
    line1?: string;
    line2?: string;
    postcode?: string;
    notes?: string;
  } | null;
  items: CartLine[];
  subtotalPence: number;
  deliveryFeePence: number;
  discountPence: number;
  vatPence: number;
  totalPence: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  status: OrderStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  checkout: CheckoutInput;
  totals: ReturnType<typeof calculatePrice>;
};

function orderNumber() {
  return `SABA-${Math.floor(10000 + Math.random() * 89999)}`;
}

function trackingCode() {
  return crypto.randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase();
}

function orderTypeToLegacyFulfilment(orderType: OrderType) {
  return orderType === "DELIVERY" ? "DELIVERY" : "PICKUP";
}

function normalizeOrderType(input: Partial<CheckoutInput>): OrderType {
  if (input.orderType) return input.orderType;
  return input.fulfilmentType === "DELIVERY" ? "DELIVERY" : "COLLECTION";
}

function defaultPaymentMethod(orderType: OrderType): PaymentMethod {
  if (orderType === "DINE_IN") return "PAY_IN_STORE";
  if (orderType === "DELIVERY") return "STRIPE_ONLINE";
  return "CASH_ON_COLLECTION";
}

function aggregateOptionLabels(options: MenuItemOption[]) {
  const counts = new Map<string, { option: MenuItemOption; count: number }>();
  for (const option of options) {
    const key = option.id;
    const current = counts.get(key);
    counts.set(key, { option, count: (current?.count ?? 0) + 1 });
  }
  return Array.from(counts.values()).map(({ option, count }) => {
    const group = optionGroup(option);
    const display = optionDisplayName(option);
    return `${group}: ${display}${count > 1 ? ` x${count}` : ""}`;
  });
}

function countGroup(options: MenuItemOption[], group: string) {
  return options.filter((option) => optionGroup(option) === group).length;
}

function validatePlatter(itemId: string, itemName: string, selectedOptions: MenuItemOption[]) {
  if (itemId !== "saba-special-plateau" && itemId !== "bigger-plateau") return;
  const mainTotal = countGroup(selectedOptions, "Main Meat");
  const extraTotal = countGroup(selectedOptions, "Extra Meat");
  const sideTotal = countGroup(selectedOptions, "Sides");

  if (itemId === "saba-special-plateau") {
    if (mainTotal !== 1) throw new Error(`Please choose 1 main meat for ${itemName}.`);
    if (extraTotal !== 2) throw new Error(`Please choose 2 extra meats for ${itemName}.`);
    if (sideTotal !== 3) throw new Error(`Please choose exactly 3 Rice/Pasta side portions for ${itemName}.`);
  }

  if (itemId === "bigger-plateau") {
    if (mainTotal !== 2) throw new Error(`Please choose 2 main meat portions for ${itemName}.`);
    if (extraTotal !== 3) throw new Error(`Please choose 3 extra meat portions for ${itemName}.`);
    if (sideTotal !== 5) throw new Error(`Please choose exactly 5 Rice/Pasta side portions for ${itemName}.`);
  }
}

async function validateAndLabelCartItems(items: CartLine[]) {
  const menu = await getPublishedMenu();
  for (const line of items) {
    const item = menu.items.find((candidate) => candidate.id === line.menuItemId);
    if (!item) throw new Error(`${line.name || "This item"} is no longer available.`);
    if (!isItemOrderableToday(item)) throw new Error(`${item.name} is only available on Tuesday and Friday.`);
    const selectedOptions = (line.optionIds ?? [])
      .map((optionId) => item.options.find((option) => option.id === optionId))
      .filter((option): option is MenuItemOption => Boolean(option));
    validatePlatter(item.id, item.name, selectedOptions);
    const requiredGroups = requiredOptionGroups(item);
    if (requiredGroups.length) {
      const missingGroups = requiredGroups.filter((group) => !selectedOptions.some((option) => optionGroup(option) === group));
      if (missingGroups.length) {
        throw new Error(`Please choose ${missingGroups.join(", ")} for ${item.name}.`);
      }
    }
    line.optionLabels = selectedOptions.length ? aggregateOptionLabels(selectedOptions) : [];
  }
  return menu;
}

async function addEnumValue(typeName: string, value: string) {
  await db.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM pg_type WHERE typname = '${typeName}') THEN
        ALTER TYPE "${typeName}" ADD VALUE IF NOT EXISTS '${value}';
      END IF;
    END $$;
  `);
}

export async function ensureOrderSchema() {
  await db.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'FulfilmentType') THEN
        CREATE TYPE "FulfilmentType" AS ENUM ('PICKUP', 'DELIVERY');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'OrderStatus') THEN
        CREATE TYPE "OrderStatus" AS ENUM ('RECEIVED', 'ACCEPTED', 'PREPARING', 'READY', 'READY_FOR_PICKUP', 'SERVED', 'OUT_FOR_DELIVERY', 'COMPLETED', 'CANCELLED');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentStatus') THEN
        CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PENDING_PAYMENT', 'REQUIRES_ACTION', 'PAID', 'FAILED', 'REFUNDED', 'PAY_IN_STORE');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'OrderType') THEN
        CREATE TYPE "OrderType" AS ENUM ('DINE_IN', 'COLLECTION', 'DELIVERY');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentMethod') THEN
        CREATE TYPE "PaymentMethod" AS ENUM ('STRIPE_ONLINE', 'PAY_IN_STORE', 'CASH_ON_COLLECTION', 'CASH_ON_DELIVERY');
      END IF;
    END $$;
  `);

  for (const value of ["ACCEPTED", "READY", "SERVED"]) {
    await addEnumValue("OrderStatus", value);
  }
  await addEnumValue("PaymentStatus", "PENDING_PAYMENT");
  await addEnumValue("PaymentStatus", "PAY_IN_STORE");
  for (const value of ["DINE_IN", "COLLECTION", "DELIVERY"]) {
    await addEnumValue("OrderType", value);
  }
  for (const value of ["STRIPE_ONLINE", "PAY_IN_STORE", "CASH_ON_COLLECTION", "CASH_ON_DELIVERY"]) {
    await addEnumValue("PaymentMethod", value);
  }

  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Order" (
      "id" TEXT PRIMARY KEY,
      "orderNumber" TEXT NOT NULL UNIQUE,
      "customerName" TEXT NOT NULL,
      "email" TEXT NOT NULL DEFAULT '',
      "phone" TEXT NOT NULL DEFAULT '',
      "fulfilmentType" "FulfilmentType" NOT NULL DEFAULT 'PICKUP',
      "status" "OrderStatus" NOT NULL DEFAULT 'RECEIVED',
      "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
      "subtotalPence" INTEGER NOT NULL DEFAULT 0,
      "discountPence" INTEGER NOT NULL DEFAULT 0,
      "deliveryFeePence" INTEGER NOT NULL DEFAULT 0,
      "vatPence" INTEGER NOT NULL DEFAULT 0,
      "totalPence" INTEGER NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const columns = [
    `"trackingCode" TEXT`,
    `"orderType" "OrderType" NOT NULL DEFAULT 'COLLECTION'`,
    `"tableId" TEXT`,
    `"tableNumber" TEXT`,
    `"customerEmail" TEXT`,
    `"customerPhone" TEXT`,
    `"deliveryNotes" TEXT`,
    `"deliveryAddress" JSONB`,
    `"paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'STRIPE_ONLINE'`,
    `"notes" TEXT`,
    `"scheduledFor" TIMESTAMP(3)`,
    `"promoCode" TEXT`,
    `"stripePaymentIntentId" TEXT`
  ];

  for (const column of columns) {
    await db.$executeRawUnsafe(`ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS ${column};`);
  }

  await db.$executeRawUnsafe(`
    ALTER TABLE "Order"
      ALTER COLUMN "orderType" DROP DEFAULT,
      ALTER COLUMN "paymentMethod" DROP DEFAULT;
  `);

  await db.$executeRawUnsafe(`
    ALTER TABLE "Order"
      ALTER COLUMN "orderType" TYPE "OrderType" USING "orderType"::"OrderType",
      ALTER COLUMN "paymentMethod" TYPE "PaymentMethod" USING "paymentMethod"::"PaymentMethod";
  `);

  await db.$executeRawUnsafe(`
    ALTER TABLE "Order"
      ALTER COLUMN "orderType" SET DEFAULT 'COLLECTION',
      ALTER COLUMN "paymentMethod" SET DEFAULT 'STRIPE_ONLINE';
  `);

  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "OrderItem" (
      "id" TEXT PRIMARY KEY,
      "orderId" TEXT NOT NULL,
      "menuItemId" TEXT,
      "name" TEXT NOT NULL,
      "unitPricePence" INTEGER NOT NULL DEFAULT 0,
      "quantity" INTEGER NOT NULL DEFAULT 1,
      "optionIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
      "optionLabels" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
      "addOnIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
      "notes" TEXT
    );
  `);

  await db.$executeRawUnsafe(`ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "optionLabels" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];`);

  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Payment" (
      "id" TEXT PRIMARY KEY,
      "orderId" TEXT NOT NULL UNIQUE,
      "provider" TEXT NOT NULL DEFAULT 'stripe',
      "providerPaymentId" TEXT,
      "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
      "amountPence" INTEGER NOT NULL DEFAULT 0,
      "rawPayload" JSONB,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Order_trackingCode_key" ON "Order"("trackingCode");`);
  await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Order_orderType_idx" ON "Order"("orderType");`);
  await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Order_status_idx" ON "Order"("status");`);
  await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Order_createdAt_idx" ON "Order"("createdAt");`);
  await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "OrderItem_orderId_idx" ON "OrderItem"("orderId");`);
}

function rowToOrder(row: any, items: CartLine[]): StoredOrder {
  const deliveryAddress =
    typeof row.deliveryAddress === "string" ? JSON.parse(row.deliveryAddress) : row.deliveryAddress ?? null;
  const orderType = (row.orderType ?? (row.fulfilmentType === "DELIVERY" ? "DELIVERY" : "COLLECTION")) as OrderType;
  const customerEmail = row.customerEmail ?? row.email ?? "";
  const customerPhone = row.customerPhone ?? row.phone ?? "";
  const paymentMethod = (row.paymentMethod ?? "STRIPE_ONLINE") as PaymentMethod;
  const paymentStatus = row.paymentStatus as PaymentStatus;
  const orderStatus = row.status as OrderStatus;
  return {
    id: row.id,
    orderNumber: row.orderNumber,
    trackingCode: row.trackingCode,
    orderType,
    tableId: row.tableId,
    tableNumber: row.tableNumber,
    customerName: row.customerName,
    customerPhone,
    customerEmail,
    deliveryAddress,
    items,
    subtotalPence: row.subtotalPence ?? 0,
    deliveryFeePence: row.deliveryFeePence ?? 0,
    discountPence: row.discountPence ?? 0,
    vatPence: row.vatPence ?? 0,
    totalPence: row.totalPence ?? 0,
    paymentMethod,
    paymentStatus,
    orderStatus,
    status: orderStatus,
    notes: row.notes,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt ?? row.createdAt).toISOString(),
    checkout: {
      customerName: row.customerName,
      email: customerEmail,
      phone: customerPhone,
      fulfilmentType: orderTypeToLegacyFulfilment(orderType),
      orderType,
      paymentMethod,
      tableId: row.tableId,
      tableNumber: row.tableNumber,
      addressLine1: deliveryAddress?.line1,
      addressLine2: deliveryAddress?.line2,
      postcode: deliveryAddress?.postcode,
      deliveryNotes: deliveryAddress?.notes,
      promoCode: row.promoCode,
      items
    },
    totals: {
      subtotalPence: row.subtotalPence ?? 0,
      discountPence: row.discountPence ?? 0,
      deliveryFeePence: row.deliveryFeePence ?? 0,
      vatPence: row.vatPence ?? 0,
      totalPence: row.totalPence ?? 0,
      minimumMet: true
    }
  };
}

async function hydrateOrders(rows: any[]) {
  if (!rows.length) return [];
  const orderIds = rows.map((row) => row.id);
  const placeholders = orderIds.map((_, index) => `$${index + 1}`).join(",");
  const itemRows = (await db.$queryRawUnsafe(
    `SELECT * FROM "OrderItem" WHERE "orderId" IN (${placeholders}) ORDER BY "id" ASC`,
    ...orderIds
  )) as any[];
  const itemsByOrder = new Map<string, CartLine[]>();
  for (const item of itemRows) {
    const current = itemsByOrder.get(item.orderId) ?? [];
    current.push({
      menuItemId: item.menuItemId ?? item.id,
      name: item.name,
      unitPricePence: item.unitPricePence,
      quantity: item.quantity,
      optionIds: item.optionIds ?? [],
      optionLabels: item.optionLabels ?? [],
      addOnIds: item.addOnIds ?? [],
      notes: item.notes ?? ""
    });
    itemsByOrder.set(item.orderId, current);
  }
  return rows.map((row) => rowToOrder(row, itemsByOrder.get(row.id) ?? []));
}

export async function createOrder(input: CheckoutInput) {
  await ensureOrderSchema();
  const orderType = normalizeOrderType(input);
  const settings = await readOperationsSettings();
  if (orderType === "DINE_IN" && settings.dineInEnabled === false) throw new Error("Dine-in QR ordering is currently switched off.");
  if (orderType === "COLLECTION" && !settings.pickupEnabled) throw new Error("Collection is currently switched off.");
  if (orderType === "DELIVERY" && !settings.deliveryEnabled) throw new Error("Delivery is currently switched off.");

  const paymentMethod = input.paymentMethod ?? defaultPaymentMethod(orderType);
  if (paymentMethod === "PAY_IN_STORE" && settings.payInStoreEnabled === false) throw new Error("Pay in store is currently switched off.");
  if (paymentMethod === "CASH_ON_COLLECTION" && settings.cashOnCollectionEnabled === false) throw new Error("Cash on collection is currently switched off.");
  if (paymentMethod === "CASH_ON_DELIVERY" && settings.cashOnDeliveryEnabled !== true) throw new Error("Cash on delivery is currently switched off.");
  if (paymentMethod === "STRIPE_ONLINE" && settings.stripeEnabled === false) throw new Error("Online payments are currently switched off.");

  if (!input.items?.length) throw new Error("Cart is empty.");
  if (!input.customerName?.trim()) throw new Error("Customer name is required.");
  if (orderType !== "DINE_IN" && !input.phone?.trim()) throw new Error("Phone number is required.");
  if (orderType === "DINE_IN" && !input.tableNumber?.trim()) throw new Error("Please confirm your table number.");
  if (orderType === "DELIVERY" && (!input.addressLine1?.trim() || !input.postcode?.trim())) throw new Error("Delivery address and postcode are required.");

  const deliveryQuote =
    orderType === "DELIVERY" ? await quoteDelivery(input.postcode ?? "", settings) : { allowed: true, deliveryFeePence: 0 };
  if (!deliveryQuote.allowed) throw new Error(deliveryQuote.reason ?? "This address is outside our delivery radius.");

  const menu = await validateAndLabelCartItems(input.items);
  const fulfilmentType = orderTypeToLegacyFulfilment(orderType);
  const totals = calculatePrice(
    input.items,
    menu.items,
    fulfilmentType,
    input.promoCode,
    0.2,
    settings.minimumOrderPence ?? 1200,
    deliveryQuote.deliveryFeePence ?? 0
  );
  if (orderType !== "DINE_IN" && !totals.minimumMet) throw new Error("Minimum order value has not been met.");

  const id = crypto.randomUUID();
  const number = orderNumber();
  const track = trackingCode();
  const now = new Date();
  const paymentStatus: PaymentStatus = paymentMethod === "PAY_IN_STORE" ? "PENDING_PAYMENT" : "PENDING";
  const deliveryAddress =
    orderType === "DELIVERY"
      ? {
          line1: input.addressLine1,
          line2: input.addressLine2 ?? "",
          postcode: input.postcode,
          notes: input.deliveryNotes ?? ""
        }
      : null;

  await db.$transaction(async (tx: any) => {
    await tx.$executeRawUnsafe(
      `INSERT INTO "Order" (
        "id", "orderNumber", "trackingCode", "orderType", "tableId", "tableNumber", "customerName", "email", "phone",
        "customerEmail", "customerPhone", "fulfilmentType", "deliveryNotes", "deliveryAddress", "scheduledFor", "status",
        "paymentStatus", "subtotalPence", "discountPence", "deliveryFeePence", "vatPence", "totalPence", "promoCode",
        "paymentMethod", "notes", "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4::"OrderType", $5, $6, $7, $8, $9,
        $10, $11, $12::"FulfilmentType", $13, $14::jsonb, $15, $16::"OrderStatus",
        $17::"PaymentStatus", $18, $19, $20, $21, $22, $23,
        $24::"PaymentMethod", $25, $26, $27
      )`,
      id,
      number,
      track,
      orderType,
      input.tableId ?? null,
      input.tableNumber ?? null,
      input.customerName,
      input.email ?? "",
      input.phone ?? "",
      input.email ?? "",
      input.phone ?? "",
      fulfilmentType,
      input.deliveryNotes ?? null,
      JSON.stringify(deliveryAddress),
      input.scheduledFor ? new Date(input.scheduledFor) : null,
      "RECEIVED",
      paymentStatus,
      totals.subtotalPence,
      totals.discountPence,
      totals.deliveryFeePence,
      totals.vatPence,
      totals.totalPence,
      input.promoCode ?? null,
      paymentMethod,
      input.items.map((item) => item.notes).filter(Boolean).join("; ") || null,
      now,
      now
    );

    for (const line of input.items) {
      await tx.$executeRawUnsafe(
        `INSERT INTO "OrderItem" ("id", "orderId", "menuItemId", "name", "unitPricePence", "quantity", "optionIds", "optionLabels", "addOnIds", "notes")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        crypto.randomUUID(),
        id,
        line.menuItemId,
        line.name,
        line.unitPricePence,
        line.quantity,
        line.optionIds ?? [],
        line.optionLabels ?? [],
        line.addOnIds ?? [],
        line.notes ?? null
      );
    }

    await tx.$executeRawUnsafe(
      `INSERT INTO "Payment" ("id", "orderId", "provider", "status", "amountPence", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4::"PaymentStatus", $5, $6, $7)
       ON CONFLICT ("orderId") DO UPDATE SET "status" = EXCLUDED."status", "amountPence" = EXCLUDED."amountPence", "updatedAt" = EXCLUDED."updatedAt"`,
      crypto.randomUUID(),
      id,
      paymentMethod === "STRIPE_ONLINE" ? "stripe" : "offline",
      paymentStatus,
      totals.totalPence,
      now,
      now
    );
  });

  const order = await getOrder(id);
  if (!order) throw new Error("Order could not be created.");
  return order;
}

export async function getOrders(filters: { orderType?: string; status?: string; paymentStatus?: string } = {}) {
  await ensureOrderSchema();
  const where: string[] = [];
  const params: unknown[] = [];
  if (filters.orderType && filters.orderType !== "ALL") {
    params.push(filters.orderType);
    where.push(`"orderType" = $${params.length}::"OrderType"`);
  }
  if (filters.status && filters.status !== "ALL") {
    params.push(filters.status);
    where.push(`"status" = $${params.length}::"OrderStatus"`);
  }
  if (filters.paymentStatus && filters.paymentStatus !== "ALL") {
    params.push(filters.paymentStatus);
    where.push(`"paymentStatus" = $${params.length}::"PaymentStatus"`);
  }
  const rows = (await db.$queryRawUnsafe(
    `SELECT * FROM "Order" ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY "createdAt" DESC LIMIT 200`,
    ...params
  )) as any[];
  return hydrateOrders(rows);
}

export async function getOrder(id: string) {
  await ensureOrderSchema();
  const rows = (await db.$queryRawUnsafe(`SELECT * FROM "Order" WHERE "id" = $1 OR "trackingCode" = $1 LIMIT 1`, id)) as any[];
  const [order] = await hydrateOrders(rows);
  return order;
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  await ensureOrderSchema();
  await db.$executeRawUnsafe(`UPDATE "Order" SET "status" = $1::"OrderStatus", "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $2`, status, id);
  return getOrder(id);
}

export async function updateOrderPaymentStatus(id: string, status: PaymentStatus, providerPaymentId?: string) {
  await ensureOrderSchema();
  await db.$executeRawUnsafe(
    `UPDATE "Order" SET "paymentStatus" = $1::"PaymentStatus", "stripePaymentIntentId" = COALESCE($2, "stripePaymentIntentId"), "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $3`,
    status,
    providerPaymentId ?? null,
    id
  );
  await db.$executeRawUnsafe(
    `UPDATE "Payment" SET "status" = $1::"PaymentStatus", "providerPaymentId" = COALESCE($2, "providerPaymentId"), "updatedAt" = CURRENT_TIMESTAMP WHERE "orderId" = $3`,
    status,
    providerPaymentId ?? null,
    id
  );
  return getOrder(id);
}

export async function updateOrderNotes(id: string, notes: string) {
  await ensureOrderSchema();
  await db.$executeRawUnsafe(`UPDATE "Order" SET "notes" = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $2`, notes, id);
  return getOrder(id);
}

export async function updateOrderItems(id: string, items: CartLine[]) {
  await ensureOrderSchema();
  if (!items.length) throw new Error("Add at least one item before saving.");
  const order = await getOrder(id);
  if (!order) return null;
  if (["COMPLETED", "CANCELLED"].includes(order.status)) throw new Error("Completed or cancelled orders cannot be amended.");

  const menu = await validateAndLabelCartItems(items);
  const totals = calculatePrice(
    items,
    menu.items,
    orderTypeToLegacyFulfilment(order.orderType),
    order.checkout.promoCode,
    0.2,
    0,
    order.deliveryFeePence
  );
  const notes = items.map((item) => item.notes).filter(Boolean).join("; ") || null;

  await db.$transaction(async (tx: any) => {
    await tx.$executeRawUnsafe(`DELETE FROM "OrderItem" WHERE "orderId" = $1`, id);
    for (const line of items) {
      await tx.$executeRawUnsafe(
        `INSERT INTO "OrderItem" ("id", "orderId", "menuItemId", "name", "unitPricePence", "quantity", "optionIds", "optionLabels", "addOnIds", "notes")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        crypto.randomUUID(),
        id,
        line.menuItemId,
        line.name,
        line.unitPricePence,
        line.quantity,
        line.optionIds ?? [],
        line.optionLabels ?? [],
        line.addOnIds ?? [],
        line.notes ?? null
      );
    }
    await tx.$executeRawUnsafe(
      `UPDATE "Order"
       SET "subtotalPence" = $1, "discountPence" = $2, "deliveryFeePence" = $3, "vatPence" = $4, "totalPence" = $5, "notes" = $6, "updatedAt" = CURRENT_TIMESTAMP
       WHERE "id" = $7`,
      totals.subtotalPence,
      totals.discountPence,
      totals.deliveryFeePence,
      totals.vatPence,
      totals.totalPence,
      notes,
      id
    );
    await tx.$executeRawUnsafe(
      `UPDATE "Payment" SET "amountPence" = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE "orderId" = $2`,
      totals.totalPence,
      id
    );
  });

  return getOrder(id);
}

export async function deleteOrder(id: string) {
  await ensureOrderSchema();
  await db.$executeRawUnsafe(`DELETE FROM "OrderItem" WHERE "orderId" = $1`, id);
  await db.$executeRawUnsafe(`DELETE FROM "Payment" WHERE "orderId" = $1`, id);
  await db.$executeRawUnsafe(`DELETE FROM "Order" WHERE "id" = $1`, id);
}
