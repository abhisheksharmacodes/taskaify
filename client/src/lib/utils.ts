import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const normalizedPath = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  // Bypass base for Next.js-only endpoints
  const shouldBypassBase = normalizedPath.startsWith('/api/generate-tasks');
  const normalizedBase = shouldBypassBase ? '' : API_BASE_URL.replace(/\/$/, "");
  const url = `${normalizedBase}${normalizedPath}`;

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  } as Record<string, string>;

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  return res;
}
