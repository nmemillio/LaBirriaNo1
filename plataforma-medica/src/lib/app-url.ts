/**
 * Origen absoluto de la app a partir de la propia petición — así los
 * redirects de Stripe funcionan igual en producción, en cada preview
 * deploy de Vercel y en local, sin depender de una URL fija en variables
 * de entorno.
 */
export function getAppUrl(req: Request) {
  const url = new URL(req.url);
  const proto = req.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? url.host;
  return `${proto}://${host}`;
}
