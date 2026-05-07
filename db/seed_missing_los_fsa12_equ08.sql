-- ============================================================
-- Wingman — Seed LOS for FSA-12 & EQU-08
-- Completes the 25 modules already covered by
-- seed_missing_modules.sql, bringing total to 27.
-- ============================================================

BEGIN;

-- --------------------------------------------------------
-- FSA-12: Financial Statement Modeling
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
((SELECT id FROM learning_modules WHERE code='FSA-12'), 'FSA-12-LO01', 'Describe the steps in building an integrated three-statement model linking the income statement, balance sheet, and cash flow statement', 2, 1),
((SELECT id FROM learning_modules WHERE code='FSA-12'), 'FSA-12-LO02', 'Forecast key revenue, expense, and balance sheet line items using historical data and explicit assumptions', 3, 2),
((SELECT id FROM learning_modules WHERE code='FSA-12'), 'FSA-12-LO03', 'Analyze the sensitivity of model outputs to changes in key assumptions and identify reasonable forecast ranges', 4, 3)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- EQU-08: Equity Valuation: Concepts and Basic Tools
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
((SELECT id FROM learning_modules WHERE code='EQU-08'), 'EQU-08-LO01', 'Describe major categories of equity valuation models including present value, multiplier, and asset-based valuation', 2, 1),
((SELECT id FROM learning_modules WHERE code='EQU-08'), 'EQU-08-LO02', 'Calculate the intrinsic value of common shares using the dividend discount model (DDM) and the Gordon growth model', 3, 2),
((SELECT id FROM learning_modules WHERE code='EQU-08'), 'EQU-08-LO03', 'Compare relative valuation multiples (P/E, P/B, P/S, EV/EBITDA) and explain the strengths and limitations of each approach', 4, 3)
ON CONFLICT (code) DO NOTHING;

COMMIT;
