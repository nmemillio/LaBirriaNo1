import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getProgressSummary } from "@/lib/progress";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { toggleSuspend } from "./actions";

export const metadata: Metadata = { title: "Admin · Usuarios" };

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const users = await prisma.user.findMany({
    where: q
      ? { OR: [{ name: { contains: q } }, { email: { contains: q } }] }
      : {},
    orderBy: { createdAt: "desc" },
    include: { subscriptions: { include: { plan: true }, orderBy: { updatedAt: "desc" }, take: 1 } },
  });

  const usersWithProgress = await Promise.all(
    users.map(async (u) => ({ user: u, progress: await getProgressSummary(u.id) })),
  );

  return (
    <div className="container-page py-8">
      <h1 className="text-2xl font-bold text-ink-900">Usuarios</h1>

      <form className="card mt-6 flex gap-2 p-4" action="/admin/usuarios">
        <input className="input" type="text" name="q" placeholder="Buscar por nombre o correo" defaultValue={q ?? ""} />
        <button type="submit" className="btn-outline">Buscar</button>
      </form>

      <div className="card mt-6 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-border-soft text-xs uppercase tracking-wide text-ink-500">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Progreso</th>
              <th className="px-4 py-3">Registro</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border-soft">
            {usersWithProgress.map(({ user, progress }) => (
              <tr key={user.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-ink-900">{user.name}</p>
                  <p className="text-xs text-ink-500">{user.email}</p>
                </td>
                <td className="px-4 py-3">{user.role}</td>
                <td className="px-4 py-3">{user.subscriptions[0]?.plan.name ?? "—"}</td>
                <td className="px-4 py-3">{progress.percent}%</td>
                <td className="px-4 py-3">{user.createdAt.toLocaleDateString("es-MX")}</td>
                <td className="px-4 py-3">
                  {user.suspendedAt ? (
                    <span className="badge-accent">Suspendida</span>
                  ) : (
                    <span className="badge-brand">Activa</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/admin/usuarios/${user.id}`} className="btn-ghost text-xs">Ver</Link>
                    <form action={toggleSuspend.bind(null, user.id)}>
                      <input type="hidden" name="suspend" value={user.suspendedAt ? "false" : "true"} />
                      <ConfirmButton
                        confirmText={user.suspendedAt ? "¿Reactivar esta cuenta?" : "¿Suspender esta cuenta?"}
                        className="btn-ghost text-xs text-accent-700"
                      >
                        {user.suspendedAt ? "Reactivar" : "Suspender"}
                      </ConfirmButton>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <p className="p-8 text-center text-ink-500">No se encontraron usuarios.</p>}
      </div>
    </div>
  );
}
