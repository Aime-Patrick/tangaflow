import { Invitation } from "@/models/Invitation";
import { Organization } from "@/models/Organization";
import {
  invitationEmailMismatchMessage,
  type InvitationDetails,
  type PendingInvitation,
} from "@/lib/invitation-utils";

export type { InvitationDetails, PendingInvitation } from "@/lib/invitation-utils";
export { invitationEmailMismatchMessage } from "@/lib/invitation-utils";

interface PopulatedInvitation {
  _id: { toString(): string };
  email: string;
  role: InvitationDetails["role"];
  token: string;
  expiresAt: Date;
  status: string;
  organizationId: { name: string; slug: string } | null;
  invitedBy: { name: string } | null;
}

export async function getInvitationDetailsByToken(
  token: string
): Promise<InvitationDetails | null> {
  const { User } = await import("@/models/User");

  const invitation = (await Invitation.findOne({
    token,
    status: "pending",
    expiresAt: { $gt: new Date() },
  })
    .populate("organizationId", "name slug")
    .populate("invitedBy", "name")
    .lean()) as PopulatedInvitation | null;

  if (!invitation?.organizationId) {
    return null;
  }

  const accountExists = Boolean(
    await User.exists({ email: invitation.email.toLowerCase() })
  );

  return {
    email: invitation.email,
    role: invitation.role,
    organizationName: invitation.organizationId.name,
    organizationSlug: invitation.organizationId.slug,
    inviterName: invitation.invitedBy?.name || "A team member",
    expiresAt: invitation.expiresAt.toISOString(),
    accountExists,
  };
}

export async function getPendingInvitationsForEmail(
  email: string
): Promise<PendingInvitation[]> {
  const invitations = (await Invitation.find({
    email: email.toLowerCase(),
    status: "pending",
    expiresAt: { $gt: new Date() },
  })
    .populate("organizationId", "name slug")
    .lean()) as PopulatedInvitation[];

  return invitations
    .filter((inv) => inv.organizationId)
    .map((inv) => ({
      _id: inv._id.toString(),
      email: inv.email,
      role: inv.role,
      token: inv.token,
      organizationName: inv.organizationId!.name,
      organizationSlug: inv.organizationId!.slug,
      expiresAt: inv.expiresAt.toISOString(),
    }));
}

export async function acceptInvitationByToken(
  token: string,
  user: { _id: string; email: string; name: string }
): Promise<{
  organization: { _id: string; name: string; slug: string };
  message?: string;
}> {
  const invitation = await Invitation.findOne({
    token,
    status: "pending",
    expiresAt: { $gt: new Date() },
  });

  if (!invitation) {
    throw new InvitationAcceptError("Invalid or expired invitation", 400);
  }

  if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
    throw new InvitationAcceptError(
      invitationEmailMismatchMessage(invitation.email),
      403,
      invitation.email
    );
  }

  const org = await Organization.findById(invitation.organizationId);
  if (!org) {
    throw new InvitationAcceptError("Organization no longer exists", 404);
  }

  const existingMember = org.members.find(
    (m: { userId: { toString: () => string } }) =>
      m.userId.toString() === user._id
  );

  if (existingMember) {
    invitation.status = "accepted";
    await invitation.save();
    return {
      organization: {
        _id: org._id.toString(),
        name: org.name,
        slug: org.slug,
      },
      message: "You are already a member of this organization.",
    };
  }

  org.members.push({
    userId: user._id,
    role: invitation.role,
    email: invitation.email,
    name: user.name,
    joinedAt: new Date(),
  });
  await org.save();

  invitation.status = "accepted";
  await invitation.save();

  return {
    organization: {
      _id: org._id.toString(),
      name: org.name,
      slug: org.slug,
    },
  };
}

export class InvitationAcceptError extends Error {
  constructor(
    message: string,
    public status: number,
    public invitedEmail?: string
  ) {
    super(message);
    this.name = "InvitationAcceptError";
  }
}
