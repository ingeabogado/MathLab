// MathLab: solucionador de ecuaciones con Python real (Pyodide + SymPy) en el navegador.
import { useState, type FormEvent } from "react"
import { FunctionPlot } from "./FunctionPlot"
import { ensurePython, solveEquation, type SolveResult } from "./pyodide"

const EXAMPLES = ["2x+3=11", "x^2-5x+6=0", "x^2+1=0"]

const KIND_LABEL: Record<SolveResult["kind"], string> = {
  lineal: "Ecuación lineal",
  cuadratica: "Ecuación cuadrática",
  constante: "Sin variable",
}

export function MathLab() {
  const [input, setInput] = useState(EXAMPLES[0])
  const [phase, setPhase] = useState<string | null>(null)
  const [solving, setSolving] = useState(false)
  const [result, setResult] = useState<SolveResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const busy = phase !== null || solving

  const run = async (eq: string) => {
    const equation = eq.trim()
    if (!equation || busy) return
    setError(null)
    try {
      setPhase("Preparando Python…")
      await ensurePython((label) => setPhase(label))
      setPhase(null)
      setSolving(true)
      setResult(await solveEquation(equation))
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo resolver.")
    } finally {
      setPhase(null)
      setSolving(false)
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    void run(input)
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <a
          href="https://www.ingeabogado.com/dev/proyectos/mathlab"
          className="text-sm text-muted-foreground underline underline-offset-4"
        >
          ← Ver en ingeabogado.com
        </a>
        <h1 className="text-3xl md:text-5xl font-bold mt-2 mb-2" style={{ color: "var(--module-dev)" }}>
          MathLab
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Solucionador de ecuaciones lineales y cuadráticas: escribe una ecuación y obtén los pasos,
          las soluciones y la gráfica, calculados con Python de verdad en tu navegador.
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Python · Pyodide · SymPy ·{" "}
          <a href="https://github.com/ingeabogado/MathLab" className="underline underline-offset-4">
            Repositorio en GitHub
          </a>{" "}
          · Desarrollado por José Andrés Dávila L. 2026. Licencia libre.
        </p>
      </div>

      <form onSubmit={onSubmit} className="glass rounded-2xl p-4 md:p-5 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <label htmlFor="mathlab-eq" className="sr-only">
            Ecuación
          </label>
          <input
            id="mathlab-eq"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="2x+3=11"
            autoComplete="off"
            spellCheck={false}
            className="flex-1 rounded-xl min-h-[44px] px-4 text-base text-foreground touch-manipulation"
            style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}
          />
          <button
            type="submit"
            disabled={busy || input.trim() === ""}
            className="rounded-xl min-h-[44px] px-6 text-sm font-bold touch-manipulation disabled:opacity-40"
            style={{ background: "var(--module-dev)", color: "#fff" }}
          >
            {phase ?? (solving ? "Resolviendo…" : "Resolver")}
          </button>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-muted-foreground">Prueba con:</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              disabled={busy}
              onClick={() => {
                setInput(ex)
                void run(ex)
              }}
              className="rounded-xl min-h-[44px] px-4 text-sm font-mono touch-manipulation disabled:opacity-40"
              style={{ background: "var(--glass-bg)", color: "var(--foreground)" }}
            >
              {ex}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Python se descarga la primera vez (~10 MB); después todo corre local, sin servidor.
        </p>
      </form>

      {error && (
        <div role="alert" className="glass rounded-2xl p-4 flex flex-col sm:flex-row gap-3 sm:items-center">
          <p className="text-sm text-foreground flex-1">{error}</p>
          <button
            type="button"
            onClick={() => void run(input)}
            disabled={busy}
            className="rounded-xl min-h-[44px] px-5 text-sm font-medium glass touch-manipulation disabled:opacity-40"
          >
            Reintentar
          </button>
        </div>
      )}

      {result && (
        <>
          <div className="glass rounded-2xl p-4 md:p-6">
            <p className="font-bold text-foreground mb-1">{KIND_LABEL[result.kind]}</p>
            {result.solutions.length > 0 && (
              <div className="flex flex-wrap gap-2 my-3">
                {result.solutions.map((s, i) => (
                  <span
                    key={i}
                    className="rounded-xl px-4 py-2 text-base font-bold"
                    style={{ background: "var(--module-dev)", color: "#fff" }}
                  >
                    x{result.solutions.length > 1 ? <sub>{i + 1}</sub> : null} ={" "}
                    {Math.abs(s - Math.round(s)) < 1e-9 ? Math.round(s) : Math.round(s * 10000) / 10000}
                  </span>
                ))}
              </div>
            )}
            {result.note && <p className="text-sm text-muted-foreground my-2">{result.note}</p>}
            <ol className="flex flex-col gap-2 mt-3">
              {result.steps.map((s, i) => (
                <li key={i} className="flex gap-3 text-sm text-foreground">
                  <span
                    className="shrink-0 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center"
                    style={{ background: "var(--glass-bg)", color: "var(--module-dev)" }}
                  >
                    {i + 1}
                  </span>
                  <span className="font-mono">{s}</span>
                </li>
              ))}
            </ol>
          </div>

          {result.points.length > 0 && (
            <div className="glass rounded-2xl p-4 md:p-6">
              <p className="font-bold text-foreground mb-3">Gráfica de y = f(x)</p>
              <FunctionPlot
                points={result.points}
                roots={result.solutions}
                label={`Gráfica de la función con ${result.solutions.length} raíces marcadas`}
              />
            </div>
          )}
        </>
      )}

      <p className="text-xs text-muted-foreground">
        Cómputo: Pyodide + SymPy en tu navegador · Demo educativa, verifica resultados importantes.
        Desarrollado por José Andrés Dávila L. 2026. Licencia libre.
      </p>
    </div>
  )
}
