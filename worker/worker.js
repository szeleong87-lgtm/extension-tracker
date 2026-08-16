// Cloudflare Worker: reads/writes the extension-tracker's cost data from a
// Workers KV namespace, instead of that data living hardcoded in data.js.
//
// - GET  /data.json      — public, CORS-enabled JSON of the current data.
//                           The site's pages fetch this at load time.
// - GET  /               — password-gated admin page: add an item, edit an
//                           existing item's price, edit the overall budget,
//                           or update a milestone's status.
// - POST /submit         — add a new item.
// - POST /edit-price     — update an existing item's estimate/actual.
// - POST /edit-budget    — update the overall budget.
// - POST /edit-milestone — update an existing milestone's status/date.
//
// Changes here take effect immediately (no git commit, no CI/CD wait).
// data.js in the repo is kept only as a static fallback in case this Worker
// or KV is ever unreachable — it is not updated automatically by this file.
//
// Secrets required (set via `wrangler secret put <NAME>`):
//   FORM_PASSWORD  — the shared password required to submit any form here.

const KV_KEY = "data";

// Keep this in sync with data.js's categories if you ever add/rename one
// (adding a whole new category still needs a new .html page, so isn't
// something this form can do).
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

// Valid milestone statuses. Adding/removing/reordering a milestone itself
// (as opposed to updating its status) isn't exposed as a form here — edit
// data.milestones directly in KV, or data.js's fallback, for that.
const MILESTONE_STATUSES = ["upcoming", "in-progress", "done"];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/") {
      return renderAdminPage(env);
    }

    if (request.method === "GET" && url.pathname === "/data.json") {
      return getData(env);
    }

    if (request.method === "POST" && url.pathname === "/submit") {
      return handleSubmit(request, env);
    }

    if (request.method === "POST" && url.pathname === "/edit-price") {
      return handleEditPrice(request, env);
    }

    if (request.method === "POST" && url.pathname === "/edit-budget") {
      return handleEditBudget(request, env);
    }

    if (request.method === "POST" && url.pathname === "/edit-milestone") {
      return handleEditMilestone(request, env);
    }

    return new Response("Not found", { status: 404 });
  },
};

// ---------------------------------------------------------------------------
// KV read/write
// ---------------------------------------------------------------------------

async function readData(env) {
  const data = await env.EXTENSION_DATA.get(KV_KEY, "json");
  if (!data) throw new Error("No data found in KV — has it been seeded?");
  return data;
}

async function writeData(env, data) {
  await env.EXTENSION_DATA.put(KV_KEY, JSON.stringify(data));
}

async function getData(env) {
  try {
    const data = await readData(env);
    return new Response(JSON.stringify(data), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "access-control-allow-origin": "*",
        "cache-control": "no-store",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "access-control-allow-origin": "*",
      },
    });
  }
}

// ---------------------------------------------------------------------------
// Admin page
// ---------------------------------------------------------------------------

function html(body, status = 200) {
  return new Response(body, {
    status,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

async function renderAdminPage(env, message) {
  let data;
  try {
    data = await readData(env);
  } catch (err) {
    return html(`<p>Failed to load data from KV: ${escapeHtml(err.message)}</p>`, 500);
  }

  const categoryOptions = CATEGORIES.map((c) => `<option value="${c.id}">${c.name}</option>`).join("");
  const itemsByCategory = {};
  data.categories.forEach((cat) => {
    itemsByCategory[cat.id] = cat.items.map((i) => ({ name: i.name, estimate: i.estimate, actual: i.actual }));
  });
  const itemsJson = JSON.stringify(itemsByCategory).replace(/</g, "\\u003c");

  const milestones = data.milestones || [];
  const milestoneOptions = milestones.map((m) => `<option value="${m.name}">${m.name}</option>`).join("");
  const milestoneStatusOptions = MILESTONE_STATUSES.map((s) => `<option value="${s}">${s}</option>`).join("");
  const milestonesByName = {};
  milestones.forEach((m) => {
    milestonesByName[m.name] = { status: m.status, date: m.date || "" };
  });
  const milestonesJson = JSON.stringify(milestonesByName).replace(/</g, "\\u003c");

  return html(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Manage — Extension Tracker</title>
  <style>
    body { font-family: -apple-system, sans-serif; max-width: 480px; margin: 3rem auto; padding: 0 1rem; color: #2c2a26; }
    h1 { margin-bottom: 0.25rem; }
    h2 { margin-top: 0; font-size: 1.1rem; }
    section { border: 1px solid #ddd; border-radius: 8px; padding: 1rem 1.25rem 1.25rem; margin-top: 1.5rem; }
    label { display: block; margin-top: 1rem; font-size: 0.9rem; }
    input, select { width: 100%; padding: 0.5rem; margin-top: 0.25rem; box-sizing: border-box; font: inherit; }
    button { margin-top: 1.5rem; padding: 0.6rem 1.2rem; font: inherit; cursor: pointer; }
    .message { margin-bottom: 1.5rem; padding: 0.75rem; border-radius: 6px; font-size: 0.9rem; }
    .success { background: #e5f6e5; color: #1a5c1a; }
    .error { background: #fbe5e5; color: #8a1a1a; }
  </style>
</head>
<body>
  <h1>Manage Extension Tracker</h1>
  <p><a href="https://szeleong87-lgtm.github.io/extension-tracker/">&larr; Back to tracker</a> &middot; <a href="/data.json">/data.json</a></p>
  ${message || ""}

  <section>
    <h2>Edit an item's price</h2>
    <form method="POST" action="/edit-price">
      <label>Category
        <select name="category" id="ep-category">${categoryOptions}</select>
      </label>
      <label>Item
        <select name="name" id="ep-item"></select>
      </label>
      <label>Estimate
        <input type="number" step="0.01" name="estimate" id="ep-estimate" required />
      </label>
      <label>Actual
        <input type="number" step="0.01" name="actual" id="ep-actual" required />
      </label>
      <label>Password
        <input type="password" name="password" required />
      </label>
      <button type="submit">Update price</button>
    </form>
  </section>

  <section>
    <h2>Add a new item</h2>
    <form method="POST" action="/submit">
      <label>Category
        <select name="category" required>${categoryOptions}</select>
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
  </section>

  <section>
    <h2>Edit overall budget</h2>
    <form method="POST" action="/edit-budget">
      <label>Budget
        <input type="number" step="0.01" name="budget" value="${data.budget}" required />
      </label>
      <label>Password
        <input type="password" name="password" required />
      </label>
      <button type="submit">Update budget</button>
    </form>
  </section>

  <section>
    <h2>Update a milestone</h2>
    <form method="POST" action="/edit-milestone">
      <label>Milestone
        <select name="name" id="em-name">${milestoneOptions}</select>
      </label>
      <label>Status
        <select name="status" id="em-status">${milestoneStatusOptions}</select>
      </label>
      <label>Date <span style="font-weight:normal">(optional — shown instead of the status label, e.g. once it's done)</span>
        <input type="text" name="date" id="em-date" placeholder="e.g. 12 Aug 2026" />
      </label>
      <label>Password
        <input type="password" name="password" required />
      </label>
      <button type="submit">Update milestone</button>
    </form>
  </section>

  <script>
    const ITEMS = ${itemsJson};
    const categorySelect = document.getElementById("ep-category");
    const itemSelect = document.getElementById("ep-item");
    const estimateInput = document.getElementById("ep-estimate");
    const actualInput = document.getElementById("ep-actual");

    function populateItems() {
      const items = ITEMS[categorySelect.value] || [];
      itemSelect.innerHTML = items
        .map((i) => \`<option value="\${i.name}">\${i.name}</option>\`)
        .join("");
      prefill();
    }

    function prefill() {
      const items = ITEMS[categorySelect.value] || [];
      const item = items.find((i) => i.name === itemSelect.value);
      if (item) {
        estimateInput.value = item.estimate;
        actualInput.value = item.actual;
      }
    }

    categorySelect.addEventListener("change", populateItems);
    itemSelect.addEventListener("change", prefill);
    populateItems();

    const MILESTONES = ${milestonesJson};
    const milestoneSelect = document.getElementById("em-name");
    const statusSelect = document.getElementById("em-status");
    const dateInput = document.getElementById("em-date");

    function prefillMilestone() {
      const m = MILESTONES[milestoneSelect.value];
      if (m) {
        statusSelect.value = m.status;
        dateInput.value = m.date;
      }
    }

    milestoneSelect.addEventListener("change", prefillMilestone);
    prefillMilestone();
  </script>
</body>
</html>`);
}

// ---------------------------------------------------------------------------
// Form handlers
// ---------------------------------------------------------------------------

async function handleSubmit(request, env) {
  const form = await request.formData();
  const password = form.get("password");
  const categoryId = form.get("category");
  const name = (form.get("name") || "").toString().trim();
  const estimate = Number(form.get("estimate"));
  const actual = Number(form.get("actual"));

  if (password !== env.FORM_PASSWORD) {
    return renderAdminPage(env, `<div class="message error">Wrong password.</div>`);
  }
  if (!name || Number.isNaN(estimate) || Number.isNaN(actual)) {
    return renderAdminPage(env, `<div class="message error">Fill in every field with valid values.</div>`);
  }
  const category = CATEGORIES.find((c) => c.id === categoryId);
  if (!category) {
    return renderAdminPage(env, `<div class="message error">Unknown category.</div>`);
  }

  const data = await readData(env);
  const cat = data.categories.find((c) => c.id === categoryId);
  if (!cat) {
    return renderAdminPage(env, `<div class="message error">Category "${escapeHtml(categoryId)}" not found in KV data.</div>`);
  }
  cat.items.push({ name, estimate, actual });
  await writeData(env, data);

  return renderAdminPage(env, `<div class="message success">Added "${escapeHtml(name)}" to ${category.name}.</div>`);
}

async function handleEditPrice(request, env) {
  const form = await request.formData();
  const password = form.get("password");
  const categoryId = form.get("category");
  const name = (form.get("name") || "").toString().trim();
  const estimate = Number(form.get("estimate"));
  const actual = Number(form.get("actual"));

  if (password !== env.FORM_PASSWORD) {
    return renderAdminPage(env, `<div class="message error">Wrong password.</div>`);
  }
  if (!name || Number.isNaN(estimate) || Number.isNaN(actual)) {
    return renderAdminPage(env, `<div class="message error">Fill in every field with valid values.</div>`);
  }

  const data = await readData(env);
  const cat = data.categories.find((c) => c.id === categoryId);
  const item = cat && cat.items.find((i) => i.name === name);
  if (!item) {
    return renderAdminPage(env, `<div class="message error">Could not find "${escapeHtml(name)}" in that category.</div>`);
  }
  item.estimate = estimate;
  item.actual = actual;
  await writeData(env, data);

  return renderAdminPage(env, `<div class="message success">Updated price for "${escapeHtml(name)}".</div>`);
}

async function handleEditBudget(request, env) {
  const form = await request.formData();
  const password = form.get("password");
  const budget = Number(form.get("budget"));

  if (password !== env.FORM_PASSWORD) {
    return renderAdminPage(env, `<div class="message error">Wrong password.</div>`);
  }
  if (Number.isNaN(budget)) {
    return renderAdminPage(env, `<div class="message error">Enter a valid budget.</div>`);
  }

  const data = await readData(env);
  data.budget = budget;
  await writeData(env, data);

  return renderAdminPage(env, `<div class="message success">Updated budget to ${budget}.</div>`);
}

async function handleEditMilestone(request, env) {
  const form = await request.formData();
  const password = form.get("password");
  const name = (form.get("name") || "").toString().trim();
  const status = (form.get("status") || "").toString().trim();
  const date = (form.get("date") || "").toString().trim();

  if (password !== env.FORM_PASSWORD) {
    return renderAdminPage(env, `<div class="message error">Wrong password.</div>`);
  }
  if (!MILESTONE_STATUSES.includes(status)) {
    return renderAdminPage(env, `<div class="message error">Unknown status "${escapeHtml(status)}".</div>`);
  }

  const data = await readData(env);
  const milestone = (data.milestones || []).find((m) => m.name === name);
  if (!milestone) {
    return renderAdminPage(env, `<div class="message error">Could not find milestone "${escapeHtml(name)}".</div>`);
  }
  milestone.status = status;
  milestone.date = date;
  await writeData(env, data);

  return renderAdminPage(env, `<div class="message success">Updated "${escapeHtml(name)}" to ${escapeHtml(status)}.</div>`);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
