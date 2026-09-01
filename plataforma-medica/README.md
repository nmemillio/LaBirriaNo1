# Medicación — plataforma educativa de medicina

Aplicación full-stack (Next.js 16 App Router + Prisma) para cursos de medicina
organizados por semestre → materia → sección → contenido (video/PDF/quiz),
con progreso real, contenido que se desbloquea a tu ritmo, y planes de
suscripción listos para conectarse a Stripe.

Vive como proyecto independiente dentro de este repo, en `plataforma-medica/`,
junto al sitio estático de "LA BIRRIA No 1" en la raíz — son dos aplicaciones
sin relación entre sí.

## Arquitectura

```
Next.js App Router (Node.js runtime)
├── Frontend  — React Server Components + Tailwind v4 (paleta propia, no plantilla)
├── Backend   — Route Handlers + Server Actions (misma app, sin API externa)
├── Auth      — Auth.js v5: credenciales (bcrypt) + Google OAuth opcional
├── DB        — Prisma ORM · SQLite en desarrollo, Postgres recomendado en prod
├── Storage   — Disco local fuera de /public, servido por rutas protegidas
│               con Range requests + tokens firmados de 5 min (JWT)
└── Pagos     — Stripe Checkout + Billing Portal + webhook con verificación
                de firma (el backend nunca confía en el plan que dice el frontend)
```

Decisiones clave:

- **El backend es la única fuente de verdad de acceso.** Cada ruta de
  streaming (`/api/content/[id]/video|document`) revalida sesión,
  suscripción activa y estado de desbloqueo en cada solicitud — no solo al
  cargar la página. Ver `src/lib/stream-guard.ts`.
- **El progreso nunca se guarda como porcentaje fijo.** Se calcula en cada
  consulta a partir del contenido publicado actual vs. lo completado por el
  usuario (`src/lib/progress.ts`), así que si el admin agrega contenido
  nuevo el porcentaje baja solo, como pide el punto 8 del brief.
- **Videos/PDFs no son archivos públicos.** Viven en `storage/` (fuera de
  `public/`) y se sirven con soporte de `Range` (para el scrubbing del
  reproductor) detrás de sesión + suscripción + token firmado de corta
  duración. No es imposible descargarlos con herramientas externas (nada en
  la web lo es), pero no hay una URL pública y permanente a un archivo.
- **Stripe está scaffoldeado, no simulado.** `checkout.session.completed`,
  `customer.subscription.*` e `invoice.*` actualizan la suscripción real en
  la base de datos vía webhook firmado. Sin `STRIPE_SECRET_KEY` configurada,
  los botones de "Suscribirme" para planes de pago muestran un aviso claro
  en vez de fallar; el plan gratuito siempre funciona sin Stripe.
- **Reordenar es con botones ▲▼, no drag-and-drop.** Cumple la misma
  necesidad (el admin define el orden) sin la complejidad de una librería de
  DnD; se puede añadir arrastrar-y-soltar después sin tocar el modelo de datos
  (el campo `order` ya existe en semestres, materias, secciones y contenido).

## Modelo de datos

`prisma/schema.prisma` implementa todas las entidades del punto 25 del
brief: `User/Account/Session` (Auth.js), `Semester → Subject → Section
(auto-relación para subsecciones) → Content`, `VideoAsset/Document/Quiz +
QuizQuestion/QuizAnswer/QuizAttempt`, `ContentProgress`, `ManualUnlock`,
`Comment` (preguntas y respuestas, con `isOfficial`), `VideoView`
(analítica sin inflar vistas — un registro por usuario/contenido), y
`Plan/Subscription/Payment` para Stripe.

## Qué está implementado (Fase 1 + partes de Fase 2 y 3)

- Registro / login con credenciales y Google (Google se activa solo si hay
  `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET`).
- Semestres → materias → secciones (con subsecciones anidadas) → contenido,
  con CRUD completo desde `/admin`: crear, editar, reordenar, publicar/
  ocultar/borrador, eliminar.
- Subida de video y PDF desde el panel admin (a `storage/`, no a `public/`).
- Reproductor de video propio (play/pause, barra de progreso, volumen,
  velocidad, pantalla completa, tiempo/duración) que reporta avance real.
- Un video se marca "completado" solo al superar el umbral configurable por
  el admin (90% por defecto) — nunca solo por abrirlo.
- Desbloqueo secuencial / libre / manual por materia, con candados visibles
  y desbloqueo manual auditado (usuario, contenido, admin, fecha, motivo)
  desde `/admin/usuarios/[id]`.
- Quizzes con preguntas/respuestas, calificación mínima, intentos limitados
  y desbloqueo del siguiente contenido al aprobar.
- Progreso general / por semestre / por materia, recalculado siempre en vivo.
- Panel de administración: dashboard con métricas reales, gestión de
  usuarios (buscar, ver progreso, suspender/reactivar, cambiar plan,
  desbloquear contenido).
- Planes (Gratuito/Premium, mismas ventajas por ahora) + Stripe Checkout +
  Billing Portal + webhook firmado.

## Qué falta a propósito (siguiente fase, no simulado)

- Preguntas y respuestas debajo del video (el modelo `Comment` ya existe).
- Gráficas de analítica avanzada en el dashboard admin (los datos ya se
  registran en `VideoView`; falta la visualización).
- Verificación de email real (requiere un proveedor de correo).
- Certificados, flashcards, IA de estudio, gamificación (Fase 4 del brief).

## Cuentas de prueba (sembradas por el seed)

| Rol        | Correo            | Contraseña      |
| ---------- | ------------------ | --------------- |
| Admin      | admin@gmail.com     | `Oswaldo_2008!` |
| Estudiante | user@gmail.com      | `Oswalfo_2008!` |

## Cómo correr el proyecto

```bash
cd plataforma-medica
npm install
cp .env.example .env      # ajusta los secretos si vas a usar Google/Stripe
npm run db:migrate        # crea prisma/dev.db (SQLite)
npm run db:seed           # crea las cuentas de prueba + Semestre 1 de ejemplo
npm run dev
```

Abre http://localhost:3000.

### Variables de entorno

Ver `.env.example`. Ninguna es obligatoria salvo `DATABASE_URL` y
`AUTH_SECRET` (ya vienen con valores de desarrollo) — Google y Stripe son
opcionales y se activan solo si se configuran.

### Conectar Stripe de verdad

1. Crea los productos/precios en el Dashboard de Stripe (o deja que la app
   los cree "al vuelo" con `price_data`, como hace ahora).
2. Define `STRIPE_SECRET_KEY` y `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
3. Apunta un webhook a `/api/webhooks/stripe` con los eventos
   `checkout.session.completed`, `customer.subscription.*`, `invoice.*`, y
   copia el signing secret a `STRIPE_WEBHOOK_SECRET`.
4. Opcionalmente, guarda el `stripePriceId` real en cada `Plan` desde
   Prisma Studio (`npm run db:studio`) para dejar de usar `price_data`
   dinámico.

### Producción

- Cambia `DATABASE_URL` a Postgres (el schema es compatible; solo hay que
  correr `prisma migrate deploy` contra la nueva base).
- Reemplaza `src/lib/storage.ts` por un cliente de S3/R2/GCS — el resto de
  la app (rutas de streaming, tokens firmados) no cambia.
- Sirve la app en un host con soporte de servidor Node (Vercel, Railway,
  Render, etc.) — no es un sitio estático.
