import { describe, expect, it } from "vitest";
import { getRequestOrigin, isAllowedOrigin, originOf, safeRedirect } from "@/lib/intake/origin";

const allowed = ["https://acme.com", "https://www.acme.com", "http://localhost:5500"];

describe("originOf", () => {
  it("returns the origin of an http(s) URL", () => {
    expect(originOf("https://acme.com/contact?x=1#top")).toBe("https://acme.com");
    expect(originOf("http://localhost:5500/thanks")).toBe("http://localhost:5500");
  });

  it("returns null for anything else", () => {
    expect(originOf(null)).toBeNull();
    expect(originOf("")).toBeNull();
    expect(originOf("not a url")).toBeNull();
    expect(originOf("javascript:alert(1)")).toBeNull();
    expect(originOf("ftp://acme.com")).toBeNull();
  });
});

describe("getRequestOrigin", () => {
  it("prefers the Origin header", () => {
    const headers = new Headers({ origin: "https://acme.com", referer: "https://other.com/x" });
    expect(getRequestOrigin(headers)).toBe("https://acme.com");
  });

  it("falls back to the Referer's origin when Origin is missing", () => {
    expect(getRequestOrigin(new Headers({ referer: "https://acme.com/contact" }))).toBe("https://acme.com");
  });

  it('treats the literal "null" Origin as missing', () => {
    const headers = new Headers({ origin: "null", referer: "https://acme.com/contact" });
    expect(getRequestOrigin(headers)).toBe("https://acme.com");
  });

  it("returns null when there is no usable header", () => {
    expect(getRequestOrigin(new Headers())).toBeNull();
    expect(getRequestOrigin(new Headers({ origin: "null" }))).toBeNull();
  });
});

describe("isAllowedOrigin", () => {
  it("matches exactly", () => {
    expect(isAllowedOrigin("https://acme.com", allowed)).toBe(true);
    expect(isAllowedOrigin("http://localhost:5500", allowed)).toBe(true);
  });

  it("rejects a different scheme, port, subdomain or host", () => {
    expect(isAllowedOrigin("http://acme.com", allowed)).toBe(false);
    expect(isAllowedOrigin("http://localhost:3000", allowed)).toBe(false);
    expect(isAllowedOrigin("https://shop.acme.com", allowed)).toBe(false);
    expect(isAllowedOrigin("https://acme.com.evil.com", allowed)).toBe(false);
  });

  it("rejects a missing origin and an empty allow-list", () => {
    expect(isAllowedOrigin(null, allowed)).toBe(false);
    expect(isAllowedOrigin("https://acme.com", [])).toBe(false);
  });

  it("normalises stored origins (case, default port)", () => {
    expect(isAllowedOrigin("https://acme.com", ["HTTPS://Acme.com:443"])).toBe(true);
  });
});

describe("safeRedirect", () => {
  it("accepts a URL on an allowed origin", () => {
    expect(safeRedirect("https://acme.com/thank-you", allowed)).toBe("https://acme.com/thank-you");
    expect(safeRedirect("http://localhost:5500/thank-you.html", allowed)).toBe(
      "http://localhost:5500/thank-you.html",
    );
  });

  it("rejects other origins (open redirect)", () => {
    expect(safeRedirect("https://evil.com/thanks", allowed)).toBeNull();
    expect(safeRedirect("https://acme.com.evil.com/", allowed)).toBeNull();
  });

  it("rejects credentials tricks", () => {
    expect(safeRedirect("https://acme.com@evil.com/", allowed)).toBeNull();
    expect(safeRedirect("https://evil.com\\@acme.com/", allowed)).toBeNull();
  });

  it("rejects relative URLs, non-http schemes and empty values", () => {
    expect(safeRedirect("/thanks", allowed)).toBeNull();
    expect(safeRedirect("//evil.com", allowed)).toBeNull();
    expect(safeRedirect("javascript:alert(1)", allowed)).toBeNull();
    expect(safeRedirect("", allowed)).toBeNull();
    expect(safeRedirect(undefined, allowed)).toBeNull();
  });
});
