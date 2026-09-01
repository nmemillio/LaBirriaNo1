# Galeno — plataforma educativa de medicina

Aplicación full-stack (Next.js 16 App Router + Prisma) para cursos de medicina
organizados por semestre → materia → sección → contenido (video/PDF/quiz),
con progreso real, contenido que se desbloquea a tu ritmo, y planes de
suscripción conectados a Stripe.

El nombre **Galeno** hace referencia a Claudio Galeno, el médico de la
antigüedad cuyas enseñanzas definieron la formación médica durante siglos —
un guiño apropiado para una plataforma de educación médica.

Vive como proyecto independiente dentro de este repo, en `plataforma-medica/`,
junto al sitio estático de "LA BIRRIA No 1" en la raíz — son dos aplicaciones
sin relación entre sí.

## Arquitectura

```
Next.js App Router (Node.js runtime, pensado para Vercel)
├── Frontend  — React Server Components + Tailwind v4 (paleta propia, no plantilla)
├── Backend   — Route Handlers + Server Actions (misma app, sin API externa)
├── Auth      — Auth.js v5: credenciales (bcrypt) + Google OAuth opcional
├── DB        — PostgreSQL vía Prisma ORM (mismo motor en dev y producción)
├── Storage   — Vercel Blob (con fallback a disco local solo en dev sin Blob)
│               + subida directa navegador→Blob para no chocar con el
│               límite de payload de las funciones serverless
└── Pagos     — Stripe Checkout + Billing Portal + webhook con verificación
                de firma (el backend nunca confía en el plan que dice el frontend)
```

Decisiones clave:

- **PostgreSQL en dev y en producción, no SQLite.** Vercel corre en
  funciones serverless con filesystem efímero: un archivo `.db` no
  sobrevive entre invocaciones ni se comparte entre instancias. Usar el
  mismo motor en local que en producción también evita sorpresas de
  comportamiento (ej. sensibilidad a mayúsculas en búsquedas).
- **Los archivos van a Vercel Blob, no a disco.** Igual que la base de
  datos, el filesystem de Vercel no sirve para guardar uploads. Los
  videos/PDFs se suben **directo del navegador a Blob** (`@vercel/blob/client`,
  con un token de corta duración emitido por `/api/admin/blob-upload`) para
  no toparse con el límite de ~4.5 MB de body en las funciones serverless de
  Vercel. Sin `BLOB_READ_WRITE_TOKEN` configurada (desarrollo local), cae de
  vuelta a disco bajo `storage/` — ambos casos comparten la misma interfaz
  en `src/lib/storage.ts`.
- **El backend es la única fuente de verdad de acceso.** Cada ruta de
  streaming (`/api/content/[id]/video|document`) revalida sesión,
  suscripción activa y estado de desbloqueo en cada solicitud — no solo al
  cargar la página. Ver `src/lib/stream-guard.ts`.
- **El progreso nunca se guarda como porcentaje fijo.** Se calcula en cada
  consulta a partir del contenido publicado actual vs. lo completado por el
  usuario (`src/lib/progress.ts`), así que si el admin agrega contenido
  nuevo el porcentaje baja solo.
- **Videos/PDFs no son archivos públicos.** Se sirven con soporte de
  `Range` (para el scrubbing del reproductor) detrás de sesión + suscripción
  + un token firmado de 5 minutos. La URL real de Blob nunca llega al
  navegador — todo pasa por nuestras propias rutas `/api/content/...`.
- **Stripe está integrado de verdad, no simulado.** `checkout.session.completed`,
  `customer.subscription.*` e `invoice.*` actualizan la suscripción real en
  la base de datos vía webhook firmado. Sin `STRIPE_SECRET_KEY` configurada,
  los botones de "Suscribirme" para planes de pago muestran un aviso claro
  en vez de fallar; el plan gratuito siempre funciona sin Stripe.
- **Reordenar es con botones ▲▼, no drag-and-drop.** Cumple la misma
  necesidad (el admin define el orden) sin la complejidad de una librería de
  DnD; se puede añadir arrastrar-y-soltar después sin tocar el modelo de datos.

## Modelo de datos

`prisma/schema.prisma` implementa todas las entidades necesarias: `User/
Account/Session` (Auth.js), `Semester → Subject → Section` (auto-relación
para subsecciones) `→ Content`, `VideoAsset/Document/Quiz +
QuizQuestion/QuizAnswer/QuizAttempt`, `ContentProgress`, `ManualUnlock`,
`Comment` (preguntas y respuestas, con `isOfficial`), `VideoView`
(analítica sin inflar vistas — un registro por usuario/contenido), y
`Plan/Subscription/Payment` para Stripe.

## Qué está implementado

- Registro / login con credenciales y Google (Google se activa solo si hay
  `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET`).
- Semestres → materias → secciones (con subsecciones anidadas) → contenido,
  con CRUD completo desde `/admin`: crear, editar, reordenar, publicar/
  ocultar/borrador, eliminar.
- Subida de video y PDF desde el panel admin, directo a Vercel Blob desde el
  navegador (con barra de progreso).
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
  Billing Portal + webhook firmado, listos para producción.

## Qué falta a propósito (siguiente fase, no simulado)

- Preguntas y respuestas debajo del video (el modelo `Comment` ya existe).
- Gráficas de analítica avanzada en el dashboard admin (los datos ya se
  registran en `VideoView`; falta la visualización).
- Verificación de email real (requiere un proveedor de correo).
- Certificados, flashcards, IA de estudio, gamificación.

## Cuentas de prueba (sembradas por el seed)

| Rol        | Correo            | Contraseña      |
| ---------- | ------------------ | --------------- |
| Admin      | admin@gmail.com     | `Oswaldo_2008!` |
| Estudiante | user@gmail.com      | `Oswalfo_2008!` |

## Cómo correr el proyecto en local

Necesitas un PostgreSQL accesible (local o gratis en la nube — ver más abajo).

```bash
cd plataforma-medica
npm install
cp .env.example .env      # ajusta DATABASE_URL y demás secretos
npm run db:migrate        # aplica las migraciones
npm run db:seed           # crea las cuentas de prueba + Semestre 1 de ejemplo
npm run dev
```

Abre http://localhost:3000.

Si no tienes Postgres instalado, la forma más rápida es una base gratuita en
[Neon](https://neon.tech) o [Supabase](https://supabase.com) — copia la
connection string que te den a `DATABASE_URL` en `.env`. También puedes usar
Docker: `docker run -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=galeno -p 5432:5432 postgres:16`.

Sin `BLOB_READ_WRITE_TOKEN` en `.env`, las subidas de video/PDF caen a disco
local automáticamente — no necesitas Vercel Blob para desarrollar.

### Variables de entorno

Ver `.env.example`. Obligatorias: `DATABASE_URL` y `AUTH_SECRET` (genera uno
con `openssl rand -base64 32`). El resto (Google, Stripe, Blob) es opcional
y se activa solo si se configura.

## Desplegar en Vercel

Esta app **no es un sitio estático**: necesita una base de datos Postgres y
almacenamiento de archivos accesibles desde Vercel. Pasos:

1. **Importa el repo en Vercel** ([vercel.com/new](https://vercel.com/new)),
   apuntando al **Root Directory** `plataforma-medica` (no la raíz del repo,
   ahí vive el sitio de la taquería).
2. **Base de datos**: crea un Postgres — la integración nativa de Vercel con
   [Neon](https://vercel.com/marketplace/neon) es la más simple (botón
   "Add" desde la pestaña Storage del proyecto), o pega la connection string
   de tu propio Postgres/Neon/Supabase en `DATABASE_URL`.
3. **Vercel Blob**: pestaña Storage → Create Database → Blob. Al crearlo,
   Vercel agrega `BLOB_READ_WRITE_TOKEN` automáticamente a las variables de
   entorno del proyecto.
4. **Variables de entorno** (Project Settings → Environment Variables),
   además de las que Vercel ya agregó:
   - `AUTH_SECRET` — genera uno con `openssl rand -base64 32`.
   - `CONTENT_SIGNING_SECRET` — otro valor aleatorio distinto al anterior.
   - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
     `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — ver sección de Stripe abajo.
   - `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` — opcional, para login con Google.
   - No hace falta `NEXTAUTH_URL`/`AUTH_URL`: `trustHost: true` hace que
     Auth.js use el dominio real de cada deploy automáticamente.
5. **Deploy.** El comando de build ya incluye `prisma generate`
   (`package.json#scripts.build`); `postinstall` también corre
   `prisma generate` por si Vercel cachea `node_modules`.
6. **Aplica las migraciones contra la base de producción** (Vercel no lo
   hace solo). Desde tu máquina, con `DATABASE_URL` apuntando a la base de
   producción:
   ```bash
   npx prisma migrate deploy
   npm run db:seed   # opcional: crea las cuentas de prueba y el semestre demo
   ```
   (`vercel env pull .env.production.local` trae las variables reales del
   proyecto si prefieres no copiarlas a mano.)

### Conectar Stripe en modo producción

1. En el [Dashboard de Stripe](https://dashboard.stripe.com), activa el modo
   Live (arriba a la derecha) cuando estés listo para cobrar de verdad — usa
   modo Test mientras pruebas el flujo completo.
2. Copia la **Secret key** a `STRIPE_SECRET_KEY` y la **Publishable key** a
   `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
3. Developers → Webhooks → Add endpoint: `https://tu-dominio/api/webhooks/stripe`,
   eventos `checkout.session.completed`, `customer.subscription.created`,
   `customer.subscription.updated`, `customer.subscription.deleted`,
   `invoice.paid`, `invoice.payment_failed`. Copia el **Signing secret** a
   `STRIPE_WEBHOOK_SECRET`.
4. Con eso, el plan Premium ya cobra de verdad: Checkout crea el precio "al
   vuelo" desde los datos del `Plan` en la base de datos (no hace falta
   precrear Productos/Precios en Stripe, aunque puedes guardar un
   `stripePriceId` real por plan desde `npm run db:studio` si prefieres
   gestionar los precios directamente en Stripe).
5. Prueba el flujo end-to-end con una
   [tarjeta de prueba](https://docs.stripe.com/testing) en modo Test antes
   de pasar a Live.

**Nunca compartas tus claves de Stripe por chat ni las commitees al repo** —
van únicamente en las variables de entorno del proyecto en Vercel.

### Notas de seguridad para producción

- Cambia `AUTH_SECRET` y `CONTENT_SIGNING_SECRET` por valores aleatorios
  reales — los del `.env` de ejemplo son solo para desarrollo.
- Restringe el acceso a tu base de datos de producción (IP allowlist o el
  pooler que ofrezca tu proveedor de Postgres).
- El rate limiting y los backups de base de datos dependen del proveedor de
  Postgres que elijas (Neon/Supabase/RDS ofrecen backups automáticos).
