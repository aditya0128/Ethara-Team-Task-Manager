import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./store/auth";
import { Login } from "./pages/auth/Login";
import { Register } from "./pages/auth/Register";
import { ForgotPassword } from "./pages/auth/ForgotPassword";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppLayout } from "./components/AppLayout";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { TeamsPage } from "./pages/admin/TeamsPage";
import { ProjectsPage } from "./pages/admin/ProjectsPage";
import { TasksPage } from "./pages/admin/TasksPage";
import { AttendanceAdminPage } from "./pages/admin/AttendanceAdminPage";
import { AnalyticsPage } from "./pages/admin/AnalyticsPage";
import { SettingsPage } from "./pages/common/SettingsPage";
import { MemberDashboard } from "./pages/member/MemberDashboard";
import { MyTasks } from "./pages/member/MyTasks";
import { MyAttendance } from "./pages/member/MyAttendance";
import { MyProjects } from "./pages/member/MyProjects";
import { ProfilePage } from "./pages/common/ProfilePage";
import { NotificationsPage } from "./pages/common/NotificationsPage";

export default function App() {
  const { refresh, status } = useAuth();

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-ink-secondary">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 bg-brand rounded-full animate-pulse" />
          <span className="overline">Loading workspace</span>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        {/* Common shortcuts */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardRedirect />} />

        {/* Admin */}
        <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/teams" element={<ProtectedRoute role="admin"><TeamsPage /></ProtectedRoute>} />
        <Route path="/admin/projects" element={<ProtectedRoute role="admin"><ProjectsPage /></ProtectedRoute>} />
        <Route path="/admin/tasks" element={<ProtectedRoute role="admin"><TasksPage /></ProtectedRoute>} />
        <Route path="/admin/attendance" element={<ProtectedRoute role="admin"><AttendanceAdminPage /></ProtectedRoute>} />
        <Route path="/admin/analytics" element={<ProtectedRoute role="admin"><AnalyticsPage /></ProtectedRoute>} />

        {/* Member */}
        <Route path="/member" element={<MemberDashboard />} />
        <Route path="/member/tasks" element={<MyTasks />} />
        <Route path="/member/attendance" element={<MyAttendance />} />
        <Route path="/member/projects" element={<MyProjects />} />

        {/* Common */}
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function DashboardRedirect() {
  const { user } = useAuth();
  return <Navigate to={user?.role === "admin" ? "/admin" : "/member"} replace />;
}
