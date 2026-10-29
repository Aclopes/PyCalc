#!/usr/bin/env python3
"""
PyCalc Engine - Core computational engine for Python calculator
Processes JSON commands via stdin, evaluates math/expressions/scripts securely,
and returns JSON output with precision metadata, AST breakdown, and error diagnostics.
"""

import sys
import json
import time
import io
import math
import cmath
import statistics
import decimal
from decimal import Decimal
import fractions
from fractions import Fraction
import itertools
import functools
import random
import ast

def get_math_namespace(deg_mode=False, custom_vars=None):
    ns = {
        'math': math,
        'cmath': cmath,
        'statistics': statistics,
        'decimal': decimal,
        'Decimal': Decimal,
        'fractions': fractions,
        'Fraction': Fraction,
        'itertools': itertools,
        'functools': functools,
        'random': random,
        # Common constants
        'pi': math.pi,
        'e': math.e,
        'tau': math.tau,
        'inf': math.inf,
        'nan': math.nan,
        # Math functions directly available
        'sqrt': math.sqrt,
        'cbrt': math.cbrt if hasattr(math, 'cbrt') else (lambda x: math.copysign(abs(x)**(1/3), x)),
        'exp': math.exp,
        'log': math.log,
        'ln': math.log,
        'log10': math.log10,
        'log2': math.log2,
        'factorial': math.factorial,
        'comb': math.comb,
        'perm': math.perm,
        'gcd': math.gcd,
        'lcm': math.lcm,
        'ceil': math.ceil,
        'floor': math.floor,
        'trunc': math.trunc,
        'abs': abs,
        'round': round,
        'pow': pow,
        'hypot': math.hypot,
        'mean': statistics.mean,
        'median': statistics.median,
        'mode': statistics.mode,
        'stdev': statistics.stdev,
        'variance': statistics.variance,
    }

    if deg_mode:
        # Trigonometric functions take degrees
        ns['sin'] = lambda x: math.sin(math.radians(x))
        ns['cos'] = lambda x: math.cos(math.radians(x))
        ns['tan'] = lambda x: math.tan(math.radians(x))
        ns['asin'] = lambda x: math.degrees(math.asin(x))
        ns['acos'] = lambda x: math.degrees(math.acos(x))
        ns['atan'] = lambda x: math.degrees(math.atan(x))
        ns['atan2'] = lambda y, x: math.degrees(math.atan2(y, x))
        ns['sinh'] = math.sinh
        ns['cosh'] = math.cosh
        ns['tanh'] = math.tanh
    else:
        ns['sin'] = math.sin
        ns['cos'] = math.cos
        ns['tan'] = math.tan
        ns['asin'] = math.asin
        ns['acos'] = math.acos
        ns['atan'] = math.atan
        ns['atan2'] = math.atan2
        ns['sinh'] = math.sinh
        ns['cosh'] = math.cosh
        ns['tanh'] = math.tanh

    ns['radians'] = math.radians
    ns['degrees'] = math.degrees

    # Custom variables injected from user session
    if custom_vars and isinstance(custom_vars, dict):
        for k, v in custom_vars.items():
            if k.isidentifier() and not k.startswith('__'):
                ns[k] = v

    return ns

def format_result(val):
    val_type = type(val).__name__
    res_str = repr(val)
    fraction_repr = None
    scientific_repr = None
    hex_repr = None
    bin_repr = None

    if isinstance(val, (int, float)) and not isinstance(val, bool):
        if isinstance(val, float):
            # Check for scientific representation
            scientific_repr = f"{val:e}"
            # Format float nicely
            if abs(val) < 1e-6 or abs(val) >= 1e12:
                res_str = f"{val:e}"
            else:
                res_str = f"{val:.10g}"
            # Rational approximation
            try:
                frac = Fraction(val).limit_denominator(100000)
                if frac.denominator != 1 and frac.denominator < 50000:
                    fraction_repr = f"{frac.numerator}/{frac.denominator}"
            except Exception:
                pass
        elif isinstance(val, int):
            res_str = str(val)
            hex_repr = hex(val)
            bin_repr = bin(val)
            if abs(val) >= 1000000:
                scientific_repr = f"{float(val):e}"
    elif isinstance(val, complex):
        res_str = f"{val.real:g} + {val.imag:g}j" if val.imag >= 0 else f"{val.real:g} - {abs(val.imag):g}j"
    elif isinstance(val, Fraction):
        fraction_repr = f"{val.numerator}/{val.denominator}"
        res_str = f"{val.numerator}/{val.denominator} ({float(val):.8g})"
        val_type = "Fraction"

    return {
        "formatted": res_str,
        "type": val_type,
        "raw": repr(val),
        "fraction": fraction_repr,
        "scientific": scientific_repr,
        "hex": hex_repr,
        "bin": bin_repr,
    }

def analyze_ast(code_str):
    """Generates an intuitive structural summary of the mathematical expression."""
    try:
        tree = ast.parse(code_str, mode='eval')
        def describe_node(node):
            if isinstance(node, ast.BinOp):
                op_names = {
                    ast.Add: "Addition",
                    ast.Sub: "Subtraction",
                    ast.Mult: "Multiplication",
                    ast.Div: "Division",
                    ast.FloorDiv: "Integer division",
                    ast.Mod: "Modulo remainder",
                    ast.Pow: "Exponentiation (power)",
                    ast.BitOr: "Bitwise OR",
                    ast.BitXor: "Bitwise XOR",
                    ast.BitAnd: "Bitwise AND",
                    ast.LShift: "Left shift",
                    ast.RShift: "Right shift",
                }
                op = op_names.get(type(node.op), "Binary operation")
                return f"{op} of ({describe_node(node.left)}) and ({describe_node(node.right)})"
            elif isinstance(node, ast.UnaryOp):
                op_names = {
                    ast.USub: "Negative negation",
                    ast.UAdd: "Positive sign",
                    ast.Not: "Logical NOT",
                    ast.Invert: "Bitwise NOT",
                }
                op = op_names.get(type(node.op), "Unary operation")
                return f"{op} ({describe_node(node.operand)})"
            elif isinstance(node, ast.Call):
                func_name = ast.unparse(node.func) if hasattr(ast, 'unparse') else 'function'
                args_desc = ", ".join(describe_node(arg) for arg in node.args)
                return f"Call {func_name}({args_desc})"
            elif isinstance(node, ast.Constant):
                return str(node.value)
            elif isinstance(node, ast.Name):
                return node.id
            return "expression"

        return describe_node(tree.body)
    except Exception:
        return None

def handle_eval(payload):
    code = payload.get("code", "").strip()
    deg_mode = bool(payload.get("degMode", False))
    vars_in = payload.get("variables", {})

    if not code:
        return {"success": False, "error": "Empty expression provided."}

    t0 = time.perf_counter()
    ns = get_math_namespace(deg_mode=deg_mode, custom_vars=vars_in)

    # Clean code: if user assigned `x = 5`, handle assignments
    if '=' in code and not any(op in code for op in ['==', '<=', '>=', '!=']):
        try:
            old_stdout = sys.stdout
            redirected = io.StringIO()
            sys.stdout = redirected
            exec(code, ns)
            sys.stdout = old_stdout
            stdout_str = redirected.getvalue()

            # Find what was assigned
            parts = code.split('=', 1)
            var_name = parts[0].strip()
            new_vars = {}
            assigned_val = None
            if var_name.isidentifier() and var_name in ns:
                assigned_val = ns[var_name]
                new_vars[var_name] = repr(assigned_val)

            elapsed_ms = (time.perf_counter() - t0) * 1000
            fmt = format_result(assigned_val if assigned_val is not None else "OK")

            return {
                "success": True,
                "result": fmt["formatted"],
                "details": fmt,
                "stdout": stdout_str,
                "executionTimeMs": round(elapsed_ms, 3),
                "explanation": f"Assigned {var_name} = {fmt['formatted']}",
                "updatedVariables": new_vars,
            }
        except Exception as e:
            elapsed_ms = (time.perf_counter() - t0) * 1000
            return {
                "success": False,
                "error": f"{type(e).__name__}: {str(e)}",
                "executionTimeMs": round(elapsed_ms, 3),
            }

    # Standard expression evaluation
    try:
        val = eval(code, ns)
        elapsed_ms = (time.perf_counter() - t0) * 1000
        fmt = format_result(val)
        explanation = analyze_ast(code)

        # Update 'ans' variable
        updated_vars = {"ans": val if isinstance(val, (int, float, str, bool)) else repr(val)}

        return {
            "success": True,
            "result": fmt["formatted"],
            "details": fmt,
            "executionTimeMs": round(elapsed_ms, 3),
            "explanation": explanation,
            "updatedVariables": updated_vars,
        }
    except Exception as e:
        elapsed_ms = (time.perf_counter() - t0) * 1000
        error_name = type(e).__name__
        msg = str(e)
        hint = ""
        if error_name == "ZeroDivisionError":
            hint = "Division by zero is undefined."
        elif error_name == "ValueError" and "math domain error" in msg:
            hint = "Value outside the mathematical function's valid domain (e.g. sqrt(-1) or log(0))."
        elif error_name == "NameError":
            hint = f"Unknown symbol or variable in expression. Check spelling or define variable first."
        elif error_name == "SyntaxError":
            hint = "Invalid Python syntax. Ensure balanced parentheses and valid operators."

        return {
            "success": False,
            "error": f"{error_name}: {msg}",
            "hint": hint,
            "executionTimeMs": round(elapsed_ms, 3),
        }

def handle_run(payload):
    code = payload.get("code", "").strip()
    deg_mode = bool(payload.get("degMode", False))
    vars_in = payload.get("variables", {})

    if not code:
        return {"success": False, "error": "No Python code provided."}

    t0 = time.perf_counter()
    ns = get_math_namespace(deg_mode=deg_mode, custom_vars=vars_in)

    old_stdout = sys.stdout
    old_stderr = sys.stderr
    redirected_out = io.StringIO()
    redirected_err = io.StringIO()
    sys.stdout = redirected_out
    sys.stderr = redirected_err

    last_res_fmt = None
    try:
        # Check if last line/statement is an expression we can evaluate to display its value
        parsed = ast.parse(code)
        last_expr_val = None
        if parsed.body and isinstance(parsed.body[-1], ast.Expr):
            # Split off the last expression so we can eval it
            expr_ast = parsed.body.pop()
            mod_ast = ast.Module(body=parsed.body, type_ignores=[])
            code_exec = compile(mod_ast, filename="<calc_session>", mode="exec")
            exec(code_exec, ns)

            expr_code = compile(ast.Expression(body=expr_ast.value), filename="<calc_session>", mode="eval")
            last_expr_val = eval(expr_code, ns)
        else:
            exec(code, ns)

        sys.stdout = old_stdout
        sys.stderr = old_stderr

        stdout_str = redirected_out.getvalue()
        stderr_str = redirected_err.getvalue()

        if last_expr_val is not None:
            last_res_fmt = format_result(last_expr_val)
            ns['ans'] = last_expr_val

        # Collect session variables created by the user (ignore builtins and pre-imported modules)
        saved_vars = {}
        for k, v in ns.items():
            if not k.startswith('_') and k not in [
                'math', 'cmath', 'statistics', 'decimal', 'Decimal', 'fractions', 'Fraction',
                'itertools', 'functools', 'random', 'pi', 'e', 'tau', 'inf', 'nan',
                'sqrt', 'cbrt', 'exp', 'log', 'ln', 'log10', 'log2', 'factorial', 'comb', 'perm',
                'gcd', 'lcm', 'ceil', 'floor', 'trunc', 'abs', 'round', 'pow', 'hypot',
                'mean', 'median', 'mode', 'stdev', 'variance', 'sin', 'cos', 'tan',
                'asin', 'acos', 'atan', 'atan2', 'sinh', 'cosh', 'tanh', 'radians', 'degrees'
            ]:
                try:
                    if isinstance(v, (int, float, str, bool, list, dict, set, tuple)):
                        saved_vars[k] = {"type": type(v).__name__, "value": repr(v)}
                    else:
                        saved_vars[k] = {"type": type(v).__name__, "value": str(v)}
                except Exception:
                    pass

        elapsed_ms = (time.perf_counter() - t0) * 1000
        return {
            "success": True,
            "stdout": stdout_str,
            "stderr": stderr_str,
            "lastResult": last_res_fmt,
            "variables": saved_vars,
            "executionTimeMs": round(elapsed_ms, 3),
        }
    except Exception as e:
        sys.stdout = old_stdout
        sys.stderr = old_stderr
        elapsed_ms = (time.perf_counter() - t0) * 1000
        return {
            "success": False,
            "error": f"{type(e).__name__}: {str(e)}",
            "stdout": redirected_out.getvalue(),
            "stderr": redirected_err.getvalue(),
            "executionTimeMs": round(elapsed_ms, 3),
        }

def handle_plot(payload):
    formula = payload.get("formula", "math.sin(x)").strip()
    x_min = float(payload.get("xMin", -10))
    x_max = float(payload.get("xMax", 10))
    samples = int(payload.get("samples", 200))
    samples = max(20, min(1000, samples))

    if x_min >= x_max:
        return {"success": False, "error": "xMin must be strictly less than xMax"}

    t0 = time.perf_counter()
    ns = get_math_namespace(deg_mode=False)

    # Compile expression once for speed
    try:
        expr_code = compile(formula, filename="<plot>", mode="eval")
    except Exception as e:
        return {"success": False, "error": f"Invalid formula syntax: {str(e)}"}

    step = (x_max - x_min) / (samples - 1)
    points = []
    y_min = float('inf')
    y_max = float('-inf')
    roots = []

    prev_y = None
    prev_x = None

    for i in range(samples):
        x_val = x_min + i * step
        ns['x'] = x_val
        try:
            y_val = eval(expr_code, ns)
            if isinstance(y_val, complex):
                if abs(y_val.imag) < 1e-12:
                    y_val = y_val.real
                else:
                    points.append({"x": round(x_val, 4), "y": None, "valid": False})
                    continue

            if math.isnan(y_val) or math.isinf(y_val) or abs(y_val) > 1e12:
                points.append({"x": round(x_val, 4), "y": None, "valid": False})
            else:
                y_float = float(y_val)
                points.append({"x": round(x_val, 4), "y": round(y_float, 5), "valid": True})
                if y_float < y_min:
                    y_min = y_float
                if y_float > y_max:
                    y_max = y_float

                # Detect sign change for root
                if prev_y is not None and prev_x is not None:
                    if (prev_y < 0 and y_float > 0) or (prev_y > 0 and y_float < 0):
                        # Approximate linear interpolation root
                        approx_root = prev_x - prev_y * (x_val - prev_x) / (y_float - prev_y)
                        roots.append(round(approx_root, 4))
                    elif abs(y_float) < 1e-9:
                        roots.append(round(x_val, 4))

                prev_y = y_float
                prev_x = x_val
        except Exception:
            points.append({"x": round(x_val, 4), "y": None, "valid": False})
            prev_y = None
            prev_x = None

    elapsed_ms = (time.perf_counter() - t0) * 1000

    if y_min == float('inf'):
        y_min = -1.0
        y_max = 1.0

    return {
        "success": True,
        "formula": formula,
        "xMin": x_min,
        "xMax": x_max,
        "yMin": round(y_min, 4),
        "yMax": round(y_max, 4),
        "points": points,
        "roots": roots[:8],
        "samples": len(points),
        "executionTimeMs": round(elapsed_ms, 3),
    }

def main():
    try:
        raw_input = sys.stdin.read()
        if not raw_input:
            print(json.dumps({"success": False, "error": "No input received"}))
            return

        payload = json.loads(raw_input)
        action = payload.get("action", "eval")

        if action == "eval":
            result = handle_eval(payload)
        elif action == "run":
            result = handle_run(payload)
        elif action == "plot":
            result = handle_plot(payload)
        else:
            result = {"success": False, "error": f"Unknown action: {action}"}

        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"success": False, "error": f"Internal Engine Error: {str(e)}"}))

if __name__ == '__main__':
    main()
