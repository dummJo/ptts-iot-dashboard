import { logoutAction } from "@/app/actions/auth";

/**
 * Compact icon button. This used to be a full-width saturated red bar pinned to
 * the bottom of the sidebar — the loudest element on every screen, for the
 * action a user takes once a day.
 */
export default function LogoutButton() {
  return (
    <form action={logoutAction} className="shrink-0">
      <button
        type="submit"
        aria-label="Log out"
        title="Log out"
        className="w-8 h-8 flex items-center justify-center rounded-[var(--r-sm)] border transition-colors"
        style={{
          color: "var(--text-muted)",
          borderColor: "var(--border)",
          background: "var(--surface)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "var(--fault)";
          e.currentTarget.style.borderColor = "var(--fault)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "var(--text-muted)";
          e.currentTarget.style.borderColor = "var(--border)";
        }}
      >
        <span aria-hidden="true">⏻</span>
      </button>
    </form>
  );
}
