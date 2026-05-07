// ── Shared CFA Level I Learning Module reference data ───────
//
// LM_DATA below is regenerated from DB by `scripts/sync-lm-data.mjs`.
// Run before rebuilding the frontend:  cd frontend && npm run sync-lms
// Manual edits to LM_DATA will be overwritten on next sync.

export const TOPICS: Record<string, string> = {
  ETH: 'Ethical & Professional Standards',
  QM: 'Quantitative Methods',
  ECO: 'Economics',
  FSA: 'Financial Statement Analysis',
  CORP: 'Corporate Issuers',
  EQU: 'Equity Investments',
  FI: 'Fixed Income',
  DER: 'Derivatives',
  ALT: 'Alternative Investments',
  PM: 'Portfolio Management',
}

export const TOPIC_COLORS: Record<string, string> = {
  ETH: '#DC2626', QM: '#7C3AED', ECO: '#2563EB', FSA: '#059669',
  CORP: '#D97706', EQU: '#0891B2', FI: '#4F46E5', DER: '#BE185D',
  ALT: '#7C2D12', PM: '#4338CA',
}

export const TOPIC_ORDER = ['ETH','QM','ECO','FSA','CORP','EQU','FI','DER','ALT','PM']

// Canonical exam weights — midpoint of CFA ranges. Single source of truth.
// ETH 15-20%, QM 8-12%, ECO 8-12%, FSA 13-17%, CORP 8-12%,
// EQU 10-12%, FI 11-14%, DER 5-8%, ALT 5-8%, PM 5-8%
export const EXAM_WEIGHTS: Record<string, number> = {
  ETH: 17.5, QM: 10, ECO: 10, FSA: 15, CORP: 10,
  EQU: 11, FI: 12.5, DER: 6.5, ALT: 6.5, PM: 6.5,
}

// String ranges for display
export const EXAM_WEIGHT_RANGES: Record<string, string> = {
  ETH: '15–20%', QM: '8–12%', ECO: '8–12%', FSA: '13–17%', CORP: '8–12%',
  EQU: '10–12%', FI: '11–14%', DER: '5–8%', ALT: '5–8%', PM: '5–8%',
}

// [topic, lmCode, title]
export const LM_DATA: [string, string, string][] = [
  ['ETH','LM01','Ethics and Trust in the Investment Profession'],
  ['ETH','LM02','Code of Ethics and Standards of Professional Conduct'],
  ['ETH','LM03','Guidance for Standards I–VII'],
  ['ETH','LM04','Introduction to GIPS'],
  ['ETH','LM05','Ethics Application'],
  ['QM','LM01','Rates and Returns'],
  ['QM','LM02','Time Value of Money'],
  ['QM','LM03','Statistical Measures of Asset Returns'],
  ['QM','LM04','Probability Trees and Conditional Expectations'],
  ['QM','LM05','Portfolio Mathematics'],
  ['QM','LM06','Simulation Methods'],
  ['QM','LM07','Estimation and Inference'],
  ['QM','LM08','Hypothesis Testing'],
  ['QM','LM09','Parametric and Non-Parametric Tests'],
  ['QM','LM10','Simple Linear Regression'],
  ['QM','LM11','Big Data Techniques'],
  ['ECO','LM01','The Firm and Market Structures'],
  ['ECO','LM02','Understanding Business Cycles'],
  ['ECO','LM03','Fiscal Policy'],
  ['ECO','LM04','Monetary Policy'],
  ['ECO','LM05','Introduction to Geopolitics'],
  ['ECO','LM06','International Trade'],
  ['ECO','LM07','Capital Flows and FX Market'],
  ['ECO','LM08','Exchange Rate Calculations'],
  ['FSA','LM01','Introduction to Financial Statement Analysis'],
  ['FSA','LM02','Analyzing Income Statements'],
  ['FSA','LM03','Analyzing Balance Sheets'],
  ['FSA','LM04','Analyzing Statements of Cash Flows I'],
  ['FSA','LM05','Analyzing Statements of Cash Flows II'],
  ['FSA','LM06','Analysis of Inventories'],
  ['FSA','LM07','Analysis of Long-Lived Assets'],
  ['FSA','LM08','Long-Term Liabilities and Equity'],
  ['FSA','LM09','Analysis of Income Taxes'],
  ['FSA','LM10','Financial Reporting Quality'],
  ['FSA','LM11','Financial Analysis Techniques'],
  ['FSA','LM12','Financial Statement Modeling'],
  ['CORP','LM01','Organizational Forms, Features, and Ownership'],
  ['CORP','LM02','Investors and Other Stakeholders'],
  ['CORP','LM03','Corporate Governance'],
  ['CORP','LM04','Working Capital and Liquidity'],
  ['CORP','LM05','Capital Investments and Capital Allocation'],
  ['CORP','LM06','Capital Structure'],
  ['CORP','LM07','Business Models'],
  ['EQU','LM01','Market Organization and Structure'],
  ['EQU','LM02','Security Market Indexes'],
  ['EQU','LM03','Market Efficiency'],
  ['EQU','LM04','Overview of Equity Securities'],
  ['EQU','LM05','Company Analysis: Past and Present'],
  ['EQU','LM06','Industry and Competitive Analysis'],
  ['EQU','LM07','Company Analysis: Forecasting'],
  ['EQU','LM08','Equity Valuation: Concepts and Basic Tools'],
  ['FI','LM01','Fixed-Income Instrument Features'],
  ['FI','LM02','Fixed-Income Cash Flows and Types'],
  ['FI','LM03','Fixed-Income Issuance and Trading'],
  ['FI','LM04','Fixed-Income Markets for Corporate Issuers'],
  ['FI','LM05','Fixed-Income Markets for Government Issuers'],
  ['FI','LM06','Bond Valuation: Prices and Yields'],
  ['FI','LM07','Yield and Yield Spread Measures for Fixed-Rate Bonds'],
  ['FI','LM08','Yield and Yield Spread Measures for Floating-Rate'],
  ['FI','LM09','Term Structure of Interest Rates'],
  ['FI','LM10','Interest Rate Risk and Return'],
  ['FI','LM11','Yield-Based Bond Duration Measures'],
  ['FI','LM12','Yield-Based Bond Convexity and Portfolio Properties'],
  ['FI','LM13','Curve-Based and Empirical Duration Measures'],
  ['FI','LM14','Credit Risk'],
  ['FI','LM15','Credit Analysis for Government Issuers'],
  ['FI','LM16','Credit Analysis for Corporate Issuers'],
  ['FI','LM17','Fixed-Income Securitization'],
  ['FI','LM18','Asset-Backed Security Instruments and Valuation'],
  ['FI','LM19','Mortgage-Backed Security Instruments and Valuation'],
  ['DER','LM01','Derivative Instrument and Market Features'],
  ['DER','LM02','Forward Commitment and Contingent Claim Features'],
  ['DER','LM03','Derivative Benefits, Risks, and Uses'],
  ['DER','LM04','Arbitrage, Replication, and Cost of Carry'],
  ['DER','LM05','Pricing and Valuation of Forward Contracts'],
  ['DER','LM06','Pricing and Valuation of Futures Contracts'],
  ['DER','LM07','Pricing and Valuation of Interest Rate Swaps'],
  ['DER','LM08','Pricing and Valuation of Options'],
  ['DER','LM09','Option Replication Using Put-Call Parity'],
  ['DER','LM10','Valuing a Derivative Using a One-Period Binomial Model'],
  ['ALT','LM01','Alternative Investment Features, Methods, Structures'],
  ['ALT','LM02','Alternative Investment Performance and Returns'],
  ['ALT','LM03','Private Capital: Equity and Debt'],
  ['ALT','LM04','Real Estate and Infrastructure'],
  ['ALT','LM05','Natural Resources'],
  ['ALT','LM06','Hedge Funds'],
  ['ALT','LM07','Introduction to Digital Assets'],
  ['PM','LM01','Portfolio Risk and Return: Part I'],
  ['PM','LM02','Portfolio Risk and Return: Part II'],
  ['PM','LM03','Portfolio Management: An Overview'],
  ['PM','LM04','Basics of Portfolio Planning and Construction'],
  ['PM','LM05','Behavioral Biases of Individuals'],
  ['PM','LM06','Introduction to Risk Management'],
]

// Build lookup: "ETH/LM01" → "Ethics and Trust in the Investment Profession"
export const LM_TITLES: Record<string, string> = Object.fromEntries(
  LM_DATA.map(([t, lm, title]) => [`${t}/${lm}`, title])
)

// Get LMs for a specific topic
export function getLMsForTopic(topic: string) {
  return LM_DATA.filter(([t]) => t === topic)
}
