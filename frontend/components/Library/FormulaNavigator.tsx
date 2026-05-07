'use client'

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'

/* ═══════════════════════════════════════════════════════════════
   FormulaNavigator — CFA Level I Formula & Concept Reference
   ═══════════════════════════════════════════════════════════════ */

// ── Topic Colors ──────────────────────────────────────────────
const TOPIC_COLORS: Record<string, { bg: string; text: string }> = {
  Ethics:                   { bg: '#EAF3DE', text: '#27500A' },
  'Quantitative Methods':   { bg: '#E6F1FB', text: '#0C447C' },
  Economics:                { bg: '#FAEEDA', text: '#633806' },
  FSA:                      { bg: '#E1F5EE', text: '#085041' },
  'Fixed Income':           { bg: '#EEEDFE', text: '#3C3489' },
  Equity:                   { bg: '#FAECE7', text: '#993C1D' },
  Derivatives:              { bg: '#FBEAF0', text: '#993556' },
  'Portfolio Management':   { bg: '#F1EFE8', text: '#444441' },
  'Corporate Issuers':      { bg: '#FCEBEB', text: '#791F1F' },
  'Alternative Investments':{ bg: '#FAC775', text: '#412402' },
}

const TOPICS = ['All', ...Object.keys(TOPIC_COLORS)] as const

// ── Types ─────────────────────────────────────────────────────
interface Variable { sym: string; meaning: string }

interface Concept {
  id: string
  topic: string
  title: string
  preview: string
  formula?: string
  note: string
  variables?: Variable[]
}

interface Props {
  onPractice?: (conceptId: string) => void
}

// ── Data — 58 CFA Level I Concepts ───────────────────────────
const CONCEPTS: Concept[] = [
  // ─── Ethics (7) ─────────────────────────────────────────────
  {
    id: 'eth-01', topic: 'Ethics',
    title: 'Standard I — Professionalism',
    preview: 'Knowledge of the Law, Independence, Misrepresentation, Misconduct.',
    note: 'Members must understand and comply with applicable laws and regulations. When conflicts exist, follow the stricter law. Independence and objectivity must be maintained, and misrepresentation of credentials or work is prohibited.',
    variables: [
      { sym: 'I(A)', meaning: 'Knowledge of the Law — comply with strictest applicable law' },
      { sym: 'I(B)', meaning: 'Independence & Objectivity — no gifts that could impair judgment' },
      { sym: 'I(C)', meaning: 'Misrepresentation — no false statements about credentials or analysis' },
      { sym: 'I(D)', meaning: 'Misconduct — no dishonest, fraudulent, or deceitful conduct' },
    ],
  },
  {
    id: 'eth-02', topic: 'Ethics',
    title: 'Standard II — Market Integrity',
    preview: 'Material Nonpublic Information and Market Manipulation.',
    note: 'Members must not act or cause others to act on material nonpublic information. Market manipulation through price distortion or volume inflation is strictly prohibited.',
    variables: [
      { sym: 'II(A)', meaning: 'Material Nonpublic Info — do not trade or induce trading on MNPI' },
      { sym: 'II(B)', meaning: 'Market Manipulation — no artificial price/volume distortion' },
    ],
  },
  {
    id: 'eth-03', topic: 'Ethics',
    title: 'Standard III — Duties to Clients',
    preview: 'Loyalty, Fair Dealing, Suitability, Performance Presentation, Confidentiality.',
    note: 'Client interests always come first. Investment actions must be suitable for the client\'s objectives and constraints. Performance must be presented fairly, and client information must remain confidential.',
    variables: [
      { sym: 'III(A)', meaning: 'Loyalty, Prudence, Care — client interests first' },
      { sym: 'III(B)', meaning: 'Fair Dealing — treat all clients fairly in recommendations' },
      { sym: 'III(C)', meaning: 'Suitability — match investments to client IPS' },
      { sym: 'III(D)', meaning: 'Performance Presentation — no false or misleading results' },
      { sym: 'III(E)', meaning: 'Confidentiality — protect client information' },
    ],
  },
  {
    id: 'eth-04', topic: 'Ethics',
    title: 'Standard IV — Duties to Employers',
    preview: 'Loyalty, Additional Compensation, Supervisory Responsibilities.',
    note: 'Act in the best interest of your employer; do not cause harm. Any additional compensation must be disclosed and approved. Supervisors must establish and enforce compliance procedures.',
    variables: [
      { sym: 'IV(A)', meaning: 'Loyalty — act for the employer\'s benefit, not personal gain' },
      { sym: 'IV(B)', meaning: 'Additional Compensation — disclose external arrangements' },
      { sym: 'IV(C)', meaning: 'Supervisory — ensure adequate compliance systems' },
    ],
  },
  {
    id: 'eth-05', topic: 'Ethics',
    title: 'Standard V — Investment Analysis',
    preview: 'Diligence, Communication, Record Retention (7 years).',
    note: 'Analysis must be thorough and have a reasonable basis. Distinguish fact from opinion in communications. Records supporting analysis must be retained for a minimum of 7 years.',
    variables: [
      { sym: 'V(A)', meaning: 'Diligence & Reasonable Basis — thorough research before recommending' },
      { sym: 'V(B)', meaning: 'Communication — separate fact from opinion clearly' },
      { sym: 'V(C)', meaning: 'Record Retention — keep records for 7 years minimum' },
    ],
  },
  {
    id: 'eth-06', topic: 'Ethics',
    title: 'Standard VI — Conflicts of Interest',
    preview: 'Disclosure, Priority of Transactions, Referral Fees.',
    note: 'All conflicts must be disclosed prominently. Transaction priority: clients first, employer second, personal last. Referral fees received or paid must be disclosed to clients.',
    variables: [
      { sym: 'VI(A)', meaning: 'Disclosure of Conflicts — full and fair disclosure' },
      { sym: 'VI(B)', meaning: 'Priority of Transactions — client > employer > personal' },
      { sym: 'VI(C)', meaning: 'Referral Fees — disclose any compensation for referrals' },
    ],
  },
  {
    id: 'eth-07', topic: 'Ethics',
    title: 'GIPS Compliance',
    preview: 'Composite construction, Firm-wide compliance, 9 sections.',
    note: 'The Global Investment Performance Standards require firm-wide compliance (no cherry-picking). Composites group similar portfolios. GIPS has 9 sections covering fundamentals, input data, calculation, composite, disclosure, presentation, real estate, private equity, and wrap/SMA.',
    variables: [
      { sym: 'Composite', meaning: 'Aggregation of portfolios with similar strategy' },
      { sym: 'Firm-wide', meaning: 'GIPS must apply to the entire firm, not select portfolios' },
      { sym: '9 Sections', meaning: 'Fundamentals, Input Data, Calculation, Composite, Disclosure, Presentation, RE, PE, Wrap' },
    ],
  },

  // ─── Quantitative Methods (18) ─────────────────────────────
  {
    id: 'qm-01', topic: 'Quantitative Methods',
    title: 'Future Value (FV)',
    preview: 'Compound a present value forward in time.',
    formula: 'FV = PV × (1 + I/Y)^N',
    note: 'The future value formula compounds a lump sum at a periodic rate over N periods. This is the foundation of all time value of money calculations.',
    variables: [
      { sym: 'FV', meaning: 'Future Value — value at end of N periods' },
      { sym: 'PV', meaning: 'Present Value — value today' },
      { sym: 'I/Y', meaning: 'Interest rate per compounding period' },
      { sym: 'N', meaning: 'Number of compounding periods' },
    ],
  },
  {
    id: 'qm-02', topic: 'Quantitative Methods',
    title: 'Present Value (PV)',
    preview: 'Discount a future cash flow back to today.',
    formula: 'PV = FV / (1 + I/Y)^N',
    note: 'The present value discounts a future amount to its equivalent today. Higher discount rates or longer horizons yield lower present values.',
    variables: [
      { sym: 'PV', meaning: 'Present Value — today\'s equivalent' },
      { sym: 'FV', meaning: 'Future Value — amount received in the future' },
      { sym: 'I/Y', meaning: 'Discount rate per period' },
      { sym: 'N', meaning: 'Number of periods' },
    ],
  },
  {
    id: 'qm-03', topic: 'Quantitative Methods',
    title: 'Perpetuity PV',
    preview: 'Present value of an infinite stream of constant payments.',
    formula: 'PV = PMT / r',
    note: 'A perpetuity pays a fixed amount forever. Its present value is simply the payment divided by the discount rate. Used for preferred stock valuation and consol bonds.',
    variables: [
      { sym: 'PV', meaning: 'Present value of the perpetuity' },
      { sym: 'PMT', meaning: 'Constant periodic payment' },
      { sym: 'r', meaning: 'Discount rate (required return)' },
    ],
  },
  {
    id: 'qm-04', topic: 'Quantitative Methods',
    title: 'Effective Annual Rate',
    preview: 'Annualized rate accounting for compounding frequency.',
    formula: 'EAR = (1 + r_stated/m)^m − 1\nEAR_continuous = e^r − 1',
    note: 'The EAR converts a stated rate with m compounding periods to an equivalent annual rate. More frequent compounding increases the effective rate. Continuous compounding uses the exponential function.',
    variables: [
      { sym: 'EAR', meaning: 'Effective Annual Rate' },
      { sym: 'r_stated', meaning: 'Stated (nominal) annual rate' },
      { sym: 'm', meaning: 'Number of compounding periods per year' },
      { sym: 'e', meaning: 'Euler\'s number (≈ 2.71828)' },
    ],
  },
  {
    id: 'qm-05', topic: 'Quantitative Methods',
    title: 'Required Rate of Return',
    preview: 'Build-up approach for the minimum acceptable return.',
    formula: 'E(R) = (1 + RFR_real)(1 + IP)(1 + RP) − 1\nApprox: RFR + IP + RP',
    note: 'The required return compensates for the real risk-free rate, expected inflation, and a risk premium. The exact formula multiplies the components; the approximation sums them.',
    variables: [
      { sym: 'E(R)', meaning: 'Expected / required return' },
      { sym: 'RFR_real', meaning: 'Real risk-free rate' },
      { sym: 'IP', meaning: 'Inflation premium' },
      { sym: 'RP', meaning: 'Risk premium (default, liquidity, maturity)' },
    ],
  },
  {
    id: 'qm-06', topic: 'Quantitative Methods',
    title: 'Arithmetic Mean',
    preview: 'Simple average of a set of observations.',
    formula: 'X̄ = (1/n) × ΣXᵢ',
    note: 'The arithmetic mean is the sum of all values divided by the count. It is the best estimate for next period\'s return but overstates compounded growth over multiple periods.',
    variables: [
      { sym: 'X̄', meaning: 'Arithmetic mean (sample average)' },
      { sym: 'n', meaning: 'Number of observations' },
      { sym: 'Xᵢ', meaning: 'Individual observation i' },
    ],
  },
  {
    id: 'qm-07', topic: 'Quantitative Methods',
    title: 'Geometric Mean Return',
    preview: 'Compound average return over multiple periods.',
    formula: 'R_G = [(1+R₁)(1+R₂)…(1+Rₙ)]^(1/n) − 1',
    note: 'The geometric mean captures compound growth and is always less than or equal to the arithmetic mean (equality only when all returns are identical). Use it for multi-period performance measurement.',
    variables: [
      { sym: 'R_G', meaning: 'Geometric mean return' },
      { sym: 'Rₙ', meaning: 'Return in period n' },
      { sym: 'n', meaning: 'Number of periods' },
    ],
  },
  {
    id: 'qm-08', topic: 'Quantitative Methods',
    title: 'Harmonic Mean',
    preview: 'Average for rates — used for dollar-cost averaging.',
    formula: 'X̄_H = n / Σ(1/Xᵢ)',
    note: 'The harmonic mean is appropriate when averaging ratios or rates like P/E multiples. It\'s the correct measure for the average cost when investing equal dollar amounts at different prices.',
    variables: [
      { sym: 'X̄_H', meaning: 'Harmonic mean' },
      { sym: 'n', meaning: 'Number of observations' },
      { sym: 'Xᵢ', meaning: 'Individual observation (must be > 0)' },
    ],
  },
  {
    id: 'qm-09', topic: 'Quantitative Methods',
    title: 'Variance & Standard Deviation',
    preview: 'Measures of dispersion around the mean.',
    formula: 'σ² = Σ(Xᵢ − μ)² / N\ns² = Σ(Xᵢ − X̄)² / (n − 1)',
    note: 'Population variance divides by N; sample variance divides by (n−1) for an unbiased estimate (Bessel\'s correction). Standard deviation is the square root of variance, in the same units as the data.',
    variables: [
      { sym: 'σ²', meaning: 'Population variance' },
      { sym: 's²', meaning: 'Sample variance' },
      { sym: 'μ', meaning: 'Population mean' },
      { sym: 'X̄', meaning: 'Sample mean' },
      { sym: 'N / n', meaning: 'Population size / sample size' },
    ],
  },
  {
    id: 'qm-10', topic: 'Quantitative Methods',
    title: 'Coefficient of Variation',
    preview: 'Risk per unit of return — standardized dispersion.',
    formula: 'CV = s / X̄',
    note: 'CV measures relative dispersion — how much risk per unit of expected return. Lower CV is preferable. It allows comparison of risk across investments with different means.',
    variables: [
      { sym: 'CV', meaning: 'Coefficient of Variation' },
      { sym: 's', meaning: 'Standard deviation of returns' },
      { sym: 'X̄', meaning: 'Mean return' },
    ],
  },
  {
    id: 'qm-11', topic: 'Quantitative Methods',
    title: 'Holding Period Return',
    preview: 'Total return over a single holding period.',
    formula: 'HPR = (Pₜ − Pₜ₋₁ + Dₜ) / Pₜ₋₁',
    note: 'HPR captures both capital appreciation and income received during the period. It can be calculated for any time horizon and does not annualize the return.',
    variables: [
      { sym: 'HPR', meaning: 'Holding Period Return' },
      { sym: 'Pₜ', meaning: 'Ending price' },
      { sym: 'Pₜ₋₁', meaning: 'Beginning price' },
      { sym: 'Dₜ', meaning: 'Distributions (dividends, interest) received' },
    ],
  },
  {
    id: 'qm-12', topic: 'Quantitative Methods',
    title: "Roy's Safety-First Ratio",
    preview: 'Measures distance from a minimum acceptable return.',
    formula: 'SFR = (r̄_p − r_target) / σ_p',
    note: 'The SFR ratio measures how many standard deviations the expected portfolio return is above the minimum threshold. Higher SFR is better — it minimizes the probability of falling below the target.',
    variables: [
      { sym: 'SFR', meaning: 'Safety-First Ratio' },
      { sym: 'r̄_p', meaning: 'Expected portfolio return' },
      { sym: 'r_target', meaning: 'Minimum acceptable return (threshold)' },
      { sym: 'σ_p', meaning: 'Portfolio standard deviation' },
    ],
  },
  {
    id: 'qm-13', topic: 'Quantitative Methods',
    title: 'Correlation & Covariance',
    preview: 'Measures of linear co-movement between two assets.',
    formula: 'Corr(i,j) = Cov(i,j) / (σᵢ × σⱼ)',
    note: 'Covariance measures the direction of linear co-movement. Correlation standardizes covariance to a range of [−1, +1]. A correlation of −1 means perfect negative linear relationship.',
    variables: [
      { sym: 'Corr(i,j)', meaning: 'Correlation coefficient between i and j' },
      { sym: 'Cov(i,j)', meaning: 'Covariance between i and j' },
      { sym: 'σᵢ, σⱼ', meaning: 'Standard deviations of i and j' },
    ],
  },
  {
    id: 'qm-14', topic: 'Quantitative Methods',
    title: '2-Asset Portfolio Variance',
    preview: 'Risk of a two-asset portfolio including diversification.',
    formula: 'σ²_p = w²_A·σ²_A + w²_B·σ²_B + 2·w_A·w_B·σ_A·σ_B·ρ_AB',
    note: 'Portfolio variance depends on individual variances, weights, and the correlation between assets. When ρ < 1, diversification reduces risk below the weighted average of individual risks.',
    variables: [
      { sym: 'σ²_p', meaning: 'Portfolio variance' },
      { sym: 'w_A, w_B', meaning: 'Portfolio weights of assets A and B' },
      { sym: 'σ²_A, σ²_B', meaning: 'Variance of each asset' },
      { sym: 'ρ_AB', meaning: 'Correlation between A and B' },
    ],
  },
  {
    id: 'qm-15', topic: 'Quantitative Methods',
    title: 'Z-Score',
    preview: 'Number of standard deviations from the mean.',
    formula: 'z = (x − μ) / σ',
    note: 'The z-score standardizes any observation to a standard normal distribution (mean 0, std dev 1). It tells you how extreme a value is relative to the distribution.',
    variables: [
      { sym: 'z', meaning: 'Z-score (standard score)' },
      { sym: 'x', meaning: 'Observed value' },
      { sym: 'μ', meaning: 'Population mean' },
      { sym: 'σ', meaning: 'Population standard deviation' },
    ],
  },
  {
    id: 'qm-16', topic: 'Quantitative Methods',
    title: 'Confidence Intervals',
    preview: 'Range around the sample mean at a given confidence level.',
    formula: 'X̄ ± z_(α/2) × (σ / √n)',
    note: 'The confidence interval estimates the population mean with a given probability. Key z-values: 1.645 for 90%, 1.96 for 95%, 2.575 for 99%. Use t-distribution when population σ is unknown and n < 30.',
    variables: [
      { sym: 'X̄', meaning: 'Sample mean' },
      { sym: 'z_(α/2)', meaning: 'Critical z-value for confidence level' },
      { sym: 'σ', meaning: 'Population standard deviation' },
      { sym: 'n', meaning: 'Sample size' },
    ],
  },
  {
    id: 'qm-17', topic: 'Quantitative Methods',
    title: 'Skewness',
    preview: 'Asymmetry of the return distribution.',
    formula: 'Skew = (1/n) × Σ(Xᵢ − X̄)³ / s³',
    note: 'Positive skewness means a longer right tail (more extreme positive returns). Negative skewness has a longer left tail (more extreme losses). Normal distribution has skewness = 0.',
    variables: [
      { sym: 'Skew', meaning: 'Sample skewness (third standardized moment)' },
      { sym: 'Xᵢ', meaning: 'Individual observation' },
      { sym: 'X̄', meaning: 'Sample mean' },
      { sym: 's', meaning: 'Sample standard deviation' },
    ],
  },
  {
    id: 'qm-18', topic: 'Quantitative Methods',
    title: 'Excess Kurtosis',
    preview: 'Tail thickness relative to a normal distribution.',
    formula: 'Excess Kurt = (1/n) × Σ(Xᵢ − X̄)⁴ / s⁴ − 3',
    note: 'Excess kurtosis above 0 (leptokurtic) means fatter tails than normal — more probability of extreme outcomes. Below 0 (platykurtic) means thinner tails. Financial returns are typically leptokurtic.',
    variables: [
      { sym: 'Excess Kurt', meaning: 'Excess kurtosis (fourth moment − 3)' },
      { sym: '3', meaning: 'Kurtosis of the normal distribution (subtracted)' },
      { sym: 'Leptokurtic', meaning: 'Excess kurtosis > 0 — fat tails' },
      { sym: 'Platykurtic', meaning: 'Excess kurtosis < 0 — thin tails' },
    ],
  },

  // ─── Economics (5) ─────────────────────────────────────────
  {
    id: 'econ-01', topic: 'Economics',
    title: 'Fisher Effect',
    preview: 'Relationship between nominal rate, real rate, and inflation.',
    formula: '(1 + r_nom) = (1 + r_real)(1 + π)\nApprox: r_nom ≈ r_real + π',
    note: 'The Fisher equation decomposes the nominal interest rate into a real component and an inflation component. The approximation works well when rates are low.',
    variables: [
      { sym: 'r_nom', meaning: 'Nominal interest rate' },
      { sym: 'r_real', meaning: 'Real interest rate' },
      { sym: 'π', meaning: 'Expected inflation rate' },
    ],
  },
  {
    id: 'econ-02', topic: 'Economics',
    title: 'TIPS Breakeven Inflation',
    preview: 'Market-implied inflation from Treasury vs TIPS yields.',
    formula: 'Breakeven = r_nominal_Treasury − r_real_TIPS',
    note: 'The breakeven inflation rate is the difference between a nominal Treasury yield and a real TIPS yield of the same maturity. If realized inflation exceeds this, TIPS outperform nominals.',
    variables: [
      { sym: 'Breakeven', meaning: 'Market-implied expected inflation' },
      { sym: 'r_nominal', meaning: 'Yield on nominal Treasury bond' },
      { sym: 'r_real_TIPS', meaning: 'Real yield on TIPS (inflation-protected)' },
    ],
  },
  {
    id: 'econ-03', topic: 'Economics',
    title: 'Quantity Theory of Money',
    preview: 'Link between money supply, velocity, price level, and output.',
    formula: 'M × V = P × Y',
    note: 'The equation of exchange states that money supply times its velocity equals nominal GDP. If V is stable and Y is at full employment, increases in M lead directly to higher prices (inflation).',
    variables: [
      { sym: 'M', meaning: 'Money supply' },
      { sym: 'V', meaning: 'Velocity of money' },
      { sym: 'P', meaning: 'Price level' },
      { sym: 'Y', meaning: 'Real output (real GDP)' },
    ],
  },
  {
    id: 'econ-04', topic: 'Economics',
    title: 'GDP Components',
    preview: 'Expenditure approach to measuring gross domestic product.',
    formula: 'GDP = C + I + G + (X − M)',
    note: 'GDP is the total market value of final goods and services. The expenditure approach sums consumption, investment, government spending, and net exports.',
    variables: [
      { sym: 'C', meaning: 'Consumption (household spending)' },
      { sym: 'I', meaning: 'Gross private domestic investment' },
      { sym: 'G', meaning: 'Government spending' },
      { sym: 'X − M', meaning: 'Net exports (exports minus imports)' },
    ],
  },
  {
    id: 'econ-05', topic: 'Economics',
    title: 'Money Multiplier',
    preview: 'Maximum deposit expansion from a change in reserves.',
    formula: 'Money Multiplier = 1 / reserve requirement',
    note: 'The money multiplier shows the maximum amount by which the money supply can expand from a unit increase in bank reserves. A reserve ratio of 10% gives a multiplier of 10.',
    variables: [
      { sym: 'Multiplier', meaning: 'Maximum expansion factor' },
      { sym: 'Reserve req.', meaning: 'Fraction of deposits banks must hold as reserves' },
    ],
  },

  // ─── FSA (6) ───────────────────────────────────────────────
  {
    id: 'fsa-01', topic: 'FSA',
    title: 'DuPont 3-Factor',
    preview: 'Decompose ROE into profitability, efficiency, and leverage.',
    formula: 'ROE = Net Margin × Asset Turnover × Leverage',
    note: 'The 3-factor DuPont breaks ROE into: how much profit per sale (margin), how efficiently assets generate sales (turnover), and how much leverage amplifies returns.',
    variables: [
      { sym: 'Net Margin', meaning: 'Net Income / Revenue' },
      { sym: 'Asset Turnover', meaning: 'Revenue / Average Total Assets' },
      { sym: 'Leverage', meaning: 'Average Total Assets / Average Equity' },
    ],
  },
  {
    id: 'fsa-02', topic: 'FSA',
    title: 'DuPont 5-Factor',
    preview: 'Extended decomposition separating tax and interest burden.',
    formula: 'ROE = Tax Burden × Interest Burden × EBIT Margin × Asset TO × Leverage',
    note: 'The 5-factor DuPont adds granularity by isolating the tax effect (NI/EBT) and the interest effect (EBT/EBIT). This helps identify whether changes in ROE come from operations, financing, or taxation.',
    variables: [
      { sym: 'Tax Burden', meaning: 'Net Income / EBT (closer to 1 = lower tax effect)' },
      { sym: 'Interest Burden', meaning: 'EBT / EBIT (closer to 1 = lower interest cost)' },
      { sym: 'EBIT Margin', meaning: 'EBIT / Revenue' },
      { sym: 'Asset TO', meaning: 'Revenue / Average Total Assets' },
      { sym: 'Leverage', meaning: 'Average Total Assets / Average Equity' },
    ],
  },
  {
    id: 'fsa-03', topic: 'FSA',
    title: 'Current Ratio',
    preview: 'Short-term liquidity — ability to pay current obligations.',
    formula: 'Current Ratio = Current Assets / Current Liabilities',
    note: 'A current ratio above 1 means the company has more short-term assets than obligations. However, a very high ratio may indicate inefficient use of assets. Compare within the same industry.',
    variables: [
      { sym: 'Current Assets', meaning: 'Cash, receivables, inventory, and other assets due within 1 year' },
      { sym: 'Current Liabilities', meaning: 'Obligations due within 1 year' },
    ],
  },
  {
    id: 'fsa-04', topic: 'FSA',
    title: 'Debt-to-Equity',
    preview: 'Leverage ratio comparing total debt to shareholder equity.',
    formula: 'D/E = Total Debt / Total Equity',
    note: 'The debt-to-equity ratio measures financial leverage. Higher values mean more debt financing relative to equity. It increases both potential returns and risk of financial distress.',
    variables: [
      { sym: 'Total Debt', meaning: 'Short-term + long-term borrowings' },
      { sym: 'Total Equity', meaning: 'Shareholder equity (book value)' },
    ],
  },
  {
    id: 'fsa-05', topic: 'FSA',
    title: 'Interest Coverage',
    preview: 'Ability to service debt interest from operating earnings.',
    formula: 'Interest Coverage = EBIT / Interest Expense',
    note: 'A higher coverage ratio means the company can more easily meet interest obligations. Below 1.5 is often considered risky. This is a key metric for credit analysts.',
    variables: [
      { sym: 'EBIT', meaning: 'Earnings Before Interest and Taxes' },
      { sym: 'Interest Expense', meaning: 'Total interest paid on debt' },
    ],
  },
  {
    id: 'fsa-06', topic: 'FSA',
    title: 'Free Cash Flow to Firm',
    preview: 'Cash available to all capital providers after reinvestment.',
    formula: 'FCFF = NI + NCC + Int(1−t) − FCInv − WCInv',
    note: 'FCFF represents cash flow available to both debt and equity holders. It starts from net income, adds back non-cash charges and after-tax interest, then subtracts capital expenditures and working capital investments.',
    variables: [
      { sym: 'NI', meaning: 'Net Income' },
      { sym: 'NCC', meaning: 'Non-Cash Charges (depreciation, amortization)' },
      { sym: 'Int(1−t)', meaning: 'After-tax interest expense' },
      { sym: 'FCInv', meaning: 'Fixed Capital Investment (capex)' },
      { sym: 'WCInv', meaning: 'Working Capital Investment' },
    ],
  },

  // ─── Fixed Income (12) ────────────────────────────────────
  {
    id: 'fi-01', topic: 'Fixed Income',
    title: 'Bond Price Formula',
    preview: 'Present value of all future coupon and principal cash flows.',
    formula: 'P = Σ[C / (1+r)^t] + FV / (1+r)^N',
    note: 'A bond\'s price equals the sum of discounted coupon payments plus the discounted face value. When the discount rate equals the coupon rate, the bond trades at par.',
    variables: [
      { sym: 'P', meaning: 'Bond price (present value)' },
      { sym: 'C', meaning: 'Periodic coupon payment' },
      { sym: 'r', meaning: 'Discount rate per period' },
      { sym: 'FV', meaning: 'Face (par) value' },
      { sym: 'N', meaning: 'Number of periods to maturity' },
    ],
  },
  {
    id: 'fi-02', topic: 'Fixed Income',
    title: 'Yield to Maturity (YTM)',
    preview: 'Internal rate of return if bond is held to maturity.',
    formula: 'Solve: P = Σ C/(1+YTM)^t + FV/(1+YTM)^N',
    note: 'YTM is the single discount rate that equates the bond\'s price to its cash flows. It assumes reinvestment of coupons at the YTM rate. Must be solved iteratively or with a financial calculator.',
    variables: [
      { sym: 'YTM', meaning: 'Yield to Maturity (annualized)' },
      { sym: 'P', meaning: 'Current market price' },
      { sym: 'C', meaning: 'Periodic coupon' },
      { sym: 'FV', meaning: 'Face value at maturity' },
    ],
  },
  {
    id: 'fi-03', topic: 'Fixed Income',
    title: 'Macaulay Duration',
    preview: 'Weighted average time to receive bond cash flows.',
    formula: 'MacDur = Σ[t × PV(CFₜ)] / Price',
    note: 'Macaulay duration measures the weighted average time (in periods) until cash flows are received. It is measured in years and represents the bond\'s effective maturity for interest rate sensitivity.',
    variables: [
      { sym: 'MacDur', meaning: 'Macaulay Duration (in periods)' },
      { sym: 't', meaning: 'Time period of each cash flow' },
      { sym: 'PV(CFₜ)', meaning: 'Present value of cash flow at time t' },
      { sym: 'Price', meaning: 'Full price of the bond' },
    ],
  },
  {
    id: 'fi-04', topic: 'Fixed Income',
    title: 'Modified Duration',
    preview: 'Price sensitivity to yield changes (first-order).',
    formula: 'ModDur = MacDur / (1 + YTM/m)\n%ΔP ≈ −ModDur × ΔYTM',
    note: 'Modified duration approximates the percentage price change for a 1% change in yield. It is a linear estimate and works well for small yield changes. Always negative relationship: yields up → price down.',
    variables: [
      { sym: 'ModDur', meaning: 'Modified Duration' },
      { sym: 'MacDur', meaning: 'Macaulay Duration' },
      { sym: 'YTM', meaning: 'Yield to Maturity' },
      { sym: 'm', meaning: 'Coupon payments per year' },
      { sym: 'ΔYTM', meaning: 'Change in yield (in decimal)' },
    ],
  },
  {
    id: 'fi-05', topic: 'Fixed Income',
    title: 'PVBP / DV01',
    preview: 'Dollar price change for a 1 basis point yield move.',
    formula: 'PVBP = ModDur × P × 0.0001',
    note: 'Price Value of a Basis Point (PVBP) or Dollar Value of 01 (DV01) gives the actual dollar amount the bond price changes for a 1bp yield move. Essential for hedging.',
    variables: [
      { sym: 'PVBP', meaning: 'Price Value of a Basis Point' },
      { sym: 'ModDur', meaning: 'Modified Duration' },
      { sym: 'P', meaning: 'Current bond price (per 100 par)' },
      { sym: '0.0001', meaning: '1 basis point in decimal' },
    ],
  },
  {
    id: 'fi-06', topic: 'Fixed Income',
    title: 'Convexity Adjustment',
    preview: 'Second-order correction for large yield changes.',
    formula: '%ΔP ≈ −ModDur × ΔYTM + ½ × Cvx × (ΔYTM)²',
    note: 'Duration alone underestimates price increases and overestimates price decreases. The convexity term adds a positive correction in both directions. Positive convexity is desirable.',
    variables: [
      { sym: 'ModDur', meaning: 'Modified Duration' },
      { sym: 'Cvx', meaning: 'Convexity (second derivative of price/yield)' },
      { sym: 'ΔYTM', meaning: 'Change in yield (decimal)' },
    ],
  },
  {
    id: 'fi-07', topic: 'Fixed Income',
    title: 'Z-spread vs OAS',
    preview: 'Static spread decomposition for bonds with embedded options.',
    formula: 'OAS = Z-spread − option value\nCallable: OAS < Z-spread',
    note: 'The Z-spread is the constant spread over the spot curve. For callable bonds, the OAS removes the option value — the investor is compensated less because the issuer holds the call option.',
    variables: [
      { sym: 'OAS', meaning: 'Option-Adjusted Spread' },
      { sym: 'Z-spread', meaning: 'Zero-volatility spread (static spread over spot curve)' },
      { sym: 'Option value', meaning: 'Value of the embedded option to the issuer' },
    ],
  },
  {
    id: 'fi-08', topic: 'Fixed Income',
    title: 'Bank Discount Yield',
    preview: 'Money market quoting convention based on face value.',
    formula: 'r_BD = (Discount / FV) × (360 / Days)',
    note: 'Bank discount yield quotes the discount as a percentage of face value, not purchase price, using a 360-day year. It understates the true return because of the face value denominator.',
    variables: [
      { sym: 'r_BD', meaning: 'Bank discount yield' },
      { sym: 'Discount', meaning: 'FV − Purchase Price' },
      { sym: 'FV', meaning: 'Face value' },
      { sym: 'Days', meaning: 'Days to maturity' },
    ],
  },
  {
    id: 'fi-09', topic: 'Fixed Income',
    title: 'Money Market Yield',
    preview: 'Annualized holding period yield using 360-day convention.',
    formula: 'r_MM = HPY × (360 / Days)',
    note: 'The money market yield annualizes the holding period yield using a 360-day year. Unlike bank discount yield, it is based on the purchase price, making it a more accurate return measure.',
    variables: [
      { sym: 'r_MM', meaning: 'Money market yield' },
      { sym: 'HPY', meaning: 'Holding period yield' },
      { sym: 'Days', meaning: 'Days to maturity' },
    ],
  },
  {
    id: 'fi-10', topic: 'Fixed Income',
    title: 'Bond Equivalent Yield',
    preview: 'Semi-annual yield for comparison with coupon bonds.',
    formula: 'BEY = 2 × [(1 + EAY)^(1/2) − 1]',
    note: 'BEY converts any yield to a semi-annual bond equivalent basis for comparison with standard US coupon bonds that pay semi-annually.',
    variables: [
      { sym: 'BEY', meaning: 'Bond equivalent yield (semi-annual)' },
      { sym: 'EAY', meaning: 'Effective annual yield' },
    ],
  },
  {
    id: 'fi-11', topic: 'Fixed Income',
    title: 'Breakeven Inflation (FI)',
    preview: 'Implied inflation from nominal vs real yields.',
    formula: 'Breakeven = r_nominal − r_real_TIPS',
    note: 'Same concept as TIPS breakeven: the market-implied inflation expectation. If actual inflation exceeds this spread, inflation-linked bonds outperform nominal bonds.',
    variables: [
      { sym: 'r_nominal', meaning: 'Nominal bond yield' },
      { sym: 'r_real_TIPS', meaning: 'Real yield on inflation-linked bond' },
    ],
  },
  {
    id: 'fi-12', topic: 'Fixed Income',
    title: 'Forward Rate',
    preview: 'Implied future short rate from the spot curve.',
    formula: '(1 + S_n)^n = (1 + S_(n−1))^(n−1) × (1 + f_(n−1,1))',
    note: 'Forward rates are future rates implied by today\'s spot curve. Under the pure expectations theory, forward rates equal expected future spot rates. Arbitrage ensures consistency between spot and forward rates.',
    variables: [
      { sym: 'S_n', meaning: 'Spot rate for n periods' },
      { sym: 'f_(n−1,1)', meaning: 'One-period forward rate starting at period n−1' },
    ],
  },

  // ─── Equity (4) ────────────────────────────────────────────
  {
    id: 'eq-01', topic: 'Equity',
    title: 'Gordon Growth Model',
    preview: 'Value a stock with constant dividend growth forever.',
    formula: 'P₀ = D₁ / (r − g)',
    note: 'The Gordon Growth Model (Dividend Discount Model) values a stock as the next dividend divided by the required return minus the growth rate. Only valid when r > g and g is constant.',
    variables: [
      { sym: 'P₀', meaning: 'Intrinsic value of stock today' },
      { sym: 'D₁', meaning: 'Expected dividend next period' },
      { sym: 'r', meaning: 'Required rate of return' },
      { sym: 'g', meaning: 'Constant dividend growth rate' },
    ],
  },
  {
    id: 'eq-02', topic: 'Equity',
    title: 'Price Multiples',
    preview: 'Relative valuation using P/E and P/B ratios.',
    formula: 'P/E = Price / EPS\nP/B = Price / Book Value per Share',
    note: 'Price multiples compare a stock\'s market price to a fundamental metric. Trailing P/E uses last 12 months EPS; forward P/E uses forecasted EPS. Compare multiples within the same industry.',
    variables: [
      { sym: 'P/E', meaning: 'Price-to-Earnings ratio' },
      { sym: 'P/B', meaning: 'Price-to-Book ratio' },
      { sym: 'EPS', meaning: 'Earnings Per Share' },
      { sym: 'BVPS', meaning: 'Book Value Per Share' },
    ],
  },
  {
    id: 'eq-03', topic: 'Equity',
    title: 'EV/EBITDA',
    preview: 'Enterprise value multiple — capital structure neutral.',
    formula: 'EV = Market Cap + Debt − Cash\nEV/EBITDA',
    note: 'EV/EBITDA compares total firm value (debt + equity) to operating cash earnings. It is capital structure neutral, making it useful for comparing firms with different leverage levels.',
    variables: [
      { sym: 'EV', meaning: 'Enterprise Value' },
      { sym: 'Market Cap', meaning: 'Share price × shares outstanding' },
      { sym: 'Debt', meaning: 'Total debt (net of cash)' },
      { sym: 'EBITDA', meaning: 'Earnings Before Interest, Taxes, Depreciation, Amortization' },
    ],
  },
  {
    id: 'eq-04', topic: 'Equity',
    title: 'Total Return',
    preview: 'Combined capital gain and income return.',
    formula: 'Total Return = Capital Gain Yield + Dividend Yield',
    note: 'Total return captures both price appreciation and income received. Capital gain yield is (P₁−P₀)/P₀ and dividend yield is D₁/P₀. Both components matter for investment evaluation.',
    variables: [
      { sym: 'Capital Gain Yield', meaning: '(P₁ − P₀) / P₀' },
      { sym: 'Dividend Yield', meaning: 'D₁ / P₀' },
    ],
  },

  // ─── Derivatives (3) ──────────────────────────────────────
  {
    id: 'deriv-01', topic: 'Derivatives',
    title: 'Put-Call Parity',
    preview: 'Fundamental relationship between European calls and puts.',
    formula: 'C + PV(X) = P + S₀',
    note: 'Put-call parity links the prices of European calls and puts with the same strike and expiration. Violations create riskless arbitrage opportunities. Only holds for European options.',
    variables: [
      { sym: 'C', meaning: 'European call premium' },
      { sym: 'P', meaning: 'European put premium' },
      { sym: 'S₀', meaning: 'Current stock price' },
      { sym: 'PV(X)', meaning: 'Present value of strike price X' },
    ],
  },
  {
    id: 'deriv-02', topic: 'Derivatives',
    title: 'Forward Price',
    preview: 'No-arbitrage forward price for an asset with income.',
    formula: 'F₀(T) = S₀ × (1 + r)^T − FV(dividends)',
    note: 'The forward price equals the spot price compounded at the risk-free rate, minus the future value of any income (dividends) received during the contract period. This is a no-arbitrage condition.',
    variables: [
      { sym: 'F₀(T)', meaning: 'Forward price for delivery at time T' },
      { sym: 'S₀', meaning: 'Current spot price' },
      { sym: 'r', meaning: 'Risk-free rate' },
      { sym: 'T', meaning: 'Time to maturity' },
      { sym: 'FV(div)', meaning: 'Future value of dividends received' },
    ],
  },
  {
    id: 'deriv-03', topic: 'Derivatives',
    title: 'Option Intrinsic Value',
    preview: 'In-the-money value — payoff if exercised immediately.',
    formula: 'Call: max(0, S − X)\nPut:  max(0, X − S)',
    note: 'Intrinsic value is the immediate exercise value. A call is in-the-money when S > X. A put is in-the-money when X > S. Option premium = intrinsic value + time value.',
    variables: [
      { sym: 'S', meaning: 'Current stock price' },
      { sym: 'X', meaning: 'Strike (exercise) price' },
      { sym: 'max(0, ...)', meaning: 'Cannot be negative — option holder won\'t exercise at a loss' },
    ],
  },

  // ─── Portfolio Management (3) ─────────────────────────────
  {
    id: 'pm-01', topic: 'Portfolio Management',
    title: 'Sharpe Ratio',
    preview: 'Excess return per unit of total risk.',
    formula: 'Sharpe = (R_p − R_f) / σ_p',
    note: 'The Sharpe ratio measures risk-adjusted performance using total risk (standard deviation). Higher is better. It penalizes both systematic and unsystematic risk. Only meaningful for positive excess returns.',
    variables: [
      { sym: 'R_p', meaning: 'Portfolio return' },
      { sym: 'R_f', meaning: 'Risk-free rate' },
      { sym: 'σ_p', meaning: 'Portfolio standard deviation' },
    ],
  },
  {
    id: 'pm-02', topic: 'Portfolio Management',
    title: 'CAPM',
    preview: 'Expected return based on systematic risk only.',
    formula: 'E(Rᵢ) = R_f + βᵢ × [E(R_m) − R_f]',
    note: 'The Capital Asset Pricing Model prices assets based on beta (systematic risk). Only non-diversifiable risk is compensated. The security market line (SML) plots expected return vs beta.',
    variables: [
      { sym: 'E(Rᵢ)', meaning: 'Expected return on asset i' },
      { sym: 'R_f', meaning: 'Risk-free rate' },
      { sym: 'βᵢ', meaning: 'Beta — sensitivity to market returns' },
      { sym: 'E(R_m) − R_f', meaning: 'Market risk premium' },
    ],
  },
  {
    id: 'pm-03', topic: 'Portfolio Management',
    title: 'Beta',
    preview: 'Measure of systematic risk relative to the market.',
    formula: 'β = Cov(Rᵢ, R_m) / σ²_m',
    note: 'Beta measures how much an asset\'s return moves with the market. β = 1 means market-like risk; β > 1 is more volatile; β < 1 is less volatile. It is the slope of the regression of asset returns on market returns.',
    variables: [
      { sym: 'β', meaning: 'Beta coefficient' },
      { sym: 'Cov(Rᵢ, R_m)', meaning: 'Covariance of asset and market returns' },
      { sym: 'σ²_m', meaning: 'Variance of market returns' },
    ],
  },
]

// ── Component ─────────────────────────────────────────────────
export default function FormulaNavigator({ onPractice }: Props) {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [activeTopic, setActiveTopic] = useState<string>('All')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 150)
    return () => clearTimeout(t)
  }, [search])

  // Keyboard — Escape closes card & clears search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setExpandedId(null)
        setSearch('')
        setDebouncedSearch('')
        searchRef.current?.blur()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Tab switch resets search
  const switchTopic = useCallback((t: string) => {
    setActiveTopic(t)
    setSearch('')
    setDebouncedSearch('')
    setExpandedId(null)
  }, [])

  // Filter
  const filtered = useMemo(() => {
    let list = CONCEPTS
    if (activeTopic !== 'All') list = list.filter(c => c.topic === activeTopic)
    if (!debouncedSearch) return list
    const q = debouncedSearch.toLowerCase()
    return list.filter(c =>
      c.title.toLowerCase().includes(q) ||
      (c.formula || '').toLowerCase().includes(q) ||
      c.note.toLowerCase().includes(q) ||
      c.preview.toLowerCase().includes(q) ||
      (c.variables || []).some(v =>
        v.sym.toLowerCase().includes(q) || v.meaning.toLowerCase().includes(q)
      )
    )
  }, [activeTopic, debouncedSearch])

  const handleToggle = useCallback((id: string) => {
    setExpandedId(prev => (prev === id ? null : id))
  }, [])

  const handlePractice = useCallback((id: string) => {
    if (onPractice) onPractice(id)
    else console.log('Practice:', id)
  }, [onPractice])

  // ── Render ──────────────────────────────────────────────────
  return (
    <div style={{ '--fn-navy': '#0D1B3E', '--fn-gold': '#C9A84C', '--fn-surface': '#111827', '--fn-surface2': '#1a2236', '--fn-border': 'rgba(255,255,255,0.07)' } as React.CSSProperties}
         className="w-full min-h-0 text-gray-100">

      {/* ── Header ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-white tracking-tight">Formula Navigator</h2>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                style={{ background: '#C9A84C22', color: '#C9A84C' }}>
            {filtered.length} / {CONCEPTS.length}
          </span>
        </div>
        <div className="relative w-full sm:w-72">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={searchRef}
            type="text"
            placeholder="Search formulas, concepts, variables..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg text-sm bg-[#111827] border border-white/10 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-[#C9A84C]/50 focus:ring-1 focus:ring-[#C9A84C]/30 transition"
          />
        </div>
      </div>

      {/* ── Topic Dropdown ────────────────────────── */}
      <div className="mb-5">
        <select
          value={activeTopic}
          onChange={e => switchTopic(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg text-sm text-white outline-none cursor-pointer"
          style={{ background: '#1a2540', border: '1px solid #2a3560' }}
        >
          {TOPICS.map(t => (
            <option key={t} value={t} style={{ background: '#1a2540' }}>{t === 'All' ? 'All Topics' : t}</option>
          ))}
        </select>
      </div>

      {/* ── Empty State ───────────────────────────── */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
          <svg className="w-12 h-12 mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm mb-2">No results for &ldquo;{debouncedSearch}&rdquo;</p>
          <button
            onClick={() => { setSearch(''); setDebouncedSearch('') }}
            className="text-xs font-medium px-3 py-1 rounded-md transition"
            style={{ color: '#C9A84C', background: '#C9A84C18' }}
          >
            Clear search
          </button>
        </div>
      )}

      {/* ── Card Grid ─────────────────────────────── */}
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}>
        {filtered.map(c => {
          const open = expandedId === c.id
          const colors = TOPIC_COLORS[c.topic]
          return (
            <div key={c.id}
                 className="rounded-xl border transition-all duration-200"
                 style={{
                   background: open ? '#0f172a' : '#111827',
                   borderColor: open ? 'rgba(201,168,76,0.25)' : 'rgba(255,255,255,0.06)',
                   boxShadow: open ? '0 0 20px rgba(201,168,76,0.06)' : 'none',
                 }}>
              {/* Card Header — clickable */}
              <button
                onClick={() => handleToggle(c.id)}
                aria-expanded={open}
                className="w-full flex items-start gap-3 p-4 text-left group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-semibold text-white group-hover:text-[#C9A84C] transition-colors truncate">
                      {c.title}
                    </span>
                    <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold shrink-0"
                          style={{ background: colors.bg, color: colors.text }}>
                      {c.topic}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{c.preview}</p>
                </div>
                <svg
                  className={`w-4 h-4 text-gray-500 shrink-0 mt-1 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Expanded Body */}
              {open && (
                <div className="px-4 pb-4 space-y-3 animate-in">
                  <div className="border-t border-white/5 pt-3" />

                  {/* Formula Block */}
                  {c.formula && (
                    <div className="rounded-lg px-4 py-3 font-mono text-sm leading-relaxed"
                         style={{ background: '#0a0f1a', border: '1px solid rgba(201,168,76,0.15)' }}>
                      {c.formula.split('\n').map((line, i) => (
                        <div key={i} style={{ color: '#C9A84C' }}>
                          {line.split(/(\b[A-Za-z_][A-Za-z_₀₁₂₃₄₅₆₇₈₉αβγδεσμπρ]*(?:\([^)]*\))?)/g).map((part, j) =>
                            j % 2 === 1
                              ? <strong key={j} className="text-white">{part}</strong>
                              : <span key={j}>{part}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Note */}
                  <p className="text-xs text-gray-400 leading-relaxed">{c.note}</p>

                  {/* Variables Table */}
                  {c.variables && c.variables.length > 0 && (
                    <div className="rounded-lg overflow-hidden border border-white/5">
                      <table className="w-full text-xs">
                        <thead>
                          <tr style={{ background: '#0d1424' }}>
                            <th className="text-left px-3 py-1.5 text-gray-500 font-medium w-28">Variable</th>
                            <th className="text-left px-3 py-1.5 text-gray-500 font-medium">Meaning</th>
                          </tr>
                        </thead>
                        <tbody>
                          {c.variables.map((v, i) => (
                            <tr key={i} className="border-t border-white/[0.03]" style={{ background: i % 2 === 0 ? 'transparent' : '#0d142408' }}>
                              <td className="px-3 py-1.5 font-mono font-semibold" style={{ color: '#C9A84C' }}>{v.sym}</td>
                              <td className="px-3 py-1.5 text-gray-400">{v.meaning}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Practice Button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handlePractice(c.id) }}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-150 hover:brightness-110"
                    style={{ background: '#C9A84C20', color: '#C9A84C' }}
                  >
                    Practice this
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
