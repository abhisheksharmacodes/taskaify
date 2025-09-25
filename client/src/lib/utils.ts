import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utility to validate MongoDB ObjectId format
export function isValidObjectId(id: string): boolean {
  return typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
}

// Safe task ID extraction with validation
export function getTaskId(task: any): string | null {
  const taskId = String(task._id ?? task.id ?? '');
  return taskId && isValidObjectId(taskId) ? taskId : null;
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
