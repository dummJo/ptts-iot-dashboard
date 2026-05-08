import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/session";

export default async function SelectModeLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  const token = jar.get("ptts-session")?.value;

  if (!token) {
    redirect("/login");
  }

  const session = await verifySession(token);

  if (!session) {
    redirect("/login?reason=invalid");
  }

  return <>{children}</>;
}
