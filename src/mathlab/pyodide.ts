// Cliente Pyodide (Python real en el navegador) para la demo MathLab.
// Carga diferida: el runtime (~10 MB) + sympy se descargan al primer "Resolver".
// Fuente: https://pyodide.org/en/stable/usage/quickstart.html
const PYODIDE_CDN = "https://cdn.jsdelivr.net/pyodide/v314.0.8/full/pyodide.js"

export interface SolveResult {
  kind: "lineal" | "cuadratica" | "constante"
  steps: string[]
  solutions: number[]
  points: { x: number; y: number }[]
  note: string | null
}

interface PyodideApi {
  runPythonAsync(code: string): Promise<unknown>
  loadPackage(names: string | string[]): Promise<void>
}

declare global {
  interface Window {
    loadPyodide?: (options?: Record<string, unknown>) => Promise<PyodideApi>
  }
}

// OJO: dentro de un template literal de TS hay que duplicar las barras
// invertidas del regex de Python (si no, `\d` llegaría como `d`).
const BOOTSTRAP = `
import json, re
from sympy import symbols, sympify, Poly, N

_X = symbols("x")

def _num(f):
    f = float(f)
    if abs(f - round(f)) < 1e-9:
        s = str(int(round(f)))
    else:
        s = f"{f:.4f}".rstrip("0").rstrip(".")
    if s in ("-0", ""):
        return "0"
    return f"\\u2212{s[1:]}" if s.startswith("-") else s

def _join(terms):
    parts = []
    for coef, var in terms:
        if abs(coef) < 1e-12:
            continue
        mag = abs(coef)
        if var and abs(mag - 1) < 1e-12:
            body = var
        elif var:
            body = f"{_num(mag)}{var}"
        else:
            body = _num(mag)
        if not parts:
            parts.append(f"\\u2212{body}" if coef < 0 else body)
        else:
            parts.append(f"{' + ' if coef > 0 else ' \\u2212 '}{body}")
    return "".join(parts) if parts else "0"

def _samples(f, xmin, xmax, n=121):
    return [[xmin + (xmax - xmin) * i / (n - 1), f(xmin + (xmax - xmin) * i / (n - 1))] for i in range(n)]

def solve_equation(raw):
    try:
        return _solve(raw)
    except ValueError as e:
        return json.dumps({"error": str(e)})
    except Exception:
        return json.dumps({"error": "No pude interpretar la ecuaci\\u00f3n. Ejemplos: 2x+3=11, x^2-5x+6=0."})

def _solve(raw):
    s = (raw or "").strip().lower().replace(" ", "").replace("^", "**").replace("\\u00b2", "**2").replace("\\u2212", "-")
    if not s:
        raise ValueError("Escribe una ecuaci\\u00f3n, por ejemplo 2x+3=11.")
    if "=" not in s:
        raise ValueError("Falta el signo igual. Ejemplo: 2x+3=11.")
    left, right = s.split("=", 1)
    if not left or not right:
        raise ValueError("La ecuaci\\u00f3n est\\u00e1 incompleta. Ejemplo: 2x+3=11.")
    s = re.sub(r"(\\d|\\))(?=[x\\(])", r"\\1*", f"({left})-({right})")
    try:
        expr = sympify(s)
    except Exception:
        raise ValueError("No pude interpretar la ecuaci\\u00f3n. Ejemplos: 2x+3=11, x^2-5x+6=0.")
    if expr.free_symbols - {_X}:
        raise ValueError("Solo uso la variable x. Ejemplo: 2x+3=11.")
    if _X not in expr.free_symbols:
        val = float(N(expr))
        if abs(val) < 1e-9:
            return json.dumps({"kind": "constante", "steps": [f"{left} = {right} se cumple para cualquier valor de x (identidad)."], "solutions": [], "points": [], "note": "Identidad: infinitas soluciones."})
        return json.dumps({"kind": "constante", "steps": [f"{left} = {right} nunca se cumple (contradicci\\u00f3n)."], "solutions": [], "points": [], "note": "Sin soluci\\u00f3n."})
    try:
        poly = Poly(expr, _X)
    except Exception:
        raise ValueError("Solo resuelvo polinomios en x. Ejemplos: 2x+3=11, x^2-5x+6=0.")
    deg = int(poly.degree())
    if deg == 1:
        a, b = (float(N(c)) for c in poly.all_coeffs())
        sol = -b / a
        steps = [f"Forma est\\u00e1ndar: {_join([(a, 'x'), (b, '')])} = 0"]
        if abs(a - 1) > 1e-12:
            steps.append(f"Despeja x: {_join([(a, 'x')])} = {_num(-b)}")
            steps.append(f"Divide entre {_num(a)}: x = {_num(sol)}")
        else:
            steps.append(f"x = {_num(sol)}")
        half = max(3.0, abs(sol) * 0.75 + 1.0)
        pts = _samples(lambda t: a * t + b, sol - half, sol + half)
        return json.dumps({"kind": "lineal", "steps": steps, "solutions": [sol], "points": pts, "note": None})
    if deg == 2:
        a, b, c = (float(N(c)) for c in poly.all_coeffs())
        d = b * b - 4 * a * c
        steps = [
            f"Forma est\\u00e1ndar: {_join([(a, 'x\\u00b2'), (b, 'x'), (c, '')])} = 0",
            f"Coeficientes: a = {_num(a)}, b = {_num(b)}, c = {_num(c)}",
            f"Discriminante: D = b\\u00b2 \\u2212 4ac = {_num(d)}",
        ]
        if d > 1e-12:
            r = d ** 0.5
            s1, s2 = (-b - r) / (2 * a), (-b + r) / (2 * a)
            steps.append(f"x = (\\u2212b \\u00b1 \\u221aD) / 2a = ({_num(-b)} \\u00b1 {_num(r)}) / {_num(2 * a)}")
            lo, hi = (s1, s2) if s1 <= s2 else (s2, s1)
            steps.append(f"Soluciones: x\\u2081 = {_num(lo)}, x\\u2082 = {_num(hi)}")
            sols = [lo, hi]
            pad = max(1.5, (hi - lo) * 0.6 + 0.5)
            xmin, xmax = lo - pad, hi + pad
        elif abs(d) <= 1e-12:
            s0 = -b / (2 * a)
            steps.append(f"Ra\\u00edz doble: x = \\u2212b / 2a = {_num(s0)}")
            sols = [s0]
            xmin, xmax = s0 - 4, s0 + 4
        else:
            steps.append("D < 0: sin soluciones reales (las ra\\u00edces son complejas).")
            sols = []
            v = -b / (2 * a)
            xmin, xmax = v - 5, v + 5
        pts = _samples(lambda t: a * t * t + b * t + c, xmin, xmax)
        return json.dumps({"kind": "cuadratica", "steps": steps, "solutions": sols, "points": pts, "note": None if sols else "Sin soluciones reales."})
    raise ValueError("Solo resuelvo ecuaciones lineales y cuadr\\u00e1ticas (grado \\u2264 2).")
`

let scriptPromise: Promise<void> | null = null
let readyPromise: Promise<PyodideApi> | null = null

function ensureScript(): Promise<void> {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return Promise.reject(new Error("Pyodide solo corre en el navegador."))
  }
  if (window.loadPyodide) return Promise.resolve()
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const el = document.createElement("script")
      el.src = PYODIDE_CDN
      el.async = true
      el.onload = () => resolve()
      el.onerror = () => {
        scriptPromise = null
        reject(new Error("No se pudo descargar Pyodide (revisa tu conexión)."))
      }
      document.head.appendChild(el)
    })
  }
  return scriptPromise
}

async function init(onPhase?: (label: string) => void): Promise<PyodideApi> {
  onPhase?.("Descargando Python (Pyodide)…")
  await ensureScript()
  if (!window.loadPyodide) throw new Error("Pyodide no se cargó correctamente.")
  onPhase?.("Iniciando Python…")
  const py = await window.loadPyodide()
  onPhase?.("Cargando SymPy…")
  await py.loadPackage("sympy")
  await py.runPythonAsync(BOOTSTRAP)
  return py
}

export function ensurePython(onPhase?: (label: string) => void): Promise<PyodideApi> {
  if (!readyPromise) {
    readyPromise = init(onPhase).catch((e: unknown) => {
      readyPromise = null
      throw e
    })
  }
  return readyPromise
}

interface RawResult {
  kind: SolveResult["kind"]
  steps: string[]
  solutions: number[]
  points: [number, number][]
  note: string | null
  error?: string
}

export async function solveEquation(raw: string): Promise<SolveResult> {
  const py = await ensurePython()
  const out = (await py.runPythonAsync(`solve_equation(${JSON.stringify(raw)})`)) as string
  const data = JSON.parse(out) as RawResult
  if (typeof data.error === "string") throw new Error(data.error)
  return {
    kind: data.kind,
    steps: data.steps,
    solutions: data.solutions,
    points: data.points.map(([x, y]) => ({ x, y })),
    note: data.note,
  }
}
