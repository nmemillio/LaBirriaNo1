import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { CreateAdminForm } from "./create-admin-form";
import { PromoteForm } from "./promote-form";
import { demoteAdmin } from "./actions";

export const metadata: Metadata = { title: "Admin · Administradores" };

export default async function AdminAdministratorsPage() {
  const session = await auth();
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="container-page max-w-3xl py-8">
      <h1 className="text-2xl font-bold text-ink-900">Administradores</h1>
      <p className="mt-1 text-ink-500">
        Da de alta más cuentas con acceso al panel de administración, o promueve una cuenta de estudiante ya
        existente.
      </p>

      <div className="card mt-6 p-6">
        <h2 className="font-semibold text-ink-900">Crear nueva cuenta de administrador</h2>
        <div className="mt-4">
          <CreateAdminForm />
        </div>
      </div>

      <div className="card mt-6 p-6">
        <h2 className="font-semibold text-ink-900">Promover una cuenta existente</h2>
        <p className="mt-1 text-sm text-ink-500">
          Si el estudiante ya tiene cuenta, escribe su correo para darle acceso de administrador.
        </p>
        <div className="mt-4">
          <PromoteForm />
        </div>
      </div>

      <div className="card mt-6 p-6">
        <h2 className="font-semibold text-ink-900">Administradores actuales ({admins.length})</h2>
        <ul className="mt-4 divide-y divide-border-soft">
          {admins.map((admin) => (
            <li key={admin.id} className="flex items-center justify-between gap-3 py-3">
              <div>
                <p className="text-sm font-medium text-ink-900">
                  {admin.name}
                  {admin.id === session?.user.id && <span className="ml-2 badge-muted">Tú</span>}
                </p>
                <p className="text-xs text-ink-500">{admin.email}</p>
              </div>
              {admins.length > 1 && (
                <form action={demoteAdmin.bind(null, admin.id)}>
                  <ConfirmButton
                    confirmText={`¿Quitar los permisos de administrador a ${admin.name}?`}
                    className="btn-ghost text-xs text-accent-700"
                  >
                    Quitar acceso de admin
                  </ConfirmButton>
                </form>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
