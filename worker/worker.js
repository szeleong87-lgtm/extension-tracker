// Cloudflare Worker: a password-gated form that adds a new item to data.js
// in the extension-tracker GitHub repo, by committing the change via
// GitHub's API — no hand-editing needed. That commit triggers the repo's
// own CI/CD pipeline (test, then deploy) exactly like any other push.
//
// Secrets required (set via `wrangler secret put <NAME>`):
//   GITHUB_TOKEN   — fine-grained PAT, Contents: Read and write, scoped to
//                    this repo only.
//   FORM_PASSWORD  — the shared password required to submit the form.

const OWNER = "szeleong87-lgtm";
const REPO = "extension-tracker";
const BRANCH = "main";
const DATA_PATH = "data.js";

// Keep this in sync with data.js's categories if you ever add/rename one.
const CATEGORIES = [
  { id: "planning", name: "Planning" },
  { id: "build-costs", name: "Build Costs" },
  { id: "glazing", name: "Glazing" },
  { id: "kitchen", name: "Kitchen" },
  { id: "electrics", name: "Electrics" },
  { id: "flooring", name: "Flooring" },
  { id: "decorating", name: "Decorating" },
  { id: "snug", name: "Snug" },
];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/") {
      return html(renderForm());
    }

    if (request.method === "POST" && url.pathname === "/submit") {
      return handleSubmit(request, env);
    }

    return new Response("Not found", { status: 404 });
  },
};

function html(body, status = 200) {
  return new Response(body, {
    status,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function renderForm(message) {
  const options = CATEGORIES.map((c) => `<option value="${c.id}">${c.name}</option>`).join("");
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Add Item — Extension Tracker</title>
  <style>
    body { font-family: -apple-system, sans-serif; max-width: 420px; margin: 3rem auto; padding: 0 1rem; color: #2c2a26; }
    label { display: block; margin-top: 1rem; font-size: 0.9rem; }
    input, select { width: 100%; padding: 0.5rem; margin-top: 0.25rem; box-sizing: border-box; font: inherit; }
    button { margin-top: 1.5rem; padding: 0.6rem 1.2rem; font: inherit; cursor: pointer; }
    .message { margin-top: 1rem; padding: 0.75rem; border-radius: 6px; font-size: 0.9rem; }
    .success { background: #e5f6e5; color: #1a5c1a; }
    .error { background: #fbe5e5; color: #8a1a1a; }
  </style>
</head>
<body>
  <h1>Add an item</h1>
  ${message || ""}
  <form method="POST" action="/submit">
    <label>Category
      <select name="category" required>${options}</select>
    </label>
    <label>Item name
      <input type="text" name="name" required />
    </label>
    <label>Estimate
      <input type="number" step="0.01" name="estimate" value="0" required />
    </label>
    <label>Actual
      <input type="number" step="0.01" name="actual" value="0" required />
    </label>
    <label>Password
      <input type="password" name="password" required />
    </label>
    <button type="submit">Add item</button>
  </form>
</body>
</html>`;
}

async function handleSubmit(request, env) {
  const form = await request.formData();
  const password = form.get("password");
  const categoryId = form.get("category");
  const name = (form.get("name") || "").toString().trim();
  const estimate = Number(form.get("estimate"));
  const actual = Number(form.get("actual"));

  if (password !== env.FORM_PASSWORD) {
    return html(renderForm(`<div class="message error">Wrong password.</div>`), 403);
  }
  if (!name || Number.isNaN(estimate) || Number.isNaN(actual)) {
    return html(renderForm(`<div class="message error">Fill in every field with valid values.</div>`), 400);
  }
  const category = CATEGORIES.find((c) => c.id === categoryId);
  if (!category) {
    return html(renderForm(`<div class="message error">Unknown category.</div>`), 400);
  }

  try {
    await addItemToDataJs(env, category, { name, estimate, actual });
  } catch (err) {
    return html(renderForm(`<div class="message error">GitHub update failed: ${escapeHtml(err.message)}</div>`), 500);
  }

  return html(
    renderForm(
      `<div class="message success">Added "${escapeHtml(name)}" to ${category.name}. Live site updates in a minute or two once CI/CD finishes.</div>`
    )
  );
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

async function addItemToDataJs(env, category, item) {
  const apiBase = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${DATA_PATH}`;
  const headers = {
    Authorization: `Bearer ${env.GITHUB_TOKEN}`,
    "User-Agent": "extension-tracker-add-item-worker",
    Accept: "application/vnd.github+json",
  };

  const getRes = await fetch(`${apiBase}?ref=${BRANCH}`, { headers });
  if (!getRes.ok) throw new Error(`Could not read data.js (${getRes.status})`);
  const fileData = await getRes.json();
  const content = base64ToUtf8(fileData.content);

  const updated = insertItem(content, category.id, item);
  if (updated === content) throw new Error(`Could not find category "${category.id}" in data.js`);

  const putRes = await fetch(apiBase, {
    method: "PUT",
    headers: { ...headers, "content-type": "application/json" },
    body: JSON.stringify({
      message: `Add "${item.name}" to ${category.name} (via add-item form)`,
      content: utf8ToBase64(updated),
      sha: fileData.sha,
      branch: BRANCH,
    }),
  });
  if (!putRes.ok) {
    const err = await putRes.json().catch(() => ({}));
    throw new Error(err.message || `GitHub API error (${putRes.status})`);
  }
}

// Finds the category's `items: [` block and inserts the new item as the
// last line before its closing `],` — a targeted text edit that leaves
// every existing comment and item untouched. Depends on data.js keeping
// its current indentation (6-space `items: [` / `      ],`); the repo's
// own validate-data.js check will still catch it if that ever breaks.
function insertItem(source, categoryId, item) {
  const idIndex = source.indexOf(`id: "${categoryId}"`);
  if (idIndex === -1) return source;

  const itemsIndex = source.indexOf("items: [", idIndex);
  if (itemsIndex === -1) return source;

  const closeIndex = source.indexOf("\n      ],", itemsIndex);
  if (closeIndex === -1) return source;

  const line = `\n        { name: ${JSON.stringify(item.name)}, estimate: ${item.estimate}, actual: ${item.actual} },`;
  return source.slice(0, closeIndex) + line + source.slice(closeIndex);
}

// GitHub's Contents API returns/accepts file content as base64 of the raw
// UTF-8 bytes. atob()/btoa() alone only handle Latin-1 (one byte per JS
// char), so round-tripping any non-ASCII text (£, —, etc.) through them
// directly silently corrupts it. TextEncoder/TextDecoder do the UTF-8 part
// correctly; atob()/btoa() are only used here for the base64 <-> bytes step.
function base64ToUtf8(base64) {
  const binary = atob(base64.replace(/\n/g, ""));
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder("utf-8").decode(bytes);
}

function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}
