import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { StudentShell } from "@/components/student/student-shell";

export default async function StudentAppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role === "ADMIN") redirect("/admin");

  return (
    <StudentShell userName={session.user.name ?? "Estudiante"} userEmail={session.user.email ?? ""}>
      {children}
    </StudentShell>
  );
}
