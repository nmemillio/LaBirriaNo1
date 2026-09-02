import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { authorizeContentAccess } from "@/lib/stream-guard";
import { markContentViewed } from "@/lib/progress";

export async function POST(req: NextRequest, { params }: { params: Promise<{ contentId: string }> }) {
  const { contentId } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const token = body?.token as string | null;

  const result = await authorizeContentAccess(contentId, "document", token ?? null);
  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: result.status });
  }

  await markContentViewed(session.user.id, contentId);
  return NextResponse.json({ status: "COMPLETED" });
}
