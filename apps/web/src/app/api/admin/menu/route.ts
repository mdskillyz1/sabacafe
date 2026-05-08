import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { readMenuStore, writeMenuStore, type MenuStore } from "@/lib/menuStore";
import { adminSessionFromRequest } from "@/lib/adminSession";
import { logAdminActivity } from "@/lib/eventStore";

function revalidateMenuPages() {
  revalidatePath("/");
  revalidatePath("/menu");
  revalidatePath("/order");
  revalidatePath("/admin/menu");
}

export async function GET() {
  return NextResponse.json(await readMenuStore());
}

export async function PUT(request: Request) {
  try {
    const input = (await request.json()) as MenuStore;
    const saved = await writeMenuStore(input);
    revalidateMenuPages();
    await logAdminActivity({
      type: "menu_update",
      message: `Menu ${input.published ? "published" : "draft saved"} with ${saved.items.length} item${saved.items.length === 1 ? "" : "s"}`,
      session: adminSessionFromRequest(request)
    });
    return NextResponse.json(saved);
  } catch (error) {
    console.error("Menu save failed", error);
    return NextResponse.json({ error: "Menu could not be saved. Please check the database connection and try again." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const store = await readMenuStore();
  const item = await request.json();
  const saved = await writeMenuStore({ ...store, published: false, items: [item, ...store.items] });
  revalidateMenuPages();
  return NextResponse.json(saved, { status: 201 });
}
