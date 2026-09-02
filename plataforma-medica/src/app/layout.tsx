import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Fraunces } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: {
    default: "Galeno | Plataforma educativa de medicina",
    template: "%s | Galeno",
  },
  description:
    "Aprende medicina por semestres con video clases, PDFs y quizzes. Progreso real, contenido desbloqueado a tu ritmo.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf7ee" },
    { media: "(prefers-color-scheme: dark)", color: "#14120d" },
  ],
};

// Aplica el tema guardado antes del primer pintado, para no mostrar un
// parpadeo claro→oscuro al cargar. Solo toca el atributo cuando el usuario
// eligió explícitamente un tema; si no, manda la preferencia del sistema
// (ya cubierta por CSS puro en globals.css).
const themeInitScript = `(function(){try{var t=localStorage.getItem('galeno-theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${jakarta.variable} ${fraunces.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
