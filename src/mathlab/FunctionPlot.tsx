// Gráfica cartesiana SVG para y=f(x) con raíces marcadas. Sin dependencias.
import { useId, useMemo, useState, type PointerEvent } from "react"

const W = 720
const PAD = { l: 8, r: 8, t: 12, b: 28 }

interface Props {
  points: { x: number; y: number }[]
  roots: number[]
  height?: number
  label: string
}

function fmtN(v: number): string {
  if (Math.abs(v) < 1e-9) return "0"
  const r = Math.round(v * 100) / 100
  return String(r)
}

export function FunctionPlot({ points, roots, height = 260, label }: Props) {
  const rawId = useId()
  const gid = useMemo(() => rawId.replace(/[^a-zA-Z0-9]/g, ""), [rawId])
  const [hover, setHover] = useState<number | null>(null)

  const model = useMemo(() => {
    if (points.length === 0) return null
    const xs = points.map((p) => p.x)
    const ys = points.map((p) => p.y)
    let xmin = Math.min(...xs)
    let xmax = Math.max(...xs)
    let ymin = Math.min(...ys)
    let ymax = Math.max(...ys)
    const padx = (xmax - xmin || 1) * 0.06
    const pady = (ymax - ymin || 1) * 0.12
    xmin -= padx
    xmax += padx
    ymin -= pady
    ymax += pady
    const iw = W - PAD.l - PAD.r
    const ih = height - PAD.t - PAD.b
    const sx = (v: number) => PAD.l + ((v - xmin) / (xmax - xmin)) * iw
    const sy = (v: number) => PAD.t + (1 - (v - ymin) / (ymax - ymin)) * ih
    const pts = points.map((p) => ({ x: sx(p.x), y: sy(p.y) }))
    const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")
    return { pts, line, xmin, xmax, ymin, ymax, sx, sy }
  }, [points, height])

  if (!model) {
    return (
      <div
        role="img"
        aria-label={label}
        className="w-full flex items-center justify-center text-sm text-muted-foreground"
        style={{ height }}
      >
        Sin datos para graficar.
      </div>
    )
  }

  const n = points.length
  const y0 = model.sy(Math.max(model.ymin, Math.min(model.ymax, 0)))
  const x0 = model.sx(Math.max(model.xmin, Math.min(model.xmax, 0)))
  const showXAxis = model.ymin <= 0 && model.ymax >= 0
  const showYAxis = model.xmin <= 0 && model.xmax >= 0
  const midY = (model.ymin + model.ymax) / 2

  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    if (rect.width === 0) return
    const ratio = (e.clientX - rect.left) / rect.width
    const px = ratio * W - PAD.l
    const iw = W - PAD.l - PAD.r
    const i = Math.round((px / iw) * (n - 1))
    setHover(Math.max(0, Math.min(n - 1, i)))
  }

  const hp = hover !== null ? model.pts[hover] : null

  return (
    <div className="relative" role="img" aria-label={label}>
      <svg
        viewBox={`0 0 ${W} ${height}`}
        className="w-full touch-manipulation"
        style={{ height }}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={`ag-${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--module-dev)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--module-dev)" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[model.ymax, midY, model.ymin].map((v) => (
          <g key={v}>
            <line x1={PAD.l} x2={W - PAD.r} y1={model.sy(v)} y2={model.sy(v)} stroke="var(--glass-border)" strokeWidth="1" />
            <text x={W - PAD.r} y={model.sy(v) - 4} textAnchor="end" fontSize="11" fill="var(--muted-foreground)">
              {fmtN(v)}
            </text>
          </g>
        ))}
        {showXAxis && (
          <line x1={PAD.l} x2={W - PAD.r} y1={y0} y2={y0} stroke="var(--foreground)" strokeOpacity="0.55" strokeWidth="1.5" />
        )}
        {showYAxis && (
          <line x1={x0} x2={x0} y1={PAD.t} y2={height - PAD.b} stroke="var(--foreground)" strokeOpacity="0.55" strokeWidth="1.5" />
        )}
        <path
          d={model.line}
          fill="none"
          stroke="var(--module-dev)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {roots.map((r) => (
          <g key={r}>
            <line
              x1={model.sx(r)}
              x2={model.sx(r)}
              y1={PAD.t}
              y2={height - PAD.b}
              stroke="var(--foreground)"
              strokeOpacity="0.35"
              strokeDasharray="3 3"
            />
            <circle cx={model.sx(r)} cy={y0} r="5" fill="var(--module-dev)" stroke="var(--background)" strokeWidth="2" />
          </g>
        ))}
        {hp !== null && (
          <g>
            <line
              x1={hp.x}
              x2={hp.x}
              y1={PAD.t}
              y2={height - PAD.b}
              stroke="var(--foreground)"
              strokeOpacity="0.4"
              strokeDasharray="3 3"
            />
            <circle cx={hp.x} cy={hp.y} r="4.5" fill="var(--module-dev)" stroke="var(--background)" strokeWidth="2" />
          </g>
        )}
        {[model.xmin, (model.xmin + model.xmax) / 2, model.xmax].map((v, i) => (
          <text
            key={i}
            x={i === 0 ? PAD.l : i === 1 ? W / 2 : W - PAD.r}
            y={height - 8}
            textAnchor={i === 0 ? "start" : i === 1 ? "middle" : "end"}
            fontSize="11"
            fill="var(--muted-foreground)"
          >
            {fmtN(v)}
          </text>
        ))}
      </svg>
      {hp !== null && hover !== null && (
        <div
          className="absolute top-0 pointer-events-none glass rounded-lg px-3 py-1.5 text-xs whitespace-nowrap"
          style={{ left: `${Math.min(78, Math.max(8, (hp.x / W) * 100))}%`, transform: "translateX(-50%)" }}
        >
          <span className="text-muted-foreground">x = {fmtN(points[hover].x)}</span>{" "}
          <span className="font-bold text-foreground">y = {fmtN(points[hover].y)}</span>
        </div>
      )}
    </div>
  )
}
