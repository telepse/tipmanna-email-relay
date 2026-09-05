export type AdminNotificationPayload = {
  type: string;
  subject: string;
  message: string;
  html?: string;
};

export type ValidationResult =
  | { ok: true; data: AdminNotificationPayload }
  | { ok: false; errors: string[] };

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function validateAdminNotificationBody(
  body: unknown
): ValidationResult {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, errors: ["Request body must be a JSON object"] };
  }

  const record = body as Record<string, unknown>;
  const errors: string[] = [];

  if (!isNonEmptyString(record.type)) {
    errors.push("type is required and must be a non-empty string");
  }
  if (!isNonEmptyString(record.subject)) {
    errors.push("subject is required and must be a non-empty string");
  }
  if (!isNonEmptyString(record.message)) {
    errors.push("message is required and must be a non-empty string");
  }
  if (record.html !== undefined && typeof record.html !== "string") {
    errors.push("html must be a string when provided");
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const type = record.type as string;
  const subject = record.subject as string;
  const message = record.message as string;

  return {
    ok: true,
    data: {
      type: type.trim(),
      subject: subject.trim(),
      message: message.trim(),
      html:
        typeof record.html === "string" ? record.html : undefined,
    },
  };
}
