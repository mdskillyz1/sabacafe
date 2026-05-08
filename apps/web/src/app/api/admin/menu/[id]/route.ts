import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { readMenuStore, writeMenuStore } from "@/lib/menuStore";

function revalidateMenuPages() {
  revalidatePath("/");
  revalidatePath("/menu");
  revalidatePath("/order");
  revalidatePath("/admin/menu");
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const patch = await request.json();
  const store = await readMenuStore();
  const nextItems = store.items.map((item) => (item.id === id ? { ...item, ...patch } : item));
  if (!nextItems.some((item) => item.id === id)) {
    return NextResponse.json({ error: "Menu item not found." }, { status: 404 });
  }
  const saved = await writeMenuStore({ ...store, published: false, items: nextItems });
  revalidateMenuPages();
  return NextResponse.json(saved);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = await readMenuStore();
  const saved = await writeMenuStore({ ...store, published: false, items: store.items.filter((item) => item.id !== id) });
  revalidateMenuPages();
  return NextResponse.json(saved);
}
