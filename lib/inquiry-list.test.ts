import { describe, expect, it } from "vitest";
import { escapeLikePattern, inquiriesHref, pageRange, pageWindow } from "@/lib/inquiry-list";

describe("inquiriesHref", () => {
  it("returns the bare path for the default view", () => {
    expect(inquiriesHref()).toBe("/inquiries");
    expect(inquiriesHref({ status: "all", q: "", sort: "desc", page: 1 })).toBe("/inquiries");
  });

  it("keeps only the values that differ from the defaults", () => {
    expect(inquiriesHref({ status: "unanswered", sort: "asc" })).toBe("/inquiries?status=unanswered&sort=asc");
    expect(inquiriesHref({ page: 3 })).toBe("/inquiries?page=3");
  });

  it("trims and encodes the search text", () => {
    expect(inquiriesHref({ q: "  jane & co  " })).toBe("/inquiries?q=jane+%26+co");
    expect(inquiriesHref({ q: "   " })).toBe("/inquiries");
  });
});

describe("escapeLikePattern", () => {
  it("escapes wildcard characters so they match literally", () => {
    expect(escapeLikePattern("50%_off")).toBe("50\\%\\_off");
    expect(escapeLikePattern("a\\b")).toBe("a\\\\b");
  });

  it("escapes commas", () => {
    expect(escapeLikePattern("doe, jane")).toBe("doe\\, jane");
  });

  it("leaves ordinary text alone", () => {
    expect(escapeLikePattern("jane@example.com")).toBe("jane@example.com");
  });
});

describe("pageWindow", () => {
  it("lists every page when there are 7 or fewer", () => {
    expect(pageWindow(1, 1)).toEqual([1]);
    expect(pageWindow(2, 2)).toEqual([1, 2]);
    expect(pageWindow(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("collapses the far end near the start", () => {
    expect(pageWindow(1, 10)).toEqual([1, 2, 3, 4, 5, "…", 10]);
    expect(pageWindow(4, 10)).toEqual([1, 2, 3, 4, 5, "…", 10]);
  });

  it("collapses both sides in the middle", () => {
    expect(pageWindow(5, 10)).toEqual([1, "…", 4, 5, 6, "…", 10]);
    expect(pageWindow(6, 10)).toEqual([1, "…", 5, 6, 7, "…", 10]);
  });

  it("collapses the near end near the last page", () => {
    expect(pageWindow(7, 10)).toEqual([1, "…", 6, 7, 8, 9, 10]);
    expect(pageWindow(10, 10)).toEqual([1, "…", 6, 7, 8, 9, 10]);
  });
});

describe("pageRange", () => {
  it("gives the rows shown on a page", () => {
    expect(pageRange(1, 134)).toEqual({ from: 1, to: 20 });
    expect(pageRange(2, 134)).toEqual({ from: 21, to: 40 });
    expect(pageRange(7, 134)).toEqual({ from: 121, to: 134 });
  });

  it("handles an empty list", () => {
    expect(pageRange(1, 0)).toEqual({ from: 0, to: 0 });
  });
});
