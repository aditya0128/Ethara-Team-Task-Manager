import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "../types";
import { api, setToken } from "../lib/api";

interface AuthState {
  user: User | null;
  status: "idle" | "loading" | "ready";
  token: string | null;
  login: (email: string, password: string, role?: "admin" | "member") => Promise<User>;
  register: (data: { name: string; email: string; password: string; role: "admin" | "member" }) => Promise<User>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  setUser: (u: User | null) => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      status: "idle",
      token: null,
      setUser: (user) => set({ user }),
      login: async (email, password, role) => {
        const { data } = await api.post("/auth/login", { email, password, role });
        setToken(data.access_token);
        set({ user: data.user, token: data.access_token, status: "ready" });
        return data.user;
      },
      register: async (payload) => {
        const { data } = await api.post("/auth/register", payload);
        setToken(data.access_token);
        set({ user: data.user, token: data.access_token, status: "ready" });
        return data.user;
      },
      logout: async () => {
        try { await api.post("/auth/logout"); } catch {}
        setToken(null);
        set({ user: null, token: null });
      },
      refresh: async () => {
        const t = get().token;
        if (!t) { set({ status: "ready" }); return; }
        setToken(t);
        set({ status: "loading" });
        try {
          const { data } = await api.get("/auth/me");
          set({ user: data, status: "ready" });
        } catch {
          setToken(null);
          set({ user: null, token: null, status: "ready" });
        }
      },
    }),
    { name: "ethara-auth", partialize: (s) => ({ token: s.token, user: s.user }) }
  )
);
