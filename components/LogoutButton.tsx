import { logoutAction } from "@/app/actions/auth";

export default function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs transition-all
          text-[var(--sidebar-muted)] hover:text-[#CC0000] hover:bg-[#CC0000]/10"
      >
        <span>⏻</span>
        <span>Sign out</span>
      </button>
    </form>
  );
}
