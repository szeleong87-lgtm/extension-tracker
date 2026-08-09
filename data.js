// ---------------------------------------------------------------------------
// Extension cost data — single source of truth for the whole site.
//
// To add, edit, or remove a cost line, find its category below and
// change the `items` array:
//   { name: "Item name", estimate: 1234.56, actual: 0 }
//
// `estimate` and `actual` are plain numbers (no currency symbol, no commas).
// Leave `actual` as 0 until you have a real figure (invoice, receipt, etc.) —
// totals use `actual` once it's set, and fall back to `estimate` until then.
//
// Every page reads straight from this file — there is no editing on the
// webpage itself, and nothing is saved in the browser. Save this file and
// refresh the page to see changes.
//
// index.html sums every category into a grand total automatically.
// Each category's own page (e.g. kitchen.html) lists just its items.
// ---------------------------------------------------------------------------

const EXTENSION_DATA = {
  // Total funds available for the whole project. index.html shows this
  // against "drawn down" (total Actual spend) so you can see how much
  // budget is left.
  budget: 100000, // TODO: set your real total budget here, e.g. 60000

  categories: [
    {
      id: "planning",
      name: "Planning",
      page: "Planning.html",
      items: [
        { name: "Architect", estimate: 3000, actual: 4050},
        { name: "Planning permission", estimate: 1500, actual: 695},

      ],
    },
    {
      id: "build-costs",
      name: "Build Costs",
      page: "build-costs.html",
      items: [
        { name: "Groundworks", estimate: 8500, actual: 0 },
      ],
    },
    {
      id: "glazing",
      name: "Glazing",
      page: "glazing.html",
      items: [
         { name: "Bifold doors", estimate: 3800, actual: 0 },
         { name: "Roof lantern", estimate: 1200, actual: 0 },
         { name: "Windows", estimate: 1500, actual: 0 },
      ],
    },
    {
      id: "kitchen",
      name: "Kitchen",
      page: "kitchen.html",
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
      ],
    },
    {
      id: "electrics",
      name: "Electrics",
      page: "electrics.html",
      items: [
        { name: "Rewire + sockets", estimate: 2200, actual: 0 },
      ],
    },
    {
      id: "flooring",
      name: "Flooring",
      page: "flooring.html",
      items: [
        { name: "Tiles", estimate: 2600, actual: 0 },
      ],
    },
       {
      id: "decorating",
      name: "Decorating",
      page: "decorating.html",
      items: [
        { name: "Painting", estimate: 2600, actual: 0 },
      ],
    },
    {
      id: "snug",
      name: "Snug",
      page: "snug.html",
      items: [
        { name: "Sofa", estimate: 1100, actual: 0 },
        { name: "TV", estimate: 1200, actual: 0 },
        { name: "Cabinets", estimate: 1000, actual: 0 },
      ],
    },
  ],
};
