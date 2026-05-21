import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../store/auth";

interface Props {
  children: ReactNode;
  role?: "admin" | "member";
}

export function ProtectedRoute({ children, role }: Props) {
  const { user, status } = useAuth();
  const location = useLocation();

  if (status === "idle" || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-ink-secondary">
        <span className="overline">Loading…</span>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === "admin" ? "/admin" : "/member"} replace />;
  }
  return <>{children}</>;
}
