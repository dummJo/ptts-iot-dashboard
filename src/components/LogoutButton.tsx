import { logoutAction } from "@/app/actions/auth";

export default function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        aria-label="Logout"
        className="flex items-center gap-2 flex-1 px-3 py-2 text-xs font-bold tracking-widest transition-all"
        style={{
          color: "var(--text-inverse)",
          background: "var(--fault)",
          border: "1px solid var(--fault)",
          opacity: 0.85,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = "1";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = "0.85";
        }}
      >
        <span>⏻</span>
        <span>LOGOUT</span>
      </button>
    </form>
  );
}
