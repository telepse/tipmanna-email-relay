import express from "express";

import { loadConfig } from "./config";
import { createAdminNotificationsRouter } from "./routes/admin-notifications";
import { createHealthRouter } from "./routes/health";
import { createMailer } from "./services/mailer";

function main(): void {
  const config = loadConfig();
  const transporter = createMailer(config);
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json({ limit: "256kb" }));

  app.use("/health", createHealthRouter({ transporter }));
  app.use(
    "/admin-notifications",
    createAdminNotificationsRouter(config, transporter)
  );

  app.use((_req, res) => {
    res.status(404).json({ ok: false, error: "Not found" });
  });

  app.listen(config.port, () => {
    console.log(
      `[email-relay] listening on port ${config.port} (SMTP ${config.smtp.host}:${config.smtp.port})`
    );
  });
}

main();
