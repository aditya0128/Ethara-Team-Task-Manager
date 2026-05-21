import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { useAuth } from "../../store/auth";
import { formatApiError } from "../../lib/api";
import { AuthShell } from "./AuthShell";
import { ArrowRight } from "@phosphor-icons/react";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "At least 6 characters"),
  role: z.enum(["admin", "member"]),
});
type FormVals = z.infer<typeof schema>;

export function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation() as { state?: { from?: { pathname?: string } } };

  const {
    register, handleSubmit, formState: { errors, isSubmitting },
  } = useForm<FormVals>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", role: "admin" },
  });

  const onSubmit = async (vals: FormVals) => {
    try {
      const user = await login(vals.email, vals.password, vals.role);
      toast.success(`Welcome back, ${user.name}`);
      const dest = loc.state?.from?.pathname || (user.role === "admin" ? "/admin" : "/member");
      nav(dest, { replace: true });
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  return (
    <AuthShell title="Sign in to Ethara.AI" subtitle="Resume your team's productivity.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" data-testid="login-form">
        <div>
          <label className="label">Login as</label>
          <select
            className="input"
            {...register("role")}
            data-testid="login-role-select"
          >
            <option value="admin">Administrator</option>
            <option value="member">Member</option>
          </select>
        </div>
        <div>
          <label className="label">Email</label>
          <input
            className="input" type="email" autoComplete="email"
            placeholder="you@company.com"
            {...register("email")} data-testid="login-email-input"
          />
          {errors.email && <p className="text-xs text-danger mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="label !mb-0">Password</label>
            <Link to="/forgot-password" className="text-xs text-ink-muted hover:text-brand" data-testid="login-forgot-link">
              Forgot password?
            </Link>
          </div>
          <input
            className="input mt-1.5" type="password" autoComplete="current-password"
            placeholder="••••••••"
            {...register("password")} data-testid="login-password-input"
          />
          {errors.password && <p className="text-xs text-danger mt-1">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          className="btn-primary w-full mt-2"
          disabled={isSubmitting}
          data-testid="login-submit-button"
        >
          {isSubmitting ? "Signing in…" : "Sign in"}
          <ArrowRight size={16} weight="bold" />
        </button>

        <p className="text-xs text-ink-muted text-center pt-2">
          Don't have an account?{" "}
          <Link to="/register" className="text-brand hover:underline" data-testid="login-register-link">
            Create one
          </Link>
        </p>

        <div className="mt-6 panel-flat p-3 text-[11px] text-ink-muted">
          <p className="overline mb-1">Demo credentials</p>
          <p>Admin · admin@ethara.ai · Admin@123</p>
          <p>Member · member@ethara.ai · Member@123</p>
        </div>
      </form>
    </AuthShell>
  );
}
