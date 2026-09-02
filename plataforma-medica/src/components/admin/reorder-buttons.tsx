import { ChevronUpIcon, ChevronDownIcon } from "@/components/icons";

export function ReorderButtons({
  moveUpAction,
  moveDownAction,
  disableUp,
  disableDown,
}: {
  moveUpAction: () => Promise<void>;
  moveDownAction: () => Promise<void>;
  disableUp: boolean;
  disableDown: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <form action={moveUpAction}>
        <button
          type="submit"
          disabled={disableUp}
          aria-label="Mover arriba"
          className="btn-ghost px-1.5 py-0.5 disabled:opacity-30"
        >
          <ChevronUpIcon className="h-3.5 w-3.5" />
        </button>
      </form>
      <form action={moveDownAction}>
        <button
          type="submit"
          disabled={disableDown}
          aria-label="Mover abajo"
          className="btn-ghost px-1.5 py-0.5 disabled:opacity-30"
        >
          <ChevronDownIcon className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
}
