import "dotenv/config";

export type RelayConfig = {
  port: number;
  relayApiKey: string;
  smtp: {
    host: string;
    port: number;
    user: string;
    password: string;
    fromEmail: string;
  };
  adminNotificationEmail: string;
};

const REQUIRED_ENV = [
  "RELAY_API_KEY",
  "QSERVER_SMTP_HOST",
  "QSERVER_SMTP_PORT",
  "QSERVER_SMTP_USER",
  "QSERVER_SMTP_PASSWORD",
  "QSERVER_FROM_EMAIL",
  "ADMIN_NOTIFICATION_EMAIL",
] as const;

function requireEnv(name: (typeof REQUIRED_ENV)[number]): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function parsePort(raw: string, name: string): number {
  const port = Number.parseInt(raw, 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid ${name}: must be an integer between 1 and 65535`);
  }
  return port;
}

export function loadConfig(): RelayConfig {
  for (const name of REQUIRED_ENV) {
    requireEnv(name);
  }

  const port = parsePort(process.env.PORT?.trim() || "8080", "PORT");

  return {
    port,
    relayApiKey: requireEnv("RELAY_API_KEY"),
    smtp: {
      host: requireEnv("QSERVER_SMTP_HOST"),
      port: parsePort(requireEnv("QSERVER_SMTP_PORT"), "QSERVER_SMTP_PORT"),
      user: requireEnv("QSERVER_SMTP_USER"),
      password: requireEnv("QSERVER_SMTP_PASSWORD"),
      fromEmail: requireEnv("QSERVER_FROM_EMAIL"),
    },
    adminNotificationEmail: requireEnv("ADMIN_NOTIFICATION_EMAIL"),
  };
}
