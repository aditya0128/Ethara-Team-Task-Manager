import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth";
import { initials } from "../lib/utils";
import { Bell, MagnifyingGlass, List, CaretDown } from "@phosphor-icons/react";

export function Topbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const nav = useNavigate();

  return (
    <header
      className="h-14 sticky top-0 z-20 border-b border-line bg-black/60 backdrop-blur-xl flex items-center px-4 lg:px-6 gap-4"
      data-testid="topbar"
    >
      <button className="lg:hidden text-ink-secondary" data-testid="topbar-menu-button">
        <List size={20} />
      </button>

      <div className="flex-1 max-w-md hidden sm:flex items-center gap-2 px-3 py-1.5 border border-line rounded-md bg-bg-surface">
        <MagnifyingGlass size={14} className="text-ink-muted" />
        <input
          placeholder="Search tasks, projects, members…"
          className="bg-transparent flex-1 outline-none text-sm text-white placeholder:text-ink-muted"
          data-testid="topbar-search"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Link
          to="/notifications"
          className="p-2 text-ink-secondary hover:text-white rounded-md hover:bg-bg-panel transition-colors"
          data-testid="topbar-notifications"
          aria-label="Notifications"
        >
          <Bell size={18} />
        </Link>

        <div className="relative">
          <button
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-md hover:bg-bg-panel transition-colors border border-transparent hover:border-line"
            onClick={() => setOpen((o) => !o)}
            data-testid="topbar-profile-dropdown"
          >
            <Avatar name={user?.name} url={user?.avatar_url} />
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-white leading-tight">{user?.name}</p>
              <p className="text-[10px] uppercase tracking-widest2 text-ink-muted">{user?.role}</p>
            </div>
            <CaretDown size={12} className="text-ink-muted" />
          </button>

          {open && (
            <div
              className="absolute right-0 mt-2 w-56 panel-flat shadow-panel z-30 animate-slide-up"
              onMouseLeave={() => setOpen(false)}
              data-testid="profile-menu"
            >
              <div className="px-3 py-2.5 border-b border-line">
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs text-ink-muted truncate">{user?.email}</p>
              </div>
              <div className="py-1">
                <DropItem onClick={() => { setOpen(false); nav("/profile"); }} testid="profile-menu-profile">Profile</DropItem>
                <DropItem onClick={() => { setOpen(false); nav("/settings"); }} testid="profile-menu-settings">Settings</DropItem>
                <DropItem onClick={async () => { await logout(); nav("/login"); }} testid="profile-menu-logout" danger>Sign out</DropItem>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function DropItem({ children, onClick, danger, testid }: { children: React.ReactNode; onClick: () => void; danger?: boolean; testid?: string }) {
  return (
    <button
      onClick={onClick}
      data-testid={testid}
      className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${danger ? "text-danger hover:bg-danger/10" : "text-ink-secondary hover:text-white hover:bg-bg-panel"}`}
    >
      {children}
    </button>
  );
}

export function Avatar({ name, url, size = 32 }: { name?: string | null; url?: string | null; size?: number }) {
  if (url) {
    return (
      <img
        src={url}
        alt={name || "avatar"}
        width={size}
        height={size}
        className="rounded-md object-cover border border-line"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rounded-md bg-bg-panel border border-line flex items-center justify-center text-xs font-medium text-ink-secondary"
      style={{ width: size, height: size }}
    >
      {initials(name)}
    </div>
  );
}
