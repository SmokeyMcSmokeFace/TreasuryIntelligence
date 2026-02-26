import fs from "fs";
import path from "path";

// ── Constants ────────────────────────────────────────────────────────────────

export const GEHC_CIK = "0001932393";
const DATA_DIR = path.join(process.cwd(), "data");
const GEHC_FILE = path.join(DATA_DIR, "company-gehc.json");

// SEC requires a User-Agent with contact info
function secHeaders() {
  const email = process.env.ADMIN_EMAIL ?? "admin@example.com";
  return {
    "User-Agent": `TreasuryIntelligencePlatform ${email}`,
    Accept: "application/json",
  };
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface MaturityLadder {
  year1: number;
  year2: number;
  year3: number;
  year4: number;
  year5: number;
  afterYear5: number;
}

export interface CompanySnapshot {
  ticker: string;
  name: string;
  cik: string;
  periodEnd: string;      // e.g. "2025-12-31"
  filingType: string;     // "10-K" or "10-Q"
  filingDate: string;     // date SEC received filing
  refreshedAt: string;
  // Balance sheet
  cash: number | null;
  totalAssets: number | null;
  totalLiabilities: number | null;
  equity: number | null;
  // Debt
  longTermDebt: number | null;
  longTermDebtCurrent: number | null;
  longTermDebtNoncurrent: number | null;
  shortTermBorrowings: number | null;
  // Maturity ladder
  maturityLadder: Partial<MaturityLadder>;
  // P&L (annual)
  revenue: number | null;
  operatingIncome: number | null;
  netIncome: number | null;
  interestExpense: number | null;
  taxExpense: number | null;
  // Cash flow (annual)
  operatingCashFlow: number | null;
  amortization: number | null;
}

// ── XBRL helpers ─────────────────────────────────────────────────────────────

type XbrlEntry = { end: string; val: number; form: string; start?: string };

// Return the most recent value from 10-K filings for a given concept
function latestAnnual(
  gaap: Record<string, { units?: { USD?: XbrlEntry[] } }>,
  concept: string
): number | null {
  const entries = gaap[concept]?.units?.USD ?? [];
  // Prefer 10-K; fall back to 10-Q
  for (const formType of ["10-K", "10-Q"] as const) {
    const filtered = entries
      .filter((e) => e.form === formType && e.val != null)
      .sort((a, b) => (a.end > b.end ? 1 : -1));
    if (filtered.length) return filtered[filtered.length - 1].val;
  }
  return null;
}

// Return the most recent value from 10-K filings for full-year periods
// (start date ~ 12 months before end date)
function latestFullYear(
  gaap: Record<string, { units?: { USD?: XbrlEntry[] } }>,
  ...concepts: string[]
): number | null {
  for (const concept of concepts) {
    const entries = gaap[concept]?.units?.USD ?? [];
    const annual = entries
      .filter((e) => {
        if (e.form !== "10-K") return false;
        if (!e.start) return true; // instantaneous — include
        const months =
          (new Date(e.end).getTime() - new Date(e.start).getTime()) /
          (1000 * 60 * 60 * 24 * 30);
        return months >= 11; // full-year periods
      })
      .sort((a, b) => (a.end > b.end ? 1 : -1));
    if (annual.length) return annual[annual.length - 1].val;
  }
  return null;
}

// ── Snapshot builder ─────────────────────────────────────────────────────────

export async function fetchCompanySnapshot(cik: string): Promise<CompanySnapshot> {
  // 1. Get company metadata + latest 10-K/10-Q date
  const subRes = await fetch(
    `https://data.sec.gov/submissions/CIK${cik}.json`,
    { headers: secHeaders() }
  );
  if (!subRes.ok) throw new Error(`SEC submissions fetch failed: ${subRes.status}`);
  const sub = await subRes.json();

  // Find the latest 10-K or 10-Q filing
  const forms: string[] = sub.filings.recent.form;
  const dates: string[] = sub.filings.recent.filingDate;
  let latestFilingType = "";
  let latestFilingDate = "";
  for (let i = 0; i < forms.length; i++) {
    if (forms[i] === "10-K" || forms[i] === "10-Q") {
      latestFilingType = forms[i];
      latestFilingDate = dates[i];
      break;
    }
  }

  // 2. Fetch XBRL company facts
  const factsRes = await fetch(
    `https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`,
    { headers: secHeaders() }
  );
  if (!factsRes.ok) throw new Error(`SEC companyfacts fetch failed: ${factsRes.status}`);
  const facts = await factsRes.json();
  const gaap = facts.facts?.["us-gaap"] ?? {};

  // 3. Extract normalized fields
  const snapshot: CompanySnapshot = {
    ticker: sub.tickers?.[0] ?? "",
    name: sub.name ?? "",
    cik,
    periodEnd: "",
    filingType: latestFilingType,
    filingDate: latestFilingDate,
    refreshedAt: new Date().toISOString(),
    // Balance sheet
    cash: latestAnnual(gaap, "CashAndCashEquivalentsAtCarryingValue"),
    totalAssets: latestAnnual(gaap, "Assets"),
    totalLiabilities: latestAnnual(gaap, "Liabilities"),
    equity: latestAnnual(gaap, "StockholdersEquity"),
    // Debt
    longTermDebt: latestAnnual(gaap, "LongTermDebt"),
    longTermDebtCurrent: latestAnnual(gaap, "LongTermDebtCurrent"),
    longTermDebtNoncurrent: latestAnnual(gaap, "LongTermDebtNoncurrent"),
    shortTermBorrowings: latestAnnual(gaap, "ShortTermBorrowings"),
    // Maturity ladder
    maturityLadder: {
      year1: latestAnnual(gaap, "LongTermDebtMaturitiesRepaymentsOfPrincipalInNextTwelveMonths") ?? undefined,
      year2: latestAnnual(gaap, "LongTermDebtMaturitiesRepaymentsOfPrincipalInYearTwo") ?? undefined,
      year3: latestAnnual(gaap, "LongTermDebtMaturitiesRepaymentsOfPrincipalInYearThree") ?? undefined,
      year4: latestAnnual(gaap, "LongTermDebtMaturitiesRepaymentsOfPrincipalInYearFour") ?? undefined,
      year5: latestAnnual(gaap, "LongTermDebtMaturitiesRepaymentsOfPrincipalInYearFive") ?? undefined,
      afterYear5: latestAnnual(gaap, "LongTermDebtMaturitiesRepaymentsOfPrincipalAfterYearFive") ?? undefined,
    },
    // P&L
    revenue: latestFullYear(gaap, "RevenueFromContractWithCustomerExcludingAssessedTax", "Revenues"),
    operatingIncome: latestFullYear(gaap, "OperatingIncomeLoss"),
    netIncome: latestFullYear(gaap, "NetIncomeLoss"),
    interestExpense: latestFullYear(gaap, "InterestAndDebtExpense", "InterestExpense", "InterestExpenseDebt"),
    taxExpense: latestFullYear(gaap, "IncomeTaxExpenseBenefit"),
    // Cash flow
    operatingCashFlow: latestFullYear(
      gaap,
      "NetCashProvidedByUsedInOperatingActivitiesContinuingOperations",
      "NetCashProvidedByUsedInOperatingActivities"
    ),
    amortization: latestFullYear(gaap, "AmortizationOfIntangibleAssets", "DepreciationAndAmortization"),
  };

  // Derive periodEnd from the most recent LongTermDebt entry
  const ltdEntries: Array<{ form: string; end: string }> = gaap["LongTermDebt"]?.units?.USD ?? [];
  const latestLtd = ltdEntries
    .filter((e) => e.form === "10-K" || e.form === "10-Q")
    .sort((a, b) => (a.end > b.end ? 1 : -1));
  snapshot.periodEnd = latestLtd.at(-1)?.end ?? latestFilingDate.slice(0, 10);

  return snapshot;
}

// ── Cache management ─────────────────────────────────────────────────────────

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function loadGEHCSnapshot(): CompanySnapshot | null {
  try {
    if (!fs.existsSync(GEHC_FILE)) return null;
    return JSON.parse(fs.readFileSync(GEHC_FILE, "utf-8"));
  } catch {
    return null;
  }
}

function saveGEHCSnapshot(snapshot: CompanySnapshot) {
  ensureDataDir();
  fs.writeFileSync(GEHC_FILE, JSON.stringify(snapshot, null, 2));
}

// ── Auto-refresh logic ────────────────────────────────────────────────────────
// Called on every "Refresh Intel" run. Checks SEC for a newer 10-K/10-Q.
// Returns true if the snapshot was updated.
export async function checkAndRefreshGEHCSnapshot(): Promise<boolean> {
  try {
    const cached = loadGEHCSnapshot();

    // Fetch the submissions list (tiny ~20KB call)
    const res = await fetch(
      `https://data.sec.gov/submissions/CIK${GEHC_CIK}.json`,
      { headers: secHeaders() }
    );
    if (!res.ok) return false;
    const sub = await res.json();

    // Find the latest 10-K or 10-Q filing date
    const forms: string[] = sub.filings.recent.form;
    const dates: string[] = sub.filings.recent.filingDate;
    let latestFilingDate = "";
    for (let i = 0; i < forms.length; i++) {
      if (forms[i] === "10-K" || forms[i] === "10-Q") {
        latestFilingDate = dates[i];
        break;
      }
    }

    if (!latestFilingDate) return false;

    // Only refresh if SEC has a newer filing than what we have
    if (cached && cached.filingDate >= latestFilingDate) {
      return false; // already up to date
    }

    console.log(`[EDGAR] New filing detected (${latestFilingDate}), refreshing GEHC snapshot...`);
    const snapshot = await fetchCompanySnapshot(GEHC_CIK);
    saveGEHCSnapshot(snapshot);
    console.log(`[EDGAR] GEHC snapshot updated: ${snapshot.filingType} period=${snapshot.periodEnd}`);
    return true;
  } catch (err) {
    console.error("[EDGAR] Auto-refresh failed:", err);
    return false;
  }
}

// ── On-demand lookup for other companies (chat tool) ────────────────────────

type DataType = "balance_sheet" | "debt_maturity" | "income_statement" | "cash_flow" | "full_snapshot";

const CONCEPT_GROUPS: Record<DataType, string[]> = {
  balance_sheet: [
    "CashAndCashEquivalentsAtCarryingValue", "Assets", "Liabilities",
    "StockholdersEquity", "LongTermDebt", "LongTermDebtCurrent",
    "LongTermDebtNoncurrent", "ShortTermBorrowings",
  ],
  debt_maturity: [
    "LongTermDebtMaturitiesRepaymentsOfPrincipalInNextTwelveMonths",
    "LongTermDebtMaturitiesRepaymentsOfPrincipalInYearTwo",
    "LongTermDebtMaturitiesRepaymentsOfPrincipalInYearThree",
    "LongTermDebtMaturitiesRepaymentsOfPrincipalInYearFour",
    "LongTermDebtMaturitiesRepaymentsOfPrincipalInYearFive",
    "LongTermDebtMaturitiesRepaymentsOfPrincipalAfterYearFive",
    "LongTermDebt", "LongTermDebtCurrent", "ShortTermBorrowings",
  ],
  income_statement: [
    "RevenueFromContractWithCustomerExcludingAssessedTax", "Revenues",
    "OperatingIncomeLoss", "NetIncomeLoss",
    "InterestAndDebtExpense", "InterestExpense", "IncomeTaxExpenseBenefit",
  ],
  cash_flow: [
    "NetCashProvidedByUsedInOperatingActivitiesContinuingOperations",
    "NetCashProvidedByUsedInOperatingActivities",
    "PaymentsToAcquirePropertyPlantAndEquipment",
    "AmortizationOfIntangibleAssets", "DepreciationAndAmortization",
  ],
  full_snapshot: [], // handled separately
};

async function lookupCIK(tickerOrName: string): Promise<{ cik: string; name: string; ticker: string } | null> {
  try {
    // Try the company tickers JSON (maps ticker → CIK)
    const res = await fetch("https://www.sec.gov/files/company_tickers.json", {
      headers: secHeaders(),
    });
    if (!res.ok) return null;
    const data: Record<string, { cik_str: number | string; ticker: string; title: string }> = await res.json();

    const query = tickerOrName.toUpperCase().trim();
    // Exact ticker match first
    for (const entry of Object.values(data)) {
      if (entry.ticker.toUpperCase() === query) {
        return {
          cik: String(entry.cik_str).padStart(10, "0"),
          name: entry.title,
          ticker: entry.ticker,
        };
      }
    }
    // Partial name match fallback
    for (const entry of Object.values(data)) {
      if (entry.title.toUpperCase().includes(query)) {
        return {
          cik: String(entry.cik_str).padStart(10, "0"),
          name: entry.title,
          ticker: entry.ticker,
        };
      }
    }
    return null;
  } catch {
    return null;
  }
}

function fmt(val: number | null, divisor = 1e6, suffix = "M"): string {
  if (val == null) return "N/A";
  return `$${(val / divisor).toFixed(0)}${suffix}`;
}

export async function lookupCompanyOnDemand(
  tickerOrName: string,
  dataType: DataType = "full_snapshot"
): Promise<string> {
  // Resolve CIK
  const match = await lookupCIK(tickerOrName);
  if (!match) return `Could not find SEC EDGAR listing for "${tickerOrName}". May not be a US public company.`;

  const { cik, name, ticker } = match;

  try {
    const factsRes = await fetch(
      `https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`,
      { headers: secHeaders() }
    );
    if (!factsRes.ok) return `Could not fetch XBRL data for ${name} (${ticker}).`;

    const facts = await factsRes.json();
    const gaap = facts.facts?.["us-gaap"] ?? {};

    if (dataType === "full_snapshot") {
      // Build a compact normalized snapshot
      const snap = await fetchCompanySnapshot(cik);
      return formatSnapshotText(snap);
    }

    // Extract specific group of concepts
    const concepts = CONCEPT_GROUPS[dataType];
    const lines: string[] = [`${name} (${ticker}) — ${dataType.replace("_", " ")} from SEC EDGAR XBRL:`];

    for (const concept of concepts) {
      const val = latestAnnual(gaap, concept);
      if (val != null) {
        const label = concept.replace(/([A-Z])/g, " $1").trim();
        lines.push(`  ${label}: ${fmt(val)}`);
      }
    }

    if (lines.length === 1) {
      lines.push("  No XBRL data found for the requested concepts. The company may not tag these fields.");
    }

    return lines.join("\n");
  } catch (err) {
    return `Error fetching data for ${name}: ${(err as Error).message}`;
  }
}

// ── Context formatter ────────────────────────────────────────────────────────

export function formatSnapshotText(s: CompanySnapshot): string {
  const periodYear = s.periodEnd?.slice(0, 4) ?? "N/A";
  const periodLabel = s.filingType === "10-K" ? `FY${periodYear}` : `${s.periodEnd} (${s.filingType})`;

  // Compute derived metrics
  const totalDebt =
    s.longTermDebt != null ? s.longTermDebt : null;
  const netDebt =
    totalDebt != null && s.cash != null ? totalDebt - s.cash : null;
  const ebitda =
    s.operatingIncome != null && s.amortization != null
      ? s.operatingIncome + s.amortization
      : null;
  const fcf =
    s.operatingCashFlow != null ? s.operatingCashFlow : null;

  // Maturity ladder years
  const baseYear = parseInt(s.periodEnd?.slice(0, 4) ?? "2025");
  const ml = s.maturityLadder;
  const ladderLines = [
    ml.year1 != null ? `  ${baseYear + 1}: ${fmt(ml.year1)}` : null,
    ml.year2 != null ? `  ${baseYear + 2}: ${fmt(ml.year2)}` : null,
    ml.year3 != null ? `  ${baseYear + 3}: ${fmt(ml.year3)}` : null,
    ml.year4 != null ? `  ${baseYear + 4}: ${fmt(ml.year4)}` : null,
    ml.year5 != null ? `  ${baseYear + 5}: ${fmt(ml.year5)}` : null,
    ml.afterYear5 != null ? `  After ${baseYear + 5}: ${fmt(ml.afterYear5)}` : null,
  ].filter(Boolean);

  return [
    `--- ${s.name} (${s.ticker}) — ${periodLabel} (${s.filingType} filed ${s.filingDate}) ---`,
    `Balance Sheet:`,
    `  Cash: ${fmt(s.cash)}  |  Total Assets: ${fmt(s.totalAssets)}  |  Equity: ${fmt(s.equity)}`,
    `Debt:`,
    `  Total LT Debt: ${fmt(totalDebt)}  |  Current: ${fmt(s.longTermDebtCurrent)}  |  Non-current: ${fmt(s.longTermDebtNoncurrent)}`,
    `  Short-term Borrowings: ${fmt(s.shortTermBorrowings)}`,
    `  Net Debt: ${fmt(netDebt)}`,
    `Debt Maturity Ladder:`,
    ...(ladderLines.length ? ladderLines : ["  Not available in XBRL data"]),
    `Income Statement (annual):`,
    `  Revenue: ${fmt(s.revenue)}  |  Operating Income: ${fmt(s.operatingIncome)}  |  Net Income: ${fmt(s.netIncome)}`,
    `  EBITDA (approx): ${fmt(ebitda)}  |  Interest Expense: ${fmt(s.interestExpense)}`,
    `Cash Flow:`,
    `  Operating CF: ${fmt(s.operatingCashFlow)}  |  FCF proxy: ${fmt(fcf)}`,
    `--- End ${s.ticker} snapshot (auto-refreshed when new SEC filing detected) ---`,
  ].join("\n");
}
