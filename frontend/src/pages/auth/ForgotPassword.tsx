import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { api, formatApiError } from "../../lib/api";
import { AuthShell } from "./AuthShell";
import { ArrowRight, CheckCircle } from "@phosphor-icons/react";

const reqSchema = z.object({ email: z.string().email() });
const resetSchema = z.object({
  token: z.string().min(8),
  new_password: z.string().min(6, "At least 6 characters"),
});

export function ForgotPassword() {
  const [stage, setStage] = useState<"request" | "reset" | "done">("request");
  const [token, setToken] = useState<string | null>(null);

  const reqForm = useForm<z.infer<typeof reqSchema>>({ resolver: zodResolver(reqSchema), defaultValues: { email: "" } });
  const resetForm = useForm<z.infer<typeof resetSchema>>({ resolver: zodResolver(resetSchema), defaultValues: { token: "", new_password: "" } });

  const onRequest = async (vals: z.infer<typeof reqSchema>) => {
    try {
      const { data } = await api.post("/auth/forgot-password", vals);
      if (data?.reset_token) {
        setToken(data.reset_token);
        resetForm.setValue("token", data.reset_token);
        setStage("reset");
        toast.success("Reset token generated. (Mocked - in production this is emailed.)");
      } else {
        toast.success("If the email exists, a reset link was sent.");
      }
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const onReset = async (vals: z.infer<typeof resetSchema>) => {
    try {
      await api.post("/auth/reset-password", vals);
      setStage("done");
      toast.success("Password updated. You can now sign in.");
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  return (
    <AuthShell title="Reset your password" subtitle="We use a mocked reset flow — your token will be returned directly.">
      {stage === "request" && (
        <form onSubmit={reqForm.handleSubmit(onRequest)} className="space-y-4" data-testid="forgot-request-form">
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" placeholder="you@company.com"
              {...reqForm.register("email")} data-testid="forgot-email-input" />
            {reqForm.formState.errors.email && (
              <p className="text-xs text-danger mt-1">{reqForm.formState.errors.email.message}</p>
            )}
          </div>
          <button className="btn-primary w-full" data-testid="forgot-submit-button">
            Generate reset token <ArrowRight size={16} weight="bold" />
          </button>
        </form>
      )}

      {stage === "reset" && (
        <form onSubmit={resetForm.handleSubmit(onReset)} className="space-y-4" data-testid="forgot-reset-form">
          <div className="panel-flat p-3 text-xs text-ink-muted break-all">
            <p className="overline mb-1">Mocked reset token</p>
            <code className="font-mono text-brand text-[11px]">{token}</code>
          </div>
          <div>
            <label className="label">Token</label>
            <input className="input font-mono text-xs" {...resetForm.register("token")} data-testid="forgot-token-input" />
          </div>
          <div>
            <label className="label">New password</label>
            <input className="input" type="password" placeholder="••••••••"
              {...resetForm.register("new_password")} data-testid="forgot-newpassword-input" />
            {resetForm.formState.errors.new_password && (
              <p className="text-xs text-danger mt-1">{resetForm.formState.errors.new_password.message}</p>
            )}
          </div>
          <button className="btn-primary w-full" data-testid="forgot-reset-submit">
            Update password <ArrowRight size={16} weight="bold" />
          </button>
        </form>
      )}

      {stage === "done" && (
        <div className="text-center py-6" data-testid="forgot-done">
          <CheckCircle size={48} weight="duotone" className="mx-auto text-success" />
          <p className="h-display text-xl font-bold mt-3">Password updated</p>
          <Link to="/login" className="btn-primary mt-4 inline-flex">Back to sign in</Link>
        </div>
      )}

      <p className="text-xs text-ink-muted text-center pt-4">
        Remembered it? <Link to="/login" className="text-brand hover:underline">Sign in</Link>
      </p>
    </AuthShell>
  );
}
