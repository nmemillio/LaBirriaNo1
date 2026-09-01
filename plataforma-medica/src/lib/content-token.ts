import jwt from "jsonwebtoken";

const SECRET = process.env.CONTENT_SIGNING_SECRET ?? "dev-only-content-secret-change-me";
const TOKEN_TTL_SECONDS = 5 * 60; // URL firmada de corta duración (punto 6 y 26)

export type ContentTokenPayload = {
  contentId: string;
  userId: string;
  kind: "video" | "document";
};

export function signContentToken(payload: ContentTokenPayload) {
  return jwt.sign(payload, SECRET, { expiresIn: TOKEN_TTL_SECONDS });
}

export function verifyContentToken(token: string): ContentTokenPayload | null {
  try {
    const decoded = jwt.verify(token, SECRET) as ContentTokenPayload & { iat: number; exp: number };
    return { contentId: decoded.contentId, userId: decoded.userId, kind: decoded.kind };
  } catch {
    return null;
  }
}
