// src/lib/api.ts

// 🔹 Base URL for all API requests
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// 🔹 Helper: adds Authorization header automatically if user is logged in
export async function authFetch(
  input: string,
  init: RequestInit = {}
) {
  const token = localStorage.getItem('token');

  const headers: HeadersInit = {
    ...(init.headers || {}),
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(`${API_BASE_URL}${input}`, {
    ...init,
    headers,
  });

  return response;
}
