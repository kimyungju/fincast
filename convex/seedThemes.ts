import { mutation } from "./_generated/server";

const SEED_THEMES = [
  {
    slug: "us-inflation",
    label: "US Inflation",
    category: "Monetary Policy",
    regions: ["US"],
    assetClasses: ["rates", "FX", "equities"],
    heatScore: 2.4,
    heatStatus: "hot",
  },
  {
    slug: "fed-policy",
    label: "Fed Policy",
    category: "Monetary Policy",
    regions: ["US", "Global"],
    assetClasses: ["rates", "FX", "equities", "credit"],
    heatScore: 2.1,
    heatStatus: "hot",
  },
  {
    slug: "ecb-policy",
    label: "ECB Policy",
    category: "Monetary Policy",
    regions: ["EU"],
    assetClasses: ["rates", "FX"],
    heatScore: 1.5,
    heatStatus: "warming",
  },
  {
    slug: "boj-policy",
    label: "BOJ Policy",
    category: "Monetary Policy",
    regions: ["JP"],
    assetClasses: ["rates", "FX"],
    heatScore: 1.8,
    heatStatus: "warming",
  },
  {
    slug: "china-trade",
    label: "China Trade",
    category: "Trade",
    regions: ["CN", "US", "Global"],
    assetClasses: ["equities", "commodities", "FX"],
    heatScore: 1.9,
    heatStatus: "warming",
  },
  {
    slug: "oil-prices",
    label: "Oil Prices",
    category: "Commodities",
    regions: ["Global"],
    assetClasses: ["commodities", "equities", "FX"],
    heatScore: 1.4,
    heatStatus: "warming",
  },
  {
    slug: "us-labor-market",
    label: "US Labor Market",
    category: "Labor",
    regions: ["US"],
    assetClasses: ["rates", "equities"],
    heatScore: 1.1,
    heatStatus: "stable",
  },
  {
    slug: "eurozone-growth",
    label: "Eurozone Growth",
    category: "Fiscal Policy",
    regions: ["EU"],
    assetClasses: ["rates", "equities", "FX"],
    heatScore: 0.9,
    heatStatus: "stable",
  },
  {
    slug: "usd-strength",
    label: "USD Strength",
    category: "Markets",
    regions: ["US", "Global"],
    assetClasses: ["FX", "commodities"],
    heatScore: 1.6,
    heatStatus: "warming",
  },
  {
    slug: "emerging-markets",
    label: "Emerging Markets",
    category: "Markets",
    regions: ["EM", "Global"],
    assetClasses: ["equities", "FX", "credit"],
    heatScore: 0.8,
    heatStatus: "stable",
  },
  {
    slug: "global-supply-chains",
    label: "Global Supply Chains",
    category: "Trade",
    regions: ["Global"],
    assetClasses: ["equities", "commodities"],
    heatScore: 0.5,
    heatStatus: "cooling",
  },
  {
    slug: "ai-productivity",
    label: "AI & Productivity",
    category: "Technology",
    regions: ["US", "Global"],
    assetClasses: ["equities"],
    heatScore: 2.3,
    heatStatus: "hot",
  },
  {
    slug: "us-housing",
    label: "US Housing",
    category: "Real Estate",
    regions: ["US"],
    assetClasses: ["rates", "credit"],
    heatScore: 0.6,
    heatStatus: "cooling",
  },
  {
    slug: "crypto-regulation",
    label: "Crypto Regulation",
    category: "Regulation",
    regions: ["US", "EU"],
    assetClasses: ["crypto"],
    heatScore: 1.2,
    heatStatus: "stable",
  },
  {
    slug: "climate-energy-transition",
    label: "Climate & Energy Transition",
    category: "Energy",
    regions: ["Global", "EU"],
    assetClasses: ["commodities", "equities"],
    heatScore: 0.4,
    heatStatus: "cooling",
  },
];

export const seedMacroThemes = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("macroThemes").first();
    if (existing) {
      return "Already seeded — skipping";
    }

    const now = Date.now();
    for (const theme of SEED_THEMES) {
      await ctx.db.insert("macroThemes", {
        slug: theme.slug,
        label: theme.label,
        category: theme.category,
        regions: theme.regions,
        assetClasses: theme.assetClasses,
        heatScore: theme.heatScore,
        heatStatus: theme.heatStatus,
        totalMentions: Math.floor(theme.heatScore * 10),
        lastMentionAt: now - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000),
        latestSummary: undefined,
        riskChain: undefined,
      });
    }

    return `Seeded ${SEED_THEMES.length} macro themes`;
  },
});
