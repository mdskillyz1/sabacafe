import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { describeMenuDatabaseError, menuDatabaseConfigured, readMenuStore, writeMenuStore, type MenuStore } from "@/lib/menuStore";
import { adminSessionFromRequest } from "@/lib/adminSession";
import { logAdminActivity } from "@/lib/eventStore";
import { menuCategories } from "@saba/shared";

function revalidateMenuPages() {
  revalidatePath("/");
  revalidatePath("/menu");
  revalidatePath("/order");
  revalidatePath("/admin/menu");
}

export async function GET() {
  try {
    const store = await readMenuStore();
    return NextResponse.json({
      ...store,
      setup: {
        databaseConfigured: menuDatabaseConfigured(),
        saveEnabled: menuDatabaseConfigured(),
        message: menuDatabaseConfigured()
          ? null
          : "Menu saving needs a PostgreSQL DATABASE_URL. Add it in Vercel, run ./tools/pnpm db:push, then redeploy."
      }
    });
  } catch (error) {
    const description = describeMenuDatabaseError(error);
    return NextResponse.json({
      published: false,
      updatedAt: new Date().toISOString(),
      categories: menuCategories,
      items: [],
      error: description.message,
      detail: description.detail,
      setup: {
        databaseConfigured: menuDatabaseConfigured(),
        saveEnabled: false,
        message: description.message
      }
    });
  }
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
    const description = describeMenuDatabaseError(error);
    return NextResponse.json({ error: description.message, detail: description.detail, code: description.code }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const store = await readMenuStore();
  const item = await request.json();
  const saved = await writeMenuStore({ ...store, published: false, items: [item, ...store.items] });
  revalidateMenuPages();
  return NextResponse.json(saved, { status: 201 });
}
