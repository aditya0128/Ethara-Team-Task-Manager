import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { useAuth } from "../../store/auth";
import { formatApiError } from "../../lib/api";
import { AuthShell } from "./AuthShell";
import { ArrowRight } from "@phosphor-icons/react";

const schema = z.object({
  name: z.string().min(2, "Enter your name"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "At least 6 characters"),
  role: z.enum(["admin", "member"]),
});
type Vals = z.infer<typeof schema>;

export function Register() {
  const { register: doRegister } = useAuth();
  const nav = useNavigate();
  const {
    register, handleSubmit, formState: { errors, isSubmitting },
  } = useForm<Vals>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "", role: "member" },
  });

  const onSubmit = async (vals: Vals) => {
    try {
      const user = await doRegister(vals as { name: string; email: string; password: string; role: "admin" | "member" });
      toast.success(`Welcome aboard, ${user.name}`);
      nav(user.role === "admin" ? "/admin" : "/member", { replace: true });
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  return (
    <AuthShell title="Create your Ethara.AI account" subtitle="Spin up a workspace in seconds.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" data-testid="register-form">
        <div>
          <label className="label">Register as</label>
          <select className="input" {...register("role")} data-testid="register-role-select">
            <option value="member">Member</option>
            <option value="admin">Administrator</option>
          </select>
        </div>
        <div>
          <label className="label">Full name</label>
          <input className="input" placeholder="Jane Doe" {...register("name")} data-testid="register-name-input" />
          {errors.name && <p className="text-xs text-danger mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" autoComplete="email" placeholder="you@company.com"
            {...register("email")} data-testid="register-email-input" />
          {errors.email && <p className="text-xs text-danger mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input" type="password" autoComplete="new-password" placeholder="••••••••"
            {...register("password")} data-testid="register-password-input" />
          {errors.password && <p className="text-xs text-danger mt-1">{errors.password.message}</p>}
        </div>

        <button type="submit" className="btn-primary w-full mt-2" disabled={isSubmitting} data-testid="register-submit-button">
          {isSubmitting ? "Creating account…" : "Create account"}
          <ArrowRight size={16} weight="bold" />
        </button>

        <p className="text-xs text-ink-muted text-center pt-2">
          Already have an account?{" "}
          <Link to="/login" className="text-brand hover:underline" data-testid="register-login-link">
            Sign in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
