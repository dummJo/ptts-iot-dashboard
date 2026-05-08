import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function Home() {
  const jar = await cookies();
  const session = jar.get("ptts-session")?.value;

  if (session) {
    redirect("/select-mode");
  } else {
    redirect("/login");
  }
}
