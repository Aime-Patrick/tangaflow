import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";

export async function POST() {
  try {
    await destroySession();

    const response = NextResponse.json({ success: true });
    response.headers.set(
      "Set-Cookie",
      `session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${
        process.env.NODE_ENV === "production" ? "; Secure" : ""
      }`
    );

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Failed to logout" }, { status: 500 });
  }
}
