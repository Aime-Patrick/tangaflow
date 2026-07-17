"use client";

import React, { useEffect, useState } from "react";
import {
  User,
  Settings,
  Building2,
  Mail,
  Globe,
  Calendar,
  Eye,
  EyeOff,
  Users,
} from "lucide-react";
import { LayoutSheet } from "./LayoutSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import { usePermission } from "@/hooks/use-permission";
import { useLogout } from "@/features/auth";
import { useUIStore } from "@/stores/uiStore";
import { MembersTab } from "./MembersTab";
import { OrgCampaignsList } from "./OrgCampaignsList";
import { DevicesTab } from "./DevicesTab";

const CURRENCIES = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "KRW", name: "South Korean Won", symbol: "₩" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$" },
  { code: "RWF", name: "Rwandan Franc", symbol: "FRw" },
  { code: "NGN", name: "Nigerian Naira", symbol: "₦" },
  { code: "ZAR", name: "South African Rand", symbol: "R" },
  { code: "KES", name: "Kenyan Shilling", symbol: "KSh" },
  { code: "GHS", name: "Ghanaian Cedi", symbol: "GH₵" },
];

type TabValue = "profile" | "campaign" | "members" | "settings";

interface ProfileSheetProps {
  open: boolean;
  onClose: () => void;
  defaultTab?: TabValue;
  // Campaign settings
  eventName?: string;
  onEventNameChange?: (value: string) => void;
  targetAmount?: number;
  onTargetChange?: (value: number) => void;
  currency?: string;
  onCurrencyChange?: (value: string) => void;
  polarCheckoutUrl?: string;
  codeType?: "qr" | "zerocode";
  onCodeTypeChange?: (value: "qr" | "zerocode") => void;
}

export function ProfileSheet({
  open,
  onClose,
  defaultTab = "profile",
  eventName = "",
  onEventNameChange,
  targetAmount = 10000,
  onTargetChange,
  currency = "USD",
  onCurrencyChange,
  polarCheckoutUrl = "",
  codeType = "qr",
  onCodeTypeChange,
}: ProfileSheetProps) {
  const { user, organization, refresh } = useAuth();
  const canManageCampaigns = usePermission("manage_campaigns");
  const canViewCampaigns = usePermission("view_campaigns");
  const canManageMembers = usePermission("manage_members");
  const [activeTab, setActiveTab] = useState<TabValue>(defaultTab);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [hasOpenedMembers, setHasOpenedMembers] = useState(defaultTab === "members");

  useEffect(() => {
    if (open && !user) {
      refresh();
    }
  }, [open, user, refresh]);

  useEffect(() => {
    if (activeTab === "members") {
      setHasOpenedMembers(true);
    }
  }, [activeTab]);

  // Adjust default tab if user doesn't have permission
  const effectiveTab = (() => {
    if (activeTab === "campaign" && !canViewCampaigns) return "profile";
    if (activeTab === "members" && !canManageMembers) return "profile";
    return activeTab;
  })();

  return (
    <LayoutSheet
      open={open}
      onClose={onClose}
      title={getTabTitle(effectiveTab)}
    >
      {/* Tabs */}
      <div className="border-b border-border-subtle px-6">
        <Tabs
          value={effectiveTab}
          onValueChange={(v) => setActiveTab(v as TabValue)}
        >
          <TabsList variant="line" className="h-10">
            <TabsTrigger value="profile">
              <User className="mr-2 h-4 w-4" />
              Profile
            </TabsTrigger>
            {canViewCampaigns && (
              <TabsTrigger value="campaign">
                <Calendar className="mr-2 h-4 w-4" />
                Campaign
              </TabsTrigger>
            )}
            {canManageMembers && (
              <TabsTrigger value="members">
                <Users className="mr-2 h-4 w-4" />
                Members
              </TabsTrigger>
            )}
            <TabsTrigger value="settings">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <div className="p-6">
        {effectiveTab === "profile" && (
          <ProfileContent user={user} organization={organization} />
        )}
        {effectiveTab === "campaign" && canViewCampaigns && (
          <div className="space-y-6">
            <OrgCampaignsList />
            <CampaignContent
              eventName={eventName}
              onEventNameChange={onEventNameChange}
              targetAmount={targetAmount}
              onTargetChange={onTargetChange}
              currency={currency}
              onCurrencyChange={onCurrencyChange}
              polarCheckoutUrl={polarCheckoutUrl}
              codeType={codeType}
              onCodeTypeChange={onCodeTypeChange}
            />
          </div>
        )}
        {hasOpenedMembers && canManageMembers && organization && (
          <div className={effectiveTab === "members" ? undefined : "hidden"}>
            <MembersTab organizationSlug={organization.slug} />
          </div>
        )}
        {effectiveTab === "settings" && (
          <SettingsContent
            onChangePassword={() => setPasswordDialogOpen(true)}
            onDeleteAccount={() => setDeleteDialogOpen(true)}
          />
        )}
      </div>

      <ChangePasswordDialog
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
      />

      <DeleteAccountDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        organizationName={organization?.name || ""}
      />
    </LayoutSheet>
  );
}

function getTabTitle(tab: TabValue): string {
  switch (tab) {
    case "profile":
      return "Profile";
    case "campaign":
      return "Campaign Settings";
    case "members":
      return "Members";
    case "settings":
      return "Settings";
    default:
      return "Menu";
  }
}

function ProfileContent({ user, organization }: { user: any; organization: any }) {
  return (
    <div className="space-y-6">
      {/* User Info */}
      <div className="rounded-md border border-border-subtle p-6">
        <h3 className="mb-4 text-sm font-medium text-text-primary">
          Personal Information
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs text-text-muted">Full Name</label>
            <div className="flex items-center gap-2 text-sm text-text-primary">
              <User className="h-4 w-4 text-text-muted" />
              {user?.name || "Not set"}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-text-muted">Email Address</label>
            <div className="flex items-center gap-2 text-sm text-text-primary">
              <Mail className="h-4 w-4 text-text-muted" />
              {user?.email || "Not set"}
            </div>
          </div>
        </div>
      </div>

      {/* Organization Info */}
      {organization && (
        <div className="rounded-md border border-border-subtle p-6">
          <h3 className="mb-4 text-sm font-medium text-text-primary">
            Organization
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs text-text-muted">
                Organization Name
              </label>
              <div className="flex items-center gap-2 text-sm text-text-primary">
                <Building2 className="h-4 w-4 text-text-muted" />
                {organization.name}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-muted">Slug</label>
              <div className="flex items-center gap-2 text-sm text-text-primary">
                <Globe className="h-4 w-4 text-text-muted" />
                {organization.slug}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface CampaignContentProps {
  eventName?: string;
  onEventNameChange?: (value: string) => void;
  targetAmount?: number;
  onTargetChange?: (value: number) => void;
  currency?: string;
  onCurrencyChange?: (value: string) => void;
  polarCheckoutUrl?: string;
  codeType?: "qr" | "zerocode";
  onCodeTypeChange?: (value: "qr" | "zerocode") => void;
}

function CampaignContent({
  eventName,
  onEventNameChange,
  targetAmount,
  onTargetChange,
  currency,
  onCurrencyChange,
  polarCheckoutUrl,
  codeType,
  onCodeTypeChange,
}: CampaignContentProps) {
  return (
    <div className="space-y-6">
      {/* Event Name */}
      <div className="rounded-md border border-border-subtle p-6">
        <h3 className="mb-4 text-sm font-medium text-text-primary">
          Event Details
        </h3>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
              Event Name
            </label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => onEventNameChange?.(e.target.value)}
              placeholder="e.g., Sunday Service"
              className="w-full h-8 rounded-md border border-border-default bg-bg-elevated px-2.5 text-xs font-semibold text-text-primary outline-none focus:ring-2 focus:ring-accent-primary/50"
            />
          </div>
        </div>
      </div>

      {/* Fundraising */}
      <div className="rounded-md border border-border-subtle p-6">
        <h3 className="mb-4 text-sm font-medium text-text-primary">
          Fundraising
        </h3>
        <div className="space-y-4">
          {/* Currency */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
              Currency
            </label>
            <Select
              value={currency}
              onValueChange={(v) => v && onCurrencyChange?.(v)}
            >
              <SelectTrigger className="w-full h-8 bg-bg-elevated border-border-default text-text-primary text-xs font-semibold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    <span className="text-xs">{c.symbol}</span>
                    <span className="text-xs">{c.code}</span>
                    <span className="text-[10px] text-text-muted">
                      {c.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Target Amount */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
              Target Amount
            </label>
            <input
              type="number"
              value={targetAmount}
              onChange={(e) => onTargetChange?.(Number(e.target.value))}
              className="w-full h-8 rounded-md border border-border-default bg-bg-elevated px-2.5 text-xs font-semibold text-text-primary outline-none focus:ring-2 focus:ring-accent-primary/50"
            />
          </div>
        </div>
      </div>

      {/* Barcode */}
      <div className="rounded-md border border-border-subtle p-6">
        <h3 className="mb-4 text-sm font-medium text-text-primary">
          Barcode Type
        </h3>
        <div className="space-y-4">
          <Select
            value={codeType}
            onValueChange={(v) => v && onCodeTypeChange?.(v as "qr" | "zerocode")}
          >
            <SelectTrigger className="w-full h-8 bg-bg-elevated border-border-default text-text-primary text-xs font-semibold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="qr">QR Code</SelectItem>
              <SelectItem value="zerocode">0Code</SelectItem>
            </SelectContent>
          </Select>

          {/* Polar Checkout URL */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
              Polar Checkout URL
            </label>
            <input
              type="text"
              value={polarCheckoutUrl}
              readOnly
              className="w-full h-8 rounded-md border border-border-default bg-bg-muted px-2.5 text-xs font-mono text-text-muted cursor-not-allowed"
            />
            <p className="text-[10px] text-text-muted">
              Donors scan the QR to pay via Polar
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ThemeButton({
  label,
  value,
}: {
  label: string;
  value: "light" | "dark";
}) {
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const isActive = theme === value;

  return (
    <button
      onClick={() => setTheme(value)}
      className={`flex-1 h-8 rounded-md px-4 border text-xs font-semibold transition-colors ${
        isActive
          ? "border-accent-primary bg-accent-primary text-bg-base"
          : "border-border-default bg-bg-elevated text-text-secondary hover:text-text-primary hover:border-border-strong"
      }`}
    >
      {label}
    </button>
  );
}

function SettingsContent({ onChangePassword, onDeleteAccount }: { onChangePassword: () => void; onDeleteAccount: () => void }) {
  return (
    <div className="space-y-6">
      {/* MoMo Devices */}
      <DevicesTab />

      {/* Appearance */}
      <div className="rounded-md border border-border-subtle p-6">
        <h3 className="mb-4 text-sm font-medium text-text-primary">
          Appearance
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-primary">Theme</p>
              <p className="text-xs text-text-muted">
                Select your preferred theme
              </p>
            </div>
            <div className="flex gap-2">
              <ThemeButton label="Light" value="light" />
              <ThemeButton label="Dark" value="dark" />
            </div>
          </div>
        </div>
      </div>

      {/* Account */}
      <div className="rounded-md border border-border-subtle p-6">
        <h3 className="mb-4 text-sm font-medium text-text-primary">Account</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-primary">Change Password</p>
              <p className="text-xs text-text-muted">
                Update your password regularly
              </p>
            </div>
            <Button
              variant="outline"
              className="rounded-md h-8 px-4 text-xs"
              onClick={onChangePassword}
            >
              Update
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-primary">Delete Account</p>
              <p className="text-xs text-text-muted">
                Permanently delete your account and data
              </p>
            </div>
            <Button
              variant="destructive"
              className="rounded-md h-8 px-4 text-xs"
              onClick={onDeleteAccount}
            >
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PasswordInput({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-text-primary">{label}</label>
      <div className="relative">
        <Input
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="rounded-md pr-10"
          required={required}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function ChangePasswordDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const logoutMutation = useLogout();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsPending(true);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to change password");
        setIsPending(false);
        return;
      }

      setShowWarning(true);
    } catch (err) {
      setError("An error occurred. Please try again.");
      setIsPending(false);
    }
  };

  const handleLogout = () => {
    onOpenChange(false);
    logoutMutation.mutate();
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setError("");
      setShowWarning(false);
    }
    onOpenChange(isOpen);
  };

  if (showWarning) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="rounded-md backdrop-blur-md bg-bg-elevated/90">
          <DialogHeader>
            <DialogTitle>Password Changed</DialogTitle>
            <DialogDescription>
              Your password has been changed successfully. You will be logged out
              for security reasons. Please login with your new password.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="default"
              className="rounded-md"
              onClick={handleLogout}
            >
              Logout & Login Again
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="rounded-md backdrop-blur-md bg-bg-elevated/90">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>
            Enter your current password and set a new one.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <PasswordInput
            label="Current Password"
            value={currentPassword}
            onChange={setCurrentPassword}
            required
          />
          <PasswordInput
            label="New Password"
            value={newPassword}
            onChange={setNewPassword}
            required
          />
          <PasswordInput
            label="Confirm New Password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            required
          />
          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-md"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              className="rounded-md"
              disabled={isPending}
            >
              {isPending ? "Changing..." : "Change Password"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteAccountDialog({
  open,
  onOpenChange,
  organizationName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationName: string;
}) {
  const logoutMutation = useLogout();
  const [confirmInput, setConfirmInput] = useState("");
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  const isMatch = confirmInput === organizationName;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isMatch) {
      setError("Organization name does not match");
      return;
    }

    setIsPending(true);

    try {
      const res = await fetch("/api/auth/delete-account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgName: organizationName }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to delete account");
        setIsPending(false);
        return;
      }

      onOpenChange(false);
      logoutMutation.mutate();
    } catch (err) {
      setError("An error occurred. Please try again.");
      setIsPending(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setConfirmInput("");
      setError("");
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="rounded-md backdrop-blur-md bg-bg-elevated/90">
        <DialogHeader>
          <DialogTitle className="text-red-500">Delete Account</DialogTitle>
          <DialogDescription>
            You are about to delete <span className="font-bold text-text-primary">{organizationName}</span>.
            This action is permanent and cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="rounded-md border border-red-500/30 bg-red-500/10 p-4">
            <p className="text-xs text-text-primary">
              Type <span className="font-bold text-red-500">{organizationName}</span> to confirm deletion.
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-text-primary">
              Organization Name
            </label>
            <Input
              type="text"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder={organizationName}
              className="rounded-md"
              required
            />
          </div>
          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-md"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              className="rounded-md"
              disabled={isPending || !isMatch}
            >
              {isPending ? "Deleting..." : "Delete Account"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
