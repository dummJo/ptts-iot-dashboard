import { logoutAction } from "@/app/actions/auth";

export default function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="flex items-center gap-2 flex-1 px-3 py-2 rounded-sm text-[9px] font-bold tracking-widest transition-all"
        style={{
          color: "#CC0000",
          background: "#CC000015",
          border: "1px solid #CC000030",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#CC000025";
          e.currentTarget.style.borderColor = "#CC000050";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "#CC000015";
          e.currentTarget.style.borderColor = "#CC000030";
        }}
      >
        <span>⏻</span>
        <span>LOGOUT</span>
      </button>
    </form>
  );
}
