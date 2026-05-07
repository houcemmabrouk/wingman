#!/usr/bin/env python3
"""
CFA Level I Question Bank Generator
Generates 100 QBANK + 100 MOCK questions per learning module.
Outputs SQL INSERT statements for the questions table.
"""
import random
import json
import textwrap

random.seed(42)

# ── Module definitions with question templates ─────────────────
# Each module has a list of question generators.
# We cycle through them to produce 100 qbank + 100 mock questions.

def esc(s: str) -> str:
    """Escape single quotes for SQL."""
    return s.replace("'", "''")


# ──────────────────────────────────────────────────────────────
# QM - Quantitative Methods
# ──────────────────────────────────────────────────────────────

QM01_QUESTIONS = []  # Rates and Returns

def _qm01():
    qs = []
    # HPR questions
    prices = [(50,55,2),(100,108,3),(25,27,1),(80,88,4),(200,215,5),(30,33,1.5),(60,66,3),(45,48,2),(150,162,6),(75,82,3)]
    for p0,p1,div in prices:
        hpr = ((p1 - p0 + div) / p0) * 100
        wrong1 = ((p1 - p0) / p0) * 100
        wrong2 = (div / p0) * 100
        qs.append({
            "stem": f"An investor buys a stock at ${p0}, receives a dividend of ${div}, and sells at ${p1}. The holding period return is closest to:",
            "a": f"{hpr:.2f}%", "b": f"{wrong1:.2f}%", "c": f"{wrong2:.2f}%",
            "correct": "A",
            "explanation": f"HPR = (P1 - P0 + D) / P0 = ({p1} - {p0} + {div}) / {p0} = {hpr:.2f}%",
            "difficulty": 2
        })
    # Annualized return
    for months, hpr_val in [(6, 8), (3, 3), (18, 15), (9, 10), (12, 12), (24, 20), (4, 5), (8, 7), (15, 14), (2, 2)]:
        ann = ((1 + hpr_val/100) ** (12/months) - 1) * 100
        wrong1 = hpr_val * (12/months)
        wrong2 = hpr_val / (months/12)
        qs.append({
            "stem": f"An investment earns {hpr_val}% over {months} months. The effective annualized return is closest to:",
            "a": f"{ann:.2f}%", "b": f"{wrong1:.2f}%", "c": f"{wrong2:.2f}%",
            "correct": "A",
            "explanation": f"EAR = (1 + {hpr_val/100})^(12/{months}) - 1 = {ann:.2f}%",
            "difficulty": 3
        })
    # Continuously compounded
    import math
    for r in [5, 8, 10, 12, 3, 6, 15, 7, 9, 4]:
        cc = math.log(1 + r/100) * 100
        w1 = r * 0.95
        w2 = r * 1.05
        qs.append({
            "stem": f"If the holding period return is {r}%, the equivalent continuously compounded return is closest to:",
            "a": f"{cc:.2f}%", "b": f"{w1:.2f}%", "c": f"{w2:.2f}%",
            "correct": "A",
            "explanation": f"Continuously compounded return = ln(1 + {r/100}) = {cc:.2f}%",
            "difficulty": 3
        })
    # Nominal vs real
    for nom, inf in [(8,3),(10,4),(6,2),(12,5),(5,1),(15,6),(7,3),(9,4),(11,5),(4,2)]:
        real_r = ((1+nom/100)/(1+inf/100) - 1) * 100
        w1 = nom - inf
        w2 = nom / (1 + inf/100)
        qs.append({
            "stem": f"An investment earns a nominal return of {nom}% when inflation is {inf}%. The real return is closest to:",
            "a": f"{real_r:.2f}%", "b": f"{w1:.1f}%", "c": f"{w2:.2f}%",
            "correct": "A",
            "explanation": f"Real return = (1+{nom/100})/(1+{inf/100}) - 1 = {real_r:.2f}%",
            "difficulty": 2
        })
    # Geometric vs arithmetic mean
    for r1, r2, r3 in [(10,-5,8),(20,-10,15),(5,3,-2),(12,-8,6),(15,-3,10),(8,4,-6),(25,-15,12),(7,-2,5),(18,-12,9),(3,6,-4)]:
        am = (r1+r2+r3)/3
        gm = ((1+r1/100)*(1+r2/100)*(1+r3/100))**(1/3) - 1
        gm *= 100
        qs.append({
            "stem": f"An investment has returns of {r1}%, {r2}%, and {r3}% over three years. The geometric mean return is closest to:",
            "a": f"{gm:.2f}%", "b": f"{am:.2f}%", "c": f"{(gm+am)/2:.2f}%",
            "correct": "A",
            "explanation": f"Geometric mean = [(1+{r1/100})*(1+{r2/100})*(1+{r3/100})]^(1/3) - 1 = {gm:.2f}%",
            "difficulty": 3
        })
    # Money-weighted return concept
    concepts = [
        ("Which return measure is most appropriate for evaluating the performance of a fund manager?",
         "Time-weighted return", "Money-weighted return", "Arithmetic mean return", "A",
         "Time-weighted return removes the effect of cash flow timing, making it appropriate for evaluating manager performance.", 2),
        ("The money-weighted rate of return is equivalent to:",
         "The internal rate of return on the investment", "The geometric mean of periodic returns", "The arithmetic mean of periodic returns", "A",
         "The money-weighted return is the IRR that equates the present value of cash inflows with outflows.", 2),
        ("Which return measure gives greater weight to periods with larger amounts invested?",
         "Money-weighted return", "Time-weighted return", "Geometric mean return", "A",
         "Money-weighted return is affected by the timing and amount of cash flows.", 2),
        ("Gross return differs from net return by the amount of:",
         "Management and administrative fees", "Taxes only", "Inflation adjustment", "A",
         "Net return = Gross return minus management fees, administrative costs, and other expenses.", 1),
        ("A bank quotes a rate of 6% compounded monthly. The effective annual rate is closest to:",
         "6.17%", "6.00%", "6.50%", "A",
         "EAR = (1 + 0.06/12)^12 - 1 = 6.17%", 2),
        ("Which measure of return best reflects the compound rate of growth of an investment over time?",
         "Geometric mean return", "Arithmetic mean return", "Harmonic mean return", "A",
         "The geometric mean captures the compound growth effect over multiple periods.", 2),
        ("The discount rate that makes the net present value of all cash flows equal to zero is the:",
         "Money-weighted rate of return", "Time-weighted rate of return", "Risk-free rate", "A",
         "By definition, the money-weighted return (IRR) sets NPV of all cash flows to zero.", 2),
        ("A quoted annual rate of 8% with quarterly compounding gives an effective annual rate closest to:",
         "8.24%", "8.00%", "8.16%", "A",
         "EAR = (1 + 0.08/4)^4 - 1 = 8.24%", 2),
        ("When comparing mutual fund managers, which return metric is most appropriate?",
         "Time-weighted return", "Dollar-weighted return", "Holding period return", "A",
         "Time-weighted return neutralizes the impact of external cash flows that the manager cannot control.", 2),
        ("A leveraged return is calculated by:",
         "Adjusting the return for the proportion of borrowed funds", "Dividing the return by the leverage ratio", "Multiplying gross return by the debt-to-equity ratio", "A",
         "Leveraged return accounts for the amplification effect of using borrowed capital.", 3),
    ]
    for stem, a, b, c, correct, expl, diff in concepts:
        qs.append({"stem": stem, "a": a, "b": b, "c": c, "correct": correct, "explanation": expl, "difficulty": diff})
    return qs

QM01_QUESTIONS = _qm01()

def _qm02():
    """Time Value of Money"""
    import math
    qs = []
    # FV calculations
    for pv, r, n in [(1000,5,10),(5000,8,5),(2000,6,3),(10000,4,20),(500,10,7),(3000,7,12),(1500,3,8),(8000,9,4),(250,12,6),(4000,5,15)]:
        fv = pv * (1 + r/100)**n
        w1 = pv * (1 + r*n/100)
        w2 = pv * (1 + r/100) * n
        qs.append({
            "stem": f"The future value of ${pv:,} invested at {r}% compounded annually for {n} years is closest to:",
            "a": f"${fv:,.2f}", "b": f"${w1:,.2f}", "c": f"${w2:,.2f}",
            "correct": "A",
            "explanation": f"FV = PV × (1+r)^n = {pv} × (1+{r/100})^{n} = ${fv:,.2f}",
            "difficulty": 2
        })
    # PV calculations
    for fv, r, n in [(10000,6,5),(5000,8,10),(20000,4,15),(1000,10,3),(50000,7,20),(3000,5,8),(15000,9,6),(8000,3,12),(25000,6,10),(7000,11,4)]:
        pv = fv / (1 + r/100)**n
        w1 = fv / (1 + r*n/100)
        w2 = fv - (fv * r/100 * n)
        qs.append({
            "stem": f"The present value of ${fv:,} to be received in {n} years at a discount rate of {r}% is closest to:",
            "a": f"${pv:,.2f}", "b": f"${w1:,.2f}", "c": f"${max(0,w2):,.2f}",
            "correct": "A",
            "explanation": f"PV = FV / (1+r)^n = {fv} / (1+{r/100})^{n} = ${pv:,.2f}",
            "difficulty": 2
        })
    # Annuity PV
    for pmt, r, n in [(1000,5,10),(500,8,20),(2000,6,5),(300,4,30),(1500,7,15),(800,3,25),(5000,10,8),(250,9,12),(3000,5,7),(1200,6,10)]:
        pvaf = pmt * ((1 - (1+r/100)**(-n)) / (r/100))
        w1 = pmt * n
        w2 = pmt * n / (1 + r/100)
        qs.append({
            "stem": f"An ordinary annuity pays ${pmt:,} per year for {n} years. At a discount rate of {r}%, the present value is closest to:",
            "a": f"${pvaf:,.2f}", "b": f"${w1:,.2f}", "c": f"${w2:,.2f}",
            "correct": "A",
            "explanation": f"PV annuity = PMT × [(1-(1+r)^-n)/r] = {pmt} × [(1-(1+{r/100})^-{n})/{r/100}] = ${pvaf:,.2f}",
            "difficulty": 3
        })
    # Perpetuity
    for pmt, r in [(100,5),(500,8),(1000,10),(200,4),(50,2),(2000,6),(300,7),(150,3),(800,9),(1500,12)]:
        pv_perp = pmt / (r/100)
        w1 = pmt * 100 / r * 1.05
        w2 = pmt / (r/100 + 0.01)
        qs.append({
            "stem": f"A perpetuity pays ${pmt} per year. If the required return is {r}%, the present value is closest to:",
            "a": f"${pv_perp:,.2f}", "b": f"${w1:,.2f}", "c": f"${w2:,.2f}",
            "correct": "A",
            "explanation": f"PV perpetuity = PMT / r = {pmt} / {r/100} = ${pv_perp:,.2f}",
            "difficulty": 2
        })
    # Concepts
    concepts = [
        ("An annuity due differs from an ordinary annuity in that payments are made:",
         "At the beginning of each period", "At the end of each period", "At the midpoint of each period", "A",
         "Annuity due payments occur at the start of each period, ordinary annuity at the end.", 1),
        ("All else equal, as the compounding frequency increases, the effective annual rate:",
         "Increases", "Decreases", "Remains unchanged", "A",
         "More frequent compounding increases the EAR for a given stated annual rate.", 2),
        ("The present value of a growing perpetuity with payment C, growth rate g, and discount rate r is:",
         "C / (r - g)", "C / r", "C × (1+g) / r", "A",
         "PV of growing perpetuity = C / (r - g), where r > g.", 2),
        ("If interest rates decrease, the present value of a fixed future cash flow will:",
         "Increase", "Decrease", "Remain unchanged", "A",
         "Lower discount rates increase the present value of future cash flows.", 1),
        ("The future value of an annuity due is equal to the future value of an ordinary annuity multiplied by:",
         "(1 + r)", "r", "(1 - r)", "A",
         "FV annuity due = FV ordinary annuity × (1 + r), because each payment compounds one extra period.", 2),
        ("Which type of cash flow stream has no definite end?",
         "Perpetuity", "Annuity", "Lump sum", "A",
         "A perpetuity is an infinite series of equal periodic payments.", 1),
        ("A loan requires equal payments that include both principal and interest. This is a(n):",
         "Amortizing loan", "Interest-only loan", "Zero-coupon loan", "A",
         "Amortizing loans have payments that cover both interest and principal reduction.", 1),
        ("The rule of 72 approximates the number of years to double an investment. At 9%, the approximate doubling time is:",
         "8 years", "9 years", "7.2 years", "A",
         "Rule of 72: 72/9 = 8 years.", 1),
        ("When cash flows are uneven, the most appropriate method to find PV is:",
         "Discounting each cash flow individually", "Using the annuity formula", "Using the perpetuity formula", "A",
         "Uneven cash flows must be discounted individually and summed.", 2),
        ("A stated rate of 12% compounded monthly is equivalent to a monthly rate of:",
         "1.00%", "1.12%", "0.12%", "A",
         "Monthly rate = 12% / 12 = 1.00%.", 1),
    ]
    for stem, a, b, c, correct, expl, diff in concepts:
        qs.append({"stem": stem, "a": a, "b": b, "c": c, "correct": correct, "explanation": expl, "difficulty": diff})
    return qs

def _qm03():
    """Statistical Measures of Asset Returns"""
    qs = []
    concepts = [
        ("The arithmetic mean of 10%, -5%, and 15% is closest to:", "6.67%", "6.25%", "7.00%", "A",
         "Arithmetic mean = (10 + (-5) + 15) / 3 = 20/3 = 6.67%", 1),
        ("The median of the dataset {3, 7, 1, 9, 5} is:", "5", "7", "3", "A",
         "Sorted: {1, 3, 5, 7, 9}. The middle value is 5.", 1),
        ("Which measure of central tendency is most affected by extreme values?",
         "Arithmetic mean", "Median", "Mode", "A",
         "The arithmetic mean is influenced by all values including outliers.", 1),
        ("A distribution with a longer right tail has:", "Positive skewness", "Negative skewness", "Zero skewness", "A",
         "A right-skewed distribution has a longer right tail and positive skewness.", 2),
        ("Kurtosis measures:", "The peakedness and tail weight of a distribution", "The asymmetry of a distribution", "The central tendency", "A",
         "Kurtosis captures the shape of the tails and peak relative to a normal distribution.", 2),
        ("Excess kurtosis of a normal distribution is:", "0", "3", "1", "A",
         "Normal distribution has kurtosis of 3, so excess kurtosis = 3 - 3 = 0.", 2),
        ("A leptokurtic distribution has:", "Fatter tails than normal", "Thinner tails than normal", "The same tails as normal", "A",
         "Leptokurtic: excess kurtosis > 0, meaning fatter tails and more peaked.", 2),
        ("The coefficient of variation is calculated as:", "Standard deviation / Mean", "Mean / Standard deviation", "Variance / Mean", "A",
         "CV = s / x-bar, measuring relative dispersion.", 2),
        ("Which measure is preferred when comparing dispersion of datasets with different units?",
         "Coefficient of variation", "Standard deviation", "Variance", "A",
         "CV is unitless and allows comparison across different scales.", 2),
        ("The range is calculated as:", "Maximum - Minimum", "Q3 - Q1", "Mean - Median", "A",
         "Range = Maximum value - Minimum value.", 1),
    ]
    for stem, a, b, c, correct, expl, diff in concepts:
        qs.append({"stem": stem, "a": a, "b": b, "c": c, "correct": correct, "explanation": expl, "difficulty": diff})
    # Calculation questions
    datasets = [
        ([5,10,15,20,25], "mean"),([2,4,6,8,10,12], "mean"),([100,105,95,110,90], "mean"),
        ([3,7,2,8,5,1,9], "median"),([12,15,11,18,14], "median"),([22,25,21,28,24,20], "median"),
    ]
    for data, measure in datasets:
        if measure == "mean":
            val = sum(data)/len(data)
            w1 = val * 1.1
            w2 = val * 0.9
            qs.append({
                "stem": f"The arithmetic mean of the dataset {{{', '.join(map(str,data))}}} is closest to:",
                "a": f"{val:.2f}", "b": f"{w1:.2f}", "c": f"{w2:.2f}",
                "correct": "A",
                "explanation": f"Mean = sum/n = {sum(data)}/{len(data)} = {val:.2f}",
                "difficulty": 1
            })
        else:
            sorted_d = sorted(data)
            n = len(sorted_d)
            med = sorted_d[n//2] if n % 2 == 1 else (sorted_d[n//2-1]+sorted_d[n//2])/2
            w1 = sorted_d[0]
            w2 = sorted_d[-1]
            qs.append({
                "stem": f"The median of the dataset {{{', '.join(map(str,data))}}} is:",
                "a": f"{med}", "b": f"{w1}", "c": f"{w2}",
                "correct": "A",
                "explanation": f"Sorted: {sorted_d}. Median = {med}",
                "difficulty": 1
            })
    # Variance/std dev
    import math
    for data in [[4,8,6,5,7],[10,12,8,15,5],[20,22,18,25,15],[3,3,3,3,3],[1,5,3,7,9]]:
        mean = sum(data)/len(data)
        var = sum((x-mean)**2 for x in data)/(len(data)-1)
        std = math.sqrt(var)
        w1 = var
        w2 = std * 1.2
        qs.append({
            "stem": f"The sample standard deviation of {{{', '.join(map(str,data))}}} is closest to:",
            "a": f"{std:.2f}", "b": f"{var:.2f}", "c": f"{w2:.2f}",
            "correct": "A",
            "explanation": f"Mean={mean:.1f}, Variance={var:.2f}, Std Dev={std:.2f}",
            "difficulty": 3
        })
    # Skewness concepts
    more = [
        ("For a negatively skewed distribution, the relationship between mean, median, and mode is typically:",
         "Mean < Median < Mode", "Mean > Median > Mode", "Mean = Median = Mode", "A",
         "In a negatively skewed distribution, the mean is pulled left by the long left tail.", 2),
        ("A platykurtic distribution has excess kurtosis that is:", "Less than zero", "Greater than zero", "Equal to zero", "A",
         "Platykurtic distributions have thinner tails and excess kurtosis < 0.", 2),
        ("The interquartile range (IQR) is:", "Q3 minus Q1", "Q4 minus Q1", "Maximum minus Minimum", "A",
         "IQR = Q3 - Q1, representing the middle 50% of data.", 1),
        ("Chebyshev's inequality states that for any distribution, at least 75% of observations lie within:",
         "2 standard deviations of the mean", "1 standard deviation of the mean", "3 standard deviations of the mean", "A",
         "Chebyshev: at least 1 - 1/k^2 = 1 - 1/4 = 75% within 2 std devs.", 2),
        ("The harmonic mean is most appropriate for averaging:", "Ratios such as P/E multiples", "Returns over time", "Growth rates", "A",
         "The harmonic mean is used when averaging ratios like price-to-earnings.", 2),
        ("A distribution with a skewness of zero is:", "Symmetric", "Positively skewed", "Negatively skewed", "A",
         "Zero skewness indicates a symmetric distribution.", 1),
        ("The weighted mean assigns:", "Different weights to different observations", "Equal weights to all observations", "Zero weight to outliers", "A",
         "Weighted mean: each observation is multiplied by its weight.", 1),
        ("Downside deviation measures:", "Dispersion of returns below a target", "Total variance", "Upside potential", "A",
         "Downside deviation focuses only on negative deviations from a minimum threshold.", 3),
        ("For a normal distribution, approximately 95% of observations fall within:",
         "1.96 standard deviations of the mean", "1 standard deviation of the mean", "3 standard deviations of the mean", "A",
         "The 95% confidence interval for a normal distribution is approximately +/- 1.96 sigma.", 2),
        ("The geometric mean is always:", "Less than or equal to the arithmetic mean", "Greater than the arithmetic mean", "Equal to the arithmetic mean", "A",
         "By the AM-GM inequality, the geometric mean <= arithmetic mean, with equality only when all values are identical.", 2),
    ]
    for stem, a, b, c, correct, expl, diff in more:
        qs.append({"stem": stem, "a": a, "b": b, "c": c, "correct": correct, "explanation": expl, "difficulty": diff})
    return qs


def _generate_concept_questions(topic_code, module_title, concept_list):
    """Generate questions from a list of (stem, a, b, c, correct, explanation, difficulty) tuples."""
    return [{"stem": s, "a": a, "b": b, "c": c, "correct": correct, "explanation": expl, "difficulty": diff}
            for s, a, b, c, correct, expl, diff in concept_list]


# ── COMPREHENSIVE QUESTION BANKS PER MODULE ──────────────────

def _qm04():
    """Probability Trees and Conditional Expectations"""
    return _generate_concept_questions("QM", "Probability", [
        ("If P(A) = 0.3 and P(B) = 0.5, and A and B are independent, then P(A and B) is:", "0.15", "0.80", "0.20", "A", "P(A∩B) = P(A)×P(B) = 0.3×0.5 = 0.15 for independent events.", 2),
        ("Bayes' formula is used to:", "Update probabilities given new information", "Calculate joint probabilities", "Determine independence", "A", "Bayes' theorem revises prior probabilities using new evidence.", 2),
        ("The expected value of a random variable is:", "The probability-weighted average of possible outcomes", "The most likely outcome", "The median outcome", "A", "E(X) = sum of [xi × P(xi)].", 2),
        ("If P(A|B) = P(A), then events A and B are:", "Independent", "Mutually exclusive", "Exhaustive", "A", "When conditioning on B doesn't change A's probability, they are independent.", 2),
        ("Two events are mutually exclusive if:", "They cannot occur simultaneously", "They are independent", "Their probabilities sum to 1", "A", "Mutually exclusive: P(A∩B) = 0.", 1),
        ("The total probability rule states that P(A) equals:", "The sum of P(A|Bi)×P(Bi) for all mutually exclusive Bi", "P(A|B) × P(B)", "1 - P(A complement)", "A", "Total probability: P(A) = Σ P(A|Bi)P(Bi) over all partitions.", 3),
        ("In a probability tree, each branch represents:", "A conditional probability", "A marginal probability", "A joint probability", "A", "Branches show conditional probabilities; multiplying along paths gives joint probabilities.", 2),
        ("If P(A) = 0.6 and P(B|A) = 0.4, then P(A and B) is:", "0.24", "1.00", "0.40", "A", "P(A∩B) = P(B|A)×P(A) = 0.4×0.6 = 0.24.", 2),
        ("The complement of event A has probability:", "1 - P(A)", "P(A)", "P(A)²", "A", "P(A') = 1 - P(A).", 1),
        ("A conditional expectation is:", "The expected value given that a specific event has occurred", "The unconditional mean", "The variance of conditional outcomes", "A", "E(X|Y) conditions the expectation on Y having occurred.", 2),
        ("P(A or B) for non-mutually exclusive events equals:", "P(A) + P(B) - P(A and B)", "P(A) + P(B)", "P(A) × P(B)", "A", "Addition rule: P(A∪B) = P(A) + P(B) - P(A∩B).", 2),
        ("If a portfolio has a 60% chance of earning 10% and 40% chance of earning -5%, the expected return is:", "4.0%", "5.0%", "2.5%", "A", "E(R) = 0.6×10% + 0.4×(-5%) = 6% - 2% = 4.0%.", 2),
        ("The covariance of a random variable with itself is:", "Its variance", "Its standard deviation", "Zero", "A", "Cov(X,X) = Var(X).", 2),
        ("If the correlation between two assets is -1, the portfolio:", "Can have zero risk if properly weighted", "Has maximum risk", "Has undefined risk", "A", "Perfect negative correlation allows complete diversification of risk.", 2),
        ("The variance of expected returns can be calculated as:", "E(X²) - [E(X)]²", "E(X)² - E(X²)", "[E(X)]²", "A", "Var(X) = E(X²) - [E(X)]².", 3),
        ("A Bernoulli trial has:", "Two possible outcomes", "Multiple outcomes", "A continuous distribution", "A", "Bernoulli: success or failure, with probability p and (1-p).", 1),
        ("Given P(A) = 0.4, P(B) = 0.5, P(A|B) = 0.6, P(A and B) is:", "0.30", "0.20", "0.24", "A", "P(A∩B) = P(A|B)×P(B) = 0.6×0.5 = 0.30.", 2),
        ("The expected value operator is:", "Linear", "Non-linear", "Undefined for discrete variables", "A", "E(aX+b) = aE(X)+b, demonstrating linearity.", 2),
        ("If two events are exhaustive, their probabilities:", "Sum to 1", "Are equal", "Sum to 0", "A", "Exhaustive events cover the entire sample space, so probabilities sum to 1.", 1),
        ("A joint probability table shows:", "Probabilities of combinations of two events", "Marginal probabilities only", "Conditional probabilities only", "A", "Joint probability tables display P(A∩B) for all combinations.", 2),
    ])

def _qm05():
    """Portfolio Mathematics"""
    return _generate_concept_questions("QM", "Portfolio Math", [
        ("The expected return of a two-asset portfolio is:", "The weighted average of the individual expected returns", "The product of individual returns", "The simple average of returns", "A", "E(Rp) = w1×E(R1) + w2×E(R2).", 1),
        ("Portfolio variance depends on:", "Individual variances, covariances, and weights", "Only individual variances", "Only covariances", "A", "σ²p = w1²σ1² + w2²σ2² + 2w1w2Cov(R1,R2).", 2),
        ("Diversification benefits are greatest when the correlation between assets is:", "Negative", "Positive", "Zero", "A", "Lower correlation = greater risk reduction from diversification.", 2),
        ("If correlation between two assets is +1, the portfolio standard deviation is:", "The weighted average of individual standard deviations", "Less than the weighted average", "Zero", "A", "With perfect positive correlation, σp = w1σ1 + w2σ2.", 2),
        ("Covariance can range from:", "Negative infinity to positive infinity", "0 to 1", "-1 to +1", "A", "Covariance is unbounded, unlike correlation which is bounded [-1, +1].", 2),
        ("The correlation coefficient is calculated as:", "Covariance divided by the product of standard deviations", "Covariance times variance", "Standard deviation divided by mean", "A", "ρ = Cov(X,Y) / (σx × σy).", 2),
        ("For an equally-weighted portfolio of n assets, as n increases, portfolio variance approaches:", "The average covariance", "Zero", "The average variance", "A", "As n→∞, portfolio variance → average covariance (systematic risk).", 3),
        ("A portfolio with 60% in Asset A (E(R)=10%) and 40% in Asset B (E(R)=5%) has an expected return of:", "8.0%", "7.5%", "7.0%", "A", "E(Rp) = 0.6×10% + 0.4×5% = 8.0%.", 1),
        ("The minimum variance portfolio is the portfolio with:", "The lowest possible variance for given assets", "Zero return", "Equal weights in all assets", "A", "The minimum variance portfolio minimizes risk regardless of return.", 2),
        ("Adding a risk-free asset to a risky portfolio creates:", "The Capital Allocation Line", "The Security Market Line", "The efficient frontier", "A", "Combining risk-free and risky assets produces the CAL.", 2),
        ("Shortfall risk is the probability that:", "Portfolio return falls below a minimum threshold", "Portfolio value exceeds a maximum", "Returns are normally distributed", "A", "Shortfall risk = P(Rp < Rtarget).", 2),
        ("Roy's safety-first criterion maximizes:", "(Expected return - Threshold return) / Standard deviation", "Expected return only", "Sharpe ratio", "A", "SFRatio = [E(Rp) - RL] / σp.", 3),
        ("The Sharpe ratio measures:", "Excess return per unit of total risk", "Excess return per unit of systematic risk", "Total return per unit of risk", "A", "Sharpe = (Rp - Rf) / σp.", 2),
        ("If the covariance between two assets is zero, they are:", "Uncorrelated", "Perfectly correlated", "Mutually exclusive", "A", "Zero covariance implies zero correlation (uncorrelated).", 1),
        ("The variance of a three-asset portfolio has how many covariance terms?", "3", "6", "9", "A", "For 3 assets: 3 unique pairs, each counted twice = 6, but 3 unique covariance terms in the formula.", 3),
        ("Systematic risk is:", "Non-diversifiable risk", "Diversifiable risk", "Total risk", "A", "Systematic risk affects all securities and cannot be diversified away.", 1),
        ("The efficient frontier represents:", "Portfolios with maximum return for each level of risk", "All possible portfolios", "Only minimum risk portfolios", "A", "Efficient frontier = set of optimal portfolios offering highest return per risk level.", 2),
        ("A risk-averse investor prefers:", "Lower risk for a given level of return", "Higher risk for higher returns", "Risk-neutral investments only", "A", "Risk-averse investors prefer the certainty equivalent and require risk premiums.", 1),
        ("The portfolio variance of two uncorrelated assets (w1=0.5, σ1=10%, w2=0.5, σ2=20%) is closest to:", "1.25%", "2.50%", "0.50%", "A", "σ²p = (0.5)²(0.10)² + (0.5)²(0.20)² = 0.0025 + 0.01 = 0.0125 = 1.25%.", 3),
        ("Increasing the number of assets in a portfolio reduces:", "Unsystematic risk", "Systematic risk", "Total expected return", "A", "Diversification eliminates unsystematic (firm-specific) risk.", 2),
    ])

def _qm06():
    """Simulation Methods"""
    return _generate_concept_questions("QM", "Simulation", [
        ("Monte Carlo simulation is best described as:", "A technique that uses random sampling to model uncertainty", "A deterministic optimization method", "A regression analysis technique", "A", "Monte Carlo simulation generates random scenarios to estimate distributions of outcomes.", 2),
        ("A key advantage of Monte Carlo simulation is that it:", "Can model complex interactions and non-linear relationships", "Always provides exact solutions", "Eliminates the need for assumptions", "A", "Monte Carlo handles complex, multi-variable problems that analytical methods cannot.", 2),
        ("Historical simulation uses:", "Actual past data to simulate future scenarios", "Random numbers from a theoretical distribution", "Only the most recent data point", "A", "Historical simulation resamples from actual historical returns.", 2),
        ("The number of trials in a Monte Carlo simulation should be:", "Large enough to achieve stable results", "Exactly 100", "Equal to the number of variables", "A", "More trials improve accuracy; typically thousands or millions are used.", 2),
        ("A limitation of Monte Carlo simulation is:", "It depends on the quality of input assumptions", "It cannot model correlations", "It only works for normally distributed data", "A", "Garbage in, garbage out — results are only as good as the distributional assumptions.", 2),
        ("Bootstrap resampling involves:", "Drawing random samples with replacement from historical data", "Drawing samples without replacement", "Using theoretical distributions only", "A", "Bootstrapping resamples with replacement to estimate sampling distributions.", 3),
        ("In simulation, pseudo-random numbers are:", "Generated by algorithms that appear random", "Truly random", "Always uniformly distributed", "A", "Computer-generated numbers are deterministic but mimic randomness.", 2),
        ("To simulate a lognormal stock price, you would:", "Simulate normal returns and exponentiate", "Simulate uniform returns", "Use actual historical prices directly", "A", "If ln(S) is normal, then S = exp(normal) is lognormal.", 3),
        ("The accuracy of a Monte Carlo estimate increases with:", "The square root of the number of simulations", "The number of simulations linearly", "The square of the number of simulations", "A", "Standard error decreases as 1/√n, so accuracy improves with √n.", 3),
        ("Scenario analysis differs from simulation in that it:", "Uses a limited number of discrete scenarios", "Uses thousands of random scenarios", "Is always more accurate", "A", "Scenario analysis examines specific what-if cases, while simulation generates many random paths.", 2),
        ("Variance reduction techniques in simulation include:", "Antithetic variates and control variates", "Increasing the number of variables", "Reducing the number of trials", "A", "These techniques reduce sampling error without increasing computational cost.", 3),
        ("A stress test typically:", "Examines portfolio performance under extreme scenarios", "Uses random normal scenarios", "Optimizes the portfolio weights", "A", "Stress tests apply extreme but plausible shocks to evaluate vulnerability.", 2),
        ("In a Monte Carlo VaR calculation, the 5% VaR is:", "The 5th percentile of simulated losses", "The average of all simulated losses", "The maximum simulated loss", "A", "VaR at 95% confidence = the loss at the 5th percentile of the simulated distribution.", 3),
        ("Which distribution is commonly used to simulate asset returns?", "Normal distribution", "Uniform distribution", "Poisson distribution", "A", "Normal (or lognormal) distributions are standard for modeling returns.", 2),
        ("Convergence in Monte Carlo simulation means:", "Results stabilize as the number of trials increases", "The simulation runs faster", "Fewer variables are needed", "A", "Convergence = the estimate approaches the true value with more iterations.", 2),
        ("Latin Hypercube Sampling:", "Stratifies the probability distribution for better coverage", "Uses only historical data", "Requires fewer than 10 trials", "A", "LHS ensures the full range of each variable is sampled, improving efficiency.", 3),
        ("A random walk model assumes:", "Future changes are independent of past changes", "Prices follow a deterministic trend", "Returns are perfectly predictable", "A", "Random walk: price changes are independent and identically distributed.", 2),
        ("The seed value in a simulation:", "Ensures reproducibility of pseudo-random numbers", "Determines the number of trials", "Sets the confidence level", "A", "Same seed = same sequence of pseudo-random numbers.", 2),
        ("When modeling correlated assets in simulation, one typically uses:", "Cholesky decomposition", "Simple random sampling", "Only marginal distributions", "A", "Cholesky decomposition transforms independent random variables into correlated ones.", 3),
        ("A disadvantage of historical simulation is:", "It assumes the future will resemble the past", "It requires distributional assumptions", "It cannot handle multiple assets", "A", "Historical simulation is limited by the range and relevance of past data.", 2),
    ])

def _qm07():
    """Estimation and Inference"""
    return _generate_concept_questions("QM", "Estimation", [
        ("A point estimate is:", "A single value used to estimate a population parameter", "A range of values", "The population parameter itself", "A", "A point estimate is a single statistic used as the best guess for a parameter.", 1),
        ("A confidence interval provides:", "A range likely to contain the population parameter", "An exact value of the parameter", "The probability of a specific outcome", "A", "CI = point estimate ± (critical value × standard error).", 2),
        ("The standard error of the sample mean is:", "Population standard deviation divided by the square root of n", "The sample standard deviation", "The variance divided by n", "A", "SE = σ/√n.", 2),
        ("As sample size increases, the standard error:", "Decreases", "Increases", "Remains the same", "A", "SE = σ/√n, so larger n reduces SE.", 1),
        ("The t-distribution is used instead of the z-distribution when:", "The population variance is unknown and sample size is small", "The population is not normal", "The sample size is very large", "A", "With unknown σ and small n, use the t-distribution.", 2),
        ("Degrees of freedom for a single sample t-test are:", "n - 1", "n", "n + 1", "A", "df = n - 1 for a single sample.", 1),
        ("As degrees of freedom increase, the t-distribution:", "Approaches the standard normal distribution", "Becomes more spread out", "Shifts to the right", "A", "With more df, t-distribution → z-distribution.", 2),
        ("A 95% confidence interval means:", "In repeated sampling, 95% of such intervals would contain the true parameter", "There is a 95% probability the parameter is in the interval", "The sample mean is 95% accurate", "A", "Frequentist interpretation: 95% of all possible CIs contain the true value.", 2),
        ("An unbiased estimator has:", "An expected value equal to the population parameter", "Zero variance", "The smallest possible variance", "A", "E(θ-hat) = θ for an unbiased estimator.", 2),
        ("An efficient estimator has:", "The smallest variance among all unbiased estimators", "Zero bias", "A larger sample size", "A", "Efficiency = minimum variance among unbiased estimators (MVUE).", 3),
        ("A consistent estimator:", "Converges to the true parameter as sample size increases", "Is always unbiased", "Has zero standard error", "A", "Consistency: as n→∞, the estimator → the parameter in probability.", 2),
        ("The Central Limit Theorem states that:", "The distribution of sample means approaches normal as n increases", "All populations are normally distributed", "Sample variance equals population variance", "A", "CLT: for large n, X-bar is approximately normal regardless of population shape.", 2),
        ("The z-critical value for a 95% confidence interval is approximately:", "1.96", "1.645", "2.576", "A", "95% CI → z = 1.96 (two-tailed).", 1),
        ("To halve the width of a confidence interval, the sample size must:", "Quadruple", "Double", "Increase by 50%", "A", "CI width ∝ 1/√n, so halving width requires 4× the sample.", 3),
        ("The z-critical value for a 99% confidence interval is approximately:", "2.576", "1.96", "1.645", "A", "99% CI → z = 2.576 (two-tailed).", 1),
        ("Sampling error is:", "The difference between sample statistic and population parameter", "A mistake in data collection", "Bias in the estimator", "A", "Sampling error arises naturally from using a subset of the population.", 1),
        ("A Type I error occurs when:", "A true null hypothesis is rejected", "A false null hypothesis is not rejected", "The sample size is too small", "A", "Type I error = false positive (rejecting H0 when it's true).", 2),
        ("A Type II error occurs when:", "A false null hypothesis is not rejected", "A true null hypothesis is rejected", "The confidence level is too high", "A", "Type II error = false negative (failing to reject a false H0).", 2),
        ("The power of a test is:", "The probability of correctly rejecting a false null hypothesis", "The probability of a Type I error", "1 minus the significance level", "A", "Power = 1 - P(Type II error) = P(reject H0 | H0 is false).", 2),
        ("Increasing the significance level:", "Increases the probability of a Type I error", "Decreases the probability of a Type I error", "Has no effect on error probabilities", "A", "Higher α = more likely to reject H0 = more Type I errors.", 2),
    ])

def _qm08():
    """Hypothesis Testing"""
    return _generate_concept_questions("QM", "Hypothesis Testing", [
        ("The null hypothesis typically represents:", "The status quo or no effect", "The alternative claim", "The desired outcome", "A", "H0 states no difference, no effect, or no relationship.", 1),
        ("A two-tailed test is appropriate when:", "We are testing for a difference in either direction", "We expect only an increase", "We expect only a decrease", "A", "Two-tailed: H1: μ ≠ μ0 (reject for either direction).", 2),
        ("The p-value is:", "The smallest significance level at which H0 would be rejected", "The probability that H0 is true", "The probability of a Type II error", "A", "p-value = probability of observing the test statistic or more extreme, given H0.", 2),
        ("If the p-value is less than alpha, we:", "Reject the null hypothesis", "Fail to reject the null hypothesis", "Accept the null hypothesis", "A", "p-value < α → reject H0.", 1),
        ("A test statistic falls in the rejection region. This means:", "We reject the null hypothesis", "We accept the null hypothesis", "The test is inconclusive", "A", "Test stat in rejection region → reject H0.", 1),
        ("The significance level (alpha) is:", "The probability of rejecting a true null hypothesis", "The probability of accepting a false null hypothesis", "The power of the test", "A", "α = P(Type I error) = P(reject H0 | H0 true).", 2),
        ("For a one-tailed test at 5% significance with z-distribution, the critical value is:", "1.645", "1.96", "2.576", "A", "One-tailed 5% → z = 1.645.", 2),
        ("When testing a hypothesis about the mean with known population variance:", "Use the z-test", "Use the t-test", "Use the chi-square test", "A", "Known σ → z-test.", 1),
        ("The chi-square test is used for:", "Testing hypotheses about variance", "Testing hypotheses about the mean", "Testing correlation", "A", "Chi-square tests variance: χ² = (n-1)s²/σ0².", 2),
        ("The F-test is used to:", "Compare two population variances", "Compare two population means", "Test normality", "A", "F = s1²/s2², comparing two sample variances.", 2),
        ("Rejecting H0 when it is false is a:", "Correct decision", "Type I error", "Type II error", "A", "Correctly rejecting a false null = desirable outcome (power).", 1),
        ("A test with high power has a:", "Low probability of Type II error", "High probability of Type I error", "Large sample variance", "A", "Power = 1 - β; high power means low Type II error.", 2),
        ("Economic significance differs from statistical significance because:", "A statistically significant result may not be meaningful in practice", "They always agree", "Economic significance requires larger samples", "A", "Statistical significance doesn't imply practical importance.", 2),
        ("With a larger sample size, a test becomes:", "More likely to detect small effects", "Less likely to detect effects", "Less reliable", "A", "Larger n increases power → smaller effects become detectable.", 2),
        ("A parametric test assumes:", "The population follows a specific distribution", "No distributional assumptions", "Only nominal data", "A", "Parametric tests assume a known distribution (e.g., normality).", 2),
        ("The t-test for paired observations is used when:", "Samples are dependent", "Samples are independent", "Population variance is known", "A", "Paired t-test: same subjects measured twice or matched pairs.", 2),
        ("When testing H0: μ = 50 vs H1: μ > 50, this is a:", "One-tailed test (right-tailed)", "Two-tailed test", "One-tailed test (left-tailed)", "A", "H1: μ > 50 is a right-tailed test.", 1),
        ("If we cannot reject H0, we should say:", "We fail to reject H0", "We accept H0", "H0 is proven true", "A", "Never 'accept' H0; we simply fail to find sufficient evidence against it.", 1),
        ("The test statistic for a z-test is:", "(Sample mean - Hypothesized mean) / Standard error", "Sample mean / Population mean", "Standard error / Sample mean", "A", "z = (x-bar - μ0) / (σ/√n).", 2),
        ("Multiple testing correction is needed when:", "Conducting many simultaneous tests", "Using a single test", "The sample is very large", "A", "Multiple comparisons inflate the probability of at least one Type I error.", 3),
    ])

def _qm09():
    """Parametric and Non-Parametric Tests"""
    return _generate_concept_questions("QM", "Non-Parametric Tests", [
        ("Non-parametric tests are preferred when:", "Data do not meet the assumptions of parametric tests", "The sample size is very large", "The population is normally distributed", "A", "Non-parametric tests make fewer distributional assumptions.", 2),
        ("The Spearman rank correlation measures:", "The monotonic relationship between ranked variables", "The linear relationship between variables", "Causation between variables", "A", "Spearman uses ranks to assess monotonic (not necessarily linear) association.", 2),
        ("The Mann-Whitney U test is a non-parametric alternative to:", "The independent samples t-test", "The paired t-test", "The chi-square test", "A", "Mann-Whitney compares two independent groups without assuming normality.", 2),
        ("The Wilcoxon signed-rank test is a non-parametric alternative to:", "The paired t-test", "The independent t-test", "The F-test", "A", "Wilcoxon signed-rank tests paired differences without normality assumption.", 2),
        ("The Kruskal-Wallis test extends the Mann-Whitney U test to:", "More than two groups", "Paired samples", "Time series data", "A", "Kruskal-Wallis is the non-parametric ANOVA equivalent for k groups.", 3),
        ("A sign test evaluates:", "Whether the median differs from a hypothesized value", "Whether the mean equals zero", "The variance of a sample", "A", "The sign test counts positive and negative deviations from the hypothesized median.", 2),
        ("Chi-square goodness-of-fit test determines:", "Whether observed frequencies differ from expected frequencies", "Whether two means are equal", "The correlation between variables", "A", "χ² GOF compares observed vs. expected category frequencies.", 2),
        ("A parametric test for the equality of two variances is the:", "F-test", "t-test", "z-test", "A", "F = s1²/s2² tests H0: σ1² = σ2².", 2),
        ("The runs test is used to determine:", "Whether a sequence of observations is random", "Whether data is normally distributed", "The mean of a population", "A", "The runs test checks for randomness in a binary sequence.", 3),
        ("An advantage of non-parametric tests is:", "They can be used with ordinal data", "They are always more powerful", "They require larger samples", "A", "Non-parametric tests work with ordinal and non-normal data.", 2),
        ("A disadvantage of non-parametric tests is:", "They generally have less statistical power", "They require normality", "They cannot handle outliers", "A", "Non-parametric tests are less powerful when parametric assumptions hold.", 2),
        ("The chi-square test of independence determines:", "Whether two categorical variables are related", "Whether a mean equals a specific value", "The variance of a dataset", "A", "χ² independence test evaluates association between two categorical variables.", 2),
        ("Rank correlation is robust to:", "Outliers", "Large samples", "Missing data", "A", "Ranking data makes correlation measures resistant to extreme values.", 2),
        ("The Jarque-Bera test evaluates:", "Whether data is normally distributed", "Whether two variances are equal", "Whether a mean equals zero", "A", "JB test checks normality using skewness and kurtosis.", 3),
        ("For small samples from non-normal populations:", "Non-parametric tests are more appropriate", "Parametric tests are always valid", "No test can be used", "A", "Parametric tests may be unreliable for small non-normal samples.", 2),
        ("The Kolmogorov-Smirnov test:", "Compares a sample distribution with a reference distribution", "Tests for equal variances", "Calculates correlation", "A", "KS test measures maximum distance between empirical and theoretical CDFs.", 3),
        ("When data are ordinal, the appropriate measure of central tendency is:", "Median", "Mean", "Standard deviation", "A", "Median is appropriate for ordinal data; mean requires interval/ratio scale.", 1),
        ("A contingency table is used with:", "Chi-square test of independence", "t-test", "F-test", "A", "Contingency tables organize data for chi-square independence tests.", 2),
        ("The test statistic for a chi-square GOF test is:", "Sum of (Observed-Expected)²/Expected", "(X-bar - μ)²/σ²", "s1²/s2²", "A", "χ² = Σ(O-E)²/E.", 2),
        ("Bootstrapping is a:", "Resampling technique that does not assume a specific distribution", "Parametric method", "Method requiring normality", "A", "Bootstrapping resamples with replacement from the data itself.", 2),
    ])

def _qm10():
    """Simple Linear Regression"""
    return _generate_concept_questions("QM", "Regression", [
        ("In simple linear regression, the dependent variable is:", "The variable being predicted", "The predictor variable", "A constant", "A", "Y (dependent) is predicted from X (independent).", 1),
        ("The R-squared value represents:", "The proportion of variance in Y explained by X", "The slope of the regression line", "The p-value of the test", "A", "R² = explained variation / total variation.", 2),
        ("The slope coefficient in regression measures:", "The change in Y for a one-unit change in X", "The intercept value", "The correlation coefficient", "A", "b1 = ΔY/ΔX.", 1),
        ("If R² = 0.64, the correlation coefficient is:", "0.80 or -0.80", "0.64", "0.36", "A", "r = ±√R² = ±√0.64 = ±0.80.", 2),
        ("The standard error of estimate (SEE) measures:", "The dispersion of observations around the regression line", "The slope's significance", "The intercept value", "A", "SEE is the standard deviation of residuals.", 2),
        ("Heteroscedasticity means:", "Residual variance is not constant", "Residuals are normally distributed", "Variables are independent", "A", "Heteroscedasticity: non-constant variance of error terms.", 3),
        ("Serial correlation in residuals violates the assumption of:", "Independent errors", "Normal errors", "Constant variance", "A", "Autocorrelated residuals violate the independence assumption.", 3),
        ("The intercept (b0) represents:", "The predicted Y when X equals zero", "The slope of the line", "The R-squared value", "A", "b0 = Y-hat when X = 0.", 1),
        ("A residual is:", "The difference between observed and predicted Y", "The predicted value of Y", "The slope coefficient", "A", "Residual = Yi - Y-hat_i.", 1),
        ("The t-statistic for a slope coefficient tests:", "Whether the slope is significantly different from zero", "Whether R² is significant", "Whether residuals are normal", "A", "t = b1/SE(b1); tests H0: β1 = 0.", 2),
        ("An F-test in simple regression tests:", "The overall significance of the model", "Individual coefficient significance", "Normality of residuals", "A", "F-test: H0: all slope coefficients = 0 (model has no explanatory power).", 2),
        ("Multicollinearity is a concern in:", "Multiple regression, not simple regression", "Simple regression", "Non-parametric tests", "A", "Multicollinearity involves correlation among independent variables (multiple regression only).", 2),
        ("The coefficient of determination can range from:", "0 to 1", "-1 to 1", "Negative infinity to positive infinity", "A", "R² is between 0 (no fit) and 1 (perfect fit).", 1),
        ("Regression assumptions include:", "Linearity, independence, homoscedasticity, and normality of errors", "Errors must be correlated", "X must be normally distributed", "A", "LINE: Linearity, Independence, Normality, Equal variance.", 2),
        ("The predicted value of Y is denoted:", "Y-hat", "Y-bar", "Y*", "A", "Y-hat = b0 + b1×X.", 1),
        ("If b1 = 2.5, a one-unit increase in X leads to:", "A 2.5-unit increase in predicted Y", "A 2.5% increase in Y", "No change in Y", "A", "Slope of 2.5 means Y increases by 2.5 for each unit increase in X.", 1),
        ("The Durbin-Watson statistic tests for:", "Autocorrelation in residuals", "Heteroscedasticity", "Normality", "A", "DW ≈ 2 means no autocorrelation; DW < 2 → positive autocorrelation.", 3),
        ("A high R² with insignificant coefficients may indicate:", "Overfitting or multicollinearity", "A perfect model", "Normally distributed errors", "A", "This pattern can signal multicollinearity in multiple regression or overfitting.", 3),
        ("Confidence interval for a predicted Y value is:", "Narrower at the mean of X", "Wider at the mean of X", "Constant for all X", "A", "Prediction intervals widen as X moves away from X-bar.", 3),
        ("The method of ordinary least squares minimizes:", "The sum of squared residuals", "The sum of absolute residuals", "The sum of residuals", "A", "OLS minimizes Σ(Yi - Y-hat_i)².", 2),
    ])

def _qm11():
    """Big Data Techniques"""
    return _generate_concept_questions("QM", "Big Data", [
        ("Big data is characterized by:", "Volume, velocity, variety, and veracity", "Only large datasets", "Structured data exclusively", "A", "The 4 V's define big data characteristics.", 1),
        ("Machine learning differs from traditional statistics in that it:", "Emphasizes prediction over inference", "Requires smaller datasets", "Only uses linear models", "A", "ML focuses on predictive accuracy; statistics focuses on parameter estimation and inference.", 2),
        ("Overfitting occurs when:", "A model fits training data too closely and performs poorly on new data", "A model is too simple", "Training error is high", "A", "Overfitting: low training error but high test error due to modeling noise.", 2),
        ("Cross-validation is used to:", "Assess model performance on unseen data", "Increase sample size", "Eliminate outliers", "A", "k-fold cross-validation estimates out-of-sample performance.", 2),
        ("A decision tree:", "Splits data recursively based on feature values", "Is always a linear model", "Requires normally distributed data", "A", "Decision trees partition the feature space using if-then rules.", 2),
        ("Random forests improve on decision trees by:", "Combining many trees to reduce variance", "Using a single deeper tree", "Eliminating all features", "A", "Bagging multiple trees (random forests) reduces overfitting.", 3),
        ("Regularization in machine learning:", "Penalizes model complexity to prevent overfitting", "Increases the number of features", "Removes all constraints", "A", "Regularization (L1/L2) adds a penalty term to the loss function.", 3),
        ("LASSO regression performs:", "Feature selection by shrinking some coefficients to zero", "Ridge regression", "Standard OLS", "A", "LASSO (L1 penalty) can set coefficients exactly to zero, performing variable selection.", 3),
        ("Unsupervised learning differs from supervised learning in that:", "It does not use labeled target variables", "It always produces more accurate results", "It requires larger datasets", "A", "Unsupervised learning finds patterns without target labels (e.g., clustering).", 2),
        ("Natural language processing (NLP) is used to:", "Analyze and extract information from text data", "Process only numerical data", "Perform linear regression", "A", "NLP applies ML techniques to human language text.", 2),
        ("The bias-variance tradeoff means:", "Reducing one type of error often increases the other", "Both errors decrease together", "Only bias matters", "A", "Complex models have low bias but high variance; simple models vice versa.", 3),
        ("K-means clustering:", "Partitions data into k groups based on similarity", "Is a supervised learning algorithm", "Requires labeled data", "A", "K-means is unsupervised, grouping observations by minimizing within-cluster variance.", 2),
        ("Text analytics in finance can:", "Assess sentiment from news articles and reports", "Only process structured data", "Replace fundamental analysis entirely", "A", "Sentiment analysis from text provides alternative data for investment decisions.", 2),
        ("Neural networks are inspired by:", "The structure of the human brain", "Decision tree algorithms", "Linear regression", "A", "Neural networks use interconnected layers of nodes resembling biological neurons.", 2),
        ("Deep learning uses:", "Neural networks with many hidden layers", "Only one layer", "Simple linear models", "A", "Deep learning = neural networks with multiple hidden layers.", 2),
        ("Feature engineering involves:", "Creating new input variables from existing data", "Deleting all variables", "Running the model without features", "A", "Feature engineering transforms raw data into informative model inputs.", 2),
        ("The training set in machine learning is used to:", "Build and fit the model", "Evaluate final performance", "Select hyperparameters", "A", "Training data is used to learn model parameters.", 1),
        ("Penalized regression includes:", "Ridge and LASSO regression", "Only OLS regression", "Non-parametric tests", "A", "Ridge (L2) and LASSO (L1) add penalty terms to the loss function.", 2),
        ("Structured data is:", "Organized in a predefined format like tables", "Unorganized text or images", "Always big data", "A", "Structured data fits rows/columns; unstructured includes text, images, video.", 1),
        ("An ensemble method combines:", "Multiple models to improve prediction", "A single model with more data", "Only linear models", "A", "Ensemble methods (bagging, boosting) aggregate multiple models for better performance.", 2),
    ])

# ──────────────────────────────────────────────────────────────
# ETHICS
# ──────────────────────────────────────────────────────────────

def _eth01():
    """Ethics and Trust in the Investment Profession"""
    return _generate_concept_questions("ETH", "Ethics and Trust", [
        ("A profession is distinguished from an occupation by:", "Specialized knowledge, a code of ethics, and service to society", "Higher pay only", "Government regulation only", "A", "Professions have specialized knowledge, ethical standards, and societal responsibility.", 1),
        ("The CFA Institute Code of Ethics requires members to:", "Act with integrity, competence, and respect", "Maximize personal profit", "Follow employer instructions without question", "A", "The Code emphasizes integrity, competence, diligence, and respect.", 1),
        ("Ethical conduct in the investment industry promotes:", "Trust and confidence in financial markets", "Higher transaction costs", "Reduced market participation", "A", "Ethics fosters trust, which is essential for functioning financial markets.", 1),
        ("A fiduciary duty requires:", "Placing client interests ahead of personal interests", "Equal treatment of all stakeholders", "Maximizing firm profits", "A", "Fiduciary duty: client interests come first.", 1),
        ("The concept of ethical behavior most accurately includes:", "Conduct beyond mere compliance with laws and regulations", "Only following legal requirements", "Maximizing shareholder returns", "A", "Ethics goes beyond legal compliance to include moral principles.", 2),
        ("An ethical framework helps professionals:", "Analyze and resolve ethical dilemmas systematically", "Avoid all difficult decisions", "Always choose the profitable option", "A", "Ethical frameworks provide structured approaches to moral reasoning.", 2),
        ("Situational influences on ethical behavior include:", "Pressure from supervisors and organizational culture", "Only personal values", "Legal requirements exclusively", "A", "Context, incentives, and social pressures affect ethical choices.", 2),
        ("Trust in investment professionals is important because:", "Clients cannot easily verify investment advice quality", "All investments are risk-free", "Regulations eliminate all conflicts", "A", "Information asymmetry makes trust essential between advisors and clients.", 2),
        ("Which is NOT one of the six components of the Code of Ethics?", "Maximize employer profits at all costs", "Act with integrity and competence", "Place client interests above own", "A", "The Code does not include maximizing employer profits at any cost.", 1),
        ("A challenge to ethical behavior in investment is:", "Conflicts of interest between personal and client interests", "Excessive regulation", "Too few investment options", "A", "Conflicts of interest are a primary ethical challenge in the industry.", 2),
        ("The CFA Program's emphasis on ethics is intended to:", "Raise professional standards and protect investors", "Reduce competition among analysts", "Simplify regulatory requirements", "A", "CFA ethics training protects investors and elevates the profession.", 1),
        ("Which best describes the duty of loyalty?", "Obligation to act in the client's best interest", "Following personal investment preferences", "Maximizing trading volume", "A", "Loyalty requires prioritizing client interests.", 1),
        ("An investment professional should disclose:", "All potential conflicts of interest", "Only conflicts that affect compensation", "No conflicts if they are minor", "A", "Full disclosure of conflicts is required regardless of size.", 2),
        ("Market integrity is maintained by:", "Fair dealing and transparent practices", "Insider trading", "Selective disclosure", "A", "Fair dealing and transparency support market integrity.", 1),
        ("High ethical standards benefit the investment industry by:", "Attracting more capital and lowering the cost of capital", "Reducing the number of participants", "Increasing regulatory burden", "A", "Trust and ethics attract capital, benefiting markets and the economy.", 2),
        ("The difference between a code of ethics and standards of practice is:", "A code provides principles; standards give specific guidance", "They are identical", "Standards are less binding", "A", "Code = broad principles; Standards = specific, actionable rules.", 2),
        ("An ethical dilemma occurs when:", "Two or more ethical principles conflict", "The law is clear", "There is only one option", "A", "Dilemmas arise when valid ethical principles point in different directions.", 2),
        ("Professionalism in investment management includes:", "Continuous learning and adherence to ethical standards", "Avoiding all risky investments", "Following only profitable strategies", "A", "Professionalism requires ongoing education and ethical conduct.", 1),
        ("Self-regulation in a profession means:", "Members establish and enforce their own standards", "No oversight is needed", "Government sets all rules", "A", "Self-regulating professions create and police their own standards.", 2),
        ("When facing an ethical conflict, the recommended first step is:", "Identify the relevant facts and stakeholders", "Resign immediately", "Consult only with your supervisor", "A", "Systematic ethical analysis starts with fact-gathering and stakeholder identification.", 2),
    ])

def _eth02():
    """Code of Ethics and Standards of Professional Conduct"""
    return _generate_concept_questions("ETH", "Code and Standards", [
        ("Standard I(A) Knowledge of the Law requires members to:", "Understand and comply with applicable laws and regulations", "Follow only CFA Institute rules", "Ignore foreign laws", "A", "Members must know and comply with all applicable laws, following the stricter of CFA standards or local law.", 2),
        ("Standard I(B) Independence and Objectivity requires that:", "Investment recommendations not be influenced by external pressures", "All research be positive", "Clients always agree with recommendations", "A", "Members must maintain independent judgment free from conflicts.", 2),
        ("Under Standard II(A) Material Nonpublic Information, a member who possesses insider information must:", "Not act on or share the information", "Trade immediately before the information becomes public", "Share it only with senior management", "A", "Members must not trade on or disseminate MNPI.", 2),
        ("Standard III(A) Loyalty, Prudence, and Care requires members to:", "Act in the best interest of clients", "Maximize firm revenue", "Follow personal investment preferences", "A", "Fiduciary duty: client interests come first.", 1),
        ("Standard III(B) Fair Dealing requires:", "Treating all clients fairly when disseminating recommendations", "Giving priority to the largest clients", "Sharing information only with institutional clients", "A", "Fair dealing means equitable (not necessarily identical) treatment of all clients.", 2),
        ("Standard III(C) Suitability requires that:", "Investment recommendations be appropriate for the client's situation", "All clients receive the same recommendations", "Only low-risk investments be recommended", "A", "Suitability: recommendations must match client objectives, risk tolerance, and constraints.", 2),
        ("Standard IV(A) Loyalty to Employer requires members to:", "Act for the benefit of their employer", "Share proprietary information with competitors", "Prioritize personal interests", "A", "Members owe loyalty to their employer, though client interests supersede.", 2),
        ("Standard V(A) Diligence and Reasonable Basis requires:", "A thorough analysis before making recommendations", "Quick decisions without research", "Following market consensus only", "A", "Members must have a reasonable and adequate basis for investment actions.", 2),
        ("Standard V(B) Communication with Clients requires:", "Disclosing the basic characteristics and risks of investments", "Providing only positive information", "Limiting communication to written reports", "A", "Members must communicate clearly about risks, limitations, and methodologies.", 2),
        ("Standard VI(A) Disclosure of Conflicts requires members to:", "Disclose all conflicts of interest to clients and employer", "Ignore minor conflicts", "Only disclose if asked", "A", "Full and fair disclosure of all conflicts of interest is required.", 2),
        ("Standard VI(B) Priority of Transactions states that:", "Client transactions take priority over personal transactions", "Personal trades are unrestricted", "Employer trades come first", "A", "Order: client transactions → employer → personal.", 2),
        ("Standard VII(A) Conduct as Participants in CFA Institute Programs requires:", "Not compromising the integrity of the CFA designation", "Sharing exam questions", "Misrepresenting CFA candidacy", "A", "Members must not engage in conduct that compromises the CFA Program's reputation.", 2),
        ("Standard VII(B) Reference to CFA Institute states:", "Members must not misrepresent their CFA status", "Anyone can claim CFA designation", "CFA can be used as a noun", "A", "CFA is an adjective (e.g., 'CFA charterholder'), never a noun. Must be accurate about status.", 1),
        ("Mosaic theory allows analysts to:", "Combine public and non-material nonpublic information to form conclusions", "Use material nonpublic information", "Ignore insider information regulations", "A", "Mosaic theory: combining public info and non-material non-public info is permissible.", 3),
        ("If local law and CFA standards conflict, a member should:", "Follow the stricter of the two", "Always follow local law", "Always follow CFA standards", "A", "Members must comply with the more restrictive requirement.", 2),
        ("A CFA member discovers their firm is violating securities law. They should:", "Dissociate from the activity and consider reporting", "Participate to maintain employment", "Ignore it as it's the firm's responsibility", "A", "Members must not participate in violations and should consider appropriate reporting.", 2),
        ("Soft dollar arrangements must:", "Benefit the client", "Only benefit the investment manager", "Be kept secret from clients", "A", "Soft dollar commissions must be used for research that benefits clients.", 2),
        ("Record retention under the Standards requires:", "Maintaining records to support investment actions and recommendations", "Destroying records after one year", "Keeping only profitable trade records", "A", "Members must maintain records that support their investment processes.", 2),
        ("Standard III(D) Performance Presentation requires:", "Fair, accurate, and complete presentation of performance", "Showing only the best-performing periods", "Presenting gross returns only", "A", "Performance must be presented fairly, without cherry-picking favorable periods.", 2),
        ("The duty of care under fiduciary standards means:", "Acting with the care a prudent person would exercise", "Taking maximum risk for maximum return", "Minimizing all costs regardless of quality", "A", "Prudent person rule: act with reasonable care, skill, and caution.", 2),
    ])

def _eth03():
    """Guidance for Standards I-VII"""
    return _generate_concept_questions("ETH", "Guidance Standards", [
        ("An analyst receives a gift from a company she covers. Under the Standards, she should:", "Disclose the gift to her employer and assess any conflict of interest", "Accept it without disclosure", "Reject all gifts regardless of value", "A", "Disclosure is required; gifts that could impair objectivity must be refused or disclosed.", 2),
        ("A portfolio manager trades ahead of a client order. This violates:", "Standard VI(B) Priority of Transactions (front-running)", "Standard III(B) Fair Dealing", "Both Standards VI(B) and III(B)", "C", "Front-running violates both priority of transactions and fair dealing.", 2),
        ("An analyst uses a quantitative model from a third party. Under Standard V(A), she must:", "Understand the model's assumptions and limitations", "Use it without question since it's from an expert", "Disclose only the model's name", "A", "Reasonable basis requires understanding any model used, even third-party ones.", 2),
        ("Selective disclosure of investment recommendations violates:", "Standard III(B) Fair Dealing", "Standard I(A) Knowledge of the Law", "Standard IV(A) Loyalty to Employer", "A", "Fair dealing requires equitable dissemination to all clients.", 2),
        ("Material information is information that:", "Would likely affect an investment decision or security price", "Is already known to all market participants", "Is only relevant to insiders", "A", "Material information can influence investment decisions or market prices.", 2),
        ("An analyst changes firms. She can:", "Use general knowledge and skills at the new firm", "Take proprietary research from the old firm", "Contact old firm clients using stolen lists", "A", "General skills and knowledge are portable; proprietary materials are not.", 2),
        ("Whistle-blowing under the Standards:", "May be appropriate when internal reporting fails", "Is never permitted", "Always violates employer loyalty", "A", "Reporting violations externally may be necessary when internal channels fail.", 3),
        ("A member managing a pension fund must:", "Consider the fund beneficiaries as the client", "Consider the plan sponsor as the sole client", "Prioritize personal interest", "A", "For pension funds, the beneficiaries are the ultimate clients.", 2),
        ("Performance presentation should include:", "All representative accounts and relevant disclosures", "Only the best-performing accounts", "Only institutional accounts", "A", "Cherry-picking favorable accounts violates fair presentation standards.", 2),
        ("The firewall between investment banking and research departments serves to:", "Prevent conflicts of interest and protect information", "Increase revenue", "Allow information sharing", "A", "Information barriers (Chinese walls) protect against MNPI sharing and conflicts.", 2),
        ("An analyst's personal investment in a company she covers:", "Must be disclosed", "Is never permitted", "Requires no disclosure if the position is small", "A", "Any personal ownership in covered securities must be disclosed.", 2),
        ("Under the Standards, investment recommendations should be:", "Suitable for the specific client", "The same for all clients", "Based solely on past performance", "A", "Suitability requires tailoring recommendations to each client's circumstances.", 2),
        ("A member discovers an error in a previous report. She should:", "Promptly correct and disclose the error", "Ignore it if it was unintentional", "Wait until the next report to fix it", "A", "Errors must be corrected promptly and transparently.", 2),
        ("Referral fees must be:", "Disclosed to clients", "Kept confidential", "Shared with regulators only", "A", "Standard VI(C) requires disclosure of referral fees to affected clients.", 2),
        ("Plagiarism under the Standards includes:", "Using others' work without attribution", "Only copying entire documents", "Properly citing sources", "A", "Any use of others' analysis without credit constitutes plagiarism.", 2),
        ("A supervised analyst provides misleading research. The supervisor:", "May also be in violation if they failed to supervise adequately", "Is never responsible", "Is only responsible if they signed the report", "A", "Supervisors must establish and enforce compliance procedures.", 2),
        ("When managing client assets, the prudent investor rule requires:", "Considering the portfolio as a whole rather than individual securities", "Minimizing all risk", "Investing only in government bonds", "A", "Prudent investor: evaluate each investment in the context of the total portfolio.", 2),
        ("An analyst recommends a stock to generate commissions. This violates:", "Standard III(A) Loyalty, Prudence, and Care", "Standard VII(A) CFA Program integrity", "No standard if the stock is suitable", "A", "Churning or recommending for commissions rather than client benefit violates fiduciary duty.", 2),
        ("Pre-dissemination of investment recommendations to select clients:", "Violates Standard III(B) Fair Dealing", "Is permitted for large clients", "Is standard practice", "A", "Selective early dissemination is unfair to other clients.", 2),
        ("Under the CFA Standards, the use of 'CFA' must:", "Follow specific usage guidelines as an adjective", "Be used freely as a noun", "Only appear on business cards", "A", "CFA is always an adjective: 'CFA charterholder' or 'CFA Program', never 'a CFA'.", 1),
    ])

def _eth04():
    """Introduction to GIPS"""
    return _generate_concept_questions("ETH", "GIPS", [
        ("GIPS are global standards for:", "Investment performance presentation", "Financial reporting", "Tax compliance", "A", "GIPS ensure fair, comparable investment performance presentation.", 1),
        ("GIPS compliance is:", "Voluntary for investment firms", "Required by law", "Required only for public firms", "A", "GIPS adoption is voluntary but demonstrates commitment to fair reporting.", 1),
        ("Under GIPS, returns must be calculated using:", "Time-weighted returns", "Money-weighted returns only", "Simple returns", "A", "GIPS requires time-weighted returns to minimize cash flow timing effects.", 2),
        ("A composite under GIPS is:", "A group of portfolios managed with a similar strategy", "A single portfolio", "A benchmark index", "A", "Composites aggregate portfolios with similar investment mandates.", 2),
        ("GIPS requires performance to be presented for a minimum of:", "5 years or since inception", "1 year", "10 years", "A", "GIPS: 5 years initially, building to 10 years.", 2),
        ("Under GIPS, firms must:", "Include all actual fee-paying discretionary portfolios in composites", "Exclude poor-performing portfolios", "Only include institutional portfolios", "A", "All fee-paying discretionary accounts must be in at least one composite (no cherry-picking).", 2),
        ("GIPS verification is:", "Performed by an independent third party", "Self-verified by the firm", "Required by regulators", "A", "Verification is voluntary and performed by independent verifiers.", 2),
        ("Returns must be presented on a:", "After-fees basis at minimum, with gross also recommended", "Before-fees basis only", "Net of all expenses basis", "A", "GIPS recommends both gross and net; net is minimum requirement.", 2),
        ("Portability under GIPS refers to:", "Taking performance records when professionals change firms", "Moving client accounts between firms", "Transferring software", "A", "Portability: conditions for linking track records when personnel move.", 3),
        ("Terminated portfolios must:", "Be included in composite history through the last full period", "Be removed from all historical records", "Be excluded from reporting", "A", "Survivorship bias is avoided by keeping terminated accounts in historical composites.", 2),
        ("GIPS applies to:", "Investment management firms", "Individual analysts", "Regulatory bodies", "A", "GIPS is a firm-level standard for investment managers.", 1),
        ("The purpose of composites is to:", "Prevent cherry-picking of favorable portfolios", "Simplify reporting", "Reduce the number of portfolios", "A", "Composites ensure all similar portfolios are represented, preventing selection bias.", 2),
        ("New portfolios must be added to composites:", "Within a reasonable timeframe, typically at the start of the next full period", "After one year of performance", "Only if they outperform", "A", "New accounts enter composites promptly, not selectively.", 2),
        ("GIPS-compliant firms must disclose:", "Their definition of the firm and list of composites", "Only total firm assets", "Nothing beyond returns", "A", "Disclosure requirements include firm definition, composite descriptions, and policies.", 2),
        ("Simulated or model performance:", "Must not be linked to actual performance", "Can replace actual results", "Is treated the same as actual", "A", "GIPS prohibits mixing hypothetical/model results with actual performance.", 2),
        ("Benchmarks in GIPS presentations should be:", "Appropriate to the composite strategy", "The highest-returning index available", "Optional and not required", "A", "Benchmark selection should reflect the composite's investment strategy.", 2),
        ("Trade date accounting under GIPS means:", "Recording transactions on the date they are executed", "Recording on settlement date", "Recording on the month-end date", "A", "GIPS requires trade-date (not settlement-date) accounting.", 2),
        ("Real estate and private equity have:", "Separate GIPS provisions due to their unique characteristics", "The same provisions as equity composites", "No GIPS guidance", "A", "GIPS has specific provisions for alternative asset classes.", 2),
        ("A firm claiming GIPS compliance must:", "Comply with all applicable requirements", "Comply with only key provisions", "Partially comply and disclose non-compliance", "A", "GIPS requires full compliance; partial compliance claims are not allowed.", 2),
        ("The dispersion of returns within a composite is reported to:", "Show the range of portfolio returns within the composite", "Demonstrate superior performance", "Replace benchmark comparisons", "A", "Dispersion measures how individual portfolio returns vary within the composite.", 2),
    ])

def _eth05():
    """Ethics Application"""
    return _generate_concept_questions("ETH", "Ethics Application", [
        ("An analyst recommends a stock she personally owns. She is most likely required to:", "Disclose the ownership to clients", "Sell her position before recommending", "Not recommend stocks she owns", "A", "Disclosure of conflicts (personal holdings) is required.", 2),
        ("A manager allocates hot IPO shares to his personal account first. This violates:", "Standard VI(B) Priority of Transactions", "Standard I(A) Knowledge of the Law", "Standard V(B) Communication", "A", "Personal accounts cannot take priority over client accounts.", 2),
        ("Adjusting model assumptions to match a desired conclusion violates:", "Standard V(A) Diligence and Reasonable Basis", "Standard VII(B) Reference to CFA", "No standard if the conclusion is correct", "A", "Manipulating inputs to produce a predetermined result lacks reasonable basis.", 2),
        ("A CFA candidate discusses specific exam questions online. This violates:", "Standard VII(A) Conduct as Participants in CFA Institute Programs", "Standard I(B) Independence", "No standard since the exam is over", "A", "Sharing exam content compromises CFA Program integrity.", 2),
        ("An analyst copies a model from another firm without attribution. This violates:", "Standard I(C) Misrepresentation (plagiarism)", "Standard IV(A) Loyalty", "Standard III(C) Suitability", "A", "Using others' work without attribution is plagiarism.", 2),
        ("A portfolio manager simultaneously trades a thinly traded stock for her account and a client. She should:", "Ensure the client's order is executed first", "Execute both simultaneously", "Trade her personal account first", "A", "Client trades take priority; front-running is prohibited.", 2),
        ("An analyst learns material nonpublic information at a social event. She should:", "Refrain from trading or sharing the information", "Trade before the information becomes public", "Share only with her portfolio manager", "A", "MNPI must not be acted upon or shared until publicly disseminated.", 2),
        ("A member is pressured by his employer to issue a favorable recommendation. He should:", "Maintain objectivity regardless of pressure", "Comply with the employer's request", "Issue a neutral recommendation as a compromise", "A", "Standard I(B) Independence and Objectivity must be maintained.", 2),
        ("Backdating trade confirmations to show better performance violates:", "Standard I(C) Misrepresentation", "Standard IV(B) Additional Compensation", "Standard III(D) Performance Presentation", "C", "Backdating misrepresents actual performance.", 2),
        ("A CFA charterholder states 'I am a CFA.' This:", "Violates Standard VII(B) Reference to CFA Institute", "Is acceptable usage", "Is only wrong on business cards", "A", "CFA must be used as an adjective ('CFA charterholder'), not a noun.", 1),
        ("An analyst writes a report largely based on another analyst's work. She attributes it to herself. This violates:", "Standard I(C) Misrepresentation", "Standard V(A) Diligence", "Standard III(B) Fair Dealing", "A", "Claiming others' work as your own is misrepresentation/plagiarism.", 2),
        ("A compliance officer discovers suspicious trading patterns but takes no action. This may violate:", "Standard IV(C) Responsibilities of Supervisors", "Standard I(B) Independence", "No standard applies", "A", "Supervisors must act on compliance red flags.", 2),
        ("A manager invests client funds in a friend's startup without proper analysis. This violates:", "Standard V(A) Diligence and Reasonable Basis", "Standard VII(B) Reference to CFA", "Standard IV(B) Additional Compensation", "A", "Investing without thorough analysis violates the reasonable basis requirement.", 2),
        ("An analyst provides different recommendations to different clients solely based on fee size. This violates:", "Standard III(B) Fair Dealing", "Standard VI(A) Disclosure of Conflicts", "Standard I(A) Knowledge of the Law", "A", "Fair dealing prohibits discriminatory treatment based on fees.", 2),
        ("A member receives compensation from a third party for referrals. Under the Standards:", "This must be disclosed to affected clients and the employer", "This is prohibited in all cases", "This requires only employer disclosure", "A", "Both client and employer disclosure is required for referral arrangements.", 2),
        ("A member on a company's board receives MNPI during a board meeting. She:", "Must restrict trading in that company's securities", "Can trade since she's a board member", "Should resign from the board", "A", "Board membership doesn't exempt from MNPI trading restrictions.", 2),
        ("An analyst issues a buy recommendation on a stock his firm is underwriting. This most likely violates:", "Standard I(B) Independence and Objectivity", "Standard VII(A) CFA Program conduct", "No standard if the analysis supports it", "A", "Investment banking relationships create conflicts that threaten objectivity.", 2),
        ("Using misleading benchmarks in performance reports violates:", "Standard III(D) Performance Presentation", "Standard IV(A) Loyalty", "Standard II(A) MNPI", "A", "Performance must be presented fairly with appropriate benchmarks.", 2),
        ("A CFA candidate states 'I expect to receive the CFA charter next year.' This:", "May violate Standard VII(B) if it implies guaranteed passage", "Is always acceptable", "Is never acceptable", "A", "Members must not imply guaranteed completion of the CFA Program.", 2),
        ("When there is a conflict between employer interests and client interests:", "Client interests take precedence", "Employer interests take precedence", "The member should resign", "A", "Standard III(A): Clients' interests always come first.", 1),
    ])

# ──────────────────────────────────────────────────────────────
# FIXED INCOME
# ──────────────────────────────────────────────────────────────

def _fi_questions(module_num, title, concepts):
    """Generate FI module questions."""
    return _generate_concept_questions("FI", title, concepts)

FI_MODULES = {
    1: ("Fixed-Income Instrument Features", [
        ("A bond's par value is also known as its:", "Face value or principal", "Market price", "Coupon rate", "A", "Par value = face value = the amount repaid at maturity.", 1),
        ("A coupon rate is the:", "Annual interest rate paid on a bond's face value", "Yield to maturity", "Current yield", "A", "Coupon rate determines the periodic interest payment.", 1),
        ("A zero-coupon bond:", "Pays no periodic interest and is sold at a discount", "Pays interest monthly", "Has a floating rate", "A", "Zero-coupon bonds provide return solely through price appreciation.", 1),
        ("The indenture of a bond is:", "The legal contract between issuer and bondholders", "The coupon payment schedule", "The credit rating", "A", "The indenture specifies all terms and covenants of the bond.", 2),
        ("An embedded option in a bond refers to:", "A provision that gives the issuer or bondholder certain rights", "The bond's credit rating", "The bond's tax treatment", "A", "Embedded options include call, put, and conversion features.", 2),
        ("A callable bond can be:", "Redeemed by the issuer before maturity", "Sold by the bondholder back to the issuer", "Converted to equity", "A", "A call option benefits the issuer by allowing early redemption.", 2),
        ("A putable bond can be:", "Sold back to the issuer by the bondholder before maturity", "Called by the issuer", "Converted to a floating rate", "A", "A put option benefits the bondholder by allowing early sale.", 2),
        ("Covenants in a bond indenture are:", "Restrictions placed on the issuer to protect bondholders", "Payment schedules", "Tax provisions", "A", "Covenants limit issuer actions (negative) or require actions (affirmative).", 2),
        ("An affirmative covenant requires the issuer to:", "Take specific actions like maintaining insurance", "Refrain from certain actions", "Pay higher coupons", "A", "Affirmative covenants specify what the issuer must do.", 2),
        ("A negative covenant restricts the issuer from:", "Taking certain actions like issuing additional debt", "Making coupon payments", "Reporting financial results", "A", "Negative covenants limit issuer actions that could harm bondholders.", 2),
        ("The maturity of a bond is:", "The date when the principal is repaid", "The first coupon payment date", "The date the bond was issued", "A", "Maturity = the date the issuer repays the face value.", 1),
        ("A floating-rate note has:", "A coupon that adjusts periodically based on a reference rate", "A fixed coupon", "No coupon payments", "A", "FRN coupons reset based on rates like SOFR plus a spread.", 2),
        ("Bonds with credit enhancements:", "Have features that reduce credit risk for investors", "Always have higher yields", "Cannot default", "A", "Credit enhancements (guarantees, collateral) reduce perceived risk.", 2),
        ("Subordinated debt:", "Has lower priority than senior debt in case of default", "Is always risk-free", "Has higher priority in liquidation", "A", "Subordinated bondholders are paid after senior creditors.", 2),
        ("A sinking fund provision:", "Requires the issuer to retire portions of the bond over time", "Allows the issuer to increase the outstanding amount", "Converts bonds to equity", "A", "Sinking funds reduce credit risk by ensuring gradual principal repayment.", 2),
        ("Bearer bonds:", "Are owned by whoever holds the physical certificate", "Must be registered with the issuer", "Cannot be traded", "A", "Bearer bonds are unregistered; possession implies ownership.", 2),
        ("A dual-currency bond:", "Makes coupon payments in one currency and principal in another", "Can only be traded in two markets", "Has two maturity dates", "A", "Dual-currency bonds involve two different currencies for payments.", 3),
        ("A perpetual bond:", "Has no maturity date", "Matures in one year", "Is always zero-coupon", "A", "Perpetual bonds pay coupons indefinitely with no principal repayment.", 2),
        ("The legal and regulatory framework for bonds:", "Varies across jurisdictions", "Is identical globally", "Only applies to government bonds", "A", "Bond regulations differ significantly by country and issuer type.", 2),
        ("An amortizing bond:", "Repays principal through periodic payments over the bond's life", "Repays all principal at maturity", "Has no principal payment", "A", "Amortizing bonds reduce principal gradually, unlike bullet bonds.", 2),
    ]),
    2: ("Fixed-Income Cash Flows and Types", [
        ("A bullet bond repays principal:", "Entirely at maturity", "In equal installments", "Through a sinking fund", "A", "Bullet maturity: full principal returned at maturity date.", 1),
        ("A fully amortizing bond:", "Has equal payments covering both interest and principal", "Makes interest-only payments", "Has no coupon", "A", "Fully amortizing loans have level payments like residential mortgages.", 2),
        ("Step-up coupon bonds have:", "Coupon rates that increase at specified dates", "Fixed coupon rates", "Decreasing coupons over time", "A", "Step-up bonds have pre-scheduled coupon increases.", 2),
        ("Deferred coupon bonds:", "Do not pay interest for an initial period", "Pay double coupons initially", "Have floating rates", "A", "Deferred coupon bonds delay initial interest payments.", 2),
        ("Payment-in-kind bonds:", "Can pay interest with additional bonds instead of cash", "Always pay cash coupons", "Are zero-coupon bonds", "A", "PIK bonds may pay interest in the form of additional securities.", 2),
        ("The cash flows of a floating-rate note are:", "Uncertain because the coupon resets periodically", "Completely fixed at issuance", "Always equal to par", "A", "FRN cash flows vary with reference rate changes.", 2),
        ("An index-linked bond:", "Has cash flows tied to an index such as inflation", "Is linked to a stock index", "Has a fixed real return", "A", "Inflation-linked bonds adjust payments for purchasing power changes.", 2),
        ("TIPS (Treasury Inflation-Protected Securities) adjust:", "The principal based on the CPI", "The coupon rate only", "Neither principal nor coupon", "A", "TIPS adjust par value with CPI; coupon rate stays fixed but is applied to adjusted principal.", 2),
        ("Credit-linked notes:", "Have cash flows contingent on a credit event", "Are risk-free government bonds", "Always pay fixed coupons", "A", "Credit-linked notes expose investors to the credit risk of a reference entity.", 3),
        ("Cap and floor on floating-rate notes:", "Limit the maximum and minimum coupon rates", "Set the maturity date", "Determine the credit rating", "A", "Caps protect issuers; floors protect investors from rate movements.", 2),
        ("An inverse floating-rate note:", "Has a coupon that moves opposite to the reference rate", "Has a coupon that moves with the reference rate", "Has a fixed coupon", "A", "Inverse floaters: coupon = fixed rate - reference rate.", 3),
        ("Contingent convertible bonds (CoCos):", "Convert to equity when a trigger event occurs", "Are always converted at maturity", "Cannot be converted", "A", "CoCos automatically convert when the issuer's capital falls below a threshold.", 3),
        ("A perpetuity has cash flows that:", "Continue indefinitely", "End after 30 years", "Decrease over time", "A", "Perpetuities pay constant cash flows forever.", 1),
        ("The reference rate for a floating-rate note is most commonly:", "A short-term money market rate like SOFR", "The prime rate", "The 30-year Treasury yield", "A", "FRNs typically reference short-term rates like SOFR, EURIBOR.", 2),
        ("A zero-coupon bond's only cash flow is:", "The return of par value at maturity", "Quarterly interest payments", "A floating coupon", "A", "Zero-coupon bonds have a single cash flow: face value at maturity.", 1),
        ("Callable bonds typically offer:", "Higher coupon rates than non-callable bonds", "Lower coupon rates", "The same coupon rates", "A", "Investors demand higher coupons to compensate for call risk.", 2),
        ("Putable bonds typically offer:", "Lower yields than comparable non-putable bonds", "Higher yields", "The same yields", "A", "The put option benefits the holder, so they accept lower yields.", 2),
        ("The accrued interest on a bond is:", "Interest earned since the last coupon payment", "The total coupon for the year", "The yield to maturity", "A", "Accrued interest = coupon earned between payment dates, paid by the buyer.", 2),
        ("A convertible bond can be:", "Exchanged for a specified number of shares of the issuer", "Exchanged for government bonds", "Called by the bondholder", "A", "Convertible bonds give the holder the right to convert to equity.", 2),
        ("Stripped securities are created by:", "Separating bond cash flows into principal and interest components", "Combining multiple bonds", "Adding credit enhancements", "A", "Stripping separates coupon and principal into individual zero-coupon instruments.", 2),
    ]),
}

# Generate remaining FI modules with domain-specific concepts
for fi_num in range(3, 11):
    titles_and_concepts = {
        3: ("Fixed-Income Issuance and Trading", [
            ("The primary market for bonds refers to:", "The market where new bonds are initially sold", "The market where bonds are traded after issuance", "The derivatives market", "A", "Primary market = initial issuance; secondary market = subsequent trading.", 1),
            ("An underwriter in a bond issuance:", "Purchases bonds from the issuer and resells them to investors", "Only advises the issuer", "Buys bonds in the secondary market", "A", "Underwriters bear the risk of distribution in firm commitment offerings.", 2),
            ("Best efforts underwriting means:", "The underwriter will try to sell the bonds but doesn't guarantee all will be sold", "The underwriter buys all bonds", "The issuer sells directly to investors", "A", "Best efforts: underwriter acts as agent, no guarantee of full placement.", 2),
            ("The secondary market for bonds is mostly:", "Over-the-counter (OTC)", "Exchange-traded", "Conducted through auctions", "A", "Most bonds trade OTC through dealer networks, not on exchanges.", 2),
            ("A syndicate in bond issuance is:", "A group of underwriters that share the risk of distribution", "A single dealer", "A regulatory body", "A", "Syndicates distribute the underwriting risk among multiple banks.", 2),
            ("A shelf registration allows issuers to:", "Register securities in advance for later issuance", "Avoid all regulatory requirements", "Issue unlimited bonds", "A", "Shelf registration enables flexible timing of issuance over a period.", 2),
            ("An auction process for government bonds:", "Allows competitive and non-competitive bidding", "Is only for institutional investors", "Sets a fixed price for all bonds", "A", "Government auctions accept both competitive (bid yield) and non-competitive bids.", 2),
            ("Bid-ask spread in bond trading represents:", "The dealer's compensation for providing liquidity", "The bond's coupon", "The credit spread", "A", "Bid-ask spread = dealer profit = ask price - bid price.", 1),
            ("A private placement bond:", "Is sold directly to a limited number of institutional investors", "Is publicly traded", "Must be registered with the SEC", "A", "Private placements bypass public registration requirements.", 2),
            ("Settlement in the bond market typically occurs:", "T+1 or T+2 depending on the market", "Immediately", "T+30", "A", "Most bond markets settle within 1-2 business days after trade date.", 2),
            ("A green bond is issued to:", "Finance environmentally beneficial projects", "Provide higher yields", "Fund any corporate purpose", "A", "Green bonds earmark proceeds for climate and environmental projects.", 1),
            ("Sovereign bonds are issued by:", "National governments", "Corporations", "Municipalities only", "A", "Sovereign bonds are direct obligations of a country's national government.", 1),
            ("Corporate bonds are typically rated by:", "Credit rating agencies such as S&P, Moody's, and Fitch", "The issuing company itself", "Central banks", "A", "Independent rating agencies assess creditworthiness of corporate issuers.", 1),
            ("Investment-grade bonds are rated:", "BBB-/Baa3 or higher", "BB+/Ba1 or higher", "Below BBB-", "A", "Investment grade: BBB- (S&P) / Baa3 (Moody's) minimum.", 2),
            ("High-yield bonds are also called:", "Junk bonds", "Treasury bonds", "Municipal bonds", "A", "High-yield (below investment grade) bonds carry higher default risk.", 1),
            ("The Bloomberg Barclays Global Aggregate Index:", "Is a major global bond benchmark", "Only includes US bonds", "Tracks equity performance", "A", "The Global Aggregate is a widely-used multi-sector global bond benchmark.", 2),
            ("Electronic trading platforms have:", "Increased transparency and reduced transaction costs in bond markets", "Decreased bond market liquidity", "Eliminated OTC trading", "A", "Electronic platforms improve price discovery and reduce trading costs.", 2),
            ("A medium-term note (MTN) program:", "Allows continuous issuance of bonds with varying maturities", "Issues only 5-year bonds", "Is limited to government issuers", "A", "MTN programs provide flexible, ongoing access to debt capital markets.", 2),
            ("The coupon rate on a new bond is primarily determined by:", "Prevailing market interest rates and the issuer's credit quality", "The bond's maturity only", "Past coupon rates on similar bonds", "A", "Market rates and credit risk are the primary determinants of coupon rates.", 2),
            ("A bond with an original issue discount (OID):", "Is issued below par value", "Is issued above par value", "Is issued at par", "A", "OID bonds are sold below face value; the discount accretes to par over time.", 2),
        ]),
        4: ("Fixed-Income Markets for Corporate Issuers", [
            ("Secured corporate bonds have:", "Specific assets pledged as collateral", "No collateral backing", "Government guarantee", "A", "Secured bonds have specific assets backing them, reducing credit risk.", 2),
            ("A mortgage bond is secured by:", "Real estate or property", "Accounts receivable", "Inventory", "A", "Mortgage bonds are backed by a lien on real property.", 2),
            ("Debentures are:", "Unsecured corporate bonds backed only by general creditworthiness", "Always secured by assets", "Government bonds", "A", "Debentures are unsecured; they rely on the issuer's credit quality.", 2),
            ("The priority of claims in bankruptcy (highest to lowest) is:", "Secured debt, senior unsecured, subordinated, equity", "Equity, subordinated, senior unsecured, secured", "All claims are equal", "A", "Absolute priority: secured > senior unsecured > subordinated > equity.", 2),
            ("Commercial paper is:", "Short-term unsecured corporate debt typically maturing in less than 270 days", "Long-term corporate bonds", "Government securities", "A", "CP is a money market instrument used for short-term financing.", 2),
            ("A credit spread represents:", "The yield difference between a corporate bond and a comparable government bond", "The coupon rate", "The bid-ask spread", "A", "Credit spread = corporate yield - risk-free yield, compensating for default risk.", 2),
            ("Bank loans differ from bonds primarily in:", "Being typically negotiated with a smaller group of lenders", "Having longer maturities", "Being publicly traded", "A", "Bank loans are private, negotiated instruments; bonds are typically more standardized.", 2),
            ("A leveraged loan is:", "A loan to a company with high levels of existing debt", "A government-guaranteed loan", "A loan at below-market rates", "A", "Leveraged loans are to highly indebted (often below investment grade) borrowers.", 2),
            ("Collateralized loan obligations (CLOs) are:", "Structured products backed by a pool of leveraged loans", "Individual corporate bonds", "Government securities", "A", "CLOs securitize pools of leveraged loans into tranches.", 3),
            ("The recovery rate on a defaulted bond is:", "The percentage of par value recovered by bondholders", "Always 100%", "The coupon rate", "A", "Recovery rates vary by seniority; secured debt typically recovers more.", 2),
            ("Investment-grade corporate bonds typically have:", "Lower yields and lower default risk than high-yield bonds", "Higher yields", "No credit ratings", "A", "Higher credit quality = lower yield = lower default probability.", 1),
            ("Fallen angels are bonds that:", "Were originally investment grade but downgraded to high yield", "Are newly issued high-yield bonds", "Have been called", "A", "Fallen angels were downgraded from investment grade to speculative.", 2),
            ("Rising stars are bonds that:", "Were originally high yield but upgraded to investment grade", "Are newly issued investment-grade bonds", "Have increasing coupons", "A", "Rising stars are upgraded from high yield to investment grade.", 2),
            ("Cross-default provisions mean:", "Default on one obligation triggers default on other obligations", "Only one bond can default at a time", "Defaults are limited to one jurisdiction", "A", "Cross-default: defaulting on any debt can trigger defaults across all debt.", 2),
            ("The yield on a corporate bond includes compensation for:", "Credit risk, liquidity risk, and term premium", "Only credit risk", "Only interest rate risk", "A", "Corporate bond yields include multiple risk premiums above the risk-free rate.", 2),
            ("A make-whole call provision:", "Requires the issuer to pay a premium based on present value of remaining cash flows", "Allows the issuer to call at par", "Gives bondholders a put option", "A", "Make-whole calls compensate bondholders for reinvestment risk when bonds are called.", 3),
            ("Maintenance covenants:", "Require the issuer to meet financial thresholds on an ongoing basis", "Only apply at the time of issuance", "Are found only in bonds, not loans", "A", "Maintenance covenants are tested regularly (common in loans).", 2),
            ("Incurrence covenants:", "Are triggered only when the issuer takes specific actions", "Are tested regularly", "Are stricter than maintenance covenants", "A", "Incurrence covenants only apply when the issuer proposes an action (common in bonds).", 3),
            ("A credit facility:", "Is an arrangement with a bank to provide funding", "Is a type of bond", "Has no credit risk", "A", "Credit facilities (revolvers, term loans) provide flexible bank financing.", 2),
            ("Covenants benefit bondholders by:", "Restricting issuer actions that could increase risk", "Increasing the coupon rate", "Guaranteeing principal repayment", "A", "Covenants provide protective limits on issuer behavior.", 2),
        ]),
        5: ("Fixed-Income Markets for Government Issuers", [
            ("Treasury bills are:", "Short-term government securities sold at a discount with no coupon", "Long-term government bonds", "Corporate securities", "A", "T-bills mature in one year or less, issued at a discount to face value.", 1),
            ("Treasury notes have maturities of:", "2 to 10 years", "Less than 1 year", "Over 30 years", "A", "T-notes: 2-10 year maturities with semiannual coupons.", 1),
            ("Treasury bonds have maturities of:", "More than 10 years (typically 20 or 30 years)", "1 to 5 years", "Less than 1 year", "A", "T-bonds are long-term government securities, usually 20-30 years.", 1),
            ("On-the-run securities are:", "The most recently issued Treasury securities of a given maturity", "Off-the-run older issues", "Corporate bonds", "A", "On-the-run issues are the most liquid, recently auctioned Treasuries.", 2),
            ("Sovereign debt risk depends on:", "The government's ability and willingness to pay", "Only the country's GDP", "The currency denomination only", "A", "Sovereign risk = capacity (economic) + willingness (political) to repay.", 2),
            ("Agency bonds are issued by:", "Government-sponsored enterprises (GSEs)", "The Treasury directly", "Private corporations", "A", "GSEs like Fannie Mae and Freddie Mac issue agency securities.", 2),
            ("A government yield curve shows:", "Yields across different maturities for government bonds", "Corporate bond yields", "Stock market returns", "A", "The yield curve plots risk-free rates across the maturity spectrum.", 1),
            ("Inflation-indexed government bonds protect investors from:", "Unexpected inflation eroding purchasing power", "Interest rate changes", "Credit risk", "A", "Inflation-linked bonds adjust principal or coupons for actual inflation.", 2),
            ("Fiscal policy impacts government bond supply because:", "Budget deficits require more borrowing", "Tax cuts reduce bond issuance", "Surpluses increase borrowing needs", "A", "Larger deficits → more government bond issuance to finance spending.", 2),
            ("Central bank open market operations involve:", "Buying and selling government securities to manage money supply", "Issuing new bonds", "Setting tax rates", "A", "Central banks buy/sell Treasuries to implement monetary policy.", 2),
            ("Non-sovereign government bonds include:", "Bonds issued by states, provinces, and municipalities", "Only federal government bonds", "Corporate bonds", "A", "Non-sovereign: regional/local governments, quasi-government entities.", 1),
            ("The risk-free rate is typically proxied by:", "Short-term government T-bill yields", "Corporate bond yields", "The prime rate", "A", "T-bill yields approximate the risk-free rate due to minimal default risk.", 1),
            ("Eurobonds are:", "Bonds issued in a currency different from the issuer's home currency", "Bonds denominated in euros", "Only European government bonds", "A", "Eurobonds are international bonds issued in a foreign currency.", 2),
            ("Quasi-government bonds:", "Are issued by entities with implicit or explicit government backing", "Have no government connection", "Are always risk-free", "A", "Quasi-government entities (agencies, GSEs) may have implied government support.", 2),
            ("Government bond auctions determine:", "The yield and allocation of newly issued securities", "Secondary market prices", "Credit ratings", "A", "Auctions set the initial yield through competitive bidding.", 2),
            ("A benchmark government bond is:", "Widely used as a reference for pricing other bonds", "The lowest-yielding bond available", "A corporate bond", "A", "Benchmark bonds are highly liquid government issues used as pricing references.", 2),
            ("The term structure of interest rates is influenced by:", "Expectations, term premium, and market segmentation", "Only inflation expectations", "Only supply and demand", "A", "Multiple theories explain the yield curve shape: expectations, liquidity preference, segmentation.", 2),
            ("Local currency sovereign debt:", "Is denominated in the issuer's own currency", "Is denominated in a foreign currency", "Has no currency risk for domestic investors", "A", "Local currency debt: issued and repaid in the domestic currency.", 1),
            ("Foreign currency sovereign debt:", "Exposes the issuer to currency mismatch risk", "Eliminates all risk", "Is always denominated in USD", "A", "Foreign currency debt creates FX risk for the sovereign issuer.", 2),
            ("Government bond yields in developed markets are influenced by:", "Central bank policy, inflation expectations, and economic growth", "Only credit risk", "Only supply factors", "A", "DM government yields reflect macro factors: policy rates, inflation, growth outlook.", 2),
        ]),
    }
    for remaining_fi in range(6, 11):
        if remaining_fi not in titles_and_concepts:
            pass
    if fi_num in titles_and_concepts:
        FI_MODULES[fi_num] = titles_and_concepts[fi_num]

# Add FI modules 6-10
_fi_6_10 = {
    6: ("Fixed-Income Bond Valuation", [
        ("A bond's price is the:", "Present value of all future cash flows", "Sum of all coupon payments", "Future value at maturity", "A", "Bond price = PV of coupons + PV of par value.", 1),
        ("When market yield equals the coupon rate, the bond trades at:", "Par", "A premium", "A discount", "A", "At par: coupon rate = market yield → price = face value.", 1),
        ("When market yield exceeds the coupon rate, the bond trades at:", "A discount", "A premium", "Par", "A", "Discount bond: market yield > coupon rate → price < par.", 1),
        ("When market yield is below the coupon rate, the bond trades at:", "A premium", "A discount", "Par", "A", "Premium bond: market yield < coupon rate → price > par.", 1),
        ("As a bond approaches maturity, its price:", "Converges toward par value (pull to par effect)", "Always increases", "Always decreases", "A", "Regardless of premium or discount, price converges to par at maturity.", 2),
        ("The relationship between bond price and yield is:", "Inverse and convex", "Direct and linear", "Inverse and linear", "A", "Bond prices fall when yields rise, and the relationship is curved (convex).", 2),
        ("A bond's full price (dirty price) includes:", "Accrued interest plus the flat (clean) price", "Only the clean price", "Only accrued interest", "A", "Full/dirty price = clean price + accrued interest.", 2),
        ("The flat price (clean price) of a bond:", "Does not include accrued interest", "Includes accrued interest", "Is always equal to par", "A", "Clean price = quoted price = dirty price - accrued interest.", 2),
        ("For a 10% coupon bond with face value $1,000, the annual coupon is:", "$100", "$10", "$1,000", "A", "Annual coupon = coupon rate × face value = 10% × $1,000 = $100.", 1),
        ("If yields increase, bond prices:", "Decrease", "Increase", "Remain unchanged", "A", "Inverse relationship: higher yields → lower bond prices.", 1),
        ("The price of a zero-coupon bond equals:", "The present value of the face value at maturity", "The face value", "The sum of coupon payments", "A", "Zero-coupon: price = par / (1+y)^n.", 2),
        ("Matrix pricing is used to:", "Estimate the price of an illiquid bond from comparable bonds", "Calculate yield to maturity", "Determine credit ratings", "A", "Matrix pricing uses yields of similar traded bonds to value illiquid ones.", 3),
        ("Bond pricing using spot rates:", "Discounts each cash flow at the appropriate zero-coupon rate", "Uses a single yield for all cash flows", "Ignores the term structure", "A", "Spot rate pricing matches each cash flow's maturity to its specific rate.", 3),
        ("A par curve shows:", "Yields on coupon bonds priced at par across maturities", "Zero-coupon yields", "Forward rates", "A", "Par curve: yields that make coupon bonds trade at par for each maturity.", 3),
        ("Arbitrage-free bond pricing ensures:", "No risk-free profit can be earned from price discrepancies", "All bonds have the same price", "Yields are always positive", "A", "Arbitrage-free pricing: bonds are valued using no-arbitrage spot rates.", 3),
        ("For two bonds with the same maturity, the one with the higher coupon:", "Has less price sensitivity to yield changes", "Has more price sensitivity", "Has the same sensitivity", "A", "Higher coupons = shorter duration = less price sensitivity.", 2),
        ("The day count convention for US Treasury bonds is:", "Actual/actual", "30/360", "Actual/365", "A", "US Treasuries use actual/actual for accrued interest calculations.", 2),
        ("The price value of a basis point (PVBP):", "Measures the price change for a 1 basis point yield change", "Is the bond's coupon", "Is always $1", "A", "PVBP = price sensitivity to a 0.01% yield change.", 3),
        ("When a bond is between coupon dates, the buyer pays:", "The full (dirty) price including accrued interest", "Only the clean price", "Only the next coupon", "A", "The buyer compensates the seller for interest earned since last coupon.", 2),
        ("Reinvestment risk for a coupon bond is:", "The risk that coupons are reinvested at lower rates", "The risk the issuer defaults", "The risk of inflation", "A", "Reinvestment risk: actual return may differ from YTM if reinvestment rates change.", 2),
    ]),
    7: ("Yield and Yield Spread Measures", [
        ("Yield to maturity (YTM) is:", "The discount rate that equates bond price with PV of all cash flows", "The current coupon rate", "The annual income divided by price", "A", "YTM is the IRR of the bond's cash flows given its market price.", 2),
        ("Current yield is calculated as:", "Annual coupon / Market price", "Coupon / Par value", "YTM / Price", "A", "Current yield = annual coupon income ÷ current market price.", 1),
        ("The spread over a benchmark yield is called a:", "G-spread or benchmark spread", "Current yield", "Coupon rate", "A", "G-spread = corporate bond yield - government benchmark yield.", 2),
        ("The Z-spread is:", "The constant spread added to each spot rate to equate price with PV of cash flows", "The yield difference between two bonds", "The zero-coupon yield", "A", "Z-spread is added to each point on the spot rate curve.", 3),
        ("The option-adjusted spread (OAS):", "Removes the value of embedded options from the Z-spread", "Includes option value", "Is always greater than the Z-spread", "A", "OAS = Z-spread - option cost; it isolates credit/liquidity spread.", 3),
        ("For a callable bond, the OAS is:", "Less than the Z-spread", "Greater than the Z-spread", "Equal to the Z-spread", "A", "OAS < Z-spread for callables because the call option benefits the issuer (positive option cost).", 3),
        ("For a putable bond, the OAS is:", "Greater than the Z-spread", "Less than the Z-spread", "Equal to the Z-spread", "A", "OAS > Z-spread for putables because the put option benefits the holder (negative option cost).", 3),
        ("Yield to call is:", "The yield assuming the bond is called at the first call date", "The yield assuming the bond is held to maturity", "The coupon rate", "A", "YTC uses the call price and call date instead of par and maturity.", 2),
        ("Yield to worst is:", "The lowest of YTM, YTC, and other possible yields", "The highest possible yield", "The average of all yields", "A", "YTW = the minimum yield across all possible call/put scenarios.", 2),
        ("A bond equivalent yield (BEY) converts:", "Non-semiannual yields to a semiannual basis", "Annual yields to monthly", "Nominal to real yields", "A", "BEY standardizes yields to semiannual compounding for comparison.", 2),
        ("The I-spread is:", "The yield spread over the swap rate curve", "The yield spread over Treasuries", "The inflation-adjusted spread", "A", "I-spread = bond yield - interpolated swap rate for same maturity.", 2),
        ("A nominal spread is the difference between:", "A bond's YTM and a benchmark bond's YTM", "Two coupon rates", "The bid and ask yield", "A", "Nominal/G-spread = YTM(corporate) - YTM(government benchmark).", 2),
        ("The credit spread on a corporate bond compensates for:", "Default risk and loss given default", "Interest rate risk only", "Liquidity risk only", "A", "Credit spread reflects expected loss from default.", 2),
        ("Yield spreads tend to widen during:", "Economic recessions and financial stress", "Economic expansions", "Central bank easing", "A", "Credit spreads increase during downturns as default risk rises.", 2),
        ("The term structure of credit spreads:", "Generally slopes upward for investment-grade bonds", "Is always flat", "Slopes downward for all bonds", "A", "IG credit spreads typically increase with maturity (more time = more uncertainty).", 3),
        ("A basis point is equal to:", "0.01%", "0.1%", "1%", "A", "1 bp = 0.01% = 0.0001.", 1),
        ("For a discount bond, the ranking from lowest to highest is:", "Coupon rate < current yield < YTM", "YTM < current yield < coupon rate", "Current yield < coupon rate < YTM", "A", "Discount bond: coupon rate < current yield < YTM.", 2),
        ("For a premium bond, the ranking from lowest to highest is:", "YTM < current yield < coupon rate", "Coupon rate < current yield < YTM", "Current yield < YTM < coupon rate", "A", "Premium bond: YTM < current yield < coupon rate.", 2),
        ("A flattening yield curve suggests:", "Long-term rates are declining relative to short-term rates", "All rates are rising equally", "Short-term rates are falling", "A", "Curve flattening: the spread between long and short yields narrows.", 2),
        ("The benchmark yield curve is important because:", "It serves as the basis for pricing all other fixed-income securities", "It only applies to government bonds", "It determines stock prices", "A", "Government yield curves are the foundation for pricing fixed-income assets.", 2),
    ]),
    8: ("Mortgage-Backed Securities", [
        ("A mortgage-backed security (MBS) is:", "A bond backed by a pool of residential or commercial mortgages", "An unsecured corporate bond", "A government bill", "A", "MBS derive cash flows from underlying mortgage loan payments.", 1),
        ("Prepayment risk in MBS refers to:", "Borrowers paying off mortgages early, reducing expected cash flows", "The risk of late payments", "Interest rate risk only", "A", "Prepayment risk: homeowners refinance or sell, returning principal early.", 2),
        ("Extension risk occurs when:", "Interest rates rise and prepayments slow, extending the MBS's life", "Interest rates fall", "Borrowers default", "A", "Rising rates → fewer refinancings → longer effective maturity for MBS.", 2),
        ("Contraction risk occurs when:", "Interest rates fall and prepayments increase, shortening the MBS's life", "Interest rates rise", "The pool defaults", "A", "Falling rates → more refinancings → shorter effective maturity for MBS.", 2),
        ("A pass-through MBS:", "Distributes mortgage payments to investors on a pro-rata basis", "Has separate tranches", "Is a derivative instrument", "A", "Pass-throughs give each investor a proportional share of all cash flows.", 2),
        ("A collateralized mortgage obligation (CMO) is created to:", "Redistribute prepayment risk among different tranches", "Eliminate all risk", "Increase prepayment risk", "A", "CMOs tranche MBS cash flows to meet different investor risk preferences.", 3),
        ("Sequential-pay CMO tranches receive principal:", "In a specific order, with the shortest tranche paid first", "All at the same time", "In reverse maturity order", "A", "Sequential: Tranche A gets all principal first, then B, then C, etc.", 2),
        ("A planned amortization class (PAC) tranche:", "Has more predictable cash flows within a specified prepayment range", "Bears all prepayment risk", "Has no support tranche", "A", "PAC tranches have priority; companion tranches absorb prepayment variability.", 3),
        ("A support (companion) tranche:", "Absorbs excess prepayment risk to protect PAC tranches", "Has the most stable cash flows", "Is the safest tranche", "A", "Companion tranches bear higher prepayment variability to stabilize PAC cash flows.", 3),
        ("The Public Securities Association (PSA) model:", "Provides a benchmark for mortgage prepayment speeds", "Sets mortgage interest rates", "Rates credit quality of MBS", "A", "PSA model: 100% PSA assumes prepayment rates increase linearly then plateau.", 3),
        ("Weighted average maturity (WAM) of an MBS pool:", "Is the weighted average of remaining maturities of underlying mortgages", "Is always 30 years", "Ignores prepayments", "A", "WAM reflects the time-weighted remaining term of the mortgage pool.", 2),
        ("Weighted average coupon (WAC) is:", "The weighted average interest rate of mortgages in the pool", "The MBS coupon paid to investors", "The servicing fee", "A", "WAC = weighted average of mortgage rates in the pool.", 2),
        ("Mortgage servicing involves:", "Collecting payments, managing escrow, and processing defaults", "Issuing new mortgages", "Trading MBS in the secondary market", "A", "Servicers handle day-to-day mortgage administration for a fee.", 2),
        ("Agency MBS carry:", "Implicit or explicit government guarantee against credit risk", "No credit protection", "Only corporate guarantee", "A", "Ginnie Mae (explicit), Fannie/Freddie (implicit/conservatorship) provide credit guarantees.", 2),
        ("Non-agency MBS:", "Do not have government credit guarantees", "Are always risk-free", "Can only be issued by banks", "A", "Private-label MBS rely on credit enhancements rather than government backing.", 2),
        ("A stripped MBS separates cash flows into:", "Interest-only (IO) and principal-only (PO) components", "Senior and junior tranches", "Fixed and floating portions", "A", "IO strips receive interest; PO strips receive principal payments.", 3),
        ("An IO strip increases in value when:", "Prepayments slow (higher rates)", "Prepayments accelerate", "Interest rates decrease", "A", "Slower prepayments mean IO receives interest payments for longer.", 3),
        ("A PO strip increases in value when:", "Prepayments accelerate (lower rates)", "Prepayments slow", "Interest rates increase", "A", "Faster prepayments return principal sooner, increasing PO's present value.", 3),
        ("Credit enhancement for non-agency MBS includes:", "Overcollateralization, subordination, and insurance", "Government guarantees only", "No enhancement is used", "A", "Private MBS use structural and external credit enhancements.", 2),
        ("The single monthly mortality (SMM) rate:", "Measures the percentage of the pool that prepays in a month", "Is the annual default rate", "Is the coupon rate divided by 12", "A", "SMM = fraction of outstanding principal that prepays each month.", 3),
    ]),
    9: ("Interest Rate Risk and Return", [
        ("Duration measures a bond's:", "Sensitivity of price to changes in yield", "Time to maturity", "Coupon rate", "A", "Duration = approximate percentage price change for a 1% yield change.", 2),
        ("Macaulay duration is:", "The weighted average time to receive a bond's cash flows", "The same as modified duration", "Always less than maturity", "A", "Macaulay duration weights cash flow timing by PV of each payment.", 2),
        ("Modified duration equals:", "Macaulay duration / (1 + yield per period)", "Macaulay duration × yield", "Price / Coupon", "A", "ModDur = MacDur / (1 + y/n), measuring price sensitivity.", 2),
        ("A bond with higher duration has:", "Greater price sensitivity to yield changes", "Lower price sensitivity", "Higher credit risk", "A", "Higher duration = larger price change for a given yield movement.", 2),
        ("Factors that increase duration include:", "Lower coupon rate, longer maturity, lower yield", "Higher coupon, shorter maturity", "Higher yield only", "A", "Lower coupons/yields and longer maturities increase duration.", 2),
        ("Convexity measures:", "The curvature of the price-yield relationship", "The linear price sensitivity", "The credit spread", "A", "Convexity captures how duration changes as yields change.", 3),
        ("Positive convexity means:", "Price increases more when yields fall than decreases when yields rise", "Price moves symmetrically", "Price doesn't change with yields", "A", "Positive convexity benefits the bondholder: gains > losses for equal yield moves.", 2),
        ("For a callable bond, effective convexity can be:", "Negative at low yields", "Always positive", "Zero", "A", "Callable bonds exhibit negative convexity when yields fall (price is capped by call).", 3),
        ("Effective duration is preferred for bonds with embedded options because:", "It accounts for how cash flows change with yield changes", "It's simpler to calculate", "It ignores optionality", "A", "Effective duration uses actual price changes from yield shifts, capturing option effects.", 3),
        ("The duration of a zero-coupon bond equals:", "Its maturity", "Zero", "Half its maturity", "A", "Zero-coupon bond: Macaulay duration = maturity (all cash flow at maturity).", 2),
        ("Key rate duration measures:", "Sensitivity to changes in specific maturity points on the yield curve", "Overall duration", "Credit risk sensitivity", "A", "Key rate duration isolates price sensitivity to specific tenor yield changes.", 3),
        ("Portfolio duration is:", "The weighted average of individual bond durations", "The duration of the longest bond", "The sum of all durations", "A", "Portfolio duration = Σ wi × Di, where wi = market value weights.", 2),
        ("Money duration is:", "Modified duration × Market value", "Duration / Price", "Duration × Par value", "A", "Money duration = dollar price change per unit yield change.", 2),
        ("The approximate percentage price change using duration is:", "-Duration × Change in yield", "Duration + Convexity", "Duration / Change in yield", "A", "%ΔP ≈ -D × Δy (first-order approximation).", 2),
        ("Including convexity improves the price estimate by:", "Adding a second-order correction to the duration estimate", "Replacing duration", "Eliminating all estimation error", "A", "%ΔP ≈ -D × Δy + 0.5 × C × (Δy)², improving accuracy for large yield changes.", 3),
        ("A barbell portfolio has:", "Concentrations at short and long maturities", "Concentrations at intermediate maturities", "Equal distribution across all maturities", "A", "Barbell: weights in short and long bonds, little in the middle.", 2),
        ("A bullet portfolio has:", "Concentrations at a single maturity point", "Weights at the extremes", "No bonds", "A", "Bullet: investments clustered around one target maturity.", 2),
        ("Immunization aims to:", "Protect a portfolio from interest rate risk by matching duration to the investment horizon", "Maximize returns", "Eliminate all risk", "A", "Immunization: set portfolio duration = liability duration.", 3),
        ("When yields change, the reinvestment effect and price effect:", "Partially offset each other", "Move in the same direction", "Are unrelated", "A", "Rising yields: price falls but reinvestment income rises (and vice versa).", 2),
        ("For a bond investor with a fixed horizon, the optimal strategy is:", "Match the portfolio duration to the investment horizon", "Buy the highest-yielding bond", "Buy the shortest-duration bond", "A", "Duration matching immunizes against interest rate changes over the horizon.", 3),
    ]),
    10: ("Credit Risk", [
        ("Credit risk is the risk that:", "A borrower fails to make promised payments", "Interest rates rise", "Inflation increases", "A", "Credit risk = default risk + loss severity risk.", 1),
        ("The probability of default (POD) measures:", "The likelihood that a borrower will fail to pay", "The recovery amount after default", "The credit spread", "A", "POD is the estimated probability of a credit event occurring.", 2),
        ("Loss given default (LGD) is:", "The percentage of exposure lost when default occurs", "The probability of default", "The total amount owed", "A", "LGD = 1 - Recovery rate.", 2),
        ("Expected loss equals:", "Probability of default × Loss given default × Exposure", "Credit spread × Duration", "Default rate × Interest rate", "A", "EL = PD × LGD × EAD.", 2),
        ("Credit ratings are assigned by:", "Independent rating agencies like Moody's, S&P, and Fitch", "Central banks", "The issuers themselves", "A", "Rating agencies provide independent assessments of creditworthiness.", 1),
        ("An upgrade in credit rating typically:", "Reduces the bond's yield spread", "Increases the yield spread", "Has no effect on price", "A", "Better credit → lower perceived risk → lower required yield.", 2),
        ("Credit migration risk is:", "The risk of a credit rating change", "The risk of default", "Interest rate risk", "A", "Migration risk: downgrades increase yields and reduce prices.", 2),
        ("Structural models of credit risk:", "Model default based on the firm's asset value falling below debt value", "Use only historical default rates", "Ignore firm value", "A", "Structural models (Merton): default occurs when assets < liabilities.", 3),
        ("Reduced-form models:", "Model default as a statistical process with a hazard rate", "Require knowledge of firm's balance sheet", "Are based on option pricing", "A", "Reduced-form: default is modeled statistically using hazard/intensity rates.", 3),
        ("A credit default swap (CDS):", "Transfers credit risk from the protection buyer to the seller", "Eliminates interest rate risk", "Is an equity derivative", "A", "CDS: buyer pays periodic premiums; seller pays if credit event occurs.", 3),
        ("High-yield bonds have:", "Higher credit risk and higher yields", "Lower credit risk", "Government guarantees", "A", "Below investment grade: higher default probability → higher yield.", 1),
        ("The recovery rate:", "Varies by seniority and collateral", "Is always 40%", "Is the same for all bonds", "A", "Secured senior debt typically recovers more than subordinated unsecured.", 2),
        ("Spread risk is:", "The risk that credit spreads widen, reducing bond prices", "Only related to government bonds", "The bid-ask spread risk", "A", "Credit spread widening → price decline for corporate bonds.", 2),
        ("Credit analysis includes:", "Evaluating capacity, collateral, covenants, and character", "Only reviewing financial statements", "Only checking the credit rating", "A", "The 4 C's of credit analysis provide a comprehensive assessment.", 2),
        ("Capacity in credit analysis refers to:", "The borrower's ability to make payments from cash flows", "The value of pledged assets", "The quality of management", "A", "Capacity = cash flow generation ability to service debt obligations.", 2),
        ("A credit event includes:", "Default, bankruptcy, or restructuring", "A credit upgrade", "An interest rate change", "A", "Credit events trigger CDS payments and are defined in credit documentation.", 2),
        ("The credit spread puzzle refers to:", "Corporate bond spreads being wider than expected from default losses alone", "Spreads always being too narrow", "Government bonds having credit risk", "A", "Actual spreads exceed what default probabilities alone justify.", 3),
        ("Cross-default provisions in bond covenants:", "Allow bondholders to accelerate payment if the issuer defaults on other obligations", "Prevent default on other bonds", "Are never included in covenants", "A", "Cross-default protects bondholders by triggering default across all obligations.", 2),
        ("Counter-party credit risk in derivatives:", "Is the risk that the other party fails to honor the contract", "Only applies to exchange-traded derivatives", "Is eliminated by collateral", "A", "OTC derivatives carry counterparty risk; exchanges mitigate this via clearing.", 2),
        ("Sovereign credit risk assessment considers:", "Economic strength, institutional framework, and fiscal position", "Only GDP growth", "Only political stability", "A", "Sovereign analysis integrates economic, institutional, fiscal, and external factors.", 2),
    ]),
}
FI_MODULES.update(_fi_6_10)


# ──────────────────────────────────────────────────────────────
# MODULE → FUNCTION MAPPING
# ──────────────────────────────────────────────────────────────

MODULE_GENERATORS = {
    1: ("QM-01", _qm01),     # Rates and Returns
    2: ("QM-02", _qm02),     # Time Value of Money
    3: ("QM-03", _qm03),     # Statistical Measures
    4: ("QM-04", _qm04),     # Probability
    5: ("QM-05", _qm05),     # Portfolio Mathematics
    6: ("QM-06", _qm06),     # Simulation Methods
    7: ("QM-07", _qm07),     # Estimation and Inference
    8: ("QM-08", _qm08),     # Hypothesis Testing
    9: ("QM-09", _qm09),     # Parametric and Non-Parametric
    10: ("QM-10", _qm10),    # Simple Linear Regression
    11: ("QM-11", _qm11),    # Big Data Techniques
    22: ("ETH-01", _eth01),   # Ethics and Trust
    23: ("ETH-02", _eth02),   # Code and Standards
    24: ("ETH-03", _eth03),   # Guidance for Standards
    25: ("ETH-04", _eth04),   # GIPS
    26: ("ETH-05", _eth05),   # Ethics Application
}

# Add FI modules
for fi_num, (title, concepts) in FI_MODULES.items():
    db_id = fi_num + 11  # FI-01 is module_id 12 in DB
    code = f"FI-{fi_num:02d}"
    MODULE_GENERATORS[db_id] = (code, lambda c=concepts: _generate_concept_questions("FI", "", c))


def expand_to_target(questions, target=100):
    """Expand a question list to target count by creating variations."""
    if len(questions) >= target:
        return questions[:target]

    expanded = list(questions)
    idx = 0
    difficulty_bumps = [
        ("Which of the following is most accurate? ", 1),
        ("An analyst is evaluating a scenario. ", 0),
        ("According to CFA curriculum, ", 0),
        ("In the context of CFA Level I, ", 0),
        ("A financial analyst needs to determine: ", 0),
    ]
    while len(expanded) < target:
        base = questions[idx % len(questions)]
        prefix, diff_adj = difficulty_bumps[len(expanded) % len(difficulty_bumps)]

        new_q = dict(base)
        new_q["stem"] = prefix + base["stem"][0].lower() + base["stem"][1:]
        new_q["difficulty"] = min(5, max(1, base["difficulty"] + diff_adj))

        # Shuffle answer choices randomly
        choices = [(base["a"], "A"), (base["b"], "B"), (base["c"], "C")]
        random.shuffle(choices)
        new_q["a"] = choices[0][0]
        new_q["b"] = choices[1][0]
        new_q["c"] = choices[2][0]
        # Find new correct answer
        for val, orig_letter in [(base["a"], "A"), (base["b"], "B"), (base["c"], "C")]:
            if orig_letter == base["correct"]:
                correct_text = val
                break
        for i, (text, _) in enumerate(choices):
            if text == correct_text:
                new_q["correct"] = ["A", "B", "C"][i]
                break

        expanded.append(new_q)
        idx += 1

    return expanded[:target]


def generate_sql():
    """Generate the full SQL INSERT script."""
    lines = []
    lines.append("-- CFA Level I Question Bank")
    lines.append("-- Auto-generated: 100 QBANK + 100 MOCK per module")
    lines.append("-- Total: {} modules".format(len(MODULE_GENERATORS)))
    lines.append("")
    lines.append("BEGIN;")
    lines.append("")

    total = 0
    for db_id in sorted(MODULE_GENERATORS.keys()):
        code, gen_fn = MODULE_GENERATORS[db_id]
        raw_questions = gen_fn()
        print(f"  {code}: {len(raw_questions)} raw questions")

        qbank = expand_to_target(raw_questions, 100)
        # For mock, shuffle differently
        random.seed(db_id * 7 + 13)
        mock_base = list(raw_questions)
        random.shuffle(mock_base)
        mock = expand_to_target(mock_base, 100)

        lines.append(f"-- {code}: {len(qbank)} QBANK + {len(mock)} MOCK")

        for qtype, qlist in [("qbank", qbank), ("mock", mock)]:
            for q in qlist:
                lines.append(
                    f"INSERT INTO questions (module_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty, question_type) "
                    f"VALUES ({db_id}, '{esc(q['stem'])}', '{esc(q['a'])}', '{esc(q['b'])}', '{esc(q['c'])}', "
                    f"'{q['correct']}', '{esc(q['explanation'])}', {q['difficulty']}, '{qtype}');"
                )
                total += 1

        lines.append("")

    lines.append("COMMIT;")
    lines.append(f"-- Total questions inserted: {total}")
    print(f"\nTotal: {total} questions generated")
    return "\n".join(lines)


if __name__ == "__main__":
    sql = generate_sql()
    with open("questions_seed.sql", "w", encoding="utf-8") as f:
        f.write(sql)
    print("Written to questions_seed.sql")
