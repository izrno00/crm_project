import { describe, expect, it } from "vitest";
import { appendQuery, safeNextPath } from "./redirect";

describe("safeNextPath", () => {
  it.each(["/dashboard", "/inquiries?status=new&page=2", "/settings/account", "/"])(
    "accepts the relative path %s",
    (path) => {
      expect(safeNextPath(path)).toBe(path);
    },
  );

  it.each([
    "//evil.com",
    "//evil.com/path",
    "/\\evil.com",
    "\\\\evil.com",
    "https://evil.com",
    "http://localhost:3000/dashboard",
    "javascript:alert(1)",
    "dashboard",
    "/dash\nboard",
    "/dash\tboard",
    "/%0d%0a" + "\r",
    "",
  ])("rejects %j", (value) => {
    expect(safeNextPath(value)).toBeNull();
  });

  it.each([undefined, null, 42, {}, ["/dashboard"]])("rejects the non-string %j", (value) => {
    expect(safeNextPath(value)).toBeNull();
  });
});

describe("appendQuery", () => {
  it("starts a query string", () => {
    expect(appendQuery("/dashboard", "notice", "password_updated")).toBe(
      "/dashboard?notice=password_updated",
    );
  });

  it("extends an existing query string", () => {
    expect(appendQuery("/inquiries?status=new", "notice", "x")).toBe("/inquiries?status=new&notice=x");
  });

  it("encodes the value", () => {
    expect(appendQuery("/a", "k", "a b&c")).toBe("/a?k=a%20b%26c");
  });
});
