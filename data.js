// ---------------------------------------------------------------------------
// Extension cost data â single source of truth for the whole site.
//
// To add, edit, or remove a cost line, find its category below and
// change the `items` array:
//   { name: "Item name", estimate: 1234.56, actual: 0 }
//
// `estimate` and `actual` are plain numbers (no currency symbol, no commas).
// Leave `actual` as 0 until you have a real figure (invoice, receipt, etc.) â
// totals use `actual` once it's set, and fall back to `estimate` until then.
//
// Every page reads straight from this file â there is no editing on the
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
        // VAT at 20% on the Â£112,993.53 estimated breakdown above (that
        // figure was ex. VAT) â adjust if your VAT position differs.
        { name: "VAT (20%) on estimated breakdown", estimate: 22598.71, actual: 0 },
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
         // From the estimated cost breakdown, ex. VAT:
         { name: "External windows and doors", estimate: 10251.23, actual: 0 },
        { name: "Utility window", estimate: 200, actual: 0 },
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
        // From the estimated cost breakdown, ex. VAT â lump sums covering the
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
      page: "electrics.html",
      items: [
        { name: "Rewire + sockets", estimate: 2200, actual: 0 },
        // From the estimated cost breakdown, ex. VAT:
      ],
    },
    {
      id: "flooring",
      name: "Flooring",
      page: "flooring.html",
      items: [
        { name: "Tiles", estimate: 2600, actual: 0 },
        // From the estimated cost breakdown, ex. VAT:
        { name: "Floor preparation and finishes", estimate: 5207.36, actual: 0 },
      ],
    },
    {
      id: "decorating",
      name: "Decorating",
      page: "decorating.html",
      items: [
        { name: "Painting", estimate: 2600, actual: 0 },
        // From the estimated cost breakdown, ex. VAT:
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
