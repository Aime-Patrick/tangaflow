import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error("Email send error:", error);
    return false;
  }
}

export function generateResetPasswordEmail(name: string, resetUrl: string) {
  return `
    <p>Hi ${name},</p>
    <p>You requested to reset your password. Click the link below to create a new password:</p>
    <p><a href="${resetUrl}">${resetUrl}</a></p>
    <p>This link expires in 1 hour.</p>
    <p>If you didn't request this, you can safely ignore this email.</p>
  `;
}

export function generateInvitationEmail(orgName: string, inviteUrl: string, role: string) {
  return `
    <p>You've been invited to join <strong>${orgName}</strong> as a <strong>${role}</strong>.</p>
    <p>Click the link below to accept the invitation:</p>
    <p><a href="${inviteUrl}">${inviteUrl}</a></p>
    <p>This invitation expires in 7 days.</p>
    <p>If you don't have an account yet, you'll be prompted to create one.</p>
  `;
}
