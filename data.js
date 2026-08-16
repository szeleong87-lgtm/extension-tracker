// ---------------------------------------------------------------------------
// Extension cost data — FALLBACK ONLY.
//
// The live numbers (budget, estimate, actual, milestone statuses) now live
// in Cloudflare KV, not here — edit them at
// https://extension-tracker-add-item.jslchng.workers.dev/ and changes appear
// on next page load, no commit or deploy needed. Every page fetches that
// live data first (see loadExtensionData() in common.js) and only falls
// back to this file if the Worker/KV is unreachable.
//
// Because of that, this file is a frozen snapshot — it is NOT kept in sync
// with KV automatically, and editing numbers here has no effect on the live
// site under normal operation. It exists purely so the site still shows
// *something* if the Worker ever goes down.
//
// The category *shells* (id/name/page) below are also mirrored in
// worker.js's CATEGORIES list, which drives the admin page's dropdowns —
// keep the two in sync if you ever add/rename a category. Adding a whole new
// category still needs a new .html page too (see the other category pages
// for the pattern). Individual *items*, though, can now be added straight
// from the admin page without touching this file at all — new items live
// only in KV until/unless you manually copy them back here to refresh this
// fallback snapshot.
// ---------------------------------------------------------------------------

const EXTENSION_DATA = {
  // Total funds available for the whole project. pages/finance.html shows this
  // against "drawn down" (total Actual spend) so you can see how much
  // budget is left.
  budget: 90000, // TODO: set your real total budget here, e.g. 60000

  // The home page's milestone list and stage pills, in order. status is one
  // of "done" / "in-progress" / "upcoming". date is optional — shown instead
  // of the generic status label when set (e.g. once something's done).
  milestones: [
    { name: "Plans drawn", status: "in-progress", date: "" },
    { name: "Planning permission", status: "upcoming", date: "" },
    { name: "Quotes", status: "upcoming", date: "" },
    { name: "Foundations poured", status: "upcoming", date: "" },
    { name: "Structural shell up", status: "upcoming", date: "" },
    { name: "Knock through", status: "upcoming", date: "" },
    { name: "First fix", status: "upcoming", date: "" },
    { name: "Glazing", status: "upcoming", date: "" },
    { name: "Kitchen install", status: "upcoming", date: "" },
    { name: "Second fix and decorating", status: "upcoming", date: "" },
  ],

  categories: [
    {
      id: "planning",
      name: "Planning",
      page: "pages/Planning.html",
      items: [
        { name: "Architect", estimate: 3000, actual: 4050},
        { name: "Planning permission", estimate: 1500, actual: 695},

      ],
    },
    {
      id: "build-costs",
      name: "Build Costs",
      page: "pages/build-costs.html",
      items: [
        // From the (non-builder) estimated cost breakdown, ex. VAT:
        { name: "Preliminaries", estimate: 14351.72, actual: 0 },
        { name: "Demolitions", estimate: 1444.11, actual: 0 },
        { name: "Foundations and substructure", estimate: 11186.66, actual: 0 },
        { name: "Floor structure and lining", estimate: 3159.45, actual: 0 },
        { name: "Steel and structural supports", estimate: 4540.94, actual: 0 },
        { name: "External wall structure and lining", estimate: 13918.12, actual: 0 },
        { name: "Internal wall structure and lining", estimate: 2321.39, actual: 0 },
        { name: "Roof structure and coverings", estimate: 9557.81, actual: 0 },
        { name: "Ceiling structure and lining", estimate: 522.62, actual: 0 },
        { name: "Internal doors and frames", estimate: 1068.66, actual: 0 },
        { name: "Drainage and pipework", estimate: 2768.01, actual: 0 },
        // VAT at 20% on the £112,993.53 estimated breakdown above (that
        // figure was ex. VAT) — adjust if your VAT position differs.
        { name: "VAT (20%) on estimated breakdown", estimate: 22598.71, actual: 0 },
      ],
    },
    {
      id: "glazing",
      name: "Glazing",
      page: "pages/glazing.html",
      items: [
         { name: "Bifold doors", estimate: 3800, actual: 0 },
         { name: "Roof lantern", estimate: 1200, actual: 0 },
         { name: "Windows", estimate: 1500, actual: 0 },
         // From the estimated cost breakdown, ex. VAT:
         { name: "External windows and doors", estimate: 10251.23, actual: 0 },
        { name: "Utility window", estimate: 200, actual: 0 },
      ],
    },
    {
      id: "kitchen",
      name: "Kitchen",
      page: "pages/kitchen.html",
      items: [
        { name: "Units", estimate: 0, actual: 0 },
        { name: "Oven", estimate: 0, actual: 0 },
        { name: "Dishwasher", estimate: 0, actual: 0 },
        { name: "Hob", estimate: 0, actual: 0 },
        { name: "Extractor fan", estimate: 0, actual: 0 },
        { name: "Installation", estimate: 0, actual: 0 },
        { name: "Radiators", estimate: 0, actual: 0 },
        { name: "Aircon", estimate: 0, actual: 0 },
        { name: "Underfloor heating", estimate: 0, actual: 0 },
        // From the estimated cost breakdown, ex. VAT — lump sums covering the
        // itemized placeholders above (Radiators/Aircon/Underfloor heating,
        // and Oven/Dishwasher/Hob/Extractor fan); not yet split out.
        { name: "Heating and cooling", estimate: 6561.61, actual: 0 },
        { name: "Units, worktops and appliances", estimate: 16245.17, actual: 0 },
        { name: "Pantry shelving", estimate: 0, actual: 0 },
      ],
    },
    {
      id: "electrics",
      name: "Electrics",
      page: "pages/electrics.html",
      items: [
        { name: "Rewire + sockets", estimate: 2200, actual: 0 },
        // From the estimated cost breakdown, ex. VAT:
      ],
    },
    {
      id: "flooring",
      name: "Flooring",
      page: "pages/flooring.html",
      items: [
        { name: "Tiles", estimate: 2600, actual: 0 },
        // From the estimated cost breakdown, ex. VAT:
        { name: "Floor preparation and finishes", estimate: 5207.36, actual: 0 },
      ],
    },
    {
      id: "decorating",
      name: "Decorating",
      page: "pages/decorating.html",
      items: [
        { name: "Painting", estimate: 2600, actual: 0 },
        // From the estimated cost breakdown, ex. VAT:
      ],
    },
    {
      id: "snug",
      name: "Snug",
      page: "pages/snug.html",
      items: [
        { name: "Sofa", estimate: 1100, actual: 0 },
        { name: "TV", estimate: 1200, actual: 0 },
        { name: "Cabinets", estimate: 1000, actual: 0 },
      ],
    },
  ],
};
