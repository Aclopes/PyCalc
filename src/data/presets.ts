import { FormulaPreset } from '../types/calculator';

export const FORMULA_PRESETS: FormulaPreset[] = [
  {
    id: 'quadratic',
    title: 'Quadratic Equation Solver',
    category: 'Algebra',
    mathNotation: 'a·x² + b·x + c = 0  →  x = (-b ± √(b² - 4ac)) / (2a)',
    description: 'Calculates the real or complex roots of any second-order polynomial equation.',
    defaultInputs: { a: 1, b: -5, c: 6 },
    pythonSnippet: `import cmath

a = 1
b = -5
c = 6

discriminant = b**2 - 4*a*c
root1 = (-b + cmath.sqrt(discriminant)) / (2*a)
root2 = (-b - cmath.sqrt(discriminant)) / (2*a)

print(f"Discriminant: {discriminant}")
print(f"Root 1: {root1.real if root1.imag == 0 else root1}")
print(f"Root 2: {root2.real if root2.imag == 0 else root2}")`,
  },
  {
    id: 'compound-interest',
    title: 'Compound Interest & Future Value',
    category: 'Finance',
    mathNotation: 'A = P · (1 + r/n)^(n·t)',
    description: 'Computes future investment amount where interest compounds n times per year.',
    defaultInputs: { P: 10000, r: 0.07, n: 12, t: 5 },
    pythonSnippet: `P = 10000    # Principal amount ($)
r = 0.07     # Annual interest rate (7%)
n = 12       # Compounding periods per year (Monthly)
t = 5        # Investment duration in years

future_val = P * (1 + r / n)**(n * t)
interest_earned = future_val - P

print(f"Future Value ($): {future_val:,.2f}")
print(f"Total Interest ($): {interest_earned:,.2f}")`,
  },
  {
    id: 'descriptive-stats',
    title: 'Descriptive Statistics Analyzer',
    category: 'Statistics',
    mathNotation: 'μ = (∑x)/N,  σ = √((∑(x - μ)²)/(N - 1))',
    description: 'Calculates mean, median, sample standard deviation, and variance on any dataset.',
    defaultInputs: { data: '12, 19, 24, 30, 35, 42, 58, 67, 85' },
    pythonSnippet: `import statistics

data = [12, 19, 24, 30, 35, 42, 58, 67, 85]

mean_val = statistics.mean(data)
median_val = statistics.median(data)
stdev_val = statistics.stdev(data)
variance_val = statistics.variance(data)

print(f"Sample Count (N): {len(data)}")
print(f"Arithmetic Mean:  {mean_val:.4f}")
print(f"Median:           {median_val}")
print(f"Std Deviation:    {stdev_val:.4f}")
print(f"Variance:         {variance_val:.4f}")`,
  },
  {
    id: 'hypotenuse-polar',
    title: 'Right Triangle & Polar Conversion',
    category: 'Trigonometry',
    mathNotation: 'r = √(x² + y²),  θ = atan2(y, x)',
    description: 'Converts Cartesian (x, y) coordinates to Polar radius and angle in degrees.',
    defaultInputs: { x: 3, y: 4 },
    pythonSnippet: `import math

x = 3.0
y = 4.0

r = math.hypot(x, y)
theta_rad = math.atan2(y, x)
theta_deg = math.degrees(theta_rad)

print(f"Hypotenuse / Radius (r): {r:.4f}")
print(f"Angle θ in radians:      {theta_rad:.4f} rad")
print(f"Angle θ in degrees:      {theta_deg:.2f}°")`,
  },
  {
    id: 'prime-factors',
    title: 'Prime Factorization & Divisors',
    category: 'Algebra',
    mathNotation: 'n = p₁^a · p₂^b · ... · pₖ^k',
    description: 'Decomposes any positive integer into its fundamental prime factors.',
    defaultInputs: { n: 13860 },
    pythonSnippet: `def prime_factors(n):
    factors = {}
    d = 2
    temp = n
    while d * d <= temp:
        while temp % d == 0:
            factors[d] = factors.get(d, 0) + 1
            temp //= d
        d += 1
    if temp > 1:
        factors[temp] = factors.get(temp, 0) + 1
    return factors

n = 13860
result = prime_factors(n)
canonical = " × ".join([f"{p}^{e}" if e > 1 else str(p) for p, e in result.items()])
print(f"Number: {n}")
print(f"Prime Decomposition: {canonical}")`,
  },
  {
    id: 'projectile-motion',
    title: 'Kinematics: Projectile Trajectory',
    category: 'Physics',
    mathNotation: 'R = (v₀² · sin(2θ)) / g,  H = (v₀² · sin²(θ)) / (2g)',
    description: 'Calculates range, peak height, and flight time for ideal ballistics.',
    defaultInputs: { v0: 25, angle_deg: 45, g: 9.80665 },
    pythonSnippet: `import math

v0 = 25.0       # Initial velocity in m/s
angle_deg = 45.0 # Launch angle in degrees
g = 9.80665     # Acceleration due to gravity in m/s²

theta = math.radians(angle_deg)
time_flight = 2 * v0 * math.sin(theta) / g
max_height = (v0**2 * math.sin(theta)**2) / (2 * g)
max_range = (v0**2 * math.sin(2 * theta)) / g

print(f"Total Flight Time: {time_flight:.3f} s")
print(f"Maximum Height:    {max_height:.3f} m")
print(f"Total Range:       {max_range:.3f} m")`,
  },
];
