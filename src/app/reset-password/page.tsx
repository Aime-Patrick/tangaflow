"use client";

import React, { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { AlertCircle, Check, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type PageStatus = "form" | "submitting" | "success" | "error";

function ResetCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-base p-4">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="rounded-md border border-border-subtle p-8"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}

function StatusIcon({ variant }: { variant: "success" | "error" }) {
  return (
    <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-md border border-border-subtle">
      {variant === "success" ? (
        <Check className="h-5 w-5 text-text-primary" strokeWidth={2} />
      ) : (
        <AlertCircle className="h-5 w-5 text-text-primary" strokeWidth={2} />
      )}
    </div>
  );
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<PageStatus>(token ? "form" : "error");
  const [message, setMessage] = useState(
    token ? "" : "This reset link is missing a token."
  );
  const [formError, setFormError] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setFormError("");

    if (password.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    setStatus("submitting");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "This reset link is invalid or has expired.");
        return;
      }

      setStatus("success");
      setMessage(
        data.message || "Password reset successful. You can now sign in."
      );
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  };

  if (status === "success") {
    return (
      <ResetCard>
        <div className="text-center">
          <StatusIcon variant="success" />
          <h1 className="text-xl font-medium text-text-primary">
            Password updated
          </h1>
          <p className="mt-1 text-sm text-text-muted">{message}</p>
          <Button
            className="mt-6 w-full rounded-md"
            onClick={() => (window.location.href = "/")}
          >
            Back to sign in
          </Button>
        </div>
      </ResetCard>
    );
  }

  if (status === "error") {
    return (
      <ResetCard>
        <div className="text-center">
          <StatusIcon variant="error" />
          <h1 className="text-xl font-medium text-text-primary">
            Reset link unavailable
          </h1>
          <p className="mt-1 text-sm text-text-muted">{message}</p>
          <Button
            className="mt-6 w-full rounded-md"
            variant="outline"
            onClick={() => (window.location.href = "/")}
          >
            Back to sign in
          </Button>
        </div>
      </ResetCard>
    );
  }

  return (
    <ResetCard>
      <div className="mb-6 text-center">
        <p className="text-xs uppercase tracking-wider text-text-muted">
          TangaFlow
        </p>
        <h1 className="mt-2 text-xl font-medium text-text-primary">
          Set a new password
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          Choose a strong password for your account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-secondary">
            New password
          </label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="rounded-md pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-text-secondary">
            Confirm password
          </label>
          <div className="relative">
            <Input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="rounded-md pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {formError && <p className="text-sm text-red-500">{formError}</p>}

        <Button
          type="submit"
          className="w-full rounded-md"
          disabled={status === "submitting"}
        >
          {status === "submitting" ? "Updating..." : "Reset password"}
        </Button>
      </form>
    </ResetCard>
  );
}

function ResetPasswordFallback() {
  return (
    <ResetCard>
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-text-muted" />
        <h1 className="mt-6 text-xl font-medium text-text-primary">Loading</h1>
        <p className="mt-1 text-sm text-text-muted">Preparing password reset.</p>
      </div>
    </ResetCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
