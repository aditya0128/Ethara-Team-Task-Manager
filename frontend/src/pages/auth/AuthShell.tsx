import type { ReactNode } from "react";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="min-h-screen flex bg-black text-white">
      {/* Left: branding panel */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden border-r border-line">
        <img
          src="https://images.unsplash.com/photo-1758657286922-be0f59382411?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA3MDB8MHwxfHNlYXJjaHwyfHxhYnN0cmFjdCUyMGRhcmslMjBvcmFuZ2UlMjBnZW9tZXRyaWMlMjBiYWNrZ3JvdW5kfGVufDB8fHx8MTc3OTM1ODQ1NXww&ixlib=rb-4.1.0&q=85"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-black/40 to-black/70" />

        <div className="relative z-10 flex flex-col justify-between p-10 w-full">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand rounded-sm flex items-center justify-center">
              <span className="font-display font-black text-black">E</span>
            </div>
            <div>
              <p className="font-display font-bold text-white tracking-tight2">Ethara<span className="text-brand">.AI</span></p>
              <p className="overline text-[10px] -mt-0.5">TEAM TASK MANAGER</p>
            </div>
          </div>

          <div className="space-y-4">
            <p className="overline">Operating system for teams</p>
            <h2 className="font-display text-4xl xl:text-5xl font-bold leading-[1.05] tracking-tight2">
              Run projects, attendance and execution
              <span className="text-brand"> on one rail.</span>
            </h2>
            <p className="text-sm text-ink-secondary max-w-md">
              Built for modern enterprises that demand clarity. Distribute work, time it, ship it.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs text-ink-muted">
            <span className="w-1.5 h-1.5 bg-success rounded-full" /> v1.0 · Production-ready
          </div>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden flex items-center gap-2">
            <div className="w-7 h-7 bg-brand rounded-sm flex items-center justify-center">
              <span className="font-display font-black text-black text-sm">E</span>
            </div>
            <span className="font-display font-bold tracking-tight2">Ethara<span className="text-brand">.AI</span></span>
          </div>
          <p className="overline mb-3">Authentication</p>
          <h1 className="h-display text-3xl sm:text-4xl font-bold tracking-tight2 mb-2">{title}</h1>
          <p className="text-sm text-ink-secondary mb-6">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
