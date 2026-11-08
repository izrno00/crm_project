import { describe, expect, it } from "vitest";
import {
  acceptInviteSchema,
  changePasswordSchema,
  emailSchema,
  emailSettingsSchema,
  inquiryListParamsSchema,
  passwordSchema,
  replySchema,
  setPasswordSchema,
  signInSchema,
} from "./validation";
import { en } from "./strings/en";

const v = en.validation;

describe("passwordSchema", () => {
  it.each(["abcdefg1", "Passw0rdOK", "1234567a", "a".repeat(71) + "1"])("accepts %s", (password) => {
    expect(passwordSchema.safeParse(password).success).toBe(true);
  });

  it("rejects passwords shorter than 8 characters", () => {
    const result = passwordSchema.safeParse("abc1234");
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe(v.passwordTooShort);
  });

  it("requires a digit", () => {
    const result = passwordSchema.safeParse("abcdefghij");
    expect(result.error?.issues.map((i) => i.message)).toContain(v.passwordNeedsDigit);
  });

  it("requires a letter", () => {
    const result = passwordSchema.safeParse("1234567890");
    expect(result.error?.issues.map((i) => i.message)).toContain(v.passwordNeedsLetter);
  });

  it("rejects passwords longer than 72 characters", () => {
    const result = passwordSchema.safeParse("a1" + "x".repeat(71));
    expect(result.error?.issues.map((i) => i.message)).toContain(v.passwordTooLong);
  });
});

describe("emailSchema", () => {
  it("trims and lowercases", () => {
    expect(emailSchema.parse("  Owner@Example.COM ")).toBe("owner@example.com");
  });

  it("rejects an empty value", () => {
    expect(emailSchema.safeParse("   ").success).toBe(false);
  });

  it("rejects a malformed address", () => {
    const result = emailSchema.safeParse("not-an-email");
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe(v.emailInvalid);
  });
});

describe("signInSchema", () => {
  it("accepts an email and any non-empty password", () => {
    expect(signInSchema.safeParse({ email: "a@b.co", password: "x" }).success).toBe(true);
  });

  it("requires a password", () => {
    const result = signInSchema.safeParse({ email: "a@b.co", password: "" });
    expect(result.error?.issues[0].message).toBe(v.passwordRequired);
  });
});

describe("password confirmation", () => {
  it("setPasswordSchema flags a mismatch on confirmPassword", () => {
    const result = setPasswordSchema.safeParse({ password: "abcdefg1", confirmPassword: "abcdefg2" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["confirmPassword"]);
    expect(result.error?.issues[0].message).toBe(v.passwordMismatch);
  });

  it("setPasswordSchema accepts a matching pair", () => {
    expect(setPasswordSchema.safeParse({ password: "abcdefg1", confirmPassword: "abcdefg1" }).success).toBe(true);
  });

  it("acceptInviteSchema requires a name", () => {
    const result = acceptInviteSchema.safeParse({
      fullName: "   ",
      password: "abcdefg1",
      confirmPassword: "abcdefg1",
    });
    expect(result.error?.issues[0].message).toBe(v.nameRequired);
  });
});

describe("changePasswordSchema", () => {
  const base = { currentPassword: "oldpass1", newPassword: "newpass12", confirmPassword: "newpass12" };

  it("accepts a valid change", () => {
    expect(changePasswordSchema.safeParse(base).success).toBe(true);
  });

  it("requires the current password", () => {
    const result = changePasswordSchema.safeParse({ ...base, currentPassword: "" });
    expect(result.error?.issues[0].message).toBe(v.currentPasswordRequired);
  });

  it("rejects a new password equal to the current one", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "samepass1",
      newPassword: "samepass1",
      confirmPassword: "samepass1",
    });
    expect(result.error?.issues[0].message).toBe(v.passwordUnchanged);
  });

  it("rejects a mismatched confirmation", () => {
    const result = changePasswordSchema.safeParse({ ...base, confirmPassword: "different1" });
    expect(result.error?.issues[0].path).toEqual(["confirmPassword"]);
  });
});

describe("inquiryListParamsSchema", () => {
  const defaults = { status: "all", q: "", sort: "desc", page: 1 };

  it("uses the defaults for an empty query", () => {
    expect(inquiryListParamsSchema.parse({})).toEqual(defaults);
  });

  it("accepts valid values", () => {
    expect(
      inquiryListParamsSchema.parse({ status: "awaiting", q: "jane", sort: "asc", page: "3" }),
    ).toEqual({ status: "awaiting", q: "jane", sort: "asc", page: 3 });
  });

  it("accepts every status filter", () => {
    for (const status of ["all", "unanswered", "new", "awaiting", "answered", "archived"]) {
      expect(inquiryListParamsSchema.parse({ status }).status).toBe(status);
    }
  });

  it("falls back to the default for each invalid value on its own", () => {
    expect(inquiryListParamsSchema.parse({ status: "bogus", sort: "sideways", page: "-1" })).toEqual(defaults);
    expect(inquiryListParamsSchema.parse({ status: "new", page: "abc" })).toEqual({ ...defaults, status: "new" });
    expect(inquiryListParamsSchema.parse({ page: "1.5" }).page).toBe(1);
    expect(inquiryListParamsSchema.parse({ page: "0" }).page).toBe(1);
  });

  it("uses the first value of a repeated param", () => {
    expect(inquiryListParamsSchema.parse({ status: ["answered", "new"], page: ["2", "5"] })).toEqual({
      ...defaults,
      status: "answered",
      page: 2,
    });
  });

  it("trims the search text and cuts it to 100 characters", () => {
    expect(inquiryListParamsSchema.parse({ q: "  jane  " }).q).toBe("jane");
    expect(inquiryListParamsSchema.parse({ q: "x".repeat(150) }).q).toHaveLength(100);
  });

  it("ignores unknown params", () => {
    expect(inquiryListParamsSchema.parse({ utm_source: "x" })).toEqual(defaults);
  });
});

describe("replySchema", () => {
  const ids = {
    inquiryId: "3f2a6c1e-5b7d-4e8f-9a0b-1c2d3e4f5a6b",
    messageId: "7b8c9d0e-1f2a-4b3c-8d4e-5f6a7b8c9d0e",
  };

  it("accepts a reply and normalises its line breaks", () => {
    expect(replySchema.parse({ ...ids, content: "  Hi Ana,\r\n\r\nYes.  " }).content).toBe("Hi Ana,\n\nYes.");
  });

  it("rejects an empty or whitespace-only reply", () => {
    const result = replySchema.safeParse({ ...ids, content: " \n " });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(v.replyRequired);
  });

  it("allows at most 10,000 characters, counting a Windows line break as one", () => {
    expect(replySchema.safeParse({ ...ids, content: "x".repeat(10_000) }).success).toBe(true);
    expect(replySchema.safeParse({ ...ids, content: "x".repeat(10_001) }).success).toBe(false);
    expect(
      replySchema.safeParse({ ...ids, content: "x".repeat(4_999) + "\r\n" + "x".repeat(5_000) }).success,
    ).toBe(true);
  });

  it("rejects ids that are not uuids", () => {
    expect(replySchema.safeParse({ ...ids, messageId: "1", content: "Hi" }).success).toBe(false);
  });
});

describe("emailSettingsSchema", () => {
  const valid = { senderName: "Acme Plumbing", replyToEmail: "", signature: "", bccReplies: false };

  it("saves empty reply-to and signature as null (use the defaults)", () => {
    expect(emailSettingsSchema.parse(valid)).toEqual({
      senderName: "Acme Plumbing",
      replyToEmail: null,
      signature: null,
      bccReplies: false,
    });
  });

  it("keeps the sender name on one line", () => {
    expect(emailSettingsSchema.parse({ ...valid, senderName: "  Acme\r\nPlumbing " }).senderName).toBe(
      "Acme Plumbing",
    );
  });

  it("requires a sender name of at most 200 characters", () => {
    expect(emailSettingsSchema.safeParse({ ...valid, senderName: " " }).success).toBe(false);
    expect(emailSettingsSchema.safeParse({ ...valid, senderName: "x".repeat(201) }).success).toBe(false);
  });

  it("checks the reply-to address", () => {
    expect(emailSettingsSchema.parse({ ...valid, replyToEmail: " Help@Acme.Example " }).replyToEmail).toBe(
      "help@acme.example",
    );
    const bad = emailSettingsSchema.safeParse({ ...valid, replyToEmail: "not-an-email" });
    expect(bad.success).toBe(false);
    expect(bad.error?.issues[0]?.message).toBe(v.replyToInvalid);
  });

  it("allows a signature of up to 1,000 characters", () => {
    expect(emailSettingsSchema.parse({ ...valid, signature: "Best,\r\nMarko" }).signature).toBe("Best,\nMarko");
    expect(emailSettingsSchema.safeParse({ ...valid, signature: "x".repeat(1_001) }).success).toBe(false);
  });
});
