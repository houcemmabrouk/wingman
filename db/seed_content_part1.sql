-- ============================================================
-- Wingman — Seed Content Part 1
-- Topics: Economics (ECO), Financial Statement Analysis (FRA),
--         Corporate Issuers (CF)
-- ============================================================

-- ============================================================
-- TASK 1: LEARNING MODULES
-- ============================================================

-- --------------------------------------------------------
-- LEARNING MODULES — Economics (8 LMs)
-- --------------------------------------------------------
INSERT INTO learning_modules (topic_id, code, title, sort_order) VALUES
    ((SELECT id FROM topics WHERE code='ECO'), 'ECO-01', 'Firms and Market Structures', 1),
    ((SELECT id FROM topics WHERE code='ECO'), 'ECO-02', 'Understanding Business Cycles', 2),
    ((SELECT id FROM topics WHERE code='ECO'), 'ECO-03', 'Fiscal Policy', 3),
    ((SELECT id FROM topics WHERE code='ECO'), 'ECO-04', 'Monetary Policy', 4),
    ((SELECT id FROM topics WHERE code='ECO'), 'ECO-05', 'Introduction to Geopolitics', 5),
    ((SELECT id FROM topics WHERE code='ECO'), 'ECO-06', 'International Trade', 6),
    ((SELECT id FROM topics WHERE code='ECO'), 'ECO-07', 'Capital Flows and the FX Market', 7),
    ((SELECT id FROM topics WHERE code='ECO'), 'ECO-08', 'Exchange Rate Calculations', 8)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- LEARNING MODULES — Financial Statement Analysis (10 LMs)
-- --------------------------------------------------------
INSERT INTO learning_modules (topic_id, code, title, sort_order) VALUES
    ((SELECT id FROM topics WHERE code='FSA'), 'FSA-01', 'Introduction to Financial Statement Analysis', 1),
    ((SELECT id FROM topics WHERE code='FSA'), 'FSA-02', 'Analyzing Income Statements', 2),
    ((SELECT id FROM topics WHERE code='FSA'), 'FSA-03', 'Analyzing Balance Sheets', 3),
    ((SELECT id FROM topics WHERE code='FSA'), 'FSA-04', 'Analyzing Statements of Cash Flows', 4),
    ((SELECT id FROM topics WHERE code='FSA'), 'FSA-05', 'Analysis of Inventories', 5),
    ((SELECT id FROM topics WHERE code='FSA'), 'FSA-06', 'Analysis of Long-Lived Assets', 6),
    ((SELECT id FROM topics WHERE code='FSA'), 'FSA-07', 'Analysis of Income Taxes', 7),
    ((SELECT id FROM topics WHERE code='FSA'), 'FSA-08', 'Analysis of Long-Term Liabilities', 8),
    ((SELECT id FROM topics WHERE code='FSA'), 'FSA-09', 'Financial Reporting Quality', 9),
    ((SELECT id FROM topics WHERE code='FSA'), 'FSA-10', 'Financial Analysis Techniques', 10)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- LEARNING MODULES — Corporate Issuers (5 LMs)
-- --------------------------------------------------------
INSERT INTO learning_modules (topic_id, code, title, sort_order) VALUES
    ((SELECT id FROM topics WHERE code='CORP'), 'CORP-01', 'Organizational Forms, Corporate Issuer Features, and Ownership', 1),
    ((SELECT id FROM topics WHERE code='CORP'), 'CORP-02', 'Investors and Other Stakeholders', 2),
    ((SELECT id FROM topics WHERE code='CORP'), 'CORP-03', 'Corporate Governance: Conflicts, Mechanisms, Risks, and Benefits', 3),
    ((SELECT id FROM topics WHERE code='CORP'), 'CORP-04', 'Working Capital and Liquidity', 4),
    ((SELECT id FROM topics WHERE code='CORP'), 'CORP-05', 'Capital Investments and Capital Allocation', 5)
ON CONFLICT (code) DO NOTHING;


-- ============================================================
-- TASK 2: LEARNING OUTCOMES
-- ============================================================

-- --------------------------------------------------------
-- LEARNING OUTCOMES — Economics
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
-- ECO-01: Firms and Market Structures
((SELECT id FROM learning_modules WHERE code='ECO-01'), 'ECO-01-LO01', 'Describe the characteristics of perfect competition, monopolistic competition, oligopoly, and monopoly', 2, 1),
((SELECT id FROM learning_modules WHERE code='ECO-01'), 'ECO-01-LO02', 'Explain the factors that determine the pricing and output decisions of firms under each market structure', 2, 2),
((SELECT id FROM learning_modules WHERE code='ECO-01'), 'ECO-01-LO03', 'Describe the use and limitations of concentration measures in identifying market structure', 2, 3),
((SELECT id FROM learning_modules WHERE code='ECO-01'), 'ECO-01-LO04', 'Identify the type of market structure a firm operates in and analyze the effects on pricing power and long-run equilibrium', 4, 4),

-- ECO-02: Understanding Business Cycles
((SELECT id FROM learning_modules WHERE code='ECO-02'), 'ECO-02-LO01', 'Describe the phases of the business cycle and their typical characteristics', 2, 1),
((SELECT id FROM learning_modules WHERE code='ECO-02'), 'ECO-02-LO02', 'Describe theories of the business cycle including Keynesian, monetarist, and Austrian perspectives', 2, 2),
((SELECT id FROM learning_modules WHERE code='ECO-02'), 'ECO-02-LO03', 'Describe types of unemployment and interpret unemployment indicators', 2, 3),
((SELECT id FROM learning_modules WHERE code='ECO-02'), 'ECO-02-LO04', 'Explain inflation, deflation, and disinflation and interpret price indices such as CPI and GDP deflator', 2, 4),

-- ECO-03: Fiscal Policy
((SELECT id FROM learning_modules WHERE code='ECO-03'), 'ECO-03-LO01', 'Describe the roles and objectives of fiscal policy including the tools used by governments', 2, 1),
((SELECT id FROM learning_modules WHERE code='ECO-03'), 'ECO-03-LO02', 'Explain the multiplier effect and the balanced budget multiplier', 2, 2),
((SELECT id FROM learning_modules WHERE code='ECO-03'), 'ECO-03-LO03', 'Describe the limitations of fiscal policy including implementation lags and crowding out', 2, 3),

-- ECO-04: Monetary Policy
((SELECT id FROM learning_modules WHERE code='ECO-04'), 'ECO-04-LO01', 'Describe the roles and objectives of central banks and the tools of monetary policy', 2, 1),
((SELECT id FROM learning_modules WHERE code='ECO-04'), 'ECO-04-LO02', 'Explain the monetary transmission mechanism and how monetary policy affects the economy', 2, 2),
((SELECT id FROM learning_modules WHERE code='ECO-04'), 'ECO-04-LO03', 'Compare expansionary and contractionary monetary policy and their expected effects on interest rates, asset prices, and economic growth', 4, 3),
((SELECT id FROM learning_modules WHERE code='ECO-04'), 'ECO-04-LO04', 'Describe the qualities of effective central banks and the limitations of monetary policy', 2, 4),

-- ECO-05: Introduction to Geopolitics
((SELECT id FROM learning_modules WHERE code='ECO-05'), 'ECO-05-LO01', 'Describe geopolitics and explain the role of geopolitical risk in investment analysis', 2, 1),
((SELECT id FROM learning_modules WHERE code='ECO-05'), 'ECO-05-LO02', 'Describe the tools of geopolitics including national security, espionage, and armed conflict', 2, 2),
((SELECT id FROM learning_modules WHERE code='ECO-05'), 'ECO-05-LO03', 'Describe how geopolitical risk affects economies, industries, and investment portfolios', 2, 3),

-- ECO-06: International Trade
((SELECT id FROM learning_modules WHERE code='ECO-06'), 'ECO-06-LO01', 'Compare absolute and comparative advantage and explain the gains from trade', 2, 1),
((SELECT id FROM learning_modules WHERE code='ECO-06'), 'ECO-06-LO02', 'Describe trade restrictions and their effects including tariffs, quotas, and export subsidies', 2, 2),
((SELECT id FROM learning_modules WHERE code='ECO-06'), 'ECO-06-LO03', 'Explain the impact of trading blocs, common markets, and economic unions on international trade', 2, 3),

-- ECO-07: Capital Flows and the FX Market
((SELECT id FROM learning_modules WHERE code='ECO-07'), 'ECO-07-LO01', 'Describe the balance of payments accounts including the current account, capital account, and financial account', 2, 1),
((SELECT id FROM learning_modules WHERE code='ECO-07'), 'ECO-07-LO02', 'Explain the relationships between the balance of payments accounts', 2, 2),
((SELECT id FROM learning_modules WHERE code='ECO-07'), 'ECO-07-LO03', 'Describe the foreign exchange market and its functions including the roles of market participants', 2, 3),

-- ECO-08: Exchange Rate Calculations
((SELECT id FROM learning_modules WHERE code='ECO-08'), 'ECO-08-LO01', 'Calculate and interpret currency cross-rates', 3, 1),
((SELECT id FROM learning_modules WHERE code='ECO-08'), 'ECO-08-LO02', 'Explain the arbitrage relationship between spot and forward exchange rates and interest rates', 2, 2),
((SELECT id FROM learning_modules WHERE code='ECO-08'), 'ECO-08-LO03', 'Calculate the forward premium or discount and interpret its economic meaning', 3, 3),
((SELECT id FROM learning_modules WHERE code='ECO-08'), 'ECO-08-LO04', 'Explain the international Fisher effect and the purchasing power parity relationship', 2, 4)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- LEARNING OUTCOMES — Financial Statement Analysis
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
-- FRA-01: Introduction to Financial Statement Analysis
((SELECT id FROM learning_modules WHERE code='FSA-01'), 'FSA-01-LO01', 'Describe the roles of financial reporting and financial statement analysis', 2, 1),
((SELECT id FROM learning_modules WHERE code='FSA-01'), 'FSA-01-LO02', 'Describe the key financial statements and the information each provides', 2, 2),
((SELECT id FROM learning_modules WHERE code='FSA-01'), 'FSA-01-LO03', 'Describe the importance of financial statement notes, supplementary information, and management commentary', 2, 3),
((SELECT id FROM learning_modules WHERE code='FSA-01'), 'FSA-01-LO04', 'Describe the objective of audits of financial statements, the types of audit opinions, and the importance of internal controls', 2, 4),

-- FRA-02: Analyzing Income Statements
((SELECT id FROM learning_modules WHERE code='FSA-02'), 'FSA-02-LO01', 'Describe the components of the income statement and distinguish between revenue, expenses, gains, and losses', 2, 1),
((SELECT id FROM learning_modules WHERE code='FSA-02'), 'FSA-02-LO02', 'Describe and compare revenue recognition methods under IFRS and US GAAP', 2, 2),
((SELECT id FROM learning_modules WHERE code='FSA-02'), 'FSA-02-LO03', 'Calculate and interpret gross profit margin, operating profit margin, and net profit margin', 3, 3),
((SELECT id FROM learning_modules WHERE code='FSA-02'), 'FSA-02-LO04', 'Describe the treatment of non-recurring items and discontinued operations on the income statement', 2, 4),

-- FRA-03: Analyzing Balance Sheets
((SELECT id FROM learning_modules WHERE code='FSA-03'), 'FSA-03-LO01', 'Describe the elements of the balance sheet including assets, liabilities, and equity', 2, 1),
((SELECT id FROM learning_modules WHERE code='FSA-03'), 'FSA-03-LO02', 'Compare current and non-current assets and liabilities', 2, 2),
((SELECT id FROM learning_modules WHERE code='FSA-03'), 'FSA-03-LO03', 'Calculate and interpret liquidity and solvency ratios derived from the balance sheet', 3, 3),
((SELECT id FROM learning_modules WHERE code='FSA-03'), 'FSA-03-LO04', 'Describe the measurement bases for assets and liabilities including historical cost, amortized cost, and fair value', 2, 4),

-- FRA-04: Analyzing Statements of Cash Flows
((SELECT id FROM learning_modules WHERE code='FSA-04'), 'FSA-04-LO01', 'Compare cash flows from operating, investing, and financing activities', 2, 1),
((SELECT id FROM learning_modules WHERE code='FSA-04'), 'FSA-04-LO02', 'Describe how non-cash transactions, the direct method, and the indirect method affect the cash flow statement', 2, 2),
((SELECT id FROM learning_modules WHERE code='FSA-04'), 'FSA-04-LO03', 'Calculate and interpret free cash flow to the firm (FCFF) and free cash flow to equity (FCFE)', 3, 3),
((SELECT id FROM learning_modules WHERE code='FSA-04'), 'FSA-04-LO04', 'Analyze a company''s cash flow statement to assess its liquidity, solvency, and financial flexibility', 4, 4),

-- FRA-05: Analysis of Inventories
((SELECT id FROM learning_modules WHERE code='FSA-05'), 'FSA-05-LO01', 'Describe the cost flow methods of inventory valuation including FIFO, LIFO, and weighted average cost', 2, 1),
((SELECT id FROM learning_modules WHERE code='FSA-05'), 'FSA-05-LO02', 'Calculate and compare the effect of different inventory cost flow methods on cost of goods sold, gross profit, and ending inventory', 3, 2),
((SELECT id FROM learning_modules WHERE code='FSA-05'), 'FSA-05-LO03', 'Calculate and interpret the LIFO reserve and its effect when adjusting LIFO financial statements to a FIFO basis', 3, 3),
((SELECT id FROM learning_modules WHERE code='FSA-05'), 'FSA-05-LO04', 'Describe the measurement of inventory at the lower of cost and net realizable value and its financial statement effects', 2, 4),

-- FRA-06: Analysis of Long-Lived Assets
((SELECT id FROM learning_modules WHERE code='FSA-06'), 'FSA-06-LO01', 'Describe the capitalization versus expensing decision and its effects on financial statements and ratios', 2, 1),
((SELECT id FROM learning_modules WHERE code='FSA-06'), 'FSA-06-LO02', 'Calculate depreciation expense using the straight-line, declining balance, and units-of-production methods', 3, 2),
((SELECT id FROM learning_modules WHERE code='FSA-06'), 'FSA-06-LO03', 'Describe the revaluation model and the impairment of long-lived assets under IFRS and US GAAP', 2, 3),
((SELECT id FROM learning_modules WHERE code='FSA-06'), 'FSA-06-LO04', 'Analyze the effects of asset capitalization, depreciation method, and useful life estimates on financial statements', 4, 4),

-- FRA-07: Analysis of Income Taxes
((SELECT id FROM learning_modules WHERE code='FSA-07'), 'FSA-07-LO01', 'Describe the differences between accounting profit and taxable income and explain how deferred tax assets and liabilities arise', 2, 1),
((SELECT id FROM learning_modules WHERE code='FSA-07'), 'FSA-07-LO02', 'Calculate the tax base of an asset or liability and determine the related deferred tax item', 3, 2),
((SELECT id FROM learning_modules WHERE code='FSA-07'), 'FSA-07-LO03', 'Calculate income tax expense, income tax payable, and deferred tax items', 3, 3),
((SELECT id FROM learning_modules WHERE code='FSA-07'), 'FSA-07-LO04', 'Describe the valuation allowance for deferred tax assets and explain when it is required', 2, 4),

-- FRA-08: Analysis of Long-Term Liabilities
((SELECT id FROM learning_modules WHERE code='FSA-08'), 'FSA-08-LO01', 'Describe the initial recognition and subsequent measurement of bonds payable issued at par, at a discount, and at a premium', 2, 1),
((SELECT id FROM learning_modules WHERE code='FSA-08'), 'FSA-08-LO02', 'Calculate interest expense for bonds issued at par, at a discount, and at a premium using the effective interest method', 3, 2),
((SELECT id FROM learning_modules WHERE code='FSA-08'), 'FSA-08-LO03', 'Describe the financial statement presentation and disclosure of operating and finance leases under IFRS and US GAAP', 2, 3),
((SELECT id FROM learning_modules WHERE code='FSA-08'), 'FSA-08-LO04', 'Determine the effect of issuing debt versus equity on a company''s financial ratios', 3, 4),

-- FRA-09: Financial Reporting Quality
((SELECT id FROM learning_modules WHERE code='FSA-09'), 'FSA-09-LO01', 'Distinguish between financial reporting quality and earnings quality', 2, 1),
((SELECT id FROM learning_modules WHERE code='FSA-09'), 'FSA-09-LO02', 'Describe potential problems that affect the quality of financial reports including revenue recognition and expense recognition issues', 2, 2),
((SELECT id FROM learning_modules WHERE code='FSA-09'), 'FSA-09-LO03', 'Describe common accounting warning signs and red flags in financial statements', 2, 3),

-- FRA-10: Financial Analysis Techniques
((SELECT id FROM learning_modules WHERE code='FSA-10'), 'FSA-10-LO01', 'Describe common-size analysis and its applications', 2, 1),
((SELECT id FROM learning_modules WHERE code='FSA-10'), 'FSA-10-LO02', 'Calculate and interpret activity, liquidity, solvency, and profitability ratios', 3, 2),
((SELECT id FROM learning_modules WHERE code='FSA-10'), 'FSA-10-LO03', 'Describe the DuPont decomposition of return on equity and calculate its components', 3, 3),
((SELECT id FROM learning_modules WHERE code='FSA-10'), 'FSA-10-LO04', 'Analyze and interpret financial ratios to evaluate a company''s performance and financial condition', 4, 4)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- LEARNING OUTCOMES — Corporate Issuers
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
-- CF-01: Organizational Forms, Corporate Issuer Features, and Ownership
((SELECT id FROM learning_modules WHERE code='CORP-01'), 'CORP-01-LO01', 'Compare business structures including sole proprietorships, partnerships, and corporations and describe their key features', 2, 1),
((SELECT id FROM learning_modules WHERE code='CORP-01'), 'CORP-01-LO02', 'Describe key features of corporate issuers including limited liability, perpetual life, and transferability of ownership', 2, 2),
((SELECT id FROM learning_modules WHERE code='CORP-01'), 'CORP-01-LO03', 'Distinguish between public and private equity and describe the processes by which companies go public', 2, 3),

-- CF-02: Investors and Other Stakeholders
((SELECT id FROM learning_modules WHERE code='CORP-02'), 'CORP-02-LO01', 'Describe the interests and roles of shareholders, creditors, and other stakeholders', 2, 1),
((SELECT id FROM learning_modules WHERE code='CORP-02'), 'CORP-02-LO02', 'Describe the principal-agent relationship and the agency costs arising from conflicts of interest', 2, 2),
((SELECT id FROM learning_modules WHERE code='CORP-02'), 'CORP-02-LO03', 'Describe mechanisms that mitigate information asymmetry between shareholders and managers', 2, 3),

-- CF-03: Corporate Governance
((SELECT id FROM learning_modules WHERE code='CORP-03'), 'CORP-03-LO01', 'Describe corporate governance and the objectives and core attributes of an effective corporate governance framework', 2, 1),
((SELECT id FROM learning_modules WHERE code='CORP-03'), 'CORP-03-LO02', 'Describe the conflicts of interest among shareholders, the board of directors, managers, creditors, and other stakeholders', 2, 2),
((SELECT id FROM learning_modules WHERE code='CORP-03'), 'CORP-03-LO03', 'Describe corporate governance mechanisms including the role of the board of directors, audit committees, and executive compensation', 2, 3),
((SELECT id FROM learning_modules WHERE code='CORP-03'), 'CORP-03-LO04', 'Describe environmental, social, and governance (ESG) considerations in investment analysis', 2, 4),

-- CF-04: Working Capital and Liquidity
((SELECT id FROM learning_modules WHERE code='CORP-04'), 'CORP-04-LO01', 'Describe primary and secondary sources of liquidity and the factors that influence a company''s liquidity position', 2, 1),
((SELECT id FROM learning_modules WHERE code='CORP-04'), 'CORP-04-LO02', 'Calculate and interpret operating and cash conversion cycles', 3, 2),
((SELECT id FROM learning_modules WHERE code='CORP-04'), 'CORP-04-LO03', 'Evaluate the management of accounts receivable, inventory, and accounts payable and their effects on a company''s liquidity', 4, 3),

-- CF-05: Capital Investments and Capital Allocation
((SELECT id FROM learning_modules WHERE code='CORP-05'), 'CORP-05-LO01', 'Describe the capital allocation process and the principles of capital budgeting', 2, 1),
((SELECT id FROM learning_modules WHERE code='CORP-05'), 'CORP-05-LO02', 'Calculate and interpret net present value (NPV), internal rate of return (IRR), and payback period', 3, 2),
((SELECT id FROM learning_modules WHERE code='CORP-05'), 'CORP-05-LO03', 'Describe the common capital allocation pitfalls and real options in capital investments', 2, 3),
((SELECT id FROM learning_modules WHERE code='CORP-05'), 'CORP-05-LO04', 'Calculate and interpret the cost of capital and its components', 3, 4)
ON CONFLICT (code) DO NOTHING;


-- ============================================================
-- TASK 3: QUESTIONS (5 per module)
-- ============================================================

-- --------------------------------------------------------
-- QUESTIONS — ECO-01: Firms and Market Structures
-- --------------------------------------------------------
INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='ECO-01'),
 (SELECT id FROM learning_outcomes WHERE code='ECO-01-LO01'),
 'A market structure characterized by many firms producing differentiated products with low barriers to entry is best described as:',
 'Monopolistic competition',
 'Perfect competition',
 'Oligopoly',
 'A',
 'Monopolistic competition features many firms, differentiated products, and low barriers to entry. Perfect competition has homogeneous products. Oligopoly has few firms and high barriers to entry.',
 2),
((SELECT id FROM learning_modules WHERE code='ECO-01'),
 (SELECT id FROM learning_outcomes WHERE code='ECO-01-LO02'),
 'In perfect competition, a firm maximizes profit by producing the quantity at which:',
 'Marginal revenue equals marginal cost',
 'Average total cost is minimized',
 'Total revenue is maximized',
 'A',
 'In perfect competition (and all market structures), profit is maximized where MR = MC. Minimizing ATC or maximizing TR does not necessarily maximize profit.',
 2),
((SELECT id FROM learning_modules WHERE code='ECO-01'),
 (SELECT id FROM learning_outcomes WHERE code='ECO-01-LO03'),
 'The Herfindahl-Hirschman Index (HHI) for an industry with four firms holding market shares of 40%, 30%, 20%, and 10% is closest to:',
 '2,500',
 '3,000',
 '2,000',
 'B',
 'HHI = 40^2 + 30^2 + 20^2 + 10^2 = 1600 + 900 + 400 + 100 = 3,000. An HHI above 2,500 indicates a highly concentrated market.',
 3),
((SELECT id FROM learning_modules WHERE code='ECO-01'),
 (SELECT id FROM learning_outcomes WHERE code='ECO-01-LO04'),
 'Which market structure is most likely associated with a firm that is a price taker?',
 'Monopoly',
 'Oligopoly',
 'Perfect competition',
 'C',
 'In perfect competition, firms are price takers because they sell homogeneous products and have no market power. Firms in monopoly and oligopoly have some degree of pricing power.',
 1),
((SELECT id FROM learning_modules WHERE code='ECO-01'),
 (SELECT id FROM learning_outcomes WHERE code='ECO-01-LO01'),
 'An oligopolistic firm is most likely to consider the potential reaction of its competitors when making:',
 'Hiring decisions',
 'Pricing and output decisions',
 'Dividend payment decisions',
 'B',
 'A defining feature of oligopoly is the interdependence of firms. Each firm must consider the potential reactions of rivals when making pricing and output decisions.',
 2);

-- --------------------------------------------------------
-- QUESTIONS — ECO-02: Understanding Business Cycles
-- --------------------------------------------------------
INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='ECO-02'),
 (SELECT id FROM learning_outcomes WHERE code='ECO-02-LO01'),
 'During the expansion phase of a business cycle, which of the following is most likely to increase?',
 'Unemployment rate',
 'Inventory-to-sales ratio',
 'Industrial production and consumer spending',
 'C',
 'During expansions, industrial production and consumer spending typically increase while the unemployment rate falls and the inventory-to-sales ratio tends to decrease.',
 2),
((SELECT id FROM learning_modules WHERE code='ECO-02'),
 (SELECT id FROM learning_outcomes WHERE code='ECO-02-LO02'),
 'A leading economic indicator is most likely:',
 'Industrial production',
 'Average weekly hours in manufacturing',
 'Average duration of unemployment',
 'B',
 'Average weekly hours in manufacturing is a leading indicator because employers adjust hours before hiring or laying off workers. Industrial production is a coincident indicator. Average duration of unemployment is a lagging indicator.',
 3),
((SELECT id FROM learning_modules WHERE code='ECO-02'),
 (SELECT id FROM learning_outcomes WHERE code='ECO-02-LO03'),
 'Structural unemployment is best described as unemployment caused by:',
 'A decline in aggregate demand during a recession',
 'Workers transitioning between jobs',
 'Long-term changes in the economy that reduce demand for certain skills',
 'C',
 'Structural unemployment results from changes in the economy (e.g., technological change) that create mismatches between worker skills and available jobs. Choice A describes cyclical unemployment, and choice B describes frictional unemployment.',
 2),
((SELECT id FROM learning_modules WHERE code='ECO-02'),
 (SELECT id FROM learning_outcomes WHERE code='ECO-02-LO04'),
 'Stagflation is best described as a period of:',
 'High economic growth and high inflation',
 'High inflation and high unemployment',
 'Low inflation and low unemployment',
 'B',
 'Stagflation refers to a period of simultaneously high inflation and high unemployment, often resulting from negative supply shocks.',
 2),
((SELECT id FROM learning_modules WHERE code='ECO-02'),
 (SELECT id FROM learning_outcomes WHERE code='ECO-02-LO01'),
 'The GDP deflator differs from the consumer price index (CPI) in that the GDP deflator:',
 'Measures price changes for a fixed basket of goods',
 'Includes only domestically produced goods and services',
 'Uses base-period quantities as weights',
 'B',
 'The GDP deflator reflects prices of all domestically produced goods and services, while the CPI measures a fixed basket of consumer goods including imports. The CPI uses base-period quantities; the GDP deflator uses current-period quantities.',
 3);

-- --------------------------------------------------------
-- QUESTIONS — ECO-03: Fiscal Policy
-- --------------------------------------------------------
INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='ECO-03'),
 (SELECT id FROM learning_outcomes WHERE code='ECO-03-LO01'),
 'Which of the following is an example of an automatic stabilizer?',
 'A new infrastructure spending program approved by the legislature',
 'Progressive income taxes and unemployment insurance benefits',
 'A central bank reducing interest rates',
 'B',
 'Progressive income taxes and unemployment benefits automatically adjust with economic conditions without requiring new legislation. Infrastructure spending is discretionary fiscal policy. Interest rate changes are monetary policy.',
 2),
((SELECT id FROM learning_modules WHERE code='ECO-03'),
 (SELECT id FROM learning_outcomes WHERE code='ECO-03-LO02'),
 'The fiscal multiplier is most likely to be larger when:',
 'The marginal propensity to consume is higher',
 'The economy is at full capacity',
 'Tax rates are higher',
 'A',
 'A higher marginal propensity to consume means that a greater fraction of additional income is spent, amplifying the multiplier effect. At full capacity, crowding out reduces the multiplier. Higher tax rates reduce disposable income at each round, lowering the multiplier.',
 3),
((SELECT id FROM learning_modules WHERE code='ECO-03'),
 (SELECT id FROM learning_outcomes WHERE code='ECO-03-LO03'),
 'Crowding out most likely occurs when increased government borrowing:',
 'Decreases the money supply',
 'Raises interest rates, reducing private investment',
 'Increases net exports',
 'B',
 'Crowding out occurs when government borrowing raises interest rates, making it more expensive for the private sector to borrow and invest, thus partially offsetting the stimulus effect of fiscal policy.',
 2),
((SELECT id FROM learning_modules WHERE code='ECO-03'),
 (SELECT id FROM learning_outcomes WHERE code='ECO-03-LO01'),
 'The recognition lag in fiscal policy is best described as the time between:',
 'When a policy is enacted and when it affects the economy',
 'When an economic problem occurs and when policymakers become aware of it',
 'When policymakers decide on a policy and when it is implemented',
 'B',
 'The recognition lag is the delay between the onset of an economic problem and when it is identified by policymakers. The action lag is the time between recognition and enactment, and the impact lag is the delay between enactment and economic effect.',
 2),
((SELECT id FROM learning_modules WHERE code='ECO-03'),
 (SELECT id FROM learning_outcomes WHERE code='ECO-03-LO02'),
 'An economy is in recession with an output gap of EUR 50 billion and a fiscal multiplier of 2.5. To close the output gap, the government should increase spending by approximately:',
 'EUR 125 billion',
 'EUR 20 billion',
 'EUR 50 billion',
 'B',
 'Required spending increase = Output gap / Multiplier = 50 / 2.5 = EUR 20 billion. With a multiplier of 2.5, a EUR 20 billion increase in spending would expand output by EUR 50 billion.',
 3);

-- --------------------------------------------------------
-- QUESTIONS — ECO-04: Monetary Policy
-- --------------------------------------------------------
INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='ECO-04'),
 (SELECT id FROM learning_outcomes WHERE code='ECO-04-LO01'),
 'The primary objective of most central banks is to:',
 'Maximize employment',
 'Maintain price stability',
 'Stabilize the exchange rate',
 'B',
 'While mandates vary, the primary objective of most central banks is maintaining price stability (controlling inflation). Some, like the US Federal Reserve, also have a dual mandate that includes maximum employment.',
 1),
((SELECT id FROM learning_modules WHERE code='ECO-04'),
 (SELECT id FROM learning_outcomes WHERE code='ECO-04-LO02'),
 'An open market purchase of government securities by the central bank is most likely to:',
 'Decrease the money supply and increase interest rates',
 'Increase the money supply and decrease interest rates',
 'Decrease the money supply and decrease interest rates',
 'B',
 'When the central bank purchases securities, it injects reserves into the banking system, increasing the money supply and putting downward pressure on short-term interest rates.',
 2),
((SELECT id FROM learning_modules WHERE code='ECO-04'),
 (SELECT id FROM learning_outcomes WHERE code='ECO-04-LO03'),
 'When nominal interest rates approach zero, a central bank is most likely to use:',
 'Increases in the policy rate',
 'Increases in reserve requirements',
 'Quantitative easing',
 'C',
 'When conventional monetary policy is constrained by the zero lower bound, central banks may resort to unconventional measures such as quantitative easing (large-scale asset purchases) to further stimulate the economy.',
 3),
((SELECT id FROM learning_modules WHERE code='ECO-04'),
 (SELECT id FROM learning_outcomes WHERE code='ECO-04-LO04'),
 'The neutral rate of interest is best described as the rate at which:',
 'Inflation is zero',
 'Monetary policy is neither stimulative nor contractionary',
 'The central bank lends to commercial banks',
 'B',
 'The neutral rate is the policy rate at which monetary policy is neither expansionary nor contractionary. It is consistent with stable inflation and the economy operating at its potential output.',
 2),
((SELECT id FROM learning_modules WHERE code='ECO-04'),
 (SELECT id FROM learning_outcomes WHERE code='ECO-04-LO01'),
 'Inflation targeting as a monetary policy framework is most likely characterized by:',
 'Fixing the exchange rate to a major currency',
 'Announcing a specific numeric inflation goal and adjusting policy to achieve it',
 'Targeting a specific growth rate of the money supply',
 'B',
 'Inflation targeting involves a central bank publicly announcing a numerical target for inflation and adjusting its policy rate to achieve that target over a specified time horizon.',
 2);

-- --------------------------------------------------------
-- QUESTIONS — ECO-05: Introduction to Geopolitics
-- --------------------------------------------------------
INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='ECO-05'),
 (SELECT id FROM learning_outcomes WHERE code='ECO-05-LO01'),
 'Geopolitical risk is best described as the risk associated with:',
 'Unexpected changes in monetary policy',
 'Tensions among countries or regions that affect the normal course of international affairs',
 'Changes in environmental regulations',
 'B',
 'Geopolitical risk arises from tensions, conflicts, and power struggles among nations or regions that can disrupt economic activity, trade, and financial markets.',
 1),
((SELECT id FROM learning_modules WHERE code='ECO-05'),
 (SELECT id FROM learning_outcomes WHERE code='ECO-05-LO02'),
 'Which of the following is most likely a tool of geopolitics used to exert economic pressure?',
 'Quantitative easing',
 'Economic sanctions and trade embargoes',
 'Inflation targeting',
 'B',
 'Economic sanctions and trade embargoes are tools of geopolitics used to exert economic pressure on other nations. QE and inflation targeting are tools of monetary policy.',
 2),
((SELECT id FROM learning_modules WHERE code='ECO-05'),
 (SELECT id FROM learning_outcomes WHERE code='ECO-05-LO03'),
 'An investor analyzing the impact of geopolitical risk on a portfolio would most likely consider:',
 'Only the direct effect on the country in conflict',
 'Supply chain disruptions, commodity price shocks, and capital flow changes',
 'Only the impact on domestic equity markets',
 'B',
 'Geopolitical risk can have widespread effects including supply chain disruptions, commodity price shocks, shifts in capital flows, and changes in risk premiums across multiple asset classes and geographies.',
 3),
((SELECT id FROM learning_modules WHERE code='ECO-05'),
 (SELECT id FROM learning_outcomes WHERE code='ECO-05-LO01'),
 'Resource nationalism most likely refers to:',
 'International cooperation in natural resource extraction',
 'A government asserting control over natural resources within its borders',
 'Privatization of state-owned natural resource companies',
 'B',
 'Resource nationalism occurs when a government asserts greater control or ownership over natural resources within its territory, potentially through nationalization, higher royalties, or restricting foreign ownership.',
 2),
((SELECT id FROM learning_modules WHERE code='ECO-05'),
 (SELECT id FROM learning_outcomes WHERE code='ECO-05-LO02'),
 'Geopolitical risk differs from other investment risks primarily because it:',
 'Can be eliminated through diversification',
 'Is typically quantifiable using standard financial models',
 'Is difficult to forecast and often involves non-economic actors and motivations',
 'C',
 'Geopolitical risk is inherently difficult to forecast because it involves political actors, ideological motivations, and events that do not follow economic models. It cannot be easily diversified away and is not well captured by standard risk metrics.',
 3);

-- --------------------------------------------------------
-- QUESTIONS — ECO-06: International Trade
-- --------------------------------------------------------
INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='ECO-06'),
 (SELECT id FROM learning_outcomes WHERE code='ECO-06-LO01'),
 'According to the theory of comparative advantage, a country should specialize in producing goods for which it has:',
 'The lowest absolute cost of production',
 'The lowest opportunity cost of production',
 'The highest demand domestically',
 'B',
 'Comparative advantage holds that a country should specialize in producing goods for which its opportunity cost is lowest relative to other countries, even if it has higher absolute costs.',
 2),
((SELECT id FROM learning_modules WHERE code='ECO-06'),
 (SELECT id FROM learning_outcomes WHERE code='ECO-06-LO02'),
 'A tariff imposed on imported steel would most likely:',
 'Decrease domestic steel prices and increase imports',
 'Increase domestic steel prices and decrease imports',
 'Decrease both domestic steel prices and imports',
 'B',
 'A tariff raises the cost of imported steel, increasing the domestic price and reducing the quantity imported. Domestic producers benefit from the higher price, but consumers pay more.',
 2),
((SELECT id FROM learning_modules WHERE code='ECO-06'),
 (SELECT id FROM learning_outcomes WHERE code='ECO-06-LO03'),
 'Which of the following trade restrictions is most likely to generate government revenue?',
 'Voluntary export restraint',
 'Import quota',
 'Tariff',
 'C',
 'Tariffs generate revenue for the government imposing them. Import quotas and voluntary export restraints restrict quantity but do not directly produce government revenue (the quota rents accrue to license holders or foreign exporters).',
 2),
((SELECT id FROM learning_modules WHERE code='ECO-06'),
 (SELECT id FROM learning_outcomes WHERE code='ECO-06-LO01'),
 'A common market differs from a customs union because a common market also allows:',
 'Free trade among member countries',
 'A common external tariff on non-member imports',
 'Free movement of labor and capital among member countries',
 'C',
 'A common market includes the features of a customs union (free trade among members, common external tariff) plus the free movement of factors of production such as labor and capital.',
 3),
((SELECT id FROM learning_modules WHERE code='ECO-06'),
 (SELECT id FROM learning_outcomes WHERE code='ECO-06-LO02'),
 'The infant industry argument for trade protection states that:',
 'Mature industries need protection from lower-cost foreign producers',
 'New domestic industries need temporary protection to develop and become competitive',
 'All industries should be protected from foreign competition to preserve jobs',
 'B',
 'The infant industry argument holds that new domestic industries may need temporary protection from foreign competition until they can achieve economies of scale and become internationally competitive.',
 2);

-- --------------------------------------------------------
-- QUESTIONS — ECO-07: Capital Flows and the FX Market
-- --------------------------------------------------------
INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='ECO-07'),
 (SELECT id FROM learning_outcomes WHERE code='ECO-07-LO01'),
 'A country that imports more goods and services than it exports most likely has:',
 'A current account surplus',
 'A current account deficit',
 'A financial account deficit',
 'B',
 'When imports exceed exports, the trade balance is negative, contributing to a current account deficit. This must be financed by a corresponding financial account surplus (net capital inflows).',
 2),
((SELECT id FROM learning_modules WHERE code='ECO-07'),
 (SELECT id FROM learning_outcomes WHERE code='ECO-07-LO02'),
 'In the balance of payments, a purchase of foreign financial assets by domestic investors is recorded as:',
 'A credit in the financial account',
 'A debit in the financial account',
 'A credit in the current account',
 'B',
 'Purchases of foreign assets represent capital outflows and are recorded as debits (negative entries) in the financial account.',
 3),
((SELECT id FROM learning_modules WHERE code='ECO-07'),
 (SELECT id FROM learning_outcomes WHERE code='ECO-07-LO03'),
 'The bid-ask spread in the foreign exchange market is most likely to be wider for:',
 'The EUR/USD currency pair',
 'An emerging market currency with low trading volume',
 'The USD/JPY currency pair',
 'B',
 'Bid-ask spreads are wider for less liquid currencies with lower trading volumes, such as emerging market currencies. Major pairs like EUR/USD and USD/JPY have very tight spreads due to high liquidity.',
 2),
((SELECT id FROM learning_modules WHERE code='ECO-07'),
 (SELECT id FROM learning_outcomes WHERE code='ECO-07-LO01'),
 'If the JPY/USD exchange rate moves from 110 to 120, the US dollar has:',
 'Depreciated against the Japanese yen',
 'Appreciated against the Japanese yen',
 'Remained unchanged in value',
 'B',
 'A move from 110 to 120 JPY/USD means that one USD now buys more yen (120 instead of 110), indicating the dollar has appreciated against the yen.',
 2),
((SELECT id FROM learning_modules WHERE code='ECO-07'),
 (SELECT id FROM learning_outcomes WHERE code='ECO-07-LO02'),
 'A country with a persistent current account deficit must also have:',
 'A deficit in the capital and financial accounts combined',
 'A surplus in the capital and financial accounts combined',
 'Declining foreign exchange reserves',
 'B',
 'The balance of payments must balance. A current account deficit must be offset by a combined capital and financial account surplus, meaning the country receives net capital inflows to finance its deficit.',
 3);

-- --------------------------------------------------------
-- QUESTIONS — ECO-08: Exchange Rate Calculations
-- --------------------------------------------------------
INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='ECO-08'),
 (SELECT id FROM learning_outcomes WHERE code='ECO-08-LO01'),
 'Given EUR/USD = 1.1200 and GBP/USD = 1.3000, the EUR/GBP cross rate is closest to:',
 '0.8615',
 '1.1607',
 '1.4560',
 'A',
 'EUR/GBP = (EUR/USD) / (GBP/USD) = 1.1200 / 1.3000 = 0.8615. This means one euro buys 0.8615 pounds.',
 3),
((SELECT id FROM learning_modules WHERE code='ECO-08'),
 (SELECT id FROM learning_outcomes WHERE code='ECO-08-LO02'),
 'The USD/CHF spot rate is 0.9200 and the 6-month forward rate is 0.9150. The Swiss franc is trading at a forward:',
 'Discount',
 'Premium',
 'At parity',
 'B',
 'The forward rate (0.9150) is less than the spot rate (0.9200) in USD/CHF terms, meaning fewer USD per CHF forward. In direct terms for CHF, the CHF is more expensive forward, so the CHF trades at a forward premium. Equivalently, the USD trades at a forward discount.',
 3),
((SELECT id FROM learning_modules WHERE code='ECO-08'),
 (SELECT id FROM learning_outcomes WHERE code='ECO-08-LO03'),
 'A US investor can earn 4% annually on a USD deposit. A Japanese deposit yields 1% annually. According to covered interest rate parity, the JPY/USD forward rate should be:',
 'Higher than the spot rate (USD at a forward discount)',
 'Lower than the spot rate (USD at a forward premium)',
 'Equal to the spot rate',
 'A',
 'Under covered interest rate parity, the higher-yielding currency (USD at 4%) trades at a forward discount relative to the lower-yielding currency (JPY at 1%). The JPY/USD forward rate will be lower than the spot rate, meaning fewer yen per dollar forward, which is a USD forward discount.',
 4),
((SELECT id FROM learning_modules WHERE code='ECO-08'),
 (SELECT id FROM learning_outcomes WHERE code='ECO-08-LO04'),
 'Purchasing power parity (PPP) predicts that if inflation in Country A is 5% and in Country B is 2%, Country A''s currency should:',
 'Appreciate by approximately 3%',
 'Depreciate by approximately 3%',
 'Depreciate by approximately 7%',
 'B',
 'Relative PPP predicts that the currency of the higher-inflation country will depreciate by approximately the inflation differential. Since Country A has 3% higher inflation, its currency should depreciate by about 3%.',
 3),
((SELECT id FROM learning_modules WHERE code='ECO-08'),
 (SELECT id FROM learning_outcomes WHERE code='ECO-08-LO01'),
 'A dealer quotes USD/EUR at 1.1050/1.1055. An investor wanting to buy EUR would transact at:',
 '1.1050',
 '1.1055',
 '1.10525',
 'B',
 'The dealer''s ask (offer) price is 1.1055 USD per EUR. An investor wanting to buy EUR pays the ask price. The bid price (1.1050) is the rate at which the dealer buys EUR (investor sells EUR).',
 2);

-- --------------------------------------------------------
-- QUESTIONS — FRA-01: Introduction to Financial Statement Analysis
-- --------------------------------------------------------
INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='FSA-01'),
 (SELECT id FROM learning_outcomes WHERE code='FSA-01-LO01'),
 'The primary purpose of financial statement analysis is most accurately described as:',
 'Ensuring compliance with accounting standards',
 'Using financial reports to make economic decisions',
 'Preparing financial statements for external users',
 'B',
 'Financial statement analysis involves evaluating a company''s financial reports to make informed economic decisions such as investing, lending, or managing. Preparing statements is accounting; ensuring compliance is auditing.',
 1),
((SELECT id FROM learning_modules WHERE code='FSA-01'),
 (SELECT id FROM learning_outcomes WHERE code='FSA-01-LO02'),
 'Which of the following financial statements is most likely to provide information about a company''s financial position at a specific point in time?',
 'Income statement',
 'Balance sheet',
 'Cash flow statement',
 'B',
 'The balance sheet reports a company''s assets, liabilities, and equity at a specific point in time. The income statement and cash flow statement report activity over a period of time.',
 1),
((SELECT id FROM learning_modules WHERE code='FSA-01'),
 (SELECT id FROM learning_outcomes WHERE code='FSA-01-LO03'),
 'An unqualified (clean) audit opinion indicates that the financial statements:',
 'Are free of all errors',
 'Are presented fairly in all material respects in accordance with the applicable framework',
 'Guarantee the company''s future viability',
 'B',
 'An unqualified opinion means the auditor believes the statements are presented fairly in all material respects. It does not guarantee they are error-free or that the company will remain viable.',
 2),
((SELECT id FROM learning_modules WHERE code='FSA-01'),
 (SELECT id FROM learning_outcomes WHERE code='FSA-01-LO04'),
 'The notes to financial statements are most likely to contain:',
 'The auditor''s opinion on the financial statements',
 'Information about accounting policies, methods, and estimates used in preparing the statements',
 'Management''s projections for future earnings',
 'B',
 'Notes (footnotes) provide details about accounting policies, methods, estimates, contingencies, and other items that supplement the primary financial statements.',
 2),
((SELECT id FROM learning_modules WHERE code='FSA-01'),
 (SELECT id FROM learning_outcomes WHERE code='FSA-01-LO01'),
 'A qualified audit opinion is most likely issued when:',
 'The financial statements contain a material misstatement limited to a specific area',
 'The auditor cannot form an opinion on the financial statements',
 'The financial statements are pervasively misstated',
 'A',
 'A qualified opinion is issued when there is a material but not pervasive misstatement or limitation. A disclaimer is issued when the auditor cannot form an opinion. An adverse opinion is issued when statements are pervasively misstated.',
 3);

-- --------------------------------------------------------
-- QUESTIONS — FRA-02: Analyzing Income Statements
-- --------------------------------------------------------
INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='FSA-02'),
 (SELECT id FROM learning_outcomes WHERE code='FSA-02-LO01'),
 'A company reports revenue of EUR 500 million, cost of goods sold of EUR 300 million, and operating expenses of EUR 100 million. Its gross profit margin is closest to:',
 '20%',
 '40%',
 '60%',
 'B',
 'Gross profit = Revenue - COGS = 500 - 300 = EUR 200 million. Gross profit margin = 200 / 500 = 40%.',
 2),
((SELECT id FROM learning_modules WHERE code='FSA-02'),
 (SELECT id FROM learning_outcomes WHERE code='FSA-02-LO02'),
 'Under IFRS 15, revenue from a contract with a customer is recognized when:',
 'Cash is received from the customer',
 'A performance obligation is satisfied by transferring a promised good or service',
 'The contract is signed by both parties',
 'B',
 'IFRS 15 requires revenue recognition when a performance obligation is satisfied by transferring a good or service to the customer. This may occur before or after cash is received.',
 2),
((SELECT id FROM learning_modules WHERE code='FSA-02'),
 (SELECT id FROM learning_outcomes WHERE code='FSA-02-LO03'),
 'A gain on the sale of equipment is most likely classified on the income statement as:',
 'Revenue from operations',
 'A non-operating item',
 'Other comprehensive income',
 'B',
 'Gains and losses on asset disposals are typically classified as non-operating items. They are not part of normal business revenue or other comprehensive income.',
 2),
((SELECT id FROM learning_modules WHERE code='FSA-02'),
 (SELECT id FROM learning_outcomes WHERE code='FSA-02-LO04'),
 'Company X reports revenue of USD 1,000, COGS of USD 600, SGA expenses of USD 150, and interest expense of USD 50. Its operating profit margin is closest to:',
 '20%',
 '25%',
 '40%',
 'B',
 'Operating profit = Revenue - COGS - SGA = 1,000 - 600 - 150 = USD 250. Operating profit margin = 250 / 1,000 = 25%. Interest expense is below the operating line.',
 3),
((SELECT id FROM learning_modules WHERE code='FSA-02'),
 (SELECT id FROM learning_outcomes WHERE code='FSA-02-LO01'),
 'Discontinued operations are reported on the income statement:',
 'As part of revenue from continuing operations',
 'Net of tax, separately from continuing operations',
 'As an adjustment to retained earnings',
 'B',
 'Discontinued operations are reported net of tax as a separate line item below income from continuing operations to distinguish them from ongoing business activities.',
 2);

-- --------------------------------------------------------
-- QUESTIONS — FRA-03: Analyzing Balance Sheets
-- --------------------------------------------------------
INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='FSA-03'),
 (SELECT id FROM learning_outcomes WHERE code='FSA-03-LO01'),
 'A company reports current assets of USD 500 million and current liabilities of USD 300 million. Its current ratio is closest to:',
 '0.60',
 '1.67',
 '2.00',
 'B',
 'Current ratio = Current assets / Current liabilities = 500 / 300 = 1.67.',
 1),
((SELECT id FROM learning_modules WHERE code='FSA-03'),
 (SELECT id FROM learning_outcomes WHERE code='FSA-03-LO02'),
 'Goodwill on the balance sheet most likely arises from:',
 'Internally generated brand value',
 'The excess of the purchase price over the fair value of identifiable net assets in a business combination',
 'The appreciation in fair value of long-lived assets',
 'B',
 'Goodwill is recognized in a business combination when the purchase price exceeds the fair value of identifiable net assets acquired. Internally generated goodwill is not recognized on the balance sheet.',
 2),
((SELECT id FROM learning_modules WHERE code='FSA-03'),
 (SELECT id FROM learning_outcomes WHERE code='FSA-03-LO03'),
 'Under IFRS, investment property can be measured using the:',
 'Cost model only',
 'Fair value model only',
 'Cost model or the fair value model',
 'C',
 'IFRS allows entities to choose either the cost model or the fair value model for subsequent measurement of investment property. US GAAP requires the cost model.',
 3),
((SELECT id FROM learning_modules WHERE code='FSA-03'),
 (SELECT id FROM learning_outcomes WHERE code='FSA-03-LO04'),
 'A company has total assets of EUR 800 million, total liabilities of EUR 500 million, and total equity of EUR 300 million. Its debt-to-equity ratio is closest to:',
 '0.63',
 '1.67',
 '2.67',
 'B',
 'Debt-to-equity ratio = Total liabilities / Total equity = 500 / 300 = 1.67.',
 2),
((SELECT id FROM learning_modules WHERE code='FSA-03'),
 (SELECT id FROM learning_outcomes WHERE code='FSA-03-LO01'),
 'Which of the following balance sheet items is most likely measured at amortized cost?',
 'Trading securities',
 'Held-to-maturity debt investments',
 'Equity investments designated at fair value through profit or loss',
 'B',
 'Held-to-maturity (amortized cost) debt investments are measured at amortized cost. Trading securities and equity investments at FVTPL are measured at fair value.',
 3);

-- --------------------------------------------------------
-- QUESTIONS — FRA-04: Analyzing Statements of Cash Flows
-- --------------------------------------------------------
INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='FSA-04'),
 (SELECT id FROM learning_outcomes WHERE code='FSA-04-LO01'),
 'Under US GAAP, interest paid is classified as a cash flow from:',
 'Operating activities',
 'Investing activities',
 'Financing activities',
 'A',
 'Under US GAAP, interest paid is classified as an operating activity. Under IFRS, interest paid may be classified as either operating or financing.',
 2),
((SELECT id FROM learning_modules WHERE code='FSA-04'),
 (SELECT id FROM learning_outcomes WHERE code='FSA-04-LO02'),
 'When using the indirect method, depreciation expense is added back to net income because it:',
 'Represents a source of cash',
 'Is a non-cash expense that reduced net income but did not affect operating cash flow',
 'Increases working capital',
 'B',
 'Depreciation is a non-cash expense that was deducted in computing net income. It is added back under the indirect method to reconcile net income to operating cash flow.',
 2),
((SELECT id FROM learning_modules WHERE code='FSA-04'),
 (SELECT id FROM learning_outcomes WHERE code='FSA-04-LO03'),
 'Free cash flow to the firm (FCFF) is best calculated as:',
 'Net income + Depreciation - Capital expenditures - Change in working capital',
 'CFO + Interest expense x (1 - Tax rate) - Capital expenditures',
 'CFO - Capital expenditures - Dividends paid',
 'B',
 'FCFF = CFO + Int(1-t) - CapEx. This represents cash available to all providers of capital (debt and equity). Adding after-tax interest to CFO removes the financing cost, then CapEx is subtracted for maintenance and growth investments.',
 4),
((SELECT id FROM learning_modules WHERE code='FSA-04'),
 (SELECT id FROM learning_outcomes WHERE code='FSA-04-LO04'),
 'A company with net income of USD 100 million, depreciation of USD 20 million, and an increase in accounts receivable of USD 15 million would report operating cash flow (indirect method) of approximately:',
 'USD 105 million',
 'USD 135 million',
 'USD 85 million',
 'A',
 'CFO = Net income + Depreciation - Increase in A/R = 100 + 20 - 15 = USD 105 million. An increase in receivables uses cash (sales were recorded but not collected).',
 3),
((SELECT id FROM learning_modules WHERE code='FSA-04'),
 (SELECT id FROM learning_outcomes WHERE code='FSA-04-LO01'),
 'A company with positive net income but negative operating cash flow most likely:',
 'Has strong cash management practices',
 'May be recognizing revenue aggressively or has growing working capital needs',
 'Is paying down debt rapidly',
 'B',
 'When net income is positive but operating cash flow is negative, it suggests that earnings are not being converted to cash. This could indicate aggressive revenue recognition, growing receivables, or inventory build-up.',
 3);

-- --------------------------------------------------------
-- QUESTIONS — FRA-05: Analysis of Inventories
-- --------------------------------------------------------
INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='FSA-05'),
 (SELECT id FROM learning_outcomes WHERE code='FSA-05-LO01'),
 'In a period of rising prices, compared to FIFO, a company using LIFO will most likely report:',
 'Higher net income and higher ending inventory',
 'Lower net income and lower ending inventory',
 'Higher net income and lower ending inventory',
 'B',
 'When prices rise, LIFO assigns the most recent (highest) costs to COGS, resulting in higher COGS, lower net income, and lower ending inventory compared to FIFO.',
 2),
((SELECT id FROM learning_modules WHERE code='FSA-05'),
 (SELECT id FROM learning_outcomes WHERE code='FSA-05-LO02'),
 'The LIFO reserve represents the difference between:',
 'Beginning inventory under LIFO and FIFO',
 'Inventory reported under LIFO and what it would be under FIFO',
 'Cost of goods sold under LIFO and FIFO',
 'B',
 'The LIFO reserve is the difference between inventory valued under FIFO and inventory valued under LIFO. It represents the cumulative difference in inventory valuation between the two methods.',
 2),
((SELECT id FROM learning_modules WHERE code='FSA-05'),
 (SELECT id FROM learning_outcomes WHERE code='FSA-05-LO03'),
 'A company using FIFO reports inventory of USD 400,000. If it had used LIFO, inventory would be USD 340,000. The LIFO reserve is:',
 'USD 60,000',
 'USD 340,000',
 'USD 740,000',
 'A',
 'LIFO reserve = FIFO inventory - LIFO inventory = 400,000 - 340,000 = USD 60,000.',
 2),
((SELECT id FROM learning_modules WHERE code='FSA-05'),
 (SELECT id FROM learning_outcomes WHERE code='FSA-05-LO04'),
 'Under IFRS, inventory is measured at the lower of:',
 'Cost and market value',
 'Cost and net realizable value',
 'Cost and replacement cost',
 'B',
 'IFRS requires inventory to be measured at the lower of cost and net realizable value (NRV). US GAAP uses the lower of cost and market (which considers replacement cost, NRV, and NRV less normal profit margin).',
 2),
((SELECT id FROM learning_modules WHERE code='FSA-05'),
 (SELECT id FROM learning_outcomes WHERE code='FSA-05-LO01'),
 'A company writes down inventory from a cost of USD 100,000 to a net realizable value of USD 75,000. This write-down will:',
 'Decrease COGS and increase gross profit',
 'Increase COGS and decrease gross profit',
 'Have no effect on the income statement',
 'B',
 'An inventory write-down increases the cost recognized (through higher COGS or a separate loss line), which decreases gross profit and net income in the period.',
 3);

-- --------------------------------------------------------
-- QUESTIONS — FRA-06: Analysis of Long-Lived Assets
-- --------------------------------------------------------
INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='FSA-06'),
 (SELECT id FROM learning_outcomes WHERE code='FSA-06-LO01'),
 'Compared to expensing, capitalizing a cost in the year of expenditure will result in:',
 'Higher assets, higher net income, and higher equity',
 'Lower assets, lower net income, and lower equity',
 'Higher assets, lower net income, and higher equity',
 'A',
 'Capitalizing a cost places it on the balance sheet as an asset rather than expensing it immediately. This results in higher assets, higher net income (lower current expenses), and higher equity in the initial year.',
 2),
((SELECT id FROM learning_modules WHERE code='FSA-06'),
 (SELECT id FROM learning_outcomes WHERE code='FSA-06-LO02'),
 'A machine costing USD 100,000 with a 5-year useful life and zero salvage value is depreciated using the double-declining balance method. Depreciation expense in Year 2 is closest to:',
 'USD 20,000',
 'USD 24,000',
 'USD 40,000',
 'B',
 'DDB rate = 2 x (1/5) = 40%. Year 1 depreciation = 100,000 x 40% = 40,000. Book value after Year 1 = 60,000. Year 2 depreciation = 60,000 x 40% = USD 24,000.',
 3),
((SELECT id FROM learning_modules WHERE code='FSA-06'),
 (SELECT id FROM learning_outcomes WHERE code='FSA-06-LO03'),
 'Under IFRS, the revaluation model for property, plant, and equipment permits an asset to be carried at:',
 'Historical cost less accumulated depreciation',
 'Fair value at the date of revaluation less any subsequent accumulated depreciation and impairment losses',
 'Replacement cost',
 'B',
 'Under IFRS, the revaluation model allows PPE to be carried at fair value at the revaluation date less subsequent depreciation and impairment. US GAAP does not permit revaluation.',
 3),
((SELECT id FROM learning_modules WHERE code='FSA-06'),
 (SELECT id FROM learning_outcomes WHERE code='FSA-06-LO04'),
 'A company capitalizes development costs of EUR 200,000 and amortizes them over 4 years using straight-line. After the first year, the total effect on the income statement is:',
 'EUR 200,000 expense',
 'EUR 50,000 expense',
 'No income statement effect',
 'B',
 'By capitalizing and amortizing over 4 years, the annual expense is 200,000 / 4 = EUR 50,000 per year. If expensed immediately, the full EUR 200,000 would hit the income statement in year one.',
 2),
((SELECT id FROM learning_modules WHERE code='FSA-06'),
 (SELECT id FROM learning_outcomes WHERE code='FSA-06-LO01'),
 'An impairment loss on an asset under US GAAP is recognized when:',
 'The asset''s fair value falls below its carrying amount',
 'The asset''s carrying amount exceeds the undiscounted expected future cash flows and the loss is measured as carrying amount minus fair value',
 'The asset''s net realizable value is less than its historical cost',
 'B',
 'Under US GAAP, the recoverability test compares carrying amount to undiscounted future cash flows. If carrying amount exceeds undiscounted cash flows, impairment is recognized as carrying amount minus fair value.',
 4);

-- --------------------------------------------------------
-- QUESTIONS — FRA-07: Analysis of Income Taxes
-- --------------------------------------------------------
INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='FSA-07'),
 (SELECT id FROM learning_outcomes WHERE code='FSA-07-LO01'),
 'A deferred tax liability most likely arises when:',
 'Taxable income exceeds accounting income due to temporary differences',
 'Accounting income exceeds taxable income due to temporary differences',
 'The statutory tax rate differs from the effective tax rate',
 'B',
 'A DTL arises when accounting income exceeds taxable income, meaning the company has paid less tax than the expense recognized on its financial statements. The difference will reverse in the future, creating a future tax obligation.',
 3),
((SELECT id FROM learning_modules WHERE code='FSA-07'),
 (SELECT id FROM learning_outcomes WHERE code='FSA-07-LO02'),
 'An asset has a carrying value of USD 800,000 and a tax base of USD 600,000 with a 25% tax rate. The related deferred tax item is a:',
 'Deferred tax asset of USD 50,000',
 'Deferred tax liability of USD 50,000',
 'Deferred tax liability of USD 200,000',
 'B',
 'Carrying value > Tax base creates a taxable temporary difference and a DTL. DTL = (800,000 - 600,000) x 25% = USD 50,000.',
 3),
((SELECT id FROM learning_modules WHERE code='FSA-07'),
 (SELECT id FROM learning_outcomes WHERE code='FSA-07-LO03'),
 'A company has pretax accounting income of EUR 1,000,000, a tax rate of 30%, and a permanent difference of EUR 100,000 in non-deductible expenses. Income tax expense is closest to:',
 'EUR 300,000',
 'EUR 330,000',
 'EUR 270,000',
 'B',
 'Permanent differences affect the effective tax rate. Taxable income = 1,000,000 + 100,000 (non-deductible) = 1,100,000. Tax expense = 1,100,000 x 30% = EUR 330,000. The effective rate is 33%.',
 4),
((SELECT id FROM learning_modules WHERE code='FSA-07'),
 (SELECT id FROM learning_outcomes WHERE code='FSA-07-LO04'),
 'A valuation allowance against a deferred tax asset is most likely established when:',
 'The deferred tax asset is certain to be realized',
 'It is more likely than not that some or all of the DTA will not be realized',
 'The company has excess taxable income',
 'B',
 'A valuation allowance is recorded when management believes it is more likely than not (probability > 50%) that some or all of the DTA will not be realized through future taxable income.',
 2),
((SELECT id FROM learning_modules WHERE code='FSA-07'),
 (SELECT id FROM learning_outcomes WHERE code='FSA-07-LO01'),
 'A company that uses accelerated depreciation for tax purposes and straight-line for financial reporting will initially create a:',
 'Deferred tax asset',
 'Deferred tax liability',
 'Permanent difference',
 'B',
 'Accelerated depreciation for tax creates higher tax deductions early on, resulting in lower taxable income relative to accounting income. This creates a DTL that will reverse as the depreciation difference flips in later years.',
 2);

-- --------------------------------------------------------
-- QUESTIONS — FRA-08: Analysis of Long-Term Liabilities
-- --------------------------------------------------------
INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='FSA-08'),
 (SELECT id FROM learning_outcomes WHERE code='FSA-08-LO01'),
 'A bond issued at a discount will report interest expense that is:',
 'Equal to the coupon payment',
 'Greater than the coupon payment',
 'Less than the coupon payment',
 'B',
 'For a discount bond, interest expense (calculated using the effective interest rate applied to the carrying amount) exceeds the coupon payment. The difference amortizes the discount, increasing the carrying amount toward par.',
 2),
((SELECT id FROM learning_modules WHERE code='FSA-08'),
 (SELECT id FROM learning_outcomes WHERE code='FSA-08-LO02'),
 'A company issues a 5-year bond with a face value of USD 1,000,000 at 97. The bond was issued at a:',
 'Premium of USD 30,000',
 'Discount of USD 30,000',
 'Par value',
 'B',
 'Issued at 97 means the bond sold for 97% of face value = USD 970,000. The discount = 1,000,000 - 970,000 = USD 30,000.',
 2),
((SELECT id FROM learning_modules WHERE code='FSA-08'),
 (SELECT id FROM learning_outcomes WHERE code='FSA-08-LO03'),
 'Under IFRS 16, a lessee recognizes a finance lease on the balance sheet as:',
 'An operating expense only',
 'A right-of-use asset and a corresponding lease liability',
 'An off-balance-sheet item disclosed in the notes',
 'B',
 'IFRS 16 requires lessees to recognize virtually all leases on the balance sheet as a right-of-use asset and a lease liability. There is no distinction between operating and finance leases for lessees under IFRS 16 (with limited exceptions).',
 2),
((SELECT id FROM learning_modules WHERE code='FSA-08'),
 (SELECT id FROM learning_outcomes WHERE code='FSA-08-LO04'),
 'A company issues EUR 10 million of bonds at par carrying a 5% coupon. If the company had instead issued equity, the most likely effect on the debt-to-equity ratio would be:',
 'The ratio would be lower',
 'The ratio would be higher',
 'The ratio would be unchanged',
 'A',
 'Issuing equity instead of debt increases equity and does not increase liabilities, resulting in a lower debt-to-equity ratio compared to debt issuance.',
 3),
((SELECT id FROM learning_modules WHERE code='FSA-08'),
 (SELECT id FROM learning_outcomes WHERE code='FSA-08-LO01'),
 'A bond with a face value of USD 100,000 and a coupon rate of 6% is issued when the market rate is 8%. Using the effective interest method, interest expense in Year 1 is calculated as:',
 'The coupon rate multiplied by the face value',
 'The market rate at issuance multiplied by the carrying value of the bond',
 'The average of the coupon rate and market rate multiplied by face value',
 'B',
 'Under the effective interest method, interest expense equals the market rate at issuance (8%) multiplied by the carrying value (book value) of the bond at the beginning of the period.',
 3);

-- --------------------------------------------------------
-- QUESTIONS — FRA-09: Financial Reporting Quality
-- --------------------------------------------------------
INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='FSA-09'),
 (SELECT id FROM learning_outcomes WHERE code='FSA-09-LO01'),
 'Financial reporting quality is best described as the:',
 'Degree to which earnings are sustainable',
 'Degree to which financial reports faithfully represent economic reality',
 'Ability to forecast future earnings',
 'B',
 'Financial reporting quality refers to the degree to which reports conform to standards and faithfully represent the company''s economic reality. Earnings quality relates to the sustainability and level of earnings.',
 2),
((SELECT id FROM learning_modules WHERE code='FSA-09'),
 (SELECT id FROM learning_outcomes WHERE code='FSA-09-LO02'),
 'Channel stuffing is an accounting warning sign that involves:',
 'Underreporting expenses to inflate net income',
 'Shipping excess inventory to distributors near period-end to inflate reported revenue',
 'Capitalizing operating expenses to improve reported profitability',
 'B',
 'Channel stuffing involves persuading distributors or customers to accept more inventory than they need near the end of a reporting period, artificially inflating revenue. It typically reverses in subsequent periods.',
 3),
((SELECT id FROM learning_modules WHERE code='FSA-09'),
 (SELECT id FROM learning_outcomes WHERE code='FSA-09-LO03'),
 'An analyst observes that a company''s revenue is growing significantly faster than its operating cash flow. This most likely suggests:',
 'Improving operational efficiency',
 'Potential issues with revenue recognition quality',
 'Declining capital expenditures',
 'B',
 'A growing divergence between revenue growth and operating cash flow growth can indicate that revenue is being recognized aggressively or that the quality of reported earnings is deteriorating.',
 3),
((SELECT id FROM learning_modules WHERE code='FSA-09'),
 (SELECT id FROM learning_outcomes WHERE code='FSA-09-LO01'),
 'Big bath accounting is best described as a practice in which management:',
 'Smooths earnings over multiple periods to reduce volatility',
 'Takes large write-offs in one period to improve future reported earnings',
 'Capitalizes all discretionary costs to maximize reported income',
 'B',
 'Big bath accounting involves taking unusually large charges or write-offs in a single period (often during a management change or restructuring), which depresses current earnings but improves earnings in future periods.',
 3),
((SELECT id FROM learning_modules WHERE code='FSA-09'),
 (SELECT id FROM learning_outcomes WHERE code='FSA-09-LO02'),
 'Which of the following is most likely a red flag indicating low financial reporting quality?',
 'Consistent use of conservative accounting policies',
 'Frequent changes in accounting estimates or policies',
 'Revenue growth consistent with industry peers',
 'B',
 'Frequent changes in accounting estimates or policies can be a red flag as they may indicate management is manipulating reported results. Consistent conservative policies and industry-aligned revenue growth suggest quality reporting.',
 2);

-- --------------------------------------------------------
-- QUESTIONS — FRA-10: Financial Analysis Techniques
-- --------------------------------------------------------
INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='FSA-10'),
 (SELECT id FROM learning_outcomes WHERE code='FSA-10-LO01'),
 'In a common-size income statement, each line item is expressed as a percentage of:',
 'Total assets',
 'Revenue',
 'Net income',
 'B',
 'A common-size income statement expresses each line item as a percentage of revenue (sales), making it easier to compare companies of different sizes.',
 1),
((SELECT id FROM learning_modules WHERE code='FSA-10'),
 (SELECT id FROM learning_outcomes WHERE code='FSA-10-LO02'),
 'A company has net income of USD 50 million, total equity of USD 400 million, and total assets of USD 1,000 million. Its return on equity (ROE) is closest to:',
 '5.0%',
 '12.5%',
 '20.0%',
 'B',
 'ROE = Net income / Total equity = 50 / 400 = 12.5%.',
 1),
((SELECT id FROM learning_modules WHERE code='FSA-10'),
 (SELECT id FROM learning_outcomes WHERE code='FSA-10-LO03'),
 'In the DuPont decomposition, ROE equals:',
 'Net profit margin x Asset turnover x Financial leverage',
 'Gross profit margin x Asset turnover x Debt ratio',
 'Operating margin x Equity multiplier',
 'A',
 'The three-component DuPont decomposition: ROE = (Net income/Revenue) x (Revenue/Total assets) x (Total assets/Total equity) = Net profit margin x Asset turnover x Financial leverage.',
 2),
((SELECT id FROM learning_modules WHERE code='FSA-10'),
 (SELECT id FROM learning_outcomes WHERE code='FSA-10-LO04'),
 'An analyst calculates the following for Company X: net profit margin of 8%, asset turnover of 1.5, and equity multiplier of 2.0. ROE is closest to:',
 '12%',
 '24%',
 '16%',
 'B',
 'Using DuPont: ROE = Net profit margin x Asset turnover x Equity multiplier = 0.08 x 1.5 x 2.0 = 0.24 = 24%.',
 2),
((SELECT id FROM learning_modules WHERE code='FSA-10'),
 (SELECT id FROM learning_outcomes WHERE code='FSA-10-LO01'),
 'The inventory turnover ratio is calculated as:',
 'Revenue divided by average inventory',
 'Cost of goods sold divided by average inventory',
 'Average inventory divided by cost of goods sold',
 'B',
 'Inventory turnover = COGS / Average inventory. Using COGS rather than revenue provides a more accurate measure because both the numerator and denominator are measured at cost.',
 2);

-- --------------------------------------------------------
-- QUESTIONS — CF-01: Organizational Forms
-- --------------------------------------------------------
INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='CORP-01'),
 (SELECT id FROM learning_outcomes WHERE code='CORP-01-LO01'),
 'Which form of business organization provides owners with limited liability?',
 'Sole proprietorship',
 'General partnership',
 'Corporation',
 'C',
 'Corporations provide limited liability to shareholders, meaning owners are not personally liable for the company''s debts beyond their investment. Sole proprietors and general partners have unlimited personal liability.',
 1),
((SELECT id FROM learning_modules WHERE code='CORP-01'),
 (SELECT id FROM learning_outcomes WHERE code='CORP-01-LO02'),
 'A key disadvantage of the corporate form of business organization is:',
 'Limited liability for shareholders',
 'Double taxation of corporate income',
 'Easy transferability of ownership interests',
 'B',
 'Double taxation is a key disadvantage: corporate income is taxed at the corporate level and again when distributed to shareholders as dividends. Limited liability and transferability are advantages.',
 2),
((SELECT id FROM learning_modules WHERE code='CORP-01'),
 (SELECT id FROM learning_outcomes WHERE code='CORP-01-LO03'),
 'A private equity firm taking a public company private would most likely do so through a:',
 'Secondary offering',
 'Leveraged buyout',
 'Rights offering',
 'B',
 'Leveraged buyouts (LBOs) are a common mechanism for taking public companies private, where the acquiring firm uses significant amounts of debt to finance the purchase of all outstanding shares.',
 3),
((SELECT id FROM learning_modules WHERE code='CORP-01'),
 (SELECT id FROM learning_outcomes WHERE code='CORP-01-LO01'),
 'Compared to a partnership, a corporation most likely has the advantage of:',
 'Simpler regulatory requirements',
 'Perpetual life and easy transfer of ownership',
 'Avoidance of double taxation',
 'B',
 'Corporations have perpetual life (they continue regardless of ownership changes) and ownership can be easily transferred through share sales. Partnerships may dissolve when partners change.',
 2),
((SELECT id FROM learning_modules WHERE code='CORP-01'),
 (SELECT id FROM learning_outcomes WHERE code='CORP-01-LO02'),
 'An initial public offering (IPO) is best described as:',
 'A sale of additional shares by an already publicly traded company',
 'The first sale of shares to the public by a previously private company',
 'A private placement of shares with institutional investors',
 'B',
 'An IPO is the first time a private company sells shares to the public, transforming it into a publicly traded company. A subsequent sale of additional shares is a secondary (seasoned) offering.',
 1);

-- --------------------------------------------------------
-- QUESTIONS — CF-02: Investors and Other Stakeholders
-- --------------------------------------------------------
INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='CORP-02'),
 (SELECT id FROM learning_outcomes WHERE code='CORP-02-LO01'),
 'The principal-agent problem arises primarily from:',
 'The separation of ownership and control in corporations',
 'The conflict between creditors and shareholders',
 'Differences in tax treatment of corporations and partnerships',
 'A',
 'The principal-agent problem arises because shareholders (principals) delegate management to executives (agents) whose interests may not align with shareholder interests.',
 2),
((SELECT id FROM learning_modules WHERE code='CORP-02'),
 (SELECT id FROM learning_outcomes WHERE code='CORP-02-LO02'),
 'Agency costs most likely include:',
 'Costs of monitoring management and the cost of lost opportunities due to overly cautious management decisions',
 'The cost of issuing new equity',
 'The cost of complying with accounting standards',
 'A',
 'Agency costs include monitoring costs (auditing, oversight), bonding costs (incentive alignment mechanisms), and residual losses (value destroyed when agent interests diverge from principal interests).',
 2),
((SELECT id FROM learning_modules WHERE code='CORP-02'),
 (SELECT id FROM learning_outcomes WHERE code='CORP-02-LO03'),
 'A conflict of interest between shareholders and creditors is most likely to arise when:',
 'The company pays regular dividends from operating cash flow',
 'Shareholders encourage the company to take on riskier projects funded by debt',
 'Management implements an employee stock option plan',
 'B',
 'Shareholders may prefer riskier projects because they capture the upside while creditors bear more downside risk. This is the asset substitution problem, a classic shareholder-creditor conflict.',
 3),
((SELECT id FROM learning_modules WHERE code='CORP-02'),
 (SELECT id FROM learning_outcomes WHERE code='CORP-02-LO01'),
 'Information asymmetry between managers and shareholders is best described as:',
 'Managers having better access to information about the company than outside shareholders',
 'Shareholders having access to more investment alternatives than managers',
 'Managers and shareholders having the same information but different risk preferences',
 'A',
 'Information asymmetry occurs when managers possess more detailed and timely information about the company''s operations and prospects than external shareholders.',
 2),
((SELECT id FROM learning_modules WHERE code='CORP-02'),
 (SELECT id FROM learning_outcomes WHERE code='CORP-02-LO02'),
 'Which of the following is most likely to help align the interests of managers and shareholders?',
 'Increasing the fixed salary component of executive compensation',
 'Granting stock options and performance-based compensation to executives',
 'Reducing the frequency of financial reporting',
 'B',
 'Stock options and performance-based compensation tie managerial rewards to shareholder outcomes (stock price appreciation), helping to align interests between agents and principals.',
 2);

-- --------------------------------------------------------
-- QUESTIONS — CF-03: Corporate Governance
-- --------------------------------------------------------
INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='CORP-03'),
 (SELECT id FROM learning_outcomes WHERE code='CORP-03-LO01'),
 'An effective corporate governance framework most likely:',
 'Maximizes short-term share price at all costs',
 'Defines the rights and responsibilities of stakeholders and promotes transparency and accountability',
 'Eliminates all conflicts of interest within the organization',
 'B',
 'Effective corporate governance defines stakeholder rights and responsibilities, establishes checks and balances, and promotes transparency and accountability. It cannot eliminate all conflicts but manages them.',
 2),
((SELECT id FROM learning_modules WHERE code='CORP-03'),
 (SELECT id FROM learning_outcomes WHERE code='CORP-03-LO02'),
 'A board of directors composed of a majority of independent directors is most likely to:',
 'Always result in higher company profits',
 'Provide more objective oversight of management',
 'Eliminate the need for external auditors',
 'B',
 'Independent directors provide more objective oversight because they have no material ties to the company that could compromise their judgment. This does not guarantee profits or replace auditors.',
 2),
((SELECT id FROM learning_modules WHERE code='CORP-03'),
 (SELECT id FROM learning_outcomes WHERE code='CORP-03-LO03'),
 'Cross-shareholding among companies in a business group most likely creates governance concerns because it:',
 'Increases transparency and accountability',
 'Can entrench management and reduce the effectiveness of external market discipline',
 'Simplifies the corporate governance structure',
 'B',
 'Cross-shareholding can insulate management from takeover threats and shareholder activism, reducing market discipline and potentially allowing managers to pursue their own interests.',
 3),
((SELECT id FROM learning_modules WHERE code='CORP-03'),
 (SELECT id FROM learning_outcomes WHERE code='CORP-03-LO04'),
 'ESG factors in investment analysis refer to:',
 'Economic, structural, and governance factors',
 'Environmental, social, and governance factors',
 'Earnings, sales, and growth factors',
 'B',
 'ESG stands for Environmental, Social, and Governance factors, which are increasingly considered material to investment analysis and risk management.',
 1),
((SELECT id FROM learning_modules WHERE code='CORP-03'),
 (SELECT id FROM learning_outcomes WHERE code='CORP-03-LO01'),
 'A staggered (classified) board of directors most likely:',
 'Makes it easier for an acquirer to gain control of the company quickly',
 'Makes hostile takeovers more difficult because only a fraction of directors are elected each year',
 'Increases shareholder voting power',
 'B',
 'A staggered board means only a portion of directors face election each year, making it difficult for a hostile acquirer to replace the full board quickly, thus serving as a takeover defense.',
 3);

-- --------------------------------------------------------
-- QUESTIONS — CF-04: Working Capital and Liquidity
-- --------------------------------------------------------
INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='CORP-04'),
 (SELECT id FROM learning_outcomes WHERE code='CORP-04-LO01'),
 'The cash conversion cycle is calculated as:',
 'Days of inventory on hand + Days of sales outstanding - Number of days of payables',
 'Days of inventory on hand - Days of sales outstanding + Number of days of payables',
 'Days of sales outstanding + Number of days of payables - Days of inventory on hand',
 'A',
 'Cash conversion cycle = DOH + DSO - Number of days of payables. It measures the time between paying for raw materials and receiving cash from sales.',
 2),
((SELECT id FROM learning_modules WHERE code='CORP-04'),
 (SELECT id FROM learning_outcomes WHERE code='CORP-04-LO02'),
 'A company has average inventory of USD 200,000, COGS of USD 1,200,000, average receivables of USD 150,000, revenue of USD 1,800,000, average payables of USD 100,000, and purchases of USD 1,000,000. Its operating cycle is closest to:',
 '91 days',
 '61 days',
 '55 days',
 'A',
 'DOH = (200,000/1,200,000) x 365 = 60.8 days. DSO = (150,000/1,800,000) x 365 = 30.4 days. Operating cycle = DOH + DSO = 60.8 + 30.4 = 91.2 days.',
 3),
((SELECT id FROM learning_modules WHERE code='CORP-04'),
 (SELECT id FROM learning_outcomes WHERE code='CORP-04-LO03'),
 'Primary sources of liquidity for a company most likely include:',
 'Liquidation of long-term assets and renegotiation of debt agreements',
 'Cash balances, short-term borrowing facilities, and cash generated from operations',
 'Issuing new equity and selling business units',
 'B',
 'Primary liquidity sources are readily available and include cash and marketable securities, bank credit lines, and cash flow from operations. Liquidating assets and issuing equity are secondary sources.',
 2),
((SELECT id FROM learning_modules WHERE code='CORP-04'),
 (SELECT id FROM learning_outcomes WHERE code='CORP-04-LO01'),
 'A shorter cash conversion cycle compared to industry peers most likely indicates:',
 'Inefficient working capital management',
 'Higher inventory levels than competitors',
 'More efficient management of working capital',
 'C',
 'A shorter cash conversion cycle means the company converts its inventory investment back to cash more quickly, indicating efficient working capital management.',
 2),
((SELECT id FROM learning_modules WHERE code='CORP-04'),
 (SELECT id FROM learning_outcomes WHERE code='CORP-04-LO02'),
 'Extending payment terms with suppliers would most likely:',
 'Increase the cash conversion cycle',
 'Decrease the cash conversion cycle',
 'Have no effect on the cash conversion cycle',
 'B',
 'Extending payment terms increases the number of days of payables outstanding, which reduces the cash conversion cycle (CCC = DOH + DSO - Payables days). Longer payables mean the company holds cash longer.',
 2);

-- --------------------------------------------------------
-- QUESTIONS — CF-05: Capital Investments and Capital Allocation
-- --------------------------------------------------------
INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='CORP-05'),
 (SELECT id FROM learning_outcomes WHERE code='CORP-05-LO01'),
 'A project has an initial cost of USD 100,000 and expected cash flows of USD 30,000 per year for 5 years. At a 10% discount rate, the NPV is closest to:',
 'USD 13,724',
 'USD 50,000',
 'USD 30,000',
 'A',
 'PV of annuity = 30,000 x [(1 - 1.10^-5) / 0.10] = 30,000 x 3.7908 = 113,724. NPV = 113,724 - 100,000 = USD 13,724. Since NPV > 0, the project adds value.',
 3),
((SELECT id FROM learning_modules WHERE code='CORP-05'),
 (SELECT id FROM learning_outcomes WHERE code='CORP-05-LO02'),
 'The internal rate of return (IRR) is best described as the discount rate at which:',
 'The profitability index equals one',
 'The project''s net present value equals zero',
 'The payback period equals the project''s life',
 'B',
 'The IRR is the discount rate that makes NPV = 0. It represents the expected compound annual return of the project. The profitability index equals one at IRR as well, but the defining characteristic is NPV = 0.',
 2),
((SELECT id FROM learning_modules WHERE code='CORP-05'),
 (SELECT id FROM learning_outcomes WHERE code='CORP-05-LO03'),
 'When mutually exclusive projects have conflicting NPV and IRR rankings, the decision should be based on:',
 'IRR because it accounts for project size',
 'NPV because it directly measures value creation for shareholders',
 'Payback period because it is simplest to calculate',
 'B',
 'NPV should be preferred for mutually exclusive projects because it measures the absolute value added to the firm. IRR can give misleading rankings due to differences in project size or cash flow timing.',
 3),
((SELECT id FROM learning_modules WHERE code='CORP-05'),
 (SELECT id FROM learning_outcomes WHERE code='CORP-05-LO04'),
 'A project has a payback period of 3.5 years and the company requires a payback of 4 years. Based solely on the payback criterion, the project should be:',
 'Accepted because the payback period is less than the required period',
 'Rejected because the payback period exceeds 3 years',
 'Cannot be determined without knowing the discount rate',
 'A',
 'The payback period (3.5 years) is less than the required maximum (4 years), so the project meets the payback criterion and should be accepted. However, payback ignores time value and cash flows beyond the payback period.',
 2),
((SELECT id FROM learning_modules WHERE code='CORP-05'),
 (SELECT id FROM learning_outcomes WHERE code='CORP-05-LO01'),
 'A real option in capital budgeting most likely refers to:',
 'The option to purchase additional shares in the company',
 'The ability to modify a capital project in response to changing conditions',
 'A put option on the company''s stock',
 'B',
 'Real options give management flexibility to modify capital projects (e.g., expand, abandon, delay, or switch) in response to changing market conditions, adding value beyond what traditional NPV captures.',
 2);


-- ============================================================
-- TASK 4: FLASHCARDS (4 per module)
-- ============================================================

-- --------------------------------------------------------
-- FLASHCARDS — ECO-01: Firms and Market Structures
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='ECO-01'),
 'What are the four market structures?',
 'Perfect competition (many firms, homogeneous product, no barriers), monopolistic competition (many firms, differentiated products, low barriers), oligopoly (few firms, high barriers, interdependence), and monopoly (single firm, very high barriers).',
 '{economics,market-structures}'),
((SELECT id FROM learning_modules WHERE code='ECO-01'),
 'What is the profit-maximizing rule for all firms?',
 'Produce the quantity where marginal revenue (MR) equals marginal cost (MC). If MR > MC, produce more; if MR < MC, produce less.',
 '{economics,market-structures,profit-maximization}'),
((SELECT id FROM learning_modules WHERE code='ECO-01'),
 'What does the Herfindahl-Hirschman Index (HHI) measure?',
 'Market concentration. Calculated as the sum of squared market shares of all firms. HHI < 1,500 = unconcentrated; 1,500-2,500 = moderately concentrated; > 2,500 = highly concentrated.',
 '{economics,market-structures,hhi}'),
((SELECT id FROM learning_modules WHERE code='ECO-01'),
 'What happens to economic profit in long-run equilibrium under perfect competition and monopolistic competition?',
 'Economic profit is zero in long-run equilibrium for both. New firms enter when profit exists, increasing supply and driving price down to average total cost.',
 '{economics,market-structures,long-run}');

-- --------------------------------------------------------
-- FLASHCARDS — ECO-02: Understanding Business Cycles
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='ECO-02'),
 'What are the four phases of the business cycle?',
 'Expansion (rising GDP, employment, and spending), peak (maximum economic activity), contraction/recession (declining GDP and employment), and trough (minimum economic activity before recovery).',
 '{economics,business-cycles}'),
((SELECT id FROM learning_modules WHERE code='ECO-02'),
 'What are the three types of unemployment?',
 'Frictional (workers transitioning between jobs), structural (mismatch between worker skills and job requirements due to economic changes), and cyclical (caused by economic downturns).',
 '{economics,business-cycles,unemployment}'),
((SELECT id FROM learning_modules WHERE code='ECO-02'),
 'What is the difference between leading, coincident, and lagging indicators?',
 'Leading indicators change before the economy (e.g., building permits, stock prices). Coincident indicators move with the economy (e.g., industrial production, employment). Lagging indicators change after (e.g., unemployment duration, CPI).',
 '{economics,business-cycles,indicators}'),
((SELECT id FROM learning_modules WHERE code='ECO-02'),
 'What is stagflation?',
 'A period of simultaneously high inflation and high unemployment with stagnant economic growth, often caused by negative supply shocks such as oil price spikes.',
 '{economics,business-cycles,stagflation}');

-- --------------------------------------------------------
-- FLASHCARDS — ECO-03: Fiscal Policy
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='ECO-03'),
 'What are automatic stabilizers?',
 'Built-in fiscal mechanisms that adjust automatically with economic conditions without new legislation. Examples: progressive income taxes (revenue falls in recessions), unemployment insurance (spending rises in recessions).',
 '{economics,fiscal-policy,stabilizers}'),
((SELECT id FROM learning_modules WHERE code='ECO-03'),
 'What is the fiscal multiplier?',
 'The ratio of the change in GDP to the initial change in government spending. Multiplier = 1 / (1 - MPC). A higher MPC leads to a larger multiplier effect.',
 '{economics,fiscal-policy,multiplier}'),
((SELECT id FROM learning_modules WHERE code='ECO-03'),
 'What is crowding out?',
 'When increased government borrowing raises interest rates, which reduces private sector investment. This partially offsets the stimulative effect of expansionary fiscal policy.',
 '{economics,fiscal-policy,crowding-out}'),
((SELECT id FROM learning_modules WHERE code='ECO-03'),
 'What are the three fiscal policy lags?',
 'Recognition lag (time to identify the problem), action lag (time to design and enact legislation), and impact lag (time for the policy to affect the economy).',
 '{economics,fiscal-policy,lags}');

-- --------------------------------------------------------
-- FLASHCARDS — ECO-04: Monetary Policy
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='ECO-04'),
 'What are the main tools of monetary policy?',
 'Policy rate (interest rate target), open market operations (buying/selling government securities), reserve requirements, and unconventional tools like quantitative easing (QE).',
 '{economics,monetary-policy,tools}'),
((SELECT id FROM learning_modules WHERE code='ECO-04'),
 'What is the monetary transmission mechanism?',
 'The process by which monetary policy changes affect the real economy: policy rate change -> market interest rates -> asset prices/exchange rates -> spending/investment -> output and inflation.',
 '{economics,monetary-policy,transmission}'),
((SELECT id FROM learning_modules WHERE code='ECO-04'),
 'What is the neutral rate of interest?',
 'The policy rate at which monetary policy is neither expansionary nor contractionary. The economy grows at its trend rate and inflation is stable at the target.',
 '{economics,monetary-policy,neutral-rate}'),
((SELECT id FROM learning_modules WHERE code='ECO-04'),
 'What is quantitative easing (QE)?',
 'An unconventional monetary policy tool used when rates are near zero. The central bank purchases long-term securities to inject liquidity, lower long-term rates, and stimulate the economy.',
 '{economics,monetary-policy,quantitative-easing}');

-- --------------------------------------------------------
-- FLASHCARDS — ECO-05: Introduction to Geopolitics
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='ECO-05'),
 'What is geopolitical risk?',
 'The risk associated with wars, terrorism, sanctions, political instability, and other tensions among nations that can disrupt economies, trade, and financial markets.',
 '{economics,geopolitics,risk}'),
((SELECT id FROM learning_modules WHERE code='ECO-05'),
 'What are the main tools of geopolitics?',
 'National security and military force, espionage and intelligence, economic sanctions and embargoes, trade policies, resource control, and diplomacy.',
 '{economics,geopolitics,tools}'),
((SELECT id FROM learning_modules WHERE code='ECO-05'),
 'What is resource nationalism?',
 'A government asserting control over natural resources within its borders through nationalization, higher royalties, export restrictions, or limits on foreign ownership.',
 '{economics,geopolitics,resource-nationalism}'),
((SELECT id FROM learning_modules WHERE code='ECO-05'),
 'How does geopolitical risk affect investment portfolios?',
 'Through commodity price shocks, supply chain disruptions, changes in capital flows, increased risk premiums, currency volatility, and potential sanctions on specific sectors or countries.',
 '{economics,geopolitics,portfolio-impact}');

-- --------------------------------------------------------
-- FLASHCARDS — ECO-06: International Trade
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='ECO-06'),
 'What is comparative advantage?',
 'A country has a comparative advantage in producing a good if its opportunity cost of production is lower than that of other countries. Even if one country has absolute advantage in all goods, trade benefits both.',
 '{economics,international-trade,comparative-advantage}'),
((SELECT id FROM learning_modules WHERE code='ECO-06'),
 'What is the difference between a tariff and a quota?',
 'A tariff is a tax on imports that raises government revenue and increases domestic prices. A quota is a quantitative restriction on imports that does not generate government revenue (quota rents go to license holders).',
 '{economics,international-trade,trade-restrictions}'),
((SELECT id FROM learning_modules WHERE code='ECO-06'),
 'What are the levels of economic integration?',
 'Free trade area (no internal tariffs) -> customs union (common external tariff) -> common market (free movement of factors) -> economic union (common economic policies) -> monetary union (shared currency).',
 '{economics,international-trade,integration}'),
((SELECT id FROM learning_modules WHERE code='ECO-06'),
 'What is the infant industry argument?',
 'New domestic industries may need temporary trade protection to develop economies of scale and become competitive with established foreign producers. Criticized because protection may become permanent.',
 '{economics,international-trade,infant-industry}');

-- --------------------------------------------------------
-- FLASHCARDS — ECO-07: Capital Flows and the FX Market
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='ECO-07'),
 'What are the components of the balance of payments?',
 'Current account (trade in goods/services, income, transfers), capital account (capital transfers, non-produced assets), and financial account (direct investment, portfolio investment, other investment, reserves).',
 '{economics,fx-market,balance-of-payments}'),
((SELECT id FROM learning_modules WHERE code='ECO-07'),
 'What must be true about the balance of payments?',
 'It must sum to zero: Current account + Capital account + Financial account = 0. A current account deficit must be financed by a capital/financial account surplus (net capital inflows).',
 '{economics,fx-market,balance-of-payments}'),
((SELECT id FROM learning_modules WHERE code='ECO-07'),
 'What is the bid-ask spread in the FX market?',
 'The difference between the price a dealer will buy a currency (bid) and sell it (ask/offer). Tighter spreads indicate more liquid currency pairs. Major pairs like EUR/USD have the tightest spreads.',
 '{economics,fx-market,bid-ask}'),
((SELECT id FROM learning_modules WHERE code='ECO-07'),
 'What determines the value of a country''s currency in the long run?',
 'Relative inflation rates, interest rate differentials, economic growth, balance of payments flows, political stability, and relative productivity levels.',
 '{economics,fx-market,currency-valuation}');

-- --------------------------------------------------------
-- FLASHCARDS — ECO-08: Exchange Rate Calculations
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='ECO-08'),
 'How do you calculate a cross rate?',
 'Given A/B and C/B, cross rate A/C = (A/B) / (C/B). Example: EUR/USD = 1.12, GBP/USD = 1.30, so EUR/GBP = 1.12 / 1.30 = 0.8615.',
 '{economics,exchange-rates,cross-rates}'),
((SELECT id FROM learning_modules WHERE code='ECO-08'),
 'What is covered interest rate parity?',
 'The forward premium/discount equals the interest rate differential: F/S = (1 + r_d) / (1 + r_f). The higher-yielding currency trades at a forward discount.',
 '{economics,exchange-rates,interest-rate-parity}'),
((SELECT id FROM learning_modules WHERE code='ECO-08'),
 'What is purchasing power parity (PPP)?',
 'Exchange rates adjust to equalize purchasing power. Relative PPP: expected change in exchange rate = inflation differential. The higher-inflation currency depreciates.',
 '{economics,exchange-rates,ppp}'),
((SELECT id FROM learning_modules WHERE code='ECO-08'),
 'What is a forward premium vs. a forward discount?',
 'A currency trades at a forward premium when the forward rate > spot rate (currency more expensive forward). It trades at a discount when forward rate < spot rate. The lower-yielding currency trades at a forward premium.',
 '{economics,exchange-rates,forward-premium}');

-- --------------------------------------------------------
-- FLASHCARDS — FRA-01: Introduction to Financial Statement Analysis
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='FSA-01'),
 'What are the four main financial statements?',
 'Balance sheet (financial position), income statement (financial performance), cash flow statement (cash inflows/outflows), and statement of changes in equity (changes in owners'' equity).',
 '{fra,financial-statements,overview}'),
((SELECT id FROM learning_modules WHERE code='FSA-01'),
 'What are the types of audit opinions?',
 'Unqualified (clean): fair presentation. Qualified: material but not pervasive issue. Adverse: pervasive material misstatement. Disclaimer: unable to form an opinion.',
 '{fra,financial-statements,audit}'),
((SELECT id FROM learning_modules WHERE code='FSA-01'),
 'What is the difference between IFRS and US GAAP?',
 'IFRS is principles-based and used in 140+ countries. US GAAP is rules-based and used primarily in the US. They differ in areas like inventory methods (LIFO allowed only under US GAAP), lease classification, and revaluation of assets.',
 '{fra,financial-statements,standards}'),
((SELECT id FROM learning_modules WHERE code='FSA-01'),
 'What information do financial statement notes provide?',
 'Accounting policies and methods used, assumptions and estimates, details on specific line items (e.g., debt maturities), contingent liabilities, related party transactions, and segment information.',
 '{fra,financial-statements,notes}');

-- --------------------------------------------------------
-- FLASHCARDS — FRA-02: Analyzing Income Statements
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='FSA-02'),
 'What are the key profitability margins from the income statement?',
 'Gross profit margin = (Revenue - COGS) / Revenue. Operating margin = Operating income / Revenue. Net profit margin = Net income / Revenue.',
 '{fra,income-statement,margins}'),
((SELECT id FROM learning_modules WHERE code='FSA-02'),
 'How is revenue recognized under IFRS 15?',
 'Five-step model: (1) Identify the contract, (2) Identify performance obligations, (3) Determine transaction price, (4) Allocate price to obligations, (5) Recognize revenue when obligations are satisfied.',
 '{fra,income-statement,revenue-recognition}'),
((SELECT id FROM learning_modules WHERE code='FSA-02'),
 'What is the difference between expenses and losses?',
 'Expenses arise from ordinary business activities (COGS, salaries, depreciation). Losses arise from incidental transactions or events outside normal operations (asset impairments, natural disaster damage).',
 '{fra,income-statement,expenses}'),
((SELECT id FROM learning_modules WHERE code='FSA-02'),
 'How are discontinued operations reported?',
 'Separately on the income statement, net of tax, below income from continuing operations. This helps analysts distinguish between ongoing and non-recurring business activities.',
 '{fra,income-statement,discontinued-operations}');

-- --------------------------------------------------------
-- FLASHCARDS — FRA-03: Analyzing Balance Sheets
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='FSA-03'),
 'What is the fundamental accounting equation?',
 'Assets = Liabilities + Equity. This must always balance. Equity is the residual interest in assets after deducting liabilities.',
 '{fra,balance-sheet,equation}'),
((SELECT id FROM learning_modules WHERE code='FSA-03'),
 'What are the main liquidity ratios?',
 'Current ratio = Current assets / Current liabilities. Quick ratio = (Cash + Short-term investments + Receivables) / Current liabilities. Cash ratio = (Cash + Short-term investments) / Current liabilities.',
 '{fra,balance-sheet,ratios}'),
((SELECT id FROM learning_modules WHERE code='FSA-03'),
 'What is the difference between historical cost and fair value measurement?',
 'Historical cost records assets at their original purchase price (less depreciation). Fair value measures assets at their current market value. IFRS permits revaluation to fair value for certain assets; US GAAP generally does not.',
 '{fra,balance-sheet,measurement}'),
((SELECT id FROM learning_modules WHERE code='FSA-03'),
 'What is goodwill and how is it treated?',
 'Goodwill = Purchase price - Fair value of identifiable net assets acquired in a business combination. It is not amortized but tested annually for impairment under both IFRS and US GAAP.',
 '{fra,balance-sheet,goodwill}');

-- --------------------------------------------------------
-- FLASHCARDS — FRA-04: Analyzing Statements of Cash Flows
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='FSA-04'),
 'What are the three sections of the cash flow statement?',
 'Operating (day-to-day business), investing (long-term asset purchases/sales), and financing (debt and equity transactions). Operating can use direct or indirect method.',
 '{fra,cash-flows,sections}'),
((SELECT id FROM learning_modules WHERE code='FSA-04'),
 'How does the indirect method work?',
 'Start with net income, add back non-cash charges (depreciation, amortization), adjust for gains/losses on asset sales, and adjust for changes in working capital (receivables, inventory, payables).',
 '{fra,cash-flows,indirect-method}'),
((SELECT id FROM learning_modules WHERE code='FSA-04'),
 'What is FCFF and how is it calculated?',
 'Free cash flow to the firm = CFO + Interest(1-t) - CapEx. It represents cash available to all capital providers (debt and equity holders) after operating expenses and investments.',
 '{fra,cash-flows,fcff}'),
((SELECT id FROM learning_modules WHERE code='FSA-04'),
 'What is FCFE and how is it calculated?',
 'Free cash flow to equity = CFO - CapEx + Net borrowing. It represents cash available to equity holders after operating expenses, investments, and debt payments.',
 '{fra,cash-flows,fcfe}');

-- --------------------------------------------------------
-- FLASHCARDS — FRA-05: Analysis of Inventories
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='FSA-05'),
 'How do FIFO and LIFO differ in rising price environments?',
 'FIFO: lower COGS, higher net income, higher ending inventory, higher taxes. LIFO: higher COGS, lower net income, lower ending inventory, lower taxes (tax benefit).',
 '{fra,inventories,fifo-lifo}'),
((SELECT id FROM learning_modules WHERE code='FSA-05'),
 'What is the LIFO reserve?',
 'LIFO reserve = FIFO inventory - LIFO inventory. To convert LIFO to FIFO: add the LIFO reserve to inventory and subtract the tax effect from equity. LIFO is not permitted under IFRS.',
 '{fra,inventories,lifo-reserve}'),
((SELECT id FROM learning_modules WHERE code='FSA-05'),
 'What is the lower of cost and net realizable value rule?',
 'Inventory must be reported at the lower of its cost or NRV (estimated selling price less costs to complete and sell). Write-downs increase COGS and reduce net income. Under IFRS, write-downs can be reversed; under US GAAP they cannot.',
 '{fra,inventories,lcnrv}'),
((SELECT id FROM learning_modules WHERE code='FSA-05'),
 'How does inventory write-down affect financial statements?',
 'Balance sheet: inventory decreases. Income statement: COGS increases (or separate loss recognized), reducing gross profit and net income. Ratios: inventory turnover increases, profit margins decrease.',
 '{fra,inventories,write-down}');

-- --------------------------------------------------------
-- FLASHCARDS — FRA-06: Analysis of Long-Lived Assets
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='FSA-06'),
 'What is the effect of capitalizing vs. expensing a cost?',
 'Capitalizing: higher assets, higher net income in year 1 (lower in later years due to depreciation), higher CFI, lower CFO. Expensing: lower assets, lower net income in year 1, higher CFO, lower CFI.',
 '{fra,long-lived-assets,capitalize-expense}'),
((SELECT id FROM learning_modules WHERE code='FSA-06'),
 'What are the three main depreciation methods?',
 'Straight-line (equal expense each year), declining balance (accelerated, higher expense early), and units-of-production (based on usage). Method choice affects reported income, assets, and ratios.',
 '{fra,long-lived-assets,depreciation}'),
((SELECT id FROM learning_modules WHERE code='FSA-06'),
 'How does asset revaluation work under IFRS?',
 'Under the revaluation model, PPE is carried at fair value. Increases go to other comprehensive income (revaluation surplus). Decreases first offset any existing surplus, then are recognized as a loss in income.',
 '{fra,long-lived-assets,revaluation}'),
((SELECT id FROM learning_modules WHERE code='FSA-06'),
 'How is impairment tested under US GAAP vs. IFRS?',
 'US GAAP: Two-step. (1) If carrying value > undiscounted future cash flows, impaired. (2) Loss = carrying value - fair value. IFRS: One-step. If carrying value > recoverable amount (higher of fair value less costs to sell and value in use), impaired.',
 '{fra,long-lived-assets,impairment}');

-- --------------------------------------------------------
-- FLASHCARDS — FRA-07: Analysis of Income Taxes
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='FSA-07'),
 'What creates deferred tax liabilities and assets?',
 'DTL: Carrying value > Tax base for assets, or Carrying value < Tax base for liabilities (future taxable amounts). DTA: Carrying value < Tax base for assets, or Carrying value > Tax base for liabilities (future deductible amounts).',
 '{fra,income-taxes,deferred-tax}'),
((SELECT id FROM learning_modules WHERE code='FSA-07'),
 'What is the relationship between tax expense and tax payable?',
 'Tax expense = Tax payable + Change in DTL - Change in DTA. Tax payable is the actual tax owed based on taxable income. Tax expense is the GAAP amount on the income statement.',
 '{fra,income-taxes,tax-expense}'),
((SELECT id FROM learning_modules WHERE code='FSA-07'),
 'What is a valuation allowance?',
 'A contra-account that reduces the carrying value of a DTA when it is more likely than not (>50% probability) that some or all of the DTA will not be realized through sufficient future taxable income.',
 '{fra,income-taxes,valuation-allowance}'),
((SELECT id FROM learning_modules WHERE code='FSA-07'),
 'What is the difference between permanent and temporary differences?',
 'Temporary differences reverse over time and create DTAs/DTLs (e.g., different depreciation methods). Permanent differences never reverse and affect the effective tax rate but do not create deferred tax items (e.g., tax-exempt interest income).',
 '{fra,income-taxes,differences}');

-- --------------------------------------------------------
-- FLASHCARDS — FRA-08: Analysis of Long-Term Liabilities
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='FSA-08'),
 'How does the effective interest method work for bonds?',
 'Interest expense = Market rate at issuance x Carrying value. Coupon payment = Coupon rate x Face value. For discount bonds: expense > coupon (discount amortizes, carrying value increases). For premium bonds: expense < coupon (premium amortizes, carrying value decreases).',
 '{fra,long-term-liabilities,bonds}'),
((SELECT id FROM learning_modules WHERE code='FSA-08'),
 'How are leases treated under IFRS 16?',
 'Lessees recognize virtually all leases on balance sheet as a right-of-use asset and lease liability. No operating/finance lease distinction for lessees (with limited exceptions for short-term and low-value leases).',
 '{fra,long-term-liabilities,leases}'),
((SELECT id FROM learning_modules WHERE code='FSA-08'),
 'What happens when a bond is issued at a discount?',
 'Issue price < Face value. Carrying value increases each period as discount amortizes. Interest expense > Coupon payment. At maturity, carrying value = face value.',
 '{fra,long-term-liabilities,discount-bonds}'),
((SELECT id FROM learning_modules WHERE code='FSA-08'),
 'How does issuing debt vs. equity affect financial ratios?',
 'Debt increases leverage (D/E ratio), creates interest expense (lowers net income), but provides a tax shield. Equity reduces leverage, dilutes EPS, but does not require mandatory payments.',
 '{fra,long-term-liabilities,debt-vs-equity}');

-- --------------------------------------------------------
-- FLASHCARDS — FRA-09: Financial Reporting Quality
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='FSA-09'),
 'What is the difference between reporting quality and earnings quality?',
 'Reporting quality: how faithfully reports represent economic reality (compliance with standards, transparency). Earnings quality: how sustainable, adequate, and reflective of underlying economics the reported earnings are.',
 '{fra,reporting-quality,overview}'),
((SELECT id FROM learning_modules WHERE code='FSA-09'),
 'What is channel stuffing?',
 'Shipping excess inventory to distributors near the end of a reporting period to inflate reported revenue. It typically reverses in subsequent periods through higher returns or lower future sales.',
 '{fra,reporting-quality,channel-stuffing}'),
((SELECT id FROM learning_modules WHERE code='FSA-09'),
 'What are common red flags in financial reporting?',
 'Revenue growing faster than cash flow, frequent accounting policy changes, unusual related party transactions, large adjustments in the fourth quarter, and significant off-balance sheet items.',
 '{fra,reporting-quality,red-flags}'),
((SELECT id FROM learning_modules WHERE code='FSA-09'),
 'What is big bath accounting?',
 'Taking large one-time write-offs in a single period (often during management changes) to depress current earnings and make future periods look comparatively better.',
 '{fra,reporting-quality,big-bath}');

-- --------------------------------------------------------
-- FLASHCARDS — FRA-10: Financial Analysis Techniques
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='FSA-10'),
 'What is common-size analysis?',
 'Expressing financial statement items as percentages of a base. Income statement: each item as % of revenue. Balance sheet: each item as % of total assets. Facilitates comparison across companies of different sizes.',
 '{fra,analysis-techniques,common-size}'),
((SELECT id FROM learning_modules WHERE code='FSA-10'),
 'What is the DuPont decomposition of ROE?',
 'ROE = Net profit margin x Asset turnover x Financial leverage = (NI/Revenue) x (Revenue/Assets) x (Assets/Equity). Shows whether ROE is driven by profitability, efficiency, or leverage.',
 '{fra,analysis-techniques,dupont}'),
((SELECT id FROM learning_modules WHERE code='FSA-10'),
 'What are the key activity ratios?',
 'Inventory turnover = COGS / Avg inventory. Receivables turnover = Revenue / Avg receivables. Payables turnover = Purchases / Avg payables. Total asset turnover = Revenue / Avg total assets.',
 '{fra,analysis-techniques,activity-ratios}'),
((SELECT id FROM learning_modules WHERE code='FSA-10'),
 'What are the key profitability ratios?',
 'ROE = NI / Equity. ROA = NI / Assets. Gross margin = Gross profit / Revenue. Operating margin = EBIT / Revenue. Net margin = NI / Revenue.',
 '{fra,analysis-techniques,profitability-ratios}');

-- --------------------------------------------------------
-- FLASHCARDS — CF-01: Organizational Forms
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='CORP-01'),
 'What are the key advantages of the corporate form?',
 'Limited liability for shareholders, perpetual life, easy transferability of ownership, access to capital markets, and professional management.',
 '{corporate-issuers,organizational-forms,advantages}'),
((SELECT id FROM learning_modules WHERE code='CORP-01'),
 'What is double taxation?',
 'Corporate income is taxed at the corporate level, and dividends paid to shareholders are taxed again at the individual level. This is a key disadvantage of the corporate form compared to partnerships.',
 '{corporate-issuers,organizational-forms,taxation}'),
((SELECT id FROM learning_modules WHERE code='CORP-01'),
 'What is the difference between an IPO and a secondary offering?',
 'IPO (Initial Public Offering): first sale of shares to the public by a private company. Secondary (seasoned) offering: additional share issuance by an already public company.',
 '{corporate-issuers,organizational-forms,ipo}'),
((SELECT id FROM learning_modules WHERE code='CORP-01'),
 'What are the main business organizational forms?',
 'Sole proprietorship (single owner, unlimited liability), general partnership (shared ownership, unlimited liability), limited partnership (GP + LPs with limited liability), and corporation (limited liability, separate legal entity).',
 '{corporate-issuers,organizational-forms,types}');

-- --------------------------------------------------------
-- FLASHCARDS — CF-02: Investors and Other Stakeholders
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='CORP-02'),
 'What is the principal-agent problem?',
 'Arises from separation of ownership (shareholders/principals) and control (managers/agents). Managers may pursue personal interests (higher pay, perks, empire building) at the expense of shareholder value.',
 '{corporate-issuers,stakeholders,agency}'),
((SELECT id FROM learning_modules WHERE code='CORP-02'),
 'What are the three types of agency costs?',
 'Monitoring costs (auditing, oversight of management), bonding costs (contractual guarantees by agents), and residual losses (costs from imperfect alignment despite monitoring and bonding).',
 '{corporate-issuers,stakeholders,agency-costs}'),
((SELECT id FROM learning_modules WHERE code='CORP-02'),
 'What is information asymmetry?',
 'When one party (typically management) has more or better information than another party (shareholders, creditors). Leads to adverse selection and moral hazard problems.',
 '{corporate-issuers,stakeholders,information-asymmetry}'),
((SELECT id FROM learning_modules WHERE code='CORP-02'),
 'What is the shareholder-creditor conflict?',
 'Shareholders may prefer risky investments (they capture upside) while creditors prefer safety (they bear downside). Asset substitution: using debt to fund riskier projects. Dividend payout: distributing assets to shareholders reduces the asset base backing debt.',
 '{corporate-issuers,stakeholders,conflicts}');

-- --------------------------------------------------------
-- FLASHCARDS — CF-03: Corporate Governance
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='CORP-03'),
 'What is the role of the board of directors?',
 'Represents shareholders, oversees management, sets strategic direction, approves major decisions, hires/fires senior executives, and ensures accountability. Should include a majority of independent directors.',
 '{corporate-issuers,governance,board}'),
((SELECT id FROM learning_modules WHERE code='CORP-03'),
 'What are common takeover defenses?',
 'Staggered board (directors elected in classes), poison pill (shareholder rights plan), golden parachutes (executive severance), supermajority voting requirements, and dual-class share structures.',
 '{corporate-issuers,governance,takeover-defenses}'),
((SELECT id FROM learning_modules WHERE code='CORP-03'),
 'What are ESG factors?',
 'Environmental (climate risk, emissions, resource use), Social (labor practices, diversity, community impact), Governance (board structure, executive pay, shareholder rights). Increasingly material to investment analysis.',
 '{corporate-issuers,governance,esg}'),
((SELECT id FROM learning_modules WHERE code='CORP-03'),
 'What makes corporate governance effective?',
 'Independent board majority, separate CEO/Chair roles, transparent financial reporting, strong audit committee, aligned executive compensation, protection of minority shareholder rights, and clear ethical standards.',
 '{corporate-issuers,governance,effectiveness}');

-- --------------------------------------------------------
-- FLASHCARDS — CF-04: Working Capital and Liquidity
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='CORP-04'),
 'What is the cash conversion cycle?',
 'CCC = Days of inventory on hand + Days of sales outstanding - Number of days of payables. Measures the time between cash outflow for inputs and cash inflow from sales. Lower is better.',
 '{corporate-issuers,working-capital,ccc}'),
((SELECT id FROM learning_modules WHERE code='CORP-04'),
 'How are DOH, DSO, and DPO calculated?',
 'DOH = (Avg inventory / COGS) x 365. DSO = (Avg receivables / Revenue) x 365. DPO = (Avg payables / Purchases) x 365.',
 '{corporate-issuers,working-capital,ratios}'),
((SELECT id FROM learning_modules WHERE code='CORP-04'),
 'What are primary vs. secondary sources of liquidity?',
 'Primary: cash balances, short-term investments, bank credit lines, and cash from operations. Secondary: asset liquidation, debt renegotiation, bankruptcy protection. Using secondary sources signals financial distress.',
 '{corporate-issuers,working-capital,liquidity}'),
((SELECT id FROM learning_modules WHERE code='CORP-04'),
 'How can a company improve its cash conversion cycle?',
 'Reduce DOH (better inventory management), reduce DSO (faster collections, stricter credit terms), or increase DPO (negotiate longer payment terms with suppliers). Each shortens the time cash is tied up.',
 '{corporate-issuers,working-capital,improvement}');

-- --------------------------------------------------------
-- FLASHCARDS — CF-05: Capital Investments and Capital Allocation
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='CORP-05'),
 'What is NPV and the NPV decision rule?',
 'NPV = Sum of PV of future cash flows - Initial investment. Accept if NPV > 0 (project creates value). Reject if NPV < 0. NPV is the preferred capital budgeting method.',
 '{corporate-issuers,capital-allocation,npv}'),
((SELECT id FROM learning_modules WHERE code='CORP-05'),
 'What is IRR and its limitations?',
 'IRR is the discount rate where NPV = 0. Accept if IRR > required return. Limitations: assumes reinvestment at IRR, can give multiple IRRs for non-conventional cash flows, and may conflict with NPV for mutually exclusive projects.',
 '{corporate-issuers,capital-allocation,irr}'),
((SELECT id FROM learning_modules WHERE code='CORP-05'),
 'What are real options in capital budgeting?',
 'Options embedded in capital projects: timing option (delay), abandonment option (exit), expansion option (scale up), flexibility option (change inputs/outputs). They add value beyond traditional NPV.',
 '{corporate-issuers,capital-allocation,real-options}'),
((SELECT id FROM learning_modules WHERE code='CORP-05'),
 'What is the payback period and its limitations?',
 'Time to recover the initial investment from cash flows. Simple to calculate and understand. Limitations: ignores time value of money, ignores cash flows beyond payback, and does not measure value creation.',
 '{corporate-issuers,capital-allocation,payback}');
