import { mutation } from "./_generated/server";

const SEED_THEMES = [
  {
    slug: "us-inflation",
    label: "US Inflation",
    category: "Monetary Policy",
    regions: ["US"],
    assetClasses: ["rates", "FX", "equities"],
  },
  {
    slug: "fed-policy",
    label: "Fed Policy",
    category: "Monetary Policy",
    regions: ["US", "Global"],
    assetClasses: ["rates", "FX", "equities", "credit"],
  },
  {
    slug: "ecb-policy",
    label: "ECB Policy",
    category: "Monetary Policy",
    regions: ["EU"],
    assetClasses: ["rates", "FX"],
  },
  {
    slug: "boj-policy",
    label: "BOJ Policy",
    category: "Monetary Policy",
    regions: ["JP"],
    assetClasses: ["rates", "FX"],
  },
  {
    slug: "china-trade",
    label: "China Trade",
    category: "Trade",
    regions: ["CN", "US", "Global"],
    assetClasses: ["equities", "commodities", "FX"],
  },
  {
    slug: "oil-prices",
    label: "Oil Prices",
    category: "Commodities",
    regions: ["Global"],
    assetClasses: ["commodities", "equities", "FX"],
  },
  {
    slug: "us-labor-market",
    label: "US Labor Market",
    category: "Labor",
    regions: ["US"],
    assetClasses: ["rates", "equities"],
  },
  {
    slug: "eurozone-growth",
    label: "Eurozone Growth",
    category: "Fiscal Policy",
    regions: ["EU"],
    assetClasses: ["rates", "equities", "FX"],
  },
  {
    slug: "usd-strength",
    label: "USD Strength",
    category: "Markets",
    regions: ["US", "Global"],
    assetClasses: ["FX", "commodities"],
  },
  {
    slug: "emerging-markets",
    label: "Emerging Markets",
    category: "Markets",
    regions: ["EM", "Global"],
    assetClasses: ["equities", "FX", "credit"],
  },
  {
    slug: "global-supply-chains",
    label: "Global Supply Chains",
    category: "Trade",
    regions: ["Global"],
    assetClasses: ["equities", "commodities"],
  },
  {
    slug: "ai-productivity",
    label: "AI Productivity",
    category: "Technology",
    regions: ["US", "Global"],
    assetClasses: ["equities"],
  },
  {
    slug: "us-housing",
    label: "US Housing",
    category: "Real Estate",
    regions: ["US"],
    assetClasses: ["rates", "credit"],
  },
  {
    slug: "crypto-regulation",
    label: "Crypto Regulation",
    category: "Regulation",
    regions: ["US", "EU"],
    assetClasses: ["crypto"],
  },
  {
    slug: "climate-energy-transition",
    label: "Climate Energy Transition",
    category: "Energy",
    regions: ["Global", "EU"],
    assetClasses: ["commodities", "equities"],
  },
];

export const seedMacroThemes = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("macroThemes").first();
    if (existing) {
      return "Already seeded — skipping";
    }

    for (const theme of SEED_THEMES) {
      await ctx.db.insert("macroThemes", {
        slug: theme.slug,
        label: theme.label,
        category: theme.category,
        regions: theme.regions,
        assetClasses: theme.assetClasses,
        heatScore: 0,
        heatStatus: "dormant",
        totalMentions: 0,
        lastMentionAt: 0,
      });
    }

    return `Seeded ${SEED_THEMES.length} macro themes (run refreshAllTrendsScores to populate heat scores)`;
  },
});
