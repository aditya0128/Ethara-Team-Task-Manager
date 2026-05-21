import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth";
import { cn } from "../lib/utils";
import {
  House, ListChecks, FolderOpen, UsersThree, ChartBar, Clock,
  GearSix, SignOut, User as UserIcon
} from "@phosphor-icons/react";

const ADMIN_NAV = [
  { to: "/admin", label: "Overview", icon: House },
  { to: "/admin/tasks", label: "Tasks", icon: ListChecks },
  { to: "/admin/projects", label: "Projects", icon: FolderOpen },
  { to: "/admin/teams", label: "Teams", icon: UsersThree },
  { to: "/admin/attendance", label: "Attendance", icon: Clock },
  { to: "/admin/analytics", label: "Analytics", icon: ChartBar },
];

const MEMBER_NAV = [
  { to: "/member", label: "Overview", icon: House },
  { to: "/member/tasks", label: "My Tasks", icon: ListChecks },
  { to: "/member/projects", label: "Projects", icon: FolderOpen },
  { to: "/member/attendance", label: "Attendance", icon: Clock },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const items = user?.role === "admin" ? ADMIN_NAV : MEMBER_NAV;

  return (
    <aside
      className="hidden lg:flex w-60 shrink-0 border-r border-line bg-bg-surface flex-col"
      data-testid="sidebar"
    >
      <div className="px-5 py-5 border-b border-line flex items-center gap-2">
        <div className="w-7 h-7 bg-brand rounded-sm flex items-center justify-center">
          <span className="font-display font-black text-black text-sm">E</span>
        </div>
        <div>
          <p className="font-display font-bold text-white text-sm tracking-tight2">ETHARA</p>
          <p className="overline text-[10px] -mt-0.5">TASK MANAGER</p>
        </div>
      </div>

      <div className="px-3 py-4 border-b border-line">
        <p className="overline mb-3 px-2">{user?.role === "admin" ? "Admin Console" : "Member Workspace"}</p>
        <nav className="flex flex-col gap-1">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/admin" || to === "/member"}
              data-testid={`nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-2.5 py-2 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-brand/10 text-brand border border-brand/30"
                    : "text-ink-secondary hover:text-white hover:bg-bg-panel border border-transparent"
                )
              }
            >
              <Icon size={18} weight="duotone" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="px-3 py-4 mt-auto border-t border-line">
        <NavLink
          to="/profile"
          className="flex items-center gap-2 px-2 py-2 rounded-md text-sm text-ink-secondary hover:text-white hover:bg-bg-panel"
          data-testid="nav-profile"
        >
          <UserIcon size={16} /> Profile
        </NavLink>
        <NavLink
          to="/settings"
          className="flex items-center gap-2 px-2 py-2 rounded-md text-sm text-ink-secondary hover:text-white hover:bg-bg-panel"
          data-testid="nav-settings"
        >
          <GearSix size={16} /> Settings
        </NavLink>
        <button
          className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm text-ink-secondary hover:text-danger transition-colors"
          onClick={async () => { await logout(); nav("/login"); }}
          data-testid="sidebar-logout-button"
        >
          <SignOut size={16} /> Sign out
        </button>
      </div>
    </aside>
  );
}
