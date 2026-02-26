import { NextResponse } from "next/server";
import { loadGEHCSnapshot } from "@/lib/edgar";

export async function GET() {
  const snapshot = loadGEHCSnapshot();
  if (!snapshot) return NextResponse.json(null);
  return NextResponse.json(snapshot);
}
