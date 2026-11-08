import { describe, expect, it } from "vitest";
import { backHref, inquiryHref, parseBackParams, withNotice } from "@/lib/inquiry-nav";

const ID = "3f8a2c1e-0d4b-4c57-9a61-2b7e5d9c1a10";

describe("inquiryHref", () => {
  it("has no back param for the default list view", () => {
    expect(inquiryHref(ID)).toBe(`/inquiries/${ID}`);
    expect(inquiryHref(ID, { status: "all", q: "", sort: "desc", page: 1 })).toBe(`/inquiries/${ID}`);
  });

  it("remembers the list view in the back param", () => {
    expect(inquiryHref(ID, { status: "unanswered", page: 2 })).toBe(
      `/inquiries/${ID}?back=status%3Dunanswered%26page%3D2`,
    );
  });
});

describe("backHref", () => {
  it("round-trips a list view", () => {
    const href = inquiryHref(ID, { status: "awaiting", q: "jane & co", sort: "asc", page: 3 });
    const back = new URL(href, "http://x").searchParams.get("back");
    expect(backHref(back)).toBe("/inquiries?status=awaiting&q=jane+%26+co&sort=asc&page=3");
  });

  it("falls back to the plain list when the value is missing or not text", () => {
    expect(backHref(undefined)).toBe("/inquiries");
    expect(backHref("")).toBe("/inquiries");
    expect(backHref(42)).toBe("/inquiries");
    expect(backHref([])).toBe("/inquiries");
  });

  it("uses the first value of a repeated back param", () => {
    expect(backHref(["status=answered", "status=new"])).toBe("/inquiries?status=answered");
  });

  it("uses the first value of a repeated key inside the value", () => {
    expect(backHref("page=2&page=5")).toBe("/inquiries?page=2");
  });

  it("drops invalid values instead of passing them on", () => {
    expect(backHref("status=bogus&sort=sideways&page=-4")).toBe("/inquiries");
  });

  it("can only ever lead to the inquiries list", () => {
    for (const evil of [
      "https://evil.example/phish",
      "//evil.example",
      "/dashboard",
      "javascript:alert(1)",
      "status=all&next=https://evil.example",
    ]) {
      expect(backHref(evil)).toMatch(/^\/inquiries(\?|$)/);
      expect(backHref(evil)).not.toContain("evil");
    }
  });

  it("ignores an oversized value", () => {
    expect(backHref(`q=${"a".repeat(5000)}`)).toBe(`/inquiries?q=${"a".repeat(100)}`);
    expect(parseBackParams("x".repeat(5000)).page).toBe(1);
  });
});

describe("withNotice", () => {
  it("starts a query string when there is none", () => {
    expect(withNotice("/inquiries", "inquiry_deleted")).toBe("/inquiries?notice=inquiry_deleted");
  });

  it("adds to an existing query string", () => {
    expect(withNotice("/inquiries?status=new", "inquiry_deleted")).toBe(
      "/inquiries?status=new&notice=inquiry_deleted",
    );
  });
});
