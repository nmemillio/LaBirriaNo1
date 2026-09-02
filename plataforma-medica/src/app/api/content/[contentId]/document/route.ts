import { NextRequest, NextResponse } from "next/server";
import { authorizeContentAccess } from "@/lib/stream-guard";
import { guessContentType } from "@/lib/storage";
import { streamStoredFile } from "@/lib/stream-file";

export async function GET(req: NextRequest, { params }: { params: Promise<{ contentId: string }> }) {
  const { contentId } = await params;
  const token = req.nextUrl.searchParams.get("t");

  const result = await authorizeContentAccess(contentId, "document", token);
  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: result.status });
  }

  const doc = result.content.document!;
  return streamStoredFile(doc.storageKey, guessContentType(doc.fileName), req.headers.get("range"), {
    "Content-Disposition": `inline; filename="${doc.fileName.replace(/"/g, "")}"`,
  });
}
