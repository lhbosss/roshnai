import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ ok: true, message: "send placeholder" }, { status: 200 });
}
