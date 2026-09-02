import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Los uploads de video/PDF (punto 5, 11 y 27) pasan por server actions.
      // En producción, con almacenamiento en disco local esto debe ajustarse
      // al tamaño máximo real que se planea aceptar (o migrarse a subida
      // directa a un bucket S3/R2 con URL prefirmada para archivos grandes).
      bodySizeLimit: "500mb",
    },
  },
};

export default nextConfig;
