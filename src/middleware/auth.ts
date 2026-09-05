import type { Request, Response, NextFunction } from "express";

import type { RelayConfig } from "../config";

export function createAuthMiddleware(config: RelayConfig) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const header = req.headers.authorization;

    if (!header?.startsWith("Bearer ")) {
      res.status(401).json({
        ok: false,
        error: "Missing or invalid Authorization header",
      });
      return;
    }

    const token = header.slice("Bearer ".length).trim();
    if (!token || token !== config.relayApiKey) {
      res.status(403).json({
        ok: false,
        error: "Invalid API key",
      });
      return;
    }

    next();
  };
}
