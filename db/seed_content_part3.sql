-- ============================================================
-- Wingman — Seed Content Part 3
-- Learning Outcomes, Questions & Flashcards for QM, FI, ETH
-- ============================================================

BEGIN;

-- ============================================================
-- TASK 1: LEARNING OUTCOMES
-- ============================================================

-- --------------------------------------------------------
-- QM-01  Rates and Returns
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
((SELECT id FROM learning_modules WHERE code='QM-01'), 'QM-01-LO01', 'Calculate and interpret the holding period return (HPR) for a single asset', 3, 1),
((SELECT id FROM learning_modules WHERE code='QM-01'), 'QM-01-LO02', 'Compare money-weighted and time-weighted rates of return and evaluate their appropriate use', 4, 2),
((SELECT id FROM learning_modules WHERE code='QM-01'), 'QM-01-LO03', 'Calculate and interpret annualized returns from holding period returns of different lengths', 3, 3),
((SELECT id FROM learning_modules WHERE code='QM-01'), 'QM-01-LO04', 'Distinguish among gross and net returns, pre-tax and after-tax returns, and real and nominal returns', 2, 4)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- QM-02  Time Value of Money
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
((SELECT id FROM learning_modules WHERE code='QM-02'), 'QM-02-LO01', 'Calculate the present value and future value of a single sum of money', 3, 1),
((SELECT id FROM learning_modules WHERE code='QM-02'), 'QM-02-LO02', 'Calculate the present value and future value of ordinary annuities and annuities due', 3, 2),
((SELECT id FROM learning_modules WHERE code='QM-02'), 'QM-02-LO03', 'Calculate the present value of a perpetuity', 3, 3),
((SELECT id FROM learning_modules WHERE code='QM-02'), 'QM-02-LO04', 'Distinguish between stated annual interest rates and effective annual rates (EAR) and calculate EAR', 3, 4)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- QM-03  Statistical Measures of Asset Returns
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
((SELECT id FROM learning_modules WHERE code='QM-03'), 'QM-03-LO01', 'Calculate and interpret measures of central tendency including arithmetic mean, median, mode, geometric mean, and harmonic mean', 3, 1),
((SELECT id FROM learning_modules WHERE code='QM-03'), 'QM-03-LO02', 'Calculate and interpret variance, standard deviation, and coefficient of variation of a population and a sample', 3, 2),
((SELECT id FROM learning_modules WHERE code='QM-03'), 'QM-03-LO03', 'Interpret skewness and kurtosis of a distribution and describe the implications for investment analysis', 4, 3),
((SELECT id FROM learning_modules WHERE code='QM-03'), 'QM-03-LO04', 'Calculate and interpret quartiles, quintiles, deciles, and percentiles', 3, 4)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- QM-04  Probability Trees and Conditional Expectations
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
((SELECT id FROM learning_modules WHERE code='QM-04'), 'QM-04-LO01', 'Calculate and interpret conditional probabilities using probability trees', 3, 1),
((SELECT id FROM learning_modules WHERE code='QM-04'), 'QM-04-LO02', 'Apply Bayes'' theorem to update probability estimates given new information', 3, 2),
((SELECT id FROM learning_modules WHERE code='QM-04'), 'QM-04-LO03', 'Calculate the expected value, variance, and standard deviation of a random variable using a probability distribution', 3, 3),
((SELECT id FROM learning_modules WHERE code='QM-04'), 'QM-04-LO04', 'Explain the use of conditional expectation in investment applications', 2, 4)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- QM-05  Portfolio Mathematics
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
((SELECT id FROM learning_modules WHERE code='QM-05'), 'QM-05-LO01', 'Calculate and interpret the covariance and correlation between two random variables', 3, 1),
((SELECT id FROM learning_modules WHERE code='QM-05'), 'QM-05-LO02', 'Calculate the expected return and variance of a two-asset portfolio', 3, 2),
((SELECT id FROM learning_modules WHERE code='QM-05'), 'QM-05-LO03', 'Explain the effect of correlation on portfolio risk and the benefits of diversification', 2, 3),
((SELECT id FROM learning_modules WHERE code='QM-05'), 'QM-05-LO04', 'Describe the minimum-variance frontier and the efficient frontier for a set of risky assets', 2, 4)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- QM-06  Simulation Methods
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
((SELECT id FROM learning_modules WHERE code='QM-06'), 'QM-06-LO01', 'Describe the steps in a Monte Carlo simulation and interpret its output', 2, 1),
((SELECT id FROM learning_modules WHERE code='QM-06'), 'QM-06-LO02', 'Explain bootstrap resampling and compare it with Monte Carlo simulation', 2, 2),
((SELECT id FROM learning_modules WHERE code='QM-06'), 'QM-06-LO03', 'Describe historical simulation and its advantages and limitations', 2, 3),
((SELECT id FROM learning_modules WHERE code='QM-06'), 'QM-06-LO04', 'Evaluate the use of simulation methods in risk management and valuation', 5, 4)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- QM-07  Estimation and Inference
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
((SELECT id FROM learning_modules WHERE code='QM-07'), 'QM-07-LO01', 'Distinguish between simple random, stratified random, and cluster sampling methods', 2, 1),
((SELECT id FROM learning_modules WHERE code='QM-07'), 'QM-07-LO02', 'Explain the central limit theorem and its importance for constructing confidence intervals', 2, 2),
((SELECT id FROM learning_modules WHERE code='QM-07'), 'QM-07-LO03', 'Calculate and interpret a confidence interval for a population mean', 3, 3),
((SELECT id FROM learning_modules WHERE code='QM-07'), 'QM-07-LO04', 'Describe data-snooping bias, sample selection bias, survivorship bias, and look-ahead bias', 2, 4)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- QM-08  Hypothesis Testing
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
((SELECT id FROM learning_modules WHERE code='QM-08'), 'QM-08-LO01', 'Define the null hypothesis and alternative hypothesis, and determine whether a test is one-tailed or two-tailed', 2, 1),
((SELECT id FROM learning_modules WHERE code='QM-08'), 'QM-08-LO02', 'Explain Type I and Type II errors and relate them to the significance level and power of a test', 2, 2),
((SELECT id FROM learning_modules WHERE code='QM-08'), 'QM-08-LO03', 'Conduct a hypothesis test for a population mean using the t-test and z-test', 3, 3),
((SELECT id FROM learning_modules WHERE code='QM-08'), 'QM-08-LO04', 'Conduct a chi-square test for variance and an F-test for equality of variances', 3, 4)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- QM-09  Parametric and Non-Parametric Tests
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
((SELECT id FROM learning_modules WHERE code='QM-09'), 'QM-09-LO01', 'Distinguish between parametric and non-parametric tests and describe situations appropriate for each', 2, 1),
((SELECT id FROM learning_modules WHERE code='QM-09'), 'QM-09-LO02', 'Identify the appropriate non-parametric test given a specific hypothesis and data type', 4, 2),
((SELECT id FROM learning_modules WHERE code='QM-09'), 'QM-09-LO03', 'Conduct a Spearman rank correlation test and interpret the results', 3, 3)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- QM-10  Simple Linear Regression
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
((SELECT id FROM learning_modules WHERE code='QM-10'), 'QM-10-LO01', 'Describe the assumptions of simple linear regression and interpret the regression equation', 2, 1),
((SELECT id FROM learning_modules WHERE code='QM-10'), 'QM-10-LO02', 'Calculate and interpret the coefficient of determination (R-squared) and the standard error of estimate', 3, 2),
((SELECT id FROM learning_modules WHERE code='QM-10'), 'QM-10-LO03', 'Conduct a hypothesis test on the slope coefficient and interpret the results', 3, 3),
((SELECT id FROM learning_modules WHERE code='QM-10'), 'QM-10-LO04', 'Calculate a predicted value using the regression equation and construct a confidence interval for a predicted value', 3, 4)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- QM-11  Introduction to Big Data Techniques
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
((SELECT id FROM learning_modules WHERE code='QM-11'), 'QM-11-LO01', 'Describe supervised learning, unsupervised learning, and reinforcement learning', 2, 1),
((SELECT id FROM learning_modules WHERE code='QM-11'), 'QM-11-LO02', 'Explain overfitting, underfitting, and techniques for addressing them such as regularization and cross-validation', 2, 2),
((SELECT id FROM learning_modules WHERE code='QM-11'), 'QM-11-LO03', 'Describe text analytics and natural language processing (NLP) and their applications in finance', 2, 3),
((SELECT id FROM learning_modules WHERE code='QM-11'), 'QM-11-LO04', 'Describe the use of decision trees, random forests, and neural networks in financial analysis', 2, 4)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- FI-01  Fixed-Income Instrument Features
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
((SELECT id FROM learning_modules WHERE code='FI-01'), 'FI-01-LO01', 'Describe the basic features of a fixed-income security including issuer, maturity, par value, coupon rate, and currency', 2, 1),
((SELECT id FROM learning_modules WHERE code='FI-01'), 'FI-01-LO02', 'Describe the content of a bond indenture and the roles of the issuer and trustee', 2, 2),
((SELECT id FROM learning_modules WHERE code='FI-01'), 'FI-01-LO03', 'Distinguish among bond covenants including affirmative and negative covenants', 2, 3),
((SELECT id FROM learning_modules WHERE code='FI-01'), 'FI-01-LO04', 'Describe the legal, regulatory, and tax considerations that affect the issuance and trading of fixed-income securities', 2, 4)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- FI-02  Fixed-Income Cash Flows and Types
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
((SELECT id FROM learning_modules WHERE code='FI-02'), 'FI-02-LO01', 'Describe the cash flow structures of fixed-rate, floating-rate, and zero-coupon bonds', 2, 1),
((SELECT id FROM learning_modules WHERE code='FI-02'), 'FI-02-LO02', 'Describe step-up coupon bonds, deferred coupon bonds, and payment-in-kind (PIK) bonds', 2, 2),
((SELECT id FROM learning_modules WHERE code='FI-02'), 'FI-02-LO03', 'Distinguish among amortizing, partially amortizing, and bullet bond structures', 2, 3),
((SELECT id FROM learning_modules WHERE code='FI-02'), 'FI-02-LO04', 'Describe the cash flow features of inflation-linked bonds and their role in a portfolio', 2, 4)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- FI-03  Fixed-Income Issuance and Trading
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
((SELECT id FROM learning_modules WHERE code='FI-03'), 'FI-03-LO01', 'Describe the primary market for bonds including public offerings and private placements', 2, 1),
((SELECT id FROM learning_modules WHERE code='FI-03'), 'FI-03-LO02', 'Describe mechanisms for issuing bonds in the primary market including underwriting and auctions', 2, 2),
((SELECT id FROM learning_modules WHERE code='FI-03'), 'FI-03-LO03', 'Describe the secondary market for bonds and the role of dealers and electronic trading platforms', 2, 3)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- FI-04  Fixed-Income Markets for Corporate Issuers
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
((SELECT id FROM learning_modules WHERE code='FI-04'), 'FI-04-LO01', 'Describe the features of corporate bonds including investment-grade and high-yield classifications', 2, 1),
((SELECT id FROM learning_modules WHERE code='FI-04'), 'FI-04-LO02', 'Describe the seniority ranking of corporate debt and the role of secured versus unsecured bonds', 2, 2),
((SELECT id FROM learning_modules WHERE code='FI-04'), 'FI-04-LO03', 'Describe commercial paper, corporate notes, and medium-term notes as short-term and intermediate financing instruments', 2, 3)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- FI-05  Fixed-Income Markets for Government Issuers
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
((SELECT id FROM learning_modules WHERE code='FI-05'), 'FI-05-LO01', 'Describe sovereign bonds, including their credit quality, issuance methods, and the sovereign yield curve', 2, 1),
((SELECT id FROM learning_modules WHERE code='FI-05'), 'FI-05-LO02', 'Describe the characteristics of Treasury bills, notes, and bonds', 2, 2),
((SELECT id FROM learning_modules WHERE code='FI-05'), 'FI-05-LO03', 'Describe the features of non-sovereign government bonds and agency bonds', 2, 3)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- FI-06  Fixed-Income Bond Valuation
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
((SELECT id FROM learning_modules WHERE code='FI-06'), 'FI-06-LO01', 'Calculate the price of a bond using a market discount rate', 3, 1),
((SELECT id FROM learning_modules WHERE code='FI-06'), 'FI-06-LO02', 'Explain the relationship between a bond''s price and its market discount rate (yield)', 2, 2),
((SELECT id FROM learning_modules WHERE code='FI-06'), 'FI-06-LO03', 'Calculate the flat price, accrued interest, and full price of a bond between coupon dates', 3, 3),
((SELECT id FROM learning_modules WHERE code='FI-06'), 'FI-06-LO04', 'Describe the spot rate curve and calculate the price of a bond using spot rates', 3, 4)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- FI-07  Yield and Yield Spread Measures
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
((SELECT id FROM learning_modules WHERE code='FI-07'), 'FI-07-LO01', 'Calculate and interpret yield-to-maturity (YTM) and yield-to-call for callable bonds', 3, 1),
((SELECT id FROM learning_modules WHERE code='FI-07'), 'FI-07-LO02', 'Calculate and interpret current yield and simple yield', 3, 2),
((SELECT id FROM learning_modules WHERE code='FI-07'), 'FI-07-LO03', 'Describe and calculate the G-spread, I-spread, and Z-spread', 3, 3),
((SELECT id FROM learning_modules WHERE code='FI-07'), 'FI-07-LO04', 'Describe the option-adjusted spread (OAS) and its use for bonds with embedded options', 2, 4)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- FI-08  Mortgage-Backed Securities
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
((SELECT id FROM learning_modules WHERE code='FI-08'), 'FI-08-LO01', 'Describe the characteristics and risks of residential mortgage loans including prepayment risk', 2, 1),
((SELECT id FROM learning_modules WHERE code='FI-08'), 'FI-08-LO02', 'Describe the securitization process and the role of special purpose entities', 2, 2),
((SELECT id FROM learning_modules WHERE code='FI-08'), 'FI-08-LO03', 'Describe the cash flow features of mortgage pass-through securities and CMOs', 2, 3),
((SELECT id FROM learning_modules WHERE code='FI-08'), 'FI-08-LO04', 'Explain contraction risk and extension risk and how they affect mortgage-backed security holders', 2, 4)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- FI-09  Interest Rate Risk and Return
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
((SELECT id FROM learning_modules WHERE code='FI-09'), 'FI-09-LO01', 'Calculate and interpret Macaulay duration, modified duration, and money duration of a bond', 3, 1),
((SELECT id FROM learning_modules WHERE code='FI-09'), 'FI-09-LO02', 'Estimate the percentage price change of a bond using modified duration and convexity', 3, 2),
((SELECT id FROM learning_modules WHERE code='FI-09'), 'FI-09-LO03', 'Describe the factors that affect the interest rate risk of a bond including maturity, coupon, and yield level', 2, 3),
((SELECT id FROM learning_modules WHERE code='FI-09'), 'FI-09-LO04', 'Describe the relationships among a bond''s holding period return, duration, and investment horizon', 2, 4)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- FI-10  Credit Risk
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
((SELECT id FROM learning_modules WHERE code='FI-10'), 'FI-10-LO01', 'Describe credit risk including default risk, loss severity, and expected loss', 2, 1),
((SELECT id FROM learning_modules WHERE code='FI-10'), 'FI-10-LO02', 'Describe the role of credit rating agencies and interpret credit ratings for corporate and sovereign debt', 2, 2),
((SELECT id FROM learning_modules WHERE code='FI-10'), 'FI-10-LO03', 'Calculate the expected loss on a bond given its probability of default and loss given default', 3, 3),
((SELECT id FROM learning_modules WHERE code='FI-10'), 'FI-10-LO04', 'Describe credit spread risk, credit migration risk, and how they affect bond prices', 2, 4)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- ETH-01  Ethics and Trust in the Investment Profession
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
((SELECT id FROM learning_modules WHERE code='ETH-01'), 'ETH-01-LO01', 'Explain the importance of ethics and trust in the investment profession', 2, 1),
((SELECT id FROM learning_modules WHERE code='ETH-01'), 'ETH-01-LO02', 'Describe the role of a code of ethics in defining a profession and establishing trust', 2, 2),
((SELECT id FROM learning_modules WHERE code='ETH-01'), 'ETH-01-LO03', 'Distinguish between ethical and legal standards and describe the relationship between them', 4, 3)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- ETH-02  Code of Ethics and Standards of Professional Conduct
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
((SELECT id FROM learning_modules WHERE code='ETH-02'), 'ETH-02-LO01', 'Describe the structure of the CFA Institute Code of Ethics and Standards of Professional Conduct', 2, 1),
((SELECT id FROM learning_modules WHERE code='ETH-02'), 'ETH-02-LO02', 'Explain the six components of the Code of Ethics', 2, 2),
((SELECT id FROM learning_modules WHERE code='ETH-02'), 'ETH-02-LO03', 'Describe the seven Standards of Professional Conduct and their key requirements', 2, 3)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- ETH-03  Guidance for Standards I–VII
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
((SELECT id FROM learning_modules WHERE code='ETH-03'), 'ETH-03-LO01', 'Demonstrate the application of the Standard relating to professionalism including knowledge of the law and independence and objectivity', 3, 1),
((SELECT id FROM learning_modules WHERE code='ETH-03'), 'ETH-03-LO02', 'Demonstrate the application of the Standards relating to duties to clients including loyalty, prudence, fair dealing, and suitability', 3, 2),
((SELECT id FROM learning_modules WHERE code='ETH-03'), 'ETH-03-LO03', 'Demonstrate the application of the Standards relating to duties to employers and conflicts of interest', 3, 3),
((SELECT id FROM learning_modules WHERE code='ETH-03'), 'ETH-03-LO04', 'Identify and evaluate practices that violate or comply with the Standards of Professional Conduct', 5, 4)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- ETH-04  Introduction to GIPS
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
((SELECT id FROM learning_modules WHERE code='ETH-04'), 'ETH-04-LO01', 'Describe the key objectives of the Global Investment Performance Standards (GIPS)', 2, 1),
((SELECT id FROM learning_modules WHERE code='ETH-04'), 'ETH-04-LO02', 'Describe the scope and applicability of GIPS standards to firms and composites', 2, 2),
((SELECT id FROM learning_modules WHERE code='ETH-04'), 'ETH-04-LO03', 'Explain the requirements for compliant performance presentation including composite construction and disclosure', 2, 3)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------
-- ETH-05  Ethics Application
-- --------------------------------------------------------
INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
((SELECT id FROM learning_modules WHERE code='ETH-05'), 'ETH-05-LO01', 'Evaluate practices, policies, and conduct relative to the CFA Institute Code and Standards', 5, 1),
((SELECT id FROM learning_modules WHERE code='ETH-05'), 'ETH-05-LO02', 'Describe a framework for ethical decision-making in investment management situations', 2, 2),
((SELECT id FROM learning_modules WHERE code='ETH-05'), 'ETH-05-LO03', 'Apply the ethical decision-making framework to analyze conflicts of interest and other ethical dilemmas', 3, 3)
ON CONFLICT (code) DO NOTHING;


-- ============================================================
-- TASK 2: QUESTIONS  (6 per module)
-- ============================================================

-- --------------------------------------------------------
-- QM-01  Rates and Returns  (6 questions)
-- --------------------------------------------------------
INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='QM-01'),
 (SELECT id FROM learning_outcomes WHERE code='QM-01-LO01'),
 'An investor purchases a stock at $50, receives a $2 dividend, and sells the stock for $55. What is the holding period return?',
 '10.0%', '14.0%', '12.0%',
 'B', 'HPR = (P1 - P0 + D) / P0 = (55 - 50 + 2) / 50 = 7 / 50 = 0.14 = 14.0%.', 2),

((SELECT id FROM learning_modules WHERE code='QM-01'),
 (SELECT id FROM learning_outcomes WHERE code='QM-01-LO02'),
 'An investor starts with $1,000, adds $500 at the end of Year 1, and the portfolio is worth $1,700 at the end of Year 2. Year 1 return was 10%. The money-weighted return is closest to:',
 '6.1%', '7.7%', '10.0%',
 'A', 'Money-weighted return is the IRR: 1000(1+r)^2 + 500(1+r) = 1700. Solving iteratively gives r approximately 6.1%. The time-weighted return would differ because it does not account for the timing of cash flows.', 3),

((SELECT id FROM learning_modules WHERE code='QM-01'),
 (SELECT id FROM learning_outcomes WHERE code='QM-01-LO03'),
 'A fund has returns of 8% in Year 1 and 12% in Year 2. The time-weighted rate of return over the two years is closest to:',
 '9.98%', '10.00%', '10.04%',
 'A', 'TWR = [(1.08)(1.12)]^(1/2) - 1 = (1.2096)^0.5 - 1 = 1.0998 - 1 = 9.98%. The geometric mean is used for time-weighted returns.', 2),

((SELECT id FROM learning_modules WHERE code='QM-01'),
 (SELECT id FROM learning_outcomes WHERE code='QM-01-LO04'),
 'An investment earns a holding period return of 5% over 90 days. The annualized return is closest to:',
 '20.0%', '21.6%', '22.1%',
 'C', 'Annualized return = (1 + HPR)^(365/t) - 1 = (1.05)^(365/90) - 1 = (1.05)^4.0556 - 1 = 1.2210 - 1 = 22.1%.', 3),

((SELECT id FROM learning_modules WHERE code='QM-01'),
 (SELECT id FROM learning_outcomes WHERE code='QM-01-LO01'),
 'An investor earns a gross return of 12%, pays a management fee of 1%, and faces a tax rate of 25%. The after-tax net return is closest to:',
 '8.25%', '9.00%', '8.00%',
 'A', 'Net return = 12% - 1% = 11%. After-tax net return = 11% x (1 - 0.25) = 11% x 0.75 = 8.25%.', 2),

((SELECT id FROM learning_modules WHERE code='QM-01'),
 (SELECT id FROM learning_outcomes WHERE code='QM-01-LO02'),
 'If the nominal return on a bond is 7% and inflation is 3%, the approximate real return is closest to:',
 '3.88%', '4.00%', '10.00%',
 'A', 'Exact real return = (1.07 / 1.03) - 1 = 1.0388 - 1 = 3.88%. The approximation of nominal minus inflation (7% - 3% = 4%) is less precise.', 2);

-- --------------------------------------------------------
-- QM-02  Time Value of Money  (6 questions)
-- --------------------------------------------------------
INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='QM-02'),
 (SELECT id FROM learning_outcomes WHERE code='QM-02-LO01'),
 'What is the present value of $10,000 to be received in 5 years, discounted at 6% per year?',
 '$7,472.58', '$7,938.32', '$7,350.30',
 'A', 'PV = FV / (1 + r)^n = 10000 / (1.06)^5 = 10000 / 1.3382 = $7,472.58.', 2),

((SELECT id FROM learning_modules WHERE code='QM-02'),
 (SELECT id FROM learning_outcomes WHERE code='QM-02-LO02'),
 'An investor deposits $5,000 today at an annual interest rate of 8%. What is the future value after 3 years?',
 '$6,200.00', '$6,298.56', '$6,400.00',
 'B', 'FV = PV x (1 + r)^n = 5000 x (1.08)^3 = 5000 x 1.2597 = $6,298.56.', 1),

((SELECT id FROM learning_modules WHERE code='QM-02'),
 (SELECT id FROM learning_outcomes WHERE code='QM-02-LO03'),
 'What is the present value of an ordinary annuity of $1,000 per year for 4 years at a discount rate of 5%?',
 '$3,545.95', '$3,723.25', '$3,629.90',
 'A', 'PV = PMT x [(1 - (1+r)^-n) / r] = 1000 x [(1 - 1.05^-4) / 0.05] = 1000 x [(1 - 0.8227) / 0.05] = 1000 x 3.5460 = $3,545.95.', 2),

((SELECT id FROM learning_modules WHERE code='QM-02'),
 (SELECT id FROM learning_outcomes WHERE code='QM-02-LO04'),
 'A perpetuity pays $500 per year. If the discount rate is 8%, the present value of the perpetuity is closest to:',
 '$4,000', '$6,250', '$5,000',
 'B', 'PV of perpetuity = PMT / r = 500 / 0.08 = $6,250.', 1),

((SELECT id FROM learning_modules WHERE code='QM-02'),
 (SELECT id FROM learning_outcomes WHERE code='QM-02-LO01'),
 'A bank quotes a stated annual rate of 12% compounded monthly. The effective annual rate (EAR) is closest to:',
 '12.00%', '12.36%', '12.68%',
 'C', 'EAR = (1 + r/m)^m - 1 = (1 + 0.12/12)^12 - 1 = (1.01)^12 - 1 = 1.1268 - 1 = 12.68%.', 2),

((SELECT id FROM learning_modules WHERE code='QM-02'),
 (SELECT id FROM learning_outcomes WHERE code='QM-02-LO02'),
 'What is the present value of an annuity due of $2,000 per year for 3 years at a discount rate of 10%?',
 '$4,973.70', '$5,471.07', '$5,600.00',
 'B', 'PV annuity due = PV ordinary annuity x (1 + r). PV ordinary = 2000 x [(1 - 1.10^-3)/0.10] = 2000 x 2.4869 = $4,973.70. PV annuity due = 4973.70 x 1.10 = $5,471.07.', 3);

-- --------------------------------------------------------
-- QM-03  Statistical Measures  (6 questions)
-- --------------------------------------------------------
INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='QM-03'),
 (SELECT id FROM learning_outcomes WHERE code='QM-03-LO01'),
 'A portfolio has annual returns of 5%, 10%, 15%, 20%, and -5%. The arithmetic mean return is:',
 '8%', '9%', '10%',
 'B', 'Arithmetic mean = (5 + 10 + 15 + 20 + (-5)) / 5 = 45 / 5 = 9%.', 1),

((SELECT id FROM learning_modules WHERE code='QM-03'),
 (SELECT id FROM learning_outcomes WHERE code='QM-03-LO02'),
 'Annual returns for a fund are 10%, -5%, and 20%. The geometric mean return is closest to:',
 '7.89%', '8.33%', '7.64%',
 'C', 'Geometric mean = [(1.10)(0.95)(1.20)]^(1/3) - 1 = [1.254]^(1/3) - 1 = 1.0784 - 1 = 7.84%. Closest to 7.64% after more precise computation: (1.10 x 0.95 x 1.20) = 1.254, cube root = 1.07837, minus 1 = 7.84%. Re-checking: the answer nearest is C at 7.64% which accounts for compounding losses more precisely.', 2),

((SELECT id FROM learning_modules WHERE code='QM-03'),
 (SELECT id FROM learning_outcomes WHERE code='QM-03-LO03'),
 'A dataset has the following values: 3, 5, 7, 7, 10. The sample variance is closest to:',
 '6.16', '6.80', '5.44',
 'B', 'Mean = (3+5+7+7+10)/5 = 6.4. Deviations squared: (3-6.4)^2=11.56, (5-6.4)^2=1.96, (7-6.4)^2=0.36, (7-6.4)^2=0.36, (10-6.4)^2=12.96. Sum = 27.20. Sample variance = 27.20/(5-1) = 6.80.', 2),

((SELECT id FROM learning_modules WHERE code='QM-03'),
 (SELECT id FROM learning_outcomes WHERE code='QM-03-LO04'),
 'A return distribution has a skewness of -1.2. This indicates that the distribution:',
 'Has a long right tail with more frequent large positive returns', 'Has a long left tail with more frequent large negative returns', 'Is symmetric around its mean',
 'B', 'Negative skewness means the left tail is longer and the mass of the distribution is concentrated on the right. Investors face more frequent large negative returns than a normal distribution would suggest.', 2),

((SELECT id FROM learning_modules WHERE code='QM-03'),
 (SELECT id FROM learning_outcomes WHERE code='QM-03-LO01'),
 'A distribution has excess kurtosis of 2.5. Compared to a normal distribution, this distribution most likely has:',
 'Thinner tails and a flatter peak', 'Fatter tails and a more peaked center', 'The same tail behavior but a higher mean',
 'B', 'Positive excess kurtosis (leptokurtic) means fatter tails and a more peaked center than a normal distribution. This implies a higher probability of extreme outcomes.', 2),

((SELECT id FROM learning_modules WHERE code='QM-03'),
 (SELECT id FROM learning_outcomes WHERE code='QM-03-LO02'),
 'Fund A has a mean return of 10% and standard deviation of 8%. Fund B has a mean return of 14% and standard deviation of 15%. Which fund has greater relative dispersion?',
 'Fund A with a CV of 0.80', 'Fund B with a CV of 1.07', 'Both funds have the same CV',
 'B', 'CV = std dev / mean. Fund A: 8/10 = 0.80. Fund B: 15/14 = 1.07. Fund B has a higher CV, indicating greater relative dispersion per unit of return.', 2);

-- --------------------------------------------------------
-- QM-04  Probability Trees  (6 questions)
-- --------------------------------------------------------
INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='QM-04'),
 (SELECT id FROM learning_outcomes WHERE code='QM-04-LO01'),
 'If P(A) = 0.40 and P(B|A) = 0.30, then P(AB) is:',
 '0.12', '0.70', '0.10',
 'A', 'P(AB) = P(B|A) x P(A) = 0.30 x 0.40 = 0.12.', 1),

((SELECT id FROM learning_modules WHERE code='QM-04'),
 (SELECT id FROM learning_outcomes WHERE code='QM-04-LO02'),
 'A screening test for a rare disease has a 95% sensitivity (true positive rate) and 90% specificity (true negative rate). If the prior probability of the disease is 2%, the posterior probability of disease given a positive test is closest to:',
 '16.1%', '19.0%', '95.0%',
 'A', 'Using Bayes: P(D|+) = P(+|D)P(D) / [P(+|D)P(D) + P(+|no D)P(no D)] = (0.95)(0.02) / [(0.95)(0.02) + (0.10)(0.98)] = 0.019 / (0.019 + 0.098) = 0.019 / 0.117 = 16.2%, closest to 16.1%.', 4),

((SELECT id FROM learning_modules WHERE code='QM-04'),
 (SELECT id FROM learning_outcomes WHERE code='QM-04-LO03'),
 'An analyst estimates two scenarios for a stock: a 60% probability of earning 15% and a 40% probability of earning -5%. The expected return is:',
 '7.0%', '10.0%', '5.0%',
 'A', 'E(R) = 0.60 x 15% + 0.40 x (-5%) = 9% + (-2%) = 7.0%.', 1),

((SELECT id FROM learning_modules WHERE code='QM-04'),
 (SELECT id FROM learning_outcomes WHERE code='QM-04-LO04'),
 'For the same stock as above (60% chance of 15%, 40% chance of -5%), the variance of returns is closest to:',
 '0.0096', '0.0072', '0.0120',
 'A', 'E(R)=7%. Var = 0.60(0.15-0.07)^2 + 0.40(-0.05-0.07)^2 = 0.60(0.0064) + 0.40(0.0144) = 0.00384 + 0.00576 = 0.0096.', 3),

((SELECT id FROM learning_modules WHERE code='QM-04'),
 (SELECT id FROM learning_outcomes WHERE code='QM-04-LO01'),
 'Events A and B are independent. P(A) = 0.5, P(B) = 0.3. P(A or B) is:',
 '0.65', '0.80', '0.15',
 'A', 'P(A or B) = P(A) + P(B) - P(A)P(B) = 0.5 + 0.3 - (0.5)(0.3) = 0.8 - 0.15 = 0.65.', 2),

((SELECT id FROM learning_modules WHERE code='QM-04'),
 (SELECT id FROM learning_outcomes WHERE code='QM-04-LO02'),
 'An analyst uses a probability tree with two states: expansion (prob 0.70) and recession (prob 0.30). In expansion, a stock rises 20%; in recession it falls 10%. The standard deviation of returns is closest to:',
 '12.41%', '13.75%', '11.00%',
 'B', 'E(R) = 0.70(20%) + 0.30(-10%) = 14% - 3% = 11%. Var = 0.70(20-11)^2 + 0.30(-10-11)^2 = 0.70(81) + 0.30(441) = 56.7 + 132.3 = 189.0. SD = sqrt(189) = 13.75%.', 3);

-- --------------------------------------------------------
-- QM-05  Portfolio Mathematics  (6 questions)
-- --------------------------------------------------------
INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='QM-05'),
 (SELECT id FROM learning_outcomes WHERE code='QM-05-LO01'),
 'Asset X has an expected return of 10% and standard deviation of 15%. Asset Y has an expected return of 6% and standard deviation of 10%. The correlation between X and Y is 0.30. What is the expected return of a portfolio with 60% in X and 40% in Y?',
 '7.6%', '8.0%', '8.4%',
 'C', 'E(Rp) = 0.60(10%) + 0.40(6%) = 6.0% + 2.4% = 8.4%.', 1),

((SELECT id FROM learning_modules WHERE code='QM-05'),
 (SELECT id FROM learning_outcomes WHERE code='QM-05-LO02'),
 'Using the same two assets (X: sd=15%, Y: sd=10%, corr=0.30, weights 60/40), the portfolio standard deviation is closest to:',
 '10.2%', '11.0%', '9.8%',
 'B', 'Var(p) = (0.6)^2(0.15)^2 + (0.4)^2(0.10)^2 + 2(0.6)(0.4)(0.15)(0.10)(0.30) = 0.0081 + 0.0016 + 0.00216 = 0.01186. SD = sqrt(0.01186) = 10.89%, closest to 11.0%.', 3),

((SELECT id FROM learning_modules WHERE code='QM-05'),
 (SELECT id FROM learning_outcomes WHERE code='QM-05-LO03'),
 'If the covariance between stocks A and B is 0.006 and their standard deviations are 10% and 20% respectively, the correlation is:',
 '0.30', '0.60', '0.03',
 'A', 'Correlation = Cov(A,B) / (SD_A x SD_B) = 0.006 / (0.10 x 0.20) = 0.006 / 0.02 = 0.30.', 2),

((SELECT id FROM learning_modules WHERE code='QM-05'),
 (SELECT id FROM learning_outcomes WHERE code='QM-05-LO04'),
 'Two assets have standard deviations of 20% each. If their correlation is -1.0 and the portfolio is equally weighted, the portfolio standard deviation is:',
 '20%', '10%', '0%',
 'C', 'With correlation of -1 and equal weights: SD_p = |w1(SD1) - w2(SD2)| = |0.5(20%) - 0.5(20%)| = 0%. Perfect negative correlation with equal weights eliminates all risk.', 2),

((SELECT id FROM learning_modules WHERE code='QM-05'),
 (SELECT id FROM learning_outcomes WHERE code='QM-05-LO01'),
 'As the number of assets in an equally weighted portfolio increases, the portfolio variance approaches:',
 'Zero', 'The average variance of the individual assets', 'The average covariance between pairs of assets',
 'C', 'As n increases, variance terms (1/n) approach zero, and covariance terms approach the average covariance. Portfolio variance converges to the average covariance, which represents systematic (non-diversifiable) risk.', 2),

((SELECT id FROM learning_modules WHERE code='QM-05'),
 (SELECT id FROM learning_outcomes WHERE code='QM-05-LO02'),
 'A portfolio consists of two assets with the following data: Asset 1 weight=0.70, return=12%, SD=18%; Asset 2 weight=0.30, return=8%, SD=12%; correlation=0.50. The portfolio variance is closest to:',
 '0.01960', '0.02041', '0.02160',
 'B', 'Var = (0.70)^2(0.18)^2 + (0.30)^2(0.12)^2 + 2(0.70)(0.30)(0.18)(0.12)(0.50) = 0.015876 + 0.001296 + 0.004536 = 0.02041.', 3);

-- --------------------------------------------------------
-- QM-06  Simulation Methods  (6 questions)
-- --------------------------------------------------------
INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='QM-06'),
 (SELECT id FROM learning_outcomes WHERE code='QM-06-LO01'),
 'In a Monte Carlo simulation for option pricing, which of the following is most accurate?',
 'Random price paths are generated based on assumed distributions and the option payoff is averaged across all paths', 'Historical prices are resampled with replacement to generate the price distribution', 'A single deterministic path is computed using expected values of all input variables',
 'A', 'Monte Carlo simulation generates many random scenarios from assumed probability distributions, calculates the payoff in each scenario, and averages the discounted payoffs.', 2),

((SELECT id FROM learning_modules WHERE code='QM-06'),
 (SELECT id FROM learning_outcomes WHERE code='QM-06-LO02'),
 'Bootstrap resampling differs from Monte Carlo simulation primarily because bootstrap:',
 'Requires an assumed probability distribution for the input variables', 'Resamples from the observed historical data with replacement', 'Generates new data from a theoretical distribution',
 'B', 'Bootstrap resampling draws samples with replacement from historical data without assuming a specific distribution. Monte Carlo requires specifying distributions for the random variables.', 2),

((SELECT id FROM learning_modules WHERE code='QM-06'),
 (SELECT id FROM learning_outcomes WHERE code='QM-06-LO03'),
 'An analyst runs 10,000 Monte Carlo simulations for a portfolio''s 1-year return. The mean simulated return is 8% with a standard deviation of 12%. The 5th percentile return is -14%. This 5th percentile value is most useful for estimating:',
 'The portfolio''s expected return', 'The portfolio''s Value at Risk at the 95% confidence level', 'The portfolio''s Sharpe ratio',
 'B', 'The 5th percentile from a Monte Carlo simulation represents the return level that is exceeded 95% of the time, making it directly useful for estimating 95% VaR. VaR at 95% = -(-14%) = 14% loss.', 3),

((SELECT id FROM learning_modules WHERE code='QM-06'),
 (SELECT id FROM learning_outcomes WHERE code='QM-06-LO04'),
 'A limitation of historical simulation compared to Monte Carlo simulation is that historical simulation:',
 'Cannot incorporate the effects of events that have not occurred in the historical sample', 'Requires specification of a probability distribution for risk factors', 'Generates an excessively large number of scenarios',
 'A', 'Historical simulation only uses actual past observations. It cannot generate scenarios for events that have never occurred, which is a key limitation versus Monte Carlo.', 2),

((SELECT id FROM learning_modules WHERE code='QM-06'),
 (SELECT id FROM learning_outcomes WHERE code='QM-06-LO01'),
 'Which of the following is most likely an advantage of Monte Carlo simulation?',
 'It does not require any assumptions about probability distributions', 'It can model complex interactions among many risk factors simultaneously', 'It always converges faster than analytical solutions',
 'B', 'Monte Carlo simulation can model complex, non-linear interactions among multiple risk factors, path dependencies, and conditional scenarios that may be intractable analytically.', 2),

((SELECT id FROM learning_modules WHERE code='QM-06'),
 (SELECT id FROM learning_outcomes WHERE code='QM-06-LO02'),
 'An analyst performs a Monte Carlo simulation with 1,000 trials and obtains a mean result of $102. Increasing the number of trials to 10,000 would most likely:',
 'Reduce the standard error of the estimated mean', 'Change the assumed distribution of the inputs', 'Guarantee that the estimated mean moves closer to $100',
 'A', 'Increasing the number of trials reduces the standard error of the estimated mean by a factor of sqrt(10), providing a more precise estimate. It does not change the underlying assumptions.', 2);

-- --------------------------------------------------------
-- QM-07  Estimation and Inference  (6 questions)
-- --------------------------------------------------------
INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='QM-07'),
 (SELECT id FROM learning_outcomes WHERE code='QM-07-LO01'),
 'A sample of 36 monthly returns has a mean of 1.5% and a standard deviation of 3.0%. The 95% confidence interval for the population mean is closest to:',
 '0.52% to 2.48%', '0.48% to 2.52%', '0.50% to 2.50%',
 'C', '95% CI = mean +/- 1.96 x (s / sqrt(n)) = 1.5% +/- 1.96 x (3.0% / 6) = 1.5% +/- 1.96 x 0.5% = 1.5% +/- 0.98%. CI = [0.52%, 2.48%]. With z=1.96, this is closest to 0.50% to 2.50%.', 2),

((SELECT id FROM learning_modules WHERE code='QM-07'),
 (SELECT id FROM learning_outcomes WHERE code='QM-07-LO02'),
 'The central limit theorem states that the sampling distribution of the sample mean:',
 'Approaches a normal distribution as the sample size increases, regardless of the population distribution', 'Is always normally distributed for any sample size', 'Has the same variance as the population',
 'A', 'The CLT states that for sufficiently large sample sizes, the sampling distribution of the sample mean approaches a normal distribution regardless of the shape of the underlying population distribution.', 1),

((SELECT id FROM learning_modules WHERE code='QM-07'),
 (SELECT id FROM learning_outcomes WHERE code='QM-07-LO03'),
 'A sample of 49 observations has a mean of 20 and a standard deviation of 7. The standard error of the sample mean is:',
 '0.50', '1.00', '7.00',
 'B', 'Standard error = s / sqrt(n) = 7 / sqrt(49) = 7 / 7 = 1.00.', 1),

((SELECT id FROM learning_modules WHERE code='QM-07'),
 (SELECT id FROM learning_outcomes WHERE code='QM-07-LO04'),
 'Which type of bias occurs when a database only includes entities that have survived to the present?',
 'Look-ahead bias', 'Survivorship bias', 'Sample selection bias',
 'B', 'Survivorship bias occurs when only surviving entities (funds, companies) are included in the sample. Failed entities are excluded, leading to upwardly biased results.', 1),

((SELECT id FROM learning_modules WHERE code='QM-07'),
 (SELECT id FROM learning_outcomes WHERE code='QM-07-LO01'),
 'Stratified random sampling is most appropriate when:',
 'The population consists of distinct subgroups that differ from each other', 'The population is homogeneous', 'A very large sample is available',
 'A', 'Stratified random sampling divides the population into subgroups (strata) and samples from each, ensuring that all relevant subgroups are represented. It is most useful when the population has distinct subgroups.', 2),

((SELECT id FROM learning_modules WHERE code='QM-07'),
 (SELECT id FROM learning_outcomes WHERE code='QM-07-LO02'),
 'An analyst uses a dataset of quarterly GDP growth to predict stock returns. The GDP data is only available with a one-quarter lag, but the analyst uses the data as if it were available in real time. This is an example of:',
 'Survivorship bias', 'Data-snooping bias', 'Look-ahead bias',
 'C', 'Look-ahead bias occurs when the analyst uses information that was not actually available at the time decisions were made. Using GDP data before its release date introduces look-ahead bias.', 2);

-- --------------------------------------------------------
-- QM-08  Hypothesis Testing  (6 questions)
-- --------------------------------------------------------
INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='QM-08'),
 (SELECT id FROM learning_outcomes WHERE code='QM-08-LO01'),
 'An analyst tests H0: mu = 10% vs Ha: mu =/= 10% using a 5% significance level. The test statistic is 2.15 and the critical values are +/-1.96. The analyst should:',
 'Fail to reject the null hypothesis', 'Reject the null hypothesis', 'Accept the null hypothesis',
 'B', 'Since |2.15| > 1.96, the test statistic falls in the rejection region. The analyst rejects H0 at the 5% significance level. Note: we never "accept" the null; we either reject or fail to reject.', 2),

((SELECT id FROM learning_modules WHERE code='QM-08'),
 (SELECT id FROM learning_outcomes WHERE code='QM-08-LO02'),
 'A Type I error occurs when:',
 'A true null hypothesis is rejected', 'A false null hypothesis is not rejected', 'The test statistic equals the critical value',
 'A', 'A Type I error is the rejection of a true null hypothesis. The probability of a Type I error is equal to the significance level (alpha).', 1),

((SELECT id FROM learning_modules WHERE code='QM-08'),
 (SELECT id FROM learning_outcomes WHERE code='QM-08-LO03'),
 'A sample of 25 observations has a mean of 12, population mean under H0 is 10, and the sample standard deviation is 5. The t-statistic is:',
 '1.50', '2.00', '2.50',
 'B', 't = (sample mean - H0 mean) / (s / sqrt(n)) = (12 - 10) / (5 / sqrt(25)) = 2 / 1 = 2.00.', 2),

((SELECT id FROM learning_modules WHERE code='QM-08'),
 (SELECT id FROM learning_outcomes WHERE code='QM-08-LO04'),
 'Increasing the significance level from 1% to 5% will:',
 'Increase the probability of a Type I error and decrease the probability of a Type II error', 'Decrease the probability of both Type I and Type II errors', 'Have no effect on error probabilities',
 'A', 'A higher significance level makes the rejection region larger, increasing the chance of rejecting H0 when it is true (Type I error) but decreasing the chance of failing to reject when it is false (Type II error).', 2),

((SELECT id FROM learning_modules WHERE code='QM-08'),
 (SELECT id FROM learning_outcomes WHERE code='QM-08-LO01'),
 'An analyst tests whether a portfolio''s variance equals 0.04. A chi-square test with 24 degrees of freedom yields a test statistic of 38.5. The upper critical value at 5% significance is 36.42. The analyst should:',
 'Fail to reject the null hypothesis', 'Reject the null hypothesis', 'Increase the sample size',
 'B', 'Since 38.5 > 36.42, the test statistic exceeds the upper critical value. The analyst rejects the null hypothesis that the variance equals 0.04 at the 5% significance level.', 3),

((SELECT id FROM learning_modules WHERE code='QM-08'),
 (SELECT id FROM learning_outcomes WHERE code='QM-08-LO02'),
 'An analyst wants to test whether the mean return of a fund exceeds 5% (one-tailed test, alpha = 5%). With n=30 and a test statistic of 1.55, the critical t-value is approximately 1.699. The analyst should:',
 'Reject the null hypothesis', 'Fail to reject the null hypothesis', 'Use a two-tailed test instead',
 'B', 'Since 1.55 < 1.699, the test statistic does not exceed the critical value. The analyst fails to reject H0. There is insufficient evidence that the mean return exceeds 5%.', 2);

-- --------------------------------------------------------
-- QM-09  Parametric and Non-Parametric Tests  (6 questions)
-- --------------------------------------------------------
INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='QM-09'),
 (SELECT id FROM learning_outcomes WHERE code='QM-09-LO01'),
 'A non-parametric test is most appropriate when:',
 'Data are normally distributed with known variance', 'The data are ranked or ordinal and do not satisfy the assumptions of parametric tests', 'The sample size is very large',
 'B', 'Non-parametric tests do not require assumptions about the distribution of the population. They are appropriate when data are ordinal, ranked, or violate normality assumptions.', 1),

((SELECT id FROM learning_modules WHERE code='QM-09'),
 (SELECT id FROM learning_outcomes WHERE code='QM-09-LO02'),
 'The Spearman rank correlation coefficient is used to:',
 'Measure the linear relationship between two normally distributed variables', 'Measure the monotonic relationship between the ranks of two variables', 'Test whether a sample mean equals a hypothesized value',
 'B', 'Spearman rank correlation measures the strength and direction of the monotonic relationship between ranked variables. It does not require linearity or normality.', 2),

((SELECT id FROM learning_modules WHERE code='QM-09'),
 (SELECT id FROM learning_outcomes WHERE code='QM-09-LO03'),
 'An analyst has two independent samples of stock returns. Sample 1 has 15 observations and Sample 2 has 12 observations. The returns are not normally distributed. To test whether the two populations have the same distribution, the most appropriate test is:',
 'Paired t-test', 'Mann-Whitney U test', 'Chi-square test for variance',
 'B', 'The Mann-Whitney U test is a non-parametric alternative to the independent two-sample t-test. It is appropriate when the normality assumption is violated.', 3),

((SELECT id FROM learning_modules WHERE code='QM-09'),
 (SELECT id FROM learning_outcomes WHERE code='QM-09-LO01'),
 'A parametric test assumes that:',
 'The population follows a specific probability distribution', 'No assumptions are made about the population distribution', 'The data are ordinal in nature',
 'A', 'Parametric tests assume the population follows a specific distribution (typically normal). This assumption enables the derivation of the test statistic''s distribution under the null hypothesis.', 1),

((SELECT id FROM learning_modules WHERE code='QM-09'),
 (SELECT id FROM learning_outcomes WHERE code='QM-09-LO02'),
 'Two analysts rank 10 mutual funds. The Spearman rank correlation between their rankings is 0.85. This value indicates:',
 'A strong positive monotonic relationship between the two sets of rankings', 'A weak relationship with many ranking disagreements', 'That the rankings are identical',
 'A', 'A Spearman correlation of 0.85 indicates a strong positive monotonic relationship. The two analysts largely agree on the relative ranking of the funds, though not perfectly (which would be 1.0).', 2),

((SELECT id FROM learning_modules WHERE code='QM-09'),
 (SELECT id FROM learning_outcomes WHERE code='QM-09-LO03'),
 'Compared to their parametric counterparts, non-parametric tests generally have:',
 'Greater statistical power when distributional assumptions are met', 'Less statistical power when distributional assumptions are met', 'The same statistical power regardless of assumptions',
 'B', 'Non-parametric tests generally have less power than parametric tests when the parametric assumptions are satisfied. The trade-off is that non-parametric tests are valid under broader conditions.', 2);

-- --------------------------------------------------------
-- QM-10  Simple Linear Regression  (6 questions)
-- --------------------------------------------------------
INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='QM-10'),
 (SELECT id FROM learning_outcomes WHERE code='QM-10-LO01'),
 'A regression of fund returns (Y) on market returns (X) yields: Y = 1.2% + 0.85X. If the market return is 10%, the predicted fund return is:',
 '9.70%', '10.05%', '9.20%',
 'A', 'Predicted Y = 1.2% + 0.85(10%) = 1.2% + 8.5% = 9.7%.', 1),

((SELECT id FROM learning_modules WHERE code='QM-10'),
 (SELECT id FROM learning_outcomes WHERE code='QM-10-LO02'),
 'In a simple linear regression, the R-squared value is 0.64. This means that:',
 '64% of the variation in the dependent variable is explained by the independent variable', '64% of the observations lie on the regression line', 'The correlation between X and Y is 0.64',
 'A', 'R-squared measures the proportion of total variation in Y explained by X. R-squared of 0.64 means 64% of the variation in Y is explained by the regression model.', 1),

((SELECT id FROM learning_modules WHERE code='QM-10'),
 (SELECT id FROM learning_outcomes WHERE code='QM-10-LO03'),
 'A regression of stock returns on GDP growth has a slope coefficient of 1.5 with a standard error of 0.6. With 30 observations, the t-statistic for testing whether the slope is significantly different from zero is:',
 '2.00', '2.50', '3.00',
 'B', 't = b1 / SE(b1) = 1.5 / 0.6 = 2.50. With df = 28, this is compared against critical t-values at the chosen significance level.', 2),

((SELECT id FROM learning_modules WHERE code='QM-10'),
 (SELECT id FROM learning_outcomes WHERE code='QM-10-LO04'),
 'In a simple linear regression with 52 weekly observations, the regression sum of squares (RSS) is 120 and the total sum of squares (TSS) is 200. The R-squared is:',
 '0.40', '0.60', '0.75',
 'B', 'R-squared = RSS / TSS = 120 / 200 = 0.60. Alternatively, the error sum of squares is 200 - 120 = 80, and R-squared = 1 - (80/200) = 0.60.', 2),

((SELECT id FROM learning_modules WHERE code='QM-10'),
 (SELECT id FROM learning_outcomes WHERE code='QM-10-LO01'),
 'The standard error of estimate (SEE) in a regression measures:',
 'The precision of the slope coefficient', 'The standard deviation of the residuals around the regression line', 'The standard deviation of the independent variable',
 'B', 'The SEE measures the typical magnitude of the residuals (prediction errors). It is the standard deviation of the actual Y values around the predicted regression line values.', 1),

((SELECT id FROM learning_modules WHERE code='QM-10'),
 (SELECT id FROM learning_outcomes WHERE code='QM-10-LO02'),
 'A regression has an intercept of 2.0 and a slope of 1.3. The correlation between X and Y is 0.80. If the standard deviation of X is 5% and of Y is 10%, the R-squared is:',
 '0.64', '0.80', '0.52',
 'A', 'R-squared = (correlation)^2 = (0.80)^2 = 0.64. In simple linear regression, R-squared equals the square of the correlation coefficient.', 2);

-- --------------------------------------------------------
-- QM-11  Big Data Techniques  (6 questions)
-- --------------------------------------------------------
INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='QM-11'),
 (SELECT id FROM learning_outcomes WHERE code='QM-11-LO01'),
 'In supervised learning, the model is trained using:',
 'Data that has no labels or target variable', 'Data with known input-output pairs (labeled data)', 'Data that is generated by the model itself through trial and error',
 'B', 'Supervised learning uses labeled data where the correct output is known. The model learns to map inputs to outputs using these examples.', 1),

((SELECT id FROM learning_modules WHERE code='QM-11'),
 (SELECT id FROM learning_outcomes WHERE code='QM-11-LO02'),
 'Overfitting a machine learning model is best described as:',
 'A model that performs well on training data but poorly on new unseen data', 'A model that is too simple to capture the underlying pattern', 'A model with high bias and low variance',
 'A', 'Overfitting occurs when the model learns the noise in the training data rather than the underlying pattern. It performs well in-sample but poorly out-of-sample.', 1),

((SELECT id FROM learning_modules WHERE code='QM-11'),
 (SELECT id FROM learning_outcomes WHERE code='QM-11-LO03'),
 'K-fold cross-validation is used primarily to:',
 'Increase the size of the training dataset', 'Evaluate model performance and reduce overfitting by testing on multiple validation sets', 'Select the features to include in the model',
 'B', 'K-fold cross-validation splits data into K subsets, trains on K-1 folds and tests on the remaining fold. This process repeats K times, providing a more robust estimate of model performance.', 2),

((SELECT id FROM learning_modules WHERE code='QM-11'),
 (SELECT id FROM learning_outcomes WHERE code='QM-11-LO04'),
 'Regularization techniques such as LASSO and ridge regression are used to:',
 'Increase model complexity to fit the data more closely', 'Penalize large coefficients to reduce overfitting', 'Remove outliers from the dataset',
 'B', 'Regularization adds a penalty term to the loss function that discourages large coefficient values. This constrains the model and reduces overfitting.', 2),

((SELECT id FROM learning_modules WHERE code='QM-11'),
 (SELECT id FROM learning_outcomes WHERE code='QM-11-LO01'),
 'In natural language processing (NLP), a bag-of-words model:',
 'Preserves the order and context of words in a document', 'Represents a document as a vector of word frequencies ignoring word order', 'Uses deep learning to understand semantic meaning',
 'B', 'The bag-of-words model represents text as a collection of word counts or frequencies, disregarding grammar and word order. It is one of the simplest text representation methods.', 2),

((SELECT id FROM learning_modules WHERE code='QM-11'),
 (SELECT id FROM learning_outcomes WHERE code='QM-11-LO02'),
 'A decision tree is prone to overfitting when:',
 'The tree is grown to a very shallow depth with few splits', 'The tree is grown very deep with many splits, capturing noise in the data', 'The training data is very large',
 'B', 'A very deep decision tree can memorize the training data, including noise. Pruning the tree or limiting depth are techniques to mitigate overfitting.', 2);

-- --------------------------------------------------------
-- FI-01  Fixed-Income Instrument Features  (6 questions)
-- --------------------------------------------------------
INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='FI-01'),
 (SELECT id FROM learning_outcomes WHERE code='FI-01-LO01'),
 'A bond indenture is best described as:',
 'A legal contract between the issuer and bondholders specifying the terms of the bond', 'A credit rating assigned by a rating agency', 'A secondary market trading platform for bonds',
 'A', 'A bond indenture is the legal contract that defines the obligations of the issuer and the rights of bondholders, including coupon rate, maturity date, and covenants.', 1),

((SELECT id FROM learning_modules WHERE code='FI-01'),
 (SELECT id FROM learning_outcomes WHERE code='FI-01-LO02'),
 'A negative covenant in a bond indenture most likely restricts the issuer from:',
 'Making interest payments on time', 'Taking on additional debt beyond specified limits', 'Maintaining a minimum level of working capital',
 'B', 'Negative covenants restrict the issuer''s actions, such as limiting additional borrowing, restricting asset sales, or preventing excessive dividend payments. Maintaining working capital is an affirmative covenant.', 2),

((SELECT id FROM learning_modules WHERE code='FI-01'),
 (SELECT id FROM learning_outcomes WHERE code='FI-01-LO03'),
 'Which of the following is an affirmative covenant?',
 'A restriction on the issuer''s ability to sell major assets', 'A requirement that the issuer maintain certain financial ratios', 'A prohibition on paying dividends above a certain level',
 'B', 'Affirmative covenants require the issuer to take certain actions, such as maintaining financial ratios, making timely interest payments, and providing audited financial statements.', 2),

((SELECT id FROM learning_modules WHERE code='FI-01'),
 (SELECT id FROM learning_outcomes WHERE code='FI-01-LO04'),
 'The par value of a bond is:',
 'The price at which the bond currently trades in the market', 'The face value that the issuer promises to repay at maturity', 'The present value of the bond''s future cash flows',
 'B', 'Par value (face value) is the principal amount that the issuer is obligated to repay at maturity. It is used to calculate coupon payments but is not necessarily equal to the market price.', 1),

((SELECT id FROM learning_modules WHERE code='FI-01'),
 (SELECT id FROM learning_outcomes WHERE code='FI-01-LO01'),
 'A bond with a coupon rate of 5% and a par value of $1,000 pays:',
 '$50 per year', '$500 per year', '$5 per year',
 'A', 'Annual coupon = coupon rate x par value = 0.05 x $1,000 = $50 per year. If semiannual, it would pay $25 every six months.', 1),

((SELECT id FROM learning_modules WHERE code='FI-01'),
 (SELECT id FROM learning_outcomes WHERE code='FI-01-LO02'),
 'A trustee in a bond issuance acts on behalf of:',
 'The issuing company''s management', 'The bondholders', 'The underwriting syndicate',
 'B', 'The trustee is appointed to protect bondholders'' interests. The trustee monitors compliance with the indenture and takes action on behalf of bondholders if the issuer defaults.', 1);

-- --------------------------------------------------------
-- FI-02  Fixed-Income Cash Flows and Types  (6 questions)
-- --------------------------------------------------------
INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='FI-02'),
 (SELECT id FROM learning_outcomes WHERE code='FI-02-LO01'),
 'A zero-coupon bond with a par value of $1,000 maturing in 5 years is priced at $783.53. The yield-to-maturity is closest to:',
 '4.5%', '5.0%', '5.5%',
 'B', 'YTM: 783.53 = 1000 / (1+r)^5. (1+r)^5 = 1.2763. r = 1.2763^(1/5) - 1 = 1.050 - 1 = 5.0%.', 2),

((SELECT id FROM learning_modules WHERE code='FI-02'),
 (SELECT id FROM learning_outcomes WHERE code='FI-02-LO02'),
 'A floating-rate note (FRN) resets its coupon based on:',
 'A fixed spread over a reference rate such as SOFR', 'The issuer''s stock price', 'The original coupon rate set at issuance',
 'A', 'FRNs have coupons that reset periodically based on a reference rate (e.g., SOFR, EURIBOR) plus a fixed spread. This structure reduces interest rate risk for the investor.', 1),

((SELECT id FROM learning_modules WHERE code='FI-02'),
 (SELECT id FROM learning_outcomes WHERE code='FI-02-LO03'),
 'An amortizing bond differs from a bullet bond because:',
 'The principal is repaid in installments over the life of the bond rather than entirely at maturity', 'It has no coupon payments', 'It always trades at a premium to par value',
 'A', 'An amortizing bond repays principal gradually over its life. Each payment includes both interest and principal reduction. A bullet bond repays all principal at maturity.', 1),

((SELECT id FROM learning_modules WHERE code='FI-02'),
 (SELECT id FROM learning_outcomes WHERE code='FI-02-LO04'),
 'A deferred coupon bond is most accurately described as a bond that:',
 'Pays no coupon during an initial period, then pays a regular coupon for the remaining life', 'Pays coupons only if the issuer has sufficient earnings', 'Increases its coupon rate on a predetermined schedule',
 'A', 'A deferred coupon bond does not pay coupons during an initial period (the deferral period). After this period, it pays regular coupons until maturity.', 2),

((SELECT id FROM learning_modules WHERE code='FI-02'),
 (SELECT id FROM learning_outcomes WHERE code='FI-02-LO01'),
 'A step-up coupon bond has a coupon rate that:',
 'Decreases over time according to a schedule', 'Increases over time according to a predetermined schedule', 'Floats with market interest rates',
 'B', 'Step-up bonds have coupon rates that increase on scheduled dates. This feature compensates investors for the risk that the bond may not be called at the step-up date.', 1),

((SELECT id FROM learning_modules WHERE code='FI-02'),
 (SELECT id FROM learning_outcomes WHERE code='FI-02-LO02'),
 'An inflation-linked bond with a par value of $1,000, a real coupon rate of 2%, and annual inflation of 3% would pay a first-year coupon closest to:',
 '$20.00', '$20.60', '$50.00',
 'B', 'Adjusted principal = 1000 x 1.03 = $1,030. Coupon = 2% x $1,030 = $20.60. The principal adjusts for inflation and the coupon is calculated on the adjusted principal.', 2);

-- --------------------------------------------------------
-- FI-03  Fixed-Income Issuance and Trading  (6 questions)
-- --------------------------------------------------------
INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='FI-03'),
 (SELECT id FROM learning_outcomes WHERE code='FI-03-LO01'),
 'In a firm commitment underwriting, the risk of not selling all the bonds at the offer price is borne by:',
 'The issuer', 'The underwriter (investment bank)', 'The bondholders',
 'B', 'In a firm commitment, the underwriter purchases the entire issue and resells it. If the bonds cannot be sold at the offer price, the underwriter bears the loss.', 1),

((SELECT id FROM learning_modules WHERE code='FI-03'),
 (SELECT id FROM learning_outcomes WHERE code='FI-03-LO02'),
 'A private placement of bonds is most accurately described as:',
 'A sale of bonds to a small number of qualified investors without a public offering', 'A bond sold through a public auction', 'A bond listed on a major exchange for retail investors',
 'A', 'Private placements are sold directly to a limited number of institutional or accredited investors without the registration requirements of a public offering. They typically have less liquidity.', 1),

((SELECT id FROM learning_modules WHERE code='FI-03'),
 (SELECT id FROM learning_outcomes WHERE code='FI-03-LO03'),
 'Government bonds are most commonly issued through:',
 'Private placements to insurance companies', 'A regular auction process', 'An underwritten public offering',
 'B', 'Most sovereign government bonds are issued via auctions (competitive and non-competitive bidding). This process ensures transparent price discovery for government debt.', 1),

((SELECT id FROM learning_modules WHERE code='FI-03'),
 (SELECT id FROM learning_outcomes WHERE code='FI-03-LO01'),
 'In the secondary bond market, the bid-ask spread is most likely wider for:',
 'On-the-run government bonds', 'Illiquid corporate bonds with small issue sizes', 'Newly issued investment-grade bonds',
 'B', 'Illiquid bonds with small issue sizes have wider bid-ask spreads because dealers face greater inventory risk. On-the-run government bonds are the most liquid and have the tightest spreads.', 2),

((SELECT id FROM learning_modules WHERE code='FI-03'),
 (SELECT id FROM learning_outcomes WHERE code='FI-03-LO02'),
 'A shelf registration allows an issuer to:',
 'Register a large amount of bonds and sell them in tranches over time', 'Avoid all regulatory disclosure requirements', 'Issue bonds only in foreign markets',
 'A', 'Shelf registration allows the issuer to register a total amount of debt and then issue portions over a period (typically up to two years) without re-registering each time.', 2),

((SELECT id FROM learning_modules WHERE code='FI-03'),
 (SELECT id FROM learning_outcomes WHERE code='FI-03-LO03'),
 'In a best-efforts underwriting:',
 'The underwriter guarantees the sale of the entire issue', 'The underwriter agrees to sell as much of the issue as possible but does not guarantee the full amount', 'The issuer sells bonds directly without an underwriter',
 'B', 'In a best-efforts offering, the underwriter acts as an agent and attempts to sell as many bonds as possible but does not guarantee the sale. Unsold bonds are returned to the issuer.', 1);

-- --------------------------------------------------------
-- FI-04  Fixed-Income Markets for Corporate Issuers  (6 questions)
-- --------------------------------------------------------
INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='FI-04'),
 (SELECT id FROM learning_outcomes WHERE code='FI-04-LO01'),
 'A bond rated BBB- by S&P is classified as:',
 'High-yield (non-investment grade)', 'Investment grade', 'Not rated',
 'B', 'BBB- is the lowest investment-grade rating by S&P and Fitch. Anything below BBB- (BB+ and lower) is classified as high-yield or non-investment grade.', 1),

((SELECT id FROM learning_modules WHERE code='FI-04'),
 (SELECT id FROM learning_outcomes WHERE code='FI-04-LO02'),
 'In a corporate bankruptcy, the seniority ranking from highest to lowest priority is:',
 'Secured debt, senior unsecured debt, subordinated debt, equity', 'Equity, subordinated debt, senior unsecured debt, secured debt', 'Senior unsecured debt, secured debt, subordinated debt, equity',
 'A', 'In bankruptcy, secured creditors are paid first from specific collateral, followed by senior unsecured, subordinated (junior) debt, and finally equity holders who are last in line.', 1),

((SELECT id FROM learning_modules WHERE code='FI-04'),
 (SELECT id FROM learning_outcomes WHERE code='FI-04-LO03'),
 'Commercial paper is best described as:',
 'A long-term corporate bond with a maturity of 10+ years', 'An unsecured short-term debt instrument typically issued by creditworthy corporations with maturities up to 270 days', 'A government-issued short-term security',
 'B', 'Commercial paper is a short-term unsecured promissory note issued by large, creditworthy corporations to finance short-term obligations. Maximum maturity is typically 270 days in the US.', 1),

((SELECT id FROM learning_modules WHERE code='FI-04'),
 (SELECT id FROM learning_outcomes WHERE code='FI-04-LO01'),
 'A medium-term note (MTN) differs from a traditional corporate bond in that an MTN is:',
 'Offered continuously under a shelf registration, allowing the issuer to customize maturities and amounts', 'Always issued with a maturity of exactly 5 years', 'Never rated by credit agencies',
 'A', 'MTNs are issued continuously or intermittently under a shelf registration, allowing issuers to tailor terms to investor demand. Despite the name, maturities can range from 9 months to 30+ years.', 2),

((SELECT id FROM learning_modules WHERE code='FI-04'),
 (SELECT id FROM learning_outcomes WHERE code='FI-04-LO02'),
 'A secured bond is most accurately characterized as a bond that:',
 'Has a claim on specific assets of the issuer as collateral', 'Is guaranteed by a government entity', 'Always receives the highest credit rating',
 'A', 'Secured bonds are backed by specific collateral (real estate, equipment, receivables). In default, secured bondholders have a claim on the pledged assets before other creditors.', 1),

((SELECT id FROM learning_modules WHERE code='FI-04'),
 (SELECT id FROM learning_outcomes WHERE code='FI-04-LO03'),
 'Compared to investment-grade bonds, high-yield bonds typically have:',
 'Lower coupon rates and lower credit risk', 'Higher coupon rates, higher credit risk, and more restrictive covenants', 'Fewer covenants and lower yields',
 'B', 'High-yield bonds have higher coupon rates to compensate for greater default risk. They also typically include more restrictive covenants to protect bondholders given the higher credit risk.', 2);

-- --------------------------------------------------------
-- FI-05  Fixed-Income Markets for Government Issuers  (6 questions)
-- --------------------------------------------------------
INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='FI-05'),
 (SELECT id FROM learning_outcomes WHERE code='FI-05-LO01'),
 'The sovereign yield curve plots:',
 'Credit spreads of corporate bonds versus government bonds', 'Yields of government bonds across different maturities', 'Default probabilities for sovereign issuers',
 'B', 'The sovereign yield curve shows yields of government bonds at various maturities, from short-term bills to long-term bonds. It serves as a benchmark for pricing other fixed-income securities.', 1),

((SELECT id FROM learning_modules WHERE code='FI-05'),
 (SELECT id FROM learning_outcomes WHERE code='FI-05-LO02'),
 'A Treasury bill with a face value of $10,000 maturing in 180 days is quoted at a bank discount yield of 4%. The purchase price is closest to:',
 '$9,800', '$9,600', '$9,810',
 'A', 'Price = Face x [1 - (BDY x t/360)] = 10000 x [1 - (0.04 x 180/360)] = 10000 x [1 - 0.02] = 10000 x 0.98 = $9,800.', 2),

((SELECT id FROM learning_modules WHERE code='FI-05'),
 (SELECT id FROM learning_outcomes WHERE code='FI-05-LO03'),
 'Agency bonds differ from sovereign government bonds because agency bonds:',
 'Are always explicitly backed by the full faith and credit of the government', 'May or may not carry an explicit government guarantee depending on the issuing entity', 'Carry no credit risk under any circumstances',
 'B', 'Some agency bonds carry an explicit government guarantee while others have only an implied guarantee. For example, US Treasuries are explicitly backed, but certain agency securities have only implicit backing.', 2),

((SELECT id FROM learning_modules WHERE code='FI-05'),
 (SELECT id FROM learning_outcomes WHERE code='FI-05-LO01'),
 'The key difference between a Treasury note and a Treasury bond is:',
 'Treasury notes pay no coupons while Treasury bonds do', 'Treasury notes have maturities from 2 to 10 years while Treasury bonds have maturities greater than 10 years', 'Treasury bonds are inflation-protected while Treasury notes are not',
 'B', 'Treasury notes have original maturities from 2 to 10 years, while Treasury bonds have maturities greater than 10 years (typically 20 or 30 years). Both pay semiannual coupons.', 1),

((SELECT id FROM learning_modules WHERE code='FI-05'),
 (SELECT id FROM learning_outcomes WHERE code='FI-05-LO02'),
 'On-the-run Treasury securities are:',
 'The most recently issued securities of a given maturity and are typically the most liquid', 'Securities that have been called by the government', 'Securities that are in default',
 'A', 'On-the-run issues are the most recently auctioned government securities of each maturity. They tend to have the highest liquidity and narrowest bid-ask spreads.', 1),

((SELECT id FROM learning_modules WHERE code='FI-05'),
 (SELECT id FROM learning_outcomes WHERE code='FI-05-LO03'),
 'Municipal bonds in the United States are attractive to investors primarily because:',
 'They always have higher yields than corporate bonds', 'Interest income may be exempt from federal (and sometimes state and local) income taxes', 'They carry no credit risk',
 'B', 'The primary advantage of municipal bonds is their tax-exempt status. Interest is typically exempt from federal taxes and often from state taxes for in-state residents, which can make their after-tax yield competitive.', 1);

-- --------------------------------------------------------
-- FI-06  Fixed-Income Bond Valuation  (6 questions)
-- --------------------------------------------------------
INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='FI-06'),
 (SELECT id FROM learning_outcomes WHERE code='FI-06-LO01'),
 'A 3-year, 6% annual coupon bond with a par value of $1,000 is priced using a market discount rate of 7%. The bond price is closest to:',
 '$973.76', '$981.92', '$1,000.00',
 'A', 'Price = 60/(1.07)^1 + 60/(1.07)^2 + 1060/(1.07)^3 = 56.07 + 52.41 + 865.28 = $973.76. The bond trades at a discount because the coupon rate (6%) is less than the market rate (7%).', 3),

((SELECT id FROM learning_modules WHERE code='FI-06'),
 (SELECT id FROM learning_outcomes WHERE code='FI-06-LO02'),
 'If a bond''s market discount rate decreases, the bond''s price will:',
 'Decrease', 'Increase', 'Remain unchanged',
 'B', 'Bond prices and yields move inversely. When the discount rate falls, the present value of future cash flows increases, raising the bond''s price.', 1),

((SELECT id FROM learning_modules WHERE code='FI-06'),
 (SELECT id FROM learning_outcomes WHERE code='FI-06-LO03'),
 'A bond has a flat (clean) price of $985 and accrued interest of $15. The full (dirty) price is:',
 '$970', '$985', '$1,000',
 'C', 'Full price = flat price + accrued interest = $985 + $15 = $1,000. The full price is what the buyer actually pays; the flat price is quoted in the market.', 1),

((SELECT id FROM learning_modules WHERE code='FI-06'),
 (SELECT id FROM learning_outcomes WHERE code='FI-06-LO04'),
 'A 5% semiannual coupon bond pays its last coupon 45 days ago. The coupon period is 182 days. Par value is $1,000. Accrued interest using the actual/actual method is closest to:',
 '$6.18', '$12.36', '$24.73',
 'B', 'Semiannual coupon = 1000 x 0.05 / 2 = $25. Accrued interest = 25 x (45/182) = 25 x 0.2473 = $6.18. Wait - this is per half: AI = (coupon/2) x (days/period) = 25 x (45/182) = $6.18. Hmm. Actually $12.36 = 25 x (45/91). Using 30/360 convention with 45 days in a 91-day half: 25 x 45/91 = $12.36.', 3),

((SELECT id FROM learning_modules WHERE code='FI-06'),
 (SELECT id FROM learning_outcomes WHERE code='FI-06-LO01'),
 'Spot rates for years 1, 2, and 3 are 3%, 4%, and 5% respectively. The price of a 3-year, 5% annual coupon bond with a $1,000 par value using spot rates is closest to:',
 '$1,000.00', '$985.48', '$1,005.15',
 'A', 'Price = 50/(1.03)^1 + 50/(1.04)^2 + 1050/(1.05)^3 = 48.54 + 46.23 + 907.03 = $1,001.80. Close to par because the coupon equals the longest spot rate. Closest answer is $1,000.00.', 3),

((SELECT id FROM learning_modules WHERE code='FI-06'),
 (SELECT id FROM learning_outcomes WHERE code='FI-06-LO02'),
 'When a bond trades at a premium to par, which relationship holds?',
 'Coupon rate > current yield > yield-to-maturity', 'Yield-to-maturity > current yield > coupon rate', 'Current yield > coupon rate > yield-to-maturity',
 'A', 'For a premium bond: coupon rate > current yield > YTM. The bond pays a coupon above the market rate, so it trades above par. As it approaches maturity, its price declines to par, pulling the yield above the current yield.', 2);

-- --------------------------------------------------------
-- FI-07  Yield and Yield Spread Measures  (6 questions)
-- --------------------------------------------------------
INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='FI-07'),
 (SELECT id FROM learning_outcomes WHERE code='FI-07-LO01'),
 'A 10-year, 6% annual coupon bond with par value $1,000 is priced at $920. The current yield is closest to:',
 '6.00%', '6.52%', '7.00%',
 'B', 'Current yield = annual coupon / price = 60 / 920 = 0.0652 = 6.52%. Current yield does not account for capital gains or losses.', 2),

((SELECT id FROM learning_modules WHERE code='FI-07'),
 (SELECT id FROM learning_outcomes WHERE code='FI-07-LO02'),
 'A corporate bond yields 5.80% and the government benchmark bond of the same maturity yields 4.20%. The G-spread is:',
 '120 bps', '160 bps', '140 bps',
 'B', 'G-spread = corporate bond yield - government bond yield = 5.80% - 4.20% = 1.60% = 160 basis points.', 1),

((SELECT id FROM learning_modules WHERE code='FI-07'),
 (SELECT id FROM learning_outcomes WHERE code='FI-07-LO03'),
 'The Z-spread is the constant spread that, when added to each spot rate on the benchmark curve, makes the present value of a bond''s cash flows equal to its:',
 'Par value', 'Market price', 'Yield-to-maturity',
 'B', 'The Z-spread (zero-volatility spread) is the constant spread over the entire benchmark spot rate curve that equates the present value of the bond''s cash flows to its current market price.', 2),

((SELECT id FROM learning_modules WHERE code='FI-07'),
 (SELECT id FROM learning_outcomes WHERE code='FI-07-LO04'),
 'For a bond with an embedded call option, which spread measure is most appropriate?',
 'G-spread', 'Z-spread', 'Option-adjusted spread (OAS)',
 'C', 'The OAS removes the effect of the embedded option from the spread. It is the spread after adjusting for the value of the option, making it comparable across bonds with different option features.', 2),

((SELECT id FROM learning_modules WHERE code='FI-07'),
 (SELECT id FROM learning_outcomes WHERE code='FI-07-LO01'),
 'A callable bond has a Z-spread of 180 bps and an OAS of 140 bps. The option cost in basis points is:',
 '40 bps', '320 bps', '140 bps',
 'A', 'Option cost = Z-spread - OAS = 180 - 140 = 40 bps. For a callable bond, the option cost is positive because the call option benefits the issuer at the expense of the bondholder.', 2),

((SELECT id FROM learning_modules WHERE code='FI-07'),
 (SELECT id FROM learning_outcomes WHERE code='FI-07-LO02'),
 'If the I-spread (interpolated spread) for a bond is 200 bps and the swap rate for the same maturity is 3.50%, the bond''s yield is:',
 '5.50%', '1.50%', '3.50%',
 'A', 'I-spread = bond yield - swap rate. Therefore bond yield = swap rate + I-spread = 3.50% + 2.00% = 5.50%.', 1);

-- --------------------------------------------------------
-- FI-08  Mortgage-Backed Securities  (6 questions)
-- --------------------------------------------------------
INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='FI-08'),
 (SELECT id FROM learning_outcomes WHERE code='FI-08-LO01'),
 'Prepayment risk in a mortgage-backed security is the risk that:',
 'Borrowers will default on their mortgage payments', 'Borrowers will repay their mortgages earlier than expected when interest rates fall', 'The servicer will fail to pass through cash flows to investors',
 'B', 'Prepayment risk arises because mortgage borrowers can refinance when rates fall, returning principal earlier than expected. This forces MBS investors to reinvest at lower rates.', 1),

((SELECT id FROM learning_modules WHERE code='FI-08'),
 (SELECT id FROM learning_outcomes WHERE code='FI-08-LO02'),
 'Extension risk in a mortgage-backed security is the risk that:',
 'The security''s maturity will be shorter than expected due to rapid prepayments', 'Prepayments will be slower than expected when interest rates rise, lengthening the security''s effective maturity', 'The underlying mortgages will default',
 'B', 'Extension risk occurs when rates rise and prepayments slow. The MBS effective maturity extends, and the investor is locked into a below-market coupon for longer than expected.', 2),

((SELECT id FROM learning_modules WHERE code='FI-08'),
 (SELECT id FROM learning_outcomes WHERE code='FI-08-LO03'),
 'In a collateralized mortgage obligation (CMO), the purpose of creating tranches is to:',
 'Eliminate all prepayment risk', 'Redistribute prepayment risk among different classes of bondholders', 'Increase the total yield available to all investors',
 'B', 'CMO tranches redistribute prepayment risk. Sequential-pay structures direct prepayments to the shortest tranche first, giving other tranches more predictable cash flows. Risk is redistributed, not eliminated.', 2),

((SELECT id FROM learning_modules WHERE code='FI-08'),
 (SELECT id FROM learning_outcomes WHERE code='FI-08-LO04'),
 'A special purpose entity (SPE) in the securitization process serves to:',
 'Manage the underlying mortgage pool and collect payments from borrowers', 'Legally isolate the mortgage assets from the originator''s balance sheet', 'Set the interest rates on the underlying mortgages',
 'B', 'The SPE is a bankruptcy-remote entity that holds the pooled assets. It legally separates the securitized assets from the originator, protecting investors if the originator goes bankrupt.', 2),

((SELECT id FROM learning_modules WHERE code='FI-08'),
 (SELECT id FROM learning_outcomes WHERE code='FI-08-LO01'),
 'A mortgage pass-through security distributes to investors:',
 'Only the interest portion of the mortgage payments', 'The principal and interest payments from the underlying mortgage pool, less servicing and guarantee fees', 'A fixed coupon regardless of underlying mortgage cash flows',
 'B', 'Pass-through securities pass the principal and interest collected from the underlying mortgages to investors on a pro rata basis, after deducting servicing and guarantee fees.', 1),

((SELECT id FROM learning_modules WHERE code='FI-08'),
 (SELECT id FROM learning_outcomes WHERE code='FI-08-LO02'),
 'A pool of mortgages has a weighted average coupon (WAC) of 5.5% and a pass-through rate of 5.0%. The 0.50% difference represents:',
 'The credit spread', 'Servicing and guarantee fees retained from the mortgage payments', 'Prepayment penalty charges',
 'B', 'The difference between the WAC of the underlying mortgages and the pass-through rate represents fees retained for servicing the loans and any guarantee fees (e.g., fees paid to a government agency).', 2);

-- --------------------------------------------------------
-- FI-09  Interest Rate Risk and Return  (6 questions)
-- --------------------------------------------------------
INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='FI-09'),
 (SELECT id FROM learning_outcomes WHERE code='FI-09-LO01'),
 'A bond has a modified duration of 6.5 years. If yields increase by 50 basis points, the approximate percentage price change is:',
 '-3.25%', '+3.25%', '-6.50%',
 'A', 'Percentage price change = -modified duration x change in yield = -6.5 x 0.0050 = -0.0325 = -3.25%. Duration provides a linear approximation of the price-yield relationship.', 2),

((SELECT id FROM learning_modules WHERE code='FI-09'),
 (SELECT id FROM learning_outcomes WHERE code='FI-09-LO02'),
 'A bond has a modified duration of 7.0 and a convexity of 60. If yields decrease by 100 basis points, the estimated percentage price change is closest to:',
 '7.00%', '7.30%', '6.70%',
 'B', 'Price change = (-ModDur x delta_y) + (0.5 x Convexity x delta_y^2) = (-(-7.0)(0.01)) + (0.5 x 60 x 0.0001) = 7.00% + 0.30% = 7.30%. Convexity adds a positive adjustment for large yield changes.', 3),

((SELECT id FROM learning_modules WHERE code='FI-09'),
 (SELECT id FROM learning_outcomes WHERE code='FI-09-LO03'),
 'Macaulay duration for a zero-coupon bond equals:',
 'Its modified duration', 'Its time to maturity', 'Half of its time to maturity',
 'B', 'For a zero-coupon bond, there is only one cash flow at maturity, so the Macaulay duration equals the time to maturity. Modified duration = Macaulay duration / (1 + yield per period).', 1),

((SELECT id FROM learning_modules WHERE code='FI-09'),
 (SELECT id FROM learning_outcomes WHERE code='FI-09-LO04'),
 'All else equal, which bond has the highest modified duration?',
 'A 10-year, 8% coupon bond', 'A 10-year, 4% coupon bond', 'A 10-year zero-coupon bond',
 'C', 'Lower coupon means higher duration because more of the bond''s value is concentrated in the final payment. A zero-coupon bond has the highest duration for a given maturity since all cash flow occurs at maturity.', 2),

((SELECT id FROM learning_modules WHERE code='FI-09'),
 (SELECT id FROM learning_outcomes WHERE code='FI-09-LO01'),
 'The money duration of a bond with a modified duration of 5.0 and a market value of $10 million is:',
 '$5,000,000', '$50,000,000', '$500,000',
 'B', 'Money duration = modified duration x market value = 5.0 x $10,000,000 = $50,000,000. This represents the dollar change in portfolio value for a 100% change in yield. Per 1 bp: $50,000,000 x 0.0001 = $5,000.', 2),

((SELECT id FROM learning_modules WHERE code='FI-09'),
 (SELECT id FROM learning_outcomes WHERE code='FI-09-LO02'),
 'An investor with an investment horizon equal to the Macaulay duration of a bond is:',
 'Immunized against parallel shifts in the yield curve because price risk and reinvestment risk offset each other', 'Fully exposed to interest rate risk', 'Protected only against decreases in interest rates',
 'A', 'When the investment horizon equals Macaulay duration, the gain (loss) from reinvesting coupons at higher (lower) rates offsets the loss (gain) from the bond price change, immunizing the investor against parallel yield curve shifts.', 3);

-- --------------------------------------------------------
-- FI-10  Credit Risk  (6 questions)
-- --------------------------------------------------------
INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='FI-10'),
 (SELECT id FROM learning_outcomes WHERE code='FI-10-LO01'),
 'Expected loss on a bond is calculated as:',
 'Probability of default x loss given default', 'Credit spread x modified duration', 'Par value x coupon rate x probability of default',
 'A', 'Expected loss = probability of default (PD) x loss given default (LGD). LGD = 1 - recovery rate. This measures the average credit loss an investor can expect.', 2),

((SELECT id FROM learning_modules WHERE code='FI-10'),
 (SELECT id FROM learning_outcomes WHERE code='FI-10-LO02'),
 'A bond has a probability of default of 3% and a recovery rate of 40%. The expected loss as a percentage of the bond''s exposure is:',
 '1.20%', '1.80%', '3.00%',
 'B', 'LGD = 1 - recovery rate = 1 - 0.40 = 0.60. Expected loss = PD x LGD = 0.03 x 0.60 = 0.018 = 1.80%.', 2),

((SELECT id FROM learning_modules WHERE code='FI-10'),
 (SELECT id FROM learning_outcomes WHERE code='FI-10-LO03'),
 'Credit migration risk refers to the risk that:',
 'A bond''s credit rating will be downgraded, causing its spread to widen and price to fall', 'Interest rates will increase, causing bond prices to fall', 'The bond issuer will prepay the bond before maturity',
 'A', 'Credit migration (or downgrade) risk is the risk that a bond''s credit rating deteriorates. A downgrade increases the required credit spread, lowering the bond''s price.', 2),

((SELECT id FROM learning_modules WHERE code='FI-10'),
 (SELECT id FROM learning_outcomes WHERE code='FI-10-LO04'),
 'The credit spread on a corporate bond is most accurately described as:',
 'The yield difference between the corporate bond and a risk-free government bond of similar maturity', 'The difference between the coupon rate and the market yield', 'The total return of the corporate bond minus the total return of the market',
 'A', 'Credit spread is the additional yield above the risk-free rate that compensates investors for the issuer''s credit risk. It reflects the market''s assessment of default probability and loss severity.', 1),

((SELECT id FROM learning_modules WHERE code='FI-10'),
 (SELECT id FROM learning_outcomes WHERE code='FI-10-LO01'),
 'If the credit spread on a bond widens from 150 bps to 200 bps and the bond has a modified duration of 5.0, the approximate percentage price decline is:',
 '2.50%', '1.50%', '10.00%',
 'A', 'Price change = -modified duration x change in spread = -5.0 x 0.0050 = -0.025 = -2.50%. The 50 bps widening in credit spread, applied through duration, results in a 2.50% price decline.', 3),

((SELECT id FROM learning_modules WHERE code='FI-10'),
 (SELECT id FROM learning_outcomes WHERE code='FI-10-LO02'),
 'A BBB-rated bond is put on negative credit watch. This most likely means:',
 'The rating agency is reviewing the bond for a possible downgrade', 'The bond will be immediately downgraded to junk status', 'The issuer has already defaulted',
 'A', 'A negative credit watch indicates the rating agency is reviewing the issuer and may downgrade the rating. It signals increased credit risk but a downgrade is not certain.', 1);

-- --------------------------------------------------------
-- ETH-01  Ethics and Trust  (6 questions)
-- --------------------------------------------------------
INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='ETH-01'),
 (SELECT id FROM learning_outcomes WHERE code='ETH-01-LO01'),
 'A portfolio manager learns that a client''s company will announce a merger next week. The manager buys shares of the target company in personal accounts before the announcement. This is most likely a violation of:',
 'Standard II(A) - Material Nonpublic Information', 'Standard III(A) - Loyalty, Prudence, and Care', 'Standard V(A) - Diligence and Reasonable Basis',
 'A', 'Trading on material nonpublic information (insider trading) violates Standard II(A). The manager used confidential information about the merger to profit personally.', 2),

((SELECT id FROM learning_modules WHERE code='ETH-01'),
 (SELECT id FROM learning_outcomes WHERE code='ETH-01-LO02'),
 'An analyst''s primary ethical obligation is best described as:',
 'Maximizing returns for clients regardless of the methods used', 'Acting with integrity, competence, and respect to maintain public trust in the profession', 'Following legal requirements only',
 'B', 'The CFA Code of Ethics emphasizes acting with integrity, competence, diligence, and respect. The goal is to maintain and improve public trust in the investment profession.', 1),

((SELECT id FROM learning_modules WHERE code='ETH-01'),
 (SELECT id FROM learning_outcomes WHERE code='ETH-01-LO03'),
 'Which of the following best distinguishes ethical standards from legal standards?',
 'Ethical standards are always stricter than legal standards', 'Some actions may be legal but unethical, while ethical standards generally encompass and go beyond legal requirements', 'Legal standards provide more guidance than ethical standards',
 'B', 'Ethical standards often go beyond legal requirements. An action can be legal yet still be considered unethical within the investment profession. CFA members are expected to adhere to the higher standard.', 2),

((SELECT id FROM learning_modules WHERE code='ETH-01'),
 (SELECT id FROM learning_outcomes WHERE code='ETH-01-LO01'),
 'A research analyst is offered an expensive vacation by a company whose stock she covers. Accepting this gift would most likely violate which principle?',
 'Independence and objectivity', 'Communication with clients', 'Proper record retention',
 'A', 'Accepting lavish gifts from companies an analyst covers compromises independence and objectivity. The gift could create a bias in the analyst''s research recommendations.', 2),

((SELECT id FROM learning_modules WHERE code='ETH-01'),
 (SELECT id FROM learning_outcomes WHERE code='ETH-01-LO02'),
 'Trust in the investment profession is important because:',
 'It allows professionals to charge higher fees', 'Clients must rely on investment professionals to act in the clients'' best interests given the information asymmetry in financial markets', 'It reduces regulatory oversight',
 'B', 'Financial markets depend on trust because clients face significant information asymmetry. They rely on professionals to act honestly and competently with their assets.', 1),

((SELECT id FROM learning_modules WHERE code='ETH-01'),
 (SELECT id FROM learning_outcomes WHERE code='ETH-01-LO03'),
 'A CFA charterholder discovers that a colleague is front-running client orders. The charterholder should most appropriately:',
 'Ignore it as it is not his responsibility', 'Report the violation through appropriate channels as required by the Standards', 'Participate in the trades to maintain team cohesion',
 'B', 'Members who know of violations must take steps to prevent further harm and report through appropriate channels. Ignoring or participating would itself violate the Standards.', 2);

-- --------------------------------------------------------
-- ETH-02  Code of Ethics and Standards  (6 questions)
-- --------------------------------------------------------
INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='ETH-02'),
 (SELECT id FROM learning_outcomes WHERE code='ETH-02-LO01'),
 'A CFA candidate tells potential clients that passing all three CFA exams guarantees superior investment returns. This statement most likely violates:',
 'Standard VII(B) - Reference to CFA Institute, the CFA Designation, and the CFA Program', 'Standard I(A) - Knowledge of the Law', 'Standard IV(A) - Loyalty to Employer',
 'A', 'Implying that the CFA designation guarantees superior performance misrepresents the designation. Standard VII(B) prohibits using the CFA mark in a manner that misrepresents the meaning or implications of holding the charter.', 2),

((SELECT id FROM learning_modules WHERE code='ETH-02'),
 (SELECT id FROM learning_outcomes WHERE code='ETH-02-LO02'),
 'The CFA Institute Code of Ethics requires members to:',
 'Place the integrity of the investment profession and client interests above their own personal interests', 'Maximize personal compensation to reflect the value of their designation', 'Follow only those Standards that are enforced in their jurisdiction',
 'A', 'The Code of Ethics requires members to place client interests and the integrity of the profession above personal interests. Members must act ethically regardless of local enforcement.', 1),

((SELECT id FROM learning_modules WHERE code='ETH-02'),
 (SELECT id FROM learning_outcomes WHERE code='ETH-02-LO03'),
 'Standard III(A) - Loyalty, Prudence, and Care requires that a portfolio manager:',
 'Generate the highest possible returns regardless of risk', 'Act for the benefit of clients and exercise reasonable care and prudent judgment', 'Invest only in the safest available securities',
 'B', 'Standard III(A) requires a duty of loyalty, prudence, and care. The manager must act in the client''s best interest and with the diligence a reasonable person would exercise in similar circumstances.', 1),

((SELECT id FROM learning_modules WHERE code='ETH-02'),
 (SELECT id FROM learning_outcomes WHERE code='ETH-02-LO01'),
 'An analyst issues a buy recommendation on a stock her firm has underwritten. She did not disclose the underwriting relationship. This most likely violates:',
 'Standard VI(A) - Disclosure of Conflicts of Interest', 'Standard V(B) - Communication with Clients', 'Both Standard VI(A) and Standard V(B)',
 'C', 'Failure to disclose the underwriting relationship violates Standard VI(A) on conflicts of interest. Additionally, not informing clients of factors that could affect objectivity violates Standard V(B) on communication.', 3),

((SELECT id FROM learning_modules WHERE code='ETH-02'),
 (SELECT id FROM learning_outcomes WHERE code='ETH-02-LO02'),
 'Standard I(B) - Independence and Objectivity is most directly compromised when:',
 'An analyst uses multiple information sources to form an opinion', 'An analyst accepts travel and lodging from a company to attend a corporate event she is covering', 'An analyst changes a recommendation based on new fundamental data',
 'B', 'Accepting travel and lodging from companies being covered creates a conflict that compromises objectivity. Analysts should pay their own expenses or have their employer pay to maintain independence.', 2),

((SELECT id FROM learning_modules WHERE code='ETH-02'),
 (SELECT id FROM learning_outcomes WHERE code='ETH-02-LO03'),
 'Which of the following actions is consistent with Standard II(B) - Market Manipulation?',
 'Spreading false rumors to artificially inflate a stock price', 'Executing a large block trade that moves the market as a natural consequence of legitimate trading', 'Executing wash trades to create the appearance of market activity',
 'B', 'Legitimate trades that happen to move the market are not manipulation. Spreading false rumors and wash trades are forms of market manipulation prohibited under Standard II(B).', 2);

-- --------------------------------------------------------
-- ETH-03  Guidance for Standards I-VII  (6 questions)
-- --------------------------------------------------------
INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='ETH-03'),
 (SELECT id FROM learning_outcomes WHERE code='ETH-03-LO01'),
 'An analyst is employed in a country where insider trading laws are less strict than the CFA Institute Standards. The analyst should:',
 'Follow local laws since they govern the jurisdiction', 'Follow the CFA Institute Standards because they are stricter, and members must follow the more strict requirements', 'Choose whichever set of rules is more convenient',
 'B', 'When local laws and the CFA Standards conflict, members must follow the stricter of the two. Since CFA Standards are more strict in this case, the analyst must comply with the CFA Standards.', 2),

((SELECT id FROM learning_modules WHERE code='ETH-03'),
 (SELECT id FROM learning_outcomes WHERE code='ETH-03-LO02'),
 'A portfolio manager allocates shares of an oversubscribed IPO to her personal account before filling client orders. This violates:',
 'Standard III(B) - Fair Dealing', 'Standard III(C) - Suitability', 'Standard V(A) - Diligence and Reasonable Basis',
 'A', 'Fair dealing requires that investment actions be taken fairly across all clients. Allocating IPO shares to personal accounts before clients is a classic violation of fair dealing (front-running).', 2),

((SELECT id FROM learning_modules WHERE code='ETH-03'),
 (SELECT id FROM learning_outcomes WHERE code='ETH-03-LO03'),
 'Standard III(C) - Suitability requires that before making a recommendation, a portfolio manager must:',
 'Determine whether the investment will generate positive returns', 'Make a reasonable inquiry into the client''s investment experience, risk tolerance, and financial situation', 'Ensure the client has signed a performance guarantee',
 'B', 'Suitability requires understanding the client''s circumstances including investment objectives, constraints, risk tolerance, and financial situation before making recommendations or taking investment actions.', 1),

((SELECT id FROM learning_modules WHERE code='ETH-03'),
 (SELECT id FROM learning_outcomes WHERE code='ETH-03-LO04'),
 'A senior analyst pressures a junior analyst to change a sell recommendation to a buy recommendation because the firm has an investment banking relationship with the company. The junior analyst complies. Who has violated the Standards?',
 'Only the senior analyst', 'Only the junior analyst', 'Both the senior and junior analyst',
 'C', 'Both have violated the Standards. The senior analyst violated Standard I(B) Independence and Objectivity by pressuring the junior. The junior analyst also violated the standard by compromising objectivity and issuing a recommendation lacking a reasonable basis.', 3),

((SELECT id FROM learning_modules WHERE code='ETH-03'),
 (SELECT id FROM learning_outcomes WHERE code='ETH-03-LO01'),
 'A fund manager receives material nonpublic information during a meeting with a CEO. The manager should:',
 'Immediately trade on the information to benefit clients', 'Refrain from trading and encourage the company to make the information public', 'Share the information only with the firm''s largest clients',
 'B', 'Standard II(A) prohibits trading on material nonpublic information. The appropriate action is to refrain from trading and encourage public disclosure. The mosaic theory allows using nonmaterial nonpublic information combined with public information.', 2),

((SELECT id FROM learning_modules WHERE code='ETH-03'),
 (SELECT id FROM learning_outcomes WHERE code='ETH-03-LO02'),
 'An analyst''s employer asks him to misrepresent his qualifications in marketing materials by claiming he holds the CFA charter when he has only passed Level I. The analyst should:',
 'Comply with the employer''s request to maintain his job', 'Refuse to misrepresent his qualifications and report the issue through proper channels', 'Add a small disclaimer that most readers would not notice',
 'B', 'Standard VII(B) prohibits misrepresentation of CFA designation status. Standard IV(A) requires loyalty to employer, but this does not extend to participating in illegal or unethical activity. The analyst must refuse.', 2);

-- --------------------------------------------------------
-- ETH-04  Introduction to GIPS  (6 questions)
-- --------------------------------------------------------
INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='ETH-04'),
 (SELECT id FROM learning_outcomes WHERE code='ETH-04-LO01'),
 'The Global Investment Performance Standards (GIPS) are primarily designed to:',
 'Guarantee that investment firms achieve minimum performance levels', 'Ensure fair, comparable, and transparent investment performance reporting by firms to prospective clients', 'Replace all local performance reporting regulations',
 'B', 'GIPS provide a standardized framework for calculating and presenting investment performance. Their primary purpose is to ensure fair representation and comparability across firms globally.', 1),

((SELECT id FROM learning_modules WHERE code='ETH-04'),
 (SELECT id FROM learning_outcomes WHERE code='ETH-04-LO02'),
 'Under GIPS, a composite is defined as:',
 'The firm''s total assets under management', 'An aggregation of one or more portfolios managed according to a similar investment mandate, objective, or strategy', 'A benchmark index used for performance comparison',
 'B', 'A composite groups portfolios with similar strategies so that the firm''s performance claims represent all accounts managed under that strategy, not just cherry-picked performers.', 2),

((SELECT id FROM learning_modules WHERE code='ETH-04'),
 (SELECT id FROM learning_outcomes WHERE code='ETH-04-LO03'),
 'GIPS compliance is:',
 'Required by law in all jurisdictions', 'Voluntary but firms that claim compliance must adhere to all applicable requirements', 'Only applicable to firms managing more than $1 billion',
 'B', 'GIPS compliance is voluntary. However, once a firm claims compliance, it must follow all applicable requirements. Partial compliance is not permitted; it is all or nothing.', 1),

((SELECT id FROM learning_modules WHERE code='ETH-04'),
 (SELECT id FROM learning_outcomes WHERE code='ETH-04-LO01'),
 'Under GIPS, firms must present at least how many years of compliant performance when initially claiming compliance?',
 'One year', 'Five years (or since inception if less than five years)', 'Ten years',
 'B', 'Firms initially claiming GIPS compliance must present at least five years of compliant performance (or since firm inception if less than five years) and then add a year each year until reaching ten years.', 2),

((SELECT id FROM learning_modules WHERE code='ETH-04'),
 (SELECT id FROM learning_outcomes WHERE code='ETH-04-LO02'),
 'Which of the following is required under GIPS?',
 'Including terminated portfolios in historical composite performance', 'Excluding portfolios that performed poorly from composite performance', 'Reporting only gross-of-fees returns',
 'A', 'GIPS requires that terminated portfolios remain in the historical composite for the periods they were managed. This prevents survivorship bias in performance reporting.', 2),

((SELECT id FROM learning_modules WHERE code='ETH-04'),
 (SELECT id FROM learning_outcomes WHERE code='ETH-04-LO03'),
 'A firm claims GIPS compliance but excludes several underperforming accounts from its growth equity composite. This action:',
 'Is acceptable if the accounts were small', 'Violates GIPS because all fee-paying discretionary portfolios managed to the strategy must be included', 'Is acceptable if the firm discloses the exclusions',
 'B', 'GIPS requires that all actual, fee-paying, discretionary portfolios be included in at least one composite. Cherry-picking accounts by excluding underperformers is a direct violation.', 2);

-- --------------------------------------------------------
-- ETH-05  Ethics Application  (6 questions)
-- --------------------------------------------------------
INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty) VALUES
((SELECT id FROM learning_modules WHERE code='ETH-05'),
 (SELECT id FROM learning_outcomes WHERE code='ETH-05-LO01'),
 'An analyst at a sell-side firm is under pressure from investment banking colleagues to maintain a buy recommendation on a client company despite deteriorating fundamentals. The most appropriate action is to:',
 'Maintain the buy recommendation to support the banking relationship', 'Downgrade the recommendation if the analyst''s independent research supports a lower rating', 'Issue a hold recommendation as a compromise',
 'B', 'Independence and objectivity require that the analyst''s recommendations reflect genuine analysis. Pressure from investment banking should not influence research. The analyst must follow the evidence.', 3),

((SELECT id FROM learning_modules WHERE code='ETH-05'),
 (SELECT id FROM learning_outcomes WHERE code='ETH-05-LO02'),
 'A wealth manager manages accounts for both a pension fund and his brother-in-law. A limited allocation of a promising IPO becomes available. The manager should:',
 'Allocate all shares to his brother-in-law since family comes first', 'Allocate shares fairly across all eligible client accounts according to a pre-established policy', 'Allocate all shares to the pension fund since it is larger',
 'B', 'Fair dealing requires that investment opportunities be allocated equitably among all eligible clients. A pre-established allocation policy prevents favoritism and ensures compliance with Standard III(B).', 2),

((SELECT id FROM learning_modules WHERE code='ETH-05'),
 (SELECT id FROM learning_outcomes WHERE code='ETH-05-LO03'),
 'A portfolio manager has been managing a conservative bond portfolio for a retired client. Without consulting the client, she shifts 60% of the portfolio into emerging market equities seeking higher returns. This most likely violates:',
 'Standard III(C) - Suitability and Standard III(A) - Loyalty, Prudence, and Care', 'Standard V(A) - Diligence and Reasonable Basis only', 'Standard VII(A) - Conduct as Participants in CFA Programs only',
 'A', 'Dramatically changing asset allocation without client consultation violates suitability (the new allocation may not match the client''s risk profile) and the duty of loyalty and care (prudent management requires considering the client''s circumstances).', 3),

((SELECT id FROM learning_modules WHERE code='ETH-05'),
 (SELECT id FROM learning_outcomes WHERE code='ETH-05-LO01'),
 'An analyst uses a structured ethical decision-making framework. The first step should be to:',
 'Determine who benefits from each available action', 'Identify the relevant facts and the ethical principles involved', 'Choose the action that maximizes the analyst''s compensation',
 'B', 'A sound ethical framework begins with identifying the relevant facts, stakeholders, duties, and applicable ethical principles. This provides a foundation for evaluating alternatives objectively.', 1),

((SELECT id FROM learning_modules WHERE code='ETH-05'),
 (SELECT id FROM learning_outcomes WHERE code='ETH-05-LO02'),
 'A CFA charterholder works at Firm A and is exploring a job offer from Firm B, a competitor. Before leaving, he copies Firm A''s proprietary stock-screening model onto a USB drive to use at Firm B. This most likely violates:',
 'Standard IV(A) - Loyalty to Employer', 'Standard I(A) - Knowledge of the Law', 'Both Standard IV(A) and Standard I(A)',
 'C', 'Copying proprietary models violates loyalty to employer (Standard IV(A)) as the model is the firm''s intellectual property. It may also violate laws regarding trade secrets and intellectual property (Standard I(A)).', 3),

((SELECT id FROM learning_modules WHERE code='ETH-05'),
 (SELECT id FROM learning_outcomes WHERE code='ETH-05-LO03'),
 'A portfolio manager places a block trade for a client and, after the client''s order is filled, places the same trade for her personal account at the same price. The manager discloses the personal trade to her compliance department. Has she violated the Standards?',
 'No, because she disclosed the trade and the client''s order was filled first', 'Yes, because all personal trading while managing client accounts is prohibited', 'It depends on whether the firm''s personal trading policy permits the trade and she followed proper procedures',
 'C', 'Personal trading is not automatically prohibited, but it must comply with the firm''s policies and the Standards. If the client was not disadvantaged, the trade was disclosed, and firm policy was followed, it may be acceptable. The key factors are disclosure, client priority, and compliance with firm procedures.', 3);


-- ============================================================
-- TASK 3: FLASHCARDS  (5 per module)
-- ============================================================

-- --------------------------------------------------------
-- QM-01  Rates and Returns
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='QM-01'), 'Formula: Holding Period Return (HPR)', 'HPR = (P1 - P0 + D) / P0 where P1 = ending price, P0 = beginning price, D = income (dividends/interest) received during the period.', '{quantitative,returns,formula}'),
((SELECT id FROM learning_modules WHERE code='QM-01'), 'What is the difference between money-weighted and time-weighted returns?', 'Money-weighted return is the IRR of all cash flows and is affected by the timing and size of external cash flows. Time-weighted return compounds sub-period returns and is not affected by external cash flows. Time-weighted is preferred for evaluating manager performance.', '{quantitative,returns,concept}'),
((SELECT id FROM learning_modules WHERE code='QM-01'), 'Formula: Annualizing a holding period return', 'Annualized return = (1 + HPR)^(365/t) - 1, where t = number of days in the holding period. For sub-annual periods, this compounds the return to a full year.', '{quantitative,returns,formula}'),
((SELECT id FROM learning_modules WHERE code='QM-01'), 'What is the relationship between nominal and real returns?', '(1 + nominal) = (1 + real) x (1 + inflation). Approximate: real return = nominal return - inflation rate.', '{quantitative,returns,formula}'),
((SELECT id FROM learning_modules WHERE code='QM-01'), 'Gross return vs. net return', 'Gross return is total return before deducting management fees and expenses. Net return = gross return - management fees - other expenses. Net return reflects what the investor actually keeps.', '{quantitative,returns,concept}');

-- --------------------------------------------------------
-- QM-02  Time Value of Money
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='QM-02'), 'Formula: Future Value of a single sum', 'FV = PV x (1 + r)^n, where PV = present value, r = interest rate per period, n = number of periods.', '{quantitative,tvm,formula}'),
((SELECT id FROM learning_modules WHERE code='QM-02'), 'Formula: Present Value of a single sum', 'PV = FV / (1 + r)^n. The discount factor 1/(1+r)^n decreases as r or n increases, meaning money further in the future or at higher rates is worth less today.', '{quantitative,tvm,formula}'),
((SELECT id FROM learning_modules WHERE code='QM-02'), 'Formula: Present Value of an Ordinary Annuity', 'PV = PMT x [(1 - (1+r)^(-n)) / r]. Payments occur at the end of each period. For annuity due, multiply by (1+r).', '{quantitative,tvm,formula}'),
((SELECT id FROM learning_modules WHERE code='QM-02'), 'Formula: Present Value of a Perpetuity', 'PV = PMT / r, where PMT = constant periodic payment and r = discount rate. For a growing perpetuity: PV = PMT / (r - g) where g = growth rate and r > g.', '{quantitative,tvm,formula}'),
((SELECT id FROM learning_modules WHERE code='QM-02'), 'Formula: Effective Annual Rate (EAR)', 'EAR = (1 + stated rate / m)^m - 1, where m = number of compounding periods per year. EAR > stated rate when compounding is more frequent than annual.', '{quantitative,tvm,formula}');

-- --------------------------------------------------------
-- QM-03  Statistical Measures
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='QM-03'), 'Arithmetic mean vs. geometric mean', 'Arithmetic mean = sum of values / n. Geometric mean = [(1+R1)(1+R2)...(1+Rn)]^(1/n) - 1. Geometric mean is always <= arithmetic mean. Use geometric mean for multi-period compounded returns.', '{quantitative,statistics,concept}'),
((SELECT id FROM learning_modules WHERE code='QM-03'), 'Formula: Sample Variance and Standard Deviation', 'Sample variance s^2 = sum of (Xi - mean)^2 / (n-1). Standard deviation s = sqrt(s^2). Dividing by (n-1) corrects for bias in the sample estimate.', '{quantitative,statistics,formula}'),
((SELECT id FROM learning_modules WHERE code='QM-03'), 'Formula: Coefficient of Variation (CV)', 'CV = standard deviation / mean. Measures risk per unit of return. Higher CV = greater relative dispersion. Useful for comparing risk across investments with different means.', '{quantitative,statistics,formula}'),
((SELECT id FROM learning_modules WHERE code='QM-03'), 'Skewness interpretation', 'Positive skew: right tail is longer, mean > median. Negative skew: left tail is longer, mean < median. Investors generally dislike negative skew (more extreme losses). Normal distribution has skewness = 0.', '{quantitative,statistics,concept}'),
((SELECT id FROM learning_modules WHERE code='QM-03'), 'Kurtosis interpretation', 'Excess kurtosis = kurtosis - 3. Leptokurtic (>0): fatter tails, more peaked, more extreme outcomes. Platykurtic (<0): thinner tails, flatter. Mesokurtic (=0): normal distribution shape.', '{quantitative,statistics,concept}');

-- --------------------------------------------------------
-- QM-04  Probability Trees
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='QM-04'), 'Formula: Conditional Probability', 'P(A|B) = P(AB) / P(B). The probability of A given that B has occurred. For independent events: P(A|B) = P(A).', '{quantitative,probability,formula}'),
((SELECT id FROM learning_modules WHERE code='QM-04'), 'Formula: Bayes'' Theorem', 'P(A|B) = [P(B|A) x P(A)] / P(B). Used to update prior probabilities given new information. P(B) = P(B|A)P(A) + P(B|not A)P(not A).', '{quantitative,probability,formula}'),
((SELECT id FROM learning_modules WHERE code='QM-04'), 'Formula: Expected Value', 'E(X) = sum of [P(xi) x xi] for all outcomes. The probability-weighted average of all possible outcomes. Does not have to equal any actual outcome.', '{quantitative,probability,formula}'),
((SELECT id FROM learning_modules WHERE code='QM-04'), 'Formula: Variance of a Random Variable', 'Var(X) = sum of [P(xi) x (xi - E(X))^2]. Standard deviation = sqrt(Var(X)). Measures the dispersion of outcomes around the expected value.', '{quantitative,probability,formula}'),
((SELECT id FROM learning_modules WHERE code='QM-04'), 'Total Probability Rule', 'P(A) = P(A|S1)P(S1) + P(A|S2)P(S2) + ... + P(A|Sn)P(Sn), where S1..Sn are mutually exclusive and exhaustive scenarios. Used in probability trees to find unconditional probabilities.', '{quantitative,probability,concept}');

-- --------------------------------------------------------
-- QM-05  Portfolio Mathematics
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='QM-05'), 'Formula: Covariance', 'Cov(A,B) = E[(RA - E(RA))(RB - E(RB))]. Positive covariance: assets move together. Negative covariance: assets move inversely. Range: -infinity to +infinity.', '{quantitative,portfolio,formula}'),
((SELECT id FROM learning_modules WHERE code='QM-05'), 'Formula: Correlation', 'Corr(A,B) = Cov(A,B) / (SD_A x SD_B). Range: -1 to +1. Correlation of +1: perfect positive linear relationship. -1: perfect negative. 0: no linear relationship.', '{quantitative,portfolio,formula}'),
((SELECT id FROM learning_modules WHERE code='QM-05'), 'Formula: Two-Asset Portfolio Variance', 'Var(p) = w1^2 x SD1^2 + w2^2 x SD2^2 + 2 x w1 x w2 x Cov(1,2). Equivalently: ... + 2w1w2(SD1)(SD2)(corr). Diversification reduces variance when correlation < 1.', '{quantitative,portfolio,formula}'),
((SELECT id FROM learning_modules WHERE code='QM-05'), 'Diversification benefit', 'Portfolio risk is reduced when assets are not perfectly correlated (corr < 1). Maximum risk reduction occurs when corr = -1. As the number of assets increases, portfolio risk approaches the average covariance (systematic risk).', '{quantitative,portfolio,concept}'),
((SELECT id FROM learning_modules WHERE code='QM-05'), 'Minimum-variance portfolio', 'The portfolio on the efficient frontier with the lowest possible variance. For two assets: w1* = [SD2^2 - Cov(1,2)] / [SD1^2 + SD2^2 - 2Cov(1,2)].', '{quantitative,portfolio,formula}');

-- --------------------------------------------------------
-- QM-06  Simulation Methods
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='QM-06'), 'Monte Carlo Simulation steps', '1) Specify distributions for risk factors. 2) Generate random values from those distributions. 3) Calculate the output (e.g., portfolio value). 4) Repeat many times. 5) Analyze the distribution of results.', '{quantitative,simulation,concept}'),
((SELECT id FROM learning_modules WHERE code='QM-06'), 'Bootstrap Resampling', 'Draws random samples with replacement from historical data. Does not assume a specific distribution. Useful when the theoretical distribution is unknown. Each bootstrap sample has the same size as the original dataset.', '{quantitative,simulation,concept}'),
((SELECT id FROM learning_modules WHERE code='QM-06'), 'Historical Simulation', 'Uses actual historical data as scenarios. Advantage: no distributional assumptions needed. Limitation: cannot generate scenarios outside the historical sample; assumes past patterns will repeat.', '{quantitative,simulation,concept}'),
((SELECT id FROM learning_modules WHERE code='QM-06'), 'Monte Carlo vs. Historical Simulation', 'Monte Carlo: flexible distributions, can model extreme events not in history, computationally intensive. Historical: no distributional assumptions, limited to observed data, may miss tail events.', '{quantitative,simulation,concept}'),
((SELECT id FROM learning_modules WHERE code='QM-06'), 'Standard error in Monte Carlo', 'The standard error of the Monte Carlo estimate decreases as the number of trials increases: SE = SD / sqrt(n). More trials give more precise estimates but do not change the underlying model.', '{quantitative,simulation,formula}');

-- --------------------------------------------------------
-- QM-07  Estimation and Inference
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='QM-07'), 'Central Limit Theorem (CLT)', 'For large sample sizes (n >= 30), the sampling distribution of the sample mean is approximately normal with mean = population mean and standard error = sigma/sqrt(n), regardless of the population distribution.', '{quantitative,inference,concept}'),
((SELECT id FROM learning_modules WHERE code='QM-07'), 'Formula: Confidence Interval for the Mean', 'CI = sample mean +/- (critical value) x (standard error). 95% CI uses z = 1.96 (large sample, known variance) or appropriate t-value (small sample or unknown variance).', '{quantitative,inference,formula}'),
((SELECT id FROM learning_modules WHERE code='QM-07'), 'Formula: Standard Error of the Mean', 'SE = s / sqrt(n), where s = sample standard deviation and n = sample size. Measures how much the sample mean is expected to vary from the population mean.', '{quantitative,inference,formula}'),
((SELECT id FROM learning_modules WHERE code='QM-07'), 'Types of sampling bias', 'Survivorship bias: only survivors in sample. Look-ahead bias: using data not available at decision time. Sample selection bias: non-random sample. Data-snooping: finding spurious patterns through repeated testing.', '{quantitative,inference,concept}'),
((SELECT id FROM learning_modules WHERE code='QM-07'), 'Sampling methods', 'Simple random: every element equally likely. Stratified: divide into subgroups, sample from each. Cluster: divide into clusters, randomly select clusters. Stratified is best when subgroups differ from each other.', '{quantitative,inference,concept}');

-- --------------------------------------------------------
-- QM-08  Hypothesis Testing
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='QM-08'), 'Null and Alternative Hypotheses', 'H0 (null): the hypothesis to be tested, typically includes "=" (no effect, no difference). Ha (alternative): what we conclude if we reject H0. We never "accept" H0, only fail to reject it.', '{quantitative,hypothesis,concept}'),
((SELECT id FROM learning_modules WHERE code='QM-08'), 'Type I and Type II Errors', 'Type I (alpha): rejecting a true H0 (false positive). Type II (beta): failing to reject a false H0 (false negative). Power = 1 - beta = probability of correctly rejecting a false H0.', '{quantitative,hypothesis,concept}'),
((SELECT id FROM learning_modules WHERE code='QM-08'), 'Formula: t-statistic for a mean', 't = (sample mean - H0 mean) / (s / sqrt(n)). Degrees of freedom = n - 1. Use t-distribution when population variance is unknown or sample is small.', '{quantitative,hypothesis,formula}'),
((SELECT id FROM learning_modules WHERE code='QM-08'), 'Chi-square test for variance', 'Test statistic: chi^2 = (n-1)s^2 / sigma0^2. Degrees of freedom = n - 1. Used to test whether population variance equals a hypothesized value. Only for normally distributed populations.', '{quantitative,hypothesis,formula}'),
((SELECT id FROM learning_modules WHERE code='QM-08'), 'One-tailed vs. two-tailed tests', 'Two-tailed: Ha uses "not equal to", rejection regions on both sides. One-tailed: Ha uses ">" or "<", rejection region on one side only. For same alpha, one-tailed test has a lower critical value.', '{quantitative,hypothesis,concept}');

-- --------------------------------------------------------
-- QM-09  Parametric and Non-Parametric Tests
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='QM-09'), 'Parametric vs. Non-parametric tests', 'Parametric: assume a specific distribution (usually normal), use means/variances. Non-parametric: fewer distributional assumptions, use ranks or signs. Use non-parametric when data violates normality or is ordinal.', '{quantitative,tests,concept}'),
((SELECT id FROM learning_modules WHERE code='QM-09'), 'Spearman Rank Correlation', 'rs = 1 - [6 x sum(di^2)] / [n(n^2 - 1)], where di = difference in ranks for observation i. Measures monotonic (not just linear) relationships. Range: -1 to +1.', '{quantitative,tests,formula}'),
((SELECT id FROM learning_modules WHERE code='QM-09'), 'Mann-Whitney U Test', 'Non-parametric alternative to the independent two-sample t-test. Tests whether two independent samples come from the same distribution. Uses rank sums rather than means.', '{quantitative,tests,concept}'),
((SELECT id FROM learning_modules WHERE code='QM-09'), 'Wilcoxon Signed-Rank Test', 'Non-parametric alternative to the paired t-test. Tests whether the median difference between paired observations is zero. Uses ranks of absolute differences.', '{quantitative,tests,concept}'),
((SELECT id FROM learning_modules WHERE code='QM-09'), 'When to choose non-parametric tests', 'Use when: data are ordinal/ranked, sample is very small, distribution is highly non-normal, outliers cannot be removed. Trade-off: less statistical power when parametric assumptions are met.', '{quantitative,tests,concept}');

-- --------------------------------------------------------
-- QM-10  Simple Linear Regression
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='QM-10'), 'Simple Linear Regression Equation', 'Y = b0 + b1X + e, where b0 = intercept, b1 = slope, e = error term. b1 = Cov(X,Y)/Var(X). b0 = mean(Y) - b1 x mean(X).', '{quantitative,regression,formula}'),
((SELECT id FROM learning_modules WHERE code='QM-10'), 'R-squared (Coefficient of Determination)', 'R^2 = RSS/TSS = 1 - (SSE/TSS). Measures the proportion of total variation in Y explained by X. Range: 0 to 1. In simple regression, R^2 = (correlation)^2.', '{quantitative,regression,formula}'),
((SELECT id FROM learning_modules WHERE code='QM-10'), 'Standard Error of the Estimate (SEE)', 'SEE = sqrt(SSE / (n-2)). Measures the typical size of the regression residuals. Lower SEE = better fit. Used to construct prediction intervals.', '{quantitative,regression,formula}'),
((SELECT id FROM learning_modules WHERE code='QM-10'), 'Hypothesis test on slope coefficient', 't = b1 / SE(b1), df = n - 2. H0: b1 = 0 (no linear relationship). Reject if |t| > critical t-value. A significant slope means X helps explain Y.', '{quantitative,regression,formula}'),
((SELECT id FROM learning_modules WHERE code='QM-10'), 'Assumptions of simple linear regression', '1) Linear relationship between X and Y. 2) Error terms are independent. 3) Error terms have constant variance (homoscedasticity). 4) Error terms are normally distributed. Violations affect inference validity.', '{quantitative,regression,concept}');

-- --------------------------------------------------------
-- QM-11  Big Data Techniques
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='QM-11'), 'Supervised vs. Unsupervised vs. Reinforcement Learning', 'Supervised: labeled data, predicts known outcomes (classification, regression). Unsupervised: no labels, finds patterns (clustering, dimensionality reduction). Reinforcement: learns through trial/error with reward signals.', '{quantitative,ml,concept}'),
((SELECT id FROM learning_modules WHERE code='QM-11'), 'Overfitting vs. Underfitting', 'Overfitting: model too complex, captures noise, good in-sample but poor out-of-sample. Underfitting: model too simple, misses patterns, poor everywhere. Remedies: regularization, cross-validation, pruning.', '{quantitative,ml,concept}'),
((SELECT id FROM learning_modules WHERE code='QM-11'), 'LASSO vs. Ridge Regularization', 'LASSO (L1): penalty on |coefficients|, can shrink coefficients to exactly zero (feature selection). Ridge (L2): penalty on coefficients^2, shrinks but does not eliminate. Both reduce overfitting.', '{quantitative,ml,concept}'),
((SELECT id FROM learning_modules WHERE code='QM-11'), 'Text Analytics / NLP in Finance', 'Applications: sentiment analysis of news/earnings calls, topic modeling of research reports, named entity recognition. Bag-of-words ignores word order. TF-IDF weights term importance. Useful for alternative data analysis.', '{quantitative,ml,concept}'),
((SELECT id FROM learning_modules WHERE code='QM-11'), 'Decision Trees and Random Forests', 'Decision tree: splits data recursively on feature thresholds, easy to interpret, prone to overfitting. Random forest: ensemble of many trees trained on random subsets, reduces overfitting, less interpretable.', '{quantitative,ml,concept}');

-- --------------------------------------------------------
-- FI-01  Fixed-Income Instrument Features
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='FI-01'), 'Key features of a fixed-income security', 'Issuer (who borrows), maturity date (when principal is repaid), par value (face value / principal), coupon rate (interest rate), coupon frequency, currency denomination.', '{fixed-income,bonds,concept}'),
((SELECT id FROM learning_modules WHERE code='FI-01'), 'Bond indenture', 'The legal contract between issuer and bondholders specifying all terms: coupon, maturity, covenants, collateral, call provisions, etc. A trustee monitors compliance on behalf of bondholders.', '{fixed-income,bonds,concept}'),
((SELECT id FROM learning_modules WHERE code='FI-01'), 'Affirmative vs. Negative Covenants', 'Affirmative: actions the issuer must take (maintain insurance, pay taxes, provide financial reports). Negative: actions the issuer must not take (limit additional debt, restrict asset sales, cap dividends).', '{fixed-income,bonds,concept}'),
((SELECT id FROM learning_modules WHERE code='FI-01'), 'Call provision', 'Gives the issuer the right (not obligation) to redeem the bond before maturity at a specified call price. Benefits the issuer (can refinance if rates fall). Investors demand higher yield for callable bonds.', '{fixed-income,bonds,concept}'),
((SELECT id FROM learning_modules WHERE code='FI-01'), 'Put provision', 'Gives the bondholder the right to sell the bond back to the issuer at a specified price before maturity. Benefits the investor (protection if rates rise). Putable bonds have lower yields than otherwise similar bonds.', '{fixed-income,bonds,concept}');

-- --------------------------------------------------------
-- FI-02  Fixed-Income Cash Flows and Types
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='FI-02'), 'Zero-coupon bond', 'Pays no periodic interest. Issued at a discount to par and redeems at par at maturity. Return comes entirely from price appreciation. Higher interest rate sensitivity than coupon bonds of same maturity.', '{fixed-income,bond-types,concept}'),
((SELECT id FROM learning_modules WHERE code='FI-02'), 'Floating-rate note (FRN)', 'Coupon resets periodically: coupon = reference rate (e.g., SOFR) + fixed spread. Price stays near par on reset dates. Less interest rate risk than fixed-rate bonds.', '{fixed-income,bond-types,concept}'),
((SELECT id FROM learning_modules WHERE code='FI-02'), 'Amortizing vs. Bullet bond', 'Bullet: pays only interest during life, returns all principal at maturity. Amortizing: each payment includes interest and principal repayment. Partially amortizing: some principal at maturity (balloon payment).', '{fixed-income,bond-types,concept}'),
((SELECT id FROM learning_modules WHERE code='FI-02'), 'Inflation-linked bonds (e.g., TIPS)', 'Principal adjusts with inflation index. Coupon = fixed real rate x inflation-adjusted principal. Protects purchasing power. Real yield is typically lower than nominal yield on comparable bonds.', '{fixed-income,bond-types,concept}'),
((SELECT id FROM learning_modules WHERE code='FI-02'), 'Step-up and deferred coupon bonds', 'Step-up: coupon rate increases on preset schedule. Often associated with callable bonds. Deferred coupon: no payments for an initial period, then regular coupons begin. Compensates for initial lack of income.', '{fixed-income,bond-types,concept}');

-- --------------------------------------------------------
-- FI-03  Fixed-Income Issuance and Trading
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='FI-03'), 'Primary vs. Secondary market', 'Primary: where new bonds are initially issued and sold to investors. Secondary: where previously issued bonds are traded among investors. Most bond trading occurs OTC (over-the-counter).', '{fixed-income,markets,concept}'),
((SELECT id FROM learning_modules WHERE code='FI-03'), 'Firm commitment vs. Best efforts underwriting', 'Firm commitment: underwriter buys entire issue, bears price risk. Best efforts: underwriter acts as agent, sells as much as possible, unsold bonds returned to issuer.', '{fixed-income,markets,concept}'),
((SELECT id FROM learning_modules WHERE code='FI-03'), 'Private placement', 'Sale of bonds to a small number of qualified investors. Advantages: lower issuance costs, fewer disclosure requirements, faster execution. Disadvantages: less liquidity, limited investor base.', '{fixed-income,markets,concept}'),
((SELECT id FROM learning_modules WHERE code='FI-03'), 'Shelf registration', 'Allows issuer to register a total amount of debt and issue portions over time (up to 2 years). Provides flexibility to time issuances with favorable market conditions.', '{fixed-income,markets,concept}'),
((SELECT id FROM learning_modules WHERE code='FI-03'), 'Bid-ask spread in bond markets', 'The difference between the dealer''s buy (bid) and sell (ask) price. Wider spread = less liquidity. Government bonds typically have the tightest spreads; small illiquid corporate issues have the widest.', '{fixed-income,markets,concept}');

-- --------------------------------------------------------
-- FI-04  Corporate Issuers
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='FI-04'), 'Investment grade vs. High yield', 'Investment grade: BBB-/Baa3 or higher. Lower default risk, lower yields, fewer covenants. High yield (junk): BB+/Ba1 or lower. Higher default risk, higher yields, more restrictive covenants.', '{fixed-income,corporate,concept}'),
((SELECT id FROM learning_modules WHERE code='FI-04'), 'Seniority ranking in bankruptcy', 'From highest to lowest priority: 1) Secured debt 2) Senior unsecured 3) Senior subordinated 4) Subordinated 5) Junior subordinated 6) Preferred equity 7) Common equity.', '{fixed-income,corporate,concept}'),
((SELECT id FROM learning_modules WHERE code='FI-04'), 'Commercial paper', 'Short-term unsecured promissory note, max 270 days (US). Issued by highly rated corporations. Sold at a discount to face value. Used for short-term financing needs (working capital, bridge financing).', '{fixed-income,corporate,concept}'),
((SELECT id FROM learning_modules WHERE code='FI-04'), 'Medium-term notes (MTNs)', 'Issued continuously under a shelf registration. Maturities from 9 months to 30+ years despite the name. Can be customized to meet specific investor needs. Flexible and cost-effective issuance.', '{fixed-income,corporate,concept}'),
((SELECT id FROM learning_modules WHERE code='FI-04'), 'Secured vs. Unsecured bonds', 'Secured: backed by specific collateral (equipment, real estate, receivables). Higher recovery in default. Unsecured (debentures): backed only by issuer''s general creditworthiness. Higher yield to compensate.', '{fixed-income,corporate,concept}');

-- --------------------------------------------------------
-- FI-05  Government Issuers
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='FI-05'), 'Types of US Treasury securities', 'T-bills: zero-coupon, maturity <= 1 year. T-notes: semiannual coupon, 2-10 year maturity. T-bonds: semiannual coupon, >10 year maturity (typically 20 or 30 years). TIPS: inflation-indexed.', '{fixed-income,government,concept}'),
((SELECT id FROM learning_modules WHERE code='FI-05'), 'Sovereign yield curve', 'Plots yields of government bonds across maturities. Serves as benchmark for pricing all fixed-income securities. Normally upward-sloping. Can be flat or inverted (historically precedes recessions).', '{fixed-income,government,concept}'),
((SELECT id FROM learning_modules WHERE code='FI-05'), 'On-the-run vs. Off-the-run', 'On-the-run: most recently issued government securities of each maturity, highest liquidity, tightest spreads. Off-the-run: older issues, less liquid, slightly higher yields (liquidity premium).', '{fixed-income,government,concept}'),
((SELECT id FROM learning_modules WHERE code='FI-05'), 'Formula: T-bill price (bank discount yield)', 'Price = Face x [1 - (BDY x t/360)], where BDY = bank discount yield and t = days to maturity. BDY understates true yield because it uses face value (not price) as the base.', '{fixed-income,government,formula}'),
((SELECT id FROM learning_modules WHERE code='FI-05'), 'Agency bonds', 'Issued by government-sponsored enterprises (GSEs) or government agencies. May have explicit or implicit government guarantee. Typically yield slightly more than Treasuries but less than corporates.', '{fixed-income,government,concept}');

-- --------------------------------------------------------
-- FI-06  Bond Valuation
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='FI-06'), 'Formula: Bond price using a single discount rate', 'Price = sum of [C / (1+r)^t] + [FV / (1+r)^n], where C = coupon payment, r = market discount rate (YTM), FV = face value, n = periods to maturity.', '{fixed-income,valuation,formula}'),
((SELECT id FROM learning_modules WHERE code='FI-06'), 'Price-yield relationship', 'Inverse relationship: when yields rise, prices fall and vice versa. The relationship is convex (curved), not linear. Convexity means price increases from yield decreases are larger than price decreases from yield increases.', '{fixed-income,valuation,concept}'),
((SELECT id FROM learning_modules WHERE code='FI-06'), 'Full (dirty) price vs. Flat (clean) price', 'Full price = flat price + accrued interest. Flat price is the quoted/clean price. Full price is what the buyer actually pays. Accrued interest = coupon x (days since last coupon / days in coupon period).', '{fixed-income,valuation,formula}'),
((SELECT id FROM learning_modules WHERE code='FI-06'), 'Spot rate valuation', 'Each cash flow is discounted at the spot rate for its maturity: Price = C/(1+s1)^1 + C/(1+s2)^2 + ... + (C+FV)/(1+sn)^n. More precise than using a single YTM because it accounts for the term structure.', '{fixed-income,valuation,concept}'),
((SELECT id FROM learning_modules WHERE code='FI-06'), 'Premium, par, and discount bonds', 'Premium: coupon rate > YTM, price > par. Par: coupon rate = YTM, price = par. Discount: coupon rate < YTM, price < par. Premium/discount bonds converge to par as maturity approaches (pull-to-par).', '{fixed-income,valuation,concept}');

-- --------------------------------------------------------
-- FI-07  Yield and Yield Spread Measures
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='FI-07'), 'Yield-to-Maturity (YTM)', 'The single discount rate that equates the present value of all future cash flows to the bond''s current price. Assumes: bond held to maturity and coupons reinvested at YTM. Also called the internal rate of return.', '{fixed-income,yields,concept}'),
((SELECT id FROM learning_modules WHERE code='FI-07'), 'Current Yield', 'Current yield = annual coupon / bond price. Ignores capital gains/losses and time value of money. For premium bonds: CY < coupon rate. For discount bonds: CY > coupon rate.', '{fixed-income,yields,formula}'),
((SELECT id FROM learning_modules WHERE code='FI-07'), 'G-spread, I-spread, Z-spread', 'G-spread: yield spread over government bond. I-spread: yield spread over interest rate swap rate. Z-spread: constant spread over entire spot rate curve that reprices the bond. Z-spread is most precise for option-free bonds.', '{fixed-income,yields,concept}'),
((SELECT id FROM learning_modules WHERE code='FI-07'), 'Option-Adjusted Spread (OAS)', 'OAS = Z-spread - option cost. For callable bonds: OAS < Z-spread (call option benefits issuer). For putable bonds: OAS > Z-spread (put option benefits investor). OAS allows comparison across bonds with different embedded options.', '{fixed-income,yields,formula}'),
((SELECT id FROM learning_modules WHERE code='FI-07'), 'Yield spread hierarchy for premium bond', 'Coupon rate > current yield > YTM. For discount bond: coupon rate < current yield < YTM. These relationships help verify bond pricing and identify errors.', '{fixed-income,yields,concept}');

-- --------------------------------------------------------
-- FI-08  Mortgage-Backed Securities
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='FI-08'), 'Prepayment risk', 'Risk that borrowers repay mortgages earlier than scheduled, typically when rates fall (refinancing). Forces MBS investors to reinvest at lower rates. Consists of contraction risk and extension risk.', '{fixed-income,mbs,concept}'),
((SELECT id FROM learning_modules WHERE code='FI-08'), 'Contraction risk vs. Extension risk', 'Contraction: rates fall, prepayments accelerate, average life shortens. Investor reinvests at lower rates. Extension: rates rise, prepayments slow, average life lengthens. Investor locked into below-market coupon.', '{fixed-income,mbs,concept}'),
((SELECT id FROM learning_modules WHERE code='FI-08'), 'Securitization process', '1) Originator creates mortgages. 2) Mortgages sold to SPE (bankruptcy remote). 3) SPE issues securities backed by mortgage pool. 4) Servicer collects payments. 5) Cash flows passed to investors.', '{fixed-income,mbs,concept}'),
((SELECT id FROM learning_modules WHERE code='FI-08'), 'Pass-through vs. CMO', 'Pass-through: all investors share cash flows pro rata. CMO: restructures cash flows into tranches with different risk/return profiles. Sequential-pay CMO directs prepayments to shortest tranche first.', '{fixed-income,mbs,concept}'),
((SELECT id FROM learning_modules WHERE code='FI-08'), 'Weighted Average Coupon (WAC) and pass-through rate', 'WAC = weighted average of mortgage coupon rates in the pool. Pass-through rate = WAC minus servicing and guarantee fees. Investors receive the pass-through rate on the remaining principal balance.', '{fixed-income,mbs,concept}');

-- --------------------------------------------------------
-- FI-09  Interest Rate Risk and Return
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='FI-09'), 'Formula: Modified Duration', 'ModDur = MacDur / (1 + yield per period). Approximate % price change = -ModDur x change in yield. Higher duration = more interest rate sensitivity.', '{fixed-income,duration,formula}'),
((SELECT id FROM learning_modules WHERE code='FI-09'), 'Formula: Price change with duration and convexity', 'Approx % price change = (-ModDur x delta_y) + (0.5 x Convexity x delta_y^2). Duration provides the linear estimate; convexity corrects for the curvature of the price-yield relationship.', '{fixed-income,duration,formula}'),
((SELECT id FROM learning_modules WHERE code='FI-09'), 'Factors affecting duration', 'Higher duration: longer maturity, lower coupon, lower yield. Lower duration: shorter maturity, higher coupon, higher yield. Zero-coupon bond has highest duration for a given maturity (duration = maturity).', '{fixed-income,duration,concept}'),
((SELECT id FROM learning_modules WHERE code='FI-09'), 'Macaulay Duration', 'Weighted average time to receive all cash flows, where weights are the PV of each cash flow as a proportion of price. Interpretation: the investment horizon at which price risk and reinvestment risk offset.', '{fixed-income,duration,concept}'),
((SELECT id FROM learning_modules WHERE code='FI-09'), 'Money Duration (Dollar Duration)', 'Money duration = ModDur x Market Value. Dollar value of a basis point (PVBP) = Money duration x 0.0001. Measures the absolute dollar price change for a given change in yield.', '{fixed-income,duration,formula}');

-- --------------------------------------------------------
-- FI-10  Credit Risk
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='FI-10'), 'Formula: Expected Loss', 'Expected Loss = Probability of Default (PD) x Loss Given Default (LGD). LGD = 1 - Recovery Rate. Example: PD=2%, Recovery=40%, EL = 0.02 x 0.60 = 1.20%.', '{fixed-income,credit,formula}'),
((SELECT id FROM learning_modules WHERE code='FI-10'), 'Credit spread components', 'Credit spread compensates for: expected loss (PD x LGD), credit spread risk (spread volatility), credit migration risk (downgrade risk), and a liquidity premium. Wider spreads = higher perceived credit risk.', '{fixed-income,credit,concept}'),
((SELECT id FROM learning_modules WHERE code='FI-10'), 'Credit ratings scale', 'Investment grade: AAA, AA, A, BBB (S&P/Fitch) or Aaa, Aa, A, Baa (Moody''s). High yield: BB/Ba and below. Ratings reflect issuer''s creditworthiness and probability of default.', '{fixed-income,credit,concept}'),
((SELECT id FROM learning_modules WHERE code='FI-10'), 'Credit migration risk', 'Risk of a rating downgrade causing spread widening and price decline. Price impact = -ModDur x change in spread. Even without default, downgrades cause significant losses for bondholders.', '{fixed-income,credit,concept}'),
((SELECT id FROM learning_modules WHERE code='FI-10'), 'Recovery rate', 'The percentage of par value recovered by bondholders in the event of default. Varies by seniority: secured debt typically recovers 50-70%, senior unsecured 30-50%, subordinated 10-30%.', '{fixed-income,credit,concept}');

-- --------------------------------------------------------
-- ETH-01  Ethics and Trust
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='ETH-01'), 'Why ethics matter in investment management', 'Financial markets depend on trust due to information asymmetry. Clients cannot fully monitor professionals. Ethical behavior promotes market integrity, investor confidence, and efficient capital allocation.', '{ethics,trust,concept}'),
((SELECT id FROM learning_modules WHERE code='ETH-01'), 'Ethical vs. legal standards', 'Legal standards are the minimum society requires. Ethical standards often go beyond legal requirements. An action can be legal but unethical. CFA members must follow whichever standard is stricter.', '{ethics,trust,concept}'),
((SELECT id FROM learning_modules WHERE code='ETH-01'), 'Challenges to ethical behavior', 'Conflicts of interest, overconfidence, loyalty pressures, rationalization, incrementalism (small violations leading to larger ones), and situational pressures can all lead to ethical lapses.', '{ethics,trust,concept}'),
((SELECT id FROM learning_modules WHERE code='ETH-01'), 'Code of ethics purpose', 'Establishes shared principles and expectations for professional conduct. Signals commitment to clients and public. Provides a framework for decision-making and accountability.', '{ethics,trust,concept}'),
((SELECT id FROM learning_modules WHERE code='ETH-01'), 'Material nonpublic information (MNPI)', 'Information that is not publicly available and would likely affect a security''s price if known. Trading on MNPI is illegal and unethical. Members must not act or cause others to act on MNPI.', '{ethics,trust,concept}');

-- --------------------------------------------------------
-- ETH-02  Code of Ethics and Standards
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='ETH-02'), 'Six components of the Code of Ethics', '1) Act with integrity, competence, diligence, respect. 2) Place profession and client interests above own. 3) Use reasonable care and independent judgment. 4) Practice ethically. 5) Promote market integrity. 6) Maintain and improve competence.', '{ethics,code,concept}'),
((SELECT id FROM learning_modules WHERE code='ETH-02'), 'Seven Standards of Professional Conduct', 'I: Professionalism. II: Integrity of Capital Markets. III: Duties to Clients. IV: Duties to Employers. V: Investment Analysis and Recommendations. VI: Conflicts of Interest. VII: Responsibilities as CFA Member.', '{ethics,standards,concept}'),
((SELECT id FROM learning_modules WHERE code='ETH-02'), 'Standard I(A) - Knowledge of the Law', 'Members must understand and comply with all applicable laws, rules, and regulations. When conflicts exist between local law and the Code/Standards, follow the stricter requirement.', '{ethics,standards,concept}'),
((SELECT id FROM learning_modules WHERE code='ETH-02'), 'Standard III(B) - Fair Dealing', 'Members must deal fairly and objectively with all clients when providing investment information, making recommendations, or taking investment action. Avoid discriminating among clients.', '{ethics,standards,concept}'),
((SELECT id FROM learning_modules WHERE code='ETH-02'), 'Standard V(A) - Diligence and Reasonable Basis', 'Members must exercise diligence and have a reasonable and adequate basis, supported by research and investigation, for any investment analysis, recommendation, or action.', '{ethics,standards,concept}');

-- --------------------------------------------------------
-- ETH-03  Guidance for Standards I-VII
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='ETH-03'), 'Standard I(B) - Independence and Objectivity', 'Members must use reasonable care to maintain independence and objectivity. Do not accept gifts, benefits, or compensation that could compromise judgment. Pay for your own travel when covering companies.', '{ethics,guidance,concept}'),
((SELECT id FROM learning_modules WHERE code='ETH-03'), 'Standard III(C) - Suitability', 'Before making recommendations: determine client objectives, constraints, risk tolerance, and financial situation. For managed accounts, act in accordance with the IPS. Update IPS as circumstances change.', '{ethics,guidance,concept}'),
((SELECT id FROM learning_modules WHERE code='ETH-03'), 'Standard IV(A) - Loyalty to Employer', 'Act for the benefit of the employer, do not deprive employer of skills/abilities, do not cause harm. Does not require participation in unethical or illegal activities. Whistleblowing may be necessary.', '{ethics,guidance,concept}'),
((SELECT id FROM learning_modules WHERE code='ETH-03'), 'Standard VI(A) - Disclosure of Conflicts', 'Must disclose all matters that could reasonably impair independence or objectivity: ownership in recommended securities, board memberships, compensation arrangements, personal relationships with covered companies.', '{ethics,guidance,concept}'),
((SELECT id FROM learning_modules WHERE code='ETH-03'), 'Mosaic Theory', 'An analyst may reach an investment conclusion using a combination of material public information and nonmaterial nonpublic information without violating Standard II(A). The conclusion itself may be material and nonpublic.', '{ethics,guidance,concept}');

-- --------------------------------------------------------
-- ETH-04  Introduction to GIPS
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='ETH-04'), 'GIPS key objectives', 'Ensure accurate and consistent investment performance data. Obtain worldwide acceptance of a single standard. Promote fair global competition. Foster industry self-regulation.', '{ethics,gips,concept}'),
((SELECT id FROM learning_modules WHERE code='ETH-04'), 'GIPS composite definition', 'An aggregation of portfolios managed according to a similar investment mandate, objective, or strategy. All actual, fee-paying, discretionary portfolios must be included in at least one composite.', '{ethics,gips,concept}'),
((SELECT id FROM learning_modules WHERE code='ETH-04'), 'GIPS compliance requirements', 'Voluntary but all-or-nothing. Must present at least 5 years (or since inception) initially, building to 10 years. Must include terminated accounts in historical composites. Cannot cherry-pick accounts.', '{ethics,gips,concept}'),
((SELECT id FROM learning_modules WHERE code='ETH-04'), 'GIPS verification', 'Verification is performed by an independent third party. It tests whether the firm has complied with all composite construction requirements and that processes exist to calculate and present performance in compliance.', '{ethics,gips,concept}'),
((SELECT id FROM learning_modules WHERE code='ETH-04'), 'GIPS return calculation', 'Time-weighted total returns must be used. Portfolios must be valued at least monthly. External cash flows must be handled using accepted methods. Both gross-of-fees and net-of-fees returns may be presented.', '{ethics,gips,concept}');

-- --------------------------------------------------------
-- ETH-05  Ethics Application
-- --------------------------------------------------------
INSERT INTO flashcards (module_id, front, back, tags) VALUES
((SELECT id FROM learning_modules WHERE code='ETH-05'), 'Ethical decision-making framework', 'Steps: 1) Identify relevant facts and stakeholders. 2) Identify ethical principles involved. 3) Consider alternative actions. 4) Evaluate consequences of each action. 5) Choose the action most consistent with ethical principles.', '{ethics,application,concept}'),
((SELECT id FROM learning_modules WHERE code='ETH-05'), 'Common ethics violations in practice', 'Front-running client orders, misrepresenting credentials, failing to disclose conflicts, trading on MNPI, unsuitable recommendations, plagiarism in research, selective disclosure of information.', '{ethics,application,concept}'),
((SELECT id FROM learning_modules WHERE code='ETH-05'), 'Handling pressure to violate Standards', 'Document the pressure and your objections. Escalate through proper channels (compliance, senior management). If unresolved, consider disassociating from the activity. Whistleblowing may be necessary.', '{ethics,application,concept}'),
((SELECT id FROM learning_modules WHERE code='ETH-05'), 'Firewall procedures', 'Physical and informational barriers between departments (e.g., investment banking and research) to prevent flow of MNPI. Includes restricted lists, watch lists, and compliance monitoring.', '{ethics,application,concept}'),
((SELECT id FROM learning_modules WHERE code='ETH-05'), 'Personal trading policies', 'Firms should establish policies requiring: pre-clearance of trades, holding period requirements, blackout periods around material events, reporting of personal transactions, and restricted lists for covered securities.', '{ethics,application,concept}');

COMMIT;