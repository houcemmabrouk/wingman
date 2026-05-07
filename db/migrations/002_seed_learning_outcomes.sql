-- Minimal LOS seed for flagship LMs so End-of-Session RAG section is usable.
-- Full LOS coverage can be added later via a proper curriculum import.
-- Uses ON CONFLICT DO NOTHING — re-running is safe.

INSERT INTO learning_outcomes (module_id, code, description, bloom_level, sort_order) VALUES
  -- ETH-01 Ethics and Trust in the Investment Profession
  ((SELECT id FROM learning_modules WHERE code='ETH-01'), 'ETH-01-a', 'Explain ethics', 2, 1),
  ((SELECT id FROM learning_modules WHERE code='ETH-01'), 'ETH-01-b', 'Describe the role of a code of ethics in defining a profession', 2, 2),
  ((SELECT id FROM learning_modules WHERE code='ETH-01'), 'ETH-01-c', 'Identify challenges to ethical behavior', 3, 3),
  ((SELECT id FROM learning_modules WHERE code='ETH-01'), 'ETH-01-d', 'Compare ethical and legal standards', 4, 4),
  ((SELECT id FROM learning_modules WHERE code='ETH-01'), 'ETH-01-e', 'Describe a framework for ethical decision-making', 2, 5),

  -- ETH-02 Code of Ethics and Standards of Professional Conduct
  ((SELECT id FROM learning_modules WHERE code='ETH-02'), 'ETH-02-a', 'Describe the structure of the CFA Institute Professional Conduct Program', 2, 1),
  ((SELECT id FROM learning_modules WHERE code='ETH-02'), 'ETH-02-b', 'Identify the six components of the Code of Ethics', 3, 2),
  ((SELECT id FROM learning_modules WHERE code='ETH-02'), 'ETH-02-c', 'Identify the seven Standards of Professional Conduct', 3, 3),
  ((SELECT id FROM learning_modules WHERE code='ETH-02'), 'ETH-02-d', 'Explain the ethical responsibilities required by the Code and Standards', 2, 4),

  -- QM-01 Rates and Returns
  ((SELECT id FROM learning_modules WHERE code='QM-01'), 'QM-01-a', 'Interpret interest rates as required rates of return, discount rates, or opportunity costs', 4, 1),
  ((SELECT id FROM learning_modules WHERE code='QM-01'), 'QM-01-b', 'Explain an interest rate as the sum of a real risk-free rate and premiums', 2, 2),
  ((SELECT id FROM learning_modules WHERE code='QM-01'), 'QM-01-c', 'Calculate and interpret different approaches to return measurement', 3, 3),
  ((SELECT id FROM learning_modules WHERE code='QM-01'), 'QM-01-d', 'Compare the money-weighted and time-weighted rates of return', 4, 4),
  ((SELECT id FROM learning_modules WHERE code='QM-01'), 'QM-01-e', 'Calculate and interpret annualized return measures', 3, 5),

  -- QM-02 Time Value of Money
  ((SELECT id FROM learning_modules WHERE code='QM-02'), 'QM-02-a', 'Calculate the solution for time value of money problems with different frequencies of compounding', 3, 1),
  ((SELECT id FROM learning_modules WHERE code='QM-02'), 'QM-02-b', 'Calculate the PV and FV of a series of cash flows', 3, 2),
  ((SELECT id FROM learning_modules WHERE code='QM-02'), 'QM-02-c', 'Demonstrate the use of a time line in modeling and solving TVM problems', 3, 3),

  -- FI-01 Fixed-Income Instrument Features
  ((SELECT id FROM learning_modules WHERE code='FI-01'), 'FI-01-a', 'Describe the features of a fixed-income security', 2, 1),
  ((SELECT id FROM learning_modules WHERE code='FI-01'), 'FI-01-b', 'Describe the contents of a bond indenture and the effects of bond covenants', 2, 2),
  ((SELECT id FROM learning_modules WHERE code='FI-01'), 'FI-01-c', 'Compare affirmative and negative covenants', 4, 3),

  -- FI-02 Fixed-Income Cash Flows and Types
  ((SELECT id FROM learning_modules WHERE code='FI-02'), 'FI-02-a', 'Describe common cash flow structures of fixed-income instruments', 2, 1),
  ((SELECT id FROM learning_modules WHERE code='FI-02'), 'FI-02-b', 'Describe common coupon payment structures', 2, 2),
  ((SELECT id FROM learning_modules WHERE code='FI-02'), 'FI-02-c', 'Describe contingency provisions affecting bond cash flows', 2, 3)
ON CONFLICT (code) DO NOTHING;
