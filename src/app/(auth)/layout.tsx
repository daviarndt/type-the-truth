import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  // Sessão válida de verdade (não apenas cookie presente) → vai pro app
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return <div className="auth-shell">{children}</div>;
}
