import Link from "next/link";
import type { SectionNode, ContentState } from "@/lib/content-tree";

const typeIcon: Record<string, string> = { VIDEO: "▶", PDF: "📄", QUIZ: "📝" };

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
              <StatusIcon locked={locked} status={status} typeGlyph={typeIcon[content.type]} />
              <span className={`flex-1 ${locked ? "text-ink-300" : isActive ? "font-semibold text-brand-800" : "text-ink-900"}`}>
                {content.title}
              </span>
              {status === "COMPLETED" && !locked && <span className="text-xs text-brand-600">✓</span>}
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

function StatusIcon({ locked, status, typeGlyph }: { locked: boolean; status: string; typeGlyph: string }) {
  if (locked) return <span className="w-5 text-center text-ink-300">🔒</span>;
  if (status === "COMPLETED") {
    return <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[10px] text-white">✓</span>;
  }
  return <span className="w-5 text-center text-ink-500">{typeGlyph}</span>;
}
