import { Router } from "express";
import type { Transporter } from "nodemailer";

import { verifySmtpConnection } from "../services/mailer";

type HealthRouterOptions = {
  transporter: Transporter;
};

export function createHealthRouter({
  transporter,
}: HealthRouterOptions): Router {
  const router = Router();

  router.get("/", async (_req, res) => {
    try {
      await verifySmtpConnection(transporter);
      res.status(200).json({
        ok: true,
        status: "healthy",
        smtp: "connected",
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "SMTP verification failed";
      console.error("[health] SMTP check failed:", message);

      res.status(503).json({
        ok: false,
        status: "degraded",
        smtp: "unreachable",
      });
    }
  });

  return router;
}
