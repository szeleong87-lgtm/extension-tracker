// Shared rendering helpers used by pages/finance.html and every category page.
// Cost data (item prices and the overall budget) lives in Cloudflare KV, not
// in this repo — edit it at the Worker's admin page, and changes show up on
// next page load, no code change or deploy needed. Category/item *names*
// still live in data.js. There is no editing on the page itself.

const CURRENCY = "£";

// The Worker that serves the live data and hosts the admin forms.
const DATA_API_URL = "https://extension-tracker-add-item.jslchng.workers.dev/data.json";

// Fetches the live cost data from Cloudflare KV (via the Worker). Falls back
// to the EXTENSION_DATA baked into data.js — a frozen snapshot, not kept in
// sync automatically — if the Worker or KV is unreachable, so the site still
// shows *something* rather than breaking outright.
async function loadExtensionData() {
  try {
    const res = await fetch(DATA_API_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data || !Array.isArray(data.categories)) throw new Error("malformed response");
    return data;
  } catch (err) {
    console.warn("Could not load live data from Cloudflare KV, falling back to data.js:", err);
    return EXTENSION_DATA;
  }
}

function formatCurrency(n) {
  return CURRENCY + Number(n || 0).toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// The figure that counts toward totals: actual spend once known, else the estimate.
function itemCost(item) {
  return Number(item.actual) || Number(item.estimate) || 0;
}

function categoryTotal(category) {
  return category.items.reduce((sum, item) => sum + itemCost(item), 0);
}

function grandTotal(data) {
  return data.categories.reduce((sum, cat) => sum + categoryTotal(cat), 0);
}

// Estimate/actual totals kept separate (unlike itemCost's blended figure)
// so the home page can show how spend is tracking against budget.
function categoryEstimateTotal(category) {
  return category.items.reduce((sum, item) => sum + (Number(item.estimate) || 0), 0);
}

function categoryActualTotal(category) {
  return category.items.reduce((sum, item) => sum + (Number(item.actual) || 0), 0);
}

function grandEstimateTotal(data) {
  return data.categories.reduce((sum, cat) => sum + categoryEstimateTotal(cat), 0);
}

function grandActualTotal(data) {
  return data.categories.reduce((sum, cat) => sum + categoryActualTotal(cat), 0);
}

// Budget status thresholds, expressed as % of budget drawn down.
const BUDGET_WARNING_PCT = 90;

function budgetStatus(pct) {
  if (pct > 100) return { key: "critical", label: "over budget" };
  if (pct >= BUDGET_WARNING_PCT) return { key: "warning", label: "approaching budget" };
  return { key: "ontrack", label: "on track" };
}

// Renders the budget-vs-drawn-down meter at the top of pages/finance.html.
// "Drawn down" is total Actual spend (money that's actually gone out),
// not the blended Estimate/Actual figure used elsewhere.
function renderBudget(data, containerEl) {
  const budget = Number(data.budget) || 0;
  const drawn = grandActualTotal(data);
  const remaining = budget - drawn;
  const pct = budget > 0 ? (drawn / budget) * 100 : 0;
  const status = budgetStatus(pct);
  const fillPct = Math.min(pct, 100);

  containerEl.innerHTML = `
    <div class="budget">
      <div class="budget-figures">
        <div class="budget-stat">
          <div class="budget-stat-label">Budget</div>
          <div class="budget-stat-value">${formatCurrency(budget)}</div>
        </div>
        <div class="budget-stat">
          <div class="budget-stat-label">Drawn down</div>
          <div class="budget-stat-value">${formatCurrency(drawn)}</div>
        </div>
        <div class="budget-stat">
          <div class="budget-stat-label">Remaining</div>
          <div class="budget-stat-value">${formatCurrency(remaining)}</div>
        </div>
      </div>
      <div class="meter" role="img" aria-label="${Math.round(pct)}% of budget drawn down, ${status.label}">
        <div class="meter-track">
          <div class="meter-fill status-${status.key}" style="width: ${fillPct}%"></div>
        </div>
        <div class="meter-caption">
          <span class="status-dot status-${status.key}"></span>
          <span>${Math.round(pct)}% drawn down &mdash; ${status.label}</span>
        </div>
      </div>
    </div>`;
}

// Renders the home page summary table (one row per category + grand total).
function renderSummary(data, containerEl) {
  const rows = data.categories
    .map((cat) => {
      const count = cat.items.length;
      return `<tr>
        <td><a href="${cat.page}">${cat.name}</a></td>
        <td class="num muted">${count} item${count === 1 ? "" : "s"}</td>
        <td class="num">${formatCurrency(categoryEstimateTotal(cat))}</td>
        <td class="num">${formatCurrency(categoryActualTotal(cat))}</td>
      </tr>`;
    })
    .join("");

  containerEl.innerHTML = `
    <table class="summary">
      <thead>
        <tr><th>Category</th><th class="num">Items</th><th class="num">Estimate</th><th class="num">Actual</th></tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr><th>Total</th><th></th><th class="num">${formatCurrency(grandEstimateTotal(data))}</th><th class="num">${formatCurrency(grandActualTotal(data))}</th></tr>
      </tfoot>
    </table>`;
}

// Renders a single category's item table (used by build-costs.html, kitchen.html, etc.)
// Read-only display — add, edit, and remove items by changing data.js.
function renderCategory(category, containerEl) {
  const rows = category.items
    .map(
      (item) => `
      <tr>
        <td>${item.name}</td>
        <td class="num muted">${formatCurrency(item.estimate)}</td>
        <td class="num muted">${item.actual ? formatCurrency(item.actual) : ""}</td>
        <td class="num">${formatCurrency(itemCost(item))}</td>
      </tr>`
    )
    .join("");

  containerEl.innerHTML = `
    <table class="items">
      <thead>
        <tr><th>Item</th><th class="num">Estimate</th><th class="num">Actual</th><th class="num">Cost</th></tr>
      </thead>
      <tbody>${rows || '<tr><td colspan="4" class="muted">No items yet — add some in data.js</td></tr>'}</tbody>
      <tfoot>
        <tr><th colspan="3">Subtotal</th><th class="num">${formatCurrency(categoryTotal(category))}</th></tr>
      </tfoot>
    </table>`;
}
