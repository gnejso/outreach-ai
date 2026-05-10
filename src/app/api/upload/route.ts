import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { parseSpreadsheet, getColumns } from "@/lib/spreadsheet";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const rows = parseSpreadsheet(buffer);
  const columns = getColumns(rows);

  return NextResponse.json({ rows: rows.slice(0, 1000), columns });
}
