import Link from "next/link";

const steps = [
  {
    title: "Elige tu semestre",
    body: "Navega el temario organizado por semestre, materia y sección — igual que tu plan de estudios.",
  },
  {
    title: "Mira, lee y practica",
    body: "Video clases en un reproductor propio, apuntes en PDF y quizzes para reforzar cada tema.",
  },
  {
    title: "Avanza a tu ritmo",
    body: "El siguiente tema se desbloquea cuando completas el anterior. Tu progreso se actualiza en tiempo real.",
  },
];

const features = [
  {
    title: "Video clases protegidas",
    body: "Reproductor propio con velocidad, calidad y pantalla completa. Contenido protegido, no un simple link a un archivo.",
  },
  {
    title: "Progreso real, no inflado",
    body: "Un video cuenta como visto solo al alcanzar el porcentaje que define el profesor — nunca solo por abrirlo.",
  },
  {
    title: "Contenido desbloqueado a tu ritmo",
    body: "Modo secuencial, libre o desbloqueo manual por el profesor, según cómo esté diseñada cada materia.",
  },
  {
    title: "Material descargable",
    body: "Apuntes en PDF por sección, disponibles únicamente para estudiantes con acceso a esa materia.",
  },
  {
    title: "Quizzes por tema",
    body: "Evalúa lo aprendido antes de avanzar, con retroalimentación y calificación mínima configurable.",
  },
  {
    title: "Preguntas y respuestas",
    body: "Pregunta debajo de cada video y recibe respuestas marcadas como oficiales por tus profesores.",
  },
];

export default function LandingPage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-x-0 -top-32 -z-10 h-[560px]"
          style={{
            background:
              "radial-gradient(60% 60% at 50% 0%, var(--brand-100) 0%, transparent 70%)",
          }}
          aria-hidden
        />
        <div className="container-page grid gap-12 py-16 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-28">
          <div>
            <span className="badge-brand">Plataforma educativa de medicina</span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight text-ink-900 sm:text-5xl lg:text-[3.25rem]">
              Estudia medicina con un temario que avanza contigo.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-700">
              Video clases, apuntes y quizzes organizados por semestre y materia, con progreso
              real y contenido que se desbloquea conforme avanzas — como un curso pensado para
              acompañarte todo el semestre, no una carpeta de archivos sueltos.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/registro" className="btn-primary px-6 py-3 text-base">
                Comenzar gratis
              </Link>
              <Link href="/precios" className="btn-outline px-6 py-3 text-base">
                Ver planes
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-ink-500">
              <span>Sin tarjeta para el plan gratuito</span>
              <span className="h-1 w-1 rounded-full bg-ink-300" aria-hidden />
              <span>Organizado por semestre</span>
              <span className="h-1 w-1 rounded-full bg-ink-300" aria-hidden />
              <span>Progreso siempre actualizado</span>
            </div>
          </div>

          <HeroMock />
        </div>
      </section>

      <section className="border-y border-border-soft bg-surface-muted/60">
        <div className="container-page py-16 sm:py-20">
          <div className="max-w-2xl">
            <p className="badge-accent">Cómo funciona</p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink-900">
              Tres pasos, un solo lugar para estudiar.
            </h2>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {steps.map((step, i) => (
              <div key={step.title} className="card p-6">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                  {i + 1}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-ink-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-16 sm:py-20">
        <div className="max-w-2xl">
          <p className="badge-brand">Qué incluye</p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink-900">
            Todo lo que necesitas para avanzar en el semestre.
          </h2>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="card p-6">
              <h3 className="text-base font-semibold text-ink-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-brand-900">
        <div className="container-page flex flex-col items-start gap-6 py-16 text-white sm:flex-row sm:items-center sm:justify-between sm:py-20">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Empieza con el semestre 1, sin costo.
            </h2>
            <p className="mt-2 max-w-md text-brand-100">
              Crea tu cuenta y entra directo al temario. Puedes revisar los planes cuando quieras.
            </p>
          </div>
          <Link href="/registro" className="btn-accent px-6 py-3 text-base">
            Crear mi cuenta
          </Link>
        </div>
      </section>
    </>
  );
}

function HeroMock() {
  const items = [
    { label: "Introducción y terminología anatómica", state: "done" as const },
    { label: "Sistema óseo", state: "active" as const },
    { label: "Sistema muscular", state: "locked" as const },
    { label: "Quiz — Terminología anatómica", state: "locked" as const },
  ];

  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border-soft bg-surface-muted px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-accent-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-brand-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-ink-300" />
          <span className="ml-2 text-xs font-medium text-ink-500">Semestre 1 · Anatomía</span>
        </div>
        <div className="aspect-video w-full bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 p-5">
          <div className="flex h-full flex-col justify-between">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">▶ Reproduciendo</span>
            <div>
              <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-white/25">
                <div className="h-full w-2/3 rounded-full bg-white" />
              </div>
              <div className="flex items-center justify-between text-xs text-white/80">
                <span>Sistema óseo</span>
                <span>04:12 / 06:30</span>
              </div>
            </div>
          </div>
        </div>
        <ul className="divide-y divide-border-soft">
          {items.map((item) => (
            <li key={item.label} className="flex items-center gap-3 px-4 py-3">
              <StatusDot state={item.state} />
              <span
                className={`flex-1 text-sm ${
                  item.state === "locked" ? "text-ink-300" : "text-ink-900"
                }`}
              >
                {item.label}
              </span>
              {item.state === "done" && <span className="text-xs font-semibold text-brand-600">✓</span>}
            </li>
          ))}
        </ul>
        <div className="border-t border-border-soft px-4 py-3">
          <div className="flex items-center justify-between text-xs font-medium text-ink-500">
            <span>Progreso de Anatomía</span>
            <span>68%</span>
          </div>
          <div className="progress-track mt-2">
            <div className="progress-fill" style={{ width: "68%" }} />
          </div>
        </div>
      </div>
      <div className="absolute -right-6 -top-6 -z-10 hidden h-40 w-40 rounded-full bg-accent-100 sm:block" />
      <div className="absolute -bottom-8 -left-8 -z-10 hidden h-32 w-32 rounded-full bg-brand-100 sm:block" />
    </div>
  );
}

function StatusDot({ state }: { state: "done" | "active" | "locked" }) {
  if (state === "done") {
    return <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-[10px] text-white">✓</span>;
  }
  if (state === "active") {
    return <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-500 text-[10px] text-white">▶</span>;
  }
  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-muted text-[10px] text-ink-300">
      🔒
    </span>
  );
}
