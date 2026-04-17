import { logoutAction } from "@/app/actions/auth";

export default function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        aria-label="Logout"
        className="flex items-center gap-2 flex-1 px-3 py-2 rounded-sm text-xs font-bold tracking-widest transition-all"
        style={{
          color: "#fff",
          background: "#7a0000",
          border: "1px solid #CC000060",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#9a0000";
          e.currentTarget.style.borderColor = "#CC000090";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "#7a0000";
          e.currentTarget.style.borderColor = "#CC000060";
        }}
      >
        <span>⏻</span>
        <span>LOGOUT</span>
      </button>
    </form>
  );
}
