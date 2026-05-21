import { NextResponse } from "next/server";
import { getMenu } from "@/lib/data";
import { menuCategories } from "@saba/shared";
import { describeMenuDatabaseError } from "@/lib/menuStore";

export async function GET(request: Request) {
  const acceptHeader = request.headers.get("accept") ?? "";

  if (acceptHeader.includes("text/html") && !acceptHeader.includes("application/json")) {
    return NextResponse.redirect(new URL("/menu", request.url));
  }

  try {
    return NextResponse.json(await getMenu());
  } catch (error) {
    console.error("Public menu load failed", error);
    const description = describeMenuDatabaseError(error);
    return NextResponse.json(
      {
        categories: menuCategories,
        items: [],
        published: false,
        error: description.message,
        code: description.code
      },
      { status: 503 }
    );
  }
}
