import { describe, expect, it } from "vitest";

import { validateAdminNotificationBody } from "../src/validation";

describe("validateAdminNotificationBody", () => {
  it("accepts a valid payload", () => {
    const result = validateAdminNotificationBody({
      type: "event_submitted",
      subject: "NEW EVENT notification",
      message: "Plain text body",
      html: "<p>Optional HTML</p>",
    });

    expect(result).toEqual({
      ok: true,
      data: {
        type: "event_submitted",
        subject: "NEW EVENT notification",
        message: "Plain text body",
        html: "<p>Optional HTML</p>",
      },
    });
  });

  it("accepts payload without html", () => {
    const result = validateAdminNotificationBody({
      type: "smoke",
      subject: "Relay smoke",
      message: "Test",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.html).toBeUndefined();
    }
  });

  it("rejects non-object bodies", () => {
    const result = validateAdminNotificationBody("invalid");
    expect(result).toEqual({
      ok: false,
      errors: ["Request body must be a JSON object"],
    });
  });

  it("rejects missing required fields", () => {
    const result = validateAdminNotificationBody({
      type: "",
      subject: "Subject",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain(
        "type is required and must be a non-empty string"
      );
      expect(result.errors).toContain(
        "message is required and must be a non-empty string"
      );
    }
  });

  it("rejects invalid html type", () => {
    const result = validateAdminNotificationBody({
      type: "smoke",
      subject: "Subject",
      message: "Body",
      html: 123,
    });

    expect(result).toEqual({
      ok: false,
      errors: ["html must be a string when provided"],
    });
  });
});
