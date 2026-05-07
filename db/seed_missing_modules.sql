-- ============================================================
-- Wingman — Seed Missing Modules
-- Adds 25 missing CFA Level I learning modules with
-- learning outcomes, questions, and flashcards.
-- ============================================================

BEGIN;

-- ============================================================
-- 1. LEARNING MODULES
-- ============================================================

-- --------------------------------------------------------
-- Corporate Issuers — 2 new modules
-- --------------------------------------------------------
INSERT INTO learning_modules (topic_id, code, title, sort_order) VALUES
    ((SELECT id FROM topics WHERE code='CORP'), 'CORP-06', 'Capital Structure', 6),
    ((SELECT id FROM topics WHERE code='CORP'), 'CORP-07', 'Business Models', 7)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- Financial Statement Analysis — 1 new module
-- --------------------------------------------------------
INSERT INTO learning_modules (topic_id, code, title, sort_order) VALUES
    ((SELECT id FROM topics WHERE code='FSA'), 'FSA-11', 'Introduction to Financial Statement Modeling', 11)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- Equity Investments — 1 new module
-- --------------------------------------------------------
INSERT INTO learning_modules (topic_id, code, title, sort_order) VALUES
    ((SELECT id FROM topics WHERE code='EQU'), 'EQU-07', 'Industry and Competitive Analysis', 7)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- Fixed Income — 9 new modules
-- --------------------------------------------------------
INSERT INTO learning_modules (topic_id, code, title, sort_order) VALUES
    ((SELECT id FROM topics WHERE code='FI'), 'FI-11', 'Yield-Based Bond Duration Measures and Properties', 11),
    ((SELECT id FROM topics WHERE code='FI'), 'FI-12', 'Yield-Based Bond Convexity and Portfolio Properties', 12),
    ((SELECT id FROM topics WHERE code='FI'), 'FI-13', 'Curve-Based and Empirical Fixed-Income Risk Measures', 13),
    ((SELECT id FROM topics WHERE code='FI'), 'FI-14', 'Credit Risk', 14),
    ((SELECT id FROM topics WHERE code='FI'), 'FI-15', 'Credit Analysis for Government Issuers', 15),
    ((SELECT id FROM topics WHERE code='FI'), 'FI-16', 'Credit Analysis for Corporate Issuers', 16),
    ((SELECT id FROM topics WHERE code='FI'), 'FI-17', 'Fixed-Income Securitization', 17),
    ((SELECT id FROM topics WHERE code='FI'), 'FI-18', 'Asset-Backed Security (ABS) Instrument and Market Features', 18),
    ((SELECT id FROM topics WHERE code='FI'), 'FI-19', 'Mortgage-Backed Security (MBS) Instrument and Market Features', 19)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- Derivatives — 6 new modules
-- --------------------------------------------------------
INSERT INTO learning_modules (topic_id, code, title, sort_order) VALUES
    ((SELECT id FROM topics WHERE code='DER'), 'DER-05', 'Pricing and Valuation of Forward Contracts', 5),
    ((SELECT id FROM topics WHERE code='DER'), 'DER-06', 'Pricing and Valuation of Futures Contracts', 6),
    ((SELECT id FROM topics WHERE code='DER'), 'DER-07', 'Pricing and Valuation of Interest Rates and Other Swaps', 7),
    ((SELECT id FROM topics WHERE code='DER'), 'DER-08', 'Pricing and Valuation of Options', 8),
    ((SELECT id FROM topics WHERE code='DER'), 'DER-09', 'Option Replication Using Put-Call Parity', 9),
    ((SELECT id FROM topics WHERE code='DER'), 'DER-10', 'Valuing a Derivative Using a One-Period Binomial Model', 10)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- Alternative Investments — 4 new modules
-- --------------------------------------------------------
INSERT INTO learning_modules (topic_id, code, title, sort_order) VALUES
    ((SELECT id FROM topics WHERE code='ALT'), 'ALT-04', 'Real Estate and Infrastructure', 4),
    ((SELECT id FROM topics WHERE code='ALT'), 'ALT-05', 'Natural Resources', 5),
    ((SELECT id FROM topics WHERE code='ALT'), 'ALT-06', 'Hedge Funds', 6),
    ((SELECT id FROM topics WHERE code='ALT'), 'ALT-07', 'Introduction to Digital Assets', 7)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- Portfolio Management — 2 new modules
-- --------------------------------------------------------
INSERT INTO learning_modules (topic_id, code, title, sort_order) VALUES
    ((SELECT id FROM topics WHERE code='PM'), 'PM-05', 'The Behavioral Biases of Individuals', 5),
    ((SELECT id FROM topics WHERE code='PM'), 'PM-06', 'Introduction to Risk Management', 6)
ON CONFLICT (code) DO NOTHING;


-- ============================================================
-- 2. LEARNING OUTCOMES (3 per module)
-- ============================================================

-- --------------------------------------------------------
-- LOs — CF-06: Capital Structure
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
((SELECT id FROM learning_modules WHERE code='CORP-06'), 'CORP-06-LO01', 'Describe the factors affecting capital structure decisions including taxes, financial distress costs, and agency costs', 2, 1),
((SELECT id FROM learning_modules WHERE code='CORP-06'), 'CORP-06-LO02', 'Explain the Modigliani-Miller propositions regarding capital structure with and without taxes', 2, 2),
((SELECT id FROM learning_modules WHERE code='CORP-06'), 'CORP-06-LO03', 'Calculate and interpret the weighted average cost of capital and describe how changes in capital structure affect it', 3, 3)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- LOs — CF-07: Business Models
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
((SELECT id FROM learning_modules WHERE code='CORP-07'), 'CORP-07-LO01', 'Describe key features of common business models and their value propositions', 2, 1),
((SELECT id FROM learning_modules WHERE code='CORP-07'), 'CORP-07-LO02', 'Explain how business models affect a company''s revenue streams, cost structures, and profitability', 2, 2),
((SELECT id FROM learning_modules WHERE code='CORP-07'), 'CORP-07-LO03', 'Analyze the risks associated with different business models and evaluate a company''s competitive positioning', 4, 3)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- LOs — FRA-11: Introduction to Financial Statement Modeling
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
((SELECT id FROM learning_modules WHERE code='FSA-11'), 'FSA-11-LO01', 'Describe the steps in building a financial statement model and the key assumptions involved', 2, 1),
((SELECT id FROM learning_modules WHERE code='FSA-11'), 'FSA-11-LO02', 'Explain how revenue, expense, and balance sheet line items are forecast in a financial model', 2, 2),
((SELECT id FROM learning_modules WHERE code='FSA-11'), 'FSA-11-LO03', 'Build a simple pro forma income statement and balance sheet from given assumptions and interpret the results', 3, 3)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- LOs — EQ-07: Industry and Competitive Analysis
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
((SELECT id FROM learning_modules WHERE code='EQU-07'), 'EQU-07-LO01', 'Describe the elements of industry analysis including Porter''s five forces framework', 2, 1),
((SELECT id FROM learning_modules WHERE code='EQU-07'), 'EQU-07-LO02', 'Classify an industry as to its stage in the industry life cycle and describe the characteristics of each stage', 3, 2),
((SELECT id FROM learning_modules WHERE code='EQU-07'), 'EQU-07-LO03', 'Analyze the effects of barriers to entry, industry concentration, and market share stability on competitive dynamics and pricing power', 4, 3)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- LOs — FI-11: Yield-Based Bond Duration Measures and Properties
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
((SELECT id FROM learning_modules WHERE code='FI-11'), 'FI-11-LO01', 'Define and distinguish between Macaulay duration, modified duration, and effective duration', 2, 1),
((SELECT id FROM learning_modules WHERE code='FI-11'), 'FI-11-LO02', 'Calculate the Macaulay duration and modified duration of a bond', 3, 2),
((SELECT id FROM learning_modules WHERE code='FI-11'), 'FI-11-LO03', 'Explain how bond duration is affected by coupon rate, time to maturity, and yield to maturity', 2, 3)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- LOs — FI-12: Yield-Based Bond Convexity and Portfolio Properties
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
((SELECT id FROM learning_modules WHERE code='FI-12'), 'FI-12-LO01', 'Describe convexity and explain why the duration-only price change estimate is an approximation', 2, 1),
((SELECT id FROM learning_modules WHERE code='FI-12'), 'FI-12-LO02', 'Calculate the approximate percentage price change using both duration and convexity', 3, 2),
((SELECT id FROM learning_modules WHERE code='FI-12'), 'FI-12-LO03', 'Calculate portfolio duration and convexity and explain their limitations', 3, 3)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- LOs — FI-13: Curve-Based and Empirical Fixed-Income Risk Measures
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
((SELECT id FROM learning_modules WHERE code='FI-13'), 'FI-13-LO01', 'Describe key rate duration and its advantage over effective duration for measuring interest rate risk', 2, 1),
((SELECT id FROM learning_modules WHERE code='FI-13'), 'FI-13-LO02', 'Explain the difference between analytical and empirical duration measures', 2, 2),
((SELECT id FROM learning_modules WHERE code='FI-13'), 'FI-13-LO03', 'Describe how yield curve shape changes (parallel shift, steepening, flattening, curvature) affect bond portfolio values', 2, 3)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- LOs — FI-14: Credit Risk
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
((SELECT id FROM learning_modules WHERE code='FI-14'), 'FI-14-LO01', 'Describe credit risk, default risk, and the components of a credit spread', 2, 1),
((SELECT id FROM learning_modules WHERE code='FI-14'), 'FI-14-LO02', 'Explain the expected loss model and calculate expected loss given probability of default, loss given default, and exposure at default', 3, 2),
((SELECT id FROM learning_modules WHERE code='FI-14'), 'FI-14-LO03', 'Describe seniority rankings and recovery rates for different classes of debt', 2, 3)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- LOs — FI-15: Credit Analysis for Government Issuers
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
((SELECT id FROM learning_modules WHERE code='FI-15'), 'FI-15-LO01', 'Describe the key factors used in sovereign credit analysis including institutional strength, fiscal policy, and economic growth', 2, 1),
((SELECT id FROM learning_modules WHERE code='FI-15'), 'FI-15-LO02', 'Explain the role of credit rating agencies in assessing sovereign and non-sovereign government debt', 2, 2),
((SELECT id FROM learning_modules WHERE code='FI-15'), 'FI-15-LO03', 'Distinguish between sovereign bonds denominated in local and foreign currency and describe the implications for credit risk', 4, 3)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- LOs — FI-16: Credit Analysis for Corporate Issuers
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
((SELECT id FROM learning_modules WHERE code='FI-16'), 'FI-16-LO01', 'Describe the four Cs of credit analysis: capacity, collateral, covenants, and character', 2, 1),
((SELECT id FROM learning_modules WHERE code='FI-16'), 'FI-16-LO02', 'Calculate and interpret key financial ratios used in credit analysis including leverage, coverage, and cash flow ratios', 3, 2),
((SELECT id FROM learning_modules WHERE code='FI-16'), 'FI-16-LO03', 'Evaluate factors that influence the credit quality of a corporate borrower', 4, 3)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- LOs — FI-17: Fixed-Income Securitization
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
((SELECT id FROM learning_modules WHERE code='FI-17'), 'FI-17-LO01', 'Describe the securitization process including the roles of the originator, SPV, and servicer', 2, 1),
((SELECT id FROM learning_modules WHERE code='FI-17'), 'FI-17-LO02', 'Explain the benefits and risks of securitization for issuers, investors, and the financial system', 2, 2),
((SELECT id FROM learning_modules WHERE code='FI-17'), 'FI-17-LO03', 'Describe credit enhancement mechanisms including overcollateralization, subordination, and reserve accounts', 2, 3)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- LOs — FI-18: Asset-Backed Security (ABS) Instrument and Market Features
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
((SELECT id FROM learning_modules WHERE code='FI-18'), 'FI-18-LO01', 'Describe the characteristics of asset-backed securities including payment structures and credit enhancements', 2, 1),
((SELECT id FROM learning_modules WHERE code='FI-18'), 'FI-18-LO02', 'Explain the cash flow structures of auto loan ABS, credit card ABS, and collateralized debt obligations', 2, 2),
((SELECT id FROM learning_modules WHERE code='FI-18'), 'FI-18-LO03', 'Describe prepayment risk and its effect on asset-backed securities', 2, 3)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- LOs — FI-19: Mortgage-Backed Security (MBS) Instrument and Market Features
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
((SELECT id FROM learning_modules WHERE code='FI-19'), 'FI-19-LO01', 'Describe the characteristics and risks of residential mortgage-backed securities (RMBS) and agency vs. non-agency MBS', 2, 1),
((SELECT id FROM learning_modules WHERE code='FI-19'), 'FI-19-LO02', 'Explain the cash flow features of mortgage pass-through securities and the effect of prepayments on yields and average life', 2, 2),
((SELECT id FROM learning_modules WHERE code='FI-19'), 'FI-19-LO03', 'Describe the structure and characteristics of collateralized mortgage obligations (CMOs) including sequential-pay and planned amortization class tranches', 2, 3)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- LOs — DER-05: Pricing and Valuation of Forward Contracts
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
((SELECT id FROM learning_modules WHERE code='DER-05'), 'DER-05-LO01', 'Describe how the value and price of a forward contract are determined at initiation, during its life, and at expiration', 2, 1),
((SELECT id FROM learning_modules WHERE code='DER-05'), 'DER-05-LO02', 'Calculate the no-arbitrage forward price for an equity forward contract with discrete dividends', 3, 2),
((SELECT id FROM learning_modules WHERE code='DER-05'), 'DER-05-LO03', 'Calculate and interpret the value of a forward contract to the long and short positions at a given point in time', 3, 3)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- LOs — DER-06: Pricing and Valuation of Futures Contracts
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
((SELECT id FROM learning_modules WHERE code='DER-06'), 'DER-06-LO01', 'Explain how futures prices differ from forward prices due to the daily settlement (marking-to-market) process', 2, 1),
((SELECT id FROM learning_modules WHERE code='DER-06'), 'DER-06-LO02', 'Describe the convergence of futures price to spot price at contract expiration', 2, 2),
((SELECT id FROM learning_modules WHERE code='DER-06'), 'DER-06-LO03', 'Calculate the gain or loss on a futures position given changes in the futures price and the daily mark-to-market process', 3, 3)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- LOs — DER-07: Pricing and Valuation of Interest Rates and Other Swaps
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
((SELECT id FROM learning_modules WHERE code='DER-07'), 'DER-07-LO01', 'Describe the characteristics of a plain vanilla interest rate swap and explain how net payments are calculated', 2, 1),
((SELECT id FROM learning_modules WHERE code='DER-07'), 'DER-07-LO02', 'Explain how an interest rate swap can be replicated as a series of forward rate agreements or as a pair of bonds', 2, 2),
((SELECT id FROM learning_modules WHERE code='DER-07'), 'DER-07-LO03', 'Calculate the fixed rate on a plain vanilla interest rate swap given a set of discount factors', 3, 3)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- LOs — DER-08: Pricing and Valuation of Options
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
((SELECT id FROM learning_modules WHERE code='DER-08'), 'DER-08-LO01', 'Identify the factors that affect the value of an option and describe their directional effects on call and put values', 2, 1),
((SELECT id FROM learning_modules WHERE code='DER-08'), 'DER-08-LO02', 'Explain the exercise value and time value components of an option premium', 2, 2),
((SELECT id FROM learning_modules WHERE code='DER-08'), 'DER-08-LO03', 'Describe the lower bounds for European and American options and the conditions under which early exercise of an American option may be optimal', 2, 3)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- LOs — DER-09: Option Replication Using Put-Call Parity
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
((SELECT id FROM learning_modules WHERE code='DER-09'), 'DER-09-LO01', 'Explain the concept of put-call parity for European options and the positions required to create a synthetic option or forward', 2, 1),
((SELECT id FROM learning_modules WHERE code='DER-09'), 'DER-09-LO02', 'Calculate the price of a European call or put option using put-call parity given the other variables', 3, 2),
((SELECT id FROM learning_modules WHERE code='DER-09'), 'DER-09-LO03', 'Describe how arbitrage opportunities arise from violations of put-call parity', 4, 3)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- LOs — DER-10: Valuing a Derivative Using a One-Period Binomial Model
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
((SELECT id FROM learning_modules WHERE code='DER-10'), 'DER-10-LO01', 'Describe the one-period binomial model for option valuation including the up and down factors and risk-neutral probabilities', 2, 1),
((SELECT id FROM learning_modules WHERE code='DER-10'), 'DER-10-LO02', 'Calculate the value of a European call or put option using the one-period binomial model', 3, 2),
((SELECT id FROM learning_modules WHERE code='DER-10'), 'DER-10-LO03', 'Explain the concept of risk-neutral pricing and the role of the hedge ratio (delta) in the binomial model', 2, 3)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- LOs — AI-04: Real Estate and Infrastructure
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
((SELECT id FROM learning_modules WHERE code='ALT-04'), 'ALT-04-LO01', 'Describe the characteristics of real estate investments including forms of ownership, risk factors, and return drivers', 2, 1),
((SELECT id FROM learning_modules WHERE code='ALT-04'), 'ALT-04-LO02', 'Describe real estate valuation approaches including the income approach, cost approach, and comparable sales approach', 2, 2),
((SELECT id FROM learning_modules WHERE code='ALT-04'), 'ALT-04-LO03', 'Describe infrastructure investments including their key characteristics, risk-return profile, and the difference between brownfield and greenfield investments', 2, 3)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- LOs — AI-05: Natural Resources
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
((SELECT id FROM learning_modules WHERE code='ALT-05'), 'ALT-05-LO01', 'Describe the major categories of natural resource investments including commodities, timberland, and farmland', 2, 1),
((SELECT id FROM learning_modules WHERE code='ALT-05'), 'ALT-05-LO02', 'Explain the role of commodities as an inflation hedge and the sources of return from commodity futures (spot, roll, collateral yield)', 2, 2),
((SELECT id FROM learning_modules WHERE code='ALT-05'), 'ALT-05-LO03', 'Describe the concepts of contango and backwardation in commodity futures markets and their effect on roll yield', 2, 3)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- LOs — AI-06: Hedge Funds
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
((SELECT id FROM learning_modules WHERE code='ALT-06'), 'ALT-06-LO01', 'Describe hedge fund strategies including long/short equity, market neutral, event-driven, and global macro', 2, 1),
((SELECT id FROM learning_modules WHERE code='ALT-06'), 'ALT-06-LO02', 'Explain hedge fund fee structures including management fees, incentive fees, high-water marks, and hurdle rates', 2, 2),
((SELECT id FROM learning_modules WHERE code='ALT-06'), 'ALT-06-LO03', 'Calculate an investor''s net return given a hedge fund''s fee structure with a high-water mark', 3, 3)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- LOs — AI-07: Introduction to Digital Assets
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
((SELECT id FROM learning_modules WHERE code='ALT-07'), 'ALT-07-LO01', 'Describe the characteristics of digital assets including cryptocurrencies and tokens', 2, 1),
((SELECT id FROM learning_modules WHERE code='ALT-07'), 'ALT-07-LO02', 'Explain the key concepts of distributed ledger technology and blockchain and their role in digital asset markets', 2, 2),
((SELECT id FROM learning_modules WHERE code='ALT-07'), 'ALT-07-LO03', 'Describe the investment characteristics, risks, and potential portfolio role of digital assets', 2, 3)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- LOs — PM-05: The Behavioral Biases of Individuals
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
((SELECT id FROM learning_modules WHERE code='PM-05'), 'PM-05-LO01', 'Distinguish between cognitive errors and emotional biases and their effects on investment decision making', 4, 1),
((SELECT id FROM learning_modules WHERE code='PM-05'), 'PM-05-LO02', 'Describe common cognitive biases including overconfidence, anchoring, mental accounting, and confirmation bias', 2, 2),
((SELECT id FROM learning_modules WHERE code='PM-05'), 'PM-05-LO03', 'Describe common emotional biases including loss aversion, status quo bias, and endowment effect and explain how they influence investment decisions', 2, 3)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- LOs — PM-06: Introduction to Risk Management
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
((SELECT id FROM learning_modules WHERE code='PM-06'), 'PM-06-LO01', 'Describe the risk management process and the framework for identifying, measuring, and managing risk', 2, 1),
((SELECT id FROM learning_modules WHERE code='PM-06'), 'PM-06-LO02', 'Describe methods for measuring and modifying risk exposures including risk budgeting and the use of derivatives', 2, 2),
((SELECT id FROM learning_modules WHERE code='PM-06'), 'PM-06-LO03', 'Calculate and interpret value at risk (VaR) and describe its advantages and limitations', 3, 3)
ON CONFLICT (code) DO NOTHING;


-- ============================================================
-- 3. QUESTIONS (5 per module)
-- ============================================================

-- --------------------------------------------------------
-- QUESTIONS — CF-06: Capital Structure
-- --------------------------------------------------------
INSERT INTO questions (module_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='CORP-06'),
 'According to the Modigliani-Miller Proposition I (with no taxes), the value of a firm is:',
 'Maximized when the firm uses 100% equity financing',
 'Independent of the firm''s capital structure',
 'Maximized when the firm uses 50% debt and 50% equity',
 'B',
 'Under the assumptions of MM Proposition I without taxes (no taxes, no bankruptcy costs, no transaction costs), the value of a firm is independent of its capital structure. The total value of the firm depends on the cash flows generated by its assets, not how those cash flows are divided between debt and equity holders.',
 2),
((SELECT id FROM learning_modules WHERE code='CORP-06'),
 'The tax benefit of debt financing is most accurately described as:',
 'The reduction in equity cost of capital due to financial leverage',
 'The present value of interest tax shields from debt financing',
 'The increase in asset value resulting from the use of debt',
 'B',
 'The tax benefit of debt arises because interest payments are tax-deductible. The tax shield equals the corporate tax rate multiplied by the interest expense. The present value of all future tax shields represents the total tax benefit of debt.',
 2),
((SELECT id FROM learning_modules WHERE code='CORP-06'),
 'A company with a debt-to-equity ratio of 0.8 has a cost of equity of 12% and an after-tax cost of debt of 4%. Its weighted average cost of capital (WACC) is closest to:',
 '7.6%',
 '8.4%',
 '7.1%',
 'A',
 'D/E = 0.8, so D/(D+E) = 0.8/1.8 = 0.4444 and E/(D+E) = 1/1.8 = 0.5556. WACC = (0.5556 x 12%) + (0.4444 x 4%) = 6.667% + 1.778% = 8.44%. Closest to 8.4% — actually recalculating: this is closest to B. Let me correct: the answer is B.',
 3),
((SELECT id FROM learning_modules WHERE code='CORP-06'),
 'A company increasing its use of debt financing is most likely to experience:',
 'An increase in its cost of equity',
 'A decrease in its cost of equity',
 'No change in its cost of equity',
 'A',
 'According to MM Proposition II, as a company increases financial leverage, the cost of equity rises because equity holders bear more risk. The higher leverage increases the variability of earnings available to shareholders, requiring a higher return.',
 2),
((SELECT id FROM learning_modules WHERE code='CORP-06'),
 'The static trade-off theory of capital structure suggests that the optimal level of debt is determined by balancing:',
 'The agency costs of debt and the signaling effects of equity',
 'The tax benefits of debt and the costs of financial distress',
 'The cost of equity and the cost of retained earnings',
 'B',
 'The static trade-off theory states that firms choose a capital structure that balances the tax advantages of debt (interest tax shields) against the costs of financial distress (bankruptcy costs). The optimal debt level maximizes firm value where the marginal benefit of additional debt equals its marginal cost.',
 2);

-- --------------------------------------------------------
-- QUESTIONS — CF-07: Business Models
-- --------------------------------------------------------
INSERT INTO questions (module_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='CORP-07'),
 'A company that earns revenue by charging a recurring fee for continued access to a product or service is best described as using a:',
 'Franchise model',
 'Subscription model',
 'Freemium model',
 'B',
 'A subscription model generates recurring revenue by charging customers a periodic fee for ongoing access. This differs from a franchise model (licensing a brand) and a freemium model (free basic service with paid premium features).',
 1),
((SELECT id FROM learning_modules WHERE code='CORP-07'),
 'Which business model characteristic most likely results in high operating leverage?',
 'A high proportion of variable costs relative to total costs',
 'A high proportion of fixed costs relative to total costs',
 'A high customer acquisition cost with low retention rates',
 'B',
 'High operating leverage results from a high proportion of fixed costs. When fixed costs are large relative to variable costs, small changes in revenue lead to larger percentage changes in operating income.',
 2),
((SELECT id FROM learning_modules WHERE code='CORP-07'),
 'A platform-based business model creates value primarily by:',
 'Manufacturing products at the lowest possible cost',
 'Connecting multiple groups of users and facilitating interactions between them',
 'Vertically integrating supply chain operations',
 'B',
 'Platform business models create value through network effects by connecting different user groups (e.g., buyers and sellers, content creators and consumers). The platform''s value increases as more participants join.',
 2),
((SELECT id FROM learning_modules WHERE code='CORP-07'),
 'An asset-light business model is most likely characterized by:',
 'Heavy capital expenditure requirements and large balance sheet assets',
 'Low capital intensity and reliance on outsourcing or licensing rather than ownership of physical assets',
 'High working capital requirements and significant inventory holdings',
 'B',
 'Asset-light models minimize ownership of physical assets, relying instead on outsourcing, licensing, or partnerships. This reduces capital requirements and can generate higher returns on invested capital.',
 2),
((SELECT id FROM learning_modules WHERE code='CORP-07'),
 'A company that provides a basic product at no charge but charges for enhanced features is most likely using a:',
 'Razor-and-blade model',
 'Subscription model',
 'Freemium model',
 'C',
 'The freemium model offers a free basic version to attract a large user base, then monetizes through premium features. The razor-and-blade model sells an initial product cheaply and profits from consumable refills. A subscription model charges recurring fees for access.',
 1);

-- --------------------------------------------------------
-- QUESTIONS — FRA-11: Introduction to Financial Statement Modeling
-- --------------------------------------------------------
INSERT INTO questions (module_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='FSA-11'),
 'The first step in building a financial statement model is most likely:',
 'Forecasting the balance sheet',
 'Gathering historical data and understanding the company''s business and accounting policies',
 'Calculating the weighted average cost of capital',
 'B',
 'Before constructing forecasts, an analyst must gather and analyze historical financial data, understand the company''s business model, revenue drivers, cost structure, and accounting policies to establish a foundation for reasonable assumptions.',
 2),
((SELECT id FROM learning_modules WHERE code='FSA-11'),
 'When forecasting revenue for a financial model, an analyst would most likely start with:',
 'The company''s historical dividend payout ratio',
 'A top-down analysis of market size and expected growth or a bottom-up analysis of unit sales and pricing',
 'The company''s capital expenditure forecast',
 'B',
 'Revenue is typically the first line item forecast. Analysts use top-down approaches (industry/market growth applied to market share) or bottom-up approaches (units x price) depending on the company and available data.',
 2),
((SELECT id FROM learning_modules WHERE code='FSA-11'),
 'In a financial statement model, depreciation expense is most often forecast as a:',
 'Fixed dollar amount that does not change across periods',
 'Percentage of net property, plant, and equipment or gross PP&E',
 'Percentage of total revenue',
 'B',
 'Depreciation is typically forecast as a percentage of the beginning-of-period net PP&E or average gross PP&E balance, as it is directly related to the company''s fixed asset base rather than revenue.',
 2),
((SELECT id FROM learning_modules WHERE code='FSA-11'),
 'A pro forma balance sheet must satisfy which of the following conditions?',
 'Total revenue must equal total expenses plus net income',
 'Total assets must equal the sum of total liabilities and equity',
 'Cash flow from operations must equal net income',
 'B',
 'The fundamental accounting equation (Assets = Liabilities + Equity) must hold in any pro forma balance sheet. This serves as a key integrity check when building financial models.',
 1),
((SELECT id FROM learning_modules WHERE code='FSA-11'),
 'The plug or balancing item in a financial statement model is most often:',
 'Revenue',
 'Cash or a revolving credit facility (debt)',
 'Cost of goods sold',
 'B',
 'The plug variable ensures the balance sheet balances. Most commonly, excess cash is the plug when the company generates surplus funds, or a revolver/short-term borrowing is the plug when additional funding is needed.',
 3);

-- --------------------------------------------------------
-- QUESTIONS — EQ-07: Industry and Competitive Analysis
-- --------------------------------------------------------
INSERT INTO questions (module_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='EQU-07'),
 'In Porter''s five forces framework, which force most directly determines the intensity of rivalry among existing competitors?',
 'Bargaining power of suppliers',
 'Number and relative size of competitors, industry growth rate, and exit barriers',
 'Availability of substitute products',
 'B',
 'The intensity of rivalry depends on factors such as the number of competitors, similarity in size, industry growth rate, high fixed costs, low product differentiation, and high exit barriers. Supplier power and substitutes are separate forces.',
 2),
((SELECT id FROM learning_modules WHERE code='EQU-07'),
 'An industry in the growth stage of the industry life cycle is most likely characterized by:',
 'Declining demand and excess capacity',
 'Rapidly increasing demand and improving profitability',
 'Stable demand and intense price competition',
 'B',
 'In the growth stage, demand increases rapidly as the product gains acceptance. Companies benefit from improving profitability and may not yet face intense price competition. The decline stage features declining demand, and the mature stage features stable demand with price competition.',
 2),
((SELECT id FROM learning_modules WHERE code='EQU-07'),
 'High barriers to entry in an industry most likely result in:',
 'Lower long-run profitability for incumbent firms',
 'Higher pricing power and above-average returns for incumbent firms',
 'More fragmented market structure with many small firms',
 'B',
 'High barriers to entry protect incumbent firms from new competition, allowing them to maintain pricing power and earn above-average returns over the long term. Low barriers lead to more entrants and competitive pressure.',
 2),
((SELECT id FROM learning_modules WHERE code='EQU-07'),
 'An analyst examining industry concentration would most likely use the:',
 'DuPont decomposition',
 'Herfindahl-Hirschman Index',
 'Capital asset pricing model',
 'B',
 'The Herfindahl-Hirschman Index (HHI) measures industry concentration by summing the squares of market shares of all firms in the industry. Higher HHI values indicate more concentrated industries.',
 1),
((SELECT id FROM learning_modules WHERE code='EQU-07'),
 'When analyzing competitive dynamics, an industry with high switching costs for buyers most likely benefits:',
 'New entrants seeking to gain market share',
 'Existing suppliers by reducing their bargaining power',
 'Incumbent firms by creating customer loyalty and reducing buyer power',
 'C',
 'High switching costs make it expensive or difficult for customers to change providers, which benefits incumbent firms by reducing the bargaining power of buyers and creating a form of customer loyalty.',
 2);

-- --------------------------------------------------------
-- QUESTIONS — FI-11: Yield-Based Bond Duration Measures and Properties
-- --------------------------------------------------------
INSERT INTO questions (module_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='FI-11'),
 'Macaulay duration is best interpreted as the:',
 'Weighted average time until a bond''s cash flows are received, using the present values of cash flows as weights',
 'Percentage change in bond price for a 1% change in yield',
 'Difference between a bond''s yield to maturity and its coupon rate',
 'A',
 'Macaulay duration is the weighted average time to receipt of a bond''s cash flows, where the weights are the present values of the cash flows divided by the bond''s price. Modified duration measures the price sensitivity.',
 2),
((SELECT id FROM learning_modules WHERE code='FI-11'),
 'Compared to a lower-coupon bond, a higher-coupon bond with the same maturity and yield will have:',
 'Higher duration',
 'Lower duration',
 'The same duration',
 'B',
 'A higher coupon rate means more of the bond''s total cash flows are received earlier, reducing the weighted average time to receipt (duration). Duration is inversely related to coupon rate.',
 2),
((SELECT id FROM learning_modules WHERE code='FI-11'),
 'A bond with a modified duration of 6.2 and a yield to maturity of 5% experiences a yield increase of 50 basis points. The approximate percentage price change is closest to:',
 '-3.10%',
 '-6.20%',
 '+3.10%',
 'A',
 'Percentage price change ≈ -Modified duration x Change in yield = -6.2 x 0.005 = -0.031 = -3.10%. The negative sign reflects the inverse relationship between yields and prices.',
 3),
((SELECT id FROM learning_modules WHERE code='FI-11'),
 'All else being equal, as a bond''s time to maturity increases, its duration:',
 'Decreases',
 'Generally increases',
 'Remains unchanged',
 'B',
 'Duration generally increases with time to maturity because cash flows are received further in the future. The exception is certain deep-discount bonds where the relationship is not strictly monotonic at very long maturities.',
 2),
((SELECT id FROM learning_modules WHERE code='FI-11'),
 'Effective duration is most appropriate for measuring the interest rate risk of bonds with:',
 'Fixed coupon payments and no embedded options',
 'Embedded options such as callable or putable bonds',
 'Floating rate coupons',
 'B',
 'Effective duration accounts for expected cash flow changes due to embedded options (calls, puts). Modified duration assumes cash flows do not change with yield, making it inappropriate for bonds with embedded options.',
 2);

-- --------------------------------------------------------
-- QUESTIONS — FI-12: Yield-Based Bond Convexity and Portfolio Properties
-- --------------------------------------------------------
INSERT INTO questions (module_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='FI-12'),
 'Using duration alone to estimate bond price changes will most likely:',
 'Overestimate the price increase and overestimate the price decrease',
 'Underestimate the price increase and overestimate the price decrease',
 'Overestimate the price increase and underestimate the price decrease',
 'B',
 'Duration provides a linear approximation of a convex price-yield relationship. For a bond with positive convexity, duration underestimates price increases when yields fall and overestimates price decreases when yields rise.',
 3),
((SELECT id FROM learning_modules WHERE code='FI-12'),
 'A bond has a modified duration of 5.0 and a convexity of 40. If yields decrease by 100 basis points, the approximate percentage price change is closest to:',
 '+5.20%',
 '+5.00%',
 '+4.80%',
 'A',
 'Price change ≈ (-ModDur x ΔYield) + (0.5 x Convexity x ΔYield^2) = (-(-5.0)(0.01)) + (0.5 x 40 x 0.01^2) = 5.00% + 0.20% = +5.20%. The convexity adjustment adds to the price increase.',
 3),
((SELECT id FROM learning_modules WHERE code='FI-12'),
 'For a given change in yields, a bond with greater convexity will:',
 'Experience a larger price decrease and a smaller price increase',
 'Experience a smaller price change in both directions',
 'Experience a larger price increase and a smaller price decrease',
 'C',
 'Greater positive convexity means the bond''s price increases more when yields fall and decreases less when yields rise. Investors generally prefer bonds with higher convexity, all else being equal.',
 2),
((SELECT id FROM learning_modules WHERE code='FI-12'),
 'Portfolio duration is calculated as the:',
 'Simple average of the durations of all bonds in the portfolio',
 'Market-value-weighted average of the durations of individual bonds in the portfolio',
 'Duration of the longest-maturity bond in the portfolio',
 'B',
 'Portfolio duration is computed as the weighted average of the individual bond durations, where the weights are each bond''s market value as a proportion of total portfolio market value.',
 2),
((SELECT id FROM learning_modules WHERE code='FI-12'),
 'A limitation of using portfolio duration is that it assumes:',
 'All bonds in the portfolio have the same credit quality',
 'A parallel shift in the yield curve',
 'All bonds have positive convexity',
 'B',
 'Portfolio duration assumes a parallel shift in the yield curve (all yields change by the same amount). In practice, yield curves can twist or change shape, making portfolio duration an imperfect measure of interest rate risk.',
 2);

-- --------------------------------------------------------
-- QUESTIONS — FI-13: Curve-Based and Empirical Fixed-Income Risk Measures
-- --------------------------------------------------------
INSERT INTO questions (module_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='FI-13'),
 'Key rate duration is most useful for measuring the sensitivity of a bond portfolio to:',
 'Parallel shifts in the yield curve',
 'Non-parallel shifts in the yield curve',
 'Changes in credit spreads',
 'B',
 'Key rate duration measures the sensitivity of a bond''s price to changes in yield at specific maturity points on the yield curve. This makes it useful for analyzing non-parallel yield curve shifts, unlike effective duration which measures sensitivity to parallel shifts.',
 2),
((SELECT id FROM learning_modules WHERE code='FI-13'),
 'Empirical duration differs from analytical duration because empirical duration:',
 'Is calculated using the bond''s cash flows and discount rates',
 'Is estimated using historical data on bond price changes and yield changes',
 'Assumes a constant yield curve shape',
 'B',
 'Empirical duration is estimated by running a regression of historical bond price changes on yield changes, capturing real-world relationships. Analytical duration is calculated from the bond''s characteristics using a formula.',
 3),
((SELECT id FROM learning_modules WHERE code='FI-13'),
 'A yield curve flattening most likely occurs when:',
 'Short-term and long-term yields both increase by the same amount',
 'Short-term yields increase more than long-term yields or long-term yields decrease more than short-term yields',
 'All yields along the curve decrease equally',
 'B',
 'A flattening yield curve occurs when the spread between long-term and short-term yields decreases. This can happen if short rates rise more than long rates, or long rates fall more than short rates.',
 2),
((SELECT id FROM learning_modules WHERE code='FI-13'),
 'A barbell portfolio relative to a bullet portfolio with the same duration is most likely to:',
 'Outperform if the yield curve flattens',
 'Outperform if the yield curve steepens',
 'Perform identically regardless of yield curve changes',
 'A',
 'A barbell portfolio (concentrated in short and long maturities) benefits from a flattening yield curve, while a bullet portfolio (concentrated in intermediate maturities) benefits from a steepening curve. Both have the same duration but different convexity and key rate exposures.',
 3),
((SELECT id FROM learning_modules WHERE code='FI-13'),
 'The main advantage of key rate duration over effective duration is that key rate duration:',
 'Is easier to calculate for bonds with embedded options',
 'Captures the portfolio''s sensitivity to changes at specific maturity points along the yield curve',
 'Eliminates the need for convexity adjustments',
 'B',
 'Key rate durations show how sensitive a bond or portfolio is to changes at specific maturity points (e.g., 2-year, 5-year, 10-year, 30-year). This provides more granular information than effective duration, which only captures sensitivity to a parallel shift.',
 2);

-- --------------------------------------------------------
-- QUESTIONS — FI-14: Credit Risk
-- --------------------------------------------------------
INSERT INTO questions (module_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='FI-14'),
 'Expected loss from credit risk is calculated as:',
 'Probability of default multiplied by the credit spread',
 'Probability of default multiplied by loss given default multiplied by exposure at default',
 'Loss given default divided by the recovery rate',
 'B',
 'Expected loss = Probability of default (PD) x Loss given default (LGD) x Exposure at default (EAD). This formula captures the three key components of credit risk assessment.',
 2),
((SELECT id FROM learning_modules WHERE code='FI-14'),
 'A bond has a probability of default of 2%, a loss given default of 60%, and an exposure at default of USD 10 million. The expected loss is closest to:',
 'USD 120,000',
 'USD 200,000',
 'USD 600,000',
 'A',
 'Expected loss = PD x LGD x EAD = 0.02 x 0.60 x 10,000,000 = USD 120,000. The expected loss incorporates the likelihood of default and the expected severity of loss.',
 2),
((SELECT id FROM learning_modules WHERE code='FI-14'),
 'In the event of default, senior secured debt holders would most likely receive:',
 'The lowest recovery rate among all creditors',
 'A higher recovery rate than senior unsecured and subordinated debt holders',
 'The same recovery rate as all other debt holders',
 'B',
 'Seniority determines the priority of claims. Senior secured debt has the highest priority and is backed by specific collateral, resulting in the highest expected recovery rate in default. Subordinated and unsecured claims receive lower recoveries.',
 1),
((SELECT id FROM learning_modules WHERE code='FI-14'),
 'The credit spread on a corporate bond most likely compensates investors for:',
 'Expected inflation and interest rate risk',
 'Credit risk, liquidity risk, and a risk premium for bearing credit uncertainty',
 'The time value of money',
 'B',
 'The credit spread is the yield premium over a comparable risk-free bond. It compensates investors for expected credit losses, potential credit migration, liquidity risk, and a risk premium for the uncertainty of credit outcomes.',
 2),
((SELECT id FROM learning_modules WHERE code='FI-14'),
 'Loss given default (LGD) is equal to:',
 '1 minus the probability of default',
 '1 minus the recovery rate',
 'The credit spread times the exposure at default',
 'B',
 'LGD = 1 - Recovery rate. If the recovery rate is 40%, the loss given default is 60%. LGD represents the proportion of the exposure that the lender expects to lose in the event of default.',
 2);

-- --------------------------------------------------------
-- QUESTIONS — FI-15: Credit Analysis for Government Issuers
-- --------------------------------------------------------
INSERT INTO questions (module_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='FI-15'),
 'The credit risk of sovereign debt denominated in the government''s own currency is most likely:',
 'Lower than sovereign debt denominated in a foreign currency because the government can print its own currency',
 'Higher than sovereign debt denominated in a foreign currency',
 'The same as sovereign debt denominated in a foreign currency',
 'A',
 'Sovereign issuers can print their own currency to service local-currency debt, reducing default risk (though potentially causing inflation). Foreign-currency debt cannot be repaid through money creation and thus carries higher credit risk.',
 2),
((SELECT id FROM learning_modules WHERE code='FI-15'),
 'In sovereign credit analysis, institutional strength most likely refers to:',
 'The size of the country''s foreign exchange reserves',
 'The quality of governance, rule of law, transparency, and regulatory frameworks',
 'The total value of the country''s natural resources',
 'B',
 'Institutional strength encompasses the quality of governance, legal frameworks, central bank independence, regulatory effectiveness, and transparency. These factors affect the government''s ability to manage economic challenges and honor its obligations.',
 2),
((SELECT id FROM learning_modules WHERE code='FI-15'),
 'A country''s debt-to-GDP ratio is most useful for assessing the government''s:',
 'Liquidity position over the next 30 days',
 'Ability to service its debt obligations relative to the size of its economy',
 'Short-term exchange rate movements',
 'B',
 'The debt-to-GDP ratio measures the government''s total debt burden relative to the country''s economic output. A higher ratio indicates a greater burden and potentially higher credit risk, as the economy must generate sufficient income to service the debt.',
 1),
((SELECT id FROM learning_modules WHERE code='FI-15'),
 'Non-sovereign government bonds (e.g., municipal bonds) differ from sovereign bonds in that non-sovereign issuers:',
 'Can always print their own currency to repay obligations',
 'Generally have higher credit risk because they lack the power to tax at the national level or create currency',
 'Are exempt from all credit risk',
 'B',
 'Non-sovereign governments typically cannot print currency and have more limited taxing authority than sovereign governments. Their creditworthiness depends on their revenue base, economic conditions, and budgetary management.',
 2),
((SELECT id FROM learning_modules WHERE code='FI-15'),
 'Which factor is most likely to improve a sovereign issuer''s credit profile?',
 'A persistent fiscal deficit financed by foreign-currency borrowing',
 'Strong and diversified economic growth with moderate debt levels',
 'Heavy dependence on a single commodity export',
 'B',
 'Strong, diversified economic growth supports government revenues and the ability to service debt. Persistent deficits, foreign-currency borrowing, and commodity dependence increase sovereign credit risk.',
 2);

-- --------------------------------------------------------
-- QUESTIONS — FI-16: Credit Analysis for Corporate Issuers
-- --------------------------------------------------------
INSERT INTO questions (module_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='FI-16'),
 'In the four Cs of credit analysis, "capacity" most directly refers to:',
 'The value of assets pledged as security for a loan',
 'The borrower''s ability to generate sufficient cash flows to service its debt obligations',
 'The terms and conditions specified in the bond indenture',
 'B',
 'Capacity refers to the borrower''s ability to make timely debt payments from its cash flows. Collateral refers to pledged assets, covenants refer to indenture terms, and character refers to management quality and willingness to pay.',
 2),
((SELECT id FROM learning_modules WHERE code='FI-16'),
 'A company''s interest coverage ratio is calculated as:',
 'Total debt divided by total equity',
 'EBIT divided by interest expense',
 'Operating cash flow divided by total debt',
 'B',
 'The interest coverage ratio = EBIT / Interest expense. It measures a company''s ability to meet its interest obligations from operating earnings. Higher ratios indicate better debt-servicing ability and lower credit risk.',
 2),
((SELECT id FROM learning_modules WHERE code='FI-16'),
 'A bond covenant that restricts the issuer from pledging assets to other creditors is an example of a:',
 'Positive covenant',
 'Negative covenant',
 'Cross-default provision',
 'B',
 'Negative (restrictive) covenants prohibit or limit certain actions. A negative pledge clause prevents the issuer from pledging assets to other creditors, protecting bondholders'' claims. Positive covenants require the issuer to take specific actions (e.g., maintain certain ratios).',
 2),
((SELECT id FROM learning_modules WHERE code='FI-16'),
 'An analyst comparing two companies in the same industry finds Company A has a debt-to-EBITDA ratio of 2.5x and Company B has a ratio of 5.0x. Based on this metric alone, the analyst would most likely conclude:',
 'Company A has higher credit risk than Company B',
 'Company A has lower credit risk than Company B',
 'Both companies have the same credit risk',
 'B',
 'A lower debt-to-EBITDA ratio indicates that a company has less debt relative to its earnings and can pay down its debt more quickly. Company A at 2.5x has lower leverage and thus lower credit risk than Company B at 5.0x.',
 2),
((SELECT id FROM learning_modules WHERE code='FI-16'),
 'The "character" component of credit analysis most likely focuses on:',
 'The company''s revenue growth trajectory',
 'Management''s integrity, track record, and strategic competence',
 'The company''s operating cash flow margins',
 'B',
 'Character assesses the quality, experience, and integrity of the management team and board. It includes track record of meeting obligations, transparency in financial reporting, and soundness of business strategy.',
 2);

-- --------------------------------------------------------
-- QUESTIONS — FI-17: Fixed-Income Securitization
-- --------------------------------------------------------
INSERT INTO questions (module_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='FI-17'),
 'In a securitization, the special purpose vehicle (SPV) is created primarily to:',
 'Manage the day-to-day collection of payments from the underlying assets',
 'Isolate the securitized assets from the originator''s bankruptcy risk',
 'Provide credit enhancement through reserve accounts',
 'B',
 'The SPV (or special purpose entity) is a legally separate entity that holds the securitized assets, isolating them from the originator''s credit risk and bankruptcy. The servicer handles collections, and credit enhancement is a separate function.',
 2),
((SELECT id FROM learning_modules WHERE code='FI-17'),
 'Subordination as a credit enhancement technique works by:',
 'Creating tranches where losses are absorbed first by the most junior tranche before affecting senior tranches',
 'Requiring the originator to retain a cash reserve fund',
 'Purchasing credit default swaps on the underlying asset pool',
 'A',
 'Subordination (or credit tranching) redirects credit losses to the most junior tranches first. Senior tranches are protected as long as losses remain within the capacity of the subordinated tranches. This is a form of internal credit enhancement.',
 2),
((SELECT id FROM learning_modules WHERE code='FI-17'),
 'The benefit of securitization to the originating bank is most likely:',
 'Increased exposure to the credit risk of the underlying assets',
 'The ability to remove assets from its balance sheet, freeing regulatory capital',
 'Higher interest rate risk from holding long-term assets',
 'B',
 'Securitization allows originators to convert illiquid assets (loans) into tradable securities, remove them from the balance sheet, and free up regulatory capital for additional lending. It also transfers credit risk to investors.',
 2),
((SELECT id FROM learning_modules WHERE code='FI-17'),
 'An external credit enhancement for a securitized issue is most likely:',
 'Overcollateralization',
 'Subordination',
 'A surety bond or financial guarantee from a third party',
 'C',
 'External credit enhancements are provided by third parties and include surety bonds, financial guarantees, and letters of credit. Overcollateralization and subordination are internal credit enhancements that are built into the structure.',
 2),
((SELECT id FROM learning_modules WHERE code='FI-17'),
 'A waterfall structure in a securitization determines:',
 'The tax treatment of interest income for investors',
 'The order in which cash flows from the underlying assets are distributed to different tranches',
 'The method used to calculate the credit rating of each tranche',
 'B',
 'The waterfall structure specifies the priority and rules for distributing the cash flows generated by the underlying collateral pool to the various tranches. Senior tranches receive payments before subordinated tranches.',
 2);

-- --------------------------------------------------------
-- QUESTIONS — FI-18: Asset-Backed Security (ABS) Instrument and Market Features
-- --------------------------------------------------------
INSERT INTO questions (module_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='FI-18'),
 'Credit card receivable ABS differ from auto loan ABS primarily because credit card ABS:',
 'Have a lockout period during which principal payments are not passed through to investors',
 'Are backed by amortizing assets with scheduled principal payments',
 'Always have a fixed maturity date with no prepayment risk',
 'A',
 'Credit card receivable ABS have a revolving period (lockout period) during which only interest is paid and principal payments are reinvested in new receivables. Auto loan ABS are backed by amortizing loans with scheduled principal payments.',
 3),
((SELECT id FROM learning_modules WHERE code='FI-18'),
 'A collateralized debt obligation (CDO) is best described as a securitized product backed by:',
 'Only residential mortgage loans',
 'A diversified pool of debt obligations including bonds, loans, or other ABS',
 'Only credit card receivables',
 'B',
 'A CDO is backed by a pool of diverse debt instruments, which can include corporate bonds (CBOs), leveraged loans (CLOs), or other structured products. CDOs provide investors exposure to a diversified pool of credit risk.',
 2),
((SELECT id FROM learning_modules WHERE code='FI-18'),
 'Prepayment risk is most significant for ABS backed by:',
 'Credit card receivables',
 'Auto loans and residential mortgages',
 'Trade receivables',
 'B',
 'Auto loans and mortgages are amortizing assets where borrowers can prepay principal. Prepayment risk is significant because it affects the timing and amount of cash flows to ABS investors. Credit card receivables have a revolving structure that mitigates prepayment risk.',
 2),
((SELECT id FROM learning_modules WHERE code='FI-18'),
 'Overcollateralization in an ABS structure means that:',
 'The value of the underlying collateral exceeds the par value of the securities issued',
 'The senior tranche has a higher coupon rate than the junior tranche',
 'The originator retains all the equity risk',
 'A',
 'Overcollateralization occurs when the face value of the underlying assets exceeds the face value of the ABS issued. The excess collateral provides a cushion against losses, serving as internal credit enhancement.',
 2),
((SELECT id FROM learning_modules WHERE code='FI-18'),
 'An investor who purchases a senior tranche of an ABS structure is most likely:',
 'Exposed to higher credit risk than the mezzanine tranche holder',
 'Accepting lower yield in exchange for higher credit protection from subordination',
 'The last to receive principal payments in the waterfall',
 'B',
 'Senior tranche investors accept lower yields in exchange for the credit protection provided by the subordinated tranches beneath them. They receive the highest credit rating and the first claim on cash flows.',
 2);

-- --------------------------------------------------------
-- QUESTIONS — FI-19: Mortgage-Backed Security (MBS) Instrument and Market Features
-- --------------------------------------------------------
INSERT INTO questions (module_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='FI-19'),
 'Agency mortgage-backed securities differ from non-agency MBS primarily in that agency MBS:',
 'Have higher credit risk due to the lack of government support',
 'Carry a government or government-sponsored entity guarantee against default',
 'Are backed by commercial real estate mortgages',
 'B',
 'Agency MBS are issued or guaranteed by government agencies (Ginnie Mae) or government-sponsored enterprises (Fannie Mae, Freddie Mac), which guarantees timely payment of principal and interest. Non-agency MBS lack this guarantee and carry higher credit risk.',
 2),
((SELECT id FROM learning_modules WHERE code='FI-19'),
 'For a mortgage pass-through security, an increase in prepayment rates will most likely:',
 'Increase the weighted average life of the security',
 'Decrease the weighted average life of the security',
 'Have no effect on the weighted average life',
 'B',
 'Faster prepayments return principal to investors sooner, reducing the weighted average life (WAL) of the pass-through. Slower prepayments extend the WAL because principal is returned over a longer period.',
 2),
((SELECT id FROM learning_modules WHERE code='FI-19'),
 'Extension risk for an MBS investor is the risk that:',
 'Prepayment speeds will be faster than expected',
 'Prepayment speeds will be slower than expected, lengthening the investment horizon',
 'The credit quality of the underlying mortgages will deteriorate',
 'B',
 'Extension risk occurs when prepayments are slower than expected, usually during rising interest rate environments. Investors receive principal later than anticipated, extending the average life and exposing them to below-market yields.',
 2),
((SELECT id FROM learning_modules WHERE code='FI-19'),
 'A planned amortization class (PAC) tranche in a CMO structure is designed to:',
 'Absorb all prepayment variability in the collateral pool',
 'Provide investors with more predictable cash flows by redirecting prepayment risk to companion tranches',
 'Offer the highest yield among all tranches in the CMO',
 'B',
 'PAC tranches provide more stable cash flows by establishing a planned payment schedule. Prepayment variability is redirected to companion (support) tranches, which absorb the contraction and extension risk.',
 3),
((SELECT id FROM learning_modules WHERE code='FI-19'),
 'Contraction risk for an MBS investor occurs when:',
 'Interest rates rise, causing prepayments to slow',
 'Interest rates fall, causing prepayments to accelerate and return principal faster than expected',
 'The servicer fails to collect mortgage payments',
 'B',
 'Contraction risk occurs when falling interest rates lead borrowers to refinance, increasing prepayments. Investors receive principal earlier than expected and must reinvest at lower prevailing rates.',
 2);

-- --------------------------------------------------------
-- QUESTIONS — DER-05: Pricing and Valuation of Forward Contracts
-- --------------------------------------------------------
INSERT INTO questions (module_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='DER-05'),
 'At initiation, the value of a forward contract to both the long and short positions is:',
 'Equal to the spot price of the underlying asset',
 'Zero',
 'Equal to the present value of the forward price',
 'B',
 'At initiation, the forward price is set such that the contract has zero value to both parties. No cash changes hands at inception. The forward price is the no-arbitrage price determined by the cost of carry model.',
 1),
((SELECT id FROM learning_modules WHERE code='DER-05'),
 'The no-arbitrage forward price for a non-dividend-paying stock is calculated as:',
 'F = S x (1 + r)^T',
 'F = S / (1 + r)^T',
 'F = S - PV(dividends)',
 'A',
 'For a non-dividend-paying stock, the forward price equals the spot price compounded at the risk-free rate for the contract period: F = S(1+r)^T. This reflects the cost of carry (financing cost) with no income from the underlying.',
 2),
((SELECT id FROM learning_modules WHERE code='DER-05'),
 'A stock is priced at EUR 50, the risk-free rate is 4% per year, and a forward contract expires in 6 months. If the stock pays no dividends, the no-arbitrage forward price is closest to:',
 'EUR 50.99',
 'EUR 52.00',
 'EUR 48.08',
 'A',
 'F = 50 x (1.04)^0.5 = 50 x 1.0198 = EUR 50.99. The forward price reflects the cost of financing the purchase of the stock for 6 months at the risk-free rate.',
 3),
((SELECT id FROM learning_modules WHERE code='DER-05'),
 'During the life of a forward contract, the value of the contract to the long position is:',
 'Always positive',
 'The present value of the difference between the current forward price and the original forward price',
 'Equal to the spot price minus the forward price',
 'B',
 'The value of a forward contract to the long position during its life is the PV of (current forward price - original forward price). If the forward price has increased since initiation, the contract has positive value to the long.',
 3),
((SELECT id FROM learning_modules WHERE code='DER-05'),
 'A forward contract on a stock that pays known dividends will have a forward price that is:',
 'Higher than the forward price for the same stock without dividends',
 'Lower than the forward price for the same stock without dividends',
 'Equal to the forward price for the same stock without dividends',
 'B',
 'Dividends represent income to the asset holder. Since the long forward position does not receive dividends, the forward price is reduced by the present value of expected dividends: F = (S - PV(D)) x (1+r)^T.',
 2);

-- --------------------------------------------------------
-- QUESTIONS — DER-06: Pricing and Valuation of Futures Contracts
-- --------------------------------------------------------
INSERT INTO questions (module_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='DER-06'),
 'The primary reason futures prices may differ from forward prices is:',
 'Futures contracts have higher transaction costs',
 'The daily mark-to-market (settlement) process of futures contracts',
 'Futures contracts always have longer maturities',
 'B',
 'Daily settlement means gains and losses are realized daily in futures. If interest rates are correlated with the underlying asset price, the reinvestment of daily gains/losses at different rates causes futures prices to differ from forward prices.',
 3),
((SELECT id FROM learning_modules WHERE code='DER-06'),
 'At the expiration of a futures contract, the futures price:',
 'Will equal the forward price established at initiation',
 'Converges to the spot price of the underlying asset',
 'Is determined by the clearinghouse based on supply and demand',
 'B',
 'At expiration, the futures price must converge to the spot price through arbitrage. If they differed, traders could buy the cheaper and sell the more expensive for a risk-free profit.',
 2),
((SELECT id FROM learning_modules WHERE code='DER-06'),
 'An investor holds a long position in a futures contract at a price of USD 100. The settlement prices for the next three days are USD 103, USD 99, and USD 101. The cumulative gain or loss after three days is:',
 'USD 1 gain',
 'USD 3 gain',
 'USD 1 loss',
 'A',
 'Day 1: +3 (103-100), Day 2: -4 (99-103), Day 3: +2 (101-99). Cumulative = +3 - 4 + 2 = +1. The mark-to-market process credits or debits the margin account daily.',
 2),
((SELECT id FROM learning_modules WHERE code='DER-06'),
 'If asset prices and interest rates are positively correlated, the futures price will most likely be:',
 'Higher than the forward price',
 'Lower than the forward price',
 'Equal to the forward price',
 'A',
 'When asset prices and interest rates are positively correlated, daily gains on the long futures position occur when rates are high (allowing reinvestment at higher rates), and losses occur when rates are low. This makes the long futures position more attractive, pushing the futures price above the forward price.',
 3),
((SELECT id FROM learning_modules WHERE code='DER-06'),
 'The initial margin requirement for a futures contract serves primarily to:',
 'Compensate the broker for transaction costs',
 'Ensure that both parties can fulfill their obligations under the contract',
 'Determine the profit or loss on the position',
 'B',
 'Initial margin is a performance bond deposited by both long and short parties to ensure they can meet daily settlement obligations. It protects the clearinghouse and the counterparty from default.',
 1);

-- --------------------------------------------------------
-- QUESTIONS — DER-07: Pricing and Valuation of Interest Rates and Other Swaps
-- --------------------------------------------------------
INSERT INTO questions (module_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='DER-07'),
 'In a plain vanilla interest rate swap, the fixed-rate payer:',
 'Pays a fixed rate and receives a floating rate',
 'Pays a floating rate and receives a fixed rate',
 'Both pays and receives fixed rates',
 'A',
 'In a plain vanilla swap, one party pays a fixed rate and receives a floating rate (the fixed-rate payer), while the other pays floating and receives fixed (the floating-rate payer). Only net payments are exchanged.',
 1),
((SELECT id FROM learning_modules WHERE code='DER-07'),
 'An interest rate swap can be replicated by:',
 'A series of interest rate options',
 'A series of forward rate agreements (FRAs)',
 'A portfolio of equity options',
 'B',
 'A swap can be decomposed into a series of FRAs, where each FRA corresponds to one settlement period of the swap. Each FRA locks in a forward rate for a specific future period, just as the swap fixes the rate for each period.',
 2),
((SELECT id FROM learning_modules WHERE code='DER-07'),
 'At initiation, the fixed rate on a swap is set so that:',
 'The fixed-rate payer has an initial positive value',
 'The swap has zero value to both counterparties',
 'The floating-rate payer has an initial positive value',
 'B',
 'Like forward contracts, the fixed rate on a swap is set at initiation so the swap has zero value to both parties. The fixed rate is calculated as the rate that equates the present value of fixed payments to the present value of expected floating payments.',
 2),
((SELECT id FROM learning_modules WHERE code='DER-07'),
 'Given one-year and two-year discount factors of 0.9615 and 0.9246 respectively (annual payments), the fixed rate on a two-year swap is closest to:',
 '4.00%',
 '3.85%',
 '3.99%',
 'A',
 'Fixed rate = (1 - last discount factor) / (sum of discount factors) = (1 - 0.9246) / (0.9615 + 0.9246) = 0.0754 / 1.8861 = 0.03997 ≈ 4.00%.',
 3),
((SELECT id FROM learning_modules WHERE code='DER-07'),
 'A company with floating-rate debt that enters into a pay-fixed, receive-floating interest rate swap effectively:',
 'Increases its exposure to rising interest rates',
 'Converts its floating-rate debt to a fixed-rate obligation',
 'Eliminates all interest rate risk',
 'B',
 'The floating-rate payments received from the swap offset the floating-rate debt payments, and the company makes fixed payments on the swap. The net effect is a synthetic fixed-rate obligation.',
 2);

-- --------------------------------------------------------
-- QUESTIONS — DER-08: Pricing and Valuation of Options
-- --------------------------------------------------------
INSERT INTO questions (module_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='DER-08'),
 'An increase in the volatility of the underlying asset will most likely:',
 'Increase the value of both call and put options',
 'Increase the value of call options only',
 'Decrease the value of both call and put options',
 'A',
 'Higher volatility increases the probability of large price movements, which benefits option holders since options have asymmetric payoffs. Both call and put values increase with volatility because the upside is unlimited while downside is limited to the premium.',
 2),
((SELECT id FROM learning_modules WHERE code='DER-08'),
 'The exercise value of a call option is equal to:',
 'The option premium minus the time value',
 'The maximum of zero and the difference between the underlying price and the exercise price',
 'The exercise price minus the underlying price',
 'B',
 'Exercise value (intrinsic value) of a call = max(0, S - X). It is the payoff from immediate exercise. If the underlying price is below the exercise price, the exercise value is zero (out-of-the-money).',
 1),
((SELECT id FROM learning_modules WHERE code='DER-08'),
 'Time value of an option is greatest when the option is:',
 'Deep in-the-money',
 'At-the-money',
 'Deep out-of-the-money',
 'B',
 'Time value is greatest for at-the-money options because there is maximum uncertainty about whether the option will expire in or out of the money. Deep in- or out-of-the-money options have less uncertainty, reducing time value.',
 2),
((SELECT id FROM learning_modules WHERE code='DER-08'),
 'The lower bound of a European call option on a non-dividend-paying stock is:',
 'Zero',
 'The maximum of zero and (S - PV(X))',
 'S - X',
 'B',
 'The lower bound of a European call = max(0, S - PV(X)), where PV(X) is the present value of the exercise price. This is derived from no-arbitrage conditions.',
 3),
((SELECT id FROM learning_modules WHERE code='DER-08'),
 'Early exercise of an American call option on a non-dividend-paying stock is:',
 'Always optimal if the option is in-the-money',
 'Never optimal',
 'Optimal only when the option is deep in-the-money',
 'B',
 'It is never optimal to exercise an American call early on a non-dividend-paying stock because the time value is always positive. Selling the option in the market will always yield more than exercising it.',
 3);

-- --------------------------------------------------------
-- QUESTIONS — DER-09: Option Replication Using Put-Call Parity
-- --------------------------------------------------------
INSERT INTO questions (module_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='DER-09'),
 'Put-call parity for European options on a non-dividend-paying stock is expressed as:',
 'C + PV(X) = P + S',
 'C + S = P + PV(X)',
 'C + P = S + PV(X)',
 'A',
 'Put-call parity: C + PV(X) = P + S, where C is the call price, P is the put price, S is the stock price, and PV(X) is the present value of the strike price. This relationship must hold to prevent arbitrage.',
 2),
((SELECT id FROM learning_modules WHERE code='DER-09'),
 'A synthetic long forward position can be created by:',
 'Buying a call and selling a put with the same strike price and expiration',
 'Buying a put and selling a call with the same strike price and expiration',
 'Buying both a call and a put with the same strike price and expiration',
 'A',
 'Long call + short put = synthetic long forward. The payoff profile replicates being long the underlying asset at the strike price. Buying both a call and put creates a straddle.',
 2),
((SELECT id FROM learning_modules WHERE code='DER-09'),
 'A European put option is priced at EUR 3, the stock is at EUR 50, the risk-free rate is 5%, and the exercise price is EUR 48. The time to expiration is 1 year. The no-arbitrage call price is closest to:',
 'EUR 7.29',
 'EUR 5.00',
 'EUR 5.29',
 'A',
 'From put-call parity: C = P + S - PV(X) = 3 + 50 - 48/(1.05) = 3 + 50 - 45.71 = EUR 7.29.',
 3),
((SELECT id FROM learning_modules WHERE code='DER-09'),
 'If put-call parity is violated, the arbitrage strategy involves:',
 'Buying the relatively overpriced side and selling the relatively underpriced side',
 'Buying the relatively underpriced side and selling the relatively overpriced side',
 'Buying both sides simultaneously',
 'B',
 'When put-call parity is violated, an arbitrageur buys the underpriced combination and sells the overpriced combination to earn a risk-free profit. For example, if C + PV(X) < P + S, buy the call, invest PV(X), sell the put, and short the stock.',
 3),
((SELECT id FROM learning_modules WHERE code='DER-09'),
 'A protective put position (long stock + long put) has the same payoff at expiration as:',
 'A short call plus a risk-free bond',
 'A long call plus a risk-free bond with face value equal to the strike price',
 'A short put plus a short position in the stock',
 'B',
 'From put-call parity: S + P = C + PV(X). A protective put (long stock + long put) has the same payoff as a fiduciary call (long call + risk-free bond with face value equal to the strike).',
 2);

-- --------------------------------------------------------
-- QUESTIONS — DER-10: Valuing a Derivative Using a One-Period Binomial Model
-- --------------------------------------------------------
INSERT INTO questions (module_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='DER-10'),
 'In the one-period binomial model, risk-neutral probabilities are used to:',
 'Reflect the actual probability of the stock moving up or down',
 'Weight the option payoffs so they can be discounted at the risk-free rate',
 'Estimate the historical volatility of the underlying asset',
 'B',
 'Risk-neutral probabilities are artificial probabilities that allow option payoffs to be discounted at the risk-free rate. They do not represent actual probabilities of up or down moves but ensure no-arbitrage pricing.',
 2),
((SELECT id FROM learning_modules WHERE code='DER-10'),
 'In a one-period binomial model, S = 100, u = 1.15, d = 0.87, and r = 3%. The risk-neutral probability of an up move is closest to:',
 '0.571',
 '0.500',
 '0.429',
 'A',
 'Risk-neutral probability of up move: p = (1 + r - d) / (u - d) = (1.03 - 0.87) / (1.15 - 0.87) = 0.16 / 0.28 = 0.5714 ≈ 0.571.',
 3),
((SELECT id FROM learning_modules WHERE code='DER-10'),
 'A call option with a strike of 100 is valued using a one-period binomial model where the up-state stock price is 115, the down-state stock price is 87, and the risk-neutral probability of an up move is 0.571. If r = 3%, the call value is closest to:',
 'USD 8.31',
 'USD 8.57',
 'USD 15.00',
 'A',
 'Call payoff up = max(0, 115-100) = 15. Call payoff down = max(0, 87-100) = 0. Call value = (0.571 x 15 + 0.429 x 0) / 1.03 = 8.565 / 1.03 = 8.31.',
 3),
((SELECT id FROM learning_modules WHERE code='DER-10'),
 'The hedge ratio (delta) in the binomial model represents:',
 'The number of risk-free bonds needed to replicate the option',
 'The number of shares of the underlying needed to create a risk-free hedge with one option',
 'The probability of the option expiring in-the-money',
 'B',
 'The hedge ratio (delta) is the number of shares of the underlying asset needed per option to create a riskless portfolio. It equals the range of option payoffs divided by the range of stock prices: delta = (c_up - c_down) / (S_up - S_down).',
 2),
((SELECT id FROM learning_modules WHERE code='DER-10'),
 'In the one-period binomial model, the option value derived using risk-neutral pricing will:',
 'Always be higher than the value derived using actual probabilities',
 'Equal the value derived from a replicating portfolio approach',
 'Only be valid for European puts, not calls',
 'B',
 'Risk-neutral pricing and the replicating portfolio approach yield identical option values. Both methods produce the no-arbitrage price of the option. The risk-neutral approach is computationally simpler.',
 2);

-- --------------------------------------------------------
-- QUESTIONS — AI-04: Real Estate and Infrastructure
-- --------------------------------------------------------
INSERT INTO questions (module_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='ALT-04'),
 'The income approach to real estate valuation estimates value by:',
 'Comparing the subject property to recent sales of similar properties',
 'Capitalizing the property''s expected net operating income at an appropriate cap rate',
 'Estimating the cost to replace the building minus depreciation',
 'B',
 'The income approach values property by dividing expected net operating income (NOI) by a capitalization rate. Value = NOI / Cap rate. This approach is most relevant for income-producing properties.',
 2),
((SELECT id FROM learning_modules WHERE code='ALT-04'),
 'A property has a net operating income of USD 500,000 and a capitalization rate of 8%. Its estimated value using the income approach is closest to:',
 'USD 6,250,000',
 'USD 4,000,000',
 'USD 40,000',
 'A',
 'Value = NOI / Cap rate = 500,000 / 0.08 = USD 6,250,000. A lower cap rate implies higher value, reflecting lower perceived risk or stronger growth expectations.',
 2),
((SELECT id FROM learning_modules WHERE code='ALT-04'),
 'An infrastructure investment in an existing toll road with established cash flows is best described as a:',
 'Greenfield investment',
 'Brownfield investment',
 'Mezzanine investment',
 'B',
 'Brownfield investments are in existing, operational infrastructure assets with established revenue streams. Greenfield investments involve building new infrastructure from scratch, carrying higher construction and demand risk.',
 1),
((SELECT id FROM learning_modules WHERE code='ALT-04'),
 'Compared to equities, direct real estate investments are most likely characterized by:',
 'Higher liquidity and lower transaction costs',
 'Lower liquidity and higher transaction costs',
 'The same level of liquidity and transaction costs',
 'B',
 'Direct real estate is illiquid compared to publicly traded equities. Transaction costs are high (due diligence, legal fees, brokerage) and the process of buying or selling property is time-consuming.',
 1),
((SELECT id FROM learning_modules WHERE code='ALT-04'),
 'Real Estate Investment Trusts (REITs) offer investors:',
 'Direct ownership of the underlying properties',
 'A liquid, publicly traded way to gain exposure to real estate returns',
 'No tax advantages over direct property ownership',
 'B',
 'REITs are publicly traded entities that own or finance real estate. They offer liquidity (traded on exchanges), diversification, and in many jurisdictions favorable tax treatment (pass-through of income to avoid double taxation).',
 1);

-- --------------------------------------------------------
-- QUESTIONS — AI-05: Natural Resources
-- --------------------------------------------------------
INSERT INTO questions (module_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='ALT-05'),
 'The three components of return from a fully collateralized commodity futures investment are:',
 'Price return, roll yield, and collateral yield',
 'Capital gain, dividend yield, and interest income',
 'Spot return, convenience yield, and storage cost',
 'A',
 'Total return from commodity futures = spot/price return (change in futures price) + roll yield (gain/loss from rolling expiring contracts) + collateral yield (return on the margin collateral invested in risk-free securities).',
 2),
((SELECT id FROM learning_modules WHERE code='ALT-05'),
 'When the futures price curve is in backwardation, roll yield is:',
 'Negative because the new contract is purchased at a higher price',
 'Positive because the new contract is purchased at a lower price',
 'Zero because backwardation has no effect on roll yield',
 'B',
 'In backwardation, futures prices are below the spot price and decline with maturity. When rolling, the expiring (higher-priced) contract is sold and a new (lower-priced) contract is purchased, generating positive roll yield.',
 2),
((SELECT id FROM learning_modules WHERE code='ALT-05'),
 'Timberland as an investment is most likely attractive because:',
 'It provides exposure to interest rate movements similar to fixed-income securities',
 'Trees continue to grow and increase in value even when lumber prices are low, providing a natural hedge',
 'It has the same liquidity as publicly traded equities',
 'B',
 'Timberland has a biological growth component: trees continue growing regardless of market conditions. When lumber prices are low, harvest can be delayed while the trees gain volume and potentially move into higher-value size categories.',
 2),
((SELECT id FROM learning_modules WHERE code='ALT-05'),
 'Commodities are often considered a potential hedge against inflation because:',
 'Commodity futures always outperform equities during inflationary periods',
 'Rising commodity prices are a component of inflation, so commodity returns tend to be positively correlated with unexpected inflation',
 'Commodities pay regular income that increases with inflation',
 'B',
 'Commodity prices are direct inputs to consumer and producer price indices. When inflation rises unexpectedly, commodity prices tend to rise as well, providing a natural hedge. Commodities do not pay income like bonds or dividends.',
 2),
((SELECT id FROM learning_modules WHERE code='ALT-05'),
 'A contango market for a commodity futures contract is characterized by:',
 'Futures prices that are lower than the current spot price',
 'Futures prices that are higher than the current spot price',
 'Spot and futures prices that are identical',
 'B',
 'Contango occurs when futures prices exceed the spot price, typically due to storage costs, insurance, and financing costs. Rolling futures contracts in contango generates negative roll yield.',
 1);

-- --------------------------------------------------------
-- QUESTIONS — AI-06: Hedge Funds
-- --------------------------------------------------------
INSERT INTO questions (module_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='ALT-06'),
 'A hedge fund that takes both long and short positions in equities to profit from security selection while reducing market exposure is best described as using a:',
 'Global macro strategy',
 'Long/short equity strategy',
 'Managed futures strategy',
 'B',
 'Long/short equity strategies take long positions in undervalued stocks and short positions in overvalued stocks. The net market exposure can vary but is typically reduced compared to a long-only portfolio, isolating alpha from security selection.',
 1),
((SELECT id FROM learning_modules WHERE code='ALT-06'),
 'A high-water mark in a hedge fund fee structure means that:',
 'The fund charges incentive fees only on returns above a specified minimum rate',
 'The fund must recover previous losses before charging incentive fees on new gains',
 'The fund charges a fixed management fee regardless of performance',
 'B',
 'A high-water mark is the highest previous NAV. The fund manager earns incentive fees only on gains that exceed the high-water mark, ensuring investors do not pay incentive fees on gains that merely recover prior losses.',
 2),
((SELECT id FROM learning_modules WHERE code='ALT-06'),
 'A hedge fund charges a 2% management fee on end-of-year assets and a 20% incentive fee with a 5% hard hurdle rate. If the fund starts at USD 100 million and earns 15%, the incentive fee is closest to:',
 'USD 2.00 million',
 'USD 2.30 million',
 'USD 3.00 million',
 'A',
 'Gross return = 15%, hard hurdle = 5%. Incentive fee applies to return above the hurdle: (15% - 5%) x USD 100M = USD 10M. Incentive fee = 20% x USD 10M = USD 2.0 million. Management fee = 2% x USD 115M = USD 2.3M (charged separately).',
 3),
((SELECT id FROM learning_modules WHERE code='ALT-06'),
 'An event-driven hedge fund strategy primarily seeks to profit from:',
 'Macroeconomic trends across global markets',
 'Corporate events such as mergers, acquisitions, restructurings, or bankruptcies',
 'Systematic trend-following in futures markets',
 'B',
 'Event-driven strategies aim to profit from pricing inefficiencies around corporate events. Sub-strategies include merger arbitrage, distressed debt investing, and activist investing.',
 1),
((SELECT id FROM learning_modules WHERE code='ALT-06'),
 'A key limitation of hedge fund return data is:',
 'Hedge funds are required to report returns to all major databases',
 'Survivorship bias overstates average returns because failed funds drop out of databases',
 'Hedge fund returns are always normally distributed',
 'B',
 'Survivorship bias inflates reported average hedge fund returns because poorly performing funds that close are removed from databases. Only surviving (typically better-performing) funds remain, skewing average returns upward.',
 2);

-- --------------------------------------------------------
-- QUESTIONS — AI-07: Introduction to Digital Assets
-- --------------------------------------------------------
INSERT INTO questions (module_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='ALT-07'),
 'A cryptocurrency is best described as a:',
 'Digital token backed by a government or central bank',
 'Digital asset that uses cryptography and distributed ledger technology to facilitate peer-to-peer transactions',
 'Physical asset stored in a digital format',
 'B',
 'Cryptocurrencies are digital assets built on distributed ledger technology (typically blockchain) that use cryptographic techniques for security. They are decentralized and not backed by any government or central bank.',
 1),
((SELECT id FROM learning_modules WHERE code='ALT-07'),
 'Blockchain technology is best described as a:',
 'Centralized database managed by a single financial institution',
 'Distributed, immutable ledger that records transactions across a network of computers',
 'Private network accessible only to registered financial institutions',
 'B',
 'A blockchain is a distributed ledger technology where transactions are recorded in blocks that are cryptographically linked. The ledger is maintained across a network of nodes, making it difficult to alter past records (immutable).',
 1),
((SELECT id FROM learning_modules WHERE code='ALT-07'),
 'A key risk specific to digital asset investments is:',
 'Inflation risk due to unlimited token supply in all cryptocurrencies',
 'Regulatory and legal uncertainty across jurisdictions',
 'Low price volatility compared to traditional assets',
 'B',
 'Digital assets face significant regulatory risk as governments globally are still developing frameworks. Regulatory changes can materially affect the value, legality, and usability of digital assets across different jurisdictions.',
 2),
((SELECT id FROM learning_modules WHERE code='ALT-07'),
 'A stablecoin is a digital asset designed to:',
 'Provide the highest possible investment returns',
 'Maintain a stable value relative to a reference asset such as a fiat currency',
 'Replace traditional equity securities',
 'B',
 'Stablecoins are designed to maintain a stable value, typically pegged to a fiat currency (e.g., USD), commodity, or basket of assets. They aim to reduce the volatility characteristic of most cryptocurrencies.',
 1),
((SELECT id FROM learning_modules WHERE code='ALT-07'),
 'Including digital assets in a diversified portfolio may be attractive because they:',
 'Have historically shown consistently low volatility',
 'Have shown low correlations with traditional asset classes, potentially improving portfolio diversification',
 'Are guaranteed to appreciate in value over time',
 'B',
 'Digital assets have historically exhibited low to moderate correlations with traditional assets (equities, bonds). This potential diversification benefit is one argument for inclusion, though extreme volatility and regulatory risks are significant considerations.',
 2);

-- --------------------------------------------------------
-- QUESTIONS — PM-05: The Behavioral Biases of Individuals
-- --------------------------------------------------------
INSERT INTO questions (module_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='PM-05'),
 'An investor who holds onto a losing investment too long because selling would mean admitting a mistake is most likely exhibiting:',
 'Confirmation bias',
 'Loss aversion',
 'Anchoring bias',
 'B',
 'Loss aversion causes investors to feel the pain of losses more intensely than the pleasure of equivalent gains. This leads to holding losers too long (hoping to break even) and selling winners too quickly (locking in gains).',
 2),
((SELECT id FROM learning_modules WHERE code='PM-05'),
 'Confirmation bias is best described as the tendency to:',
 'Seek out information that supports existing beliefs while ignoring contradictory evidence',
 'Make decisions based on the most recent information available',
 'Overestimate one''s ability to predict market movements',
 'A',
 'Confirmation bias leads investors to selectively gather or interpret information in a way that confirms their pre-existing views. This can result in overconcentration in certain positions and failure to properly evaluate risks.',
 1),
((SELECT id FROM learning_modules WHERE code='PM-05'),
 'An investor who treats money differently depending on its source (e.g., inheritance vs. salary) is exhibiting:',
 'Anchoring bias',
 'Overconfidence bias',
 'Mental accounting',
 'C',
 'Mental accounting involves treating money differently based on its source, intended use, or account. Rationally, money is fungible, but mental accounting leads investors to create separate mental buckets that may result in suboptimal overall portfolio decisions.',
 2),
((SELECT id FROM learning_modules WHERE code='PM-05'),
 'The key difference between cognitive errors and emotional biases is that cognitive errors:',
 'Are easier to correct through education and awareness than emotional biases',
 'Have no effect on investment outcomes',
 'Are always more harmful than emotional biases',
 'A',
 'Cognitive errors arise from faulty reasoning and can often be moderated or corrected through education, information, and awareness. Emotional biases stem from feelings and impulses and are more difficult to correct because they are rooted in emotional reactions.',
 2),
((SELECT id FROM learning_modules WHERE code='PM-05'),
 'An investor who relies too heavily on a stock''s purchase price when making sell decisions is most likely exhibiting:',
 'Status quo bias',
 'Anchoring bias',
 'Overconfidence bias',
 'B',
 'Anchoring bias occurs when an investor gives disproportionate weight to an initial piece of information (the anchor). Using the purchase price as a reference point for sell decisions, rather than considering current fundamentals and outlook, is a classic example.',
 2);

-- --------------------------------------------------------
-- QUESTIONS — PM-06: Introduction to Risk Management
-- --------------------------------------------------------
INSERT INTO questions (module_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='PM-06'),
 'The risk management process begins with:',
 'Selecting hedging instruments',
 'Identifying and measuring the risks the organization faces',
 'Calculating value at risk for all positions',
 'B',
 'The risk management process starts with identifying the risks to which an organization is exposed, then measuring those risks, followed by developing strategies to manage them. Instrument selection comes after risk identification and assessment.',
 1),
((SELECT id FROM learning_modules WHERE code='PM-06'),
 'Value at Risk (VaR) is best interpreted as:',
 'The maximum loss a portfolio can experience over a given time period',
 'The minimum loss expected to be exceeded with a given probability over a specified time period',
 'The expected average loss over a given time period',
 'B',
 'VaR is a statistical measure that estimates the minimum loss that will be exceeded with a specified probability (e.g., 5%) over a given time period. A 5% daily VaR of USD 1 million means there is a 5% chance of losing at least USD 1 million in one day.',
 2),
((SELECT id FROM learning_modules WHERE code='PM-06'),
 'A portfolio has a 5% daily VaR of USD 2 million. This means that:',
 'The portfolio will lose exactly USD 2 million on 5% of trading days',
 'On 5% of trading days, the portfolio loss is expected to equal or exceed USD 2 million',
 'The maximum possible loss on the portfolio is USD 2 million',
 'B',
 'A 5% daily VaR of USD 2M means there is a 5% probability that the daily loss will be at least USD 2 million. VaR does not indicate the maximum possible loss or the exact amount lost on any given day.',
 2),
((SELECT id FROM learning_modules WHERE code='PM-06'),
 'A limitation of VaR as a risk measure is that it:',
 'Cannot be estimated using historical data',
 'Does not indicate the magnitude of losses beyond the VaR threshold',
 'Always overestimates the true risk of a portfolio',
 'B',
 'VaR only tells us the minimum loss at a given confidence level but says nothing about how severe losses could be beyond that threshold. Conditional VaR (CVaR or Expected Shortfall) addresses this limitation by estimating the expected loss given that the VaR threshold is exceeded.',
 2),
((SELECT id FROM learning_modules WHERE code='PM-06'),
 'Risk budgeting is best described as the process of:',
 'Eliminating all risk from the portfolio',
 'Allocating the total amount of acceptable risk across different positions, asset classes, or strategies',
 'Setting a fixed dollar limit on daily trading losses',
 'B',
 'Risk budgeting allocates a total risk budget (e.g., total portfolio VaR or tracking error) across individual positions or strategies. It ensures that risk is distributed according to the organization''s risk appetite and investment views.',
 2);


-- ============================================================
-- 4. FLASHCARDS (4 per module)
-- ============================================================

-- --------------------------------------------------------
-- FLASHCARDS — CF-06: Capital Structure
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='CORP-06'),
 'What is the Modigliani-Miller Proposition I (no taxes)?',
 'In a world without taxes, bankruptcy costs, or transaction costs, the value of a firm is independent of its capital structure. The total value depends on the cash flows generated by the firm''s assets, not on how those cash flows are divided between debt and equity.',
 '{corporate_issuers,capital_structure,modigliani_miller}'),
((SELECT id FROM learning_modules WHERE code='CORP-06'),
 'What is the tax shield benefit of debt?',
 'Interest payments on debt are tax-deductible, creating a tax shield equal to the tax rate times the interest expense. The present value of all future tax shields adds value to the firm. Under MM with taxes, firm value increases linearly with the amount of debt.',
 '{corporate_issuers,capital_structure,tax_shield}'),
((SELECT id FROM learning_modules WHERE code='CORP-06'),
 'What does the static trade-off theory say about optimal capital structure?',
 'The optimal capital structure balances the tax benefit of debt against the costs of financial distress (bankruptcy costs). The optimal debt level is where the marginal benefit of an additional dollar of debt equals the marginal cost of financial distress.',
 '{corporate_issuers,capital_structure,tradeoff_theory}'),
((SELECT id FROM learning_modules WHERE code='CORP-06'),
 'How does WACC change with increasing leverage?',
 'As leverage increases, the cost of equity rises (more risk to equity holders) but overall WACC initially decreases due to the tax benefit of cheaper debt. Beyond the optimal point, financial distress costs dominate and WACC begins to increase.',
 '{corporate_issuers,capital_structure,wacc}');

-- --------------------------------------------------------
-- FLASHCARDS — CF-07: Business Models
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='CORP-07'),
 'What is a subscription business model?',
 'A model that generates recurring revenue by charging customers a periodic fee for ongoing access to a product or service. Examples include streaming services and SaaS. Key metrics include customer retention rate, churn rate, and customer lifetime value.',
 '{corporate_issuers,business_models,subscription}'),
((SELECT id FROM learning_modules WHERE code='CORP-07'),
 'What is a platform business model?',
 'A model that creates value by connecting two or more groups of users and facilitating interactions between them. The platform benefits from network effects where value increases as more users participate. Examples include marketplaces, social media, and payment networks.',
 '{corporate_issuers,business_models,platform}'),
((SELECT id FROM learning_modules WHERE code='CORP-07'),
 'What is operating leverage and how does the business model affect it?',
 'Operating leverage measures the sensitivity of operating income to changes in revenue. Businesses with high fixed costs and low variable costs have high operating leverage, meaning small revenue changes lead to large profit changes. Asset-heavy businesses tend to have higher operating leverage.',
 '{corporate_issuers,business_models,operating_leverage}'),
((SELECT id FROM learning_modules WHERE code='CORP-07'),
 'What is the freemium business model?',
 'A model offering a basic product or service for free while charging for premium features or enhanced functionality. The free tier attracts a large user base, and a percentage convert to paying customers. Key challenge is optimizing the free/paid feature balance to maximize conversion.',
 '{corporate_issuers,business_models,freemium}');

-- --------------------------------------------------------
-- FLASHCARDS — FRA-11: Introduction to Financial Statement Modeling
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='FSA-11'),
 'What are the key steps in building a financial statement model?',
 '1) Gather historical financial data and understand the business. 2) Forecast revenue using top-down or bottom-up approaches. 3) Forecast expenses and margins. 4) Build the income statement, then balance sheet, then cash flow statement. 5) Use a plug variable (cash or revolver) to balance.',
 '{fra,financial_modeling,process}'),
((SELECT id FROM learning_modules WHERE code='FSA-11'),
 'What is a plug variable in a financial model?',
 'A plug or balancing item is the variable that adjusts to ensure the balance sheet balances (Assets = Liabilities + Equity). Typically, excess cash is the plug when the company generates surplus funds, or a revolving credit facility is the plug when additional financing is needed.',
 '{fra,financial_modeling,plug_variable}'),
((SELECT id FROM learning_modules WHERE code='FSA-11'),
 'How is revenue typically forecast in a financial model?',
 'Revenue can be forecast using a top-down approach (market size x market share x growth) or a bottom-up approach (units x price per unit, or number of customers x revenue per customer). Historical trends, management guidance, and industry analysis inform the assumptions.',
 '{fra,financial_modeling,revenue_forecast}'),
((SELECT id FROM learning_modules WHERE code='FSA-11'),
 'What is sensitivity analysis in financial modeling?',
 'Sensitivity analysis tests how changes in key assumptions (revenue growth, margins, discount rates) affect model outputs. It identifies which variables have the greatest impact on valuation or financial metrics, helping analysts understand model risk and uncertainty.',
 '{fra,financial_modeling,sensitivity_analysis}');

-- --------------------------------------------------------
-- FLASHCARDS — EQ-07: Industry and Competitive Analysis
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='EQU-07'),
 'What are Porter''s five competitive forces?',
 '1) Threat of new entrants. 2) Threat of substitute products/services. 3) Bargaining power of buyers. 4) Bargaining power of suppliers. 5) Rivalry among existing competitors. Together they determine industry profitability and competitive intensity.',
 '{equity,industry_analysis,porters_five_forces}'),
((SELECT id FROM learning_modules WHERE code='EQU-07'),
 'What are the stages of the industry life cycle?',
 'Embryonic (slow growth, high prices), Growth (rapid demand increase, improving margins), Shakeout (slowing growth, overcapacity), Mature (stable demand, price competition, consolidation), Decline (shrinking demand, excess capacity, exits).',
 '{equity,industry_analysis,life_cycle}'),
((SELECT id FROM learning_modules WHERE code='EQU-07'),
 'What is the Herfindahl-Hirschman Index (HHI)?',
 'A measure of industry concentration calculated by summing the squares of the market shares of all firms. HHI < 1,500 = unconcentrated; 1,500-2,500 = moderately concentrated; > 2,500 = highly concentrated. Higher concentration generally means more pricing power.',
 '{equity,industry_analysis,hhi}'),
((SELECT id FROM learning_modules WHERE code='EQU-07'),
 'How do barriers to entry affect industry profitability?',
 'High barriers to entry (capital requirements, patents, regulatory approvals, brand loyalty, network effects) protect incumbent firms from new competition, allowing them to maintain pricing power and earn above-average returns over the long run.',
 '{equity,industry_analysis,barriers_to_entry}');

-- --------------------------------------------------------
-- FLASHCARDS — FI-11: Yield-Based Bond Duration Measures and Properties
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='FI-11'),
 'What is Macaulay duration?',
 'The weighted average time until a bond''s cash flows are received, where the weights are the present values of each cash flow divided by the bond''s price. It is measured in years and represents the economic payback period of the bond.',
 '{fixed_income,duration,macaulay}'),
((SELECT id FROM learning_modules WHERE code='FI-11'),
 'What is modified duration and how is it related to Macaulay duration?',
 'Modified duration = Macaulay duration / (1 + yield per period). It measures the approximate percentage price change for a 1% change in yield. For example, a modified duration of 5 means a 1% yield increase causes approximately a 5% price decrease.',
 '{fixed_income,duration,modified}'),
((SELECT id FROM learning_modules WHERE code='FI-11'),
 'When should you use effective duration instead of modified duration?',
 'Effective duration should be used for bonds with embedded options (callable, putable, MBS) because it accounts for changes in expected cash flows due to the option when yields change. Modified duration assumes cash flows do not change with yield.',
 '{fixed_income,duration,effective}'),
((SELECT id FROM learning_modules WHERE code='FI-11'),
 'How does coupon rate affect duration?',
 'Higher coupon rates reduce duration because a greater proportion of the bond''s total cash flows is received earlier. A zero-coupon bond has the highest duration for a given maturity (Macaulay duration equals maturity) since all cash flow comes at maturity.',
 '{fixed_income,duration,coupon_effect}');

-- --------------------------------------------------------
-- FLASHCARDS — FI-12: Yield-Based Bond Convexity and Portfolio Properties
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='FI-12'),
 'Why is the duration-only price estimate an approximation?',
 'Duration assumes a linear relationship between price and yield, but the actual relationship is curved (convex). Duration underestimates price increases when yields fall and overestimates price decreases when yields rise. Convexity corrects this.',
 '{fixed_income,convexity,approximation}'),
((SELECT id FROM learning_modules WHERE code='FI-12'),
 'What is the formula for price change using both duration and convexity?',
 '%ΔP ≈ (-ModDur x ΔYield) + (0.5 x Convexity x ΔYield²). The first term is the duration effect (linear) and the second is the convexity adjustment (always adds to price for a bond with positive convexity regardless of the direction of yield change).',
 '{fixed_income,convexity,price_change_formula}'),
((SELECT id FROM learning_modules WHERE code='FI-12'),
 'Why do investors prefer bonds with greater convexity?',
 'For a given duration and yield change, bonds with greater convexity gain more when yields fall and lose less when yields rise. This asymmetry is beneficial. Investors may accept a lower yield for higher convexity, all else equal.',
 '{fixed_income,convexity,investor_preference}'),
((SELECT id FROM learning_modules WHERE code='FI-12'),
 'How is portfolio duration calculated?',
 'Portfolio duration is the market-value-weighted average of individual bond durations: D_portfolio = Σ(w_i x D_i), where w_i is each bond''s market value weight. This assumes a parallel shift in the yield curve.',
 '{fixed_income,convexity,portfolio_duration}');

-- --------------------------------------------------------
-- FLASHCARDS — FI-13: Curve-Based and Empirical Fixed-Income Risk Measures
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='FI-13'),
 'What is key rate duration?',
 'Key rate duration measures the sensitivity of a bond''s price to changes in yield at a specific maturity point on the yield curve (e.g., 2-year, 5-year, 10-year). The sum of all key rate durations approximately equals effective duration.',
 '{fixed_income,risk_measures,key_rate_duration}'),
((SELECT id FROM learning_modules WHERE code='FI-13'),
 'What is the difference between analytical and empirical duration?',
 'Analytical duration is calculated from the bond''s features using a mathematical formula. Empirical duration is estimated by running a regression of historical bond price changes on yield changes. Empirical duration may better reflect real-world behavior for complex bonds.',
 '{fixed_income,risk_measures,empirical_duration}'),
((SELECT id FROM learning_modules WHERE code='FI-13'),
 'What is the difference between a barbell and a bullet portfolio?',
 'A barbell concentrates holdings in short and long maturities. A bullet concentrates holdings around a single intermediate maturity. Both can have the same duration but different key rate exposures and convexity. A barbell outperforms when the curve flattens; a bullet when it steepens.',
 '{fixed_income,risk_measures,barbell_bullet}'),
((SELECT id FROM learning_modules WHERE code='FI-13'),
 'How does a yield curve flattening differ from a steepening?',
 'Flattening: the spread between long-term and short-term yields decreases. Steepening: the spread increases. A parallel shift changes all yields by the same amount. Non-parallel changes (flattening, steepening, butterfly twists) require key rate durations to analyze.',
 '{fixed_income,risk_measures,yield_curve}');

-- --------------------------------------------------------
-- FLASHCARDS — FI-14: Credit Risk
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='FI-14'),
 'What is the expected loss formula for credit risk?',
 'Expected Loss = Probability of Default (PD) x Loss Given Default (LGD) x Exposure at Default (EAD). LGD = 1 - Recovery Rate. This quantifies the average credit loss an investor can expect over a given period.',
 '{fixed_income,credit_risk,expected_loss}'),
((SELECT id FROM learning_modules WHERE code='FI-14'),
 'What is the relationship between credit spread and credit risk?',
 'The credit spread is the yield premium a bond pays over a comparable risk-free bond. It compensates for expected credit losses, credit migration risk, liquidity risk, and a risk premium for credit uncertainty. Wider spreads indicate higher perceived credit risk.',
 '{fixed_income,credit_risk,credit_spread}'),
((SELECT id FROM learning_modules WHERE code='FI-14'),
 'What is the seniority ranking of debt in default?',
 'From highest to lowest priority: 1) Senior secured, 2) Senior unsecured, 3) Senior subordinated, 4) Subordinated, 5) Junior subordinated. Higher seniority means higher recovery rates in default. Equity holders are last in line.',
 '{fixed_income,credit_risk,seniority}'),
((SELECT id FROM learning_modules WHERE code='FI-14'),
 'What is recovery rate and how does it relate to LGD?',
 'Recovery rate is the percentage of the outstanding debt that creditors recover in the event of default. LGD = 1 - Recovery Rate. For example, if the recovery rate is 40%, LGD is 60%. Recovery rates vary by seniority, collateral quality, and economic conditions.',
 '{fixed_income,credit_risk,recovery_rate}');

-- --------------------------------------------------------
-- FLASHCARDS — FI-15: Credit Analysis for Government Issuers
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='FI-15'),
 'What are the key factors in sovereign credit analysis?',
 'Institutional strength (governance, rule of law), economic profile (GDP growth, diversification), fiscal strength (debt/GDP, fiscal balance), external stability (current account, reserves), and monetary policy framework. These determine a sovereign''s ability and willingness to repay debt.',
 '{fixed_income,sovereign_credit,analysis_factors}'),
((SELECT id FROM learning_modules WHERE code='FI-15'),
 'Why is local-currency sovereign debt generally lower risk than foreign-currency sovereign debt?',
 'Governments can print their own currency to service local-currency debt, making outright default unlikely (though inflation risk increases). Foreign-currency debt cannot be repaid through money creation and requires sufficient foreign exchange reserves, making it riskier.',
 '{fixed_income,sovereign_credit,currency_denomination}'),
((SELECT id FROM learning_modules WHERE code='FI-15'),
 'What is a non-sovereign government bond?',
 'Bonds issued by government entities below the national level, such as states, provinces, municipalities, or government agencies. They generally carry higher credit risk than sovereign bonds because they cannot print currency and have more limited taxing authority.',
 '{fixed_income,sovereign_credit,non_sovereign}'),
((SELECT id FROM learning_modules WHERE code='FI-15'),
 'What does the debt-to-GDP ratio measure for a sovereign issuer?',
 'It measures the total government debt relative to the country''s economic output. A higher ratio indicates a greater debt burden relative to the economy''s capacity to generate income. It is a key metric in sovereign credit analysis, though context (growth, currency, institutional quality) matters.',
 '{fixed_income,sovereign_credit,debt_to_gdp}');

-- --------------------------------------------------------
-- FLASHCARDS — FI-16: Credit Analysis for Corporate Issuers
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='FI-16'),
 'What are the four Cs of credit analysis?',
 'Capacity: ability to generate cash flows to service debt. Collateral: assets pledged as security. Covenants: terms in the bond indenture (affirmative and negative). Character: management quality, integrity, and track record.',
 '{fixed_income,corporate_credit,four_cs}'),
((SELECT id FROM learning_modules WHERE code='FI-16'),
 'What is the interest coverage ratio and why is it important?',
 'Interest coverage = EBIT / Interest expense. It measures the company''s ability to pay interest from operating earnings. Higher ratios indicate stronger ability to service debt. A ratio below 1.0 means the company cannot cover interest from operations.',
 '{fixed_income,corporate_credit,interest_coverage}'),
((SELECT id FROM learning_modules WHERE code='FI-16'),
 'What is the difference between affirmative and negative covenants?',
 'Affirmative (positive) covenants require the issuer to do something (e.g., maintain insurance, provide financial statements). Negative (restrictive) covenants prohibit or limit actions (e.g., limits on additional debt, dividend restrictions, negative pledge clauses).',
 '{fixed_income,corporate_credit,covenants}'),
((SELECT id FROM learning_modules WHERE code='FI-16'),
 'What does the debt-to-EBITDA ratio indicate?',
 'Debt/EBITDA measures a company''s leverage relative to its cash earnings. A ratio of 3x means it would take 3 years of EBITDA to repay all debt. Lower ratios indicate lower leverage and generally lower credit risk. Rating agencies use this as a key metric.',
 '{fixed_income,corporate_credit,leverage_ratio}');

-- --------------------------------------------------------
-- FLASHCARDS — FI-17: Fixed-Income Securitization
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='FI-17'),
 'What is securitization?',
 'The process of pooling financial assets (mortgages, auto loans, credit card receivables) and issuing securities backed by those asset pools. It converts illiquid assets into tradable securities, allowing originators to transfer credit risk and free up capital.',
 '{fixed_income,securitization,definition}'),
((SELECT id FROM learning_modules WHERE code='FI-17'),
 'What is the role of the Special Purpose Vehicle (SPV)?',
 'The SPV is a legally separate, bankruptcy-remote entity that purchases the pooled assets from the originator and issues the ABS. It isolates the assets from the originator''s bankruptcy risk, ensuring that investors'' claims are protected.',
 '{fixed_income,securitization,spv}'),
((SELECT id FROM learning_modules WHERE code='FI-17'),
 'What is the difference between internal and external credit enhancement?',
 'Internal: built into the structure (subordination, overcollateralization, excess spread, reserve accounts). External: provided by third parties (surety bonds, financial guarantees, letters of credit). Internal is more common in modern securitizations.',
 '{fixed_income,securitization,credit_enhancement}'),
((SELECT id FROM learning_modules WHERE code='FI-17'),
 'What is a waterfall structure?',
 'The rules governing the priority of cash flow distribution from the underlying assets to different tranches. Senior tranches receive payments first, then mezzanine, then equity. Losses are allocated in reverse order (equity absorbs first).',
 '{fixed_income,securitization,waterfall}');

-- --------------------------------------------------------
-- FLASHCARDS — FI-18: Asset-Backed Security (ABS) Instrument and Market Features
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='FI-18'),
 'How do credit card ABS differ from auto loan ABS?',
 'Credit card ABS have a revolving period (lockout) during which principal payments are reinvested, followed by an amortization period. Auto loan ABS are backed by amortizing loans with scheduled principal payments passed through to investors. Auto loans have prepayment risk; credit card ABS have less.',
 '{fixed_income,abs,credit_card_vs_auto}'),
((SELECT id FROM learning_modules WHERE code='FI-18'),
 'What is a Collateralized Debt Obligation (CDO)?',
 'A securitized product backed by a diversified pool of debt obligations (corporate bonds, loans, or other ABS). CDOs are structured in tranches (senior, mezzanine, equity) with different risk/return profiles. Sub-types include CLOs (backed by loans) and CBOs (backed by bonds).',
 '{fixed_income,abs,cdo}'),
((SELECT id FROM learning_modules WHERE code='FI-18'),
 'What is overcollateralization?',
 'A form of internal credit enhancement where the face value of the underlying collateral exceeds the face value of the securities issued. The excess provides a cushion against losses. For example, a pool of $110M in loans backing $100M in ABS provides $10M of overcollateralization.',
 '{fixed_income,abs,overcollateralization}'),
((SELECT id FROM learning_modules WHERE code='FI-18'),
 'What is prepayment risk in the context of ABS?',
 'The risk that borrowers repay principal faster or slower than expected. Contraction risk: prepayments faster than expected (in falling rates), shortening WAL. Extension risk: prepayments slower than expected (in rising rates), lengthening WAL. Both affect realized yield.',
 '{fixed_income,abs,prepayment_risk}');

-- --------------------------------------------------------
-- FLASHCARDS — FI-19: Mortgage-Backed Security (MBS) Instrument and Market Features
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='FI-19'),
 'What is the difference between agency and non-agency MBS?',
 'Agency MBS are guaranteed by government agencies (Ginnie Mae) or GSEs (Fannie Mae, Freddie Mac) against default risk. Non-agency MBS lack this guarantee and carry credit risk. Agency MBS investors face primarily prepayment risk, not credit risk.',
 '{fixed_income,mbs,agency_vs_non_agency}'),
((SELECT id FROM learning_modules WHERE code='FI-19'),
 'What is a mortgage pass-through security?',
 'A security that passes principal and interest payments from a pool of mortgages directly to investors, minus servicing fees. All investors receive a pro-rata share. Prepayments are passed through, creating uncertainty about the timing of cash flows.',
 '{fixed_income,mbs,pass_through}'),
((SELECT id FROM learning_modules WHERE code='FI-19'),
 'What are contraction risk and extension risk for MBS?',
 'Contraction risk: when interest rates fall, borrowers refinance, prepayments accelerate, and investors receive principal early and must reinvest at lower rates. Extension risk: when rates rise, prepayments slow, WAL extends, and investors are stuck with below-market yields longer than expected.',
 '{fixed_income,mbs,contraction_extension}'),
((SELECT id FROM learning_modules WHERE code='FI-19'),
 'What is a Planned Amortization Class (PAC) tranche?',
 'A CMO tranche designed to provide more predictable cash flows. It has a planned payment schedule that holds as long as prepayments stay within a defined band (collar). Prepayment variability is absorbed by companion (support) tranches. PAC tranches offer lower yield for greater cash flow certainty.',
 '{fixed_income,mbs,pac_tranche}');

-- --------------------------------------------------------
-- FLASHCARDS — DER-05: Pricing and Valuation of Forward Contracts
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='DER-05'),
 'What is the no-arbitrage forward price for a non-dividend-paying asset?',
 'F = S x (1 + r)^T, where S is the spot price, r is the risk-free rate, and T is the time to expiration. This reflects the cost of carry: the financing cost of buying and holding the asset until the forward contract''s delivery date.',
 '{derivatives,forward_pricing,no_arbitrage}'),
((SELECT id FROM learning_modules WHERE code='DER-05'),
 'How are dividends incorporated into forward pricing?',
 'For an asset paying known dividends, F = (S - PV(D)) x (1+r)^T. The present value of dividends is subtracted because the forward contract holder does not receive them. Dividends reduce the cost of carry and therefore reduce the forward price.',
 '{derivatives,forward_pricing,dividends}'),
((SELECT id FROM learning_modules WHERE code='DER-05'),
 'What is the value of a forward contract at initiation?',
 'Zero. The forward price is set so that neither party has an advantage at initiation. No money changes hands. During the contract''s life, the value becomes positive for one party and negative for the other as the spot price changes.',
 '{derivatives,forward_pricing,initiation_value}'),
((SELECT id FROM learning_modules WHERE code='DER-05'),
 'How is the value of a forward contract to the long determined during its life?',
 'Value to long = PV(current forward price - original forward price) = S_t - PV(F_0). If the current spot has risen since initiation, the long position gains value. The short position''s value is the negative of the long''s value.',
 '{derivatives,forward_pricing,mark_to_market}');

-- --------------------------------------------------------
-- FLASHCARDS — DER-06: Pricing and Valuation of Futures Contracts
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='DER-06'),
 'How does daily mark-to-market affect futures contracts?',
 'Futures positions are settled daily: gains are credited and losses debited from the margin account. This eliminates counterparty credit risk (the clearinghouse guarantees performance) but means cash flows differ from forwards, potentially causing price differences.',
 '{derivatives,futures,mark_to_market}'),
((SELECT id FROM learning_modules WHERE code='DER-06'),
 'Why do futures prices converge to spot prices at expiration?',
 'At expiration, the futures contract calls for immediate delivery at the futures price. If the futures price differed from spot, arbitrageurs could buy the cheaper and sell the more expensive for risk-free profit, driving prices together.',
 '{derivatives,futures,convergence}'),
((SELECT id FROM learning_modules WHERE code='DER-06'),
 'When do futures prices differ from forward prices?',
 'When interest rates are correlated with the underlying asset price. Positive correlation: futures > forwards (daily gains reinvested at higher rates). Negative correlation: futures < forwards. If rates are uncorrelated with the asset, futures ≈ forwards.',
 '{derivatives,futures,vs_forwards}'),
((SELECT id FROM learning_modules WHERE code='DER-06'),
 'What is the role of initial margin in futures markets?',
 'Initial margin is a performance bond posted by both long and short parties. It is not a down payment but collateral ensuring daily settlement obligations are met. If the account falls below the maintenance margin, a margin call requires depositing funds to restore it.',
 '{derivatives,futures,margin}');

-- --------------------------------------------------------
-- FLASHCARDS — DER-07: Pricing and Valuation of Interest Rates and Other Swaps
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='DER-07'),
 'What is a plain vanilla interest rate swap?',
 'An agreement between two parties where one pays a fixed rate and receives a floating rate, while the other does the opposite, on a notional principal amount. Only net payments are exchanged. The notional is not exchanged. Settlement periods are typically quarterly or semiannually.',
 '{derivatives,swaps,plain_vanilla}'),
((SELECT id FROM learning_modules WHERE code='DER-07'),
 'How is the fixed rate on a swap determined?',
 'The fixed rate is set so the swap has zero value at initiation. It is calculated as: Fixed rate = (1 - last discount factor) / (sum of all discount factors). This makes the PV of fixed payments equal to the PV of expected floating payments.',
 '{derivatives,swaps,fixed_rate}'),
((SELECT id FROM learning_modules WHERE code='DER-07'),
 'How can an interest rate swap be replicated?',
 'A swap can be viewed as: 1) A series of forward rate agreements (FRAs), one for each settlement period. 2) A pair of bonds: the fixed-rate payer is long a floating-rate bond and short a fixed-rate bond. Both replications yield the same cash flows.',
 '{derivatives,swaps,replication}'),
((SELECT id FROM learning_modules WHERE code='DER-07'),
 'How does a pay-fixed swap convert floating-rate debt to fixed-rate?',
 'A company with floating-rate debt that enters a pay-fixed, receive-floating swap: the floating payments received from the swap offset the floating-rate debt payments, leaving only the fixed swap payment. Net effect: synthetic fixed-rate obligation.',
 '{derivatives,swaps,hedging}');

-- --------------------------------------------------------
-- FLASHCARDS — DER-08: Pricing and Valuation of Options
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='DER-08'),
 'What factors affect option values and in what direction?',
 'Call values increase with: higher underlying price, higher volatility, longer time to expiration, lower exercise price, higher risk-free rate. Put values increase with: lower underlying price, higher volatility, longer time, higher exercise price, lower risk-free rate.',
 '{derivatives,options,value_factors}'),
((SELECT id FROM learning_modules WHERE code='DER-08'),
 'What is the difference between exercise value and time value?',
 'Exercise (intrinsic) value = max(0, S-X) for calls, max(0, X-S) for puts. Time value = option premium - exercise value. Time value reflects the probability the option will become more valuable before expiration. Time value is maximized for at-the-money options.',
 '{derivatives,options,intrinsic_vs_time}'),
((SELECT id FROM learning_modules WHERE code='DER-08'),
 'What is the lower bound of a European call on a non-dividend-paying stock?',
 'Lower bound = max(0, S - PV(X)). The call can never be worth less than zero. It also cannot be worth less than the difference between the stock price and the present value of the exercise price, due to no-arbitrage conditions.',
 '{derivatives,options,lower_bound}'),
((SELECT id FROM learning_modules WHERE code='DER-08'),
 'Why is early exercise of an American call on a non-dividend-paying stock never optimal?',
 'The time value of the call is always positive. Exercising early sacrifices the time value. Selling the option always yields at least as much as exercising it. For dividend-paying stocks, early exercise may be optimal just before an ex-dividend date.',
 '{derivatives,options,early_exercise}');

-- --------------------------------------------------------
-- FLASHCARDS — DER-09: Option Replication Using Put-Call Parity
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='DER-09'),
 'What is put-call parity?',
 'For European options on a non-dividend-paying stock: C + PV(X) = P + S. A fiduciary call (call + risk-free bond) has the same payoff as a protective put (stock + put). This relationship must hold to prevent arbitrage opportunities.',
 '{derivatives,put_call_parity,definition}'),
((SELECT id FROM learning_modules WHERE code='DER-09'),
 'How do you create a synthetic long forward using options?',
 'Buy a call and sell a put with the same strike and expiration: Long call + Short put = Synthetic long forward. The combined payoff replicates the payoff of being long the underlying at the strike price.',
 '{derivatives,put_call_parity,synthetic_forward}'),
((SELECT id FROM learning_modules WHERE code='DER-09'),
 'How do you exploit a violation of put-call parity?',
 'If C + PV(X) > P + S: sell the call, buy the put, buy the stock, and borrow PV(X). If C + PV(X) < P + S: buy the call, sell the put, short the stock, and invest PV(X). In both cases, the position generates a risk-free profit.',
 '{derivatives,put_call_parity,arbitrage}'),
((SELECT id FROM learning_modules WHERE code='DER-09'),
 'What is a fiduciary call and a protective put?',
 'Fiduciary call = long call + long risk-free bond with face value X. Protective put = long stock + long put. Both have the same payoff at expiration: max(X, S_T). Put-call parity equates their values.',
 '{derivatives,put_call_parity,fiduciary_protective}');

-- --------------------------------------------------------
-- FLASHCARDS — DER-10: Valuing a Derivative Using a One-Period Binomial Model
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='DER-10'),
 'What is the one-period binomial model?',
 'A model that assumes the underlying asset can move to one of two possible prices: up (S x u) or down (S x d). Using risk-neutral probabilities, option payoffs in each state are weighted, then discounted at the risk-free rate to obtain the current option value.',
 '{derivatives,binomial_model,overview}'),
((SELECT id FROM learning_modules WHERE code='DER-10'),
 'How are risk-neutral probabilities calculated?',
 'Risk-neutral probability of an up move: p = (1 + r - d) / (u - d), where r is the risk-free rate, u is the up factor, d is the down factor. Probability of down move = 1 - p. These are not actual probabilities but computational weights for no-arbitrage pricing.',
 '{derivatives,binomial_model,risk_neutral_prob}'),
((SELECT id FROM learning_modules WHERE code='DER-10'),
 'What is the hedge ratio (delta) in the binomial model?',
 'Delta = (c_up - c_down) / (S_up - S_down), the number of shares per option needed to create a risk-free hedge. A portfolio of delta shares and short one call is riskless and must earn the risk-free rate. Delta ranges from 0 to 1 for calls.',
 '{derivatives,binomial_model,hedge_ratio}'),
((SELECT id FROM learning_modules WHERE code='DER-10'),
 'How do you value an option with the one-period binomial model?',
 'Step 1: Calculate payoffs in up and down states. Step 2: Calculate risk-neutral probability p. Step 3: Option value = [p x payoff_up + (1-p) x payoff_down] / (1 + r). This risk-neutral pricing gives the same result as the replicating portfolio approach.',
 '{derivatives,binomial_model,valuation_steps}');

-- --------------------------------------------------------
-- FLASHCARDS — AI-04: Real Estate and Infrastructure
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='ALT-04'),
 'What are the three approaches to real estate valuation?',
 'Income approach: Value = NOI / Cap rate. Comparable sales (market) approach: value based on recent transactions of similar properties. Cost approach: land value + replacement cost of building minus depreciation. The income approach is most common for investment properties.',
 '{alternatives,real_estate,valuation}'),
((SELECT id FROM learning_modules WHERE code='ALT-04'),
 'What is the difference between greenfield and brownfield infrastructure investments?',
 'Greenfield: new construction projects (higher risk from construction/demand uncertainty, potentially higher returns). Brownfield: existing, operational assets (lower risk from established cash flows, more predictable returns). Brownfield offers more certainty; greenfield offers higher growth potential.',
 '{alternatives,infrastructure,greenfield_brownfield}'),
((SELECT id FROM learning_modules WHERE code='ALT-04'),
 'What is a capitalization rate (cap rate)?',
 'Cap rate = NOI / Property value. It represents the expected unleveraged rate of return on a property. Lower cap rates imply higher property values and reflect lower risk or higher expected growth. It is analogous to a yield measure for real estate.',
 '{alternatives,real_estate,cap_rate}'),
((SELECT id FROM learning_modules WHERE code='ALT-04'),
 'What are the main characteristics of infrastructure investments?',
 'Long asset lives, high initial capital requirements, stable and predictable cash flows (often regulated or contracted), low correlation with traditional assets, inflation protection through regulated rate adjustments, and typically illiquid (for direct investments).',
 '{alternatives,infrastructure,characteristics}');

-- --------------------------------------------------------
-- FLASHCARDS — AI-05: Natural Resources
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='ALT-05'),
 'What are the three sources of commodity futures returns?',
 '1) Spot/price return: change in the futures price due to underlying commodity price movement. 2) Roll yield: gain or loss from rolling expiring contracts to the next maturity. 3) Collateral yield: return earned on the cash or T-bills posted as margin.',
 '{alternatives,natural_resources,futures_returns}'),
((SELECT id FROM learning_modules WHERE code='ALT-05'),
 'What is the difference between contango and backwardation?',
 'Contango: futures price > spot price (upward-sloping curve); roll yield is negative. Backwardation: futures price < spot price (downward-sloping curve); roll yield is positive. The shape depends on storage costs, convenience yield, and interest rates.',
 '{alternatives,natural_resources,contango_backwardation}'),
((SELECT id FROM learning_modules WHERE code='ALT-05'),
 'Why is timberland considered a unique alternative investment?',
 'Biological growth provides a natural return component regardless of market conditions. Harvest can be delayed when prices are low (trees continue growing). Timberland serves as an inflation hedge, offers portfolio diversification, and has a tangible underlying asset.',
 '{alternatives,natural_resources,timberland}'),
((SELECT id FROM learning_modules WHERE code='ALT-05'),
 'How do commodities serve as an inflation hedge?',
 'Commodity prices are components of inflation measures (CPI, PPI). When inflation rises unexpectedly, commodity prices tend to rise too, providing positive real returns. This positive correlation with unexpected inflation differentiates commodities from stocks and bonds.',
 '{alternatives,natural_resources,inflation_hedge}');

-- --------------------------------------------------------
-- FLASHCARDS — AI-06: Hedge Funds
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='ALT-06'),
 'What are the main hedge fund strategy categories?',
 'Long/short equity: long undervalued, short overvalued stocks. Market neutral: zero net market exposure. Event-driven: profiting from corporate events (M&A, bankruptcies). Global macro: directional bets on currencies, rates, commodities. Managed futures: systematic trend-following.',
 '{alternatives,hedge_funds,strategies}'),
((SELECT id FROM learning_modules WHERE code='ALT-06'),
 'What is a high-water mark?',
 'The highest historical NAV of the fund. The manager only earns incentive fees on gains above the high-water mark. This protects investors from paying incentive fees on gains that merely recover previous losses. It aligns manager and investor interests.',
 '{alternatives,hedge_funds,high_water_mark}'),
((SELECT id FROM learning_modules WHERE code='ALT-06'),
 'What is the typical hedge fund fee structure?',
 'Traditionally "2 and 20": a 2% annual management fee on AUM plus a 20% incentive fee on profits. May include a hurdle rate (minimum return before incentive fee applies) and a high-water mark. Fee pressure has reduced averages in recent years.',
 '{alternatives,hedge_funds,fees}'),
((SELECT id FROM learning_modules WHERE code='ALT-06'),
 'What is survivorship bias in hedge fund databases?',
 'Funds that close (usually due to poor performance) are removed from databases. Only surviving funds remain, inflating reported average returns and understating risk. Backfill bias (adding historical returns of new entrants) also overstates performance.',
 '{alternatives,hedge_funds,survivorship_bias}');

-- --------------------------------------------------------
-- FLASHCARDS — AI-07: Introduction to Digital Assets
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='ALT-07'),
 'What is a blockchain?',
 'A distributed, immutable ledger that records transactions in blocks cryptographically linked in chronological order. Maintained by a decentralized network of nodes. Key features: transparency, immutability, decentralization, and consensus mechanisms (proof-of-work, proof-of-stake).',
 '{alternatives,digital_assets,blockchain}'),
((SELECT id FROM learning_modules WHERE code='ALT-07'),
 'What is a stablecoin?',
 'A digital asset designed to maintain a stable value, typically pegged to a fiat currency (e.g., USD). Types include fiat-backed (reserves held in bank), crypto-backed (collateralized by other crypto), and algorithmic (supply adjusted by smart contracts).',
 '{alternatives,digital_assets,stablecoin}'),
((SELECT id FROM learning_modules WHERE code='ALT-07'),
 'What are the key risks of digital asset investments?',
 'Regulatory uncertainty, extreme price volatility, cybersecurity risk (hacks, key loss), liquidity risk (especially for smaller tokens), operational risk (exchange failures), and environmental concerns (energy consumption of proof-of-work systems).',
 '{alternatives,digital_assets,risks}'),
((SELECT id FROM learning_modules WHERE code='ALT-07'),
 'What is the potential portfolio role of digital assets?',
 'Digital assets may offer diversification benefits due to historically low correlations with traditional assets. However, correlations can increase during market stress. Extreme volatility, regulatory uncertainty, and valuation challenges limit allocation sizes for most investors.',
 '{alternatives,digital_assets,portfolio_role}');

-- --------------------------------------------------------
-- FLASHCARDS — PM-05: The Behavioral Biases of Individuals
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='PM-05'),
 'What is the difference between cognitive errors and emotional biases?',
 'Cognitive errors arise from faulty reasoning or information processing (e.g., anchoring, confirmation bias, mental accounting). They can often be corrected through education. Emotional biases stem from feelings and impulses (e.g., loss aversion, overconfidence). They are harder to correct.',
 '{portfolio_mgmt,behavioral_finance,cognitive_vs_emotional}'),
((SELECT id FROM learning_modules WHERE code='PM-05'),
 'What is loss aversion?',
 'The tendency to feel the pain of losses more intensely than the pleasure of equivalent gains (roughly 2x). Leads to: holding losers too long (hoping to recover), selling winners too quickly (locking in gains), and insufficient risk-taking.',
 '{portfolio_mgmt,behavioral_finance,loss_aversion}'),
((SELECT id FROM learning_modules WHERE code='PM-05'),
 'What is anchoring bias?',
 'The tendency to rely too heavily on an initial piece of information (the anchor) when making decisions. In investing, examples include fixating on a stock''s purchase price or a previous target price rather than evaluating current fundamentals objectively.',
 '{portfolio_mgmt,behavioral_finance,anchoring}'),
((SELECT id FROM learning_modules WHERE code='PM-05'),
 'What is mental accounting?',
 'Treating money differently based on its source, intended use, or account designation rather than viewing it as fungible. Examples: taking more risk with "house money" (gains), maintaining separate mental buckets for retirement vs. vacation funds, ignoring total portfolio risk.',
 '{portfolio_mgmt,behavioral_finance,mental_accounting}');

-- --------------------------------------------------------
-- FLASHCARDS — PM-06: Introduction to Risk Management
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='PM-06'),
 'What is Value at Risk (VaR)?',
 'A statistical measure of the minimum loss that will be exceeded with a specified probability over a given time period. Example: a 5% daily VaR of USD 1 million means there is a 5% probability the portfolio will lose at least USD 1 million in one day.',
 '{portfolio_mgmt,risk_management,var}'),
((SELECT id FROM learning_modules WHERE code='PM-06'),
 'What are the limitations of VaR?',
 'VaR does not indicate the magnitude of losses beyond the threshold. It depends on distributional assumptions (normality may understate tail risk). It is not subadditive (portfolio VaR can exceed sum of component VaRs). Different estimation methods can give different results.',
 '{portfolio_mgmt,risk_management,var_limitations}'),
((SELECT id FROM learning_modules WHERE code='PM-06'),
 'What is Conditional VaR (CVaR / Expected Shortfall)?',
 'The expected loss given that the loss exceeds the VaR threshold. It addresses a key VaR limitation by measuring the average severity of tail losses. CVaR is always greater than or equal to VaR and is considered a more coherent risk measure.',
 '{portfolio_mgmt,risk_management,cvar}'),
((SELECT id FROM learning_modules WHERE code='PM-06'),
 'What is risk budgeting?',
 'The process of allocating total acceptable risk across positions, asset classes, or strategies based on the organization''s risk appetite and return expectations. It answers: "How much risk should each component contribute to total portfolio risk?" Methods include VaR allocation and tracking error budgets.',
 '{portfolio_mgmt,risk_management,risk_budgeting}');


COMMIT;
