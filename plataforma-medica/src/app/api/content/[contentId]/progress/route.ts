import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { authorizeContentAccess } from "@/lib/stream-guard";
import { recordVideoProgress } from "@/lib/progress";

export async function POST(req: NextRequest, { params }: { params: Promise<{ contentId: string }> }) {
  const { contentId } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const token = body?.token as string | null;

  const result = await authorizeContentAccess(contentId, "video", token ?? null);
  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: result.status });
  }

  const watchedSeconds = Number(body?.watchedSeconds ?? 0);
  const watchedPercent = Number(body?.watchedPercent ?? 0);
  if (!Number.isFinite(watchedSeconds) || !Number.isFinite(watchedPercent)) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }

  const progress = await recordVideoProgress(session.user.id, contentId, watchedSeconds, watchedPercent);
  return NextResponse.json({ status: progress.status, watchedPercent: progress.watchedPercent });
}
