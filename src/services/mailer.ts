import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

import type { RelayConfig } from "../config";
import type { AdminNotificationPayload } from "../validation";

export function createMailer(config: RelayConfig): Transporter {
  return nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: true,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.password,
    },
  });
}

export async function sendAdminNotificationEmail(
  transporter: Transporter,
  config: RelayConfig,
  payload: AdminNotificationPayload
): Promise<void> {
  await transporter.sendMail({
    from: config.smtp.fromEmail,
    to: config.adminNotificationEmail,
    subject: payload.subject,
    text: payload.message,
    html: payload.html ?? payload.message,
  });
}

export async function verifySmtpConnection(
  transporter: Transporter
): Promise<void> {
  await transporter.verify();
}
