export const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Borrador" },
  { value: "PUBLISHED", label: "Publicado" },
  { value: "HIDDEN", label: "Oculto" },
];

export const STATUS_BADGE_CLASS: Record<string, string> = {
  DRAFT: "badge-muted",
  PUBLISHED: "badge-brand",
  HIDDEN: "badge-accent",
};

export const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Borrador",
  PUBLISHED: "Publicado",
  HIDDEN: "Oculto",
};

export const UNLOCK_MODE_OPTIONS = [
  { value: "SEQUENTIAL", label: "Secuencial" },
  { value: "FREE", label: "Libre" },
  { value: "MANUAL", label: "Manual" },
];

export const CONTENT_TYPE_LABEL: Record<string, string> = {
  VIDEO: "Video",
  PDF: "PDF",
  QUIZ: "Quiz",
};
