"use client";

import React, { useState } from "react";
import { UserPlus, Trash2, Shield, ShieldCheck, Crown, Mail, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  useMembers,
  useAddMember,
  useRemoveMember,
  useUpdateMemberRole,
  useInvitations,
  useInviteMember,
  useRevokeInvitation,
} from "@/features/orgs";
import { useAuth } from "@/lib/auth-context";
import { usePermission } from "@/hooks/use-permission";
import type { OrgRole } from "@/models/Organization";

interface MembersTabProps {
  organizationSlug: string;
}

export function MembersTab({ organizationSlug }: MembersTabProps) {
  const { user } = useAuth();
  const { data: members, isPending: isMembersPending } = useMembers(organizationSlug);
  const { data: invitations } = useInvitations(organizationSlug);
  const addMemberMutation = useAddMember(organizationSlug);
  const removeMemberMutation = useRemoveMember(organizationSlug);
  const updateRoleMutation = useUpdateMemberRole(organizationSlug);
  const inviteMemberMutation = useInviteMember(organizationSlug);
  const revokeInvitationMutation = useRevokeInvitation(organizationSlug);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<OrgRole>("member");
  const [error, setError] = useState("");

  const canManageMembers = usePermission("manage_members");
  const canDeleteOrganization = usePermission("delete_organization");
  const isOwner = canDeleteOrganization;
  const isAdmin = canManageMembers;

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    inviteMemberMutation.mutate(
      { email: newMemberEmail, role: newMemberRole },
      {
        onSuccess: () => {
          setAddDialogOpen(false);
          setNewMemberEmail("");
          setNewMemberRole("member");
        },
        onError: (err) => {
          setError(err.message);
        },
      }
    );
  };

  const handleRemoveMember = (userId: string) => {
    if (confirm("Are you sure you want to remove this member?")) {
      removeMemberMutation.mutate(userId);
    }
  };

  const handleRevokeInvitation = (token: string) => {
    if (confirm("Are you sure you want to revoke this invitation?")) {
      revokeInvitationMutation.mutate(token);
    }
  };

  const handleRoleChange = (userId: string, newRole: OrgRole) => {
    updateRoleMutation.mutate({ userId, role: newRole });
  };

  const getRoleIcon = (role: OrgRole) => {
    switch (role) {
      case "owner":
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case "admin":
        return <ShieldCheck className="h-4 w-4 text-blue-500" />;
      default:
        return <Shield className="h-4 w-4 text-text-muted" />;
    }
  };

  if (isMembersPending && !members) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-border-default border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-text-primary">Members</h3>
          <p className="text-xs text-text-muted">
            {members?.length || 0} member{(members?.length || 0) !== 1 ? "s" : ""} in your organization
          </p>
        </div>
        {isAdmin && (
          <Button
            size="sm"
            className="rounded-md"
            onClick={() => setAddDialogOpen(true)}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Member
          </Button>
        )}
      </div>

      {/* Pending Invitations */}
      {invitations && invitations.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider">
            Pending Invitations
          </h4>
          {invitations.map((invitation) => (
            <div
              key={invitation._id}
              className="flex items-center justify-between rounded-md border border-border-subtle p-4 bg-bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-bg-elevated">
                  <Mail className="h-4 w-4 text-text-muted" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {invitation.email}
                  </p>
                  <p className="text-xs text-text-muted flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Invited as {invitation.role} · Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {isAdmin && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-text-muted hover:text-red-500"
                  onClick={() => handleRevokeInvitation(invitation.token)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Members List */}
      <div className="space-y-2">
        {members?.map((member) => (
          <div
            key={member.userId}
            className="flex items-center justify-between rounded-md border border-border-subtle p-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-bg-elevated">
                <span className="text-sm font-medium text-text-primary">
                  {member.name?.charAt(0)?.toUpperCase() || member.email.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">
                  {member.name || "Unknown"}
                </p>
                <p className="text-xs text-text-muted">{member.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isOwner && member.userId !== user?._id ? (
                <Select
                  value={member.role}
                  onValueChange={(v) => handleRoleChange(member.userId, v as OrgRole)}
                >
                  <SelectTrigger className="w-28 h-8 rounded-md text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-3 w-3" />
                        Admin
                      </div>
                    </SelectItem>
                    <SelectItem value="member">
                      <div className="flex items-center gap-2">
                        <Shield className="h-3 w-3" />
                        Member
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-text-muted">
                  {getRoleIcon(member.role)}
                  <span className="capitalize">{member.role}</span>
                </div>
              )}

              {isAdmin && member.userId !== user?._id && member.role !== "owner" && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-text-muted hover:text-red-500"
                  onClick={() => handleRemoveMember(member.userId)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Invite Member Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="rounded-md backdrop-blur-md bg-bg-elevated/90">
          <DialogHeader>
            <DialogTitle>Invite Member</DialogTitle>
            <DialogDescription>
              Send an invitation to join your organization. They don&apos;t need an account yet.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddMember} className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-text-primary">
                Email Address
              </label>
              <Input
                type="email"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                placeholder="member@example.com"
                className="rounded-md"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-text-primary">
                Role
              </label>
              <Select
                value={newMemberRole}
                onValueChange={(v) => setNewMemberRole(v as OrgRole)}
              >
                <SelectTrigger className="w-full rounded-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4" />
                      Admin - Can manage members
                    </div>
                  </SelectItem>
                  <SelectItem value="member">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Member - Basic access
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-md"
                onClick={() => setAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-md"
                disabled={inviteMemberMutation.isPending}
              >
                {inviteMemberMutation.isPending ? "Sending..." : "Send Invitation"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
