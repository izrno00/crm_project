import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DashboardEmpty } from "@/components/app/dashboard/dashboard-empty";
import { StatusBadge } from "@/components/app/status-badge";

describe("DashboardEmpty", () => {
  it("explains that inquiries appear once the website form is connected (DASH-7)", () => {
    const html = renderToStaticMarkup(createElement(DashboardEmpty));
    expect(html).toContain("No inquiries yet");
    expect(html).toContain("contact form on your connected website");
  });
});

describe("StatusBadge", () => {
  it("shows the status labels from the PRD", () => {
    for (const [status, label] of [
      ["new", "New"],
      ["awaiting", "Awaiting response"],
      ["answered", "Answered"],
    ] as const) {
      expect(renderToStaticMarkup(createElement(StatusBadge, { status }))).toContain(label);
    }
  });
});
