import type { LoginInput, RegisterInput, AuthResponse } from "../types";

export async function login(input: LoginInput): Promise<AuthResponse> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Login failed");
  }

  return res.json();
}

export async function register(input: RegisterInput): Promise<AuthResponse> {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Registration failed");
  }

  return res.json();
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" });
}

export async function getCurrentUser(): Promise<AuthResponse | null> {
  const res = await fetch("/api/auth/me");
  if (!res.ok) return null;
  return res.json();
}
