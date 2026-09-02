import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { userHasActiveAccess } from "@/lib/access";
import { loadSubjectTree, computeContentStates } from "@/lib/content-tree";
import { verifyContentToken } from "@/lib/content-token";

type Kind = "video" | "document";

type AuthResult =
  | { ok: true; content: NonNullable<Awaited<ReturnType<typeof loadContent>>> }
  | { ok: false; status: number; message: string };

async function loadContent(contentId: string) {
  return prisma.content.findUnique({
    where: { id: contentId },
    include: {
      section: { include: { subject: true } },
      video: true,
      document: true,
    },
  });
}

/**
 * Verifica, en cada solicitud a los endpoints de streaming, que:
 *  1. Hay una sesión válida.
 *  2. El token firmado de corta duración corresponde a este usuario/contenido.
 *  3. El usuario tiene una suscripción activa (verificado en el backend, no
 *     en el frontend — punto 17/18 del brief).
 *  4. El contenido está publicado y desbloqueado para este usuario.
 * Los administradores tienen bypass para poder previsualizar cualquier
 * contenido, incluido el que está en borrador.
 */
export async function authorizeContentAccess(
  contentId: string,
  kind: Kind,
  token: string | null,
): Promise<AuthResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, status: 401, message: "No autenticado." };

  const content = await loadContent(contentId);
  if (!content) return { ok: false, status: 404, message: "Contenido no encontrado." };
  if (kind === "video" && !content.video) return { ok: false, status: 404, message: "Video no encontrado." };
  if (kind === "document" && !content.document) return { ok: false, status: 404, message: "Documento no encontrado." };

  const isAdmin = session.user.role === "ADMIN";
  if (isAdmin) return { ok: true, content };

  if (content.status !== "PUBLISHED") {
    return { ok: false, status: 403, message: "Este contenido no está publicado." };
  }

  const decoded = verifyContentToken(token ?? "");
  if (!decoded || decoded.contentId !== contentId || decoded.userId !== session.user.id || decoded.kind !== kind) {
    return { ok: false, status: 403, message: "Enlace inválido o expirado." };
  }

  const hasAccess = await userHasActiveAccess(session.user.id);
  if (!hasAccess) {
    return { ok: false, status: 402, message: "Este contenido requiere una suscripción activa." };
  }

  const tree = await loadSubjectTree(content.section.subjectId);
  const states = await computeContentStates(session.user.id, content.section.subject.unlockMode, tree);
  const state = states.get(contentId);
  if (!state || state.locked) {
    return { ok: false, status: 423, message: "Este contenido todavía está bloqueado." };
  }

  return { ok: true, content };
}
