import { Router } from "express";
import type { Transporter } from "nodemailer";

import type { RelayConfig } from "../config";
import { createAuthMiddleware } from "../middleware/auth";
import { sendAdminNotificationEmail } from "../services/mailer";
import { validateAdminNotificationBody } from "../validation";

export function createAdminNotificationsRouter(
  config: RelayConfig,
  transporter: Transporter
): Router {
  const router = Router();
  const authenticate = createAuthMiddleware(config);

  router.post("/", authenticate, async (req, res) => {
    const validation = validateAdminNotificationBody(req.body);
    if (!validation.ok) {
      res.status(400).json({
        ok: false,
        error: "Validation failed",
        details: validation.errors,
      });
      return;
    }

    try {
      await sendAdminNotificationEmail(
        transporter,
        config,
        validation.data
      );

      res.status(200).json({
        ok: true,
        type: validation.data.type,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown SMTP error";
      console.error("[admin-notifications] SMTP send failed:", message);

      res.status(502).json({
        ok: false,
        error: "Failed to deliver email via SMTP",
      });
    }
  });

  return router;
}
