// A local test website for the intake API (dev only).
//
//   npm run dev        (in one terminal: Flowdesk on http://localhost:3000)
//   npm run test-site  (in another: this site on http://localhost:5500)
//
// Both test businesses allow the origin http://localhost:5500, so this page can submit to them.
// It reads each connected website's form key from the dev database, so nothing is copied by hand.
// Needs SUPABASE_SECRET_KEY in .env.local. Only erasable TypeScript is used, because Node runs
// this file directly (same as scripts/seed-dev-users.ts).

import { createServer } from "node:http";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../lib/database.types";

const DEV_PROJECT_REF = "zbpimhaqjuabdzjruxjd";
const port = Number(process.env.TEST_SITE_PORT ?? 5500);
const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
const siteUrl = `http://localhost:${port}`;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;

if (!url || !secretKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local.");
  process.exit(1);
}
if (!url.includes(DEV_PROJECT_REF)) {
  console.error(`Refusing to run: ${url} is not the dev project (${DEV_PROJECT_REF}).`);
  process.exit(1);
}

const supabase = createClient<Database>(url, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const esc = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

type Source = { label: string; key: string; origins: string[]; active: boolean };

async function loadSources(): Promise<Source[]> {
  const { data, error } = await supabase
    .from("inquiry_sources")
    .select("name, public_key, allowed_origins, is_active, business:businesses(name)")
    .order("created_at");
  if (error) throw error;
  return (data ?? []).map((row) => {
    const business = Array.isArray(row.business) ? row.business[0] : row.business;
    return {
      label: `${business?.name ?? "Unknown"} · ${row.name}`,
      key: row.public_key,
      origins: row.allowed_origins,
      active: row.is_active,
    };
  });
}

const fields = (id: string) => `
  <label>Name <input name="name" value="Test Visitor" required maxlength="200" autocomplete="name"></label>
  <label>Email <input name="email" type="email" value="visitor@example.com" required maxlength="254" autocomplete="email"></label>
  <label>Subject <input name="subject" value="Test inquiry ${id}" required maxlength="200"></label>
  <label>Message <textarea name="message" required maxlength="5000" rows="4">Hello! This is a test message sent from the Flowdesk test website.</textarea></label>
  <input name="_hp" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-10000px">`;

// Plain strings (not template literals) so the browser code can use its own `${}`-free style.
const clientScript = `
const base = ${JSON.stringify(appUrl)};
const select = document.getElementById("source");
const bot = document.getElementById("bot");
const endpoint = () => base + "/api/v1/forms/" + select.value + "/inquiries";

function sync() {
  document.querySelectorAll("form.html-form").forEach((f) => { f.action = endpoint(); });
  document.getElementById("endpoint").textContent = endpoint();
}
select.addEventListener("change", sync);
sync();

document.querySelectorAll("form").forEach((form) => {
  form.addEventListener("submit", () => {
    form.querySelector("[name=_hp]").value = bot.checked ? "bot" : "";
  });
});

const jsForm = document.getElementById("js-form");
const out = document.getElementById("js-result");
jsForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  out.textContent = "Sending\\u2026";
  const body = JSON.stringify(Object.fromEntries(new FormData(jsForm)));
  try {
    const res = await fetch(endpoint(), { method: "POST", headers: { "Content-Type": "application/json" }, body });
    const text = await res.text();
    let pretty = text;
    try { pretty = JSON.stringify(JSON.parse(text), null, 2); } catch (e) {}
    out.textContent = res.status + " " + res.statusText + "\\n" + pretty;
  } catch (err) {
    out.textContent = "Request failed: " + err.message + "\\n(Is Flowdesk running at " + base + "? Is this origin allowed for the form key?)";
  }
});
`;

const style = `
  body { font-family: system-ui, sans-serif; max-width: 760px; margin: 2rem auto; padding: 0 1rem; line-height: 1.5; color: #1c1f1d; }
  h1 { margin-bottom: .25rem; } h2 { font-size: 1.1rem; margin: 0 0 .75rem; }
  section { border: 1px solid #d9dcd9; border-radius: 12px; padding: 1rem 1.25rem; margin: 1.25rem 0; }
  label { display: block; margin: .5rem 0; font-size: .9rem; }
  input:not([type=checkbox]), textarea, select { display: block; width: 100%; box-sizing: border-box; padding: .45rem .6rem; margin-top: .2rem; font: inherit; border: 1px solid #b8bdb8; border-radius: 8px; }
  button { padding: .5rem 1.1rem; border: 0; border-radius: 999px; background: #1c1f1d; color: #fff; font: inherit; cursor: pointer; margin-top: .5rem; }
  code, pre { background: #f1f3f1; border-radius: 6px; padding: .1rem .35rem; } pre { padding: .75rem; overflow: auto; }
  .muted { color: #626862; font-size: .9rem; } .warn { color: #a33; }
`;

function page(sources: Source[]) {
  const options = sources
    .map(
      (s) =>
        `<option value="${esc(s.key)}">${esc(s.label)}${s.active ? "" : " (inactive)"}${
          s.origins.includes(siteUrl) ? "" : " (origin not allowed)"
        }</option>`,
    )
    .join("");

  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>Flowdesk test website</title>
<style>${style}</style></head><body>
<h1>Flowdesk test website</h1>
<p class="muted">Served from <code>${esc(siteUrl)}</code>. Submissions go to <code id="endpoint"></code></p>

<label>Send to
  <select id="source">${options || '<option value="pk_none">No connected websites found</option>'}</select>
</label>
<label><input type="checkbox" id="bot"> Simulate a bot (fills the hidden spam-trap field, so nothing is stored)</label>

<section>
  <h2>1. HTML form with its own thank-you page</h2>
  <p class="muted">Sends <code>_redirect</code> and <code>_error_redirect</code>, so you land back on this site.</p>
  <form class="html-form" method="POST">${fields("(html + redirect)")}
    <input type="hidden" name="_redirect" value="${esc(siteUrl)}/thank-you.html">
    <input type="hidden" name="_error_redirect" value="${esc(siteUrl)}/error.html">
    <button type="submit">Send</button>
  </form>
</section>

<section>
  <h2>2. HTML form with no redirect pages</h2>
  <p class="muted">Flowdesk shows its own result page. Clear a field (or break the email) to see the error page.</p>
  <form class="html-form" method="POST" novalidate>${fields("(html, no redirect)")}
    <button type="submit">Send</button>
  </form>
</section>

<section>
  <h2>3. JavaScript (fetch)</h2>
  <p class="muted">Gets JSON back: <code>201 { ok: true }</code>, or an error with the invalid fields.</p>
  <form id="js-form" novalidate>${fields("(javascript)")}
    <button type="submit">Send</button>
  </form>
  <pre id="js-result">Nothing sent yet.</pre>
</section>

<script>${clientScript}</script></body></html>`;
}

const simplePage = (title: string, body: string) =>
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title><style>${style}</style></head><body>${body}
<p><a href="/">Back to the test website</a></p></body></html>`;

const thankYou = simplePage(
  "Thank you",
  `<h1>Thank you!</h1><p>This is the business's own thank-you page, reached through <code>_redirect</code>.</p>`,
);

const errorPage = simplePage(
  "Something went wrong",
  `<h1 class="warn">Something went wrong</h1>
   <p>This is the business's own error page, reached through <code>_error_redirect</code>.</p>
   <p>Error code: <code id="code"></code></p>
   <script>document.getElementById("code").textContent = new URLSearchParams(location.search).get("error") || "unknown";</script>`,
);

createServer(async (req, res) => {
  const path = new URL(req.url ?? "/", siteUrl).pathname;
  const send = (status: number, html: string) => {
    res.writeHead(status, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
    res.end(html);
  };

  try {
    if (path === "/") return send(200, page(await loadSources()));
    if (path === "/thank-you.html") return send(200, thankYou);
    if (path === "/error.html") return send(200, errorPage);
    return send(404, simplePage("Not found", "<h1>Not found</h1>"));
  } catch (error) {
    console.error(error);
    return send(500, simplePage("Error", "<h1>Could not load the connected websites</h1><p>See the terminal for details.</p>"));
  }
}).listen(port, () => {
  console.log(`Flowdesk test website: ${siteUrl}`);
  console.log(`Submitting to Flowdesk at: ${appUrl}  (start it with: npm run dev)`);
});
