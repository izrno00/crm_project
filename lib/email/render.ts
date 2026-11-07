import { render } from "@react-email/components";
import type { ReactElement } from "react";

// Renders a React Email template to the HTML and plain-text versions of an email.
export async function renderEmail(element: ReactElement): Promise<{ html: string; text: string }> {
  const [html, text] = await Promise.all([render(element), render(element, { plainText: true })]);
  return { html, text };
}
