import axios from "axios";

export const API_BASE = "http://127.0.0.1:8001/api";

export const api = axios.create({
  baseURL: API_BASE,
});

const TOKEN_KEY = "ethara_token";

export function setToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    localStorage.removeItem(TOKEN_KEY);
    delete api.defaults.headers.common.Authorization;
  }
}

const existing = localStorage.getItem(TOKEN_KEY);

if (existing) {
  api.defaults.headers.common.Authorization = `Bearer ${existing}`;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function formatApiError(err: any): string {
  return err?.response?.data?.detail || err?.message || "Network Error";
}