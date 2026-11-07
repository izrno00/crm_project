import { describe, expect, it } from "vitest";
import {
  acceptInviteSchema,
  changePasswordSchema,
  emailSchema,
  passwordSchema,
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
