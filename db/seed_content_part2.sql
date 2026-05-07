-- ============================================================
-- Wingman — Seed Content Part 2
-- Topics: EQ, DER, AI, PM
-- Modules, Learning Outcomes, Questions, Flashcards
-- ============================================================

-- --------------------------------------------------------
-- LEARNING MODULES — Equity Investments (6 LMs)
-- --------------------------------------------------------
INSERT INTO learning_modules (topic_id, code, title, sort_order) VALUES
    ((SELECT id FROM topics WHERE code='EQU'), 'EQU-01', 'Market Organization and Structure', 1),
    ((SELECT id FROM topics WHERE code='EQU'), 'EQU-02', 'Security Market Indexes', 2),
    ((SELECT id FROM topics WHERE code='EQU'), 'EQU-03', 'Market Efficiency', 3),
    ((SELECT id FROM topics WHERE code='EQU'), 'EQU-04', 'Overview of Equity Securities', 4),
    ((SELECT id FROM topics WHERE code='EQU'), 'EQU-05', 'Company Analysis: Past and Present', 5),
    ((SELECT id FROM topics WHERE code='EQU'), 'EQU-06', 'Equity Valuation: Concepts and Basic Tools', 6)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- LEARNING MODULES — Derivatives (4 LMs)
-- --------------------------------------------------------
INSERT INTO learning_modules (topic_id, code, title, sort_order) VALUES
    ((SELECT id FROM topics WHERE code='DER'), 'DER-01', 'Derivative Instrument and Derivative Market Features', 1),
    ((SELECT id FROM topics WHERE code='DER'), 'DER-02', 'Forward Commitment and Contingent Claim Features and Instruments', 2),
    ((SELECT id FROM topics WHERE code='DER'), 'DER-03', 'Derivative Benefits, Risks, and Issuer and Investor Uses', 3),
    ((SELECT id FROM topics WHERE code='DER'), 'DER-04', 'Arbitrage, Replication, and the Cost of Carry in Pricing Derivatives', 4)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- LEARNING MODULES — Alternative Investments (3 LMs)
-- --------------------------------------------------------
INSERT INTO learning_modules (topic_id, code, title, sort_order) VALUES
    ((SELECT id FROM topics WHERE code='ALT'), 'ALT-01', 'Alternative Investment Features, Methods, and Structures', 1),
    ((SELECT id FROM topics WHERE code='ALT'), 'ALT-02', 'Alternative Investment Performance and Returns', 2),
    ((SELECT id FROM topics WHERE code='ALT'), 'ALT-03', 'Alternative Investment Due Diligence', 3)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- LEARNING MODULES — Portfolio Management (4 LMs)
-- --------------------------------------------------------
INSERT INTO learning_modules (topic_id, code, title, sort_order) VALUES
    ((SELECT id FROM topics WHERE code='PM'), 'PM-01', 'Portfolio Management: An Overview', 1),
    ((SELECT id FROM topics WHERE code='PM'), 'PM-02', 'Basics of Portfolio Planning and Construction', 2),
    ((SELECT id FROM topics WHERE code='PM'), 'PM-03', 'Portfolio Risk and Return: Part I', 3),
    ((SELECT id FROM topics WHERE code='PM'), 'PM-04', 'Portfolio Risk and Return: Part II', 4)
ON CONFLICT (code) DO NOTHING;


-- ============================================================
-- LEARNING OUTCOMES
-- ============================================================

-- --------------------------------------------------------
-- LOs — EQ-01: Market Organization and Structure
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
    ((SELECT id FROM learning_modules WHERE code='EQU-01'), 'EQU-01-LO01', 'Explain the main functions of the financial system', 2, 1),
    ((SELECT id FROM learning_modules WHERE code='EQU-01'), 'EQU-01-LO02', 'Describe classifications of assets and markets', 2, 2),
    ((SELECT id FROM learning_modules WHERE code='EQU-01'), 'EQU-01-LO03', 'Describe the major types of securities, currencies, contracts, commodities, and real assets that trade in organized markets', 2, 3),
    ((SELECT id FROM learning_modules WHERE code='EQU-01'), 'EQU-01-LO04', 'Compare positions an investor can take in an asset and the order types used to establish those positions', 4, 4)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- LOs — EQ-02: Security Market Indexes
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
    ((SELECT id FROM learning_modules WHERE code='EQU-02'), 'EQU-02-LO01', 'Describe a security market index and explain how it is constructed and managed', 2, 1),
    ((SELECT id FROM learning_modules WHERE code='EQU-02'), 'EQU-02-LO02', 'Compare the different weighting methods used in index construction', 4, 2),
    ((SELECT id FROM learning_modules WHERE code='EQU-02'), 'EQU-02-LO03', 'Describe rebalancing and reconstitution of an index', 2, 3),
    ((SELECT id FROM learning_modules WHERE code='EQU-02'), 'EQU-02-LO04', 'Describe uses of security market indexes', 2, 4)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- LOs — EQ-03: Market Efficiency
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
    ((SELECT id FROM learning_modules WHERE code='EQU-03'), 'EQU-03-LO01', 'Describe market efficiency and explain the conditions for a market to be informationally efficient', 2, 1),
    ((SELECT id FROM learning_modules WHERE code='EQU-03'), 'EQU-03-LO02', 'Distinguish between the three forms of market efficiency: weak, semi-strong, and strong', 4, 2),
    ((SELECT id FROM learning_modules WHERE code='EQU-03'), 'EQU-03-LO03', 'Describe market pricing anomalies and their implications for market efficiency', 2, 3)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- LOs — EQ-04: Overview of Equity Securities
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
    ((SELECT id FROM learning_modules WHERE code='EQU-04'), 'EQU-04-LO01', 'Describe characteristics of types of equity securities', 2, 1),
    ((SELECT id FROM learning_modules WHERE code='EQU-04'), 'EQU-04-LO02', 'Describe differences in voting rights and other ownership characteristics among different equity classes', 2, 2),
    ((SELECT id FROM learning_modules WHERE code='EQU-04'), 'EQU-04-LO03', 'Compare and contrast public and private equity securities', 4, 3),
    ((SELECT id FROM learning_modules WHERE code='EQU-04'), 'EQU-04-LO04', 'Describe methods for investing in non-domestic equity securities', 2, 4)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- LOs — EQ-05: Company Analysis: Past and Present
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
    ((SELECT id FROM learning_modules WHERE code='EQU-05'), 'EQU-05-LO01', 'Describe the elements of industry and competitive analysis', 2, 1),
    ((SELECT id FROM learning_modules WHERE code='EQU-05'), 'EQU-05-LO02', 'Explain the effects of barriers to entry, industry concentration, and industry capacity on pricing power and return on capital', 2, 2),
    ((SELECT id FROM learning_modules WHERE code='EQU-05'), 'EQU-05-LO03', 'Describe the tools used for company analysis including financial ratios and peer comparisons', 2, 3)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- LOs — EQ-06: Equity Valuation: Concepts and Basic Tools
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
    ((SELECT id FROM learning_modules WHERE code='EQU-06'), 'EQU-06-LO01', 'Describe the dividend discount model and calculate the intrinsic value of a stock using the DDM', 3, 1),
    ((SELECT id FROM learning_modules WHERE code='EQU-06'), 'EQU-06-LO02', 'Describe the free-cash-flow-to-equity model and explain its use in valuation', 2, 2),
    ((SELECT id FROM learning_modules WHERE code='EQU-06'), 'EQU-06-LO03', 'Calculate and interpret the price-to-earnings, price-to-book, and price-to-sales ratios', 3, 3),
    ((SELECT id FROM learning_modules WHERE code='EQU-06'), 'EQU-06-LO04', 'Explain the rationale for using price multiples to estimate equity value and describe enterprise value multiples', 2, 4)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- LOs — DER-01: Derivative Instrument and Derivative Market Features
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
    ((SELECT id FROM learning_modules WHERE code='DER-01'), 'DER-01-LO01', 'Define a derivative and describe basic features of a derivative instrument', 1, 1),
    ((SELECT id FROM learning_modules WHERE code='DER-01'), 'DER-01-LO02', 'Describe the differences between exchange-traded and over-the-counter derivatives', 2, 2),
    ((SELECT id FROM learning_modules WHERE code='DER-01'), 'DER-01-LO03', 'Explain the role of central clearing and the function of clearinghouses in derivative markets', 2, 3)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- LOs — DER-02: Forward Commitment and Contingent Claim Features
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
    ((SELECT id FROM learning_modules WHERE code='DER-02'), 'DER-02-LO01', 'Describe forward commitments and contingent claims and distinguish between the two', 2, 1),
    ((SELECT id FROM learning_modules WHERE code='DER-02'), 'DER-02-LO02', 'Describe the characteristics of forward contracts, futures contracts, and swaps', 2, 2),
    ((SELECT id FROM learning_modules WHERE code='DER-02'), 'DER-02-LO03', 'Describe the characteristics of options and distinguish between European and American options', 2, 3),
    ((SELECT id FROM learning_modules WHERE code='DER-02'), 'DER-02-LO04', 'Calculate the payoff of a forward contract and an option at expiration', 3, 4)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- LOs — DER-03: Derivative Benefits, Risks, and Uses
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
    ((SELECT id FROM learning_modules WHERE code='DER-03'), 'DER-03-LO01', 'Describe benefits and risks of derivative instruments', 2, 1),
    ((SELECT id FROM learning_modules WHERE code='DER-03'), 'DER-03-LO02', 'Explain how derivatives are used by issuers and investors for risk management, speculation, and arbitrage', 2, 2),
    ((SELECT id FROM learning_modules WHERE code='DER-03'), 'DER-03-LO03', 'Compare the use of derivatives among issuers and investors', 4, 3)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- LOs — DER-04: Arbitrage, Replication, and Cost of Carry
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
    ((SELECT id FROM learning_modules WHERE code='DER-04'), 'DER-04-LO01', 'Explain the concepts of arbitrage and replication in the context of derivative pricing', 2, 1),
    ((SELECT id FROM learning_modules WHERE code='DER-04'), 'DER-04-LO02', 'Explain the concept of the cost of carry and how it affects forward pricing', 2, 2),
    ((SELECT id FROM learning_modules WHERE code='DER-04'), 'DER-04-LO03', 'Calculate the no-arbitrage forward price given the spot price, risk-free rate, and carry costs or benefits', 3, 3)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- LOs — AI-01: Alternative Investment Features, Methods, and Structures
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
    ((SELECT id FROM learning_modules WHERE code='ALT-01'), 'ALT-01-LO01', 'Describe types and categories of alternative investments including hedge funds, private equity, real estate, commodities, and infrastructure', 2, 1),
    ((SELECT id FROM learning_modules WHERE code='ALT-01'), 'ALT-01-LO02', 'Describe investment and compensation structures commonly used in alternative investments', 2, 2),
    ((SELECT id FROM learning_modules WHERE code='ALT-01'), 'ALT-01-LO03', 'Explain the concepts of limited partnerships and fund-of-funds structures', 2, 3)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- LOs — AI-02: Alternative Investment Performance and Returns
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
    ((SELECT id FROM learning_modules WHERE code='ALT-02'), 'ALT-02-LO01', 'Describe issues in performance appraisal of alternative investments', 2, 1),
    ((SELECT id FROM learning_modules WHERE code='ALT-02'), 'ALT-02-LO02', 'Calculate and interpret returns of alternative investments on both a gross-of-fees and net-of-fees basis', 3, 2),
    ((SELECT id FROM learning_modules WHERE code='ALT-02'), 'ALT-02-LO03', 'Describe biases and challenges in alternative investment return measurement including survivorship bias and backfill bias', 2, 3)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- LOs — AI-03: Alternative Investment Due Diligence
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
    ((SELECT id FROM learning_modules WHERE code='ALT-03'), 'ALT-03-LO01', 'Describe the due diligence process for alternative investments', 2, 1),
    ((SELECT id FROM learning_modules WHERE code='ALT-03'), 'ALT-03-LO02', 'Describe key factors in assessing alternative investment manager and strategy risk', 2, 2),
    ((SELECT id FROM learning_modules WHERE code='ALT-03'), 'ALT-03-LO03', 'Explain the importance of legal, tax, and operational considerations in alternative investment due diligence', 2, 3)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- LOs — PM-01: Portfolio Management: An Overview
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
    ((SELECT id FROM learning_modules WHERE code='PM-01'), 'PM-01-LO01', 'Describe the portfolio management process and the role of portfolio managers', 2, 1),
    ((SELECT id FROM learning_modules WHERE code='PM-01'), 'PM-01-LO02', 'Describe types of investors and their distinctive characteristics and needs', 2, 2),
    ((SELECT id FROM learning_modules WHERE code='PM-01'), 'PM-01-LO03', 'Describe the steps in the portfolio management process: planning, execution, and feedback', 2, 3)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- LOs — PM-02: Basics of Portfolio Planning and Construction
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
    ((SELECT id FROM learning_modules WHERE code='PM-02'), 'PM-02-LO01', 'Describe the components of an investment policy statement (IPS) and explain its purpose', 2, 1),
    ((SELECT id FROM learning_modules WHERE code='PM-02'), 'PM-02-LO02', 'Describe risk and return objectives and how they relate to an investor''s constraints', 2, 2),
    ((SELECT id FROM learning_modules WHERE code='PM-02'), 'PM-02-LO03', 'Explain the principles of asset allocation and the role of strategic versus tactical allocation', 2, 3),
    ((SELECT id FROM learning_modules WHERE code='PM-02'), 'PM-02-LO04', 'Describe ESG considerations in portfolio planning and construction', 2, 4)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- LOs — PM-03: Portfolio Risk and Return: Part I
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
    ((SELECT id FROM learning_modules WHERE code='PM-03'), 'PM-03-LO01', 'Calculate and interpret major return measures including holding period return, arithmetic mean return, and geometric mean return', 3, 1),
    ((SELECT id FROM learning_modules WHERE code='PM-03'), 'PM-03-LO02', 'Describe the characteristics of the major asset classes used in portfolio construction', 2, 2),
    ((SELECT id FROM learning_modules WHERE code='PM-03'), 'PM-03-LO03', 'Calculate and interpret the expected return and variance of a two-asset portfolio', 3, 3),
    ((SELECT id FROM learning_modules WHERE code='PM-03'), 'PM-03-LO04', 'Explain the concept of diversification and its effect on portfolio risk', 2, 4)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- LOs — PM-04: Portfolio Risk and Return: Part II
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
    ((SELECT id FROM learning_modules WHERE code='PM-04'), 'PM-04-LO01', 'Describe the capital allocation line (CAL) and the capital market line (CML)', 2, 1),
    ((SELECT id FROM learning_modules WHERE code='PM-04'), 'PM-04-LO02', 'Explain systematic and unsystematic risk and describe the capital asset pricing model (CAPM)', 2, 2),
    ((SELECT id FROM learning_modules WHERE code='PM-04'), 'PM-04-LO03', 'Calculate and interpret beta and the expected return of a security using the CAPM', 3, 3),
    ((SELECT id FROM learning_modules WHERE code='PM-04'), 'PM-04-LO04', 'Describe the security market line (SML) and how to use it to determine whether a security is overvalued or undervalued', 2, 4)
ON CONFLICT (code) DO NOTHING;


-- ============================================================
-- QUESTIONS (5 per module, ~85 total)
-- ============================================================

-- --------------------------------------------------------
-- Questions — EQ-01: Market Organization and Structure
-- --------------------------------------------------------
INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='EQU-01'),
 (SELECT id FROM learning_outcomes WHERE code='EQU-01-LO01'),
 'Which of the following best describes the primary function of the financial system?',
 'To set fiscal policy for governments',
 'To facilitate the allocation of resources across time, among sectors, and among regions',
 'To ensure all investors earn positive returns',
 'B', 'The financial system allows resources to be allocated efficiently across time (saving and borrowing), across sectors (from savers to those with productive investment opportunities), and among regions.', 2),

((SELECT id FROM learning_modules WHERE code='EQU-01'),
 (SELECT id FROM learning_outcomes WHERE code='EQU-01-LO02'),
 'A market order is most accurately described as an instruction to:',
 'Buy or sell at the best available price immediately',
 'Buy or sell only at a specified price or better',
 'Buy or sell at a price determined by the exchange at the end of the day',
 'A', 'A market order instructs the broker to execute the trade immediately at the best currently available price. Limit orders specify a price threshold; market-on-close orders execute at the end of the trading session.', 2),

((SELECT id FROM learning_modules WHERE code='EQU-01'),
 (SELECT id FROM learning_outcomes WHERE code='EQU-01-LO03'),
 'An investor who sells a security short most likely profits when the security''s price:',
 'Increases above the sale price',
 'Remains unchanged',
 'Decreases below the sale price',
 'C', 'A short seller borrows and sells a security, hoping to repurchase it later at a lower price. The profit comes from the price decline between the sale and the subsequent repurchase.', 2),

((SELECT id FROM learning_modules WHERE code='EQU-01'),
 (SELECT id FROM learning_outcomes WHERE code='EQU-01-LO04'),
 'Which type of market is most likely to involve a dealer quoting both a bid and an ask price?',
 'Quote-driven market',
 'Order-driven market',
 'Brokered market',
 'A', 'In a quote-driven (dealer) market, dealers stand ready to buy and sell, quoting bid and ask prices. Order-driven markets match buyers and sellers based on submitted orders. Brokered markets use brokers to find counterparties for large or unique transactions.', 3),

((SELECT id FROM learning_modules WHERE code='EQU-01'),
 (SELECT id FROM learning_outcomes WHERE code='EQU-01-LO01'),
 'A margin call is most likely triggered when:',
 'An investor''s equity falls below the maintenance margin requirement',
 'The initial margin exceeds the value of the securities purchased',
 'The price of the purchased security increases above the purchase price',
 'A', 'A margin call occurs when the investor''s account equity drops below the maintenance margin requirement set by the broker, typically due to a decline in the value of the purchased securities.', 2);

-- --------------------------------------------------------
-- Questions — EQ-02: Security Market Indexes
-- --------------------------------------------------------
INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='EQU-02'),
 (SELECT id FROM learning_outcomes WHERE code='EQU-02-LO01'),
 'A price-weighted index gives the greatest weight to the constituent with the:',
 'Largest market capitalization',
 'Highest stock price',
 'Highest trading volume',
 'B', 'In a price-weighted index, each constituent is weighted by its price per share. The stock with the highest price has the greatest influence on the index value, regardless of its market capitalization or trading volume.', 2),

((SELECT id FROM learning_modules WHERE code='EQU-02'),
 (SELECT id FROM learning_outcomes WHERE code='EQU-02-LO02'),
 'Index reconstitution is best described as the process of:',
 'Adjusting the weights of existing index constituents',
 'Changing the securities included in the index based on selection criteria',
 'Adjusting the index for stock splits and dividends',
 'B', 'Reconstitution is the process of changing the constituent securities in an index. It involves removing securities that no longer meet the selection criteria and adding securities that newly qualify. Rebalancing adjusts the weights.', 3),

((SELECT id FROM learning_modules WHERE code='EQU-02'),
 (SELECT id FROM learning_outcomes WHERE code='EQU-02-LO03'),
 'Which weighting method requires the most frequent rebalancing?',
 'Market-capitalization weighting',
 'Equal weighting',
 'Price weighting',
 'B', 'An equal-weighted index requires the most frequent rebalancing because as stock prices change, the equal weights drift. Market-cap-weighted indexes are self-rebalancing as weights adjust naturally with price changes.', 3),

((SELECT id FROM learning_modules WHERE code='EQU-02'),
 (SELECT id FROM learning_outcomes WHERE code='EQU-02-LO04'),
 'A float-adjusted market-capitalization-weighted index uses the number of shares that are:',
 'Authorized by the company''s charter',
 'Held by company insiders and controlling shareholders',
 'Available to the investing public for trading',
 'C', 'Float-adjusted market-cap weighting uses only the shares available for public trading (the free float), excluding shares held by insiders, governments, and other strategic holders that are unlikely to be traded.', 2),

((SELECT id FROM learning_modules WHERE code='EQU-02'),
 (SELECT id FROM learning_outcomes WHERE code='EQU-02-LO01'),
 'Which of the following is most likely a use of security market indexes?',
 'Setting monetary policy targets',
 'Serving as benchmarks for evaluating portfolio manager performance',
 'Determining corporate tax rates',
 'B', 'Security market indexes are widely used as benchmarks against which the performance of portfolio managers and investment strategies is evaluated. They also serve as the basis for index funds and as proxies for measuring market returns and systematic risk.', 1);

-- --------------------------------------------------------
-- Questions — EQ-03: Market Efficiency
-- --------------------------------------------------------
INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='EQU-03'),
 (SELECT id FROM learning_outcomes WHERE code='EQU-03-LO01'),
 'In a semi-strong-form efficient market, security prices fully reflect:',
 'Only past trading data such as prices and volumes',
 'All publicly available information',
 'All information, including private and insider information',
 'B', 'Semi-strong-form efficiency states that prices reflect all publicly available information, including financial statements, news, and economic data. Weak form reflects only past market data; strong form reflects all information including private.', 2),

((SELECT id FROM learning_modules WHERE code='EQU-03'),
 (SELECT id FROM learning_outcomes WHERE code='EQU-03-LO02'),
 'If technical analysis consistently generates abnormal returns, which form of market efficiency is most likely violated?',
 'Weak form',
 'Semi-strong form',
 'Strong form',
 'A', 'Weak-form efficiency implies that past price and volume data are already reflected in current prices, making technical analysis ineffective. If technical analysis generates abnormal returns, weak-form efficiency is violated.', 2),

((SELECT id FROM learning_modules WHERE code='EQU-03'),
 (SELECT id FROM learning_outcomes WHERE code='EQU-03-LO03'),
 'The January effect is an example of a:',
 'Calendar anomaly',
 'Momentum anomaly',
 'Overreaction anomaly',
 'A', 'The January effect refers to the tendency for small-cap stocks to outperform in January. It is classified as a calendar anomaly because the abnormal returns are associated with a particular time period.', 2),

((SELECT id FROM learning_modules WHERE code='EQU-03'),
 (SELECT id FROM learning_outcomes WHERE code='EQU-03-LO01'),
 'An informationally efficient market most likely requires:',
 'Homogeneous investor expectations and zero transaction costs',
 'A large number of independent, profit-seeking market participants',
 'Government regulation setting fair prices',
 'B', 'Market efficiency is promoted by a large number of independent, profit-seeking participants who analyze and trade securities, driving prices toward intrinsic value. Homogeneous expectations and zero transaction costs are theoretical ideals, not requirements.', 3),

((SELECT id FROM learning_modules WHERE code='EQU-03'),
 (SELECT id FROM learning_outcomes WHERE code='EQU-03-LO02'),
 'Which of the following is most consistent with market efficiency?',
 'Professional mutual fund managers consistently outperform their benchmark after fees',
 'Stock prices adjust rapidly and accurately to new earnings announcements',
 'Stocks with low P/E ratios always outperform stocks with high P/E ratios',
 'B', 'Rapid and accurate price adjustment to new public information is the hallmark of an efficient market. Consistent outperformance by active managers would suggest inefficiency, as would a persistent P/E anomaly.', 2);

-- --------------------------------------------------------
-- Questions — EQ-04: Overview of Equity Securities
-- --------------------------------------------------------
INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='EQU-04'),
 (SELECT id FROM learning_outcomes WHERE code='EQU-04-LO01'),
 'Preferred stock is most accurately described as equity that:',
 'Typically has voting rights superior to common stock',
 'Has characteristics of both debt and equity, with a fixed dividend',
 'Always converts to common stock at a predetermined ratio',
 'B', 'Preferred stock has hybrid characteristics: it pays a fixed dividend similar to bond coupon payments (debt-like feature) but represents ownership in the company (equity feature). It typically does not carry voting rights.', 2),

((SELECT id FROM learning_modules WHERE code='EQU-04'),
 (SELECT id FROM learning_outcomes WHERE code='EQU-04-LO02'),
 'Depository receipts are most likely used to:',
 'Facilitate domestic trading of foreign company shares',
 'Increase the voting rights of minority shareholders',
 'Hedge currency risk in international portfolios',
 'A', 'Depository receipts (such as ADRs and GDRs) allow investors to hold shares of foreign companies that trade on local exchanges in local currency, facilitating cross-border equity investment without directly accessing foreign exchanges.', 2),

((SELECT id FROM learning_modules WHERE code='EQU-04'),
 (SELECT id FROM learning_outcomes WHERE code='EQU-04-LO03'),
 'Compared to public equity, private equity investments are most likely characterized by:',
 'Greater liquidity and lower return expectations',
 'Lower liquidity and potentially higher returns to compensate for illiquidity risk',
 'Greater transparency and regulatory oversight',
 'B', 'Private equity is less liquid than public equity because shares are not traded on public exchanges. Investors demand a return premium (illiquidity premium) to compensate for the difficulty and uncertainty of selling their positions.', 3),

((SELECT id FROM learning_modules WHERE code='EQU-04'),
 (SELECT id FROM learning_outcomes WHERE code='EQU-04-LO04'),
 'A company issues two classes of common shares, Class A with 10 votes per share and Class B with 1 vote per share. This dual-class structure most likely allows:',
 'All shareholders to receive equal dividends per share',
 'Founders to maintain control with a minority economic interest',
 'Regulators to approve all major corporate decisions',
 'B', 'Dual-class share structures allow founders and insiders to retain voting control over the company even when they hold a minority of the total economic interest, because their shares carry disproportionately more votes.', 3),

((SELECT id FROM learning_modules WHERE code='EQU-04'),
 (SELECT id FROM learning_outcomes WHERE code='EQU-04-LO01'),
 'The book value of equity most likely represents:',
 'The present value of expected future dividends',
 'The market price of the company''s outstanding shares',
 'The accounting value of total assets minus total liabilities',
 'C', 'Book value of equity is an accounting measure equal to total assets minus total liabilities on the balance sheet. It differs from market value, which reflects investor expectations, and from intrinsic value based on discounted future cash flows.', 1);

-- --------------------------------------------------------
-- Questions — EQ-05: Company Analysis: Past and Present
-- --------------------------------------------------------
INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='EQU-05'),
 (SELECT id FROM learning_outcomes WHERE code='EQU-05-LO01'),
 'Porter''s five forces framework is most useful for analyzing:',
 'The macroeconomic environment affecting all industries',
 'The competitive structure and attractiveness of an industry',
 'The internal financial strength of a specific company',
 'B', 'Porter''s five forces (threat of new entrants, bargaining power of suppliers, bargaining power of buyers, threat of substitutes, and intensity of rivalry) analyzes the competitive dynamics that determine the profitability and attractiveness of an industry.', 2),

((SELECT id FROM learning_modules WHERE code='EQU-05'),
 (SELECT id FROM learning_outcomes WHERE code='EQU-05-LO02'),
 'High barriers to entry in an industry are most likely to result in:',
 'Lower prices and thinner profit margins for existing firms',
 'Greater pricing power and higher returns on capital for existing firms',
 'Increased number of competitors over time',
 'B', 'High barriers to entry (large capital requirements, regulatory obstacles, strong brands, patents) limit the number of new competitors, allowing existing firms to maintain pricing power and earn higher returns on invested capital.', 2),

((SELECT id FROM learning_modules WHERE code='EQU-05'),
 (SELECT id FROM learning_outcomes WHERE code='EQU-05-LO03'),
 'A company''s return on equity (ROE) is best decomposed using:',
 'The capital asset pricing model',
 'The DuPont analysis',
 'The Gordon growth model',
 'B', 'DuPont analysis decomposes ROE into net profit margin, asset turnover, and financial leverage, helping analysts identify the drivers of a company''s return on equity. CAPM prices risk, and the Gordon model values stocks.', 2),

((SELECT id FROM learning_modules WHERE code='EQU-05'),
 (SELECT id FROM learning_outcomes WHERE code='EQU-05-LO01'),
 'An industry with low concentration and many small competitors is best described as:',
 'Oligopolistic',
 'Monopolistic',
 'Fragmented',
 'C', 'A fragmented industry has many small competitors, none with significant market share. Oligopolistic industries have few large firms, and a monopolistic industry has one dominant firm.', 1),

((SELECT id FROM learning_modules WHERE code='EQU-05'),
 (SELECT id FROM learning_outcomes WHERE code='EQU-05-LO02'),
 'A peer analysis comparing financial ratios across similar companies is most useful for:',
 'Determining a company''s absolute intrinsic value',
 'Identifying relative strengths and weaknesses of a company within its industry',
 'Predicting macroeconomic trends',
 'B', 'Peer comparison of financial ratios allows analysts to identify how a company performs relative to its competitors in terms of profitability, efficiency, leverage, and valuation, revealing relative strengths and weaknesses.', 2);

-- --------------------------------------------------------
-- Questions — EQ-06: Equity Valuation: Concepts and Basic Tools
-- --------------------------------------------------------
INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='EQU-06'),
 (SELECT id FROM learning_outcomes WHERE code='EQU-06-LO01'),
 'Using the Gordon growth model, a stock with a current dividend of $2.00, a required return of 10%, and a constant growth rate of 4% has an intrinsic value closest to:',
 '$33.33',
 '$34.67',
 '$50.00',
 'B', 'Gordon growth model: V = D1 / (r - g) = D0 * (1 + g) / (r - g) = 2.00 * 1.04 / (0.10 - 0.04) = 2.08 / 0.06 = $34.67.', 3),

((SELECT id FROM learning_modules WHERE code='EQU-06'),
 (SELECT id FROM learning_outcomes WHERE code='EQU-06-LO02'),
 'A stock with a trailing P/E of 15 and earnings per share of $3.00 has a market price closest to:',
 '$5.00',
 '$45.00',
 '$18.00',
 'B', 'The trailing P/E ratio equals market price divided by trailing EPS. Therefore, price = P/E x EPS = 15 x $3.00 = $45.00.', 1),

((SELECT id FROM learning_modules WHERE code='EQU-06'),
 (SELECT id FROM learning_outcomes WHERE code='EQU-06-LO03'),
 'Enterprise value is most accurately calculated as:',
 'Market capitalization plus total debt minus cash and cash equivalents',
 'Market capitalization minus total debt plus cash and cash equivalents',
 'Total assets minus total liabilities',
 'A', 'Enterprise value = market capitalization + total debt + preferred stock + minority interest - cash and cash equivalents. It represents the total cost of acquiring a company and assuming its debt while gaining its cash.', 2),

((SELECT id FROM learning_modules WHERE code='EQU-06'),
 (SELECT id FROM learning_outcomes WHERE code='EQU-06-LO04'),
 'Compared to the dividend discount model, the free-cash-flow-to-equity (FCFE) model is more appropriate when:',
 'The company pays a constant and predictable dividend',
 'The company''s dividends differ significantly from its capacity to pay dividends',
 'The company has no debt outstanding',
 'B', 'The FCFE model is more appropriate when dividends do not reflect the company''s true capacity to pay (e.g., the company retains significantly more earnings than it pays out). FCFE measures cash available to equity holders regardless of actual dividend policy.', 3),

((SELECT id FROM learning_modules WHERE code='EQU-06'),
 (SELECT id FROM learning_outcomes WHERE code='EQU-06-LO01'),
 'A low price-to-book (P/B) ratio relative to peers most likely indicates:',
 'The stock is definitely overvalued',
 'The market expects lower future growth or profitability for the company',
 'The company has high intangible assets not reflected on the balance sheet',
 'B', 'A low P/B ratio relative to peers often signals that the market expects the company to generate lower returns on equity or has weaker growth prospects. It may indicate undervaluation or genuine concerns about future performance.', 3);

-- --------------------------------------------------------
-- Questions — DER-01: Derivative Instrument and Derivative Market Features
-- --------------------------------------------------------
INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='DER-01'),
 (SELECT id FROM learning_outcomes WHERE code='DER-01-LO01'),
 'A derivative is best defined as a financial instrument whose value:',
 'Is determined solely by supply and demand for the instrument itself',
 'Is derived from the value of an underlying asset, rate, or index',
 'Is guaranteed by a government agency',
 'B', 'A derivative is a financial instrument whose value depends on (is derived from) the value of an underlying asset, reference rate, or index. The underlying can be equities, bonds, commodities, currencies, interest rates, or market indexes.', 1),

((SELECT id FROM learning_modules WHERE code='DER-01'),
 (SELECT id FROM learning_outcomes WHERE code='DER-01-LO02'),
 'Compared to exchange-traded derivatives, over-the-counter (OTC) derivatives are most likely:',
 'More standardized and more liquid',
 'More customizable but subject to greater counterparty risk',
 'Less risky due to direct negotiation between parties',
 'B', 'OTC derivatives are privately negotiated, allowing customization of terms, but they carry greater counterparty credit risk because there is no exchange or clearinghouse guaranteeing performance. Exchange-traded derivatives are standardized with central clearing.', 2),

((SELECT id FROM learning_modules WHERE code='DER-01'),
 (SELECT id FROM learning_outcomes WHERE code='DER-01-LO03'),
 'The primary role of a clearinghouse in derivative markets is to:',
 'Set the prices of derivative contracts',
 'Act as counterparty to both sides of a trade, reducing counterparty risk',
 'Provide investment advice to market participants',
 'B', 'A clearinghouse interposes itself between the buyer and seller, becoming the counterparty to each. This arrangement significantly reduces counterparty risk because traders face the clearinghouse rather than each other.', 2),

((SELECT id FROM learning_modules WHERE code='DER-01'),
 (SELECT id FROM learning_outcomes WHERE code='DER-01-LO01'),
 'Which of the following is a characteristic of exchange-traded derivative markets?',
 'Contract terms are negotiated between the buyer and seller',
 'Standardized contract terms and centralized clearing',
 'Absence of margin requirements',
 'B', 'Exchange-traded derivatives have standardized terms (contract size, expiration dates, delivery specifications) and use central clearinghouses to manage counterparty risk. Margin requirements are imposed to provide collateral.', 1),

((SELECT id FROM learning_modules WHERE code='DER-01'),
 (SELECT id FROM learning_outcomes WHERE code='DER-01-LO02'),
 'The notional principal of a derivative contract represents:',
 'The actual amount of money at risk in the position',
 'The amount used to calculate payments between counterparties',
 'The market value of the derivative contract',
 'B', 'The notional principal (or notional amount) is a reference amount used to calculate payments. It is not the amount exchanged or at risk; actual payments are typically much smaller fractions of the notional amount.', 2);

-- --------------------------------------------------------
-- Questions — DER-02: Forward Commitment and Contingent Claim Features
-- --------------------------------------------------------
INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='DER-02'),
 (SELECT id FROM learning_outcomes WHERE code='DER-02-LO01'),
 'A forward contract differs from a futures contract primarily because forwards are:',
 'Traded on exchanges with standardized terms',
 'Privately negotiated and customized between two parties',
 'Settled daily through a mark-to-market process',
 'B', 'Forward contracts are privately negotiated OTC agreements between two parties with customized terms. Futures contracts are standardized, exchange-traded, and subject to daily mark-to-market settlement.', 2),

((SELECT id FROM learning_modules WHERE code='DER-02'),
 (SELECT id FROM learning_outcomes WHERE code='DER-02-LO02'),
 'An investor enters a long forward contract to buy an asset at $50. At expiration, the spot price is $55. The payoff to the long position is:',
 '-$5',
 '$0',
 '$5',
 'C', 'The payoff to the long position in a forward contract at expiration is: spot price - forward price = $55 - $50 = $5. The long benefits when the spot price exceeds the forward price.', 1),

((SELECT id FROM learning_modules WHERE code='DER-02'),
 (SELECT id FROM learning_outcomes WHERE code='DER-02-LO03'),
 'In an interest rate swap, the party that pays the fixed rate and receives the floating rate most likely benefits when:',
 'Interest rates decrease',
 'Interest rates increase',
 'Interest rates remain stable',
 'B', 'The fixed-rate payer receives the floating rate. When interest rates rise, the floating payments received increase while the fixed payments made remain constant, benefiting the fixed-rate payer.', 2),

((SELECT id FROM learning_modules WHERE code='DER-02'),
 (SELECT id FROM learning_outcomes WHERE code='DER-02-LO04'),
 'The holder of a European call option can exercise the option:',
 'At any time up to and including the expiration date',
 'Only on the expiration date',
 'Only during the first half of the contract period',
 'B', 'European options can only be exercised on the expiration date, unlike American options which can be exercised at any time before or on the expiration date.', 1),

((SELECT id FROM learning_modules WHERE code='DER-02'),
 (SELECT id FROM learning_outcomes WHERE code='DER-02-LO01'),
 'A contingent claim differs from a forward commitment because the contingent claim:',
 'Obligates both parties to transact',
 'Provides the holder with a right, not an obligation, to transact',
 'Always has a positive payoff at expiration',
 'B', 'Contingent claims (options) give the holder the right but not the obligation to buy or sell an underlying asset. Forward commitments (forwards, futures, swaps) obligate both parties to the agreed transaction.', 2);

-- --------------------------------------------------------
-- Questions — DER-03: Derivative Benefits, Risks, and Uses
-- --------------------------------------------------------
INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='DER-03'),
 (SELECT id FROM learning_outcomes WHERE code='DER-03-LO01'),
 'Which of the following is most likely a benefit of derivatives for investors?',
 'Elimination of all investment risk',
 'Ability to modify portfolio risk exposures at lower cost and greater speed than trading the underlying',
 'Guaranteed positive returns on hedged positions',
 'B', 'Derivatives allow investors to adjust risk exposures quickly and cost-effectively without buying or selling the underlying assets. They do not eliminate all risk or guarantee positive returns.', 2),

((SELECT id FROM learning_modules WHERE code='DER-03'),
 (SELECT id FROM learning_outcomes WHERE code='DER-03-LO02'),
 'An airline company that enters into futures contracts to lock in the price of jet fuel is most likely using derivatives for:',
 'Speculation',
 'Hedging',
 'Arbitrage',
 'B', 'The airline is hedging its exposure to jet fuel price increases by locking in a purchase price through futures. This reduces uncertainty in operating costs.', 1),

((SELECT id FROM learning_modules WHERE code='DER-03'),
 (SELECT id FROM learning_outcomes WHERE code='DER-03-LO03'),
 'Operational risk in the context of derivatives most accurately refers to the risk of:',
 'Price movements in the underlying asset',
 'Losses from inadequate internal processes, human error, or system failures',
 'A counterparty defaulting on its obligations',
 'B', 'Operational risk encompasses losses from failures in internal processes, systems, or human actions. It is distinct from market risk (price movements) and credit risk (counterparty default).', 2),

((SELECT id FROM learning_modules WHERE code='DER-03'),
 (SELECT id FROM learning_outcomes WHERE code='DER-03-LO01'),
 'Leverage in derivatives trading creates risk because:',
 'It reduces the notional amount of the position',
 'A small price change in the underlying can lead to large percentage gains or losses relative to capital invested',
 'It eliminates counterparty risk',
 'B', 'Derivatives often require only a small initial outlay (margin or premium) relative to the notional value of the contract. This leverage means small price movements in the underlying translate to large percentage changes in the value of the derivative position.', 3),

((SELECT id FROM learning_modules WHERE code='DER-03'),
 (SELECT id FROM learning_outcomes WHERE code='DER-03-LO02'),
 'A speculator who expects interest rates to rise would most likely:',
 'Enter a pay-fixed, receive-floating interest rate swap',
 'Enter a pay-floating, receive-fixed interest rate swap',
 'Buy a bond',
 'A', 'A speculator expecting rising rates would want to receive floating-rate payments (which increase with rates) and pay the fixed rate. This position profits when floating rates exceed the fixed rate.', 3);

-- --------------------------------------------------------
-- Questions — DER-04: Arbitrage, Replication, and Cost of Carry
-- --------------------------------------------------------
INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='DER-04'),
 (SELECT id FROM learning_outcomes WHERE code='DER-04-LO01'),
 'The no-arbitrage forward price of a non-dividend-paying stock is best calculated as:',
 'Spot price multiplied by (1 + risk-free rate)^T',
 'Spot price divided by (1 + risk-free rate)^T',
 'Spot price plus the expected stock return over the period',
 'A', 'The no-arbitrage forward price for a non-dividend-paying asset is F = S * (1 + r)^T, where S is the spot price, r is the risk-free rate, and T is the time to expiration. This reflects the cost of carrying the asset.', 2),

((SELECT id FROM learning_modules WHERE code='DER-04'),
 (SELECT id FROM learning_outcomes WHERE code='DER-04-LO02'),
 'The cost of carry for a physical commodity most likely includes:',
 'Only the risk-free rate of financing',
 'Financing costs, storage costs, and insurance, minus any convenience yield',
 'Only the expected future spot price minus the current spot price',
 'B', 'For physical commodities, the cost of carry includes financing costs (opportunity cost of capital), storage costs, insurance, less any convenience yield (benefit from holding the physical commodity rather than the derivative).', 3),

((SELECT id FROM learning_modules WHERE code='DER-04'),
 (SELECT id FROM learning_outcomes WHERE code='DER-04-LO03'),
 'Replication in derivative pricing refers to:',
 'Creating a portfolio of the underlying asset and risk-free bonds that produces the same payoff as the derivative',
 'Duplicating a trade executed by another market participant',
 'Issuing multiple derivative contracts on the same underlying',
 'A', 'Replication involves constructing a portfolio using the underlying asset and risk-free bonds that exactly replicates the payoffs of the derivative. By the law of one price, the derivative and its replicating portfolio must have the same value.', 3),

((SELECT id FROM learning_modules WHERE code='DER-04'),
 (SELECT id FROM learning_outcomes WHERE code='DER-04-LO01'),
 'If the forward price of an asset is higher than its no-arbitrage value, an arbitrageur would most likely:',
 'Buy the forward and sell the underlying asset short',
 'Sell the forward and buy the underlying asset',
 'Buy both the forward and the underlying asset',
 'B', 'If the forward price is too high, the arbitrageur sells the overpriced forward, buys the underlying asset in the spot market (financing the purchase at the risk-free rate), and holds it until delivery. This locks in a risk-free profit.', 3),

((SELECT id FROM learning_modules WHERE code='DER-04'),
 (SELECT id FROM learning_outcomes WHERE code='DER-04-LO02'),
 'A stock is priced at $100, the risk-free rate is 5% per annum, and the stock pays a continuous dividend yield of 2%. The one-year no-arbitrage forward price is closest to:',
 '$103.00',
 '$105.00',
 '$103.05',
 'A', 'For an asset with a continuous dividend yield: F = S * e^((r - q) * T). Using simple compounding approximation: F = 100 * (1 + 0.05 - 0.02) = 100 * 1.03 = $103.00. The net cost of carry is the risk-free rate minus the dividend yield.', 4);

-- --------------------------------------------------------
-- Questions — AI-01: Alternative Investment Features, Methods, and Structures
-- --------------------------------------------------------
INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='ALT-01'),
 (SELECT id FROM learning_outcomes WHERE code='ALT-01-LO01'),
 'Which of the following is least likely classified as an alternative investment?',
 'A publicly traded large-cap equity ETF',
 'A private equity buyout fund',
 'A hedge fund employing a long/short strategy',
 'A', 'Traditional investments include publicly traded equities and bonds. Alternative investments include private equity, hedge funds, real estate, commodities, and infrastructure. A publicly traded large-cap equity ETF is a traditional investment.', 1),

((SELECT id FROM learning_modules WHERE code='ALT-01'),
 (SELECT id FROM learning_outcomes WHERE code='ALT-01-LO02'),
 'A private equity fund structured as a limited partnership most likely:',
 'Gives limited partners full management control over fund investments',
 'Has a general partner who manages the fund and limited partners who provide most of the capital',
 'Distributes all returns equally regardless of capital contributed',
 'B', 'In a limited partnership, the general partner (GP) manages the fund and makes investment decisions, while limited partners (LPs) provide the majority of capital. LPs have limited liability and limited management involvement.', 2),

((SELECT id FROM learning_modules WHERE code='ALT-01'),
 (SELECT id FROM learning_outcomes WHERE code='ALT-01-LO03'),
 'A "2 and 20" fee structure in a hedge fund refers to:',
 'A 2% management fee on committed capital and a 20% incentive fee on profits',
 'A 2% performance fee and a 20% management fee',
 'A 2% entry fee and a 20% exit fee',
 'A', 'The "2 and 20" fee structure charges a 2% annual management fee on assets under management and a 20% incentive (performance) fee on profits above a specified return threshold (hurdle rate).', 1),

((SELECT id FROM learning_modules WHERE code='ALT-01'),
 (SELECT id FROM learning_outcomes WHERE code='ALT-01-LO01'),
 'A fund-of-funds structure provides investors with:',
 'Direct control over individual investment selection',
 'Diversification across multiple managers and strategies but with an additional layer of fees',
 'Lower total fees than investing in a single hedge fund',
 'B', 'Fund-of-funds invest in multiple underlying hedge funds or private equity funds, providing diversification across managers and strategies. However, investors pay fees at both the fund-of-funds level and the underlying fund level, resulting in higher total fees.', 2),

((SELECT id FROM learning_modules WHERE code='ALT-01'),
 (SELECT id FROM learning_outcomes WHERE code='ALT-01-LO02'),
 'Compared to traditional investments, alternative investments are most likely characterized by:',
 'Daily liquidity and transparent pricing',
 'Low fees, standardized structures, and broad accessibility',
 'Limited liquidity, less transparency, and complex fee structures',
 'C', 'Alternative investments typically have limited liquidity (lockup periods, infrequent redemptions), less transparency (less disclosure of holdings and strategies), and complex fee structures (management fees plus incentive fees) compared to traditional investments.', 2);

-- --------------------------------------------------------
-- Questions — AI-02: Alternative Investment Performance and Returns
-- --------------------------------------------------------
INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='ALT-02'),
 (SELECT id FROM learning_outcomes WHERE code='ALT-02-LO01'),
 'Survivorship bias in hedge fund performance data most likely results in:',
 'Understating average reported returns',
 'Overstating average reported returns',
 'Having no effect on average reported returns',
 'B', 'Survivorship bias occurs when databases include only funds that have survived (continue to operate) and exclude funds that have closed, often due to poor performance. This overstates the average returns of the surviving fund universe.', 2),

((SELECT id FROM learning_modules WHERE code='ALT-02'),
 (SELECT id FROM learning_outcomes WHERE code='ALT-02-LO02'),
 'Backfill bias occurs when:',
 'A fund reports returns before they occur',
 'A fund''s historical returns are added to a database retroactively when the fund joins the database',
 'A fund delays reporting negative performance',
 'B', 'Backfill (or instant history) bias occurs when a fund joins a database and its past returns are retroactively added. Funds tend to join databases after periods of good performance, creating an upward bias in historical data.', 2),

((SELECT id FROM learning_modules WHERE code='ALT-02'),
 (SELECT id FROM learning_outcomes WHERE code='ALT-02-LO03'),
 'The internal rate of return (IRR) is the most commonly used performance measure for:',
 'Publicly traded equity portfolios',
 'Private equity funds',
 'Money market funds',
 'B', 'The IRR is the standard performance measure for private equity because of the irregular timing and magnitude of cash flows (capital calls and distributions). Time-weighted returns are standard for traditional portfolios with regular cash flows.', 2),

((SELECT id FROM learning_modules WHERE code='ALT-02'),
 (SELECT id FROM learning_outcomes WHERE code='ALT-02-LO01'),
 'A hedge fund charges a 2% management fee and 20% incentive fee with a high-water mark. If the fund''s NAV declines in a year, the incentive fee is most likely:',
 'Still charged on the absolute return',
 'Not charged, and the NAV must recover to the previous peak before incentive fees resume',
 'Charged at a reduced rate of 10%',
 'B', 'A high-water mark provision means the fund must recover past losses before earning incentive fees. If the NAV declines, no incentive fee is charged, and the NAV must surpass the previous peak (high-water mark) before the 20% fee applies again.', 2),

((SELECT id FROM learning_modules WHERE code='ALT-02'),
 (SELECT id FROM learning_outcomes WHERE code='ALT-02-LO02'),
 'Gross-of-fees returns for an alternative investment differ from net-of-fees returns because net-of-fees returns:',
 'Exclude the impact of all fund expenses',
 'Deduct management fees and incentive fees from the gross return',
 'Add back carry interest paid to the general partner',
 'B', 'Net-of-fees returns deduct management fees and incentive (performance) fees from the gross-of-fees return. Gross returns reflect investment performance before the deduction of fund-level fees. Net-of-fees returns are what investors actually receive.', 1);

-- --------------------------------------------------------
-- Questions — AI-03: Alternative Investment Due Diligence
-- --------------------------------------------------------
INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='ALT-03'),
 (SELECT id FROM learning_outcomes WHERE code='ALT-03-LO01'),
 'In the due diligence process for alternative investments, assessing the operational infrastructure of a fund manager most likely includes evaluating:',
 'Only the manager''s investment track record',
 'Back-office operations, compliance procedures, and risk management systems',
 'Only the fund''s historical returns relative to benchmarks',
 'B', 'Operational due diligence evaluates the infrastructure supporting the fund, including back-office operations, trade processing, compliance and regulatory procedures, risk management systems, IT infrastructure, and business continuity planning.', 2),

((SELECT id FROM learning_modules WHERE code='ALT-03'),
 (SELECT id FROM learning_outcomes WHERE code='ALT-03-LO02'),
 'A key risk factor assessed during alternative investment due diligence is:',
 'The risk-free rate in the economy',
 'The alignment of interests between the fund manager and investors through co-investment and personal capital at risk',
 'The average return of all funds in the same asset class',
 'B', 'Assessing the alignment of interests between manager and investors is critical. When managers have significant personal capital invested in the fund, their interests are better aligned with those of investors, reducing agency risk.', 3),

((SELECT id FROM learning_modules WHERE code='ALT-03'),
 (SELECT id FROM learning_outcomes WHERE code='ALT-03-LO03'),
 'Lockup periods and redemption restrictions in alternative investments are most likely designed to:',
 'Increase investor returns',
 'Allow the fund manager to invest in less liquid assets without forced selling',
 'Reduce the fund''s management fees',
 'B', 'Lockup periods and redemption restrictions give fund managers the ability to invest in illiquid assets and maintain long-term investment strategies without being forced to sell assets at unfavorable prices to meet investor redemptions.', 2),

((SELECT id FROM learning_modules WHERE code='ALT-03'),
 (SELECT id FROM learning_outcomes WHERE code='ALT-03-LO01'),
 'Legal due diligence for an alternative investment fund most likely involves reviewing:',
 'Only the fund''s marketing materials',
 'The limited partnership agreement, side letters, and regulatory filings',
 'Only the fund manager''s personal financial statements',
 'B', 'Legal due diligence involves reviewing the governing legal documents including the limited partnership agreement (LPA), side letters granting special terms to certain investors, offering memoranda, subscription agreements, and regulatory filings.', 2),

((SELECT id FROM learning_modules WHERE code='ALT-03'),
 (SELECT id FROM learning_outcomes WHERE code='ALT-03-LO02'),
 'Style drift in the context of alternative investment due diligence refers to:',
 'Changes in a fund''s benchmark index',
 'A fund manager deviating from the stated investment strategy or style over time',
 'The market-wide rotation from growth to value investing',
 'B', 'Style drift occurs when a fund manager gradually deviates from the investment strategy, style, or risk parameters described in the fund''s offering documents. Ongoing monitoring should detect style drift as part of the due diligence process.', 2);

-- --------------------------------------------------------
-- Questions — PM-01: Portfolio Management: An Overview
-- --------------------------------------------------------
INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='PM-01'),
 (SELECT id FROM learning_outcomes WHERE code='PM-01-LO01'),
 'The portfolio management process consists of three main steps. The correct order is:',
 'Execution, planning, feedback',
 'Planning, execution, feedback',
 'Feedback, planning, execution',
 'B', 'The portfolio management process follows three sequential steps: (1) Planning - developing the investment policy statement and asset allocation; (2) Execution - selecting specific securities and constructing the portfolio; (3) Feedback - monitoring and rebalancing the portfolio.', 1),

((SELECT id FROM learning_modules WHERE code='PM-01'),
 (SELECT id FROM learning_outcomes WHERE code='PM-01-LO02'),
 'Which of the following investors most likely has the longest time horizon and highest risk tolerance?',
 'A retired individual dependent on portfolio income',
 'A university endowment fund',
 'A bank managing its short-term liquidity portfolio',
 'B', 'University endowments have perpetual time horizons and can tolerate higher risk because they have ongoing contributions and no fixed liability dates. Retirees have shorter horizons and need stable income. Banks managing liquidity require very low risk.', 2),

((SELECT id FROM learning_modules WHERE code='PM-01'),
 (SELECT id FROM learning_outcomes WHERE code='PM-01-LO03'),
 'An investment policy statement (IPS) is most accurately described as a document that:',
 'Lists specific securities to be purchased and sold',
 'Outlines the investor''s objectives, constraints, and guidelines for managing the portfolio',
 'Provides a guarantee of minimum portfolio returns',
 'B', 'An IPS is a formal document that establishes the investor''s return and risk objectives, investment constraints (time horizon, liquidity, taxes, legal, unique circumstances), and guidelines governing portfolio management decisions.', 1),

((SELECT id FROM learning_modules WHERE code='PM-01'),
 (SELECT id FROM learning_outcomes WHERE code='PM-01-LO01'),
 'A defined benefit pension plan sponsor''s primary investment objective is most likely to:',
 'Maximize short-term trading profits',
 'Generate returns sufficient to fund future pension obligations',
 'Minimize the portfolio''s volatility regardless of returns',
 'B', 'A defined benefit pension plan has specific future obligations to plan beneficiaries. The investment objective is to generate sufficient returns to meet these future pension liabilities as they come due.', 2),

((SELECT id FROM learning_modules WHERE code='PM-01'),
 (SELECT id FROM learning_outcomes WHERE code='PM-01-LO02'),
 'Which investor type is most likely to have significant regulatory and legal constraints on its investment activities?',
 'An individual investor',
 'An insurance company',
 'A family office',
 'B', 'Insurance companies face significant regulatory constraints on their investment activities, including restrictions on asset types, concentration limits, and minimum capital requirements imposed by insurance regulators to protect policyholders.', 2);

-- --------------------------------------------------------
-- Questions — PM-02: Basics of Portfolio Planning and Construction
-- --------------------------------------------------------
INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='PM-02'),
 (SELECT id FROM learning_outcomes WHERE code='PM-02-LO01'),
 'Strategic asset allocation is best described as:',
 'Frequent rebalancing to take advantage of short-term market dislocations',
 'A long-term target allocation to asset classes based on the investor''s objectives and constraints',
 'Allocating all assets to a single asset class based on current market conditions',
 'B', 'Strategic asset allocation sets long-term target weights for various asset classes based on the investor''s objectives, risk tolerance, and constraints. It reflects the optimal mix that best meets the investor''s long-term needs.', 2),

((SELECT id FROM learning_modules WHERE code='PM-02'),
 (SELECT id FROM learning_outcomes WHERE code='PM-02-LO02'),
 'Tactical asset allocation differs from strategic asset allocation in that tactical allocation:',
 'Is based on the investor''s long-term objectives',
 'Involves short-term deviations from strategic targets to exploit perceived market opportunities',
 'Never changes the portfolio weights',
 'B', 'Tactical asset allocation involves short-term adjustments to the strategic allocation to capitalize on perceived market opportunities or changing market conditions. It is an active overlay on the strategic allocation.', 2),

((SELECT id FROM learning_modules WHERE code='PM-02'),
 (SELECT id FROM learning_outcomes WHERE code='PM-02-LO03'),
 'Which of the following is a constraint typically addressed in an investment policy statement?',
 'The manager''s preferred investment style',
 'The investor''s liquidity needs',
 'The expected risk premium on equities',
 'B', 'The IPS addresses investor constraints including liquidity needs, time horizon, tax considerations, legal and regulatory constraints, and unique circumstances. These constraints shape the investment strategy along with the return and risk objectives.', 1),

((SELECT id FROM learning_modules WHERE code='PM-02'),
 (SELECT id FROM learning_outcomes WHERE code='PM-02-LO04'),
 'ESG investing refers to investment approaches that consider:',
 'Exclusively short-term earnings growth',
 'Environmental, social, and governance factors alongside traditional financial analysis',
 'Only government bond investments',
 'B', 'ESG investing integrates environmental (climate, pollution), social (labor practices, community impact), and governance (board structure, executive compensation) factors into the investment analysis and decision-making process alongside traditional financial analysis.', 1),

((SELECT id FROM learning_modules WHERE code='PM-02'),
 (SELECT id FROM learning_outcomes WHERE code='PM-02-LO01'),
 'An investor with a short time horizon and high liquidity needs would most likely have an asset allocation weighted toward:',
 'Emerging market equities and private equity',
 'Short-term fixed income securities and money market instruments',
 'Long-duration government bonds and commodities',
 'B', 'Investors with short time horizons and high liquidity needs require assets that can be converted to cash quickly without significant loss of value. Short-term fixed income and money market instruments best meet these requirements.', 2);

-- --------------------------------------------------------
-- Questions — PM-03: Portfolio Risk and Return: Part I
-- --------------------------------------------------------
INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='PM-03'),
 (SELECT id FROM learning_outcomes WHERE code='PM-03-LO01'),
 'An investor buys a stock at $40 and sells it one year later at $44, receiving a $2 dividend during the holding period. The holding period return is closest to:',
 '10.0%',
 '15.0%',
 '12.5%',
 'B', 'Holding period return = (ending price - beginning price + income) / beginning price = ($44 - $40 + $2) / $40 = $6 / $40 = 15.0%.', 1),

((SELECT id FROM learning_modules WHERE code='PM-03'),
 (SELECT id FROM learning_outcomes WHERE code='PM-03-LO02'),
 'The geometric mean return is most appropriate for measuring:',
 'The average return over a single period',
 'The compound annual growth rate of an investment over multiple periods',
 'The expected return on a portfolio of assets',
 'B', 'The geometric mean return measures the compound rate of growth of the investment over time. It accounts for the compounding effect and is always less than or equal to the arithmetic mean when returns vary.', 2),

((SELECT id FROM learning_modules WHERE code='PM-03'),
 (SELECT id FROM learning_outcomes WHERE code='PM-03-LO03'),
 'A portfolio consists of 60% Stock A with an expected return of 10% and 40% Stock B with an expected return of 5%. The expected return of the portfolio is closest to:',
 '7.5%',
 '8.0%',
 '7.0%',
 'B', 'Portfolio expected return = w_A * E(R_A) + w_B * E(R_B) = 0.60 * 10% + 0.40 * 5% = 6% + 2% = 8.0%.', 1),

((SELECT id FROM learning_modules WHERE code='PM-03'),
 (SELECT id FROM learning_outcomes WHERE code='PM-03-LO04'),
 'The correlation between two assets ranges from -1 to +1. A correlation of -1 implies that:',
 'The two assets move perfectly in the same direction',
 'There is no relationship between the asset returns',
 'The two assets move perfectly in opposite directions, offering the maximum diversification benefit',
 'C', 'A correlation of -1 means the two assets move in perfectly opposite directions. This provides the maximum diversification benefit, and it is theoretically possible to construct a zero-risk portfolio with two perfectly negatively correlated assets.', 2),

((SELECT id FROM learning_modules WHERE code='PM-03'),
 (SELECT id FROM learning_outcomes WHERE code='PM-03-LO01'),
 'The risk of a portfolio is most likely less than the weighted average of the individual asset risks when:',
 'The correlation between assets is exactly +1',
 'The correlation between assets is less than +1',
 'All assets have the same expected return',
 'B', 'Portfolio risk (standard deviation) is less than the weighted average of individual asset risks whenever the correlation between assets is less than +1. This is the fundamental principle of diversification. Only when correlation equals +1 does portfolio risk equal the weighted average.', 2);

-- --------------------------------------------------------
-- Questions — PM-04: Portfolio Risk and Return: Part II
-- --------------------------------------------------------
INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='PM-04'),
 (SELECT id FROM learning_outcomes WHERE code='PM-04-LO01'),
 'According to the CAPM, the expected return on an asset is determined by:',
 'Its total risk (standard deviation)',
 'Its systematic risk (beta) and the market risk premium',
 'Its unsystematic risk and the risk-free rate',
 'B', 'The CAPM states that expected return = risk-free rate + beta * (market return - risk-free rate). Only systematic risk (beta) is priced because unsystematic risk can be diversified away.', 2),

((SELECT id FROM learning_modules WHERE code='PM-04'),
 (SELECT id FROM learning_outcomes WHERE code='PM-04-LO02'),
 'A stock has a beta of 1.2, the risk-free rate is 3%, and the expected market return is 10%. Using the CAPM, the expected return on the stock is closest to:',
 '11.4%',
 '12.0%',
 '15.0%',
 'A', 'Expected return = Rf + beta * (Rm - Rf) = 3% + 1.2 * (10% - 3%) = 3% + 1.2 * 7% = 3% + 8.4% = 11.4%.', 2),

((SELECT id FROM learning_modules WHERE code='PM-04'),
 (SELECT id FROM learning_outcomes WHERE code='PM-04-LO03'),
 'The capital market line (CML) represents portfolios that combine:',
 'Any two risky assets',
 'The risk-free asset with the market portfolio of all risky assets',
 'Only fixed income securities with equities',
 'B', 'The CML represents all efficient portfolios that are combinations of the risk-free asset and the market portfolio. It shows the highest expected return for each level of total risk (standard deviation) achievable through this combination.', 2),

((SELECT id FROM learning_modules WHERE code='PM-04'),
 (SELECT id FROM learning_outcomes WHERE code='PM-04-LO04'),
 'On the security market line (SML), a stock plotted above the line is:',
 'Overvalued because it offers too little return for its risk',
 'Undervalued because it offers more expected return than required by its beta',
 'Fairly valued because it lies on the efficient frontier',
 'B', 'A stock plotted above the SML offers a higher expected return than what the CAPM predicts for its level of systematic risk (beta). This suggests the stock is undervalued and represents a positive alpha opportunity.', 3),

((SELECT id FROM learning_modules WHERE code='PM-04'),
 (SELECT id FROM learning_outcomes WHERE code='PM-04-LO01'),
 'Systematic risk is best described as risk that:',
 'Can be eliminated through diversification across many assets',
 'Affects only a specific company or industry',
 'Affects the entire market and cannot be eliminated through diversification',
 'C', 'Systematic (market) risk affects all securities and arises from macroeconomic factors such as interest rate changes, recessions, and inflation. It cannot be eliminated through diversification, unlike unsystematic (company-specific) risk.', 1);


-- ============================================================
-- FLASHCARDS (4 per module, ~68 total)
-- ============================================================

-- --------------------------------------------------------
-- Flashcards — EQ-01: Market Organization and Structure
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='EQU-01'),
 'What are the three main functions of the financial system?',
 '1) Allow entities to save, borrow, raise equity capital, manage risks, exchange assets, and utilize information. 2) Determine equilibrium rates of return (price discovery). 3) Allocate capital to its most efficient uses.',
 '{equity,financial_system,functions}'),
((SELECT id FROM learning_modules WHERE code='EQU-01'),
 'What is the difference between a market order and a limit order?',
 'A market order executes immediately at the best available price. A limit order specifies a maximum purchase price (buy limit) or minimum sale price (sell limit) and only executes at or better than the specified price.',
 '{equity,orders,trading}'),
((SELECT id FROM learning_modules WHERE code='EQU-01'),
 'What is a short sale?',
 'A short sale involves borrowing a security and selling it with the obligation to return it later. The short seller profits if the price declines and must post margin as collateral. The short seller is responsible for any dividends paid during the borrowing period.',
 '{equity,short_selling,trading}'),
((SELECT id FROM learning_modules WHERE code='EQU-01'),
 'What is the difference between a quote-driven and an order-driven market?',
 'A quote-driven (dealer) market has dealers who post bid and ask prices and trade from their own inventory. An order-driven market uses rules to match buy and sell orders submitted by traders (e.g., price priority, time priority).',
 '{equity,market_structure,trading}');

-- --------------------------------------------------------
-- Flashcards — EQ-02: Security Market Indexes
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='EQU-02'),
 'What are the three main index weighting methods?',
 '1) Price-weighted: weight based on share price (e.g., DJIA). 2) Market-capitalization-weighted: weight based on market cap (e.g., S&P 500). 3) Equal-weighted: each constituent receives the same weight. Float-adjusted is a variation of market-cap weighting.',
 '{equity,indexes,weighting}'),
((SELECT id FROM learning_modules WHERE code='EQU-02'),
 'What is index reconstitution vs. rebalancing?',
 'Reconstitution is changing the securities in the index (adding/removing constituents based on selection criteria). Rebalancing is adjusting the weights of existing constituents back to target weights, typically done quarterly.',
 '{equity,indexes,reconstitution}'),
((SELECT id FROM learning_modules WHERE code='EQU-02'),
 'Why does an equal-weighted index require more frequent rebalancing?',
 'Because as stock prices change, equal weights drift. Stocks with higher returns become overweighted and stocks with lower returns become underweighted. Market-cap-weighted indexes are self-rebalancing as weights naturally adjust with price changes.',
 '{equity,indexes,rebalancing}'),
((SELECT id FROM learning_modules WHERE code='EQU-02'),
 'What are common uses of security market indexes?',
 '1) Benchmarks for portfolio performance evaluation. 2) Basis for index funds and ETFs. 3) Proxies for measuring systematic risk and market returns. 4) Gauges of market sentiment. 5) Basis for derivative contracts.',
 '{equity,indexes,uses}');

-- --------------------------------------------------------
-- Flashcards — EQ-03: Market Efficiency
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='EQU-03'),
 'What are the three forms of the efficient market hypothesis (EMH)?',
 'Weak form: prices reflect all past market data (prices, volume). Semi-strong form: prices reflect all publicly available information. Strong form: prices reflect all information, including private/insider information.',
 '{equity,market_efficiency,emh}'),
((SELECT id FROM learning_modules WHERE code='EQU-03'),
 'If markets are semi-strong-form efficient, which investment strategy is unlikely to generate abnormal returns?',
 'Fundamental analysis (analyzing financial statements, economic data, and publicly available information) cannot consistently generate abnormal returns because all public information is already reflected in prices. Only insider information could provide an edge.',
 '{equity,market_efficiency,fundamental_analysis}'),
((SELECT id FROM learning_modules WHERE code='EQU-03'),
 'What is a market anomaly?',
 'A market anomaly is a pattern in security returns that appears to contradict the efficient market hypothesis, such as the January effect (small-cap outperformance in January), the value effect (low P/E outperformance), and momentum (past winners continue to outperform).',
 '{equity,market_efficiency,anomalies}'),
((SELECT id FROM learning_modules WHERE code='EQU-03'),
 'What conditions promote market efficiency?',
 'Many independent, profit-maximizing participants analyzing securities; new information arriving randomly; investors adjusting prices rapidly in response to new information; and low transaction costs and few barriers to trading.',
 '{equity,market_efficiency,conditions}');

-- --------------------------------------------------------
-- Flashcards — EQ-04: Overview of Equity Securities
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='EQU-04'),
 'What are the key differences between common stock and preferred stock?',
 'Common stock carries voting rights and variable dividends; preferred stock typically has no voting rights but receives fixed dividends with priority over common stockholders. In liquidation, preferred shareholders are paid before common shareholders but after debt holders.',
 '{equity,securities,common_vs_preferred}'),
((SELECT id FROM learning_modules WHERE code='EQU-04'),
 'What are depository receipts (DRs)?',
 'Depository receipts are negotiable securities issued by a bank that represent shares in a foreign company. ADRs trade in the US in USD; GDRs trade in Europe. They allow investors to hold foreign shares without directly accessing foreign exchanges.',
 '{equity,securities,depository_receipts}'),
((SELECT id FROM learning_modules WHERE code='EQU-04'),
 'What is the difference between public and private equity?',
 'Public equity trades on regulated exchanges with high liquidity, transparency, and regulatory oversight. Private equity is not publicly traded, has limited liquidity, less transparency, and investors typically commit capital for long periods (7-10 years). Private equity investors demand an illiquidity premium.',
 '{equity,securities,public_vs_private}'),
((SELECT id FROM learning_modules WHERE code='EQU-04'),
 'What is a dual-class share structure?',
 'A dual-class structure has two or more classes of common shares with different voting rights (e.g., Class A with 10 votes per share, Class B with 1 vote). This allows founders/insiders to maintain control with a minority economic interest.',
 '{equity,securities,dual_class}');

-- --------------------------------------------------------
-- Flashcards — EQ-05: Company Analysis: Past and Present
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='EQU-05'),
 'What are Porter''s five competitive forces?',
 '1) Threat of new entrants. 2) Bargaining power of suppliers. 3) Bargaining power of buyers. 4) Threat of substitute products/services. 5) Intensity of rivalry among existing competitors. Together they determine industry profitability.',
 '{equity,company_analysis,porters_five_forces}'),
((SELECT id FROM learning_modules WHERE code='EQU-05'),
 'What is DuPont analysis?',
 'DuPont decomposes ROE into three components: ROE = Net Profit Margin x Asset Turnover x Equity Multiplier = (Net Income/Revenue) x (Revenue/Total Assets) x (Total Assets/Equity). This reveals whether ROE is driven by profitability, efficiency, or leverage.',
 '{equity,company_analysis,dupont}'),
((SELECT id FROM learning_modules WHERE code='EQU-05'),
 'How do barriers to entry affect industry profitability?',
 'High barriers to entry (large capital requirements, patents, regulatory licenses, strong brands, economies of scale) limit new competition, allowing existing firms to maintain pricing power and earn above-average returns on capital.',
 '{equity,company_analysis,barriers_to_entry}'),
((SELECT id FROM learning_modules WHERE code='EQU-05'),
 'What is the difference between a fragmented and a concentrated industry?',
 'A fragmented industry has many small competitors with no dominant player and typically intense price competition. A concentrated (oligopolistic) industry has a few large firms with significant market share, often with greater pricing power and higher margins.',
 '{equity,company_analysis,industry_structure}');

-- --------------------------------------------------------
-- Flashcards — EQ-06: Equity Valuation: Concepts and Basic Tools
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='EQU-06'),
 'What is the Gordon Growth Model (GGM) formula?',
 'V0 = D1 / (r - g), where D1 = expected dividend next year, r = required rate of return, g = constant growth rate of dividends. Assumes dividends grow at a constant rate forever and r > g.',
 '{equity,valuation,gordon_growth_model}'),
((SELECT id FROM learning_modules WHERE code='EQU-06'),
 'What is enterprise value (EV)?',
 'Enterprise value = Market capitalization + Total debt + Preferred stock + Minority interest - Cash and cash equivalents. EV represents the total value of a firm to all capital providers and is used in EV/EBITDA multiples for valuation comparisons.',
 '{equity,valuation,enterprise_value}'),
((SELECT id FROM learning_modules WHERE code='EQU-06'),
 'When is the FCFE model preferred over the DDM?',
 'The FCFE model is preferred when dividends do not reflect the company''s capacity to pay dividends (e.g., the company retains significantly more than it pays out). FCFE measures cash available to equity holders regardless of the actual dividend policy.',
 '{equity,valuation,fcfe}'),
((SELECT id FROM learning_modules WHERE code='EQU-06'),
 'What are the main price multiples used in equity valuation?',
 'P/E (Price-to-Earnings): most widely used, compares price to EPS. P/B (Price-to-Book): compares market value to book value. P/S (Price-to-Sales): useful for companies with negative earnings. EV/EBITDA: enterprise value multiple used for capital-structure-neutral comparisons.',
 '{equity,valuation,multiples}');

-- --------------------------------------------------------
-- Flashcards — DER-01: Derivative Instrument and Derivative Market Features
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='DER-01'),
 'What is a derivative?',
 'A derivative is a financial instrument whose value is derived from the performance of an underlying asset, index, rate, or event. Common underlyings include equities, bonds, commodities, currencies, interest rates, and credit events.',
 '{derivatives,definition,basics}'),
((SELECT id FROM learning_modules WHERE code='DER-01'),
 'How do exchange-traded derivatives differ from OTC derivatives?',
 'Exchange-traded: standardized contracts, central clearinghouse, lower counterparty risk, greater liquidity, margin requirements. OTC: customized terms, bilateral agreements, higher counterparty risk, less liquidity, but tailored to specific needs.',
 '{derivatives,exchange_vs_otc,markets}'),
((SELECT id FROM learning_modules WHERE code='DER-01'),
 'What role does a clearinghouse play in derivative markets?',
 'The clearinghouse acts as the counterparty to both the buyer and seller, guaranteeing contract performance. It reduces counterparty risk through margin requirements, daily settlement (mark-to-market), and maintaining a default fund.',
 '{derivatives,clearinghouse,risk_management}'),
((SELECT id FROM learning_modules WHERE code='DER-01'),
 'What is notional principal?',
 'The notional principal (or notional amount) is the reference amount used to calculate payments in a derivative contract. It is not exchanged between parties and does not represent the actual amount at risk. Actual payments are typically small fractions of the notional amount.',
 '{derivatives,notional_principal,basics}');

-- --------------------------------------------------------
-- Flashcards — DER-02: Forward Commitment and Contingent Claim Features
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='DER-02'),
 'What is the difference between a forward commitment and a contingent claim?',
 'Forward commitment: both parties are obligated to transact at a future date (forwards, futures, swaps). Contingent claim: the holder has the right, but not the obligation, to transact (options). The option holder pays a premium for this right.',
 '{derivatives,forwards_vs_options,classification}'),
((SELECT id FROM learning_modules WHERE code='DER-02'),
 'What are the payoff formulas for long forward and long call at expiration?',
 'Long forward payoff = ST - F (spot price minus forward price). Long call payoff = max(0, ST - X) where X is the strike price. The forward has no upfront cost; the call requires a premium payment.',
 '{derivatives,payoffs,formulas}'),
((SELECT id FROM learning_modules WHERE code='DER-02'),
 'What is the difference between European and American options?',
 'European options can only be exercised on the expiration date. American options can be exercised at any time up to and including the expiration date. American options are worth at least as much as otherwise identical European options due to the early exercise flexibility.',
 '{derivatives,options,european_vs_american}'),
((SELECT id FROM learning_modules WHERE code='DER-02'),
 'How does an interest rate swap work?',
 'In a plain vanilla interest rate swap, one party pays a fixed rate and receives a floating rate (e.g., SOFR); the other party does the reverse. Only the net difference is exchanged. Notional principal is not exchanged. Swaps are used to manage interest rate exposure.',
 '{derivatives,swaps,interest_rate}');

-- --------------------------------------------------------
-- Flashcards — DER-03: Derivative Benefits, Risks, and Uses
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='DER-03'),
 'What are the main benefits of using derivatives?',
 '1) Risk management (hedging unwanted exposures). 2) Price discovery (derivative prices convey information about future expectations). 3) Lower transaction costs compared to trading the underlying. 4) Increased market efficiency and liquidity. 5) Ability to gain exposure to otherwise inaccessible assets.',
 '{derivatives,benefits,overview}'),
((SELECT id FROM learning_modules WHERE code='DER-03'),
 'What are the main risks of derivatives?',
 '1) Market risk (adverse price movements). 2) Counterparty/credit risk (default by a party). 3) Liquidity risk (inability to close a position). 4) Operational risk (errors, system failures). 5) Leverage risk (small changes magnified). 6) Legal/regulatory risk.',
 '{derivatives,risks,overview}'),
((SELECT id FROM learning_modules WHERE code='DER-03'),
 'How do hedgers, speculators, and arbitrageurs use derivatives differently?',
 'Hedgers: reduce risk from adverse price movements in assets they hold or plan to acquire. Speculators: take directional bets to profit from expected price changes. Arbitrageurs: exploit pricing discrepancies between related instruments for risk-free profit.',
 '{derivatives,users,hedging_speculation_arbitrage}'),
((SELECT id FROM learning_modules WHERE code='DER-03'),
 'Why does leverage make derivatives risky?',
 'Derivatives require only a small initial outlay (margin or premium) relative to the notional value. This leverage means a small percentage change in the underlying translates to a much larger percentage change in the derivative position, amplifying both gains and losses.',
 '{derivatives,leverage,risk}');

-- --------------------------------------------------------
-- Flashcards — DER-04: Arbitrage, Replication, and Cost of Carry
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='DER-04'),
 'What is the no-arbitrage forward price for a non-dividend-paying asset?',
 'F = S0 * (1 + r)^T, where S0 is the current spot price, r is the risk-free rate, and T is the time to expiration. This reflects the cost of financing the purchase and holding the asset until the forward delivery date.',
 '{derivatives,pricing,forward_price}'),
((SELECT id FROM learning_modules WHERE code='DER-04'),
 'What is replication in derivative pricing?',
 'Replication means constructing a portfolio of the underlying asset and risk-free bonds that produces exactly the same payoffs as the derivative. By the law of one price, the derivative and its replicating portfolio must have the same value, which determines the fair price.',
 '{derivatives,pricing,replication}'),
((SELECT id FROM learning_modules WHERE code='DER-04'),
 'What is the cost of carry and its components?',
 'Cost of carry = financing costs + storage costs + insurance - convenience yield - income (dividends/coupons). The forward price equals the spot price adjusted for the net cost of carry. For financial assets, storage and convenience yield are typically zero.',
 '{derivatives,pricing,cost_of_carry}'),
((SELECT id FROM learning_modules WHERE code='DER-04'),
 'How does an arbitrageur exploit a mispriced forward?',
 'If forward is overpriced (F > S*(1+r)^T): sell the forward, buy the underlying (financed at the risk-free rate), deliver at expiration. If forward is underpriced (F < S*(1+r)^T): buy the forward, short sell the underlying, invest proceeds at the risk-free rate.',
 '{derivatives,pricing,arbitrage}');

-- --------------------------------------------------------
-- Flashcards — AI-01: Alternative Investment Features, Methods, and Structures
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='ALT-01'),
 'What are the main categories of alternative investments?',
 '1) Hedge funds (absolute return strategies). 2) Private equity (buyouts, venture capital, growth equity). 3) Real estate (direct property, REITs). 4) Commodities (physical goods, futures). 5) Infrastructure (transport, utilities, energy). 6) Natural resources and farmland.',
 '{alternatives,categories,overview}'),
((SELECT id FROM learning_modules WHERE code='ALT-01'),
 'What is a limited partnership structure in private equity?',
 'The general partner (GP) manages investments, has unlimited liability, and earns management and incentive fees. Limited partners (LPs) provide most of the capital, have limited liability capped at their investment, and have minimal management control.',
 '{alternatives,structure,limited_partnership}'),
((SELECT id FROM learning_modules WHERE code='ALT-01'),
 'What does "2 and 20" mean?',
 'A fee structure charging a 2% annual management fee on assets under management plus a 20% incentive fee on profits above a hurdle rate. Common in hedge funds and private equity. Some structures include high-water marks and clawback provisions.',
 '{alternatives,fees,two_and_twenty}'),
((SELECT id FROM learning_modules WHERE code='ALT-01'),
 'What is a fund-of-funds?',
 'A fund that invests in multiple underlying hedge funds or PE funds rather than directly in securities. Benefits: diversification across managers/strategies, access to top-tier funds, professional due diligence. Drawback: additional layer of fees reduces net returns.',
 '{alternatives,structure,fund_of_funds}');

-- --------------------------------------------------------
-- Flashcards — AI-02: Alternative Investment Performance and Returns
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='ALT-02'),
 'What is survivorship bias in hedge fund performance data?',
 'Survivorship bias occurs when only surviving (active) funds are included in performance databases. Funds that failed or closed (often due to poor returns) are excluded, inflating average reported returns and understating risk.',
 '{alternatives,performance,survivorship_bias}'),
((SELECT id FROM learning_modules WHERE code='ALT-02'),
 'What is backfill (instant history) bias?',
 'Backfill bias occurs when a fund joins a database and its past returns are retroactively added. Funds typically join after good performance, inflating historical database returns. New funds with poor early performance never join.',
 '{alternatives,performance,backfill_bias}'),
((SELECT id FROM learning_modules WHERE code='ALT-02'),
 'Why is IRR used for private equity rather than time-weighted return?',
 'Private equity has irregular and unpredictable cash flows (capital calls and distributions controlled by the GP). IRR accounts for the timing and magnitude of all cash flows, making it more appropriate than TWR, which assumes the investor controls the timing of flows.',
 '{alternatives,performance,irr}'),
((SELECT id FROM learning_modules WHERE code='ALT-02'),
 'What is a high-water mark provision?',
 'A high-water mark ensures the fund manager earns incentive fees only on new profits above the previous peak NAV. If the fund loses value, the NAV must recover past the previous high before incentive fees are charged, protecting investors from paying fees on recovered losses.',
 '{alternatives,fees,high_water_mark}');

-- --------------------------------------------------------
-- Flashcards — AI-03: Alternative Investment Due Diligence
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='ALT-03'),
 'What are the key areas of alternative investment due diligence?',
 '1) Investment strategy and process. 2) Manager background and track record. 3) Operational infrastructure (back-office, compliance, IT). 4) Risk management. 5) Legal structure and terms. 6) Fund governance. 7) Fee transparency and alignment of interests.',
 '{alternatives,due_diligence,areas}'),
((SELECT id FROM learning_modules WHERE code='ALT-03'),
 'What is style drift and why does it matter?',
 'Style drift is when a fund manager gradually deviates from the stated investment strategy. It matters because investors selected the fund based on its described strategy and risk profile. Drift may expose investors to unintended risks and alter portfolio diversification.',
 '{alternatives,due_diligence,style_drift}'),
((SELECT id FROM learning_modules WHERE code='ALT-03'),
 'Why are lockup periods used in alternative investments?',
 'Lockup periods restrict investor redemptions for a set period (often 1-3 years). They allow managers to invest in illiquid assets with longer time horizons without worrying about forced selling to meet redemptions. Investors accept reduced liquidity in exchange for potentially higher returns.',
 '{alternatives,due_diligence,lockup_periods}'),
((SELECT id FROM learning_modules WHERE code='ALT-03'),
 'What alignment of interests mechanisms should be evaluated during due diligence?',
 'Key mechanisms: GP co-investment (personal capital invested alongside LPs), clawback provisions (require GP to return excess fees), high-water marks, hurdle rates, appropriate lockup periods, and transparent fee reporting.',
 '{alternatives,due_diligence,alignment_of_interests}');

-- --------------------------------------------------------
-- Flashcards — PM-01: Portfolio Management: An Overview
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='PM-01'),
 'What are the three steps of the portfolio management process?',
 '1) Planning: develop the IPS, determine investment objectives and constraints, set asset allocation. 2) Execution: analyze securities, construct portfolio, execute trades. 3) Feedback: monitor and rebalance, evaluate performance, adjust strategy as needed.',
 '{portfolio,process,steps}'),
((SELECT id FROM learning_modules WHERE code='PM-01'),
 'What are the main types of institutional investors?',
 '1) Pension funds (defined benefit and defined contribution). 2) Endowments and foundations. 3) Insurance companies (life and property/casualty). 4) Sovereign wealth funds. 5) Banks. Each has distinct return objectives, risk tolerance, time horizon, and constraints.',
 '{portfolio,investors,institutional}'),
((SELECT id FROM learning_modules WHERE code='PM-01'),
 'What is an investment policy statement (IPS)?',
 'A formal document that establishes the investor''s return objectives, risk tolerance, investment constraints (liquidity, time horizon, taxes, legal/regulatory, unique circumstances), and guidelines governing portfolio management. It is the foundation of the portfolio management process.',
 '{portfolio,ips,definition}'),
((SELECT id FROM learning_modules WHERE code='PM-01'),
 'How do defined benefit and defined contribution pension plans differ?',
 'Defined benefit: the sponsor promises a specific retirement benefit; the sponsor bears investment risk. Defined contribution: the employee and/or employer contribute to individual accounts; the employee bears investment risk and chooses investments.',
 '{portfolio,investors,pension_plans}');

-- --------------------------------------------------------
-- Flashcards — PM-02: Basics of Portfolio Planning and Construction
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='PM-02'),
 'What is strategic asset allocation?',
 'Strategic asset allocation (SAA) is the long-term target mix of asset classes designed to achieve the investor''s objectives given their constraints. It is the primary determinant of portfolio risk and return. SAA reflects the investor''s risk tolerance, time horizon, and return requirements.',
 '{portfolio,asset_allocation,strategic}'),
((SELECT id FROM learning_modules WHERE code='PM-02'),
 'What is tactical asset allocation?',
 'Tactical asset allocation (TAA) involves short-term deviations from the strategic allocation to exploit perceived market opportunities or changing conditions. TAA adds active risk relative to the strategic benchmark. It assumes some degree of market timing ability.',
 '{portfolio,asset_allocation,tactical}'),
((SELECT id FROM learning_modules WHERE code='PM-02'),
 'What are the five investment constraints in an IPS?',
 '1) Liquidity: need for cash to meet expected and unexpected obligations. 2) Time horizon: investment period length. 3) Tax considerations: tax status and implications. 4) Legal and regulatory: laws and rules governing the investor. 5) Unique circumstances: any special needs or preferences.',
 '{portfolio,ips,constraints}'),
((SELECT id FROM learning_modules WHERE code='PM-02'),
 'What does ESG integration mean in portfolio construction?',
 'ESG integration incorporates environmental, social, and governance factors into security analysis and portfolio construction alongside traditional financial metrics. Approaches include negative screening (excluding), positive screening (favoring), thematic investing, and impact investing.',
 '{portfolio,esg,integration}');

-- --------------------------------------------------------
-- Flashcards — PM-03: Portfolio Risk and Return: Part I
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='PM-03'),
 'How is holding period return (HPR) calculated?',
 'HPR = (Ending value - Beginning value + Income) / Beginning value. It measures the total return over the holding period, including both capital appreciation (or depreciation) and any income received (dividends, interest).',
 '{portfolio,returns,holding_period}'),
((SELECT id FROM learning_modules WHERE code='PM-03'),
 'What is the difference between arithmetic and geometric mean return?',
 'Arithmetic mean: simple average of periodic returns; appropriate for estimating expected single-period return. Geometric mean: compound average return; always less than or equal to arithmetic mean; appropriate for measuring realized performance over multiple periods.',
 '{portfolio,returns,arithmetic_vs_geometric}'),
((SELECT id FROM learning_modules WHERE code='PM-03'),
 'How is the expected return of a two-asset portfolio calculated?',
 'E(Rp) = w1 * E(R1) + w2 * E(R2), where w1 and w2 are portfolio weights and E(R1) and E(R2) are expected returns. Portfolio expected return is the weighted average of individual asset expected returns regardless of correlation.',
 '{portfolio,returns,portfolio_expected_return}'),
((SELECT id FROM learning_modules WHERE code='PM-03'),
 'How does correlation affect portfolio risk?',
 'Portfolio variance = w1^2*s1^2 + w2^2*s2^2 + 2*w1*w2*s1*s2*rho. Lower correlation reduces portfolio risk. At rho = +1, no diversification benefit. At rho = -1, maximum diversification (can potentially eliminate all risk). Diversification benefits exist whenever rho < +1.',
 '{portfolio,risk,correlation_diversification}');

-- --------------------------------------------------------
-- Flashcards — PM-04: Portfolio Risk and Return: Part II
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='PM-04'),
 'What is the CAPM formula?',
 'E(Ri) = Rf + Bi * [E(Rm) - Rf], where Rf = risk-free rate, Bi = beta of asset i, E(Rm) = expected market return, [E(Rm) - Rf] = market risk premium. The CAPM states only systematic risk (beta) is compensated.',
 '{portfolio,capm,formula}'),
((SELECT id FROM learning_modules WHERE code='PM-04'),
 'What is the difference between the CML and the SML?',
 'CML (Capital Market Line): plots expected return vs. total risk (standard deviation) for efficient portfolios combining the risk-free asset and market portfolio. SML (Security Market Line): plots expected return vs. systematic risk (beta) for all individual securities and portfolios.',
 '{portfolio,capm,cml_vs_sml}'),
((SELECT id FROM learning_modules WHERE code='PM-04'),
 'What is beta and how is it interpreted?',
 'Beta measures a security''s systematic risk relative to the market. Beta = 1: same risk as the market. Beta > 1: more volatile than the market (aggressive). Beta < 1: less volatile than the market (defensive). Beta = 0: no systematic risk (like a risk-free asset).',
 '{portfolio,capm,beta}'),
((SELECT id FROM learning_modules WHERE code='PM-04'),
 'What is the difference between systematic and unsystematic risk?',
 'Systematic (market) risk: affects all securities, caused by macroeconomic factors (interest rates, GDP, inflation); cannot be diversified away; compensated by the market risk premium. Unsystematic (specific) risk: affects individual companies/industries; can be eliminated through diversification; not compensated.',
 '{portfolio,risk,systematic_vs_unsystematic}');
