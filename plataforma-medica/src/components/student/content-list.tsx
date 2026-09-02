import Link from "next/link";
import type { SectionNode, ContentState } from "@/lib/content-tree";
import { LockIcon, CheckIcon, PlayIcon, FileTextIcon, QuizIcon } from "@/components/icons";
import type { ComponentType } from "react";

const typeIcon: Record<string, ComponentType<{ className?: string }>> = {
  VIDEO: PlayIcon,
  PDF: FileTextIcon,
  QUIZ: QuizIcon,
};

export function ContentList({
  subjectId,
  tree,
  states,
  activeContentId,
}: {
  subjectId: string;
  tree: SectionNode[];
  states: Map<string, ContentState>;
  activeContentId: string | null;
}) {
  return (
    <nav className="card divide-y divide-border-soft overflow-hidden">
      {tree.map((section) => (
        <SectionBlock key={section.id} subjectId={subjectId} section={section} states={states} activeContentId={activeContentId} depth={0} />
      ))}
    </nav>
  );
}

function SectionBlock({
  subjectId,
  section,
  states,
  activeContentId,
  depth,
}: {
  subjectId: string;
  section: SectionNode;
  states: Map<string, ContentState>;
  activeContentId: string | null;
  depth: number;
}) {
  return (
    <div>
      <p
        className="bg-surface-muted px-4 py-2 text-xs font-semibold uppercase tracking-wide text-ink-500"
        style={{ paddingLeft: `${16 + depth * 16}px` }}
      >
        {section.title}
      </p>
      <ul className="divide-y divide-border-soft">
        {section.contents.map((content) => {
          const state = states.get(content.id);
          const locked = state?.locked ?? true;
          const status = state?.status ?? "NOT_STARTED";
          const isActive = content.id === activeContentId;

          const body = (
            <div
              className={`flex items-center gap-3 px-4 py-3 text-sm ${isActive ? "bg-brand-50" : "hover:bg-surface-muted"}`}
              style={{ paddingLeft: `${16 + depth * 16}px` }}
            >
              <StatusIcon locked={locked} status={status} TypeGlyph={typeIcon[content.type]} />
              <span className={`flex-1 ${locked ? "text-ink-300" : isActive ? "font-semibold text-brand-800" : "text-ink-900"}`}>
                {content.title}
              </span>
              {status === "COMPLETED" && !locked && <CheckIcon className="h-3.5 w-3.5 shrink-0 text-brand-600" />}
            </div>
          );

          return (
            <li key={content.id}>
              {locked ? (
                <div className="cursor-not-allowed opacity-70">{body}</div>
              ) : (
                <Link href={`/app/materias/${subjectId}?item=${content.id}`}>{body}</Link>
              )}
            </li>
          );
        })}
      </ul>
      {section.children.map((child) => (
        <SectionBlock key={child.id} subjectId={subjectId} section={child} states={states} activeContentId={activeContentId} depth={depth + 1} />
      ))}
    </div>
  );
}

function StatusIcon({
  locked,
  status,
  TypeGlyph,
}: {
  locked: boolean;
  status: string;
  TypeGlyph: ComponentType<{ className?: string }>;
}) {
  if (locked) {
    return (
      <span className="flex h-5 w-5 shrink-0 items-center justify-center text-ink-300">
        <LockIcon className="h-3.5 w-3.5" />
      </span>
    );
  }
  if (status === "COMPLETED") {
    return (
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white">
        <CheckIcon className="h-3 w-3" />
      </span>
    );
  }
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center text-ink-500">
      <TypeGlyph className="h-3.5 w-3.5" />
    </span>
  );
}
