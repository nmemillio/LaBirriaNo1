import { signOut } from "@/auth";
import { LogOutIcon } from "@/components/icons";

export function SignOutButton({ className }: { className?: string }) {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/" });
      }}
    >
      <button type="submit" className={className ?? "btn-ghost"} aria-label="Cerrar sesión">
        <LogOutIcon className="h-4 w-4" />
        <span className="hidden sm:inline">Cerrar sesión</span>
      </button>
    </form>
  );
}
