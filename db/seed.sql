-- ============================================================
-- Wingman — Seed Data
-- 10 CFA Level I Topics + LMs for QM, FI, ETH
-- ============================================================

-- --------------------------------------------------------
-- TOPICS (10 CFA Level I topic areas)
-- --------------------------------------------------------
INSERT INTO topics (code, name, weight_pct, sort_order) VALUES
    ('ETH',  'Ethical & Professional Standards',    15.00, 1),
    ('QM',   'Quantitative Methods',                  10.00, 2),
    ('ECO',  'Economics',                              10.00, 3),
    ('FSA',  'Financial Statement Analysis',          15.00, 4),
    ('CORP', 'Corporate Issuers',                     10.00, 5),
    ('EQU',  'Equity Investments',                    11.00, 6),
    ('FI',   'Fixed Income',                          11.00, 7),
    ('DER',  'Derivatives',                            6.00, 8),
    ('ALT',  'Alternative Investments',                6.00, 9),
    ('PM',   'Portfolio Management',                   6.00, 10);

-- --------------------------------------------------------
-- LEARNING MODULES — Quantitative Methods (11 LMs)
-- --------------------------------------------------------
INSERT INTO learning_modules (topic_id, code, title, sort_order) VALUES
    ((SELECT id FROM topics WHERE code='QM'), 'QM-01', 'Rates and Returns',                        1),
    ((SELECT id FROM topics WHERE code='QM'), 'QM-02', 'Time Value of Money',                      2),
    ((SELECT id FROM topics WHERE code='QM'), 'QM-03', 'Statistical Measures of Asset Returns',     3),
    ((SELECT id FROM topics WHERE code='QM'), 'QM-04', 'Probability Trees and Conditional Expectations', 4),
    ((SELECT id FROM topics WHERE code='QM'), 'QM-05', 'Portfolio Mathematics',                     5),
    ((SELECT id FROM topics WHERE code='QM'), 'QM-06', 'Simulation Methods',                       6),
    ((SELECT id FROM topics WHERE code='QM'), 'QM-07', 'Estimation and Inference',                  7),
    ((SELECT id FROM topics WHERE code='QM'), 'QM-08', 'Hypothesis Testing',                       8),
    ((SELECT id FROM topics WHERE code='QM'), 'QM-09', 'Parametric and Non-Parametric Tests',       9),
    ((SELECT id FROM topics WHERE code='QM'), 'QM-10', 'Simple Linear Regression',                 10),
    ((SELECT id FROM topics WHERE code='QM'), 'QM-11', 'Introduction to Big Data Techniques',       11);

-- --------------------------------------------------------
-- LEARNING MODULES — Fixed Income (10 LMs)
-- --------------------------------------------------------
INSERT INTO learning_modules (topic_id, code, title, sort_order) VALUES
    ((SELECT id FROM topics WHERE code='FI'), 'FI-01', 'Fixed-Income Instrument Features',          1),
    ((SELECT id FROM topics WHERE code='FI'), 'FI-02', 'Fixed-Income Cash Flows and Types',         2),
    ((SELECT id FROM topics WHERE code='FI'), 'FI-03', 'Fixed-Income Issuance and Trading',         3),
    ((SELECT id FROM topics WHERE code='FI'), 'FI-04', 'Fixed-Income Markets for Corporate Issuers', 4),
    ((SELECT id FROM topics WHERE code='FI'), 'FI-05', 'Fixed-Income Markets for Government Issuers', 5),
    ((SELECT id FROM topics WHERE code='FI'), 'FI-06', 'Fixed-Income Bond Valuation',               6),
    ((SELECT id FROM topics WHERE code='FI'), 'FI-07', 'Yield and Yield Spread Measures',           7),
    ((SELECT id FROM topics WHERE code='FI'), 'FI-08', 'Mortgage-Backed Securities',                8),
    ((SELECT id FROM topics WHERE code='FI'), 'FI-09', 'Interest Rate Risk and Return',             9),
    ((SELECT id FROM topics WHERE code='FI'), 'FI-10', 'Credit Risk',                              10);

-- --------------------------------------------------------
-- LEARNING MODULES — Ethical and Professional Standards (5 LMs)
-- --------------------------------------------------------
INSERT INTO learning_modules (topic_id, code, title, sort_order) VALUES
    ((SELECT id FROM topics WHERE code='ETH'), 'ETH-01', 'Ethics and Trust in the Investment Profession', 1),
    ((SELECT id FROM topics WHERE code='ETH'), 'ETH-02', 'Code of Ethics and Standards of Professional Conduct', 2),
    ((SELECT id FROM topics WHERE code='ETH'), 'ETH-03', 'Guidance for Standards I–VII',            3),
    ((SELECT id FROM topics WHERE code='ETH'), 'ETH-04', 'Introduction to the Global Investment Performance Standards (GIPS)', 4),
    ((SELECT id FROM topics WHERE code='ETH'), 'ETH-05', 'Ethics Application',                     5);
