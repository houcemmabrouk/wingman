-- ============================================================
-- 004_normalize_topics_and_seed_library.sql
-- Normalize topic codes to CFA-standard (matches frontend/lib/lm-data.ts)
-- and seed every learning module from the Library so /api/admin/modules
-- returns the full LM1 catalogue.
-- ============================================================

BEGIN;

-- ── 1. Normalize topic codes ────────────────────────────────
UPDATE topics SET code = 'FSA'  WHERE code = 'FRA';
UPDATE topics SET code = 'CORP' WHERE code = 'CF';
UPDATE topics SET code = 'EQU'  WHERE code = 'EQ';
UPDATE topics SET code = 'ALT'  WHERE code = 'AI';

-- Align topic names with the Library
UPDATE topics SET name = 'Ethical & Professional Standards' WHERE code = 'ETH';
UPDATE topics SET name = 'Quantitative Methods'             WHERE code = 'QM';
UPDATE topics SET name = 'Economics'                         WHERE code = 'ECO';
UPDATE topics SET name = 'Financial Statement Analysis'     WHERE code = 'FSA';
UPDATE topics SET name = 'Corporate Issuers'                 WHERE code = 'CORP';
UPDATE topics SET name = 'Equity Investments'                WHERE code = 'EQU';
UPDATE topics SET name = 'Fixed Income'                       WHERE code = 'FI';
UPDATE topics SET name = 'Derivatives'                        WHERE code = 'DER';
UPDATE topics SET name = 'Alternative Investments'            WHERE code = 'ALT';
UPDATE topics SET name = 'Portfolio Management'               WHERE code = 'PM';

-- ── 2. Rename any existing module codes using old topic prefixes ──
UPDATE learning_modules SET code = REPLACE(code, 'FRA-', 'FSA-')  WHERE code LIKE 'FRA-%';
UPDATE learning_modules SET code = REPLACE(code, 'CF-',  'CORP-') WHERE code LIKE 'CF-%';
UPDATE learning_modules SET code = REPLACE(code, 'EQ-',  'EQU-')  WHERE code LIKE 'EQ-%';
UPDATE learning_modules SET code = REPLACE(code, 'AI-',  'ALT-')  WHERE code LIKE 'AI-%';

-- ── 3. Seed every learning module from the Library ─────────
INSERT INTO learning_modules (topic_id, code, title, sort_order) VALUES
  ((SELECT id FROM topics WHERE code='ETH'),  'ETH-01',  'Ethics and Trust in the Investment Profession',                1),
  ((SELECT id FROM topics WHERE code='ETH'),  'ETH-02',  'Code of Ethics and Standards of Professional Conduct',        2),
  ((SELECT id FROM topics WHERE code='ETH'),  'ETH-03',  'Guidance for Standards I–VII',                                 3),
  ((SELECT id FROM topics WHERE code='ETH'),  'ETH-04',  'Introduction to GIPS',                                         4),
  ((SELECT id FROM topics WHERE code='ETH'),  'ETH-05',  'Ethics Application',                                           5),

  ((SELECT id FROM topics WHERE code='QM'),   'QM-01',   'Rates and Returns',                                            1),
  ((SELECT id FROM topics WHERE code='QM'),   'QM-02',   'Time Value of Money',                                          2),
  ((SELECT id FROM topics WHERE code='QM'),   'QM-03',   'Statistical Measures of Asset Returns',                        3),
  ((SELECT id FROM topics WHERE code='QM'),   'QM-04',   'Probability Trees and Conditional Expectations',               4),
  ((SELECT id FROM topics WHERE code='QM'),   'QM-05',   'Portfolio Mathematics',                                        5),
  ((SELECT id FROM topics WHERE code='QM'),   'QM-06',   'Simulation Methods',                                           6),
  ((SELECT id FROM topics WHERE code='QM'),   'QM-07',   'Estimation and Inference',                                     7),
  ((SELECT id FROM topics WHERE code='QM'),   'QM-08',   'Hypothesis Testing',                                           8),
  ((SELECT id FROM topics WHERE code='QM'),   'QM-09',   'Parametric and Non-Parametric Tests',                          9),
  ((SELECT id FROM topics WHERE code='QM'),   'QM-10',   'Simple Linear Regression',                                    10),
  ((SELECT id FROM topics WHERE code='QM'),   'QM-11',   'Big Data Techniques',                                         11),

  ((SELECT id FROM topics WHERE code='ECO'),  'ECO-01',  'The Firm and Market Structures',                               1),
  ((SELECT id FROM topics WHERE code='ECO'),  'ECO-02',  'Understanding Business Cycles',                                2),
  ((SELECT id FROM topics WHERE code='ECO'),  'ECO-03',  'Fiscal Policy',                                                3),
  ((SELECT id FROM topics WHERE code='ECO'),  'ECO-04',  'Monetary Policy',                                              4),
  ((SELECT id FROM topics WHERE code='ECO'),  'ECO-05',  'Introduction to Geopolitics',                                  5),
  ((SELECT id FROM topics WHERE code='ECO'),  'ECO-06',  'International Trade',                                          6),
  ((SELECT id FROM topics WHERE code='ECO'),  'ECO-07',  'Capital Flows and FX Market',                                  7),
  ((SELECT id FROM topics WHERE code='ECO'),  'ECO-08',  'Exchange Rate Calculations',                                   8),

  ((SELECT id FROM topics WHERE code='CORP'), 'CORP-01', 'Organizational Forms, Features, and Ownership',                1),
  ((SELECT id FROM topics WHERE code='CORP'), 'CORP-02', 'Investors and Other Stakeholders',                             2),
  ((SELECT id FROM topics WHERE code='CORP'), 'CORP-03', 'Corporate Governance',                                         3),
  ((SELECT id FROM topics WHERE code='CORP'), 'CORP-04', 'Working Capital and Liquidity',                                4),
  ((SELECT id FROM topics WHERE code='CORP'), 'CORP-05', 'Capital Investments and Capital Allocation',                   5),
  ((SELECT id FROM topics WHERE code='CORP'), 'CORP-06', 'Capital Structure',                                            6),
  ((SELECT id FROM topics WHERE code='CORP'), 'CORP-07', 'Business Models',                                              7),

  ((SELECT id FROM topics WHERE code='FSA'),  'FSA-01',  'Introduction to Financial Statement Analysis',                 1),
  ((SELECT id FROM topics WHERE code='FSA'),  'FSA-02',  'Analyzing Income Statements',                                  2),
  ((SELECT id FROM topics WHERE code='FSA'),  'FSA-03',  'Analyzing Balance Sheets',                                     3),
  ((SELECT id FROM topics WHERE code='FSA'),  'FSA-04',  'Analyzing Statements of Cash Flows I',                         4),
  ((SELECT id FROM topics WHERE code='FSA'),  'FSA-05',  'Analyzing Statements of Cash Flows II',                        5),
  ((SELECT id FROM topics WHERE code='FSA'),  'FSA-06',  'Analysis of Inventories',                                      6),
  ((SELECT id FROM topics WHERE code='FSA'),  'FSA-07',  'Analysis of Long-Lived Assets',                                7),
  ((SELECT id FROM topics WHERE code='FSA'),  'FSA-08',  'Long-Term Liabilities and Equity',                             8),
  ((SELECT id FROM topics WHERE code='FSA'),  'FSA-09',  'Analysis of Income Taxes',                                     9),
  ((SELECT id FROM topics WHERE code='FSA'),  'FSA-10',  'Financial Reporting Quality',                                 10),
  ((SELECT id FROM topics WHERE code='FSA'),  'FSA-11',  'Financial Analysis Techniques',                               11),
  ((SELECT id FROM topics WHERE code='FSA'),  'FSA-12',  'Financial Statement Modeling',                                12),

  ((SELECT id FROM topics WHERE code='EQU'),  'EQU-01',  'Market Organization and Structure',                            1),
  ((SELECT id FROM topics WHERE code='EQU'),  'EQU-02',  'Security Market Indexes',                                      2),
  ((SELECT id FROM topics WHERE code='EQU'),  'EQU-03',  'Market Efficiency',                                            3),
  ((SELECT id FROM topics WHERE code='EQU'),  'EQU-05',  'Company Analysis: Past and Present',                           5),
  ((SELECT id FROM topics WHERE code='EQU'),  'EQU-06',  'Industry and Competitive Analysis',                            6),
  ((SELECT id FROM topics WHERE code='EQU'),  'EQU-07',  'Company Analysis: Forecasting',                                7),
  ((SELECT id FROM topics WHERE code='EQU'),  'EQU-08',  'Equity Valuation: Concepts and Basic Tools',                   8),

  ((SELECT id FROM topics WHERE code='FI'),   'FI-01',   'Fixed-Income Instrument Features',                              1),
  ((SELECT id FROM topics WHERE code='FI'),   'FI-02',   'Fixed-Income Cash Flows and Types',                             2),
  ((SELECT id FROM topics WHERE code='FI'),   'FI-03',   'Fixed-Income Issuance and Trading',                             3),
  ((SELECT id FROM topics WHERE code='FI'),   'FI-04',   'Fixed-Income Markets for Corporate Issuers',                    4),
  ((SELECT id FROM topics WHERE code='FI'),   'FI-05',   'Fixed-Income Markets for Government Issuers',                   5),
  ((SELECT id FROM topics WHERE code='FI'),   'FI-06',   'Bond Valuation: Prices and Yields',                             6),
  ((SELECT id FROM topics WHERE code='FI'),   'FI-07',   'Yield and Yield Spread Measures for Fixed-Rate Bonds',          7),
  ((SELECT id FROM topics WHERE code='FI'),   'FI-08',   'Yield and Yield Spread Measures for Floating-Rate',             8),
  ((SELECT id FROM topics WHERE code='FI'),   'FI-09',   'Term Structure of Interest Rates',                              9),
  ((SELECT id FROM topics WHERE code='FI'),   'FI-10',   'Interest Rate Risk and Return',                                10),
  ((SELECT id FROM topics WHERE code='FI'),   'FI-11',   'Yield-Based Bond Duration Measures',                           11),
  ((SELECT id FROM topics WHERE code='FI'),   'FI-12',   'Yield-Based Bond Convexity and Portfolio Properties',          12),
  ((SELECT id FROM topics WHERE code='FI'),   'FI-13',   'Curve-Based and Empirical Duration Measures',                  13),
  ((SELECT id FROM topics WHERE code='FI'),   'FI-14',   'Credit Risk',                                                   14),
  ((SELECT id FROM topics WHERE code='FI'),   'FI-15',   'Credit Analysis for Government Issuers',                       15),
  ((SELECT id FROM topics WHERE code='FI'),   'FI-16',   'Credit Analysis for Corporate Issuers',                        16),
  ((SELECT id FROM topics WHERE code='FI'),   'FI-17',   'Fixed-Income Securitization',                                  17),
  ((SELECT id FROM topics WHERE code='FI'),   'FI-18',   'Asset-Backed Security Instruments and Valuation',              18),
  ((SELECT id FROM topics WHERE code='FI'),   'FI-19',   'Mortgage-Backed Security Instruments and Valuation',           19),

  ((SELECT id FROM topics WHERE code='DER'),  'DER-01',  'Derivative Instrument and Market Features',                    1),
  ((SELECT id FROM topics WHERE code='DER'),  'DER-02',  'Forward Commitment and Contingent Claim Features',             2),
  ((SELECT id FROM topics WHERE code='DER'),  'DER-03',  'Derivative Benefits, Risks, and Uses',                          3),
  ((SELECT id FROM topics WHERE code='DER'),  'DER-04',  'Arbitrage, Replication, and Cost of Carry',                     4),
  ((SELECT id FROM topics WHERE code='DER'),  'DER-05',  'Pricing and Valuation of Forward Contracts',                    5),
  ((SELECT id FROM topics WHERE code='DER'),  'DER-06',  'Pricing and Valuation of Futures Contracts',                    6),
  ((SELECT id FROM topics WHERE code='DER'),  'DER-07',  'Pricing and Valuation of Interest Rate Swaps',                  7),
  ((SELECT id FROM topics WHERE code='DER'),  'DER-08',  'Pricing and Valuation of Options',                              8),
  ((SELECT id FROM topics WHERE code='DER'),  'DER-09',  'Option Replication Using Put-Call Parity',                      9),
  ((SELECT id FROM topics WHERE code='DER'),  'DER-10',  'Valuing a Derivative Using a One-Period Binomial Model',       10),

  ((SELECT id FROM topics WHERE code='ALT'),  'ALT-01',  'Alternative Investment Features, Methods, Structures',         1),
  ((SELECT id FROM topics WHERE code='ALT'),  'ALT-02',  'Alternative Investment Performance and Returns',               2),
  ((SELECT id FROM topics WHERE code='ALT'),  'ALT-03',  'Private Capital: Equity and Debt',                             3),
  ((SELECT id FROM topics WHERE code='ALT'),  'ALT-04',  'Real Estate and Infrastructure',                               4),
  ((SELECT id FROM topics WHERE code='ALT'),  'ALT-05',  'Natural Resources',                                            5),
  ((SELECT id FROM topics WHERE code='ALT'),  'ALT-06',  'Hedge Funds',                                                  6),
  ((SELECT id FROM topics WHERE code='ALT'),  'ALT-07',  'Introduction to Digital Assets',                               7),

  ((SELECT id FROM topics WHERE code='PM'),   'PM-01',   'Portfolio Risk and Return: Part I',                             1),
  ((SELECT id FROM topics WHERE code='PM'),   'PM-02',   'Portfolio Risk and Return: Part II',                            2),
  ((SELECT id FROM topics WHERE code='PM'),   'PM-03',   'Portfolio Management: An Overview',                             3),
  ((SELECT id FROM topics WHERE code='PM'),   'PM-04',   'Basics of Portfolio Planning and Construction',                 4),
  ((SELECT id FROM topics WHERE code='PM'),   'PM-05',   'Behavioral Biases of Individuals',                              5),
  ((SELECT id FROM topics WHERE code='PM'),   'PM-06',   'Introduction to Risk Management',                               6)
ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  sort_order = EXCLUDED.sort_order;

COMMIT;
