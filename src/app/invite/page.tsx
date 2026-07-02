"use client";

import React, { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { AlertCircle, Check, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import {
  formatInvitationRole,
  type InvitationDetails,
} from "@/lib/invitation-utils";

type PageStatus = "loading" | "error" | "ready" | "accepting" | "success";
type InviteView = "sign_in" | "register" | "email_mismatch";

function InviteCard({ children }: { children: React.ReactNode }) {
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

function InvitationHeader({
  invitation,
}: {
  invitation: InvitationDetails;
}) {
  return (
    <div className="text-center mb-6">
      <p className="text-xs uppercase tracking-wider text-text-muted">
        You&apos;re invited
      </p>
      <h1 className="mt-2 text-xl font-medium text-text-primary">
        Join {invitation.organizationName}
      </h1>
      <p className="mt-2 text-sm text-text-muted">
        {invitation.inviterName} invited you to join as{" "}
        <span className="text-text-primary">{formatInvitationRole(invitation.role)}</span>
      </p>
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

function InvitePageContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { user, isLoading: authLoading, refresh, logout } = useAuth();

  const [pageStatus, setPageStatus] = useState<PageStatus>("loading");
  const [view, setView] = useState<InviteView>("sign_in");
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const acceptInvitation = useCallback(async () => {
    if (!token) return false;

    const res = await fetch("/api/invitations/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    const data = await res.json();

    if (!res.ok) {
      setPageStatus("error");
      setMessage(data.error || "This invitation could not be accepted.");
      return false;
    }

    await refresh();
    setPageStatus("success");
    setMessage(data.message || `Welcome to ${data.organization?.name || "the workspace"}.`);
    return true;
  }, [token, refresh]);

  useEffect(() => {
    if (!token) {
      setPageStatus("error");
      setMessage("This invitation link is missing a token.");
      return;
    }

    let cancelled = false;

    const loadInvitation = async () => {
      try {
        const res = await fetch(`/api/invitations/${token}`);
        const data = await res.json();

        if (cancelled) return;

        if (!res.ok) {
          setPageStatus("error");
          setMessage(data.error || "This invitation is invalid or has expired.");
          return;
        }

        setInvitation(data.invitation);
        setView(data.invitation.accountExists ? "sign_in" : "register");
        setPageStatus("ready");
      } catch {
        if (!cancelled) {
          setPageStatus("error");
          setMessage("Something went wrong loading this invitation.");
        }
      }
    };

    loadInvitation();

    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (!token || !invitation || authLoading || pageStatus !== "ready") return;

    if (!user) return;

    if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      setView("email_mismatch");
      return;
    }

    let cancelled = false;

    const runAccept = async () => {
      setPageStatus("accepting");
      await acceptInvitation();
    };

    runAccept();

    return () => {
      cancelled = true;
    };
  }, [token, invitation, user, authLoading, pageStatus, acceptInvitation]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !invitation) return;

    setFormError("");
    setIsSubmitting(true);

    try {
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: invitation.email, password }),
      });

      const loginData = await loginRes.json();

      if (!loginRes.ok) {
        setFormError(loginData.error || "Sign in failed.");
        return;
      }

      setPageStatus("accepting");
      await acceptInvitation();
    } catch {
      setFormError("Something went wrong. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setFormError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/invitations/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          name,
          password,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || "Could not create your account.");
        return;
      }

      await refresh();
      setPageStatus("success");
      setMessage(
        data.message || `Welcome to ${data.organization?.name || "the workspace"}.`
      );
    } catch {
      setFormError("Something went wrong. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSwitchAccount = async () => {
    await logout();
    if (invitation) {
      setView(invitation.accountExists ? "sign_in" : "register");
    }
    setPageStatus("ready");
    setFormError("");
    setPassword("");
    setConfirmPassword("");
  };

  if (
    pageStatus === "loading" ||
    pageStatus === "accepting" ||
    (pageStatus === "ready" && authLoading)
  ) {
    return (
      <InviteCard>
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-text-muted" />
          <h1 className="mt-6 text-xl font-medium text-text-primary">
            {pageStatus === "accepting" ? "Joining workspace" : "Loading invitation"}
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            {pageStatus === "accepting"
              ? "Adding you to the organization."
              : "Verifying your invitation."}
          </p>
        </div>
      </InviteCard>
    );
  }

  if (pageStatus === "success") {
    return (
      <InviteCard>
        <div className="text-center">
          <StatusIcon variant="success" />
          <h1 className="text-xl font-medium text-text-primary">You&apos;re in</h1>
          <p className="mt-1 text-sm text-text-muted">{message}</p>
          <Button
            className="mt-6 w-full rounded-md"
            onClick={() => (window.location.href = "/dashboard")}
          >
            Open workspace
          </Button>
        </div>
      </InviteCard>
    );
  }

  if (pageStatus === "error") {
    return (
      <InviteCard>
        <div className="text-center">
          <StatusIcon variant="error" />
          <h1 className="text-xl font-medium text-text-primary">
            Invitation unavailable
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
      </InviteCard>
    );
  }

  if (!invitation) return null;

  if (view === "email_mismatch" && user) {
    return (
      <InviteCard>
        <InvitationHeader invitation={invitation} />
        <div className="space-y-4 text-center">
          <p className="text-sm text-text-muted">
            This invitation was sent to{" "}
            <span className="text-text-primary">{invitation.email}</span>, but
            you&apos;re signed in as{" "}
            <span className="text-text-primary">{user.email}</span>.
          </p>
          <p className="text-sm text-text-muted">
            Sign in with {invitation.email} or ask the administrator to send a
            new invitation.
          </p>
          <Button
            className="w-full rounded-md"
            onClick={handleSwitchAccount}
          >
            Sign in with {invitation.email}
          </Button>
        </div>
      </InviteCard>
    );
  }

  if (view === "register") {
    return (
      <InviteCard>
        <InvitationHeader invitation={invitation} />
        <p className="mb-6 text-center text-sm text-text-muted">
          Create your account to accept this invitation.
        </p>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">Email</label>
            <Input
              type="email"
              value={invitation.email}
              readOnly
              className="rounded-md bg-bg-muted text-text-muted"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">Full name</label>
            <Input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="rounded-md"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">Password</label>
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
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating account..." : "Create account & join"}
          </Button>
        </form>
      </InviteCard>
    );
  }

  return (
    <InviteCard>
      <InvitationHeader invitation={invitation} />
      <p className="mb-6 text-center text-sm text-text-muted">
        Sign in to accept this invitation.
      </p>

      <form onSubmit={handleSignIn} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-secondary">Email</label>
          <Input
            type="email"
            value={invitation.email}
            readOnly
            className="rounded-md bg-bg-muted text-text-muted"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-text-secondary">Password</label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
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

        {formError && <p className="text-sm text-red-500">{formError}</p>}

        <Button
          type="submit"
          className="w-full rounded-md"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Signing in..." : "Sign in to join"}
        </Button>
      </form>
    </InviteCard>
  );
}

function InvitePageFallback() {
  return (
    <InviteCard>
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-text-muted" />
        <h1 className="mt-6 text-xl font-medium text-text-primary">
          Loading invitation
        </h1>
        <p className="mt-1 text-sm text-text-muted">Verifying your invitation.</p>
      </div>
    </InviteCard>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={<InvitePageFallback />}>
      <InvitePageContent />
    </Suspense>
  );
}
